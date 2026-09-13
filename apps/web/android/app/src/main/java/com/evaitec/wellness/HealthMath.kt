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
    fun dailyCalories(entries: List<CalorieEntry>): Map<String, Double> {
        val perSource = mutableMapOf<Pair<String, String>, Double>()
        for (e in entries) {
            val key = e.date to e.source
            perSource[key] = (perSource[key] ?: 0.0) + e.kcal
        }
        val byDay = mutableMapOf<String, Double>()
        for ((key, total) in perSource) {
            val (date, _) = key
            if (total > (byDay[date] ?: 0.0)) byDay[date] = total
        }
        return byDay
    }

    data class CalorieEntry(val date: String, val source: String, val kcal: Double)

    /**
     * Dinlenme nabzi. Health Connect'te RestingHeartRateRecord cogu saatte bos;
     * elimizdeki tek sey gun boyu alinan orneklerdir. Gunun en dusuk %10'unun
     * ortancasi uyku/dinlenme bandini yakalar: en dusuk tek ornek olcum hatasina
     * acik, ortalama ise gunduz hareketiyle sisiyor.
     *
     * Guvenilir olmasi icin gunde en az 10 ornek ister; daha azi null doner.
     */
    fun restingBpm(samples: List<Long>, minSamples: Int = 10): Long? {
        if (samples.size < minSamples) return null
        val sorted = samples.sorted()
        val take = maxOf(1, sorted.size / 10)
        val lowest = sorted.take(take)
        return lowest[lowest.size / 2]
    }
}
