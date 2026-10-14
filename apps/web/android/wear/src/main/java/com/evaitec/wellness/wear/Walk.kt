package com.evaitec.wellness.wear

/**
 * Yuruyus ekraninin saf mantigi: nabiz bolgesi ve gecen sure. Ekran/sensor yok, JUnit ile sinanir.
 * Bantlar docs/SAAT-RUTIN.md "Nabiz bolgeleri (22 Eyl)": Max HR 177 tabanli, Z2 = hedef.
 */
object Walk {
    data class Zone(val no: Int, val label: String, val color: Int)

    private val zones = listOf(
        Zone(0, "ısınma", 0xFF90A4AE.toInt()),
        Zone(1, "Z1 hafif", 0xFF4FC3F7.toInt()),
        Zone(2, "Z2 hedef", 0xFF66BB6A.toInt()),
        Zone(3, "Z3 tempolu", 0xFFFFEE58.toInt()),
        Zone(4, "Z4 sert", 0xFFFFA726.toInt()),
        Zone(5, "Z5 sınır", 0xFFEF5350.toInt()),
    )

    /** Alt sinirlar: Z1 88, Z2 107, Z3 124, Z4 142, Z5 160. */
    private val floors = intArrayOf(88, 107, 124, 142, 160)

    fun zone(bpm: Double): Zone = zones[floors.count { bpm >= it }]

    /** 65 s -> "1:05", 3725 s -> "1:02:05". */
    fun elapsed(sec: Long): String {
        val s = sec.coerceAtLeast(0)
        val h = s / 3600
        val m = s % 3600 / 60
        val ss = s % 60
        return if (h > 0) "%d:%02d:%02d".format(h, m, ss) else "%d:%02d".format(m, ss)
    }
}
