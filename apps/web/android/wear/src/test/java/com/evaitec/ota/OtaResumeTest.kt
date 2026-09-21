package com.evaitec.ota

import org.junit.Assert.assertEquals
import org.junit.Test

/**
 * Kesilen indirmenin kaldigi yerden surmesi: 206'da govde yalnizca kalan kisim, toplam
 * boyut atlanan bayti icerir. Yanlis hesap = yuzde bozuk + "indirme yarim kaldi" hatasi.
 */
class OtaResumeTest {

    @Test fun `206 da toplam atlanan bayti da sayar`() {
        assertEquals(13_053_264L, OtaUpdater.totalOf(206, 3_000_000L, 10_053_264L))
    }

    @Test fun `200 de sunucu bastan veriyor`() {
        assertEquals(13_053_264L, OtaUpdater.totalOf(200, 3_000_000L, 13_053_264L))
    }
}
