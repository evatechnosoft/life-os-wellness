package com.evaitec.wellness.wear

import android.content.Context
import com.google.android.gms.wearable.DataClient
import com.google.android.gms.wearable.DataMapItem
import com.google.android.gms.wearable.PutDataMapRequest
import com.google.android.gms.wearable.Wearable
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.time.Instant
import java.time.LocalDate

/**
 * Olcumu telefona yollar. MessageClient degil DataClient: mesajin teslim garantisi yok
 * ("best effort ... doesn't contain any built-in retry"), veri kaybetmemesi gereken
 * akista bu yeterli degil. DataClient kayit kalici - telefon kapaliyken bile birikir,
 * baglanti gelince duser.
 */
class WearSender(context: Context) {

    private val dataClient: DataClient = Wearable.getDataClient(context)

    suspend fun send(
        metrics: Map<String, Double>,
        date: String = LocalDate.now().toString(),
        nowMs: Long = System.currentTimeMillis(),
    ): Result<Unit> = withContext(Dispatchers.IO) {
        runCatching {
            val body = JSONObject()
            metrics.forEach { (key, value) -> body.put(key, value) }
            val request = PutDataMapRequest.create("${WearMetrics.PATH_PREFIX}/$nowMs").apply {
                dataMap.putString(WearMetrics.KEY_DATE, date)
                dataMap.putString(WearMetrics.KEY_METRICS, body.toString())
                dataMap.putLong(WearMetrics.KEY_TS, nowMs)
            }
            dataClient.putDataItem(request.asPutDataRequest().setUrgent()).await()
            prune(nowMs)
        }
    }

    /** Seans seti. Telefon kuyruga alir, JS /api/workouts'a tam set listesiyle yazar (watch.ts). */
    suspend fun sendSet(
        exerciseId: String,
        setNo: Int,
        reps: Int,
        weightKg: Double?,
        date: String = LocalDate.now().toString(),
        nowMs: Long = System.currentTimeMillis(),
    ): Result<Unit> = withContext(Dispatchers.IO) {
        runCatching {
            val body = JSONObject()
                .put("date", date)
                .put("exercise_id", exerciseId)
                .put("set_no", setNo)
                .put("reps", reps)
                .put("weight_kg", weightKg ?: JSONObject.NULL)
                .put("done_at", Instant.ofEpochMilli(nowMs).toString())
            val request = PutDataMapRequest.create("${WearMetrics.PATH_SETS}/$nowMs").apply {
                dataMap.putString(WearMetrics.KEY_SET, body.toString())
                dataMap.putLong(WearMetrics.KEY_TS, nowMs)
            }
            dataClient.putDataItem(request.asPutDataRequest().setUrgent()).await()
            prune(nowMs)
        }
    }

    /** Telefonun yazdigi son ozet; hic yazilmadiysa null. */
    suspend fun readSummary(): Summary? = withContext(Dispatchers.IO) {
        val buffer = runCatching { dataClient.dataItems.await() }.getOrNull() ?: return@withContext null
        try {
            buffer.firstOrNull { it.uri.path == WearMetrics.PATH_SUMMARY }
                ?.let { DataMapItem.fromDataItem(it).dataMap.getString(WearMetrics.KEY_SUMMARY) }
                ?.let(Summary::parse)
        } finally {
            buffer.release()
        }
    }

    /**
     * Telefon kaydi aldiktan sonra silmiyor (bir dugum yalniz kendi ogesini silebilir),
     * o yuzden budama burada. Bir gun: telefonu bir gece kapali birakmak kaydi kaybettirmesin,
     * ama kayitlar da saatte sonsuza kadar birikmesin.
     */
    private suspend fun prune(nowMs: Long) {
        val cutoff = nowMs - DAY_MS
        val buffer = dataClient.dataItems.await()
        val stale = try {
            buffer.filter { p -> p.uri.path?.let { it.startsWith(WearMetrics.PATH_PREFIX) || it.startsWith(WearMetrics.PATH_SETS) } == true }
                .map { it.uri }
                .filter { uri -> (uri.lastPathSegment?.toLongOrNull() ?: Long.MAX_VALUE) < cutoff }
        } finally {
            buffer.release()
        }
        stale.forEach { dataClient.deleteDataItems(it).await() }
    }

    private companion object {
        const val DAY_MS = 24L * 60 * 60 * 1000
    }
}
