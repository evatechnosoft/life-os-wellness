package com.evaitec.wellness

import com.evaitec.wellness.HealthMath.BpmSample
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Yuksek nabiz penceresi: saat canli nabiz vermez, elimizde gecmise donuk
 * ornekler var. Bu testler pencere cikarmanin kenar durumlarini sabitler.
 */
class HighBpmWindowTest {

    /** 2026-09-13 12:00 yerel degil, UTC epoch - fonksiyon saat dilimi bilmez. */
    private val base = 1_757_764_800_000L

    private fun min(n: Long) = base + n * 60_000L

    private fun samples(vararg pairs: Pair<Long, Long>) =
        pairs.map { (m, bpm) -> BpmSample(min(m), bpm) }

    @Test
    fun `ornek yoksa pencere yoktur`() {
        assertEquals(emptyList<HealthMath.HrWindow>(), HealthMath.highBpmWindows(emptyList()))
    }

    @Test
    fun `tek ornek pencere olusturmaz - suresi sifir`() {
        assertEquals(emptyList<HealthMath.HrWindow>(), HealthMath.highBpmWindows(samples(0L to 150L)))
    }

    @Test
    fun `esigin hemen altindaki ornekler sayilmaz`() {
        val below = (0L..30L step 5L).map { BpmSample(min(it), 119L) }
        assertEquals(emptyList<HealthMath.HrWindow>(), HealthMath.highBpmWindows(below))
    }

    @Test
    fun `esige esit ornek pencereye girer`() {
        val at = (0L..30L step 5L).map { BpmSample(min(it), 120L) }
        val windows = HealthMath.highBpmWindows(at)
        assertEquals(1, windows.size)
        assertEquals(30L, windows[0].durationMinutes)
    }

    @Test
    fun `minimum sureyi doldurmayan sicrama elenir`() {
        // 2 dakikalik sicrama: gurultu, antrenman degil.
        val spike = listOf(0L, 1L, 2L).map { BpmSample(min(it), 145L) }
        assertEquals(emptyList<HealthMath.HrWindow>(), HealthMath.highBpmWindows(spike))
    }

    @Test
    fun `kisa dusus pencereyi bolmez - set arasi dinlenme`() {
        val hr = samples(
            0L to 130L, 3L to 140L, 6L to 135L,
            8L to 95L, // set arasi, 2 dk sonra tekrar yukselecek
            10L to 138L, 15L to 150L, 20L to 132L,
        )
        val windows = HealthMath.highBpmWindows(hr)
        assertEquals(1, windows.size)
        assertEquals(20L, windows[0].durationMinutes)
        assertEquals(150L, windows[0].peakBpm)
        // Ortalama esik ustu orneklerden: 130+140+135+138+150+132 = 825 / 6
        assertEquals(138L, windows[0].avgBpm)
    }

    @Test
    fun `uzun dusus pencereyi ikiye boler`() {
        val hr = samples(
            0L to 130L, 5L to 140L, 10L to 135L,
            // 20 dakika sakin: ayri iki seans
            15L to 80L, 25L to 78L,
            35L to 128L, 40L to 133L, 45L to 141L,
        )
        val windows = HealthMath.highBpmWindows(hr)
        assertEquals(2, windows.size)
        assertEquals(min(0L), windows[0].startMillis)
        assertEquals(min(10L), windows[0].endMillis)
        assertEquals(min(35L), windows[1].startMillis)
        assertEquals(min(45L), windows[1].endMillis)
    }

    @Test
    fun `gun siniri pencereyi bolmez - mutlak zaman, takvim degil`() {
        // 23:50 - 00:20 arasi sureklilik: tek seans.
        val hr = (0L..30L step 5L).map { BpmSample(min(710L + it), 135L) }
        val windows = HealthMath.highBpmWindows(hr)
        assertEquals(1, windows.size)
        assertEquals(30L, windows[0].durationMinutes)
    }

    @Test
    fun `siralanmamis ornekler once siralanir`() {
        val hr = samples(20L to 132L, 0L to 130L, 10L to 150L, 5L to 140L)
        val windows = HealthMath.highBpmWindows(hr)
        assertEquals(1, windows.size)
        assertEquals(min(0L), windows[0].startMillis)
        assertEquals(min(20L), windows[0].endMillis)
        assertEquals(150L, windows[0].peakBpm)
    }

    @Test
    fun `esik ve minimum sure ayarlanabilir`() {
        val hr = samples(0L to 105L, 5L to 110L, 10L to 108L)
        assertTrue(HealthMath.highBpmWindows(hr).isEmpty())
        val windows = HealthMath.highBpmWindows(hr, thresholdBpm = 100L, minMinutes = 5L)
        assertEquals(1, windows.size)
        assertEquals(110L, windows[0].peakBpm)
    }
}
