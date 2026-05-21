package com.socialapp.utils

import android.app.Activity
import android.view.WindowManager
import com.socialapp.BuildConfig
import okhttp3.CertificatePinner
import java.io.File

object AppSecurityManager {

    fun applyScreenProtection(activity: Activity) {
        if (!BuildConfig.DEBUG) {
            activity.window.setFlags(
                WindowManager.LayoutParams.FLAG_SECURE,
                WindowManager.LayoutParams.FLAG_SECURE
            )
        }
    }

    fun isDeviceRooted(): Boolean {
        val paths = arrayOf(
            "/system/app/Superuser.apk",
            "/sbin/su",
            "/system/bin/su",
            "/system/xbin/su",
            "/data/local/xbin/su",
            "/data/local/bin/su",
            "/system/sd/xbin/su",
            "/system/bin/failsafe/su",
            "/data/local/su"
        )
        for (path in paths) {
            if (File(path).exists()) return true
        }
        return false
    }

    fun getCertificatePinner(): CertificatePinner {
        return CertificatePinner.Builder()
            .add("yamshatl.onrender.com", "sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=") // Replace with actual pins
            .add("yamshat-enqr8c2d.livekit.cloud", "sha256/BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=")
            .build()
    }
}
