package com.evaitec.wellness

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import kotlin.math.PI
import kotlin.math.sin

class SnoreAnalyzerTest {

    private val rate = 8000

    /** Room tone: low-level noise only. */
    private fun quiet(seconds: Double, amplitude: Int = 20): ShortArray {
        val n = (rate * seconds).toInt()
        return ShortArray(n) { i -> (amplitude * sin(2 * PI * 90 * i / rate)).toInt().toShort() }
    }

    private fun burst(seconds: Double, amplitude: Int = 9000): ShortArray {
        val n = (rate * seconds).toInt()
        return ShortArray(n) { i -> (amplitude * sin(2 * PI * 160 * i / rate)).toInt().toShort() }
    }

    private fun concat(vararg parts: ShortArray): ShortArray {
        val out = ShortArray(parts.sumOf { it.size })
        var at = 0
        for (p in parts) {
            p.copyInto(out, at)
            at += p.size
        }
        return out
    }

    @Test
    fun `a quiet room produces no bursts`() {
        val result = SnoreAnalyzer.analyze(quiet(8.0), rate)
        assertEquals(0, result.bursts)
        assertEquals(0, result.burstMs)
    }

    @Test
    fun `rhythmic loud bursts are counted`() {
        // Three ~1.5 s snores separated by 2 s of quiet.
        val samples = concat(
            quiet(1.0), burst(1.5), quiet(2.0),
            burst(1.5), quiet(2.0), burst(1.5), quiet(1.0),
        )
        val result = SnoreAnalyzer.analyze(samples, rate)
        assertEquals(3, result.bursts)
        assertTrue("burstMs=${result.burstMs}", result.burstMs in 3000..6000)
    }

    @Test
    fun `a continuous noise is not a snore`() {
        // A fan or traffic: loud but never stops, so it lifts the floor instead.
        val result = SnoreAnalyzer.analyze(burst(10.0, amplitude = 4000), rate)
        assertEquals(0, result.bursts)
    }

    @Test
    fun `a single click is too short to count`() {
        val result = SnoreAnalyzer.analyze(concat(quiet(2.0), burst(0.25), quiet(2.0)), rate)
        assertEquals(0, result.bursts)
    }

    @Test
    fun `the pause after a snore is measured`() {
        val result = SnoreAnalyzer.analyze(
            concat(quiet(0.5), burst(1.0), quiet(6.0), burst(1.0), quiet(0.5)),
            rate,
        )
        assertTrue("pause=${result.pauseAfterBurstMs}", result.pauseAfterBurstMs >= 5000)
    }

    @Test
    fun `duty cycled windows scale up to a night estimate`() {
        // 4 s listened out of every 30 s -> a 7.5x scale factor.
        val session = SleepSession(listenMs = 4000, periodMs = 30000, startedAt = 0L)
        repeat(60) { session.add(SnoreAnalyzer.WindowResult(2, 2000, 30.0, 60.0, 0)) }
        val summary = session.summary(endedAt = 30 * 60 * 1000L)
        assertEquals(30, summary.monitoredMin)
        assertEquals(15, summary.snoreMin) // 60 windows * 2000 ms * 7.5 / 60000
        assertEquals(900, summary.snoreEpisodes)
        assertTrue(summary.estimated)
    }
}
