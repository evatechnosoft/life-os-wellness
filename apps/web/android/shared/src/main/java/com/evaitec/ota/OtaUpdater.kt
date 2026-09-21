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
        // Surum adda: kesilen indirme ayni surumde kaldigi yerden surer, eski surumun
        // yarim dosyasiyla birlesmez.
        val apk = File(File(context.cacheDir, "ota").apply { mkdirs() }, "${app.id}-${app.versionCode}.apk")
        fetchTo(app.url, apk, "evaitec-ota/$appId", onProgress)
        ApkInstaller.install(context, apk, app)
            .onFailure { apk.delete() } // bozuk/yanlis dosya kalirsa her deneme ayni yerde patlar
            .getOrThrow()
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
        val conn = open(url, "evaitec-ota/$appId")
        return try {
            conn.inputStream.readBytes()
        } finally {
            conn.disconnect()
        }
    }

    companion object {
        /**
         * Buyuk dosyayi diske akitir, yuzdeyi bildirir. APK ve cihaz-ici model ayni yolu
         * kullanir (LocalLlmPlugin) - iki indirme dongusu iki farkli hata davranisi olurdu.
         */
        fun fetchTo(url: String, target: File, userAgent: String, onProgress: (Int) -> Unit) {
            // Saatte ekran kapanip baglanti dusunce indirme yarim kaliyordu; yarim dosya
            // duruyorsa bastan degil kaldigi yerden istenir (sunucu destekmezse 200 doner).
            val from = if (target.exists()) target.length() else 0L
            val conn = open(url, userAgent, from)
            try {
                val resumed = conn.responseCode == 206
                val total = totalOf(conn.responseCode, from, conn.contentLengthLong)
                java.io.FileOutputStream(target, resumed).use { out ->
                    conn.inputStream.use { input ->
                        val buf = ByteArray(64 * 1024)
                        var written = if (resumed) from else 0L
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
                // Yarim inen dosya sessizce kalirsa APK kurulumu sha256'da patlar ama model
                // dosyasinin dogrulayicisi yok - kesilen indirme burada yakalanir.
                if (total > 0 && target.length() != total) {
                    error("indirme yarim kaldi: ${target.length()}/$total bayt")
                }
            } finally {
                conn.disconnect()
            }
        }

        /** 206 = sunucu kaldigi yerden veriyor (govde kalan kisim); 200 = bastan. */
        internal fun totalOf(code: Int, from: Long, contentLength: Long): Long =
            if (code == 206) from + contentLength else contentLength

        private fun open(url: String, userAgent: String, from: Long = 0L): HttpURLConnection {
            require(url.startsWith("https://")) { "https degil: $url" }
            val conn = URL(url).openConnection() as HttpURLConnection
            conn.connectTimeout = 15_000
            conn.readTimeout = 60_000
            conn.instanceFollowRedirects = true
            conn.setRequestProperty("User-Agent", userAgent)
            if (from > 0) conn.setRequestProperty("Range", "bytes=$from-")
            val code = conn.responseCode
            if (code !in 200..299) {
                conn.disconnect()
                error("HTTP $code")
            }
            return conn
        }
    }
}
