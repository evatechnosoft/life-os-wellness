package com.evaitec.wellness.wear

import android.content.Context
import com.google.android.gms.wearable.DataClient
import com.google.android.gms.wearable.PutDataMapRequest
import com.google.android.gms.wearable.Wearable
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.withContext
import org.json.JSONObject
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

    /**
     * Telefon kaydi aldiktan sonra silmiyor (bir dugum yalniz kendi ogesini silebilir),
     * o yuzden budama burada. Bir gun: telefonu bir gece kapali birakmak kaydi kaybettirmesin,
     * ama kayitlar da saatte sonsuza kadar birikmesin.
     */
    private suspend fun prune(nowMs: Long) {
        val cutoff = nowMs - DAY_MS
        val buffer = dataClient.dataItems.await()
        val stale = try {
            buffer.filter { it.uri.path?.startsWith(WearMetrics.PATH_PREFIX) == true }
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
