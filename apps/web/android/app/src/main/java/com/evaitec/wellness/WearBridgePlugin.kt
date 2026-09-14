package com.evaitec.wellness

import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.google.android.gms.wearable.Wearable
import java.util.concurrent.TimeUnit

/** Saat kuyrugunu JS'e acar. Donusturmeyi JS yapar (src/lib/watch.ts) - sema orada. */
@CapacitorPlugin(name = "WearBridge")
class WearBridgePlugin : Plugin() {

    @PluginMethod
    fun drain(call: PluginCall) {
        val records = JSArray()
        WearBridgeService.drain(context).forEach { records.put(it) }
        call.resolve(JSObject().put("records", records))
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
