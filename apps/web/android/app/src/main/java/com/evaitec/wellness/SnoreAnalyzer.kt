package com.evaitec.wellness

import kotlin.math.log10
import kotlin.math.max
import kotlin.math.sqrt

/**
 * Turns raw microphone windows into snore statistics. Pure logic, no Android types,
 * so it is unit-testable on the JVM.
 *
 * The microphone is duty-cycled (a few seconds of every period), so durations are
 * estimates scaled from the sampled fraction, never exact measurements.
 *
 * ponytail: level+duration thresholds, not a trained classifier. Good enough to
 * separate "snoring" from "quiet room"; upgrade path is an on-device model
 * (MFCC + small CNN) if false positives from fans/traffic become a problem.
 */
object SnoreAnalyzer {

    /** 250 ms frames: long enough to average out clicks, short enough to time a snore. */
    const val FRAME_MS = 250

    /** A snore burst lasts roughly half a second to three seconds. */
    const val MIN_BURST_MS = 500
    const val MAX_BURST_MS = 3500

    /** How far above the room's noise floor a frame must be to count as a burst. */
    const val BURST_OVER_FLOOR_DB = 12.0

    /** Absolute floor guard: a silent room must never produce bursts. */
    const val MIN_BURST_DB = 38.0

    data class Frame(val db: Double)

    data class WindowResult(
        /** Bursts that look like snores in this window. */
        val bursts: Int,
        /** Milliseconds of this window covered by those bursts. */
        val burstMs: Int,
        /** Noise floor estimate for the window, dB. */
        val floorDb: Double,
        /** Loudest frame, dB. */
        val peakDb: Double,
        /** Longest run of quiet frames right after a burst, ms. */
        val pauseAfterBurstMs: Int,
    )

    /** dBFS-ish level of one frame, shifted so a silent room lands near 0 rather than -inf. */
    fun frameDb(samples: ShortArray, from: Int, to: Int): Double {
        if (to <= from) return 0.0
        var sum = 0.0
        for (i in from until to) {
            val v = samples[i].toDouble()
            sum += v * v
        }
        val rms = sqrt(sum / (to - from))
        if (rms < 1.0) return 0.0
        return 20.0 * log10(rms)
    }

    fun frames(samples: ShortArray, sampleRate: Int): List<Frame> {
        val frameSize = max(1, sampleRate * FRAME_MS / 1000)
        val result = ArrayList<Frame>(samples.size / frameSize + 1)
        var start = 0
        while (start + frameSize <= samples.size) {
            result.add(Frame(frameDb(samples, start, start + frameSize)))
            start += frameSize
        }
        return result
    }

    /** 20th percentile of frame levels: the room's own background, robust to bursts. */
    fun noiseFloor(frames: List<Frame>): Double {
        if (frames.isEmpty()) return 0.0
        val sorted = frames.map { it.db }.sorted()
        return sorted[(sorted.size * 20) / 100]
    }

    fun analyze(samples: ShortArray, sampleRate: Int): WindowResult {
        val frames = frames(samples, sampleRate)
        if (frames.isEmpty()) return WindowResult(0, 0, 0.0, 0.0, 0)

        val floor = noiseFloor(frames)
        val threshold = max(floor + BURST_OVER_FLOOR_DB, MIN_BURST_DB)

        var bursts = 0
        var burstMs = 0
        var runFrames = 0
        var quietRun = 0
        var pauseAfterBurst = 0
        var sawBurst = false

        fun closeRun() {
            val ms = runFrames * FRAME_MS
            if (ms in MIN_BURST_MS..MAX_BURST_MS) {
                bursts += 1
                burstMs += ms
                sawBurst = true
                quietRun = 0
            }
            runFrames = 0
        }

        for (frame in frames) {
            if (frame.db >= threshold) {
                if (sawBurst && quietRun > 0) {
                    pauseAfterBurst = max(pauseAfterBurst, quietRun * FRAME_MS)
                    quietRun = 0
                }
                runFrames += 1
            } else {
                closeRun()
                if (sawBurst) quietRun += 1
            }
        }
        closeRun()
        if (sawBurst && quietRun > 0) pauseAfterBurst = max(pauseAfterBurst, quietRun * FRAME_MS)

        return WindowResult(
            bursts = bursts,
            burstMs = burstMs,
            floorDb = floor,
            peakDb = frames.maxOf { it.db },
            pauseAfterBurstMs = pauseAfterBurst,
        )
    }
}
