package com.evaitec.wellness.ota

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * OTA'nin kritik kurallari: sadece-yukselt, https zorunlu, sha256 zorunlu.
 * Yanlis karar = kullaniciya eski surumu ya da dogrulanmamis bir APK'yi kurdurmak.
 */
class OtaManifestTest {

    private val wearApk = """
        "wearApk":"wear-debug.apk",
        "wearUrl":"https://github.com/x/y/releases/download/v0.15.0/wear-debug.apk",
        "wearSha256":"$SHA"
    """.trimIndent()

    private fun decide(json: String, current: Int) =
        OtaManifest.decide(json, current, OtaManifest.Fields.WEAR)

    @Test
    fun sameVersionCodeIsUpToDate() {
        val d = decide("""{"versionCode":1400,$wearApk}""", 1400)
        assertEquals(OtaManifest.Decision.UpToDate, d)
    }

    @Test
    fun olderVersionCodeNeverDowngrades() {
        val d = decide("""{"versionCode":1300,$wearApk}""", 1400)
        assertEquals(OtaManifest.Decision.UpToDate, d)
    }

    @Test
    fun newerVersionIsOffered() {
        val d = decide("""{"versionCode":1500,"versionName":"0.15.0",$wearApk}""", 1400)
            as OtaManifest.Decision.Available
        assertEquals("0.15.0", d.versionName)
        assertEquals("https://github.com/x/y/releases/download/v0.15.0/wear-debug.apk", d.apkUrl)
        assertEquals(SHA, d.sha256)
    }

    @Test
    fun versionNameFallsBackToCode() {
        val d = decide("""{"versionCode":1500,$wearApk}""", 1400) as OtaManifest.Decision.Available
        assertEquals("1500", d.versionName)
    }

    @Test
    fun phoneAndWearFieldsAreIndependent() {
        val json = """
            {"versionCode":1500,
             "apk":"app-debug.apk","url":"https://h/app.apk","sha256":"$SHA",
             $wearApk}
        """.trimIndent()
        val phone = OtaManifest.decide(json, 1400, OtaManifest.Fields.PHONE)
            as OtaManifest.Decision.Available
        assertEquals("https://h/app.apk", phone.apkUrl)
        assertEquals("wear-debug.apk", (decide(json, 1400) as OtaManifest.Decision.Available).apkName)
    }

    @Test
    fun sha256IsNormalisedToLowercase() {
        val upper = SHA.uppercase()
        val d = decide("""{"versionCode":1500,"wearApk":"w.apk","wearUrl":"https://h/w.apk","wearSha256":"$upper"}""", 1400)
            as OtaManifest.Decision.Available
        assertEquals(SHA, d.sha256)
    }

    @Test
    fun malformedManifestIsBlockedNotCrashed() {
        // Ag yoksa/proxy HTML dondururse govde JSON degil: cagiran patlamasin, kurulum da olmasin.
        assertTrue(decide("", 1400) is OtaManifest.Decision.Blocked)
        assertTrue(decide("<html>502</html>", 1400) is OtaManifest.Decision.Blocked)
        assertTrue(decide("""{"versionName":"0.15.0"}""", 1400) is OtaManifest.Decision.Blocked)
    }

    @Test
    fun missingWearFieldsAreBlocked() {
        // Telefon surumu yayinlanmis ama saatinki yoksa: guncelleme yok, hata da yok.
        val d = decide("""{"versionCode":1500,"apk":"a.apk","url":"https://h/a.apk","sha256":"$SHA"}""", 1400)
        assertTrue(d is OtaManifest.Decision.Blocked)
    }

    @Test
    fun sha256MustBePresentAndWellFormed() {
        val noSha = """{"versionCode":1500,"wearApk":"w.apk","wearUrl":"https://h/w.apk"}"""
        assertTrue("sha256'siz APK kurulmaz", decide(noSha, 1400) is OtaManifest.Decision.Blocked)
        val shortSha = """{"versionCode":1500,"wearApk":"w.apk","wearUrl":"https://h/w.apk","wearSha256":"abcd"}"""
        assertTrue(decide(shortSha, 1400) is OtaManifest.Decision.Blocked)
        val notHex = """{"versionCode":1500,"wearApk":"w.apk","wearUrl":"https://h/w.apk","wearSha256":"${"z".repeat(64)}"}"""
        assertTrue(decide(notHex, 1400) is OtaManifest.Decision.Blocked)
    }

    @Test
    fun plainHttpUrlIsBlocked() {
        val d = decide("""{"versionCode":1500,"wearApk":"w.apk","wearUrl":"http://insecure/w.apk","wearSha256":"$SHA"}""", 1400)
        assertTrue("cleartext indirme = ortadaki adam APK'yi degistirebilir", d is OtaManifest.Decision.Blocked)
    }

    @Test
    fun sha256OfBytesMatchesKnownVector() {
        assertEquals(
            "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
            OtaManifest.sha256("abc".toByteArray()),
        )
    }

    @Test
    fun sha256ComparisonIsCaseInsensitiveAndRejectsMismatch() {
        val bytes = "abc".toByteArray()
        val digest = OtaManifest.sha256(bytes)
        assertTrue(OtaManifest.matches(digest, digest.uppercase()))
        assertTrue(!OtaManifest.matches(digest, SHA))
    }

    @Test
    fun manifestProducedByCiIsAccepted() {
        // .github/workflows/apk.yml ciktisinin birebir sekli - alan adi kayarsa burada patlar,
        // sahada "guncelleme yok" diye sessizce durmaz.
        val ci = """
            {
              "versionCode": 1400,
              "versionName": "0.14.0",
              "apk": "app-debug.apk",
              "url": "https://github.com/evatechnosoft/life-os-wellness/releases/download/v0.14.0/app-debug.apk",
              "sha256": "8c64f50e17855dd62771bbdb2f6cf6f89a22e4673e5b6c09ed9a40b070c3fda9",
              "wearApk": "wear-debug.apk",
              "wearUrl": "https://github.com/evatechnosoft/life-os-wellness/releases/download/v0.14.0/wear-debug.apk",
              "wearSha256": "9edafa85ecf13164e7270a8e6ad904a5fdfa849e9787a3dced91f35d69e3f786"
            }
        """.trimIndent()
        val d = decide(ci, 1300) as OtaManifest.Decision.Available
        assertEquals("0.14.0", d.versionName)
        assertEquals("9edafa85ecf13164e7270a8e6ad904a5fdfa849e9787a3dced91f35d69e3f786", d.sha256)
        assertEquals(OtaManifest.Decision.UpToDate, decide(ci, 1400))
    }

    private companion object {
        const val SHA = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
    }
}
