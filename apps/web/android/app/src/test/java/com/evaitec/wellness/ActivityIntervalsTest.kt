package com.evaitec.wellness

import com.evaitec.wellness.ActivityIntervals.Event
import com.evaitec.wellness.ActivityIntervals.Interval
import org.junit.Assert.assertEquals
import org.junit.Test

/**
 * Gecis olaylarindan aralik cikarma. Transition API olaylari eksik, tekrarli ve
 * sirasiz gelebilir - bu testler o kenar durumlarin ne yaptigini sabitler.
 */
class ActivityIntervalsTest {

    private val base = 1_757_764_800_000L

    private fun min(n: Long) = base + n * 60_000L

    private fun enter(type: String, m: Long) = Event(type, true, min(m))

    private fun exit(type: String, m: Long) = Event(type, false, min(m))

    @Test
    fun `olay yoksa aralik yoktur`() {
        assertEquals(emptyList<Interval>(), ActivityIntervals.fold(emptyList()))
    }

    @Test
    fun `enter ve exit bir aralik olur`() {
        val out = ActivityIntervals.fold(listOf(enter("running", 0), exit("running", 30)))
        assertEquals(listOf(Interval("running", min(0), min(30))), out)
    }

    @Test
    fun `entersiz exit yok sayilir`() {
        assertEquals(emptyList<Interval>(), ActivityIntervals.fold(listOf(exit("walking", 10))))
    }

    @Test
    fun `exitsiz enter suren aralik olur - bitis null`() {
        val out = ActivityIntervals.fold(listOf(enter("cycling", 5)))
        assertEquals(listOf(Interval("cycling", min(5), null)), out)
    }

    @Test
    fun `ust uste ayni tip enter ilk baslangici korur`() {
        val out = ActivityIntervals.fold(listOf(enter("walking", 0), enter("walking", 7), exit("walking", 20)))
        assertEquals(listOf(Interval("walking", min(0), min(20))), out)
    }

    @Test
    fun `esik altindaki kisa aralik gurultudur - elenir`() {
        val short = listOf(
            Event("walking", true, base),
            Event("walking", false, base + ActivityIntervals.MIN_INTERVAL_MS - 1),
        )
        assertEquals(emptyList<Interval>(), ActivityIntervals.fold(short))

        val atThreshold = listOf(
            Event("walking", true, base),
            Event("walking", false, base + ActivityIntervals.MIN_INTERVAL_MS),
        )
        assertEquals(1, ActivityIntervals.fold(atThreshold).size)
    }

    @Test
    fun `sira disi gelen olaylar zamana gore duzeltilir`() {
        val out = ActivityIntervals.fold(listOf(exit("running", 30), enter("running", 0)))
        assertEquals(listOf(Interval("running", min(0), min(30))), out)
    }

    @Test
    fun `farkli tipler birbirini kapatmaz`() {
        val out = ActivityIntervals.fold(
            listOf(
                enter("still", 0), exit("still", 20),
                enter("walking", 20), exit("walking", 45),
                enter("in_vehicle", 50),
            ),
        )
        assertEquals(
            listOf(
                Interval("still", min(0), min(20)),
                Interval("walking", min(20), min(45)),
                Interval("in_vehicle", min(50), null),
            ),
            out,
        )
    }

    @Test
    fun `ayni tip ikinci kez basladiginda ikinci aralik acilir`() {
        val out = ActivityIntervals.fold(
            listOf(enter("walking", 0), exit("walking", 20), enter("walking", 60), exit("walking", 90)),
        )
        assertEquals(
            listOf(Interval("walking", min(0), min(20)), Interval("walking", min(60), min(90))),
            out,
        )
    }
}
