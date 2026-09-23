package com.evaitec.wellness

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.Settings
import com.evaitec.ota.OtaManifest
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

        /**
         * Yayindaki dosyanin sha256'si - kaynaktaki (HuggingFace) degerle ayni dogrulandi.
         * APK'daki kilidin esi: dosya degistirilirse motor onu hic acmaz. Dosya yenilenirse
         * bu sabit de guncellenir, yoksa indirme reddedilir.
         */
        const val MODEL_SHA256 = "e3d981c01aeaaac69a84ffa0d4be13281b3176731063f1bea1c9fe6887bd9dee"
        /** Bu model dosyasinin KV onbellegi 1280 token; ustu calisma aninda hata. */
        const val MAX_TOKENS = 1280

        @Volatile private var engine: LlmInference? = null
    }

    private fun internalFile(): File = File(File(context.filesDir, "llm").apply { mkdirs() }, MODEL_FILE)

    /**
     * Kalici kopya: /sdcard/evaitec/llm. Uygulama kaldirilinca silinmez, bir sonraki
     * kurulum ayni dosyayi bulur. Yalniz "tum dosyalara erisim" verilmisse kullanilabilir
     * (Android 11+); izin yoksa null doner ve her sey eskisi gibi uygulama klasorunde kalir.
     */
    private fun externalFile(): File? =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R && Environment.isExternalStorageManager())
            File(Environment.getExternalStorageDirectory(), "evaitec/llm/$MODEL_FILE")
        else null

    /** Okuma: kalici kopya varsa o, yoksa uygulama klasoru. */
    private fun modelFile(): File = externalFile()?.takeIf { it.exists() } ?: internalFile()

    /** Indirme hedefi: izin varsa dogrudan kalici klasore insin, sonra tasimaya gerek kalmasin. */
    private fun downloadTarget(): File =
        externalFile()?.also { it.parentFile?.mkdirs() } ?: internalFile()

    @PluginMethod
    fun status(call: PluginCall) {
        val file = modelFile()
        call.resolve(
            JSObject()
                .put("ready", file.exists())
                .put("sizeMb", if (file.exists()) file.length() / (1024 * 1024) else 0)
                .put("persistent", externalFile()?.exists() == true)
                .put("canPersist", Build.VERSION.SDK_INT >= Build.VERSION_CODES.R),
        )
    }

    /**
     * Modeli kaldir-kur'dan kurtar. Izin yoksa sistem ayar ekranini acar (kullanici
     * "tum dosyalara erisim"i verir, sonra bu dugmeye yeniden basar). Izin varsa
     * uygulama klasorundeki dosyayi kalici klasore tasir - yeniden indirme yok.
     */
    @PluginMethod
    fun persist(call: PluginCall) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R)
            return call.resolve(JSObject().put("ok", false).put("status", "Android 11 ve ustu gerekiyor"))
        val target = externalFile()
        if (target == null) {
            context.startActivity(
                Intent(
                    Settings.ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION,
                    Uri.parse("package:${context.packageName}"),
                ).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK),
            )
            return call.resolve(JSObject().put("ok", false).put("status", "İzni ver, sonra tekrar bas"))
        }
        if (target.exists()) return call.resolve(JSObject().put("ok", true).put("status", "Model zaten kalıcı klasörde"))
        val source = internalFile()
        if (!source.exists()) return call.resolve(JSObject().put("ok", true).put("status", "Model indirilince kalıcı klasöre inecek"))
        thread(isDaemon = true) {
            notifyListeners("modelDownload", JSObject().put("status", "Kalıcı klasöre taşınıyor"))
            // Farkli dosya sistemleri: renameTo calismaz, kopyala-sil gerekiyor (~530 MB).
            val result = runCatching {
                target.parentFile?.mkdirs()
                source.copyTo(target, overwrite = true)
                source.delete()
            }
            if (result.isFailure) target.delete()
            call.resolve(
                JSObject()
                    .put("ok", result.isSuccess)
                    .put("status", result.fold({ "Model kalıcı klasörde" }, { "Taşınamadı: ${it.message}" })),
            )
        }
    }

    /** Ara durumlar `modelDownload` olayiyla (OTA'daki `phoneUpdate` deseni). */
    @PluginMethod
    fun download(call: PluginCall) {
        thread(isDaemon = true) {
            val target = downloadTarget()
            val part = File(target.path + ".part")
            val result = runCatching {
                OtaUpdater.fetchTo(MODEL_URL, part, "evaitec-llm") { pct ->
                    notifyListeners("modelDownload", JSObject().put("status", "İndiriliyor %$pct"))
                }
                notifyListeners("modelDownload", JSObject().put("status", "Doğrulanıyor"))
                val actual = part.inputStream().use { OtaManifest.sha256(it) }
                check(OtaManifest.matches(actual, MODEL_SHA256)) { "sha256 tutmadı" }
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
        internalFile().delete()
        externalFile()?.delete()
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
