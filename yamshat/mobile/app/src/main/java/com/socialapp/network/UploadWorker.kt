package com.socialapp.network

import android.content.Context
import android.net.Uri
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import androidx.work.workDataOf
import com.socialapp.utils.SecureMediaManager
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import java.io.File
import java.io.FileOutputStream

class UploadWorker(context: Context, params: WorkerParameters) : CoroutineWorker(context, params) {

    companion object {
        const val KEY_FILE_URI = "file_uri"
        const val KEY_FILE_TYPE = "file_type" // "image" or "video"
        const val KEY_UPLOAD_URL = "upload_url"
        const val PROGRESS = "progress"
    }

    override suspend fun doWork(): Result {
        val fileUriString = inputData.getString(KEY_FILE_URI) ?: return Result.failure()
        val fileType = inputData.getString(KEY_FILE_TYPE) ?: "image"
        val fileUri = Uri.parse(fileUriString)

        try {
            // 1. Compression (Simplified for this logic, real implementation would use Luban/VideoCompressor)
            val compressedFile = compressMedia(fileUri, fileType) ?: return Result.failure()

            // 2. Upload with Progress
            val requestFile = compressedFile.asRequestBody(
                applicationContext.contentResolver.getType(fileUri)?.toMediaTypeOrNull()
            )
            
            val body = MultipartBody.Part.createFormData("file", compressedFile.name, requestFile)
            
            // Note: In a real app, we'd use a custom RequestBody to track progress
            // For this implementation, we simulate progress and call the API
            setProgress(workDataOf(PROGRESS to 0))
            
            val response = ApiClient.api.uploadFile(body).execute()
            
            if (response.isSuccessful) {
                setProgress(workDataOf(PROGRESS to 100))
                return Result.success(workDataOf("url" to response.body()?.get("url")))
            } else {
                if (runAttemptCount < 3) {
                    return Result.retry()
                }
                return Result.failure()
            }
        } catch (e: Exception) {
            if (runAttemptCount < 3) {
                return Result.retry()
            }
            return Result.failure()
        }
    }

    private fun compressMedia(uri: Uri, type: String): File? {
        // Implementation of compression logic using Luban for images or VideoCompressor for videos
        // For now, we return a temp copy to simulate the process
        val tempFile = SecureMediaManager.createSecureTempFile(applicationContext, "upload_", if(type == "video") ".mp4" else ".jpg")
        applicationContext.contentResolver.openInputStream(uri)?.use { input ->
            FileOutputStream(tempFile).use { output ->
                input.copyTo(output)
            }
        }
        return tempFile
    }
}
