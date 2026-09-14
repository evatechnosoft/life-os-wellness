package com.evaitec.ota

import org.json.JSONObject
import java.security.MessageDigest

/**
 * evaitecOTA - kurulum kitinin karar cekirdegi. Projeye ozel hicbir sey icermez
 * (uygulama adi, ekran, olcum, adres yok); baska bir repoya kopyalandiginda tek
 * yapilandirma dosyasi yazilir - burada wellness icin com/evaitec/wellness/ota/WellnessOta.kt.
 *
 * Manifest N uygulama tasir:
 * ```json
 * {"apps":[{"id":"wellness-wear","name":"Wellness (saat)","package":"com.evaitec.wellness",
 *           "versionCode":1400,"versionName":"0.14.0","apk":"wear-debug.apk",
 *           "url":"https://.../wear-debug.apk","sha256":"…"}]}
 * ```
 * Alan adlari evaglass `UpdateChecker` semasindan (`versionCode/versionName/apk/url/sha256`);
 * yeni olan yalniz kalemi tanimlayan `id`/`name`/`package` ve sabit iki alan yerine liste.
 * Tek kalemlik manifest de gecerli.
 *
 * Guvenlik: liste saldiri yuzeyini buyutuyor, o yuzden kalem bastan katı elenir -
 * eksik/bozuk alan, `https` olmayan adres ya da 64 hane hex olmayan `sha256` = kalem yok
 * sayilir. Cihazdaki kilitler ApkInstaller'da.
 */
object OtaManifest {

    /** Manifestteki tek kalem. Kurulacak paket ve ozet yalniz buradan gelir. */
    data class App(
        val id: String,
        val name: String,
        val packageName: String,
        val versionCode: Int,
        val versionName: String,
        val apk: String,
        val url: String,
        /** Kucuk harf, 64 hane. Indirilen dosya bununla dogrulanmadan kurulmaz. */
        val sha256: String,
    )

    sealed interface Decision {
        /** Kurulu surum manifesttekiyle ayni ya da daha yeni. */
        object UpToDate : Decision

        /** Guvenle kurulamaz: bozuk manifest, listede olmayan id, eksik/kotu alan. */
        data class Blocked(val reason: String) : Decision

        data class Available(val app: App) : Decision
    }

    /**
     * Manifestteki saglam kalemler. Bir kalem bozuksa yalniz o dusuyor - bir uygulamanin
     * yayin hatasi digerlerinin guncellemesini durdurmasin.
     */
    fun parse(manifestJson: String): List<App> {
        val apps = try {
            JSONObject(manifestJson).getJSONArray("apps")
        } catch (e: Exception) {
            return emptyList()
        }
        return (0 until apps.length()).mapNotNull { i ->
            runCatching { app(apps.getJSONObject(i)) }.getOrNull()
        }
    }

    /** Hangi kalemin kurulacagi cagiranin karari; cekirdek yalnizca "su id" der. */
    fun decide(manifestJson: String, appId: String, currentVersionCode: Int): Decision {
        val apps = parse(manifestJson)
        if (apps.isEmpty()) return Decision.Blocked("manifest okunamadi ya da bos")
        // Ayni id iki kez yazilmissa ilki kazanir - karar surumden surume degismesin.
        val app = apps.firstOrNull { it.id == appId }
            ?: return Decision.Blocked("manifestte '$appId' yok")
        if (app.versionCode <= currentVersionCode) return Decision.UpToDate
        return Decision.Available(app)
    }

    private fun app(o: JSONObject): App? {
        val id = o.optString("id").trim()
        val packageName = o.optString("package").trim()
        val versionCode = o.optInt("versionCode", -1)
        val apk = o.optString("apk").trim()
        val url = o.optString("url").trim()
        val sha256 = o.optString("sha256").trim().lowercase()
        if (id.isBlank() || packageName.isBlank() || versionCode < 0 || apk.isBlank()) return null
        // https zorunlu: cleartext indirmede araya giren APK'yi degistirebilir.
        if (!url.startsWith("https://")) return null
        if (!HEX64.matches(sha256)) return null
        return App(
            id = id,
            name = o.optString("name").trim().ifBlank { id },
            packageName = packageName,
            versionCode = versionCode,
            versionName = o.optString("versionName").trim().ifBlank { versionCode.toString() },
            apk = apk,
            url = url,
            sha256 = sha256,
        )
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

    private fun hex(bytes: ByteArray): String = bytes.joinToString("") { "%02x".format(it) }

    private val HEX64 = Regex("^[0-9a-f]{64}$")
}
