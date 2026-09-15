package com.evaitec.wellness

import com.evaitec.ota.OtaUpdater
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.google.mediapipe.tasks.genai.llminference.LlmInference
import java.io.File
import kotlin.concurrent.thread

/**
 * Cihaz-ici Eva: sunucu yokken Gemma 3 1B (int4) telefonda calisir. Persona ve baglam
 * JS'ten hazir gelir (apps/api/src/persona.ts ayni metin); burasi yalniz modeli tutar,
 * indirir ve calistirir. Model dosyasi ~530 MB, calisirken ~1.1 GB RAM - o yuzden
 * indirme her zaman kullanicinin dugmesiyle, motor ilk soruda tembel kurulur.
 *
 * Model HF'de Gemma lisansiyla kapili; telefon oraya gidemez. Dosya bir kez lisans
 * kabul edilerek indirilip repo'nun `models` yayinina konur - adres sabit, etiket yok.
 */
@CapacitorPlugin(name = "LocalLlm")
class LocalLlmPlugin : Plugin() {

    companion object {
        const val MODEL_URL =
            "https://github.com/evatechnosoft/life-os-wellness/releases/download/models/gemma3-1b-it-int4.task"
        const val MODEL_FILE = "gemma3-1b-it-int4.task"
        /** Bu model dosyasinin KV onbellegi 1280 token; ustu calisma aninda hata. */
        const val MAX_TOKENS = 1280

        @Volatile private var engine: LlmInference? = null
    }

    private fun modelFile(): File = File(File(context.filesDir, "llm").apply { mkdirs() }, MODEL_FILE)

    @PluginMethod
    fun status(call: PluginCall) {
        val file = modelFile()
        call.resolve(
            JSObject()
                .put("ready", file.exists())
                .put("sizeMb", if (file.exists()) file.length() / (1024 * 1024) else 0),
        )
    }

    /** Ara durumlar `modelDownload` olayiyla (OTA'daki `phoneUpdate` deseni). */
    @PluginMethod
    fun download(call: PluginCall) {
        thread(isDaemon = true) {
            val target = modelFile()
            val part = File(target.path + ".part")
            val result = runCatching {
                OtaUpdater.fetchTo(MODEL_URL, part, "evaitec-llm") { pct ->
                    notifyListeners("modelDownload", JSObject().put("status", "İndiriliyor %$pct"))
                }
                check(part.length() > 100L * 1024 * 1024) { "dosya beklenenden küçük" }
                check(part.renameTo(target)) { "dosya taşınamadı" }
            }
            part.delete()
            call.resolve(
                JSObject()
                    .put("ok", result.isSuccess)
                    .put("status", result.fold({ "Model hazır" }, { "İndirilemedi: ${it.message}" })),
            )
        }
    }

    @PluginMethod
    fun remove(call: PluginCall) {
        engine?.close()
        engine = null
        modelFile().delete()
        call.resolve()
    }

    /** Tek atis: istem JS'te kurulur (Gemma sohbet sablonu dahil), burasi yalniz uretir. */
    @PluginMethod
    fun generate(call: PluginCall) {
        val prompt = call.getString("prompt")
        if (prompt.isNullOrBlank()) return call.reject("prompt bos")
        thread(isDaemon = true) {
            runCatching { engine().generateResponse(prompt) }
                .fold({ call.resolve(JSObject().put("text", it)) }, { call.reject("Model yanıt veremedi: ${it.message}") })
        }
    }

    private fun engine(): LlmInference {
        engine?.let { return it }
        synchronized(LocalLlmPlugin::class.java) {
            engine?.let { return it }
            check(modelFile().exists()) { "model indirilmemiş" }
            val options = LlmInference.LlmInferenceOptions.builder()
                .setModelPath(modelFile().path)
                .setMaxTokens(MAX_TOKENS)
                .setMaxTopK(40)
                .build()
            return LlmInference.createFromOptions(context, options).also { engine = it }
        }
    }
}
