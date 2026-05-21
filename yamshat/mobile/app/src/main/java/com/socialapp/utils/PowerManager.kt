package com.socialapp.utils

import android.content.Context
import android.os.PowerManager as AndroidPowerManager

class PowerManager(private val context: Context) {
    private val powerManager = context.getSystemService(Context.POWER_SERVICE) as AndroidPowerManager

    fun isLowPowerMode(): Boolean = powerManager.isPowerSaveMode

    fun getRecommendedPollingInterval(baseIntervalMinutes: Int): Int {
        return when {
            powerManager.isDeviceIdleMode -> (baseIntervalMinutes * 4).coerceAtLeast(30)
            isLowPowerMode() -> (baseIntervalMinutes * 2).coerceAtLeast(20)
            else -> baseIntervalMinutes
        }
    }

    fun shouldThrottleBackgroundWork(): Boolean {
        return isLowPowerMode() || powerManager.isDeviceIdleMode
    }
}
