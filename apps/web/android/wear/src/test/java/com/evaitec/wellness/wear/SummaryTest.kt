package com.evaitec.wellness.wear

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class SummaryTest {

    @Test
    fun `full summary parses`() {
        val s = Summary.parse(
            """{"date":"2026-10-05","protein_g":23,"protein_goal":150,"kcal_avg7":2010,"kcal_max":1900,
               "weight_delta7":-0.4,"steps":6382,"plan":[{"id":"Leg_Press","name":"Leg press","sets":2,"last_kg":35}]}""",
        )!!
        assertEquals("2026-10-05", s.date)
        assertEquals(23, s.proteinG)
        assertEquals(150, s.proteinGoal)
        assertEquals(2010, s.kcalAvg7)
        assertEquals(1900, s.kcalMax)
        assertEquals(-0.4, s.weightDelta7!!, 1e-9)
        assertEquals(6382, s.steps)
        assertEquals(listOf(PlanItem("Leg_Press", "Leg press", 2, 35.0)), s.plan)
    }

    @Test
    fun `missing and null fields become null, plan defaults`() {
        val s = Summary.parse("""{"date":"2026-10-05","protein_g":null,"plan":[{"id":"Butterfly"},{"name":"idsiz"}]}""")!!
        assertNull(s.proteinG)
        assertNull(s.kcalAvg7)
        assertNull(s.steps)
        assertEquals(listOf(PlanItem("Butterfly", "Butterfly", 2, null)), s.plan)
    }

    @Test
    fun `garbage is null not a crash`() {
        assertNull(Summary.parse("not json"))
    }
}
