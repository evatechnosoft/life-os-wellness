package com.evaitec.wellness.wear

import android.Manifest
import android.app.Activity
import android.content.pm.PackageManager
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.os.VibrationEffect
import android.os.Vibrator
import android.util.TypedValue
import android.view.GestureDetector
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.view.ViewGroup.LayoutParams.MATCH_PARENT
import android.view.ViewGroup.LayoutParams.WRAP_CONTENT
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import android.widget.ViewFlipper
import androidx.core.content.ContextCompat
import com.evaitec.ota.OtaManifest
import com.evaitec.wellness.ota.WellnessOta
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.time.LocalDate
import kotlin.math.abs

/**
 * Uc sayfa, yatay kaydirma ile (docs/PLAN-WEAR.md S-next):
 *  0 Seans  - hareket · set · hedef kg x 12 · nabiz · "Set bitti" (titresim + 90 sn dinlenme, set telefona)
 *  1 Ozet   - protein / hedef, 7-gun kcal ort., 7-gun kilo farki, adim (telefonun yazdigi /wellness/summary)
 *  2 Teknik - eski tani satirlari: ham bpm, durum, ornek araligi, gonder, yetenekler, OTA
 * Compose yok: saat APK'si Bluetooth vekilinden iniyor, her megabayt kurulum suresi.
 */
class MainActivity : Activity() {

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    private val measure by lazy { HeartRateMeasure(this) }
    private val sender by lazy { WearSender(this) }
    private val updater by lazy { WellnessOta.updater(this, WellnessOta.WEAR_ID) }

    private lateinit var pages: ViewFlipper
    private lateinit var gestures: GestureDetector

    // Seans
    private lateinit var exerciseView: TextView
    private lateinit var setView: TextView
    private lateinit var targetView: TextView
    private lateinit var sessionBpmView: TextView
    private lateinit var restView: TextView
    private lateinit var setButton: Button
    private var session: Session? = null
    private var restJob: Job? = null

    // Ozet
    private lateinit var summaryViews: List<TextView>

    // Teknik
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
        gestures = GestureDetector(this, object : GestureDetector.SimpleOnGestureListener() {
            override fun onFling(e1: MotionEvent?, e2: MotionEvent, vx: Float, vy: Float): Boolean {
                val dx = e2.x - (e1?.x ?: return false)
                val dy = e2.y - e1.y
                if (abs(dx) < FLING_PX || abs(dx) < abs(dy)) return false
                if (dx < 0) pages.showNext() else pages.showPrevious()
                return true
            }
        })
        requestHeartRatePermission()
        scope.launch {
            capsView.text = runCatching { HeartRateMeasure.capabilityReport(this@MainActivity) }
                .getOrElse { "Yetenekler okunamadi: ${it.message}" }
        }
    }

    /** Kaydirma tum sayfalarda; ScrollView dikeyi yutar, yatay fling buradan gecer. */
    override fun dispatchTouchEvent(ev: MotionEvent): Boolean {
        gestures.onTouchEvent(ev)
        return super.dispatchTouchEvent(ev)
    }

    override fun onResume() {
        super.onResume()
        ApkReceiverService.lastStatus(this)?.let { otaView.text = it }
        scope.launch { loadSummary() }
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

    override fun onPause() {
        measure.stop()
        super.onPause()
    }

    override fun onDestroy() {
        scope.cancel()
        super.onDestroy()
    }

    // ---- Ozet + plan -------------------------------------------------------------------

    /** Ozet telefondan geldiyse onu, yoksa yedek plani kullanir; acilis sayfasini secer. */
    private suspend fun loadSummary() {
        val summary = sender.readSummary()
        val today = LocalDate.now()
        val plan = summary?.plan?.takeIf { it.isNotEmpty() && summary.date == today.toString() }
            ?: Session.fallbackPlan(today.dayOfWeek)
        if (session == null && plan != null) {
            session = Session(plan)
            renderSession()
        }
        renderSummary(summary)
        if (pages.displayedChild == 0 && session == null) pages.displayedChild = 1
    }

    private fun renderSummary(s: Summary?) {
        val lines = if (s == null) listOf("Telefondan özet gelmedi", "", "", "") else listOf(
            s.proteinG?.let { "Protein ${it} / ${s.proteinGoal ?: "—"} g" } ?: "Protein —",
            s.kcalAvg7?.let { "7 gün ${it} kcal" + (s.kcalMax?.let { m -> " / $m" } ?: "") } ?: "7 gün kcal —",
            s.weightDelta7?.let { "Kilo %+.1f kg".format(it) } ?: "Kilo —",
            s.steps?.let { "Adım $it" } ?: "Adım —",
        )
        summaryViews.forEachIndexed { i, v -> v.text = lines[i] }
        val over = s?.kcalAvg7 != null && s.kcalMax != null && s.kcalAvg7 > s.kcalMax
        summaryViews[1].setTextColor(if (over) Color.RED else Color.WHITE)
    }

    // ---- Seans ------------------------------------------------------------------------

    private fun renderSession() {
        val ses = session ?: return
        val cur = ses.current
        if (cur == null) {
            exerciseView.text = "Seans bitti"
            setView.text = ""
            targetView.text = ""
            setButton.visibility = View.GONE
            return
        }
        exerciseView.text = cur.name
        setView.text = "set ${ses.setNo}/${cur.sets}"
        targetView.text = (cur.lastKg?.let { "%.0f kg × ".format(it) } ?: "") + "${Session.REPS} tekrar"
    }

    private fun finishSet() {
        val ses = session ?: return
        val cur = ses.current ?: return
        vibrate(200)
        val setNo = ses.setNo
        scope.launch {
            sender.sendSet(cur.id, setNo, Session.REPS, cur.lastKg)
                .onFailure { restView.text = "Gönderilemedi: ${it.message}" }
        }
        ses.next()
        renderSession()
        startRest()
    }

    private fun startRest() {
        restJob?.cancel()
        setButton.isEnabled = false
        val start = System.currentTimeMillis()
        restJob = scope.launch {
            while (true) {
                val left = Session.restRemainingSec(start, System.currentTimeMillis())
                restView.text = if (left > 0) "dinlen $left s" else "hazır"
                if (left <= 0) break
                delay(1000)
            }
            vibrate(400)
            setButton.isEnabled = true
        }
    }

    private fun vibrate(ms: Long) {
        getSystemService(Vibrator::class.java)
            ?.vibrate(VibrationEffect.createOneShot(ms, VibrationEffect.DEFAULT_AMPLITUDE))
    }

    // ---- Teknik -----------------------------------------------------------------------

    private fun onSample(bpm: Double, bootMs: Long) {
        lastBpm = bpm
        sampleTimes = SampleInterval.keepLast(sampleTimes, bootMs, MAX_SAMPLES)
        val text = "%.0f".format(bpm)
        bpmView.text = text
        sessionBpmView.text = text
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

    // ---- UI ---------------------------------------------------------------------------

    private fun buildUi(): ViewFlipper {
        pages = ViewFlipper(this).apply { setBackgroundColor(Color.BLACK) }
        pages.addView(page { c ->
            exerciseView = line(c, "Plan yok", sizeSp = 16f)
            setView = line(c, "")
            targetView = line(c, "")
            sessionBpmView = line(c, "—", sizeSp = 40f)
            setButton = button(c, "Set bitti") { finishSet() }
            restView = line(c, "")
        })
        pages.addView(page { c ->
            line(c, "Bugün", sizeSp = 11f)
            summaryViews = List(4) { line(c, "", sizeSp = 16f) }
        })
        pages.addView(page { c ->
            bpmView = line(c, "—", sizeSp = 40f)
            statusView = line(c, "baslatiliyor…")
            intervalView = line(c, "aralik: —")
            button(c, "Telefona gonder") { send() }
            sendView = line(c, "")
            button(c, "Guncelle") { checkUpdate() }
            otaView = line(c, "", sizeSp = 11f)
            capsView = line(c, "yetenekler okunuyor…", sizeSp = 11f)
            line(c, versionLabel(), sizeSp = 10f)
        })
        return pages
    }

    private fun page(fill: (LinearLayout) -> Unit): ScrollView {
        val column = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
            // Yuvarlak ekran kenarlari kirpiyor; genis ic bosluk metni gorunur tutuyor.
            setPadding(24, 40, 24, 40)
        }
        fill(column)
        return ScrollView(this).apply { addView(column, LinearLayout.LayoutParams(MATCH_PARENT, WRAP_CONTENT)) }
    }

    private fun button(parent: LinearLayout, label: String, onClick: () -> Unit): Button =
        Button(this).apply {
            text = label
            setOnClickListener { onClick() }
            parent.addView(this, LinearLayout.LayoutParams(MATCH_PARENT, WRAP_CONTENT))
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
        const val FLING_PX = 80f
        const val HEALTH_READ_HEART_RATE = "android.permission.health.READ_HEART_RATE"
    }
}
