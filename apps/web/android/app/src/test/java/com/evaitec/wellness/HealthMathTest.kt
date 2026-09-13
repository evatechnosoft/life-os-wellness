package com.evaitec.wellness

import com.evaitec.wellness.HealthMath.CalorieEntry
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class HealthMathTest {

    @Test
    fun `ayni gunu yazan uc kaynak toplanmaz, en yuksegi alinir`() {
        val entries = listOf(
            CalorieEntry("2026-09-13", "fitbit", 1200.0),
            CalorieEntry("2026-09-13", "fitbit", 800.0),
            CalorieEntry("2026-09-13", "samsung", 1500.0),
            CalorieEntry("2026-09-13", "healthconnect", 300.0),
        )
        // fitbit 2000, samsung 1500, hc 300 -> 2000
        assertEquals(2000.0, HealthMath.dailyCalories(entries)["2026-09-13"]!!, 0.01)
    }

    @Test
    fun `her gun kendi icinde hesaplanir`() {
        val entries = listOf(
            CalorieEntry("2026-09-12", "fitbit", 1000.0),
            CalorieEntry("2026-09-13", "samsung", 2200.0),
        )
        val byDay = HealthMath.dailyCalories(entries)
        assertEquals(2, byDay.size)
        assertEquals(1000.0, byDay["2026-09-12"]!!, 0.01)
        assertEquals(2200.0, byDay["2026-09-13"]!!, 0.01)
    }

    @Test
    fun `kayit yoksa bos harita doner`() {
        assertEquals(0, HealthMath.dailyCalories(emptyList()).size)
    }

    @Test
    fun `dinlenme nabzi en dusuk yuzde onun ortancasidir`() {
        // 100 ornek: 50..149. En dusuk %10 = 50..59, ortancasi 55.
        val samples = (50L..149L).toList()
        assertEquals(55L, HealthMath.restingBpm(samples))
    }

    @Test
    fun `tek dusuk olcum hatasi sonucu asagi cekmez`() {
        val samples = listOf(30L) + (60L..79L).toList()
        // 21 ornek, en dusuk %10 = 2 ornek (30, 60) -> ortanca ikincisi: 60
        assertEquals(60L, HealthMath.restingBpm(samples))
    }

    @Test
    fun `gunduz hareketi ortalamayi sisirir, ortanca bandi korur`() {
        val resting = (58L..62L).toList()
        val active = List(50) { 140L }
        // 55 ornek -> en dusuk %10 = 5 ornek (58..62), ortancasi 60. Ortalama 133 olurdu.
        assertEquals(60L, HealthMath.restingBpm(resting + active))
    }

    @Test
    fun `az ornekli gun icin tahmin yapilmaz`() {
        assertNull(HealthMath.restingBpm(listOf(60L, 61L, 62L)))
        assertNull(HealthMath.restingBpm(emptyList()))
    }

    @Test
    fun `spo2 esigi daha dusuk - saat gece birkac kez olcer`() {
        val night = listOf(97.0, 96.0, 95.0, 98.0, 91.0)
        // 5 ornek -> en dusuk %10 = 1 ornek -> 91
        assertEquals(91.0, HealthMath.lowSpo2(night)!!, 0.01)
        assertNull(HealthMath.lowSpo2(listOf(97.0, 96.0)))
    }

    @Test
    fun `ortanca tek bozuk olcumu yutar`() {
        assertEquals(42.0, HealthMath.median(listOf(41.0, 42.0, 900.0))!!, 0.01)
        assertNull(HealthMath.median(emptyList<Double>()))
    }
}
