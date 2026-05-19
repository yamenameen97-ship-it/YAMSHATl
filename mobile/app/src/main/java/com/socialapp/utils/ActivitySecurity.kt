package com.socialapp.utils

import android.app.Activity
import android.os.Build
import android.view.WindowManager
import android.widget.Toast
import com.socialapp.BuildConfig

object ActivitySecurity {
    fun enableSecureWindow(activity: Activity) {
        activity.window.addFlags(WindowManager.LayoutParams.FLAG_SECURE)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            activity.window.attributes = activity.window.attributes.apply {
                layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
            }
        }

        if (!BuildConfig.ENFORCE_RUNTIME_SECURITY) return

        activity.window.decorView.post {
            val threat = SecurityThreatDetector.detect(activity.applicationContext) ?: return@post
            if (activity.isFinishing || activity.isDestroyed) return@post
            CrashReporter.logSecurityEvent(threat.code, threat.message)
            Toast.makeText(activity, threat.message, Toast.LENGTH_LONG).show()
            activity.finishAffinity()
        }
    }
}
