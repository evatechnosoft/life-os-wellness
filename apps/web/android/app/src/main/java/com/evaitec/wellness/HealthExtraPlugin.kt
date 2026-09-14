package com.evaitec.wellness

import androidx.activity.result.ActivityResult
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.BloodPressureRecord
import androidx.health.connect.client.records.ExerciseSessionRecord
import androidx.health.connect.client.records.HeartRateRecord
import androidx.health.connect.client.records.HeartRateVariabilityRmssdRecord
import androidx.health.connect.client.records.NutritionRecord
import androidx.health.connect.client.records.OxygenSaturationRecord
import androidx.health.connect.client.records.SleepSessionRecord
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
import java.time.Duration
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.time.format.DateTimeFormatter

/**
 * capacitor-health'in okuyamadigi olcumler: toplam yakilan kalori, nabiz, kan
 * oksijeni, HRV ve uyku. O eklentinin queryAggregated'i yalniz steps | active-calories
 * | mindfulness veriyor, queryRecords ise adim + vucut kompozisyonu; bunlar icin
 * Health Connect'e dogrudan bakmak gerekiyor (docs/PLAN-F1.md m3b).
 *
 * Izin ikiye bolunuyor: toplam kalori ve nabiz capacitor-health'in izin listesinde
 * var, onlari o istiyor (src/lib/health.ts PERMISSIONS). Kan oksijeni ve HRV o
 * listede yok - kan oksijeni, HRV ve uyku icin onay ekranini bu eklenti kendi aciyor.
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
     * capacitor-health'in izin listesinde kan oksijeni, HRV, uyku ve beslenme yok, yani
     * o eklenti bu dordunu isteyemiyor - onay ekranini bunlar icin kendimiz aciyoruz.
     * Toplam kalori ve nabiz hala capacitor-health tarafindan isteniyor.
     */
    private val extraPermissions = setOf(
        HealthPermission.getReadPermission(OxygenSaturationRecord::class),
        HealthPermission.getReadPermission(HeartRateVariabilityRmssdRecord::class),
        HealthPermission.getReadPermission(SleepSessionRecord::class),
        HealthPermission.getReadPermission(NutritionRecord::class),
        HealthPermission.getReadPermission(BloodPressureRecord::class),
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
     * { days: [{ date, total_kcal?, resting_hr?, spo2_pct?, spo2_low_pct?, hrv_ms?, sleep_min?,
     *            protein_g?, bp_systolic?, bp_diastolic?, session_count?, segment_count? }] }
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

        // Esik ayarlanabilir kalsin: 120 bpm herkes icin ayni seyi anlatmiyor,
        // dinlenme nabzi yuksek olanda gunluk hareket bile esigi asar.
        val threshold = call.getInt("highBpmThreshold")?.toLong() ?: HealthMath.HIGH_BPM_THRESHOLD

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
                val bpmSamples = mutableListOf<HealthMath.BpmSample>()
                readAll(client, HeartRateRecord::class.java, range) { record ->
                    for (sample in record.samples) {
                        bpmByDay.getOrPut(localDay(sample.time)) { mutableListOf() }.add(sample.beatsPerMinute)
                        bpmSamples.add(HealthMath.BpmSample(sample.time.toEpochMilli(), sample.beatsPerMinute))
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

                // Samsung Health uykuyu 11 Eylul'de Health Connect'e yazmiyordu (sifir
                // satir); buradan veri gelmesi icin Samsung Health tarafinda paylasimin
                // acilmasi gerekiyor. Okuma hazir dursun ki acildigi an calissin.
                val sleepEntries = mutableListOf<HealthMath.SleepEntry>()
                readAll(client, SleepSessionRecord::class.java, range) { record ->
                    val minutes = Duration.between(record.startTime, record.endTime).toMinutes()
                    if (minutes > 0) {
                        sleepEntries.add(
                            HealthMath.SleepEntry(
                                // Uyanilan gune yazilir: gece yarisini asan seans ertesi gunun.
                                wakeDate = localDay(record.endTime),
                                source = record.metadata.dataOrigin.packageName,
                                minutes = minutes,
                            ),
                        )
                    }
                }

                // Protein: ogun kaydinin protein alani bos olabilir (sadece kalori
                // girilmis ogun), o zaman gun toplamina katilmaz.
                val nutrition = mutableListOf<HealthMath.NutritionEntry>()
                readAll(client, NutritionRecord::class.java, range) { record ->
                    val grams = record.protein?.inGrams
                    if (grams != null && grams > 0.0) {
                        nutrition.add(
                            HealthMath.NutritionEntry(
                                date = localDay(record.startTime),
                                source = record.metadata.dataOrigin.packageName,
                                grams = grams,
                            ),
                        )
                    }
                }

                // Kan basincini biz uretmiyoruz: mansonlu cihazdan ya da saatten gelen
                // olcum ne ise o. Gunde birden fazla olcum olur, ortancasi alinir -
                // tek bozuk olcum gunu kaydirmasin (SpO2/HRV ile ayni kural).
                val sysByDay = mutableMapOf<String, MutableList<Double>>()
                val diaByDay = mutableMapOf<String, MutableList<Double>>()
                readAll(client, BloodPressureRecord::class.java, range) { record ->
                    val day = localDay(record.time)
                    sysByDay.getOrPut(day) { mutableListOf() }.add(record.systolic.inMillimetersOfMercury)
                    diaByDay.getOrPut(day) { mutableListOf() }.add(record.diastolic.inMillimetersOfMercury)
                }

                // ExerciseSegment semasi tekrar sayisini tasiyor ama bu alani dolduran
                // bir uretici uygulama dogrulanmadi (docs/SENSORS-FEASIBILITY.md 4.3).
                // Bos segment listesi hata degil, beklenen durum - sessizce gecilir;
                // gun basina iki sayac (seans + segment) telefonda cevabi gosterir.
                val segments = mutableListOf<HealthMath.SegmentEntry>()
                val sessionCountByDay = mutableMapOf<String, Int>()
                try {
                    readAll(client, ExerciseSessionRecord::class.java, range) { record ->
                        val day = localDay(record.startTime)
                        sessionCountByDay[day] = (sessionCountByDay[day] ?: 0) + 1
                        for (seg in record.segments) {
                            segments.add(
                                HealthMath.SegmentEntry(
                                    date = day,
                                    sessionStartMillis = record.startTime.toEpochMilli(),
                                    type = seg.segmentType,
                                    repetitions = seg.repetitions,
                                    minutes = Duration.between(seg.startTime, seg.endTime).toMinutes(),
                                ),
                            )
                        }
                    }
                } catch (e: Exception) {
                    // READ_EXERCISE iznini capacitor-health istiyor, bu eklenti degil;
                    // verilmediyse diger olcumler yine yazilir.
                }
                val bySession = HealthMath.sessionSegments(segments)
                val segmentCountByDay = HealthMath.dailySegmentCount(segments)

                val kcalByDay = HealthMath.dailyCalories(calories)
                val proteinByDay = HealthMath.dailyProteinGrams(nutrition)
                val sleepByDay = HealthMath.dailySleepMinutes(sleepEntries)
                val days = JSArray()
                val dates = kcalByDay.keys + bpmByDay.keys + spo2ByDay.keys + hrvByDay.keys +
                    sleepByDay.keys + proteinByDay.keys + sysByDay.keys + sessionCountByDay.keys
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
                    sleepByDay[date]?.let { entry.put("sleep_min", it) }
                    proteinByDay[date]?.let { entry.put("protein_g", it) }
                    sysByDay[date]?.let { s -> HealthMath.median(s)?.let { entry.put("bp_systolic", it) } }
                    diaByDay[date]?.let { s -> HealthMath.median(s)?.let { entry.put("bp_diastolic", it) } }
                    // Sifir da yazilir: "seans var ama segment yok" ile "seans yok"
                    // ancak boyle ayirt edilir - sorunun kapanmasi buna bagli.
                    sessionCountByDay[date]?.let { count ->
                        entry.put("session_count", count)
                        entry.put("segment_count", segmentCountByDay[date] ?: 0)
                    }
                    days.put(entry)
                }
                val windows = JSArray()
                for (w in HealthMath.highBpmWindows(bpmSamples, thresholdBpm = threshold)) {
                    windows.put(
                        JSObject()
                            .put("start", Instant.ofEpochMilli(w.startMillis).toString())
                            .put("end", Instant.ofEpochMilli(w.endMillis).toString())
                            .put("duration_min", w.durationMinutes)
                            .put("avg_bpm", w.avgBpm)
                            .put("peak_bpm", w.peakBpm),
                    )
                }

                // Health Connect canli akis vermez: kaynak uygulama ne zaman yazdiysa
                // o zaman gorunur. En taze ornegin yasi gercek gecikmeyi olcer -
                // cihazda "ne kadar geriden geliyoruz" sorusunun tek kanitli cevabi.
                // Seans basina segment ozeti: cagiran taraf bunu seansin baslangic
                // zamanina gore kendi kaydiyla eslestirir (src/lib/health.ts).
                val sessions = JSArray()
                for ((startMillis, summary) in bySession) {
                    val types = JSArray()
                    summary.types.forEach { types.put(it) }
                    sessions.put(
                        JSObject()
                            .put("start_ms", startMillis)
                            .put("reps_total", summary.repsTotal)
                            .put("minutes", summary.minutes)
                            .put("types", types),
                    )
                }

                val newest = bpmSamples.maxOfOrNull { it.atMillis }
                val result = JSObject().put("days", days).put("windows", windows)
                    .put("sessions", sessions)
                if (newest != null) {
                    result.put("hr_lag_min", (System.currentTimeMillis() - newest) / 60_000L)
                }
                call.resolve(result)
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
