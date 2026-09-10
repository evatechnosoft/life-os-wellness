package com.evaitec.wellness

import org.json.JSONObject
import kotlin.math.roundToInt

/**
 * Accumulates duty-cycled windows into one night's summary.
 *
 * Because the microphone only listens `listenMs` out of every `periodMs`, snore
 * minutes are an estimate: measured snoring inside the sampled slices, scaled up
 * by the duty factor. The summary says so via [SleepSummary.estimated].
 */
class SleepSession(
    private val listenMs: Int,
    private val periodMs: Int,
    val startedAt: Long,
) {
    private var windows = 0
    private var burstCount = 0
    private var burstMs = 0L
    private var loudWindows = 0
    private var longestPauseMs = 0
    private var lastFloorDb = 0.0

    fun add(result: SnoreAnalyzer.WindowResult) {
        windows += 1
        burstCount += result.bursts
        burstMs += result.burstMs
        if (result.bursts > 0) loudWindows += 1
        if (result.pauseAfterBurstMs > longestPauseMs) longestPauseMs = result.pauseAfterBurstMs
        lastFloorDb = result.floorDb
    }

    fun summary(endedAt: Long): SleepSummary {
        val monitoredMs = (endedAt - startedAt).coerceAtLeast(0)
        val dutyFactor = if (listenMs > 0) periodMs.toDouble() / listenMs.toDouble() else 1.0
        return SleepSummary(
            monitoredMin = (monitoredMs / 60000.0).roundToInt(),
            snoreMin = (burstMs * dutyFactor / 60000.0).roundToInt(),
            snoreEpisodes = (burstCount * dutyFactor).roundToInt(),
            snoreWindowPct = if (windows == 0) 0 else (loudWindows * 100) / windows,
            longestPauseSec = longestPauseMs / 1000,
            noiseFloorDb = lastFloorDb.roundToInt(),
            windows = windows,
            estimated = true,
        )
    }
}

data class SleepSummary(
    val monitoredMin: Int,
    val snoreMin: Int,
    val snoreEpisodes: Int,
    val snoreWindowPct: Int,
    val longestPauseSec: Int,
    val noiseFloorDb: Int,
    val windows: Int,
    val estimated: Boolean,
) {
    fun toJson(): JSONObject = JSONObject()
        .put("monitoredMin", monitoredMin)
        .put("snoreMin", snoreMin)
        .put("snoreEpisodes", snoreEpisodes)
        .put("snoreWindowPct", snoreWindowPct)
        .put("longestPauseSec", longestPauseSec)
        .put("noiseFloorDb", noiseFloorDb)
        .put("windows", windows)
        .put("estimated", estimated)
}
