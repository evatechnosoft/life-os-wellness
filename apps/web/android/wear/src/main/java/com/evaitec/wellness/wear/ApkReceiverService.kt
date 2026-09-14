package com.evaitec.wellness.wear

import android.content.Context
import android.util.Log
import com.evaitec.ota.ApkInstaller
import com.google.android.gms.tasks.Tasks
import com.google.android.gms.wearable.ChannelClient
import com.google.android.gms.wearable.WearableListenerService
import java.io.File
import java.util.concurrent.TimeUnit

/**
 * Telefon saat APK'sini Data Layer kanaliyla yollar, bu servis alir.
 *
 * Neden telefon uzerinden: saatin kendi interneti Bluetooth vekili uzerinden gidiyor ve
 * megabaytlar surunuyor; telefonun agi hizli. Telefon yalniz **tasiyici** - neyin
 * kurulacagina saat karar verir: beklenen kalem telefondan degil, manifestten okunur
 * (WearUpdater.wearApp), sonra ApkInstaller'in sha256/paket/surum/imza kilitleri gecilir.
 * Manifest okunamazsa kurulum yapilmaz: dogrulanmamis APK kurmaktansa guncellememek.
 *
 * Yol sozlesmesi telefonda: app/src/main/java/com/evaitec/wellness/WearApkSender.kt.
 */
class ApkReceiverService : WearableListenerService() {

    override fun onChannelOpened(channel: ChannelClient.Channel) {
        if (channel.path != PATH) return
        val client = com.google.android.gms.wearable.Wearable.getChannelClient(this)
        val apk = File(File(cacheDir, "ota").apply { mkdirs() }, "wellness-wear.apk")
        val result = runCatching {
            val app = WearUpdater(this).wearApp().getOrThrow()
            Tasks.await(client.getInputStream(channel), STREAM_TIMEOUT_SEC, TimeUnit.SECONDS).use { input ->
                apk.outputStream().use { output -> input.copyTo(output) }
            }
            ApkInstaller.install(this, apk, app).getOrThrow()
        }
        val status = result.fold({ "Telefondan gelen APK: kurulum istemi acildi" }) {
            apk.delete()
            "Telefondan gelen APK reddedildi: ${it.message}"
        }
        Log.i(TAG, status)
        writeStatus(this, status)
        runCatching { Tasks.await(client.close(channel), 5, TimeUnit.SECONDS) }
    }

    companion object {
        const val PATH = "/apk"
        private const val TAG = "ApkReceiver"
        private const val STREAM_TIMEOUT_SEC = 60L
        private const val PREFS = "wear_ota"
        private const val KEY_STATUS = "last_status"

        private fun writeStatus(context: Context, status: String) {
            context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .edit().putString(KEY_STATUS, status).apply()
        }

        /** Servis arka planda calisiyor; sonucu kullanici ancak ekranda gorebilir. */
        fun lastStatus(context: Context): String? =
            context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY_STATUS, null)
    }
}
