package com.evaitec.wellness.wear

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class SampleIntervalTest {

    @Test
    fun `no interval exists below two samples`() {
        assertNull(SampleInterval.averageMs(emptyList()))
        assertNull(SampleInterval.averageMs(listOf(1_000L)))
    }

    @Test
    fun `averages the gaps between consecutive samples`() {
        assertEquals(200L, SampleInterval.averageMs(listOf(1_000L, 1_200L, 1_400L)))
    }

    @Test
    fun `uneven gaps average out`() {
        // 100 + 300 = 400 over two gaps.
        assertEquals(200L, SampleInterval.averageMs(listOf(0L, 100L, 400L)))
    }

    @Test
    fun `out of order timestamps are sorted before measuring`() {
        // Health Services batches arrive as a container; ordering is not promised.
        assertEquals(200L, SampleInterval.averageMs(listOf(1_400L, 1_000L, 1_200L)))
    }

    @Test
    fun `a batch delivered at one instant reads as zero, not as an error`() {
        assertEquals(0L, SampleInterval.averageMs(listOf(500L, 500L)))
    }

    @Test
    fun `only the most recent samples count`() {
        val kept = SampleInterval.keepLast(listOf(1L, 2L, 3L, 4L), 900L, max = 3)
        assertEquals(listOf(3L, 4L, 900L), kept)
    }

    @Test
    fun `below the cap nothing is dropped`() {
        assertEquals(listOf(1L, 2L), SampleInterval.keepLast(listOf(1L), 2L, max = 8))
    }
}
