package com.socialapp.sync

import android.content.Context
import androidx.work.BackoffPolicy
import androidx.work.Constraints
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.ExistingWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.workDataOf
import com.socialapp.utils.PowerManager
import java.util.concurrent.TimeUnit

object SmartSyncScheduler {
    private const val PERIODIC_WORK = "yamshat_smart_background_sync"
    private const val IMMEDIATE_WORK = "yamshat_smart_background_sync_now"

    fun schedule(context: Context, immediate: Boolean = false) {
        val powerManager = PowerManager(context)
        val intervalMinutes = powerManager.getRecommendedPollingInterval(15).coerceAtLeast(15)
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .setRequiresBatteryNotLow(true)
            .build()

        val periodic = PeriodicWorkRequestBuilder<SmartSyncWorker>(intervalMinutes.toLong(), TimeUnit.MINUTES)
            .setConstraints(constraints)
            .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 15, TimeUnit.SECONDS)
            .build()

        WorkManager.getInstance(context).enqueueUniquePeriodicWork(
            PERIODIC_WORK,
            ExistingPeriodicWorkPolicy.UPDATE,
            periodic,
        )

        if (immediate) {
            val oneTime = OneTimeWorkRequestBuilder<SmartSyncWorker>()
                .setInputData(workDataOf(SmartSyncWorker.KEY_FORCE to true))
                .setConstraints(
                    Constraints.Builder()
                        .setRequiredNetworkType(NetworkType.CONNECTED)
                        .build()
                )
                .build()
            WorkManager.getInstance(context).enqueueUniqueWork(
                IMMEDIATE_WORK,
                ExistingWorkPolicy.REPLACE,
                oneTime,
            )
        }
    }
}
