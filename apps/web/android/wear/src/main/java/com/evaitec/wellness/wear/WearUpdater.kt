package com.evaitec.wellness.wear

import android.content.Context
import com.evaitec.wellness.ota.OtaManifest
import java.io.File
import java.net.HttpURLConnection
import java.net.URL

/**
 * Saat kendini gunceller: manifesti cek -> sadece-yukselt karari -> APK'yi indir ->
 * ApkInstaller (sha256 + paket + imza + surum) -> sistem yukleyicisi.
 *
 * Manifest GitHub Releases'te public duruyor: indirmede kimlik dogrulama yok, dolayisiyla
 * release APK'sinda saglayici sirri bulunmasi gerekmiyor (AGENTS.md: secret kodda yok).
 *
 * Ag isi cagiranin ipliginde yapilir - bu sinif UI ipliginden cagrilmamali.
 */
class WearUpdater(private val context: Context) {

    /** Saatteki kurulu surum; manifest bundan buyuk degilse hicbir sey indirilmez. */
    private val currentVersionCode: Int
        get() = context.packageManager.getPackageInfo(context.packageName, 0).longVersionCode.toInt()

    fun check(): OtaManifest.Decision = try {
        OtaManifest.decide(get(OtaManifest.MANIFEST_URL).decodeToString(), currentVersionCode, OtaManifest.Fields.WEAR)
    } catch (e: Exception) {
        OtaManifest.Decision.Blocked("manifest indirilemedi: ${e.message}")
    }

    /** Karari uygula: indir, dogrula, kurulum istemini ac. */
    fun download(update: OtaManifest.Decision.Available, onProgress: (Int) -> Unit): Result<Unit> = runCatching {
        val apk = File(File(context.cacheDir, "ota").apply { mkdirs() }, "wellness-wear.apk")
        val conn = open(update.apkUrl)
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
        ApkInstaller.install(context, apk, update.sha256).getOrThrow()
    }

    /**
     * Telefondan kanalla gelen APK de ayni manifeste kilitli - beklenen ozeti buradan alir.
     * Kanal yolunda surum karari ApkInstaller'in kilidine birakiliyor (currentVersionCode = 0),
     * burada yalniz ozet lazim.
     */
    fun expectedSha256(): Result<String> = runCatching {
        when (val decision = OtaManifest.decide(get(OtaManifest.MANIFEST_URL).decodeToString(), 0, OtaManifest.Fields.WEAR)) {
            is OtaManifest.Decision.Available -> decision.sha256
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
