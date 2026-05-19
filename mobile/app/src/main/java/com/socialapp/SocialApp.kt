package com.socialapp

import android.app.Application
import android.app.Activity
import android.app.Application.ActivityLifecycleCallbacks
import android.os.Bundle
import android.util.Log
import com.google.firebase.FirebaseApp
import com.socialapp.network.SessionManager
import com.socialapp.signal.SignalProtocolManager
import com.socialapp.utils.AppAnalytics
import com.socialapp.utils.CrashReporter
import com.socialapp.utils.FirebaseBridge
import com.socialapp.utils.NotificationHelper
import com.socialapp.utils.SecureMediaManager
import com.socialapp.utils.SecurityThreatDetector

class SocialApp : Application() {
    override fun onCreate() {
        super.onCreate()
        installGlobalCrashHandler()
        SessionManager.init(this)
        val startupThreat = SecurityThreatDetector.detect(this)
        if (startupThreat != null) {
            CrashReporter.logSecurityEvent(startupThreat.code, startupThreat.message)
            return
        }
        runCatching { FirebaseApp.initializeApp(this) }
        CrashReporter.init(this)
        SecureMediaManager.cleanupOldFiles(this)
        registerSessionLifecycleCallbacks()
        NotificationHelper.ensureChannels(this)
        AppAnalytics.init(this)
        if (SessionManager.hasToken()) {
            FirebaseBridge.requestAndSyncToken(this)
            FirebaseBridge.syncPendingTokenIfAny(this)
            runCatching {
                SignalProtocolManager.ensureInitialized(this)
            }.onFailure {
                if (BuildConfig.ENABLE_LOGS) {
                    Log.w("SocialApp", "Failed to initialize Signal on app startup", it)
                }
            }
        }
        AppAnalytics.openApp()
    }

    private fun registerSessionLifecycleCallbacks() {
        registerActivityLifecycleCallbacks(object : ActivityLifecycleCallbacks {
            private var startedCount = 0

            override fun onActivityStarted(activity: Activity) {
                if (startedCount == 0) {
                    SessionManager.handleAppForegroundResume()
                }
                startedCount += 1
            }

            override fun onActivityResumed(activity: Activity) {
                SessionManager.recordUserPresence()
            }

            override fun onActivityPaused(activity: Activity) = Unit

            override fun onActivityStopped(activity: Activity) {
                startedCount = (startedCount - 1).coerceAtLeast(0)
                if (startedCount == 0) {
                    SessionManager.markAppBackgrounded()
                }
            }

            override fun onActivityCreated(activity: Activity, savedInstanceState: Bundle?) = Unit
            override fun onActivitySaveInstanceState(activity: Activity, outState: Bundle) = Unit
            override fun onActivityDestroyed(activity: Activity) = Unit
        })
    }

    private fun installGlobalCrashHandler() {
        val previousHandler = Thread.getDefaultUncaughtExceptionHandler()
        Thread.setDefaultUncaughtExceptionHandler { thread, throwable ->
            if (BuildConfig.ENABLE_LOGS) {
                Log.e("SocialApp", "Unhandled crash on ${thread.name}", throwable)
            }
            CrashReporter.recordHandledException(
                throwable = throwable,
                source = "uncaught_exception",
                extras = mapOf("thread_name" to thread.name),
            )
            previousHandler?.uncaughtException(thread, throwable)
        }
    }
}
