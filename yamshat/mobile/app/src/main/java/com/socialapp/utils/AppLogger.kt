package com.socialapp.utils

import android.util.Log
import com.socialapp.BuildConfig

object AppLogger {
    fun d(tag: String, message: String) {
        if (BuildConfig.ENABLE_LOGS) Log.d(tag, message)
    }

    fun i(tag: String, message: String) {
        Log.i(tag, message)
        CrashReporter.log("[$tag] $message")
    }

    fun w(tag: String, message: String, throwable: Throwable? = null) {
        Log.w(tag, message, throwable)
        CrashReporter.log("WARN [$tag] $message")
    }

    fun e(tag: String, message: String, throwable: Throwable? = null) {
        Log.e(tag, message, throwable)
        throwable?.let { CrashReporter.recordHandledException(it, tag) } ?: CrashReporter.log("ERROR [$tag] $message")
    }
}
