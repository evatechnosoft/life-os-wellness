package com.evaitec.wellness

import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.evaitec.ota.OtaManifest
import com.evaitec.wellness.ota.WellnessOta
import com.google.android.gms.wearable.Wearable
import java.util.concurrent.TimeUnit
import kotlin.concurrent.thread

/**
 * Saat kuyrugunu JS'e acar. Donusturmeyi JS yapar (src/lib/watch.ts) - sema orada.
 *
 * Telefonun kendi OTA'si da burada: saatle ayni evaitecOTA kiti, degisen yalniz kalem
 * kimligi (WellnessOta.PHONE_ID). Ikinci bir karar/kurulum mantigi yok.
 */
@CapacitorPlugin(name = "WearBridge")
class WearBridgePlugin : Plugin() {

    @PluginMethod
    fun drain(call: PluginCall) {
        val records = JSArray()
        WearBridgeService.drain(context).forEach { records.put(it) }
        call.resolve(JSObject().put("records", records))
    }

    /**
     * Saat APK'sini yayindan indirip saate akitir (WearApkSender). Uzun surer: indirme +
     * Bluetooth uzerinden aktarim. Ara durumlar `apkPush` olayiyla gidiyor, cagri yalniz
     * sonucla doner.
     */
    @PluginMethod
    fun pushApk(call: PluginCall) {
        thread(isDaemon = true) {
            val result = WearApkSender.push(context) { status ->
                notifyListeners("apkPush", JSObject().put("status", status))
            }
            call.resolve(
                JSObject()
                    .put("ok", result.isSuccess)
                    .put("status", result.fold({ it }, { "Gönderilemedi: ${it.message}" })),
            )
        }
    }

    /** Kurulu surum - ekranda gosterilir, JS'e sabit yazilmaz. */
    @PluginMethod
    fun version(call: PluginCall) {
        val info = context.packageManager.getPackageInfo(context.packageName, 0)
        call.resolve(
            JSObject()
                .put("versionName", info.versionName)
                .put("versionCode", info.longVersionCode),
        )
    }

    /**
     * Telefon icin guncelleme var mi. Ag isi; karar evaitecOTA cekirdeginde
     * (sadece-yukselt, https, sha256) - burada tekrarlanmiyor.
     */
    @PluginMethod
    fun checkUpdate(call: PluginCall) {
        thread(isDaemon = true) {
            val result = JSObject()
            when (val decision = WellnessOta.updater(context, WellnessOta.PHONE_ID).check()) {
                is OtaManifest.Decision.Available ->
                    result.put("state", "available").put("versionName", decision.app.versionName)
                is OtaManifest.Decision.Blocked ->
                    result.put("state", "blocked").put("reason", decision.reason)
                OtaManifest.Decision.UpToDate -> result.put("state", "upToDate")
            }
            call.resolve(result)
        }
    }

    /**
     * Guncellemeyi indirip sistem yukleyicisini acar. Yalniz kullanici bastiginda cagrilir -
     * sessiz kurulum yok. Ara durumlar `phoneUpdate` olayiyla gidiyor (saatteki `apkPush`
     * ile ayni desen), cagri yalniz sonucla doner.
     */
    @PluginMethod
    fun installUpdate(call: PluginCall) {
        thread(isDaemon = true) {
            val updater = WellnessOta.updater(context, WellnessOta.PHONE_ID)
            val status = when (val decision = updater.check()) {
                is OtaManifest.Decision.Blocked -> "Güncellenemedi: ${decision.reason}"
                OtaManifest.Decision.UpToDate -> "Zaten güncel"
                is OtaManifest.Decision.Available -> {
                    val app = decision.app
                    notifyListeners("phoneUpdate", JSObject().put("status", "İndiriliyor: ${app.versionName}"))
                    updater.download(app) { pct ->
                        notifyListeners("phoneUpdate", JSObject().put("status", "İndiriliyor %$pct"))
                    }.fold(
                        { "Kurulum istemi açıldı — onayla" },
                        { "Güncellenemedi: ${it.message}" },
                    )
                }
            }
            call.resolve(JSObject().put("status", status))
        }
    }

    /** Eslesmis bir saat var mi - "gonderiyorum ama gelmiyor" durumunu ayirt etmek icin. */
    @PluginMethod
    fun status(call: PluginCall) {
        val nodes = runCatching {
            Wearable.getNodeClient(context).connectedNodes.let {
                com.google.android.gms.tasks.Tasks.await(it, 5, TimeUnit.SECONDS)
            }
        }
        call.resolve(
            JSObject()
                .put("connectedNodes", nodes.getOrNull()?.size ?: 0)
                .put("error", nodes.exceptionOrNull()?.message),
        )
    }
}
