package com.evaitec.wellness.wear

import android.Manifest
import android.annotation.SuppressLint
import android.animation.ValueAnimator
import android.app.Activity
import android.content.pm.PackageManager
import android.content.res.ColorStateList
import android.graphics.Color
import android.graphics.LinearGradient
import android.graphics.Matrix
import android.graphics.Shader
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.graphics.drawable.RippleDrawable
import android.text.SpannableStringBuilder
import android.text.style.ForegroundColorSpan
import android.text.style.StyleSpan
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
import android.view.animation.AlphaAnimation
import android.view.animation.DecelerateInterpolator
import android.view.animation.LinearInterpolator
import android.view.animation.OvershootInterpolator
import android.widget.FrameLayout
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
import android.window.OnBackInvokedCallback
import android.window.OnBackInvokedDispatcher
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.Locale
import kotlin.math.abs

/**
 * Giris ekrani + uc sayfa (docs/PLAN-WEAR.md S-next, Dean 14 Eki):
 *  0 Giris   - yuvarlak dugmeler: Seans · Gun · Yuruyus · ayarlar (alttan cekmece). Acilis hep burasi.
 *  1 Seans   - hareket · rampa · set n/N · hedef kg x 12 · toplam set · nabiz · Gec / Set bitti / Dur
 *             (sola kaydir = sonraki hareket, saga = onceki; Set bitti = titresim + 90 sn dinlenme, set telefona)
 *  2 Gun     - protein / hedef, 7-gun kcal ort., 7-gun kilo farki, adim (telefonun yazdigi /wellness/summary)
 *  3 Yuruyus - sure + nabiz bolgesi; kayit Samsung'dan gelir, burada yalniz takip (cift kayit olmasin)
 *  Cekmece   - eski teknik satirlar: ham bpm, durum, ornek araligi, gonder, guncelle, yetenekler
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
    private lateinit var rampView: TextView
    private lateinit var totalView: TextView
    private lateinit var skipButton: TextView
    private lateinit var stopButton: TextView
    private lateinit var sessionBpmView: TextView
    private lateinit var restView: TextView
    private lateinit var setButton: TextView
    private lateinit var seansButton: TextView
    private var session: Session? = null
    private var restJob: Job? = null

    // Gun
    private lateinit var summaryViews: List<TextView>

    // Yuruyus
    private lateinit var walkZoneView: TextView
    private lateinit var walkTimeView: TextView
    private lateinit var walkBpmView: TextView
    private lateinit var walkButton: TextView
    private lateinit var walkNoteView: TextView
    private var walkStartMs: Long? = null
    private var walkJob: Job? = null

    // Cekmece
    private lateinit var scrim: View
    private lateinit var drawer: ScrollView
    private var drawerOpen = false
    private val animators = mutableListOf<ValueAnimator>()

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
                // Cekmece: asagi kaydir kapatir; giriste yukari kaydir acar.
                if (abs(dy) > abs(dx) && abs(dy) > FLING_PX) {
                    if (drawerOpen && dy > 0) { closeDrawer(); return true }
                    if (!drawerOpen && dy < 0 && pages.displayedChild == PAGE_HOME) { openDrawer(); return true }
                    return false
                }
                if (drawerOpen || abs(dx) < FLING_PX || pages.displayedChild == PAGE_HOME) return false
                // Seansta sola = sonraki hareket, saga = onceki; diger sayfalarda giris ekranina doner.
                if (pages.displayedChild == PAGE_SEANS && session != null) {
                    moveExercise(forward = dx < 0)
                    return true
                }
                show(PAGE_HOME)
                return true
            }
        })
        requestHeartRatePermission()
        popIn()
        scope.launch {
            capsView.text = runCatching { HeartRateMeasure.capabilityReport(this@MainActivity) }
                .getOrElse { "Yetenekler okunamadi: ${it.message}" }
        }
    }

    /** Kaydirma tum sayfalarda; ScrollView dikeyi yutar, fling buradan gecer. */
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
        animators.forEach { it.cancel() }
        super.onDestroy()
    }

    // ---- Ozet + plan -------------------------------------------------------------------

    /** Ozet telefondan geldiyse onu, yoksa yedek plani kullanir. Acilis hep giris ekrani. */
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
        seansButton.alpha = if (session == null) 0.35f else 1f
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
        val down = (s?.weightDelta7 ?: 0.0) <= 0.0
        summaryViews[0].setTextColor(CYAN)
        summaryViews[1].setTextColor(if (over) Color.RED else Color.WHITE)
        summaryViews[2].setTextColor(if (down) 0xFF66BB6A.toInt() else ORANGE)
        summaryViews[3].setTextColor(YELLOW)
    }

    // ---- Seans ------------------------------------------------------------------------

    private fun renderSession() {
        val ses = session ?: return
        val cur = ses.current
        if (cur == null) {
            exerciseView.text = "Seans bitti"
            rampView.visibility = View.GONE
            setView.text = "sağa kaydır: son harekete dön"
            totalView.text = "${ses.doneSets}/${ses.totalSets} set yapıldı"
            listOf(setButton, skipButton, stopButton).forEach { it.visibility = View.GONE }
            return
        }
        exerciseView.text = cur.name
        rampView.text = if (cur.isRamp) rampLine(cur.kgs, ses.setNo) else ""
        rampView.visibility = if (cur.isRamp) View.VISIBLE else View.GONE
        setView.text = "set ${ses.setNo}/${cur.totalSets} · " +
            (cur.targetKg(ses.setNo)?.let { "${kg(it)} kg × " } ?: "") + "${Session.REPS}"
        totalView.text = "toplam ${ses.doneSets}/${ses.totalSets} set"
        listOf(setButton, skipButton, stopButton).forEach { it.visibility = View.VISIBLE }
    }

    /** "25 › 30 › 35": bu setin kilosu sari ve kalin, digerleri gri. */
    private fun rampLine(kgs: List<Double>, setNo: Int): CharSequence {
        val out = SpannableStringBuilder("rampa ")
        kgs.forEachIndexed { i, v ->
            if (i > 0) out.append(" › ")
            val start = out.length
            out.append(kg(v))
            val now = i == (setNo - 1).coerceAtMost(kgs.size - 1)
            out.setSpan(ForegroundColorSpan(if (now) YELLOW else GRAY), start, out.length, 0)
            if (now) out.setSpan(StyleSpan(Typeface.BOLD), start, out.length, 0)
        }
        return out
    }

    private fun kg(v: Double): String = if (v % 1.0 == 0.0) "%.0f".format(v) else "%.1f".format(v)

    /** Sola kaydir / Gec: hareket set sayilmadan atlanir. Saga kaydir: onceki hareket. */
    private fun moveExercise(forward: Boolean) {
        val ses = session ?: return
        if (forward) ses.skip() else ses.previous()
        restJob?.cancel()
        restView.text = ""
        setButton.isEnabled = true
        setButton.alpha = 1f
        vibrate(60)
        renderSession()
    }

    /** Durdur iki dokunus ister: yanlislikla biten seans geri gelmesin diye. */
    private var stopArmedAt = 0L

    private fun stopSession() {
        val now = System.currentTimeMillis()
        if (now - stopArmedAt > STOP_CONFIRM_MS) {
            stopArmedAt = now
            stopButton.text = "Emin?"
            scope.launch { delay(STOP_CONFIRM_MS); stopButton.text = "Dur" }
            return
        }
        stopArmedAt = 0L
        stopButton.text = "Dur"
        session?.stop()
        restJob?.cancel()
        restView.text = ""
        vibrate(300)
        renderSession()
    }

    private fun finishSet() {
        val ses = session ?: return
        val cur = ses.current ?: return
        vibrate(200)
        val setNo = ses.setNo
        scope.launch {
            sender.sendSet(cur.id, setNo, Session.REPS, cur.targetKg(setNo))
                .onFailure { restView.text = "Gönderilemedi: ${it.message}" }
        }
        ses.next()
        renderSession()
        startRest()
    }

    private fun startRest() {
        restJob?.cancel()
        setButton.isEnabled = false
        setButton.alpha = 0.4f
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
            setButton.alpha = 1f
        }
    }

    private fun vibrate(ms: Long) {
        getSystemService(Vibrator::class.java)
            ?.vibrate(VibrationEffect.createOneShot(ms, VibrationEffect.DEFAULT_AMPLITUDE))
    }

    // ---- Yuruyus ----------------------------------------------------------------------

    /** Basla/Bitir. Sure baslangic aniyla hesaplanir: ekran kapanip acilsa da dogru kalir. */
    private fun toggleWalk() {
        val start = walkStartMs
        vibrate(150)
        if (start == null) {
            walkStartMs = System.currentTimeMillis()
            walkNoteView.text = ""
            walkButton.text = "Bitir"
            ((walkButton.background as RippleDrawable).getDrawable(0) as GradientDrawable).setColor(RED)
            walkJob = scope.launch {
                while (true) {
                    walkTimeView.text = Walk.elapsed((System.currentTimeMillis() - (walkStartMs ?: break)) / 1000)
                    delay(1000)
                }
            }
        } else {
            walkJob?.cancel()
            walkStartMs = null
            walkTimeView.text = Walk.elapsed((System.currentTimeMillis() - start) / 1000)
            walkNoteView.text = "Kayıt Samsung'dan gelir"
            walkButton.text = "Başla"
            ((walkButton.background as RippleDrawable).getDrawable(0) as GradientDrawable).setColor(GREEN)
        }
    }

    // ---- Teknik -----------------------------------------------------------------------

    private fun onSample(bpm: Double, bootMs: Long) {
        lastBpm = bpm
        sampleTimes = SampleInterval.keepLast(sampleTimes, bootMs, MAX_SAMPLES)
        val text = "%.0f".format(bpm)
        val zone = Walk.zone(bpm)
        bpmView.text = text
        beat(sessionBpmView, text, zone.color)
        beat(walkBpmView, text, zone.color)
        walkZoneView.text = zone.label
        walkZoneView.setTextColor(zone.color)
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

    private fun buildUi(): FrameLayout {
        pages = ViewFlipper(this).apply {
            inAnimation = AlphaAnimation(0f, 1f).apply { duration = 250 }
            outAnimation = AlphaAnimation(1f, 0f).apply { duration = 150 }
        }
        pages.addView(page(top = 22, bottom = 16) { c ->
            shimmer(line(c, "Bugün", sizeSp = 20f, bold = true))
            line(c, LocalDate.now().format(DateTimeFormatter.ofPattern("EEEE d MMMM", TR)), sizeSp = 11f, color = GRAY)
            val r1 = row(c)
            seansButton = circle(r1, "Seans", GREEN, 60) { show(PAGE_SEANS) }
            circle(r1, "Gün", BLUE, 60) { show(PAGE_GUN) }
            val r2 = row(c)
            circle(r2, "Yürüyüş", ORANGE, 60) { show(PAGE_WALK) }
            circle(r2, "⚙", DARK, 40) { openDrawer() }
        })
        pages.addView(page(top = 26, bottom = 20) { c ->
            exerciseView = line(c, "Bugün plan yok", sizeSp = 15f, color = CYAN, bold = true)
            rampView = line(c, "", sizeSp = 12f)
            setView = line(c, "", sizeSp = 14f, bold = true)
            totalView = line(c, "", sizeSp = 11f, color = GRAY)
            sessionBpmView = line(c, "—", sizeSp = 24f, bold = true)
            val r = row(c)
            skipButton = circle(r, "Geç", DARK, 42) { moveExercise(forward = true) }
            setButton = circle(r, "Set\nbitti", GREEN, 66) { finishSet() }
            stopButton = circle(r, "Dur", RED, 42) { stopSession() }
            restView = line(c, "", color = YELLOW)
        })
        pages.addView(page { c ->
            shimmer(line(c, "Gün", sizeSp = 20f, bold = true))
            summaryViews = List(4) { line(c, "", sizeSp = 16f) }
        })
        pages.addView(page { c ->
            walkZoneView = line(c, "nabız bekleniyor", sizeSp = 13f, color = GRAY)
            walkTimeView = line(c, "0:00", sizeSp = 34f, bold = true)
            walkBpmView = line(c, "—", sizeSp = 28f, bold = true)
            walkButton = circle(row(c), "Başla", GREEN, 70) { toggleWalk() }
            walkNoteView = line(c, "", sizeSp = 11f, color = GRAY)
        })

        scrim = View(this).apply {
            setBackgroundColor(0xB3000000.toInt())
            visibility = View.GONE
            setOnClickListener { closeDrawer() }
        }
        drawer = page(top = 16, bottom = 48) { c ->
            line(c, "Ayarlar", sizeSp = 15f, bold = true)
            bpmView = line(c, "—", sizeSp = 24f, bold = true)
            statusView = line(c, "baslatiliyor…", sizeSp = 11f, color = GRAY)
            intervalView = line(c, "aralik: —", sizeSp = 11f, color = GRAY)
            pill(c, "Telefona gönder", BLUE) { send() }
            sendView = line(c, "", sizeSp = 11f)
            pill(c, "Güncelle", GREEN) { checkUpdate() }
            otaView = line(c, "", sizeSp = 11f)
            capsView = line(c, "yetenekler okunuyor…", sizeSp = 10f, color = GRAY)
            line(c, versionLabel(), sizeSp = 10f, color = GRAY)
            pill(c, "Kapat", DARK) { closeDrawer() }
        }.apply {
            background = GradientDrawable().apply {
                setColor(0xFF1C1F24.toInt())
                cornerRadii = FloatArray(8) { i -> if (i < 4) dp(28).toFloat() else 0f }
            }
            visibility = View.GONE
        }

        return FrameLayout(this).apply {
            setBackgroundColor(Color.BLACK)
            addView(pages, FrameLayout.LayoutParams(MATCH_PARENT, MATCH_PARENT))
            addView(scrim, FrameLayout.LayoutParams(MATCH_PARENT, MATCH_PARENT))
            addView(drawer, FrameLayout.LayoutParams(MATCH_PARENT, WRAP_CONTENT, Gravity.BOTTOM))
        }
    }

    // ---- Gezinme: giris ekrani + alttan cekilen ayarlar ----------------------------------

    private fun show(index: Int) {
        pages.displayedChild = index
        if (index == PAGE_HOME) popIn()
        syncBack()
    }

    /** Giris dugmeleri sirayla buyuyerek gelir. */
    private fun popIn() {
        val home = (pages.getChildAt(PAGE_HOME) as ScrollView).getChildAt(0) as LinearLayout
        var i = 0
        for (r in 0 until home.childCount) {
            val rowView = home.getChildAt(r) as? LinearLayout ?: continue
            for (b in 0 until rowView.childCount) {
                rowView.getChildAt(b).apply {
                    scaleX = 0.5f; scaleY = 0.5f; alpha = 0f
                    animate().scaleX(1f).scaleY(1f).alpha(1f)
                        .setStartDelay(60L * i++).setDuration(320).setInterpolator(OvershootInterpolator()).start()
                }
            }
        }
    }

    private fun openDrawer() {
        if (drawerOpen) return
        drawerOpen = true
        scrim.alpha = 0f
        scrim.visibility = View.VISIBLE
        scrim.animate().alpha(1f).setDuration(200).start()
        drawer.visibility = View.VISIBLE
        drawer.post {
            drawer.translationY = drawer.height.toFloat()
            drawer.animate().translationY(0f).setDuration(260).setInterpolator(DecelerateInterpolator()).start()
        }
        syncBack()
    }

    private fun closeDrawer() {
        if (!drawerOpen) return
        drawerOpen = false
        scrim.animate().alpha(0f).setDuration(200).withEndAction { scrim.visibility = View.GONE }.start()
        drawer.animate().translationY(drawer.height.toFloat()).setDuration(220)
            .withEndAction { drawer.visibility = View.GONE }.start()
        syncBack()
    }

    /** Geri: once cekmece, sonra giris ekrani; giristeyken sistem uygulamayi kapatir. */
    private fun handleBack(): Boolean = when {
        drawerOpen -> { closeDrawer(); true }
        pages.displayedChild != PAGE_HOME -> { show(PAGE_HOME); true }
        else -> false
    }

    // API 36 hedefinde onBackPressed cagrilmiyor (ongorulu geri); 33+ icin callback.
    private val backCallback by lazy { OnBackInvokedCallback { handleBack() } }
    private var backRegistered = false

    private fun syncBack() {
        if (Build.VERSION.SDK_INT < 33) return
        val want = drawerOpen || pages.displayedChild != PAGE_HOME
        if (want == backRegistered) return
        if (want) onBackInvokedDispatcher.registerOnBackInvokedCallback(OnBackInvokedDispatcher.PRIORITY_DEFAULT, backCallback)
        else onBackInvokedDispatcher.unregisterOnBackInvokedCallback(backCallback)
        backRegistered = want
    }

    // Yalniz API < 33 (Wear OS 3); 33+ backCallback ile gelir.
    @SuppressLint("GestureBackNavigation")
    @Deprecated("API < 33")
    override fun onBackPressed() {
        @Suppress("DEPRECATION")
        if (!handleBack()) super.onBackPressed()
    }

    // ---- Gorunum yardimcilari ---------------------------------------------------------

    private fun page(top: Int = 36, bottom: Int = 36, fill: (LinearLayout) -> Unit): ScrollView {
        val column = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
            // Yuvarlak ekran kenarlari kirpiyor; genis ic bosluk metni gorunur tutuyor.
            setPadding(dp(18), dp(top), dp(18), dp(bottom))
        }
        fill(column)
        return ScrollView(this).apply {
            isVerticalScrollBarEnabled = false
            addView(column, LinearLayout.LayoutParams(MATCH_PARENT, WRAP_CONTENT))
        }
    }

    private fun row(parent: LinearLayout): LinearLayout = LinearLayout(this).apply {
        orientation = LinearLayout.HORIZONTAL
        gravity = Gravity.CENTER
        parent.addView(this, LinearLayout.LayoutParams(MATCH_PARENT, WRAP_CONTENT).apply { topMargin = dp(6) })
    }

    /** Yuvarlak dugme: dolu daire + dokunma dalgasi + basinca kisa kuculme. */
    private fun circle(parent: LinearLayout, label: String, color: Int, sizeDp: Int, onClick: () -> Unit): TextView =
        tappable(label, color, GradientDrawable.OVAL, if (label.length == 1) 18f else 12f, onClick).also {
            parent.addView(it, LinearLayout.LayoutParams(dp(sizeDp), dp(sizeDp)).apply { setMargins(dp(5), 0, dp(5), 0) })
        }

    private fun pill(parent: LinearLayout, label: String, color: Int, onClick: () -> Unit): TextView =
        tappable(label, color, GradientDrawable.RECTANGLE, 13f, onClick).also {
            parent.addView(it, LinearLayout.LayoutParams(MATCH_PARENT, dp(40)).apply { setMargins(dp(10), dp(6), dp(10), 0) })
        }

    private fun tappable(label: String, color: Int, shape: Int, sizeSp: Float, onClick: () -> Unit): TextView =
        TextView(this).apply {
            text = label
            gravity = Gravity.CENTER
            setTextColor(Color.WHITE)
            typeface = Typeface.DEFAULT_BOLD
            setTextSize(TypedValue.COMPLEX_UNIT_SP, sizeSp)
            val fill = GradientDrawable().apply {
                this.shape = shape
                setColor(color)
                if (shape == GradientDrawable.RECTANGLE) cornerRadius = dp(20).toFloat()
            }
            background = RippleDrawable(ColorStateList.valueOf(0x55FFFFFF), fill, null)
            isClickable = true
            setOnClickListener {
                if (!isEnabled) return@setOnClickListener
                animate().scaleX(0.9f).scaleY(0.9f).setDuration(70)
                    .withEndAction { animate().scaleX(1f).scaleY(1f).setDuration(110).start() }.start()
                onClick()
            }
        }

    private fun line(
        parent: LinearLayout,
        initial: String,
        sizeSp: Float = 13f,
        color: Int = Color.WHITE,
        bold: Boolean = false,
    ): TextView = TextView(this).apply {
        text = initial
        setTextColor(color)
        gravity = Gravity.CENTER
        setTextSize(TypedValue.COMPLEX_UNIT_SP, sizeSp)
        if (bold) typeface = Typeface.DEFAULT_BOLD
        parent.addView(this, LinearLayout.LayoutParams(MATCH_PARENT, WRAP_CONTENT))
    }

    /** Metnin uzerinde akan renk gecisi. */
    private fun shimmer(view: TextView) {
        view.post {
            val w = view.width.toFloat().coerceAtLeast(1f)
            val shader = LinearGradient(0f, 0f, w, 0f, intArrayOf(CYAN, MAGENTA, YELLOW, CYAN), null, Shader.TileMode.MIRROR)
            view.paint.shader = shader
            val m = Matrix()
            animators += ValueAnimator.ofFloat(0f, 2 * w).apply {
                duration = 3200
                repeatCount = ValueAnimator.INFINITE
                interpolator = LinearInterpolator()
                addUpdateListener { m.setTranslate(it.animatedValue as Float, 0f); shader.setLocalMatrix(m); view.invalidate() }
                start()
            }
        }
    }

    /** Nabiz rakami her ornekte kisa atar, rengi bolgeyi soyler. */
    private fun beat(view: TextView, text: String, color: Int) {
        view.text = text
        view.setTextColor(color)
        if (!view.isShown) return
        view.animate().scaleX(1.15f).scaleY(1.15f).setDuration(110)
            .withEndAction { view.animate().scaleX(1f).scaleY(1f).setDuration(220).start() }.start()
    }

    private fun dp(v: Int): Int = (v * resources.displayMetrics.density).toInt()

    private fun versionLabel(): String = runCatching {
        val info = packageManager.getPackageInfo(packageName, 0)
        "surum ${info.versionName} (${info.longVersionCode})"
    }.getOrElse { "surum okunamadi" }

    private companion object {
        /** Ekrandaki aralik icin son birkac ornek yeter. */
        const val MAX_SAMPLES = 8
        const val FLING_PX = 80f
        const val STOP_CONFIRM_MS = 3000L
        const val PAGE_HOME = 0
        const val PAGE_SEANS = 1
        const val PAGE_GUN = 2
        const val PAGE_WALK = 3
        val TR: Locale = Locale.forLanguageTag("tr")
        const val GREEN = 0xFF2E7D32.toInt()
        const val BLUE = 0xFF1565C0.toInt()
        const val ORANGE = 0xFFE65100.toInt()
        const val RED = 0xFFC62828.toInt()
        const val DARK = 0xFF37474F.toInt()
        const val GRAY = 0xFF9E9E9E.toInt()
        const val CYAN = 0xFF4DD0E1.toInt()
        const val MAGENTA = 0xFFF06292.toInt()
        const val YELLOW = 0xFFFFD54F.toInt()
        const val HEALTH_READ_HEART_RATE = "android.permission.health.READ_HEART_RATE"
    }
}
