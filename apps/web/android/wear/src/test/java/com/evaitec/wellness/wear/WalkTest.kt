package com.evaitec.wellness.wear

import org.junit.Assert.assertEquals
import org.junit.Test

class WalkTest {

    @Test
    fun `zone boundaries follow SAAT-RUTIN bands`() {
        assertEquals(0, Walk.zone(87.9).no)
        assertEquals(1, Walk.zone(88.0).no)
        assertEquals(1, Walk.zone(106.0).no)
        assertEquals(2, Walk.zone(107.0).no)
        assertEquals(2, Walk.zone(123.0).no)
        assertEquals(3, Walk.zone(124.0).no)
        assertEquals(4, Walk.zone(142.0).no)
        assertEquals(5, Walk.zone(160.0).no)
        assertEquals(5, Walk.zone(200.0).no)
    }

    @Test
    fun `elapsed formats minutes and hours`() {
        assertEquals("0:00", Walk.elapsed(0))
        assertEquals("1:05", Walk.elapsed(65))
        assertEquals("59:59", Walk.elapsed(3599))
        assertEquals("1:02:05", Walk.elapsed(3725))
        assertEquals("0:00", Walk.elapsed(-5))
    }
}
