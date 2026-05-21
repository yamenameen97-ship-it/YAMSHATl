package com.socialapp.utils

import android.content.Context
import com.google.android.play.core.integrity.IntegrityManagerFactory
import com.google.android.play.core.integrity.IntegrityTokenRequest
import com.socialapp.BuildConfig
import java.security.MessageDigest
import java.util.UUID

object PlayIntegrityManager {
    @Volatile
    private var lastIntegrityToken: String? = null

    fun warmUp(context: Context) {
        if (!BuildConfig.ENABLE_PLAY_INTEGRITY || BuildConfig.PLAY_INTEGRITY_PROJECT_NUMBER.isBlank()) return
        requestIntegrityToken(context) { }
    }

    fun getCachedToken(): String? = lastIntegrityToken

    fun requestIntegrityToken(context: Context, onResult: (String?) -> Unit) {
        if (!BuildConfig.ENABLE_PLAY_INTEGRITY) {
            onResult(null)
            return
        }
        val cloudProjectNumber = BuildConfig.PLAY_INTEGRITY_PROJECT_NUMBER.toLongOrNull()
        if (cloudProjectNumber == null) {
            AppLogger.w("PlayIntegrity", "Cloud project number is missing")
            onResult(null)
            return
        }
        val integrityManager = IntegrityManagerFactory.create(context.applicationContext)
        val request = IntegrityTokenRequest.builder()
            .setCloudProjectNumber(cloudProjectNumber)
            .setNonce(buildNonce())
            .build()
        integrityManager.requestIntegrityToken(request)
            .addOnSuccessListener { response ->
                lastIntegrityToken = response.token()
                CrashReporter.log("play_integrity_token_acquired")
                onResult(response.token())
            }
            .addOnFailureListener { throwable ->
                AppLogger.w("PlayIntegrity", "Integrity request failed", throwable)
                onResult(null)
            }
    }

    private fun buildNonce(): String {
        val raw = UUID.randomUUID().toString() + System.currentTimeMillis()
        val digest = MessageDigest.getInstance("SHA-256").digest(raw.toByteArray())
        return android.util.Base64.encodeToString(digest, android.util.Base64.NO_WRAP)
    }
}
