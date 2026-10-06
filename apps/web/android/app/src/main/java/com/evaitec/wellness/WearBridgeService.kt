package com.evaitec.wellness

import android.content.Context
import com.google.android.gms.wearable.DataEvent
import com.google.android.gms.wearable.DataEventBuffer
import com.google.android.gms.wearable.DataMapItem
import com.google.android.gms.wearable.WearableListenerService
import org.json.JSONArray
import org.json.JSONObject

/**
 * Saatten gelen olcumleri kuyruga alir. WebView uygulama kapaliyken yok, bu servis ise
 * her kosulda ayaga kalkiyor - kayit once diske yazilir, JS acilinca kuyrugu bosaltir
 * (WearBridgePlugin.drain).
 *
 * Yol/anahtar sozlesmesi saatte wear/src/main/java/com/evaitec/wellness/wear/WearMetrics.kt.
 *
 * Not: iki APK **ayni keystore ile** imzali degilse Data Layer hata vermeden susar.
 * Belirti "saat gonderdi, telefona hic gelmedi" olur; ikisi de ayni CI kosusunda uretiliyor.
 */
class WearBridgeService : WearableListenerService() {

    override fun onDataChanged(events: DataEventBuffer) {
        val incoming = events.mapNotNull { event ->
            if (event.type != DataEvent.TYPE_CHANGED) return@mapNotNull null
            val path = event.dataItem.uri.path ?: return@mapNotNull null
            val map = DataMapItem.fromDataItem(event.dataItem).dataMap
            when {
                path.startsWith(PATH_PREFIX) -> {
                    val date = map.getString(KEY_DATE) ?: return@mapNotNull null
                    val metrics = map.getString(KEY_METRICS) ?: return@mapNotNull null
                    JSONObject()
                        .put(KEY_DATE, date)
                        .put(KEY_METRICS, metrics)
                        .put(KEY_TS, map.getLong(KEY_TS))
                }
                // Seans seti: saatin JSON'u oldugu gibi, "kind":"set" ile ayrilir (watch.ts parseWatchSets).
                path.startsWith(PATH_SETS) -> {
                    val set = map.getString(KEY_SET) ?: return@mapNotNull null
                    runCatching { JSONObject(set) }.getOrNull()
                        ?.put(KEY_KIND, KIND_SET)
                        ?.put(KEY_TS, map.getLong(KEY_TS))
                }
                else -> null
            }
        }
        if (incoming.isNotEmpty()) enqueue(this, incoming)
    }

    companion object {
        const val PATH_PREFIX = "/wellness/metrics"
        const val PATH_SETS = "/wellness/sets"
        const val KEY_SET = "set"
        const val KEY_KIND = "kind"
        const val KIND_SET = "set"
        const val PATH_SUMMARY = "/wellness/summary"
        const val KEY_SUMMARY = "summary"
        const val KEY_DATE = "date"
        const val KEY_METRICS = "metrics"
        const val KEY_TS = "ts"

        private const val PREFS = "wear_bridge"
        private const val KEY_QUEUE = "queue"

        /** Kuyruk sinirsiz buyumesin: telefon uzun sure acilmazsa en yenileri tutulur. */
        private const val MAX_QUEUED = 200

        private fun prefs(context: Context) =
            context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

        @Synchronized
        private fun enqueue(context: Context, records: List<JSONObject>) {
            val queue = read(context)
            records.forEach { queue.put(it) }
            val trimmed = JSONArray()
            val from = (queue.length() - MAX_QUEUED).coerceAtLeast(0)
            for (i in from until queue.length()) trimmed.put(queue.get(i))
            prefs(context).edit().putString(KEY_QUEUE, trimmed.toString()).apply()
        }

        private fun read(context: Context): JSONArray =
            runCatching { JSONArray(prefs(context).getString(KEY_QUEUE, "[]")) }.getOrElse { JSONArray() }

        /**
         * Kuyrugu okur ve **ayni anda** temizler: JS tarafi kaydi yazdiktan sonra ikinci kez
         * okumasin. Yazma basarisiz olursa kayit kaybolur ama recordMetrics date+metric
         * anahtarli, bir sonraki olcum ayni satiri tazeler.
         */
        @Synchronized
        fun drain(context: Context): List<String> {
            val queue = read(context)
            prefs(context).edit().remove(KEY_QUEUE).apply()
            return (0 until queue.length()).map { queue.getJSONObject(it).toString() }
        }
    }
}
