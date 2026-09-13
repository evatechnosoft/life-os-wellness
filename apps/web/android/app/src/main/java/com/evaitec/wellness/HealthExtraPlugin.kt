package com.evaitec.wellness

import androidx.activity.result.ActivityResult
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.HeartRateRecord
import androidx.health.connect.client.records.HeartRateVariabilityRmssdRecord
import androidx.health.connect.client.records.OxygenSaturationRecord
import androidx.health.connect.client.records.TotalCaloriesBurnedRecord
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.ActivityCallback
import com.getcapacitor.annotation.CapacitorPlugin
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.time.format.DateTimeFormatter

/**
 * capacitor-health'in okuyamadigi olcumler: toplam yakilan kalori, nabiz, kan
 * oksijeni ve HRV. O eklentinin queryAggregated'i yalniz steps | active-calories
 * | mindfulness veriyor, queryRecords ise adim + vucut kompozisyonu; bunlar icin
 * Health Connect'e dogrudan bakmak gerekiyor (docs/PLAN-F1.md m3b).
 *
 * Izin ikiye bolunuyor: toplam kalori ve nabiz capacitor-health'in izin listesinde
 * var, onlari o istiyor (src/lib/health.ts PERMISSIONS). Kan oksijeni ve HRV o
 * listede yok, onay ekranini bu eklenti kendi aciyor.
 *
 * Health Connect'te stres diye bir kayit tipi yok - 43 kayit tipinin hicbiri stres
 * degil. Samsung stres skorunu HRV'den turetip kendi uygulamasinda tutuyor; bizim
 * alabildigimiz ham olcu HRV (RMSSD).
 */
@CapacitorPlugin(name = "HealthExtra")
class HealthExtraPlugin : Plugin() {

    private val dayFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd")

    private fun localDay(instant: Instant): String =
        LocalDate.ofInstant(instant, ZoneId.systemDefault()).format(dayFormat)

    /**
     * capacitor-health'in izin listesinde kan oksijeni ve HRV yok, yani o eklenti
     * bu ikisini isteyemiyor - onay ekranini bunlar icin kendimiz aciyoruz.
     * Toplam kalori ve nabiz hala capacitor-health tarafindan isteniyor.
     */
    private val extraPermissions = setOf(
        HealthPermission.getReadPermission(OxygenSaturationRecord::class),
        HealthPermission.getReadPermission(HeartRateVariabilityRmssdRecord::class),
    )

    @PluginMethod
    fun available(call: PluginCall) {
        val sdk = HealthConnectClient.getSdkStatus(context)
        call.resolve(JSObject().put("available", sdk == HealthConnectClient.SDK_AVAILABLE))
    }

    @PluginMethod
    fun checkExtraPermissions(call: PluginCall) {
        val client = try {
            HealthConnectClient.getOrCreate(context)
        } catch (e: Exception) {
            call.resolve(JSObject().put("granted", false))
            return
        }
        CoroutineScope(Dispatchers.IO).launch {
            val granted = client.permissionController.getGrantedPermissions()
            call.resolve(JSObject().put("granted", granted.containsAll(extraPermissions)))
        }
    }

    @PluginMethod
    fun requestExtraPermissions(call: PluginCall) {
        val intent = PermissionController.createRequestPermissionResultContract()
            .createIntent(activity, extraPermissions)
        startActivityForResult(call, intent, "permissionsResult")
    }

    @ActivityCallback
    private fun permissionsResult(call: PluginCall?, result: ActivityResult) {
        if (call == null) return
        checkExtraPermissions(call)
    }

    /**
     * Verilen aralikta gun basina ozetlenmis olcumler. Donus:
     * { days: [{ date, total_kcal?, resting_hr?, spo2_pct?, spo2_low_pct?, hrv_ms? }] }
     * - olcumu olmayan gun hic gelmez, esigin altinda ornek varsa o alan yazilmaz.
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

                // Saat SpO2'yi cogunlukla uykuda ve spot olcumde yazar, surekli degil.
                val spo2ByDay = mutableMapOf<String, MutableList<Double>>()
                readAll(client, OxygenSaturationRecord::class.java, range) { record ->
                    spo2ByDay.getOrPut(localDay(record.time)) { mutableListOf() }.add(record.percentage.value)
                }

                // Health Connect'te stres diye bir kayit tipi yok; Samsung stres skorunu
                // kendi icinde tutuyor. Elimizdeki en yakin olcum HRV (RMSSD).
                val hrvByDay = mutableMapOf<String, MutableList<Double>>()
                readAll(client, HeartRateVariabilityRmssdRecord::class.java, range) { record ->
                    hrvByDay.getOrPut(localDay(record.time)) { mutableListOf() }
                        .add(record.heartRateVariabilityMillis)
                }

                val kcalByDay = HealthMath.dailyCalories(calories)
                val days = JSArray()
                val dates = kcalByDay.keys + bpmByDay.keys + spo2ByDay.keys + hrvByDay.keys
                for (date in dates.sorted()) {
                    val entry = JSObject().put("date", date)
                    kcalByDay[date]?.let { entry.put("total_kcal", it) }
                    bpmByDay[date]?.let { samples ->
                        HealthMath.restingBpm(samples)?.let { entry.put("resting_hr", it) }
                    }
                    spo2ByDay[date]?.let { samples ->
                        HealthMath.median(samples, minSamples = 5)?.let { entry.put("spo2_pct", it) }
                        HealthMath.lowSpo2(samples)?.let { entry.put("spo2_low_pct", it) }
                    }
                    hrvByDay[date]?.let { samples ->
                        HealthMath.median(samples, minSamples = 3)?.let { entry.put("hrv_ms", it) }
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
