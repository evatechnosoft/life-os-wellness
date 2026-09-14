package com.evaitec.wellness

import com.evaitec.wellness.HealthMath.SegmentEntry
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * ExerciseSession'in segment dokumu. Semanin tekrar tasidigi dogrulandi
 * (docs/SENSORS-FEASIBILITY.md 4.3) ama bu alani dolduran bir uretici uygulama
 * bulunmadi - bu yuzden "bos liste" bir hata degil, beklenen durum.
 */
class ExerciseSegmentTest {

    @Test
    fun `segment yoksa hicbir seans donmez`() {
        assertEquals(0, HealthMath.sessionSegments(emptyList()).size)
        assertEquals(0, HealthMath.dailySegmentCount(emptyList()).size)
    }

    @Test
    fun `ayni seansin tekrarlari toplanir`() {
        val entries = listOf(
            SegmentEntry("2026-09-13", 1000L, type = 5, repetitions = 10, minutes = 2),
            SegmentEntry("2026-09-13", 1000L, type = 5, repetitions = 8, minutes = 2),
        )
        val session = HealthMath.sessionSegments(entries)[1000L]!!
        assertEquals(18, session.repsTotal)
        assertEquals(listOf(5), session.types)
        assertEquals(4L, session.minutes)
    }

    @Test
    fun `tekrari sifir ya da negatif olan segment toplama katilmaz`() {
        // PAUSE/REST segmentinde tekrar yok; negatif deger bozuk kaynak demek.
        val entries = listOf(
            SegmentEntry("2026-09-13", 1000L, type = 5, repetitions = 10, minutes = 2),
            SegmentEntry("2026-09-13", 1000L, type = 44, repetitions = 0, minutes = 1),
            SegmentEntry("2026-09-13", 1000L, type = 5, repetitions = -3, minutes = 1),
        )
        val session = HealthMath.sessionSegments(entries)[1000L]!!
        assertEquals(10, session.repsTotal)
        // Tip yine de bildirilir: seansta dinlenme oldugu bilgisi kayboluyor degil.
        assertEquals(listOf(5, 44), session.types)
    }

    @Test
    fun `ayni seansta farkli tipler ayri ayri listelenir, tekrar sirasi korunur`() {
        val entries = listOf(
            SegmentEntry("2026-09-13", 1000L, type = 5, repetitions = 10, minutes = 2),
            SegmentEntry("2026-09-13", 1000L, type = 11, repetitions = 5, minutes = 3),
            SegmentEntry("2026-09-13", 1000L, type = 5, repetitions = 10, minutes = 2),
        )
        val session = HealthMath.sessionSegments(entries)[1000L]!!
        assertEquals(25, session.repsTotal)
        assertEquals(listOf(5, 11), session.types)
    }

    @Test
    fun `tanimadigimiz tip de gecer - eslemeyi cagiran taraf yapar`() {
        // 999 Health Connect'te tanimli degil; burada eleme yapilmaz, uydurma da.
        val session = HealthMath.sessionSegments(
            listOf(SegmentEntry("2026-09-13", 1000L, type = 999, repetitions = 7, minutes = 1)),
        )[1000L]!!
        assertEquals(listOf(999), session.types)
        assertEquals(7, session.repsTotal)
    }

    @Test
    fun `ayri seanslar karismaz`() {
        val entries = listOf(
            SegmentEntry("2026-09-13", 1000L, type = 5, repetitions = 10, minutes = 2),
            SegmentEntry("2026-09-13", 2000L, type = 51, repetitions = 12, minutes = 4),
        )
        val sessions = HealthMath.sessionSegments(entries)
        assertEquals(2, sessions.size)
        assertEquals(10, sessions[1000L]!!.repsTotal)
        assertEquals(12, sessions[2000L]!!.repsTotal)
    }

    @Test
    fun `gun basina segment sayisi seans farketmeksizin toplanir`() {
        val entries = listOf(
            SegmentEntry("2026-09-13", 1000L, type = 5, repetitions = 10, minutes = 2),
            SegmentEntry("2026-09-13", 2000L, type = 51, repetitions = 12, minutes = 4),
            SegmentEntry("2026-09-14", 3000L, type = 51, repetitions = 12, minutes = 4),
        )
        val byDay = HealthMath.dailySegmentCount(entries)
        assertEquals(2, byDay["2026-09-13"])
        assertEquals(1, byDay["2026-09-14"])
    }

    @Test
    fun `hicbir segmentinde tekrar yoksa repsTotal sifir kalir`() {
        // Saat seansi segmentledi ama tekrar saymadi: uydurulmuyor, sifir doner.
        val session = HealthMath.sessionSegments(
            listOf(SegmentEntry("2026-09-13", 1000L, type = 46, repetitions = 0, minutes = 30)),
        )[1000L]!!
        assertEquals(0, session.repsTotal)
        assertEquals(30L, session.minutes)
        assertTrue(session.types.isNotEmpty())
    }

    @Test
    fun `olmayan seans null doner`() {
        assertNull(HealthMath.sessionSegments(emptyList())[42L])
    }
}
