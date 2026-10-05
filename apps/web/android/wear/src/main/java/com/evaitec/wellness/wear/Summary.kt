package com.evaitec.wellness.wear

import org.json.JSONArray
import org.json.JSONObject

/**
 * Telefonun /wellness/summary yoluna yazdigi ozet. Uretici: apps/web/src/lib/watchSummary.ts.
 * Her alan eksik olabilir (telefon o veriyi henuz cekmemis olabilir) - eksik = null, satir gizlenir.
 */
data class Summary(
    val date: String?,
    val proteinG: Int?,
    val proteinGoal: Int?,
    val kcalAvg7: Int?,
    val kcalMax: Int?,
    val weightDelta7: Double?,
    val steps: Int?,
    val plan: List<PlanItem>,
) {
    companion object {
        /** Bozuk JSON -> null; eksik alan -> o alan null. */
        fun parse(json: String): Summary? {
            val o = runCatching { JSONObject(json) }.getOrNull() ?: return null
            val planArr = o.optJSONArray("plan") ?: JSONArray()
            val plan = (0 until planArr.length()).mapNotNull { i ->
                val p = planArr.optJSONObject(i) ?: return@mapNotNull null
                val id = p.optString("id", "")
                if (id.isEmpty()) return@mapNotNull null
                PlanItem(id, p.optString("name", id), p.optInt("sets", 2).coerceAtLeast(1), p.dbl("last_kg"))
            }
            return Summary(
                date = o.str("date"),
                proteinG = o.int("protein_g"),
                proteinGoal = o.int("protein_goal"),
                kcalAvg7 = o.int("kcal_avg7"),
                kcalMax = o.int("kcal_max"),
                weightDelta7 = o.dbl("weight_delta7"),
                steps = o.int("steps"),
                plan = plan,
            )
        }

        private fun JSONObject.str(k: String): String? = if (isNull(k)) null else optString(k)
        private fun JSONObject.int(k: String): Int? = if (isNull(k)) null else runCatching { getInt(k) }.getOrNull()
        private fun JSONObject.dbl(k: String): Double? = if (isNull(k)) null else runCatching { getDouble(k) }.getOrNull()
    }
}
