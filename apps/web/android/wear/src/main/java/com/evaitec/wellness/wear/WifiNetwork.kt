package com.evaitec.wellness.wear

import android.content.Context
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.withTimeoutOrNull

/**
 * Telefon bagliyken Wear OS saatin trafigini Bluetooth vekiline yollar (birkac KB/s):
 * 13 MB APK dakikalar surer, ekran kapaninca kopar. Buyuk indirme icin Wi-Fi acikca
 * istenir ve surec ona baglanir (developer.android.com/training/wearables/data/network-access,
 * "Request high-bandwidth network"). Wi-Fi gelmezse varsayilan agla devam edilir.
 */
object WifiNetwork {

    /** Wi-Fi bulunduysa true ile, bulunamadiysa false ile [block] calisir; istek her durumda birakilir. */
    suspend fun <T> use(context: Context, timeoutMs: Long = WAIT_MS, block: suspend (onWifi: Boolean) -> T): T {
        val cm = context.getSystemService(ConnectivityManager::class.java)
        val found = CompletableDeferred<Network>()
        val callback = object : ConnectivityManager.NetworkCallback() {
            override fun onAvailable(network: Network) {
                found.complete(network)
            }
        }
        val request = NetworkRequest.Builder()
            .addTransportType(NetworkCapabilities.TRANSPORT_WIFI)
            .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
            .build()
        cm.requestNetwork(request, callback)
        try {
            val wifi = withTimeoutOrNull(timeoutMs) { found.await() }
            if (wifi != null) cm.bindProcessToNetwork(wifi)
            return block(wifi != null)
        } finally {
            cm.bindProcessToNetwork(null)
            cm.unregisterNetworkCallback(callback)
        }
    }

    private const val WAIT_MS = 10_000L
}
