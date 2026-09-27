package com.evaitec.wellness

import android.app.DownloadManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.Settings
import com.evaitec.ota.OtaManifest
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.google.mediapipe.tasks.genai.llminference.LlmInference
import java.io.File
import kotlin.concurrent.thread

/**
 * Cihaz-ici Eva: sunucu yokken Gemma 3n E4B (int4) telefonda calisir. Persona ve baglam
 * JS'ten hazir gelir (apps/api/src/persona.ts ayni metin); burasi yalniz modeli tutar,
 * indirir ve calistirir. Model dosyasi ~4.4 GB, calisirken ~3-4 GB RAM - o yuzden
 * indirme her zaman kullanicinin dugmesiyle, motor ilk soruda tembel kurulur.
 *
 * Model HF'de Gemma lisansiyla kapili; telefon oraya gidemez. Dosya bir kez lisans
 * kabul edilerek indirilip sunucunun ./ota dizinine konur (GitHub release 2 GB siniri).
 */
@CapacitorPlugin(name = "LocalLlm")
class LocalLlmPlugin : Plugin() {

    companion object {
        const val MODEL_URL =
            "https://fit.evaitec.com/ota/gemma-3n-E4B-it-int4.task"
        const val MODEL_FILE = "gemma-3n-E4B-it-int4.task"

        /**
         * Yayindaki dosyanin sha256'si - kaynaktaki (HuggingFace) degerle ayni dogrulandi.
         * APK'daki kilidin esi: dosya degistirilirse motor onu hic acmaz. Dosya yenilenirse
         * bu sabit de guncellenir, yoksa indirme reddedilir.
         */
        const val MODEL_SHA256 = "2b8e9d04bf8c5c50346d248c5e24a7e65102251c94dee6f04d5dce5ce3e6ac4f"
        /** KV penceresi (istem + yanit); model kartindaki olcumler 4096 ile. */
        const val MAX_TOKENS = 4096
        /** Boyut kontrolu: tarayicidan inen dosyada sha256 yok, yarim dosya boyuttan yakalanir. */
        const val MODEL_BYTES = 4_405_655_031L
        private const val PREF_ID = "download_id"

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

    /**
     * Tarayiciyla indirilmis kopya: /sdcard/Download. Uygulama ici indirme takilirsa
     * fit.evaitec.com/ota/<dosya> tarayicida acilir; okumak icin "tum dosyalara erisim" gerekir.
     */
    private fun browserFile(): File? =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R && Environment.isExternalStorageManager())
            File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS), MODEL_FILE)
        else null

    /** Okuma: kalici kopya, yoksa tarayici indirmesi (tam boyutsa), yoksa uygulama klasoru. */
    private fun modelFile(): File =
        externalFile()?.takeIf { it.exists() }
            ?: browserFile()?.takeIf { it.length() == MODEL_BYTES }
            ?: internalFile()

    /** Indirme hedefi: izin varsa dogrudan kalici klasore insin, sonra tasimaya gerek kalmasin. */
    private fun downloadTarget(): File =
        externalFile()?.also { it.parentFile?.mkdirs() } ?: internalFile()

    @PluginMethod
    fun status(call: PluginCall) {
        val id = pendingId()
        if (id >= 0 && query(downloads(), id)?.first == DownloadManager.STATUS_SUCCESSFUL) {
            // Uygulama kapaliyken bitmis: sha256 4.4 GB'ta birkac saniye, UI thread'inde olmasin.
            thread(isDaemon = true) {
                runCatching { finish() }
                call.resolve(statusOf(modelFile()))
            }
            return
        }
        call.resolve(statusOf(modelFile()))
    }

    private fun statusOf(file: File): JSObject {
        val downloading = pendingId() >= 0
        return JSObject()
            .put("ready", file.exists())
            .put("downloading", downloading)
            .put("sizeMb", if (file.exists()) file.length() / (1024 * 1024) else 0)
            .put("persistent", externalFile()?.exists() == true)
            .put("canPersist", Build.VERSION.SDK_INT >= Build.VERSION_CODES.R)
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

    /**
     * Indirme sistemin DownloadManager'inda: uygulama arka plana gecse ya da kapansa da
     * surer, ag kopunca kaldigi yerden devam eder, bildirimde ilerleme gorunur (4.4 GB,
     * tunelden ~30 dk). Uygulama aciksa ilerleme `modelDownload` olayiyla da gelir; kapaliyken
     * bitmisse ilk `status`/`download` cagrisi dosyayi dogrulayip yerine koyar.
     */
    @PluginMethod
    fun download(call: PluginCall) {
        val dm = downloads()
        val id = pendingId().takeIf { it >= 0 && query(dm, it) != null } ?: run {
            staging().delete()
            val request = DownloadManager.Request(Uri.parse(MODEL_URL))
                .setTitle("Eva modeli")
                .setDescription(MODEL_FILE)
                .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                .setDestinationUri(Uri.fromFile(staging()))
                .setAllowedOverMetered(false)
            dm.enqueue(request).also { prefs().edit().putLong(PREF_ID, it).apply() }
        }
        thread(isDaemon = true) {
            while (true) {
                val (state, pct) = query(dm, id) ?: (DownloadManager.STATUS_FAILED to 0)
                when (state) {
                    DownloadManager.STATUS_SUCCESSFUL -> {
                        val result = runCatching { finish() }
                        return@thread call.resolve(
                            JSObject().put("ok", result.isSuccess)
                                .put("status", result.fold({ "Model hazır" }, { "İndirilemedi: ${it.message}" })),
                        )
                    }
                    DownloadManager.STATUS_FAILED -> {
                        prefs().edit().remove(PREF_ID).apply()
                        dm.remove(id)
                        return@thread call.resolve(JSObject().put("ok", false).put("status", "İndirilemedi, tekrar bas"))
                    }
                    DownloadManager.STATUS_PAUSED ->
                        notifyListeners("modelDownload", JSObject().put("status", "Bekliyor (Wi-Fi?) %$pct"))
                    else -> notifyListeners("modelDownload", JSObject().put("status", "Arka planda iniyor %$pct"))
                }
                Thread.sleep(2000)
            }
        }
    }

    private fun downloads() = context.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
    private fun prefs() = context.getSharedPreferences("local_llm", Context.MODE_PRIVATE)
    private fun pendingId(): Long = prefs().getLong(PREF_ID, -1)

    /** DownloadManager yazma hedefi: uygulamanin dis klasoru, izin gerektirmez. */
    private fun staging(): File =
        File(context.getExternalFilesDir("llm"), "$MODEL_FILE.dl")

    /** (durum, yuzde) ya da kayit yoksa null. */
    private fun query(dm: DownloadManager, id: Long): Pair<Int, Int>? =
        dm.query(DownloadManager.Query().setFilterById(id)).use { c ->
            if (!c.moveToFirst()) return null
            val done = c.getLong(c.getColumnIndexOrThrow(DownloadManager.COLUMN_BYTES_DOWNLOADED_SO_FAR))
            val total = c.getLong(c.getColumnIndexOrThrow(DownloadManager.COLUMN_TOTAL_SIZE_BYTES))
            c.getInt(c.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS)) to
                (if (total > 0) (done * 100 / total).toInt() else 0)
        }

    /** Inen dosyayi dogrula, kalici yerine koy, eski surumleri sil. Iki kez cagrilsa da zararsiz. */
    @Synchronized
    private fun finish() {
        val target = downloadTarget()
        val source = staging()
        prefs().edit().remove(PREF_ID).apply()
        if (!source.exists()) { check(target.exists()) { "indirilen dosya yok" }; return }
        notifyListeners("modelDownload", JSObject().put("status", "Doğrulanıyor"))
        val actual = source.inputStream().use { OtaManifest.sha256(it) }
        if (!OtaManifest.matches(actual, MODEL_SHA256)) {
            source.delete()
            error("sha256 tutmadı")
        }
        if (!source.renameTo(target)) {
            // Farkli dosya sistemleri: renameTo calismaz, kopyala-sil gerekiyor.
            source.copyTo(target, overwrite = true)
            source.delete()
        }
        // Eski model surumleri (Gemma 3 1B) yer kaplamasin.
        listOfNotNull(internalFile().parentFile, externalFile()?.parentFile)
            .flatMap { it.listFiles()?.toList().orEmpty() }
            .filter { it.name.endsWith(".task") && it.name != MODEL_FILE }
            .forEach { it.delete() }
    }

    @PluginMethod
    fun remove(call: PluginCall) {
        pendingId().takeIf { it >= 0 }?.let { downloads().remove(it) }
        prefs().edit().remove(PREF_ID).apply()
        staging().delete()
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
