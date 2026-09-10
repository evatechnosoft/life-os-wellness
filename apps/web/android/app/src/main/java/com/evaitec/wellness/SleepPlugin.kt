package com.evaitec.wellness

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.content.ContextCompat
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.annotation.Permission
import com.getcapacitor.annotation.PermissionCallback

@CapacitorPlugin(
    name = "Sleep",
    permissions = [
        Permission(alias = "microphone", strings = [Manifest.permission.RECORD_AUDIO]),
    ],
)
class SleepPlugin : Plugin() {

    private fun hasMicrophone(): Boolean =
        ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO) ==
            PackageManager.PERMISSION_GRANTED

    @PluginMethod
    fun status(call: PluginCall) {
        val result = JSObject()
            .put("running", SleepService.isRunning)
            .put("microphoneGranted", hasMicrophone())
            .put("listenMs", SleepService.LISTEN_MS)
            .put("periodMs", SleepService.PERIOD_MS)
        SleepService.lastError?.let { result.put("error", it) }
        SleepService.lastSummary?.let { result.put("lastSummary", JSObject.fromJSONObject(it.toJson())) }
        call.resolve(result)
    }

    @PluginMethod
    fun start(call: PluginCall) {
        if (!hasMicrophone()) {
            requestPermissionForAlias("microphone", call, "microphoneCallback")
            return
        }
        launchService(call)
    }

    @PermissionCallback
    private fun microphoneCallback(call: PluginCall) {
        if (!hasMicrophone()) {
            call.reject("Mikrofon izni verilmedi")
            return
        }
        launchService(call)
    }

    private fun launchService(call: PluginCall) {
        val intent = Intent(context, SleepService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(intent)
        } else {
            context.startService(intent)
        }
        call.resolve(JSObject().put("running", true))
    }

    @PluginMethod
    fun stop(call: PluginCall) {
        val summary = SleepService.session?.summary(System.currentTimeMillis())
            ?: SleepService.lastSummary
        context.stopService(Intent(context, SleepService::class.java))
        val result = JSObject().put("running", false)
        summary?.let { result.put("summary", JSObject.fromJSONObject(it.toJson())) }
        call.resolve(result)
    }
}
