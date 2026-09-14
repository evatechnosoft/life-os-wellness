package com.evaitec.wellness

import android.Manifest
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.SystemClock
import android.util.Log
import androidx.core.content.ContextCompat
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.annotation.Permission
import com.getcapacitor.annotation.PermissionCallback
import com.google.android.gms.location.ActivityRecognition
import com.google.android.gms.location.ActivityTransition
import com.google.android.gms.location.ActivityTransitionRequest
import com.google.android.gms.location.ActivityTransitionResult
import com.google.android.gms.location.DetectedActivity
import org.json.JSONArray
import org.json.JSONObject

/**
 * Telefonun kendi bildigi hareket durumu: yurume, kosu, bisiklet, aracta,
 * hareketsiz. Yalniz bu bes sinif - cepteki telefon bench/squat ayirt edemez,
 * tekrar sayamaz (docs/SENSORS-FEASIBILITY.md, bolum 4).
 *
 * Neden Play Services bagimliligi: Transition API'nin alternatifi ham
 * ivmeolcerden kendi siniflandiricimizi yazmak olurdu - hem cok daha buyuk
 * bakim yuzeyi hem de surekli sensor dinlemek demek. Bilincli secim
 * (AGENTS.md, Sinirlar).
 *
 * PIL: Transition API olay-tabanlidir. Gecisleri sistem tespit eder ve bize
 * broadcast atar; surekli dinleyen bir foreground service YOK. SleepService'in
 * duty-cycle maliyetini burada tekrarlamiyoruz cunku gerek yok.
 */
@CapacitorPlugin(
    name = "Activity",
    permissions = [
        Permission(alias = ActivityPlugin.ALIAS, strings = ["android.permission.ACTIVITY_RECOGNITION"]),
    ],
)
class ActivityPlugin : Plugin() {

    companion object {
        const val ALIAS = "activityRecognition"

        /** Izlenen bes sinif; digerleri (UNKNOWN, ON_FOOT, TILTING) gurultu. */
        private val TRACKED = mapOf(
            DetectedActivity.WALKING to "walking",
            DetectedActivity.RUNNING to "running",
            DetectedActivity.ON_BICYCLE to "cycling",
            DetectedActivity.IN_VEHICLE to "in_vehicle",
            DetectedActivity.STILL to "still",
        )

        fun typeName(activityType: Int): String? = TRACKED[activityType]

        private fun pendingIntent(context: Context): PendingIntent {
            val intent = Intent(context, ActivityTransitionReceiver::class.java)
            // MUTABLE sart: gecis sonucunu intent'e Play Services dolduruyor.
            val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_MUTABLE
            } else {
                PendingIntent.FLAG_UPDATE_CURRENT
            }
            return PendingIntent.getBroadcast(context, 0, intent, flags)
        }

        private fun request(): ActivityTransitionRequest {
            val transitions = TRACKED.keys.flatMap { type ->
                listOf(
                    ActivityTransition.ACTIVITY_TRANSITION_ENTER,
                    ActivityTransition.ACTIVITY_TRANSITION_EXIT,
                ).map {
                    ActivityTransition.Builder()
                        .setActivityType(type)
                        .setActivityTransition(it)
                        .build()
                }
            }
            return ActivityTransitionRequest(transitions)
        }
    }

    private fun granted(): Boolean =
        Build.VERSION.SDK_INT < Build.VERSION_CODES.Q ||
            ContextCompat.checkSelfPermission(context, Manifest.permission.ACTIVITY_RECOGNITION) ==
            PackageManager.PERMISSION_GRANTED

    @PluginMethod
    fun status(call: PluginCall) {
        call.resolve(
            JSObject()
                .put("granted", granted())
                .put("subscribed", ActivityStore.subscribed(context))
                .put("events", ActivityStore.read(context).size),
        )
    }

    /** Izin yoksa ister; verilmezse sessizce granted:false doner, hata atmaz. */
    @PluginMethod
    fun start(call: PluginCall) {
        if (!granted()) {
            requestPermissionForAlias(ALIAS, call, "permissionCallback")
            return
        }
        subscribeNow(call)
    }

    @PermissionCallback
    private fun permissionCallback(call: PluginCall) {
        if (!granted()) {
            call.resolve(JSObject().put("granted", false).put("subscribed", false))
            return
        }
        subscribeNow(call)
    }

    private fun subscribeNow(call: PluginCall) {
        try {
            ActivityRecognition.getClient(context)
                .requestActivityTransitionUpdates(request(), pendingIntent(context))
            ActivityStore.setSubscribed(context, true)
            call.resolve(JSObject().put("granted", true).put("subscribed", true))
        } catch (e: Exception) {
            // Play Services yoksa/eskiyse sessizce devre disi kal, hata gosterme.
            Log.w("ActivityPlugin", "transition updates unavailable", e)
            ActivityStore.setSubscribed(context, false)
            call.resolve(JSObject().put("granted", true).put("subscribed", false))
        }
    }

    @PluginMethod
    fun stop(call: PluginCall) {
        try {
            ActivityRecognition.getClient(context)
                .removeActivityTransitionUpdates(pendingIntent(context))
        } catch (e: Exception) {
            Log.w("ActivityPlugin", "removing transition updates failed", e)
        }
        ActivityStore.setSubscribed(context, false)
        call.resolve(JSObject().put("subscribed", false))
    }

    /**
     * Biriken olaylardan cikan araliklar. Tuketmez: JS ayni gunu tekrar
     * yazdiginda recordMetrics ayni id'yi ezer, yani idempotent.
     */
    @PluginMethod
    fun intervals(call: PluginCall) {
        val out = JSArray()
        for (interval in ActivityIntervals.fold(ActivityStore.read(context))) {
            val item = JSObject()
                .put("type", interval.type)
                .put("startMs", interval.startMs)
            interval.endMs?.let { item.put("endMs", it) }
            out.put(item)
        }
        call.resolve(JSObject().put("intervals", out))
    }
}

/** Gecis broadcast'i. Uygulama olu olsa da tetiklenir, o yuzden diske yazar. */
class ActivityTransitionReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (!ActivityTransitionResult.hasResult(intent)) return
        val result = ActivityTransitionResult.extractResult(intent) ?: return
        val now = System.currentTimeMillis()
        val bootMs = SystemClock.elapsedRealtimeNanos() / 1_000_000L
        val events = result.transitionEvents.mapNotNull { event ->
            val type = ActivityPlugin.typeName(event.activityType) ?: return@mapNotNull null
            // Olay acilistan gecen sure cinsinden gelir; duvar saatine cevir.
            val atMs = now - (bootMs - event.elapsedRealTimeNanos / 1_000_000L)
            ActivityIntervals.Event(
                type,
                event.transitionType == ActivityTransition.ACTIVITY_TRANSITION_ENTER,
                atMs,
            )
        }
        if (events.isNotEmpty()) ActivityStore.append(context, events)
    }
}

/**
 * Olaylarin diskteki hali. Bellekte tutulamaz: broadcast surec oldukten sonra
 * da gelir. SharedPreferences yeterli - gunde onlarca kayit.
 */
object ActivityStore {
    private const val PREFS = "activity_transitions"
    private const val KEY_EVENTS = "events"
    private const val KEY_SUBSCRIBED = "subscribed"

    /** Uc gunden eski olay hicbir raporu degistirmez. */
    private const val KEEP_MS = 3L * 24 * 60 * 60 * 1000

    private fun prefs(context: Context) =
        context.applicationContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    fun subscribed(context: Context): Boolean = prefs(context).getBoolean(KEY_SUBSCRIBED, false)

    fun setSubscribed(context: Context, value: Boolean) {
        prefs(context).edit().putBoolean(KEY_SUBSCRIBED, value).apply()
    }

    @Synchronized
    fun read(context: Context): List<ActivityIntervals.Event> {
        val raw = prefs(context).getString(KEY_EVENTS, null) ?: return emptyList()
        return try {
            val array = JSONArray(raw)
            (0 until array.length()).map { i ->
                val item = array.getJSONObject(i)
                ActivityIntervals.Event(item.getString("t"), item.getBoolean("e"), item.getLong("at"))
            }
        } catch (e: Exception) {
            Log.w("ActivityStore", "unreadable event log, dropping", e)
            emptyList()
        }
    }

    @Synchronized
    fun append(context: Context, events: List<ActivityIntervals.Event>) {
        val cutoff = System.currentTimeMillis() - KEEP_MS
        val kept = (read(context) + events).filter { it.atMs >= cutoff }
        val array = JSONArray()
        for (event in kept) {
            array.put(JSONObject().put("t", event.type).put("e", event.enter).put("at", event.atMs))
        }
        prefs(context).edit().putString(KEY_EVENTS, array.toString()).apply()
    }
}
