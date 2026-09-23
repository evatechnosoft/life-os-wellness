package com.evaitec.wellness

import android.content.Context
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.time.TimeRangeFilter
import androidx.work.Constraints
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.NetworkType
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.time.Duration
import java.time.Instant
import java.util.concurrent.TimeUnit

/**
 * Uygulama kapaliyken de olcum aksin diye 8 saatte bir kosan is. Uygulama acikken
 * ayni veriyi JS tarafi (src/lib/health.ts) 15 dakikada bir yaziyor; ikisi de
 * date+metric anahtarli yazdigi icin ust uste binmiyor, ayni satir tazeleniyor.
 *
 * Yalniz Health Connect'ten okunan sayilar gonderiliyor - seans/hareket-tekrar
 * Samsung arsivinden geliyor (ops/import_samsung.mjs), Health Connect onu vermiyor.
 */
class HealthSyncWorker(context: Context, params: WorkerParameters) :
    CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        val prefs = applicationContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val base = prefs.getString(KEY_BASE, null) ?: return Result.success()
        val token = prefs.getString(KEY_TOKEN, null) ?: return Result.success()
        val client = runCatching { HealthConnectClient.getOrCreate(applicationContext) }
            .getOrNull() ?: return Result.success()

        return runCatching {
            val now = Instant.now()
            // Iki gun: dunun gec gelen kayitlari (uyku sabah yazilir) da tazelensin.
            val range = TimeRangeFilter.between(now.minus(Duration.ofDays(2)), now)
            val result = HealthExtraPlugin.collect(client, range, HealthMath.HIGH_BPM_THRESHOLD)
            val records = JSONArray()
            val days = result.optJSONArray("days") ?: JSONArray()
            for (i in 0 until days.length()) {
                val day = days.getJSONObject(i)
                val date = day.optString("date")
                if (date.isEmpty()) continue
                for (metric in METRICS) {
                    if (!day.has(metric)) continue
                    records.put(
                        JSONObject()
                            .put("date", date)
                            .put("source", SOURCE)
                            .put("metric", metric)
                            .put("value", day.getDouble(metric)),
                    )
                }
            }
            if (records.length() > 0) {
                post("$base/api/wearable", token, JSONObject().put("records", records))
            }
            Result.success()
        }.getOrElse {
            // Ag yok ya da izin dustu: bir sonraki kosuda yeniden denenir, veri kaybi yok.
            Result.retry()
        }
    }

    private fun post(url: String, token: String, body: JSONObject) {
        val conn = URL(url).openConnection() as HttpURLConnection
        try {
            conn.requestMethod = "POST"
            conn.doOutput = true
            conn.connectTimeout = 15_000
            conn.readTimeout = 30_000
            conn.setRequestProperty("content-type", "application/json")
            conn.setRequestProperty("authorization", "Bearer $token")
            conn.outputStream.use { it.write(body.toString().toByteArray(Charsets.UTF_8)) }
            check(conn.responseCode in 200..299) { "sunucu ${conn.responseCode}" }
        } finally {
            conn.disconnect()
        }
    }

    companion object {
        private const val PREFS = "wellness.bgsync"
        private const val KEY_BASE = "api_base"
        private const val KEY_TOKEN = "api_token"
        private const val WORK = "wellness.health-sync"
        private const val SOURCE = "health_connect"

        /** Gun satirindan sunucuya gidecek olcumler (src/lib/health.ts ile ayni liste). */
        private val METRICS = listOf(
            "steps", "total_kcal", "resting_hr", "spo2_pct", "spo2_low_pct", "hrv_ms",
            "sleep_min", "protein_g", "bp_systolic", "bp_diastolic",
        )

        /**
         * Sunucu adresi ve token web katmaninda (localStorage) duruyor; arka plan isi
         * oraya bakamadigi icin kopyasi burada tutuluyor. Her acilista tazeleniyor.
         */
        fun configure(context: Context, base: String, token: String, everyHours: Long) {
            context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
                .putString(KEY_BASE, base).putString(KEY_TOKEN, token).apply()
            val request = PeriodicWorkRequestBuilder<HealthSyncWorker>(everyHours, TimeUnit.HOURS)
                .setConstraints(Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build())
                .build()
            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                WORK,
                // UPDATE: periyot degisince eski plan degil yenisi gecerli olsun.
                ExistingPeriodicWorkPolicy.UPDATE,
                request,
            )
        }

        fun cancel(context: Context) {
            WorkManager.getInstance(context).cancelUniqueWork(WORK)
        }
    }
}
