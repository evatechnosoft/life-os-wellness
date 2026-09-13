package com.evaitec.wellness

import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.records.HeartRateRecord
import androidx.health.connect.client.records.TotalCaloriesBurnedRecord
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.time.format.DateTimeFormatter

/**
 * capacitor-health'in okuyamadigi iki olcum: toplam yakilan kalori ve nabiz.
 * O eklentinin queryAggregated'i yalniz steps | active-calories | mindfulness
 * veriyor, queryRecords ise adim + vucut kompozisyonu; toplam kalori ve nabiz
 * icin Health Connect'e dogrudan bakmak gerekiyor (docs/PLAN-F1.md m3b).
 *
 * Izin istemek bu eklentinin isi degil: HC izinleri uygulama basina verilir,
 * capacitor-health zaten onay ekranini aciyor (src/lib/health.ts PERMISSIONS).
 * Burasi yalniz okur.
 */
@CapacitorPlugin(name = "HealthExtra")
class HealthExtraPlugin : Plugin() {

    private val dayFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd")

    private fun localDay(instant: Instant): String =
        LocalDate.ofInstant(instant, ZoneId.systemDefault()).format(dayFormat)

    @PluginMethod
    fun available(call: PluginCall) {
        val sdk = HealthConnectClient.getSdkStatus(context)
        call.resolve(JSObject().put("available", sdk == HealthConnectClient.SDK_AVAILABLE))
    }

    /**
     * Verilen aralikta gun basina toplam kalori ve dinlenme nabzi.
     * Donus: { days: [{ date, total_kcal?, resting_hr? }] } - olcumu olmayan gun hic gelmez.
     */
    @PluginMethod
    fun readDaily(call: PluginCall) {
        val startText = call.getString("startDate")
        val endText = call.getString("endDate")
        if (startText == null || endText == null) {
            call.reject("startDate ve endDate gerekli")
            return
        }
        val range = try {
            TimeRangeFilter.between(Instant.parse(startText), Instant.parse(endText))
        } catch (e: Exception) {
            call.reject("Tarih ISO formatinda olmali: ${e.message}")
            return
        }

        val client = try {
            HealthConnectClient.getOrCreate(context)
        } catch (e: Exception) {
            call.reject("Health Connect kullanilamiyor: ${e.message}")
            return
        }

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val calories = mutableListOf<HealthMath.CalorieEntry>()
                readAll(client, TotalCaloriesBurnedRecord::class.java, range) { record ->
                    calories.add(
                        HealthMath.CalorieEntry(
                            date = localDay(record.startTime),
                            source = record.metadata.dataOrigin.packageName,
                            kcal = record.energy.inKilocalories,
                        ),
                    )
                }

                val bpmByDay = mutableMapOf<String, MutableList<Long>>()
                readAll(client, HeartRateRecord::class.java, range) { record ->
                    for (sample in record.samples) {
                        bpmByDay.getOrPut(localDay(sample.time)) { mutableListOf() }.add(sample.beatsPerMinute)
                    }
                }

                val kcalByDay = HealthMath.dailyCalories(calories)
                val days = JSArray()
                for (date in (kcalByDay.keys + bpmByDay.keys).sorted()) {
                    val entry = JSObject().put("date", date)
                    kcalByDay[date]?.let { entry.put("total_kcal", it) }
                    bpmByDay[date]?.let { samples ->
                        HealthMath.restingBpm(samples)?.let { entry.put("resting_hr", it) }
                    }
                    days.put(entry)
                }
                call.resolve(JSObject().put("days", days))
            } catch (e: Exception) {
                // Izin verilmediyse SecurityException gelir; cagiran taraf bunu sessiz gecer.
                call.reject(e.message ?: "Health Connect okunamadi")
            }
        }
    }

    /** Health Connect sayfa sayfa doner; 7 gunluk nabiz tek sayfaya sigmaz. */
    private suspend fun <T : androidx.health.connect.client.records.Record> readAll(
        client: HealthConnectClient,
        type: Class<T>,
        range: TimeRangeFilter,
        onRecord: (T) -> Unit,
    ) {
        var token: String? = null
        do {
            val response = client.readRecords(
                ReadRecordsRequest(
                    recordType = type.kotlin,
                    timeRangeFilter = range,
                    pageToken = token,
                ),
            )
            response.records.forEach(onRecord)
            token = response.pageToken
        } while (token != null)
    }
}
