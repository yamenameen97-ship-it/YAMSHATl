package com.socialapp.sync

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import androidx.work.workDataOf
import com.socialapp.local.SyncManager
import com.socialapp.utils.PowerManager

class SmartSyncWorker(
    context: Context,
    params: WorkerParameters,
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        val force = inputData.getBoolean(KEY_FORCE, false)
        val powerManager = PowerManager(applicationContext)
        if (!force && powerManager.shouldThrottleBackgroundWork()) {
            return if (runAttemptCount < 2) Result.retry() else Result.success()
        }

        return runCatching {
            val summary = SyncManager(applicationContext).runSync()
            Result.success(
                workDataOf(
                    "processedActions" to summary.processedActions,
                    "mergedPosts" to summary.mergedPosts,
                    "conflicts" to summary.conflicts,
                )
            )
        }.getOrElse {
            if (runAttemptCount < 3) Result.retry() else Result.failure()
        }
    }

    companion object {
        const val KEY_FORCE = "force"
    }
}
