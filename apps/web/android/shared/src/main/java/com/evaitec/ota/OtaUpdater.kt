package com.evaitec.ota

import android.content.Context
import java.io.File
import java.net.HttpURLConnection
import java.net.URL

/**
 * evaitecOTA - "kendini guncelle" akisinin tasiyicisi: manifesti cek -> [OtaManifest.decide]
 * -> APK'yi indir -> [ApkInstaller] (sha256 + paket + surum + imza) -> sistem yukleyicisi.
 *
 * Projeye ozel hicbir sey bilmez; adres ve kalem kimligi disaridan gelir (wellness'ta
 * com/evaitec/wellness/ota/WellnessOta.kt). Saat ve telefon **ayni** ornegi kullaniyor -
 * iki kopya ag/karar kodu = iki farkli guvenlik davranisi.
 *
 * Ag isi cagiranin ipliginde yapilir - bu sinif UI ipliginden cagrilmamali.
 */
class OtaUpdater(
    private val context: Context,
    private val manifestUrl: String,
    /** Manifestteki kalem kimligi - hangi uygulamanin guncellendigi yalniz buradan belli. */
    private val appId: String,
) {

    fun check(): OtaManifest.Decision = try {
        OtaManifest.decide(
            get(manifestUrl).decodeToString(),
            appId,
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
     * Baska bir yoldan (ornegin telefondan kanalla) gelen bir APK'nin beklenen kalemi.
     * Surum karari [ApkInstaller]'in kilidine birakiliyor (currentVersionCode = 0).
     */
    fun expected(): Result<OtaManifest.App> = runCatching {
        when (val decision = OtaManifest.decide(get(manifestUrl).decodeToString(), appId, 0)) {
            is OtaManifest.Decision.Available -> decision.app
            is OtaManifest.Decision.Blocked -> error(decision.reason)
            OtaManifest.Decision.UpToDate -> error("manifestte '$appId' surumu yok")
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
        conn.setRequestProperty("User-Agent", "evaitec-ota/$appId")
        val code = conn.responseCode
        if (code !in 200..299) {
            conn.disconnect()
            error("HTTP $code")
        }
        return conn
    }
}
