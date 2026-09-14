package com.evaitec.wellness.wear

import android.content.Context
import android.content.Intent
import android.content.pm.PackageInfo
import android.content.pm.PackageManager
import android.net.Uri
import android.provider.Settings
import androidx.core.content.FileProvider
import com.evaitec.wellness.ota.OtaManifest
import java.io.File

/**
 * Kurulumun tek kapisi. Ister OTA ile indirilmis olsun ister telefondan kanalla gelmis,
 * APK buradan gecer ve dort kilidin hepsini acmak zorundadir:
 *
 *  1. **sha256** imzali manifestteki degerle ayni (dosyanin kendisi degil, manifest soyler),
 *  2. **paket adi** bizimkiyle ayni (yabanci bir uygulama kurdurulamaz),
 *  3. **imza anahtari** kurulu surumle ayni (baska bir derleyicinin APK'si giremez),
 *  4. **versionCode** kuruludan buyuk (downgrade ve kurulum dongusu yok).
 *
 * Tutmayan dosya silinir. Keyfi URL/dosya kabul eden bir kurucu, kotu amacli yazilimla
 * ayni sekle sahiptir - bu yuzden hicbir kilit "kolaylik olsun" diye atlanmiyor.
 *
 * Kullanici yine sistem yukleyicisinin onay ekranini gorur; sessiz kurulum yalniz
 * device-owner'da mumkun.
 */
object ApkInstaller {

    fun install(context: Context, apk: File, expectedSha256: String): Result<Unit> = runCatching {
        try {
            verify(context, apk, expectedSha256)
        } catch (e: Exception) {
            apk.delete()
            throw e
        }
        if (!context.packageManager.canRequestPackageInstalls()) {
            context.startActivity(
                Intent(
                    Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                    Uri.parse("package:${context.packageName}"),
                ).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK),
            )
            error("Bilinmeyen kaynak izni gerekiyor - Ayarlar acildi, izni ver ve tekrar dene")
        }
        // FileProvider yoksa burasi firlar ve kullanici bunu "indirme hatasi" diye okur;
        // saglayici AndroidManifest.xml + res/xml/file_paths.xml ile tanimli.
        val uri = FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", apk)
        context.startActivity(
            Intent(Intent.ACTION_VIEW).apply {
                setDataAndType(uri, "application/vnd.android.package-archive")
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            },
        )
    }

    private fun verify(context: Context, apk: File, expectedSha256: String) {
        val actual = apk.inputStream().use { OtaManifest.sha256(it) }
        if (!OtaManifest.matches(actual, expectedSha256)) {
            error("sha256 tutmadi (beklenen $expectedSha256, gelen $actual)")
        }
        val pm = context.packageManager
        val incoming = pm.getPackageArchiveInfo(apk.absolutePath, PackageManager.GET_SIGNING_CERTIFICATES)
            ?: error("APK okunamadi")
        if (incoming.packageName != context.packageName) {
            error("yabanci paket: ${incoming.packageName}")
        }
        val installed = pm.getPackageInfo(context.packageName, PackageManager.GET_SIGNING_CERTIFICATES)
        val incomingSigners = signers(incoming)
        if (incomingSigners.isEmpty() || incomingSigners != signers(installed)) {
            error("imza anahtari kurulu surumle ayni degil")
        }
        if (incoming.longVersionCode <= installed.longVersionCode) {
            error("surum yeni degil (${incoming.longVersionCode} <= ${installed.longVersionCode})")
        }
    }

    private fun signers(info: PackageInfo): Set<String> =
        (info.signingInfo?.apkContentsSigners ?: emptyArray())
            .map { OtaManifest.sha256(it.toByteArray()) }
            .toSet()
}
