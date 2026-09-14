package com.evaitec.wellness.ota

import org.json.JSONObject
import java.security.MessageDigest

/**
 * `latest.json` -> kurulum karari. Saf: ag yok, dosya yok, Android yok - bu yuzden
 * dogrudan unit testle kapatilabiliyor (wear/src/test/.../OtaManifestTest.kt).
 *
 * Tek manifest iki APK tasir: telefon (`apk`/`url`/`sha256`) ve saat
 * (`wearApk`/`wearUrl`/`wearSha256`). Uretimi: .github/workflows/apk.yml.
 *
 * Kurulum guvenligi burada baslar - kurucu, kabul ettigi kadar guvenlidir:
 *  - **sadece-yukselt**: versionCode <= mevcut -> guncelleme yok (downgrade ve kurulum dongusu),
 *  - **https zorunlu**: cleartext indirmede araya giren APK'yi degistirebilir,
 *  - **sha256 zorunlu**: 64 haneli hex yoksa aday bastan reddedilir.
 * Zincirin kalan iki halkasi cihazda: imza esitligi ve paket adi (ApkInstaller).
 *
 * Bu dosya :app ve :wear modullerinin ikisinde de derleniyor (sourceSets.srcDirs) -
 * iki kopya OTA mantigi = iki farkli guvenlik davranisi.
 */
object OtaManifest {

    /**
     * Yayin manifesti. `releases/latest/download/...` her zaman en son yayina gider -
     * etiket kodlanmiyor. Repo public: indirmede kimlik dogrulama yok, dolayisiyla
     * APK'da saglayici sirri tasinamaz (AGENTS.md: secret kodda yok).
     */
    const val MANIFEST_URL =
        "https://github.com/evatechnosoft/life-os-wellness/releases/latest/download/latest.json"

    /** Hangi artefaktin okunacagi. Karar mantigi ikisi icin de ayni. */
    data class Fields(val apk: String, val url: String, val sha256: String) {
        companion object {
            val PHONE = Fields("apk", "url", "sha256")
            val WEAR = Fields("wearApk", "wearUrl", "wearSha256")
        }
    }

    sealed interface Decision {
        /** Mevcut surum manifestteki kadar ya da daha yeni. */
        object UpToDate : Decision

        /** Yeni surum olabilir ama guvenle kurulamaz: bozuk manifest, eksik alan, kotu URL/sha. */
        data class Blocked(val reason: String) : Decision

        data class Available(
            val versionName: String,
            val apkName: String,
            val apkUrl: String,
            /** Kucuk harf, 64 hane. Indirilen dosya bununla dogrulanmadan kurulmaz. */
            val sha256: String,
        ) : Decision
    }

    fun decide(manifestJson: String, currentVersionCode: Int, fields: Fields): Decision {
        val m = try {
            JSONObject(manifestJson)
        } catch (e: Exception) {
            return Decision.Blocked("manifest okunamadi: ${e.message}")
        }
        val candidate = m.optInt("versionCode", -1)
        if (candidate < 0) return Decision.Blocked("versionCode yok")
        if (candidate <= currentVersionCode) return Decision.UpToDate

        val versionName = m.optString("versionName", "").ifBlank { candidate.toString() }
        val apkName = m.optString(fields.apk, "").trim()
        if (apkName.isBlank()) return Decision.Blocked("${fields.apk} alani yok")

        val url = m.optString(fields.url, "").trim()
        if (!url.startsWith("https://")) return Decision.Blocked("${fields.url} https degil")

        val sha256 = m.optString(fields.sha256, "").trim().lowercase()
        if (!HEX64.matches(sha256)) return Decision.Blocked("${fields.sha256} eksik ya da bozuk")

        return Decision.Available(versionName, apkName, url, sha256)
    }

    fun sha256(bytes: ByteArray): String = hex(MessageDigest.getInstance("SHA-256").digest(bytes))

    /** Akisla ozet - APK'yi bellege iki kez almamak icin. */
    fun sha256(input: java.io.InputStream): String {
        val digest = MessageDigest.getInstance("SHA-256")
        val buf = ByteArray(64 * 1024)
        while (true) {
            val read = input.read(buf)
            if (read <= 0) break
            digest.update(buf, 0, read)
        }
        return hex(digest.digest())
    }

    fun matches(actual: String, expected: String): Boolean = actual.equals(expected, ignoreCase = true)

    private fun hex(bytes: ByteArray): String =
        bytes.joinToString("") { "%02x".format(it) }

    private val HEX64 = Regex("^[0-9a-f]{64}$")
}
