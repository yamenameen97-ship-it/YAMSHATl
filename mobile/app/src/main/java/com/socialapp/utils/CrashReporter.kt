package com.socialapp.utils

import android.content.Context
import android.util.Log
import com.google.firebase.crashlytics.FirebaseCrashlytics
import com.socialapp.BuildConfig

object CrashReporter {
    @Volatile
    private var initialized = false

    fun init(context: Context) {
        if (initialized) return
        initialized = true
        runCatching {
            val crashlytics = FirebaseCrashlytics.getInstance()
            crashlytics.setCrashlyticsCollectionEnabled(!BuildConfig.DEBUG)
            crashlytics.setCustomKey("application_id", BuildConfig.APPLICATION_ID)
            crashlytics.setCustomKey("build_type", BuildConfig.BUILD_TYPE)
            crashlytics.setCustomKey("version_name", BuildConfig.VERSION_NAME)
            crashlytics.setCustomKey("version_code", BuildConfig.VERSION_CODE)
            crashlytics.setCustomKey("runtime_security", BuildConfig.ENFORCE_RUNTIME_SECURITY)
            crashlytics.log("CrashReporter initialized")
        }.onFailure {
            if (BuildConfig.ENABLE_LOGS) {
                Log.w("CrashReporter", "Crashlytics init failed", it)
            }
        }
    }

    fun setUser(userId: String?, email: String? = null) {
        runCatching {
            val crashlytics = FirebaseCrashlytics.getInstance()
            crashlytics.setUserId(userId?.ifBlank { "anonymous" } ?: "anonymous")
            if (!email.isNullOrBlank()) {
                crashlytics.setCustomKey("user_email", email)
            }
        }
    }

    fun recordHandledException(throwable: Throwable, source: String, extras: Map<String, String> = emptyMap()) {
        runCatching {
            val crashlytics = FirebaseCrashlytics.getInstance()
            crashlytics.log("Handled exception from $source")
            extras.forEach { (key, value) ->
                crashlytics.setCustomKey(key, value)
            }
            crashlytics.recordException(throwable)
        }.onFailure {
            if (BuildConfig.ENABLE_LOGS) {
                Log.w("CrashReporter", "recordHandledException failed", it)
            }
        }
    }

    fun logSecurityEvent(code: String, message: String) {
        runCatching {
            val crashlytics = FirebaseCrashlytics.getInstance()
            crashlytics.setCustomKey("last_security_code", code)
            crashlytics.log("Security event [$code]: $message")
        }
    }

    fun log(message: String) {
        runCatching { FirebaseCrashlytics.getInstance().log(message) }
    }
}
