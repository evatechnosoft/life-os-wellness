package com.evaitec.wellness

import android.content.Context
import com.evaitec.wellness.ota.OtaManifest
import com.google.android.gms.tasks.Tasks
import com.google.android.gms.wearable.Wearable
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.TimeUnit

/**
 * Saat APK'sini yayindan indirir ve Data Layer kanaliyla saate akitir.
 *
 * Neden telefon uzerinden: saatin kendi interneti Bluetooth vekilinden geciyor, megabaytlar
 * surunuyor. Telefon burada yalniz **tasiyici**: ne kurulacagina saat karar veriyor, gelen
 * dosyayi kendi cektigi manifestteki sha256 ve kendi imzasiyla dogruluyor
 * (wear/.../ApkReceiverService.kt + ApkInstaller.kt). Buradaki sha256 kontrolu ayni
 * manifeste dayanan erken bir eleme - bozuk dosya icin 10 MB'i bosuna gondermeyelim.
 *
 * Cagiran iplik bloke olur; WearBridgePlugin arka planda cagiriyor.
 */
object WearApkSender {

    /** Saat APK'si bu yola akiyor; karsiligi ApkReceiverService.PATH. */
    private const val PATH = "/apk"

    fun push(context: Context, onStatus: (String) -> Unit): Result<String> = runCatching {
        onStatus("Sürüm bilgisi okunuyor")
        val manifest = get(OtaManifest.MANIFEST_URL).decodeToString()
        // currentVersionCode = 0: telefon saatteki surumu bilmez, "yenisi var mi" karari
        // saatte veriliyor (ApkInstaller surum kilidi). Burada amac en son APK'yi tasimak.
        val update = when (val decision = OtaManifest.decide(manifest, 0, OtaManifest.Fields.WEAR)) {
            is OtaManifest.Decision.Available -> decision
            is OtaManifest.Decision.Blocked -> error(decision.reason)
            OtaManifest.Decision.UpToDate -> error("manifestte saat surumu yok")
        }

        onStatus("İndiriliyor: ${update.versionName}")
        val bytes = get(update.apkUrl)
        val actual = OtaManifest.sha256(bytes)
        if (!OtaManifest.matches(actual, update.sha256)) {
            error("indirilen APK'nin sha256'si manifestle tutmuyor - gonderilmedi")
        }

        val nodeClient = Wearable.getNodeClient(context)
        val node = Tasks.await(nodeClient.connectedNodes, 10, TimeUnit.SECONDS).firstOrNull()
            ?: error("bagli saat yok")

        onStatus("Saate gönderiliyor (${bytes.size / 1024} KB)")
        val channelClient = Wearable.getChannelClient(context)
        val channel = Tasks.await(channelClient.openChannel(node.id, PATH), 15, TimeUnit.SECONDS)
        try {
            Tasks.await(channelClient.getOutputStream(channel), 15, TimeUnit.SECONDS).use { out ->
                out.write(bytes)
                out.flush()
            }
        } finally {
            // Akis kapanmadan saat tarafi dosyanin bittigini anlamaz.
            runCatching { Tasks.await(channelClient.close(channel), 10, TimeUnit.SECONDS) }
        }
        "Saate gönderildi: ${update.versionName} — kurulumu saatten onayla"
    }

    private fun get(url: String): ByteArray {
        require(url.startsWith("https://")) { "https degil: $url" }
        val conn = URL(url).openConnection() as HttpURLConnection
        return try {
            conn.connectTimeout = 15_000
            conn.readTimeout = 60_000
            conn.instanceFollowRedirects = true
            conn.setRequestProperty("User-Agent", "wellness-phone")
            val code = conn.responseCode
            if (code !in 200..299) error("HTTP $code")
            conn.inputStream.readBytes()
        } finally {
            conn.disconnect()
        }
    }
}
