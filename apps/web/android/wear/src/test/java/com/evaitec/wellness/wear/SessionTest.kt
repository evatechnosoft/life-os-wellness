package com.evaitec.wellness.wear

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import java.time.DayOfWeek

class SessionTest {

    private val plan = listOf(
        PlanItem("Leg_Press", "Leg press", sets = 2, lastKg = 35.0),
        PlanItem("Butterfly", "Butterfly", sets = 1, lastKg = null),
    )

    @Test
    fun `sets advance then exercises advance then done`() {
        val s = Session(plan)
        assertEquals("Leg_Press", s.current?.id)
        assertEquals(1, s.setNo)
        assertTrue(s.next())
        assertEquals(2, s.setNo)
        assertTrue(s.next())
        assertEquals("Butterfly", s.current?.id)
        assertEquals(1, s.setNo)
        assertFalse(s.next())
        assertTrue(s.done)
        assertNull(s.current)
        assertFalse(s.next())
    }

    @Test
    fun `rest counts down to zero and never below`() {
        assertEquals(90, Session.restRemainingSec(0, 0))
        assertEquals(60, Session.restRemainingSec(0, 30_000))
        assertEquals(0, Session.restRemainingSec(0, 90_000))
        assertEquals(0, Session.restRemainingSec(0, 500_000))
    }

    @Test
    fun `fallback plan only on gym days`() {
        assertEquals("Leg_Press", Session.fallbackPlan(DayOfWeek.MONDAY)?.first()?.id)
        assertEquals("Barbell_Hip_Thrust", Session.fallbackPlan(DayOfWeek.WEDNESDAY)?.first()?.id)
        assertEquals("Arnold_Dumbbell_Press", Session.fallbackPlan(DayOfWeek.FRIDAY)?.last()?.id)
        assertNull(Session.fallbackPlan(DayOfWeek.TUESDAY))
        assertNull(Session.fallbackPlan(DayOfWeek.SUNDAY))
        assertTrue(Session.fallbackPlan(DayOfWeek.MONDAY)!!.all { it.sets == 2 })
    }
}
