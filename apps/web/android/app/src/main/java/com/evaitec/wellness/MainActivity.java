package com.evaitec.wellness;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Local plugin: the night microphone monitor lives in this app, not in an npm package.
        registerPlugin(SleepPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
