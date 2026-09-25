package com.evaitec.wellness;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Local plugin: the night microphone monitor lives in this app, not in an npm package.
        registerPlugin(SleepPlugin.class);
        // Health Connect'in capacitor-health ile okunamayan iki olcumu: toplam kalori, nabiz.
        registerPlugin(HealthExtraPlugin.class);
        // Telefonun kendi bildigi hareket durumu (yurume/kosu/bisiklet/aracta/hareketsiz).
        registerPlugin(ActivityPlugin.class);
        // Saatteki uygulamadan gelen olcum kuyrugu.
        registerPlugin(WearBridgePlugin.class);
        // Sunucu yokken cihaz-ici Eva (Gemma 3 1B).
        registerPlugin(LocalLlmPlugin.class);
        // Canli web paketi: ekranlar APK'siz fit.evaitec.com/bundle/'dan guncellenir.
        registerPlugin(WebBundlePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
