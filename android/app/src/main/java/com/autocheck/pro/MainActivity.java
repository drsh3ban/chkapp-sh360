package com.autocheck.pro;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.capacitorjs.plugins.share.SharePlugin;
import com.capacitorjs.plugins.camera.CameraPlugin;
import com.capacitorjs.plugins.filesystem.FilesystemPlugin;
import com.capacitorjs.plugins.preferences.PreferencesPlugin;
import com.epicshaggy.biometric.NativeBiometric;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        registerPlugin(SharePlugin.class);
        registerPlugin(CameraPlugin.class);
        registerPlugin(FilesystemPlugin.class);
        registerPlugin(PreferencesPlugin.class);
        registerPlugin(NativeBiometric.class);
    }
}
