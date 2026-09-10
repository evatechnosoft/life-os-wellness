package com.evaitec.wellness

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import android.os.Build
import android.os.IBinder
import android.util.Log
import kotlin.concurrent.thread

/**
 * Night microphone monitor.
 *
 * Battery is the whole design constraint: the microphone is opened for
 * [LISTEN_MS] out of every [PERIOD_MS], analysed in place, and released again.
 * Audio is never written to disk and never leaves the device: only counters
 * survive each window.
 */
class SleepService : Service() {

    companion object {
        const val CHANNEL_ID = "sleep_monitor"
        const val NOTIFICATION_ID = 4711
        const val SAMPLE_RATE = 8000
        const val LISTEN_MS = 4000
        const val PERIOD_MS = 30000

        @Volatile
        var session: SleepSession? = null
            private set

        @Volatile
        var lastSummary: SleepSummary? = null

        @Volatile
        var lastError: String? = null

        val isRunning: Boolean get() = session != null
    }

    @Volatile private var running = false

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (running) return START_STICKY
        running = true
        session = SleepSession(LISTEN_MS, PERIOD_MS, System.currentTimeMillis())
        lastError = null
        startForeground(NOTIFICATION_ID, notification())
        thread(name = "sleep-monitor", isDaemon = true) { monitor() }
        return START_STICKY
    }

    override fun onDestroy() {
        running = false
        session?.let { lastSummary = it.summary(System.currentTimeMillis()) }
        session = null
        super.onDestroy()
    }

    private fun monitor() {
        val minBuffer = AudioRecord.getMinBufferSize(
            SAMPLE_RATE,
            AudioFormat.CHANNEL_IN_MONO,
            AudioFormat.ENCODING_PCM_16BIT,
        )
        if (minBuffer <= 0) {
            lastError = "AudioRecord buffer unavailable"
            running = false
            return
        }
        val windowSamples = SAMPLE_RATE * LISTEN_MS / 1000
        val buffer = ShortArray(windowSamples)

        while (running) {
            val startedAt = System.currentTimeMillis()
            try {
                val filled = readWindow(minBuffer, buffer)
                if (filled != null && filled > 0) {
                    val slice = if (filled == buffer.size) buffer else buffer.copyOf(filled)
                    session?.add(SnoreAnalyzer.analyze(slice, SAMPLE_RATE))
                }
            } catch (e: SecurityException) {
                lastError = "microphone permission revoked"
                running = false
            } catch (e: Exception) {
                Log.w("SleepService", "window failed", e)
            }
            val elapsed = System.currentTimeMillis() - startedAt
            val idle = PERIOD_MS - elapsed
            if (running && idle > 0) Thread.sleep(idle)
        }
    }

    /** Opens the mic, fills one window, closes it again. Returns the sample count read. */
    private fun readWindow(minBuffer: Int, buffer: ShortArray): Int? {
        val recorder = AudioRecord(
            MediaRecorder.AudioSource.MIC,
            SAMPLE_RATE,
            AudioFormat.CHANNEL_IN_MONO,
            AudioFormat.ENCODING_PCM_16BIT,
            maxOf(minBuffer, buffer.size * 2),
        )
        try {
            if (recorder.state != AudioRecord.STATE_INITIALIZED) {
                lastError = "AudioRecord not initialised"
                return null
            }
            recorder.startRecording()
            var filled = 0
            while (filled < buffer.size && running) {
                val read = recorder.read(buffer, filled, buffer.size - filled)
                if (read <= 0) break
                filled += read
            }
            return filled
        } finally {
            try {
                recorder.stop()
            } catch (ignored: IllegalStateException) {
                // never started
            }
            recorder.release()
        }
    }

    private fun notification(): Notification {
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            manager.createNotificationChannel(
                NotificationChannel(CHANNEL_ID, "Uyku takibi", NotificationManager.IMPORTANCE_LOW).apply {
                    description = "Gece horlama olcumu calisirken gorunur"
                },
            )
        }
        val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Notification.Builder(this, CHANNEL_ID)
        } else {
            @Suppress("DEPRECATION")
            Notification.Builder(this)
        }
        return builder
            .setContentTitle("Uyku takibi acik")
            .setContentText("Mikrofon 30 saniyede bir 4 saniye dinliyor, kayit tutulmuyor")
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setOngoing(true)
            .build()
    }
}
