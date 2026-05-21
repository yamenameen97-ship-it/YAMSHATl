package com.socialapp.utils

import android.content.Context
import android.content.Intent
import com.socialapp.activities.CrashActivity
import kotlin.system.exitProcess

class GlobalExceptionHandler(private val context: Context) : Thread.UncaughtExceptionHandler {
    private val defaultHandler = Thread.getDefaultUncaughtExceptionHandler()

    override fun uncaughtException(thread: Thread, throwable: Throwable) {
        // Log to CrashReporter
        com.socialapp.utils.CrashReporter.recordHandledException(throwable, "global_uncaught")
        
        try {
            val intent = Intent(context, com.socialapp.activities.CrashActivity::class.java).apply {
                val errorMessage = when(throwable) {
                    is com.socialapp.network.AppError -> throwable.getDisplayMessage()
                    else -> throwable.localizedMessage ?: "حدث خطأ غير متوقع"
                }
                putExtra("error_message", errorMessage)
                putExtra("is_fatal", true)
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)
            }
            context.startActivity(intent)
            
            // Give time for the activity to start
            Thread.sleep(500)
            exitProcess(1)
        } catch (e: Exception) {
            defaultHandler?.uncaughtException(thread, throwable)
        }
    }

    companion object {
        fun initialize(context: Context) {
            Thread.setDefaultUncaughtExceptionHandler(GlobalExceptionHandler(context))
        }
    }
}
