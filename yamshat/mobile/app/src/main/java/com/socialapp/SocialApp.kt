package com.socialapp

import android.app.Activity
import android.app.Application
import android.content.ComponentCallbacks2
import android.content.res.Configuration
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.Log
import com.google.firebase.FirebaseApp
import com.socialapp.network.SessionManager
import com.socialapp.signal.SignalProtocolManager
import com.socialapp.sync.SmartSyncScheduler
import com.socialapp.utils.AppAnalytics
import com.socialapp.utils.CrashReporter
import com.socialapp.utils.FirebaseBridge
import com.socialapp.utils.ImageLoader
import com.socialapp.utils.MonitoringManager
import com.socialapp.utils.NotificationHelper
import com.socialapp.utils.PerformanceMonitor
import com.socialapp.utils.PlayIntegrityManager
import com.socialapp.utils.SecureMediaManager
import com.socialapp.utils.SecurityThreatDetector
import dagger.hilt.android.HiltAndroidApp

@HiltAndroidApp
class SocialApp : Application() {
    override fun onCreate() {
        PerformanceMonitor.markAppStart()
        super.onCreate()
        installGlobalCrashHandler()
        SessionManager.init(this)
        val startupThreat = SecurityThreatDetector.detect(this)
        if (startupThreat != null) {
            MonitoringManager.trackSecuritySignal(startupThreat.code, startupThreat.message)
            return
        }

        ImageLoader.init(this)
        SecureMediaManager.cleanupOldFiles(this)
        registerSessionLifecycleCallbacks()
        registerMemoryCallbacks()

        Handler(Looper.getMainLooper()).post {
            initNonCriticalServices()
        }

        SmartSyncScheduler.schedule(this, immediate = SessionManager.hasToken())
        MonitoringManager.init(this)
        PlayIntegrityManager.warmUp(this)
        AppAnalytics.openApp()
        PerformanceMonitor.finishAppStart()
    }

    private fun initNonCriticalServices() {
        runCatching { FirebaseApp.initializeApp(this) }
        CrashReporter.init(this)
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

    private fun registerMemoryCallbacks() {
        registerComponentCallbacks(object : ComponentCallbacks2 {
            override fun onTrimMemory(level: Int) {
                ImageLoader.trimMemory(level)
                PerformanceMonitor.monitorMemory("trim:$level")
            }

            override fun onConfigurationChanged(newConfig: Configuration) = Unit
            override fun onLowMemory() {
                ImageLoader.trimMemory(ComponentCallbacks2.TRIM_MEMORY_COMPLETE)
                PerformanceMonitor.monitorMemory("low-memory")
            }
        })
    }

    private fun installGlobalCrashHandler() {
        com.socialapp.utils.GlobalExceptionHandler.initialize(this)
    }
}
