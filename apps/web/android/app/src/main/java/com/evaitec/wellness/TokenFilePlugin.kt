package com.evaitec.wellness

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.Settings
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import java.io.File

/**
 * API token'in kurulumdan bagimsiz kopyasi: /sdcard/evaitec/wellness-token.txt.
 * Kaldir-kur WebView deposunu (localStorage) siliyor; bu dosya kalir, yeni kurulum
 * token'i oradan okur. Dosya adb ile de konabilir (`adb push`). Okumak icin "tum
 * dosyalara erisim" gerekir (LocalLlmPlugin'in model klasoruyle ayni izin).
 */
@CapacitorPlugin(name = "TokenFile")
class TokenFilePlugin : Plugin() {

    private fun access(): Boolean =
        Build.VERSION.SDK_INT >= Build.VERSION_CODES.R && Environment.isExternalStorageManager()

    private fun file(): File = File(Environment.getExternalStorageDirectory(), "evaitec/wellness-token.txt")

    @PluginMethod
    fun read(call: PluginCall) {
        val result = JSObject().put("access", access())
        if (access()) {
            val token = file().takeIf { it.exists() }?.readText()?.trim()
            if (!token.isNullOrEmpty()) result.put("token", token)
        }
        call.resolve(result)
    }

    @PluginMethod
    fun write(call: PluginCall) {
        val token = call.getString("token")?.trim()
        if (token.isNullOrEmpty()) return call.reject("token bos")
        if (!access()) return call.resolve(JSObject().put("ok", false))
        val target = file()
        target.parentFile?.mkdirs()
        target.writeText(token)
        call.resolve(JSObject().put("ok", true))
    }

    /** Izin ekranini acar; kullanici verip geri donunce JS read()'i yeniden cagirir. */
    @PluginMethod
    fun requestAccess(call: PluginCall) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) return call.resolve(JSObject().put("ok", false))
        context.startActivity(
            Intent(
                Settings.ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION,
                Uri.parse("package:${context.packageName}"),
            ).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK),
        )
        call.resolve(JSObject().put("ok", true))
    }
}
