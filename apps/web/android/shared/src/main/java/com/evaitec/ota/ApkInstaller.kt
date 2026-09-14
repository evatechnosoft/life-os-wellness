package com.evaitec.ota

import android.content.Context
import android.content.Intent
import android.content.pm.PackageInfo
import android.content.pm.PackageManager
import android.net.Uri
import android.provider.Settings
import androidx.core.content.FileProvider
import java.io.File

/**
 * evaitecOTA - kurulumun tek kapisi. Projeye ozel hicbir sey bilmez: ne kurulacagini
 * manifestteki kalem (OtaManifest.App) soyler.
 *
 * Dosya nereden gelirse gelsin (OTA indirmesi ya da telefondan kanal) dort kilit acilmak
 * zorunda:
 *  1. **sha256** manifestteki degerle ayni,
 *  2. **paket adi** manifestteki kalemin paketi - manifestte olmayan hicbir paket kurulmaz,
 *  3. **versionCode** manifestteki kalemle ayni (baska bir surum siziyorsa dur),
 *  4. paket zaten kuruluysa **imza anahtari** kurulu surumle ayni ve surum ondan buyuk.
 *
 * Tutmayan dosya silinir. Keyfi URL/dosya kabul eden bir kurucu, kotu amacli yazilimla
 * ayni sekle sahiptir. Kullanici yine sistem yukleyicisinin onayini gorur; sessiz kurulum
 * yalniz device-owner'da mumkun.
 *
 * FileProvider authority'si "<kurucu paketi>.fileprovider" - kuran uygulamanin manifestinde
 * tanimli olmali, yoksa getUriForFile firlar ve kullanici bunu "indirme hatasi" diye okur.
 */
object ApkInstaller {

    fun install(context: Context, apk: File, app: OtaManifest.App): Result<Unit> = runCatching {
        try {
            verify(context, apk, app)
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
        val uri = FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", apk)
        context.startActivity(
            Intent(Intent.ACTION_VIEW).apply {
                setDataAndType(uri, "application/vnd.android.package-archive")
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            },
        )
    }

    /** Kurulu surum, kurulu degilse 0 - "sadece-yukselt" karsilastirmasinin girdisi. */
    fun installedVersionCode(context: Context, packageName: String): Int =
        installed(context, packageName)?.longVersionCode?.toInt() ?: 0

    private fun verify(context: Context, apk: File, app: OtaManifest.App) {
        val actual = apk.inputStream().use { OtaManifest.sha256(it) }
        if (!OtaManifest.matches(actual, app.sha256)) {
            error("sha256 tutmadi (beklenen ${app.sha256}, gelen $actual)")
        }
        val pm = context.packageManager
        val incoming = pm.getPackageArchiveInfo(apk.absolutePath, PackageManager.GET_SIGNING_CERTIFICATES)
            ?: error("APK okunamadi")
        if (incoming.packageName != app.packageName) {
            error("paket manifestle tutmuyor: ${incoming.packageName}")
        }
        if (incoming.longVersionCode.toInt() != app.versionCode) {
            error("surum manifestle tutmuyor: ${incoming.longVersionCode} != ${app.versionCode}")
        }
        // Ilk kurulumda karsilastiracak imza yok; sonrakilerde anahtar degisemez.
        val current = installed(context, app.packageName) ?: return
        val incomingSigners = signers(incoming)
        if (incomingSigners.isEmpty() || incomingSigners != signers(current)) {
            error("imza anahtari kurulu surumle ayni degil")
        }
        if (incoming.longVersionCode <= current.longVersionCode) {
            error("surum yeni degil (${incoming.longVersionCode} <= ${current.longVersionCode})")
        }
    }

    private fun installed(context: Context, packageName: String): PackageInfo? = try {
        context.packageManager.getPackageInfo(packageName, PackageManager.GET_SIGNING_CERTIFICATES)
    } catch (e: PackageManager.NameNotFoundException) {
        null
    }

    private fun signers(info: PackageInfo): Set<String> =
        (info.signingInfo?.apkContentsSigners ?: emptyArray())
            .map { OtaManifest.sha256(it.toByteArray()) }
            .toSet()
}
