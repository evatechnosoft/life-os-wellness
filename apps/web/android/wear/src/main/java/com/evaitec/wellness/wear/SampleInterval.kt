package com.evaitec.wellness.wear

/**
 * Nabiz orneklerinin gercek araligi. Health Services dokumani bir sayi vermiyor -
 * "different sensors generate data at different frequencies that vary per device" -
 * yani aralik ancak cihazda olculur. Ekrandaki ms degeri bu olcumun kendisi.
 */
object SampleInterval {

    /** Ard arda iki ornek yoksa aralik diye bir sey de yok: null. */
    fun averageMs(bootMillis: List<Long>): Long? {
        if (bootMillis.size < 2) return null
        val sorted = bootMillis.sorted()
        return (sorted.last() - sorted.first()) / (sorted.size - 1)
    }

    /** Ekranda son birkac ornek yeter; liste sinirsiz buyurse bellek bosa gider. */
    fun keepLast(previous: List<Long>, next: Long, max: Int): List<Long> =
        (previous + next).takeLast(max)
}
