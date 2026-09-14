package com.evaitec.wellness.wear

import android.content.Context
import androidx.health.services.client.HealthServices
import androidx.health.services.client.MeasureCallback
import androidx.health.services.client.data.Availability
import androidx.health.services.client.data.DataPointContainer
import androidx.health.services.client.data.DataType
import androidx.health.services.client.data.DeltaDataType
import kotlinx.coroutines.guava.await

/**
 * Anlik nabiz. Ham SensorManager degil Health Services: dokuman "sensor configurations ...
 * optimized for power efficiency" diyor, ham surekli ornekleme saatin pilini bitirir.
 *
 * MeasureClient bilerek yalniz ekran onde ve kullanici bakarken kayitli kalir - dokuman
 * "not intended for background capture or workout tracking" diyor ve kayitli callback
 * ornekleme hizini yukseltiyor. Surekli olcum ExerciseClient'in isi (plan Adim 5).
 */
class HeartRateMeasure(context: Context) {

    private val measureClient = HealthServices.getClient(context).measureClient
    private var callback: MeasureCallback? = null

    /**
     * @param onSample ham bpm ve orneginin acilistan beri gectigi sure (ms) - ikincisi
     *   ekrandaki ornek araligini olcmek icin, cihazin gercek frekansi belgede yazmiyor.
     */
    fun start(
        onSample: (bpm: Double, bootMs: Long) -> Unit,
        onAvailability: (String) -> Unit,
        onError: (String) -> Unit,
    ) {
        stop()
        val cb = object : MeasureCallback {
            override fun onRegistered() = onAvailability("kayitli, veri bekleniyor")

            override fun onRegistrationFailed(throwable: Throwable) {
                onError(throwable.message ?: throwable.javaClass.simpleName)
            }

            // Bilek takili degilken veri gelmez; kullanici "bozuk" sanmasin diye durum ekranda.
            override fun onAvailabilityChanged(dataType: DeltaDataType<*, *>, availability: Availability) {
                onAvailability(availability.toString())
            }

            override fun onDataReceived(data: DataPointContainer) {
                data.getData(DataType.HEART_RATE_BPM).forEach { point ->
                    onSample(point.value, point.timeDurationFromBoot.toMillis())
                }
            }
        }
        callback = cb
        measureClient.registerMeasureCallback(DataType.HEART_RATE_BPM, cb)
    }

    fun stop() {
        val cb = callback ?: return
        callback = null
        measureClient.unregisterMeasureCallbackAsync(DataType.HEART_RATE_BPM, cb)
    }

    companion object {
        /**
         * Cihazin gercekte ne verdigini **calisma aninda** sorar. Zorunlu tipler disindakiler
         * (rep count dahil) cihaza bagli; derleme aninda varsaymak istegin sessizce
         * basarisiz olmasi demek. Ekrana basilan dokum bu sorunun tek durust cevabi.
         */
        suspend fun capabilityReport(context: Context): String {
            val client = HealthServices.getClient(context)
            val measure = runCatching { client.measureClient.getCapabilitiesAsync().await() }
            val exercise = runCatching { client.exerciseClient.getCapabilitiesAsync().await() }

            val lines = mutableListOf<String>()

            measure.onSuccess { caps ->
                lines += "MEASURE (${caps.supportedDataTypesMeasure.size}):"
                lines += caps.supportedDataTypesMeasure.map { it.name }.sorted().joinToString(", ")
            }.onFailure { lines += "MEASURE okunamadi: ${it.message}" }

            exercise.onSuccess { caps ->
                val types = caps.supportedExerciseTypes
                lines += ""
                lines += "EXERCISE tipleri (${types.size}):"
                lines += types.map { it.toString() }.sorted().joinToString(", ")

                val withReps = types.filter { type ->
                    caps.getExerciseTypeCapabilities(type)
                        .supportedDataTypes.any { it.name.startsWith(REP_COUNT_PREFIX) }
                }
                lines += ""
                lines += if (withReps.isEmpty()) {
                    "REP_COUNT: hicbir egzersiz tipinde YOK"
                } else {
                    "REP_COUNT var (${withReps.size}): " + withReps.map { it.toString() }.sorted().joinToString(", ")
                }
            }.onFailure { lines += "EXERCISE okunamadi: ${it.message}" }

            return lines.joinToString("\n")
        }

        /** Hem REP_COUNT hem REP_COUNT_TOTAL'i yakalar. */
        private const val REP_COUNT_PREFIX = "rep_count"
    }
}
