package com.evaitec.wellness

/**
 * Health Connect'ten okunan ham kayitlari gunluk tek sayiya indiren saf hesaplar.
 * Android'e bagli hicbir sey kullanmaz, unit test ile dogrulanir.
 */
object HealthMath {

    /**
     * Gun basina yakilan kalori. Ayni gunu Fitbit, Samsung Health ve Health Connect
     * ayri ayri yaziyor; toplamak uc kat sayardi. Kaynak icinde toplanir, gun icin
     * en yuksek tek kaynak alinir (ops/import_health.mjs ile ayni kural).
     */
    fun dailyCalories(entries: List<CalorieEntry>): Map<String, Double> =
        highestSourceTotal(entries.map { Triple(it.date, it.source, it.kcal) })

    /**
     * Gun basina protein grami. Kalori ile ayni coklu kaynak sorunu: ayni ogunu hem
     * beslenme uygulamasi hem saat uygulamasi Health Connect'e yazabiliyor, toplamak
     * iki kat sayardi. Ayni kural: kaynak icinde toplanir, gun icin en yuksek tek
     * kaynak alinir.
     */
    fun dailyProteinGrams(entries: List<NutritionEntry>): Map<String, Double> =
        highestSourceTotal(entries.map { Triple(it.date, it.source, it.grams) })

    /** (gun, kaynak, deger) -> kaynak icinde topla, gun icin en yuksek kaynagi sec. */
    private fun highestSourceTotal(entries: List<Triple<String, String, Double>>): Map<String, Double> {
        val perSource = mutableMapOf<Pair<String, String>, Double>()
        for ((date, source, value) in entries) {
            val key = date to source
            perSource[key] = (perSource[key] ?: 0.0) + value
        }
        val byDay = mutableMapOf<String, Double>()
        for ((key, total) in perSource) {
            val (date, _) = key
            if (total > (byDay[date] ?: 0.0)) byDay[date] = total
        }
        return byDay
    }

    data class CalorieEntry(val date: String, val source: String, val kcal: Double)

    data class NutritionEntry(val date: String, val source: String, val grams: Double)

    data class SleepEntry(val wakeDate: String, val source: String, val minutes: Long)

    /**
     * Gun basina uyku dakikasi. Gece 23:00-07:00 seansi uyanilan gune yazilir -
     * "bu sabah kac saat uyanik kalktim" sorusu boyle cevaplanir.
     *
     * Kalori ile ayni coklu kaynak sorunu burada da var (Samsung Health + Fitbit
     * ayni geceyi ayri yazabilir), o yuzden ayni kural: kaynak icinde toplanir,
     * gun icin en yuksek tek kaynak alinir.
     */
    fun dailySleepMinutes(entries: List<SleepEntry>): Map<String, Long> {
        val perSource = mutableMapOf<Pair<String, String>, Long>()
        for (e in entries) {
            val key = e.wakeDate to e.source
            perSource[key] = (perSource[key] ?: 0L) + e.minutes
        }
        val byDay = mutableMapOf<String, Long>()
        for ((key, total) in perSource) {
            val (date, _) = key
            if (total > (byDay[date] ?: 0L)) byDay[date] = total
        }
        return byDay
    }

    /**
     * Gunun en dusuk %10'unun ortancasi. En dusuk tek ornek olcum hatasina acik
     * (saat bilekten kaymis, parmak oynamis), ortalama ise gunduz hareketiyle
     * sisiyor; alt bandin ortancasi ikisinin arasinda durur.
     */
    fun <T : Comparable<T>> lowestDecileMedian(samples: List<T>, minSamples: Int = 10): T? {
        if (samples.size < minSamples) return null
        val sorted = samples.sorted()
        val take = maxOf(1, sorted.size / 10)
        return sorted[take / 2]
    }

    /** Gunun ortancasi. Ortalama degil: tek bir bozuk olcum gunu kaydirmasin. */
    fun <T : Comparable<T>> median(samples: List<T>, minSamples: Int = 1): T? {
        if (samples.size < minSamples) return null
        return samples.sorted()[samples.size / 2]
    }

    /**
     * Dinlenme nabzi. Health Connect'te RestingHeartRateRecord cogu saatte bos;
     * elimizdeki tek sey gun boyu alinan orneklerdir, alt bant uyku/dinlenmedir.
     * Guvenilir olmasi icin gunde en az 10 ornek ister; daha azi null doner.
     */
    fun restingBpm(samples: List<Long>, minSamples: Int = 10): Long? =
        lowestDecileMedian(samples, minSamples)

    /**
     * Gecenin en dusuk kan oksijeni bandi. Saat SpO2'yi surekli degil, cogunlukla
     * uykuda ve spot olcumde yazar - o yuzden esik gunde 5 ornek, nabizdaki 10 degil.
     */
    fun lowSpo2(samples: List<Double>, minSamples: Int = 5): Double? =
        lowestDecileMedian(samples, minSamples)

    /** Health Connect'ten gelen tek nabiz ornegi: mutlak zaman + bpm. */
    data class BpmSample(val atMillis: Long, val bpm: Long)

    /** Esigin ustunde gecirilen kesintisiz sure. */
    data class HrWindow(
        val startMillis: Long,
        val endMillis: Long,
        val avgBpm: Long,
        val peakBpm: Long,
    ) {
        val durationMinutes: Long get() = (endMillis - startMillis) / 60_000L
    }

    /** Bu bpm ve ustu "yuksek" sayilir. 120 dinlenme ustu net efor demek. */
    const val HIGH_BPM_THRESHOLD = 120L

    /** Bundan kisa pencere sorulmaz: merdiven cikmak antrenman degil. */
    const val HIGH_BPM_MIN_MINUTES = 5L

    /**
     * Iki yuksek ornek arasinda bu kadar bosluk pencereyi bolmez. Iki sebep:
     * set arasi dinlenmede nabiz esigin altina duser, ve saat dinlenmede
     * ornekleri seyreltir (10 dakikada bire kadar). Daha kisa bir esik uzun bir
     * yuruyusu tek-ornekli parcalara bolup hepsini eleyecekti. Karsi maliyeti:
     * 10 dakika arayla yapilan iki ayri kisa efor tek pencere gorunur.
     */
    const val HIGH_BPM_MAX_GAP_MINUTES = 10L

    /**
     * Esigin ustunde gecirilen pencereleri cikarir. Yalniz esik ustu ornekler
     * pencereye girer; aradaki dusuk ornekler ortalamaya katilmaz (pencere
     * "efor ne kadar yuksekti"yi anlatir, "ortalama nabiz ne"yi degil).
     *
     * Pencere mutlak zamandir, takvim gunu degil: gece yarisini asan seans
     * bolunmez, gune yazma kararini cagiran taraf verir.
     */
    fun highBpmWindows(
        samples: List<BpmSample>,
        thresholdBpm: Long = HIGH_BPM_THRESHOLD,
        minMinutes: Long = HIGH_BPM_MIN_MINUTES,
        maxGapMinutes: Long = HIGH_BPM_MAX_GAP_MINUTES,
    ): List<HrWindow> {
        val high = samples.filter { it.bpm >= thresholdBpm }.sortedBy { it.atMillis }
        if (high.isEmpty()) return emptyList()

        val maxGap = maxGapMinutes * 60_000L
        val minDuration = minMinutes * 60_000L
        val windows = mutableListOf<HrWindow>()
        var group = mutableListOf(high.first())

        fun close() {
            val start = group.first().atMillis
            val end = group.last().atMillis
            if (end - start < minDuration) return
            windows.add(
                HrWindow(
                    startMillis = start,
                    endMillis = end,
                    avgBpm = Math.round(group.sumOf { it.bpm }.toDouble() / group.size),
                    peakBpm = group.maxOf { it.bpm },
                ),
            )
        }

        for (sample in high.drop(1)) {
            if (sample.atMillis - group.last().atMillis > maxGap) {
                close()
                group = mutableListOf(sample)
            } else {
                group.add(sample)
            }
        }
        close()
        return windows
    }
}
