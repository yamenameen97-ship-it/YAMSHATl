package com.socialapp.utils

import android.app.ActivityManager
import android.content.Context
import android.os.Process
import android.os.SystemClock
import androidx.core.os.bundleOf
import com.google.firebase.analytics.FirebaseAnalytics

object MonitoringManager {
    private var lastCpuSampleAt = 0L
    private var lastCpuUptimeMs = 0L

    fun init(context: Context) {
        sampleRuntimeHealth(context, source = "app_init")
    }

    fun trackScreen(name: String) {
        AppAnalytics.trackScreen(name)
        CrashReporter.log("screen:$name")
    }

    fun trackMetric(name: String, value: Long, unit: String = "count") {
        AppAnalytics.trackEvent(
            "metric_$name",
            mapOf(
                "value" to value,
                "unit" to unit,
            )
        )
        CrashReporter.log("metric:$name=$value$unit")
    }

    fun trackNavigation(target: String) {
        AppAnalytics.trackEvent("navigation", mapOf("target" to target))
    }

    fun trackSecuritySignal(code: String, message: String) {
        CrashReporter.logSecurityEvent(code, message)
        AppAnalytics.trackEvent("security_signal", mapOf("code" to code))
    }

    fun sampleRuntimeHealth(context: Context, source: String) {
        val activityManager = context.getSystemService(Context.ACTIVITY_SERVICE) as? ActivityManager
        val memoryInfo = ActivityManager.MemoryInfo()
        activityManager?.getMemoryInfo(memoryInfo)
        val appMemInfo = activityManager?.getProcessMemoryInfo(intArrayOf(Process.myPid()))?.firstOrNull()
        val usedPssKb = appMemInfo?.totalPss?.toLong() ?: -1L
        val availMemMb = (memoryInfo.availMem / (1024 * 1024)).coerceAtLeast(0)
        val cpuUsage = sampleCpuApproximation()

        trackMetric("memory_pss_kb", usedPssKb, "kb")
        trackMetric("memory_available_mb", availMemMb, "mb")
        trackMetric("cpu_pct", cpuUsage, "pct")
        CrashReporter.log("runtime_health:$source:pss=${usedPssKb}kb avail=${availMemMb}mb cpu=${cpuUsage}%")
    }

    fun firebaseBundleForCrash(source: String, reason: String) = bundleOf(
        FirebaseAnalytics.Param.METHOD to source,
        "reason" to reason,
    )

    private fun sampleCpuApproximation(): Long {
        val now = SystemClock.elapsedRealtime()
        val cpuNow = Process.getElapsedCpuTime()
        if (lastCpuSampleAt == 0L) {
            lastCpuSampleAt = now
            lastCpuUptimeMs = cpuNow
            return 0L
        }
        val wallDelta = (now - lastCpuSampleAt).coerceAtLeast(1L)
        val cpuDelta = (cpuNow - lastCpuUptimeMs).coerceAtLeast(0L)
        lastCpuSampleAt = now
        lastCpuUptimeMs = cpuNow
        return ((cpuDelta * 100) / wallDelta).coerceIn(0L, 100L)
    }
}
