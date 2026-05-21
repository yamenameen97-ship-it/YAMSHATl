package com.socialapp.utils

import android.app.Activity
import android.view.Window
import android.os.SystemClock
import android.util.Log
import androidx.core.app.FrameMetricsAggregator
import com.google.firebase.perf.FirebasePerformance
import com.google.firebase.perf.metrics.Trace
import java.util.concurrent.ConcurrentHashMap

object PerformanceMonitor {
    private val traces = ConcurrentHashMap<String, Trace>()
    private var startupAtMs: Long = 0L
    private var frameAggregator: FrameMetricsAggregator? = null

    fun markAppStart() {
        startupAtMs = SystemClock.elapsedRealtime()
        startTrace("app_cold_start")
    }

    fun finishAppStart() {
        if (startupAtMs <= 0L) return
        val duration = SystemClock.elapsedRealtime() - startupAtMs
        stopTrace("app_cold_start", mapOf("duration_ms" to duration))
        Log.d("PerfMonitor", "Cold start: ${duration}ms")
    }

    fun startTrace(traceName: String) {
        val trace = FirebasePerformance.getInstance().newTrace(traceName)
        trace.start()
        traces[traceName] = trace
    }

    fun stopTrace(traceName: String, metrics: Map<String, Long> = emptyMap()) {
        traces.remove(traceName)?.let { trace ->
            metrics.forEach { (key, value) -> trace.putMetric(key, value) }
            trace.stop()
        }
    }

    fun logNetworkRequest(url: String, method: String, responseCode: Int, duration: Long) {
        Log.d("PerfMonitor", "Network: $method $url - $responseCode in ${duration}ms")
    }

    fun monitorMemory(tag: String = "runtime") {
        val runtime = Runtime.getRuntime()
        val usedMemory = (runtime.totalMemory() - runtime.freeMemory()) / 1024 / 1024
        val maxMemory = runtime.maxMemory() / 1024 / 1024
        Log.d("PerfMonitor", "[$tag] Used Memory: ${usedMemory}MB / ${maxMemory}MB")
    }

    fun startFrameCollection(activity: Activity) {
        if (frameAggregator != null) return
        frameAggregator = FrameMetricsAggregator().also { it.add(activity) }
    }

    fun stopFrameCollection(activity: Activity): Pair<Int, Int> {
        val metrics = frameAggregator?.remove(activity)
        frameAggregator = null
        val totalFrames = metrics?.get(FrameMetricsAggregator.TOTAL_INDEX)?.size() ?: 0
        val slowFrames = metrics?.get(FrameMetricsAggregator.TOTAL_INDEX)?.let { histogram ->
            var slow = 0
            for (i in 0 until histogram.size()) {
                val frameDurationNs = histogram.keyAt(i)
                if (frameDurationNs > 16_666_666) {
                    slow += histogram.valueAt(i)
                }
            }
            slow
        } ?: 0
        Log.d("PerfMonitor", "Frame stats total=$totalFrames slow=$slowFrames")
        return totalFrames to slowFrames
    }
}
