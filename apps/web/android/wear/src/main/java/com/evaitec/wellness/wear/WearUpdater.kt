package com.evaitec.wellness.wear

import android.content.Context
import com.evaitec.ota.ApkInstaller
import com.evaitec.ota.OtaManifest
import com.evaitec.wellness.ota.WellnessOta
import java.io.File
import java.net.HttpURLConnection
import java.net.URL

/**
 * Saat kendini gunceller: manifesti cek -> evaitecOTA karari -> APK'yi indir ->
 * ApkInstaller (sha256 + paket + surum + imza) -> sistem yukleyicisi.
 *
 * Karar ve kurulum cekirdegi projeye ozel degil (com.evaitec.ota); burasi yalnizca
 * hangi id'nin kurulacagini ve agi saglar.
 *
 * Ag isi cagiranin ipliginde yapilir - bu sinif UI ipliginden cagrilmamali.
 */
class WearUpdater(private val context: Context) {

    fun check(): OtaManifest.Decision = try {
        OtaManifest.decide(
            get(WellnessOta.MANIFEST_URL).decodeToString(),
            WellnessOta.WEAR_ID,
            ApkInstaller.installedVersionCode(context, context.packageName),
        )
    } catch (e: Exception) {
        OtaManifest.Decision.Blocked("manifest indirilemedi: ${e.message}")
    }

    /** Karari uygula: indir, dogrula, kurulum istemini ac. */
    fun download(app: OtaManifest.App, onProgress: (Int) -> Unit): Result<Unit> = runCatching {
        val apk = File(File(context.cacheDir, "ota").apply { mkdirs() }, "${app.id}.apk")
        val conn = open(app.url)
        try {
            val total = conn.contentLengthLong
            apk.outputStream().use { out ->
                conn.inputStream.use { input ->
                    val buf = ByteArray(64 * 1024)
                    var written = 0L
                    var lastPct = -1
                    while (true) {
                        val read = input.read(buf)
                        if (read <= 0) break
                        out.write(buf, 0, read)
                        written += read
                        if (total > 0) {
                            val pct = ((written * 100) / total).toInt()
                            if (pct != lastPct) {
                                lastPct = pct
                                onProgress(pct)
                            }
                        }
                    }
                }
            }
        } finally {
            conn.disconnect()
        }
        ApkInstaller.install(context, apk, app).getOrThrow()
    }

    /**
     * Telefondan kanalla gelen APK de ayni manifeste kilitli - beklenen kalemi buradan alir.
     * Surum karari ApkInstaller'in kilidine birakiliyor (currentVersionCode = 0).
     */
    fun wearApp(): Result<OtaManifest.App> = runCatching {
        when (val decision = OtaManifest.decide(get(WellnessOta.MANIFEST_URL).decodeToString(), WellnessOta.WEAR_ID, 0)) {
            is OtaManifest.Decision.Available -> decision.app
            is OtaManifest.Decision.Blocked -> error(decision.reason)
            OtaManifest.Decision.UpToDate -> error("manifestte saat surumu yok")
        }
    }

    private fun get(url: String): ByteArray {
        val conn = open(url)
        return try {
            conn.inputStream.readBytes()
        } finally {
            conn.disconnect()
        }
    }

    private fun open(url: String): HttpURLConnection {
        require(url.startsWith("https://")) { "https degil: $url" }
        val conn = URL(url).openConnection() as HttpURLConnection
        conn.connectTimeout = 15_000
        conn.readTimeout = 60_000
        conn.instanceFollowRedirects = true
        conn.setRequestProperty("User-Agent", "wellness-wear")
        val code = conn.responseCode
        if (code !in 200..299) {
            conn.disconnect()
            error("HTTP $code")
        }
        return conn
    }
}
