package com.evaitec.wellness.wear

import android.Manifest
import android.app.Activity
import android.content.pm.PackageManager
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.util.TypedValue
import android.view.Gravity
import android.view.WindowManager
import android.view.ViewGroup.LayoutParams.MATCH_PARENT
import android.view.ViewGroup.LayoutParams.WRAP_CONTENT
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import androidx.core.content.ContextCompat
import com.evaitec.ota.OtaManifest
import com.evaitec.wellness.ota.WellnessOta
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/**
 * Tek ekran: ham nabiz, olcumun kabul edilebilirlik durumu, gercek ornek araligi ve
 * cihazin yetenek dokumu. Sade tutuldu - alti satir ugruna saate Compose yigini tasimak
 * APK'yi buyutur, saat APK'si Bluetooth vekili uzerinden iniyor.
 *
 * Ekrandaki degerler onResume'de bir kez cizilmiyor: olcum geldikce tazeleniyor, yoksa
 * donuk sayi "olcum calismiyor" gibi okunur.
 */
class MainActivity : Activity() {

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    private val measure by lazy { HeartRateMeasure(this) }
    private val sender by lazy { WearSender(this) }
    private val updater by lazy { WellnessOta.updater(this, WellnessOta.WEAR_ID) }

    private lateinit var bpmView: TextView
    private lateinit var statusView: TextView
    private lateinit var intervalView: TextView
    private lateinit var sendView: TextView
    private lateinit var capsView: TextView
    private lateinit var otaView: TextView

    private var updating = false
    private var lastBpm: Double? = null
    private var sampleTimes: List<Long> = emptyList()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(buildUi())
        requestHeartRatePermission()
        scope.launch {
            capsView.text = runCatching { HeartRateMeasure.capabilityReport(this@MainActivity) }
                .getOrElse { "Yetenekler okunamadi: ${it.message}" }
        }
    }

    override fun onResume() {
        super.onResume()
        // Telefondan gelen APK arka plandaki servise dusuyor; sonucu kullanici ancak burada gorur.
        ApkReceiverService.lastStatus(this)?.let { otaView.text = it }
        if (!hasHeartRatePermission()) {
            statusView.text = "Nabiz izni yok"
            return
        }
        measure.start(
            onSample = { bpm, bootMs -> runOnUiThread { onSample(bpm, bootMs) } },
            onAvailability = { state -> runOnUiThread { statusView.text = state } },
            onError = { message -> runOnUiThread { statusView.text = "Hata: $message" } },
        )
    }

    /** Kayitli callback ornekleme hizini yukseltiyor; ekran onde degilse kaydi birakiyoruz. */
    override fun onPause() {
        measure.stop()
        super.onPause()
    }

    override fun onDestroy() {
        scope.cancel()
        super.onDestroy()
    }

    private fun onSample(bpm: Double, bootMs: Long) {
        lastBpm = bpm
        sampleTimes = SampleInterval.keepLast(sampleTimes, bootMs, MAX_SAMPLES)
        bpmView.text = "%.0f".format(bpm)
        intervalView.text = SampleInterval.averageMs(sampleTimes)
            ?.let { "aralik ~$it ms (${sampleTimes.size} ornek)" }
            ?: "aralik: tek ornek"
    }

    private fun send() {
        val bpm = lastBpm
        if (bpm == null) {
            sendView.text = "Once bir olcum bekle"
            return
        }
        sendView.text = "Gonderiliyor…"
        scope.launch {
            sendView.text = sender.send(mapOf(WearMetrics.METRIC_HR to bpm))
                .fold({ "Telefona yazildi: %.0f bpm".format(bpm) }, { "Gonderilemedi: ${it.message}" })
        }
    }

    /**
     * Kendini guncelle. Karar OtaUpdater'da: sadece-yukselt, https, sha256 - hicbiri
     * burada tekrarlanmiyor, ekran yalnizca sonucu yaziyor.
     */
    private fun checkUpdate() {
        if (updating) return // ikinci dokunus ayni indirmeyi bastan baslatmasin
        updating = true
        otaView.text = "Guncelleme araniyor…"
        scope.launch {
            // Saatte ekran sonunce CPU/Wi-Fi uykuya gidip baglanti dusuyordu; indirme
            // boyunca ekran acik kalir, bitince bayrak kalkar.
            window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
            try {
                when (val decision = withContext(Dispatchers.IO) { updater.check() }) {
                    is OtaManifest.Decision.UpToDate -> otaView.text = "Guncel"
                    is OtaManifest.Decision.Blocked -> otaView.text = "Guncelleme yok: ${decision.reason}"
                    is OtaManifest.Decision.Available -> {
                        val app = decision.app
                        otaView.text = "${app.versionName} indiriliyor…"
                        val result = withContext(Dispatchers.IO) {
                            updater.download(app) { pct ->
                                runOnUiThread { otaView.text = "${app.versionName} indiriliyor %$pct" }
                            }
                        }
                        otaView.text = result.fold(
                            { "Kurulum istemi acildi - onayla" },
                            { "Guncellenemedi: ${it.message} - tekrar dokun, kaldigi yerden surer" },
                        )
                    }
                }
            } finally {
                window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
                updating = false
            }
        }
    }

    // Wear OS 6'da (API 36) BODY_SENSORS yerini health.READ_HEART_RATE'e birakiyor.
    private fun heartRatePermission(): String =
        if (Build.VERSION.SDK_INT >= 36) HEALTH_READ_HEART_RATE else Manifest.permission.BODY_SENSORS

    private fun hasHeartRatePermission(): Boolean =
        ContextCompat.checkSelfPermission(this, heartRatePermission()) == PackageManager.PERMISSION_GRANTED

    private fun requestHeartRatePermission() {
        if (!hasHeartRatePermission()) requestPermissions(arrayOf(heartRatePermission()), 1)
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, results: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, results)
        if (hasHeartRatePermission()) onResume()
    }

    private fun buildUi(): ScrollView {
        val column = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
            // Yuvarlak ekran kenarlari kirpiyor; genis ic bosluk metni gorunur tutuyor.
            setPadding(24, 40, 24, 40)
        }
        bpmView = line(column, "—", sizeSp = 40f)
        statusView = line(column, "baslatiliyor…")
        intervalView = line(column, "aralik: —")
        column.addView(
            Button(this).apply {
                text = "Telefona gonder"
                setOnClickListener { send() }
            },
            LinearLayout.LayoutParams(MATCH_PARENT, WRAP_CONTENT),
        )
        sendView = line(column, "")
        column.addView(
            Button(this).apply {
                text = "Guncelle"
                setOnClickListener { checkUpdate() }
            },
            LinearLayout.LayoutParams(MATCH_PARENT, WRAP_CONTENT),
        )
        otaView = line(column, "", sizeSp = 11f)
        capsView = line(column, "yetenekler okunuyor…", sizeSp = 11f)
        // Hangi surumun kurulu oldugu ekranda yazsin: OTA sonrasi "guncellendi mi" sorusu
        // ancak boyle cevaplanir. Deger paket yoneticisinden okunuyor, elle yazilmiyor.
        line(column, versionLabel(), sizeSp = 10f)
        return ScrollView(this).apply {
            setBackgroundColor(Color.BLACK)
            addView(column, LinearLayout.LayoutParams(MATCH_PARENT, WRAP_CONTENT))
        }
    }

    private fun versionLabel(): String = runCatching {
        val info = packageManager.getPackageInfo(packageName, 0)
        "surum ${info.versionName} (${info.longVersionCode})"
    }.getOrElse { "surum okunamadi" }

    private fun line(parent: LinearLayout, initial: String, sizeSp: Float = 13f): TextView =
        TextView(this).apply {
            text = initial
            setTextColor(Color.WHITE)
            gravity = Gravity.CENTER
            setTextSize(TypedValue.COMPLEX_UNIT_SP, sizeSp)
            parent.addView(this, LinearLayout.LayoutParams(MATCH_PARENT, WRAP_CONTENT))
        }

    private companion object {
        /** Ekrandaki aralik icin son birkac ornek yeter. */
        const val MAX_SAMPLES = 8
        const val HEALTH_READ_HEART_RATE = "android.permission.health.READ_HEART_RATE"
    }
}
