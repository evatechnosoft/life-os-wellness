package com.evaitec.wellness

/**
 * Gecis olaylarini (ENTER/EXIT) araliklara cevirir. Saf fonksiyon: Android'e
 * bagli degil, JVM testinde kosar.
 *
 * Transition API olaylari kayipli gelir - surec olduruldugunde bir EXIT hic
 * ulasmayabilir, ayni ENTER iki kez dusebilir, siralama garanti degildir.
 * Kural: eksik olay aralik uydurmaz, yalniz aciktaki aralik "suruyor" kalir.
 */
object ActivityIntervals {

    /** Bunun altindaki aralik gurultudur: trafik isiginda duran arac, iki adim. */
    const val MIN_INTERVAL_MS = 60_000L

    data class Event(val type: String, val enter: Boolean, val atMs: Long)

    /** [endMs] null ise aralik hala aciktir (EXIT gelmedi). */
    data class Interval(val type: String, val startMs: Long, val endMs: Long?)

    fun fold(events: List<Event>): List<Interval> {
        val open = LinkedHashMap<String, Long>()
        val out = mutableListOf<Interval>()
        for (event in events.sortedBy { it.atMs }) {
            if (event.enter) {
                // Tekrarli ENTER ilk baslangici korur; ikincisi yeni aralik acmaz.
                open.putIfAbsent(event.type, event.atMs)
            } else {
                val start = open.remove(event.type) ?: continue // ENTER'siz EXIT: atilir
                if (event.atMs - start >= MIN_INTERVAL_MS) out.add(Interval(event.type, start, event.atMs))
            }
        }
        open.forEach { (type, start) -> out.add(Interval(type, start, null)) }
        return out.sortedBy { it.startMs }
    }
}
