package com.evaitec.ota

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * evaitecOTA cekirdeginin kritik kurallari: listeden dogru kalemi secmek, sadece-yukselt,
 * https ve sha256 zorunlulugu. Yanlis karar = kullaniciya eski ya da dogrulanmamis bir APK
 * kurdurmak - kurucu, kabul ettigi kadar guvenlidir.
 */
class OtaManifestTest {

    private fun item(
        id: String = "wellness-wear",
        pkg: String = "com.evaitec.wellness",
        code: Int = 1500,
        apk: String = "wear-debug.apk",
        url: String = "https://github.com/x/y/releases/download/v0.15.0/wear-debug.apk",
        sha: String = SHA,
        extra: String = "",
    ) = """
        {"id":"$id","name":"Wellness (saat)","package":"$pkg","versionCode":$code,
         "versionName":"0.15.0","apk":"$apk","url":"$url","sha256":"$sha"$extra}
    """.trimIndent()

    private fun manifest(vararg items: String) = """{"apps":[${items.joinToString(",")}]}"""

    private fun decide(json: String, current: Int, id: String = "wellness-wear") =
        OtaManifest.decide(json, id, current)

    @Test
    fun singleItemManifestIsValid() {
        val d = decide(manifest(item()), 1400) as OtaManifest.Decision.Available
        assertEquals("wellness-wear", d.app.id)
        assertEquals("com.evaitec.wellness", d.app.packageName)
        assertEquals("0.15.0", d.app.versionName)
        assertEquals(SHA, d.app.sha256)
    }

    @Test
    fun theRequestedIdIsChosenFromTheList() {
        val json = manifest(
            item(id = "wellness-phone", apk = "app-debug.apk", url = "https://h/app.apk", sha = OTHER_SHA),
            item(id = "wellness-wear"),
            item(id = "evaglass-wear", pkg = "com.evaglass.app", sha = OTHER_SHA),
        )
        assertEquals("wear-debug.apk", (decide(json, 1400).available()).apk)
        assertEquals(OTHER_SHA, decide(json, 1400, "wellness-phone").available().sha256)
        assertEquals("com.evaglass.app", decide(json, 1400, "evaglass-wear").available().packageName)
    }

    @Test
    fun unknownIdIsBlocked() {
        val d = decide(manifest(item()), 1400, "baska-uygulama")
        assertTrue(d is OtaManifest.Decision.Blocked)
    }

    @Test
    fun duplicateIdKeepsTheFirstEntry() {
        // Ikinci kalem baska bir APK'ya isaret ediyor; karar surumden surume degismesin.
        val json = manifest(item(), item(apk = "sahte.apk", sha = OTHER_SHA))
        assertEquals("wear-debug.apk", decide(json, 1400).available().apk)
    }

    @Test
    fun oneBrokenEntryDoesNotBreakTheOthers() {
        // Bir uygulamanin yayin hatasi digerlerinin guncellemesini durdurmasin.
        val broken = """{"id":"bozuk","package":"com.x"}"""
        val json = manifest(broken, item())
        assertEquals(listOf("wellness-wear"), OtaManifest.parse(json).map { it.id })
        assertTrue(decide(json, 1400) is OtaManifest.Decision.Available)
        assertTrue(decide(json, 1400, "bozuk") is OtaManifest.Decision.Blocked)
    }

    @Test
    fun sameVersionCodeIsUpToDate() {
        assertEquals(OtaManifest.Decision.UpToDate, decide(manifest(item(code = 1400)), 1400))
    }

    @Test
    fun olderVersionCodeNeverDowngrades() {
        assertEquals(OtaManifest.Decision.UpToDate, decide(manifest(item(code = 1300)), 1400))
    }

    @Test
    fun versionNameFallsBackToCode() {
        val json = """{"apps":[{"id":"a","package":"com.x","versionCode":1500,"apk":"a.apk",
            "url":"https://h/a.apk","sha256":"$SHA"}]}"""
        val app = decide(json, 1400, "a").available()
        assertEquals("1500", app.versionName)
        assertEquals("id yoksa ad da id olur", "a", app.name)
    }

    @Test
    fun sha256IsNormalisedToLowercase() {
        assertEquals(SHA, decide(manifest(item(sha = SHA.uppercase())), 1400).available().sha256)
    }

    @Test
    fun entriesWithoutUsableShaOrUrlAreDropped() {
        // sha256'siz ya da cleartext adresli kalem hic var olmamis gibi davranir:
        // dogrulanamayan APK kurulmaz, sessizce "guvenilir" sayilmaz.
        val noSha = """{"id":"a","package":"com.x","versionCode":1500,"apk":"a.apk","url":"https://h/a.apk"}"""
        val shortSha = item(sha = "abcd")
        val notHex = item(sha = "z".repeat(64))
        val cleartext = item(url = "http://insecure/w.apk")
        val noPackage = """{"id":"a","versionCode":1500,"apk":"a.apk","url":"https://h/a.apk","sha256":"$SHA"}"""
        listOf(noSha, shortSha, notHex, cleartext, noPackage).forEach {
            assertTrue("kabul edilmemeli: $it", OtaManifest.parse(manifest(it)).isEmpty())
        }
    }

    @Test
    fun malformedManifestIsBlockedNotCrashed() {
        // Ag yoksa/proxy HTML dondururse govde JSON degil: cagiran patlamasin, kurulum da olmasin.
        listOf("", "<html>502</html>", """{"apps":[]}""", """{"versionCode":1500}""").forEach {
            assertTrue("bloklanmali: $it", decide(it, 1400) is OtaManifest.Decision.Blocked)
        }
    }

    @Test
    fun manifestProducedByCiIsAccepted() {
        // .github/workflows/apk.yml ciktisinin birebir sekli - alan adi kayarsa burada patlar,
        // sahada "guncelleme yok" diye sessizce durmaz.
        val ci = """
            {
              "apps": [
                {
                  "id": "wellness-phone",
                  "name": "Wellness (telefon)",
                  "package": "com.evaitec.wellness",
                  "versionCode": 1400,
                  "versionName": "0.14.0",
                  "apk": "app-debug.apk",
                  "url": "https://github.com/evatechnosoft/life-os-wellness/releases/download/v0.14.0/app-debug.apk",
                  "sha256": "8c64f50e17855dd62771bbdb2f6cf6f89a22e4673e5b6c09ed9a40b070c3fda9"
                },
                {
                  "id": "wellness-wear",
                  "name": "Wellness (saat)",
                  "package": "com.evaitec.wellness",
                  "versionCode": 1400,
                  "versionName": "0.14.0",
                  "apk": "wear-debug.apk",
                  "url": "https://github.com/evatechnosoft/life-os-wellness/releases/download/v0.14.0/wear-debug.apk",
                  "sha256": "9edafa85ecf13164e7270a8e6ad904a5fdfa849e9787a3dced91f35d69e3f786"
                }
              ]
            }
        """.trimIndent()
        assertEquals(listOf("wellness-phone", "wellness-wear"), OtaManifest.parse(ci).map { it.id })
        val wear = decide(ci, 1300).available()
        assertEquals("0.14.0", wear.versionName)
        assertEquals("9edafa85ecf13164e7270a8e6ad904a5fdfa849e9787a3dced91f35d69e3f786", wear.sha256)
        assertEquals(OtaManifest.Decision.UpToDate, decide(ci, 1400))
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
        val digest = OtaManifest.sha256("abc".toByteArray())
        assertTrue(OtaManifest.matches(digest, digest.uppercase()))
        assertTrue(!OtaManifest.matches(digest, SHA))
    }

    private fun OtaManifest.Decision.available(): OtaManifest.App =
        (this as OtaManifest.Decision.Available).app

    private companion object {
        const val SHA = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
        const val OTHER_SHA = "fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210"
    }
}
