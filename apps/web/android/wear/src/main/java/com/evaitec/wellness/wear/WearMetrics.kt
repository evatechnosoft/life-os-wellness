package com.evaitec.wellness.wear

/**
 * Saat ↔ telefon sozlesmesi. Telefon tarafi ayni sabitleri
 * app/src/main/java/com/evaitec/wellness/WearBridgeService.kt icinde tutuyor;
 * biri degisirse oteki de degismeli, yoksa kayit sessizce dusmez.
 *
 * Her kayit **kendi yolunu** alir ("$PATH_PREFIX/<ts>"): DataClient bir yolun yalniz son
 * halini tasir, tek yol kullanilsaydi telefon uzaktayken ikinci olcum birinciyi silerdi.
 */
object WearMetrics {
    const val PATH_PREFIX = "/wellness/metrics"

    /** YYYY-MM-DD, saatin yerel takvimi. */
    const val KEY_DATE = "date"

    /** JSON nesnesi: {"metrik": sayi}. Sema telefonda; saat yalnizca yeni bir kaynak. */
    const val KEY_METRICS = "metrics"

    /** Epoch ms. Hem yol tekilligi hem de eskiyen kaydin budanmasi icin. */
    const val KEY_TS = "ts"

    /** Anlik nabiz olcumu. resting_hr degil: bu kullanici ekrana bakarken alinan tek atis. */
    const val METRIC_HR = "watch_hr_bpm"
}
