package com.beblucech;

import android.app.Activity;
import android.app.admin.DevicePolicyManager;
import android.content.ComponentName;
import android.content.Context;
import android.view.View;
import android.widget.Toast;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class ScreenLock extends ReactContextBaseJavaModule {

    public ScreenLock(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "ScreenLock";
    }

    @ReactMethod
    public void lock() {
        final Activity activity = getCurrentActivity();

        ComponentName deviceAdmin = new ComponentName(activity, AdminReceiver.class);

        // get policy manager
        DevicePolicyManager devicePolicyManager = (DevicePolicyManager) activity.getSystemService(Context.DEVICE_POLICY_SERVICE);

        if (!devicePolicyManager.isAdminActive(deviceAdmin)) {
            Toast.makeText(activity, activity.getString(R.string.not_device_admin), Toast.LENGTH_SHORT).show();
        }

        if (devicePolicyManager.isDeviceOwnerApp(activity.getPackageName())) {
            devicePolicyManager.setLockTaskPackages(deviceAdmin, new String[]{activity.getPackageName()});
        } else {
            Toast.makeText(activity, activity.getString(R.string.not_device_owner), Toast.LENGTH_SHORT).show();
        }
        if (devicePolicyManager.isLockTaskPermitted(activity.getPackageName())) {
            activity.startLockTask();
        } else {
            Toast.makeText(activity, activity.getString(R.string.kiosk_not_permitted), Toast.LENGTH_SHORT).show();
        }
    }

    @ReactMethod
    public void unlock() {
        final Activity activity = getCurrentActivity();
        activity.stopLockTask();
    }
}
