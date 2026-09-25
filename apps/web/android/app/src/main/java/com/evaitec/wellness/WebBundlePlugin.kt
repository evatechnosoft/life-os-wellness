package com.evaitec.wellness

import android.app.Activity
import androidx.core.content.pm.PackageInfoCompat
import com.evaitec.ota.OtaUpdater
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.plugin.WebView
import java.io.File
import kotlin.concurrent.thread

/**
 * Canli web paketi (lib/webBundle.ts). Sunucudaki native derlemeyi files/web/<surum>
 * altina indirir ve Capacitor'in kendi "serverBasePath" tercihine yazar: bir sonraki
 * acilista WebView oradan acar, origin yine https://localhost. Yeni APK kurulunca
 * Capacitor bu tercihi kendisi sifirlar (Bridge.isNewBinary).
 */
@CapacitorPlugin(name = "WebBundle")
class WebBundlePlugin : Plugin() {

    @PluginMethod
    fun info(call: PluginCall) {
        val pkg = context.packageManager.getPackageInfo(context.packageName, 0)
        call.resolve(JSObject().put("versionCode", PackageInfoCompat.getLongVersionCode(pkg)))
    }

    @PluginMethod
    fun install(call: PluginCall) {
        val base = call.getString("base") ?: return call.reject("base yok")
        val version = call.getString("version") ?: return call.reject("version yok")
        val files = call.getArray("files")?.toList<String>() ?: return call.reject("files yok")
        // Surum dizin adi olur, dosya adlari yol: manifest ne derse desin files/web disina yazilmaz.
        if (!base.startsWith("https://")) return call.reject("base https degil")
        if (!Regex("^[a-f0-9]{8,64}$").matches(version)) return call.reject("gecersiz surum")
        if (files.any { it.isEmpty() || it.startsWith("/") || it.contains("..") || it.contains('\\') }) {
            return call.reject("gecersiz dosya yolu")
        }

        thread(name = "web-bundle") {
            try {
                val root = File(context.filesDir, "web").apply { mkdirs() }
                val dir = File(root, version)
                val part = File(root, "$version.part")
                part.deleteRecursively()
                for (name in files) {
                    val target = File(part, name)
                    target.parentFile?.mkdirs()
                    OtaUpdater.fetchTo(base + name, target, "evaitec-web") {}
                }
                // Yarim paket acilirsa beyaz ekran: index yoksa eski paket yerinde kalir.
                if (!File(part, "index.html").isFile) error("index.html inmedi")
                dir.deleteRecursively()
                if (!part.renameTo(dir)) error("paket yerine konamadi")

                context.getSharedPreferences(WebView.WEBVIEW_PREFS_NAME, Activity.MODE_PRIVATE)
                    .edit().putString(WebView.CAP_SERVER_PATH, dir.absolutePath).apply()

                // Calisan paket silinmez (dosyalari o an sunuluyor); gerisi temizlenir.
                val running = bridge.serverBasePath
                root.listFiles()?.filter { it != dir && it.absolutePath != running }?.forEach { it.deleteRecursively() }

                call.resolve(JSObject().put("path", dir.absolutePath))
            } catch (e: Exception) {
                call.reject(e.message ?: "paket indirilemedi")
            }
        }
    }
}
