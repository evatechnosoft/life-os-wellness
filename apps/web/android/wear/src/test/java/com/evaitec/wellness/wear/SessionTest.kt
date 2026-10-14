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

    @Test
    fun `ramp sets weight per set and extends set count`() {
        val ramp = PlanItem("Row", "Row", sets = 2, lastKg = 35.0, kgs = listOf(25.0, 30.0, 35.0))
        assertTrue(ramp.isRamp)
        assertEquals(3, ramp.totalSets)
        assertEquals(25.0, ramp.targetKg(1)!!, 0.0)
        assertEquals(35.0, ramp.targetKg(3)!!, 0.0)
        assertEquals(35.0, ramp.targetKg(4)!!, 0.0)
        val flat = PlanItem("Leg", "Leg", sets = 2, lastKg = 40.0, kgs = listOf(40.0, 40.0))
        assertFalse(flat.isRamp)
        assertEquals(40.0, PlanItem("x", "x", 2, 40.0).targetKg(2)!!, 0.0)
    }

    @Test
    fun `skip previous stop and done count`() {
        val s = Session(plan + PlanItem("Row", "Row", sets = 2, lastKg = null, kgs = listOf(25.0, 30.0, 35.0)))
        assertEquals(6, s.totalSets)
        s.next()
        assertEquals(1, s.doneSets)
        s.skip()
        assertEquals("Butterfly", s.current?.id)
        assertEquals(1, s.setNo)
        s.previous()
        assertEquals("Leg_Press", s.current?.id)
        s.previous()
        assertEquals("Leg_Press", s.current?.id)
        s.skip(); s.skip()
        assertEquals("Row", s.current?.id)
        s.stop()
        assertTrue(s.done)
        assertEquals(1, s.doneSets)
        s.previous()
        assertEquals("Row", s.current?.id)
        s.skip()
        assertTrue(s.done)
        s.skip()
        assertTrue(s.done)
    }
}
