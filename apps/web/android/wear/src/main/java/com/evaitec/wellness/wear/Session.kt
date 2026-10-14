package com.evaitec.wellness.wear

import java.time.DayOfWeek

/**
 * Gunun planindaki tek hareket. Telefon ozeti (Summary) ya da yedek liste uretir.
 * kgs: son seansta set sirasiyla kg (25, 30, 35 = rampa); bossa her set lastKg.
 */
data class PlanItem(
    val id: String,
    val name: String,
    val sets: Int,
    val lastKg: Double?,
    val kgs: List<Double> = emptyList(),
) {
    /** Rampa gecen sefer 3 set surduyse plan 2 dese de 3 set. */
    val totalSets: Int get() = maxOf(sets, kgs.size)
    val isRamp: Boolean get() = kgs.distinct().size > 1
    fun targetKg(setNo: Int): Double? = kgs.getOrNull(setNo - 1) ?: kgs.lastOrNull() ?: lastKg
}

/**
 * Seans sayaci: hangi hareket, kacinci set. Saf - ekran/sensor/ag yok, JUnit ile sinanir.
 * Tekrar hedefi sabit 12 (PROGRAM 2x12 RIR 1-2); plan semasinda tekrar alani yok.
 */
class Session(val plan: List<PlanItem>) {
    var index = 0
        private set
    var setNo = 1
        private set

    /** Biten set sayisi (gecilen setler sayilmaz). */
    var doneSets = 0
        private set

    val current: PlanItem? get() = plan.getOrNull(index)
    val done: Boolean get() = index >= plan.size
    val totalSets: Int get() = plan.sumOf { it.totalSets }

    /** Seti kapatir; sonraki sete ya da harekete gecer. Kalan var mi doner. */
    fun next(): Boolean {
        val cur = current ?: return false
        doneSets++
        if (setNo < cur.totalSets) setNo++ else { index++; setNo = 1 }
        return !done
    }

    /** Hareketi set saymadan gecer (alet dolu, yapilmayacak). */
    fun skip() {
        if (done) return
        index++
        setNo = 1
    }

    /** Onceki harekete doner, ilk setinden. */
    fun previous() {
        if (index == 0) return
        index = (index - 1).coerceAtMost(plan.size - 1)
        setNo = 1
    }

    /** Seansi bitirir; biten setler kalir. */
    fun stop() {
        index = plan.size
        setNo = 1
    }

    companion object {
        const val REPS = 12
        const val REST_SEC = 90

        fun restRemainingSec(startMs: Long, nowMs: Long, restSec: Int = REST_SEC): Int =
            (restSec - (nowMs - startMs) / 1000).toInt().coerceAtLeast(0)

        // ponytail: sabit A/B/A' listesi - telefondan ozet (plan + son kg) gelince kalkar.
        // Kaynak: docs/PROGRAM-2026-09.md (29 Eyl plan, 2-3 Eki ve 5 Eki Pzt/Car takasi), adlar exercises.json.
        // 14 Eki (Dean): Car press yerine kelebek yapildi -> Car Butterfly, Cum Smith press (duz ya da alt gogus).
        fun fallbackPlan(day: DayOfWeek): List<PlanItem>? = when (day) {
            DayOfWeek.MONDAY -> listOf(
                "Leg_Press" to "Leg press",
                "Seated_Leg_Curl" to "Oturarak leg curl (makine)",
                "Leverage_Incline_Chest_Press" to "Eğimli göğüs presi (makine)",
                "Close-Grip_Front_Lat_Pulldown" to "Lat pulldown (dar/nötr tutuş)",
                "Side_Lateral_Raise" to "Dambıl yan kaldırış",
                "Leverage_Shoulder_Press" to "Omuz presi (makine)",
                "Machine_Triceps_Extension" to "Triceps (makine)",
                "Dead_Bug" to "Dead bug (yerde, anti-ekstansiyon)",
            )
            DayOfWeek.WEDNESDAY -> listOf(
                "Barbell_Hip_Thrust" to "Hip thrust",
                "Romanian_Deadlift" to "Romanian deadlift",
                "Leverage_Iso_Row" to "Makine row",
                "Butterfly" to "Butterfly / pec deck",
                "Pallof_Press" to "Pallof press",
            )
            DayOfWeek.FRIDAY -> listOf(
                "Leg_Press" to "Leg press",
                "Leg_Extensions" to "Leg extension",
                "Wide-Grip_Lat_Pulldown" to "Lat pulldown (geniş tutuş)",
                "Smith_Machine_Bench_Press" to "Smith bench press (düz / alt göğüs)",
                "Machine_Bicep_Curl" to "Biseps curl (makine)",
                "Standing_Dumbbell_Calf_Raise" to "Ayakta calf raise (vücut ağırlığı / dambıl)",
                "Arnold_Dumbbell_Press" to "Arnold press (dambıl)",
            )
            else -> null
        }?.map { (id, name) -> PlanItem(id, name, sets = 2, lastKg = null) }
    }
}
