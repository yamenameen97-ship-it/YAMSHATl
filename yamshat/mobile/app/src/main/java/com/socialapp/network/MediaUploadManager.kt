package com.socialapp.network

import android.content.Context
import androidx.work.BackoffPolicy
import androidx.work.Constraints
import androidx.work.ExistingWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.workDataOf
import java.io.File
import java.util.concurrent.TimeUnit

class MediaUploadManager(private val context: Context) {
    fun uploadMedia(filePath: String, fileType: String = "image") {
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .setRequiresBatteryNotLow(true)
            .build()

        val uploadWorkRequest = OneTimeWorkRequestBuilder<UploadWorker>()
            .setConstraints(constraints)
            .setInputData(
                workDataOf(
                    UploadWorker.KEY_FILE_URI to filePath,
                    UploadWorker.KEY_FILE_TYPE to fileType,
                )
            )
            .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 30, TimeUnit.SECONDS)
            .build()

        WorkManager.getInstance(context).enqueueUniqueWork(
            "upload_${File(filePath).name}",
            ExistingWorkPolicy.REPLACE,
            uploadWorkRequest,
        )
    }
}
