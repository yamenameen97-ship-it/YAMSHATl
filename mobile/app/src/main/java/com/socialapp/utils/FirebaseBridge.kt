package com.socialapp.utils

import android.content.Context
import android.util.Log
import com.google.firebase.messaging.FirebaseMessaging
import com.socialapp.BuildConfig
import com.socialapp.models.ApiMessage
import com.socialapp.network.ApiClient
import com.socialapp.network.SessionManager
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

object FirebaseBridge {
    private const val TAG = "FirebaseBridge"

    private fun logWarn(message: String, throwable: Throwable? = null) {
        if (BuildConfig.ENABLE_LOGS) {
            Log.w(TAG, message, throwable)
        }
    }

    fun requestAndSyncToken(context: Context) {
        runCatching {
            FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
                if (!task.isSuccessful) {
                    logWarn("FCM token request failed", task.exception)
                    return@addOnCompleteListener
                }
                val token = task.result?.trim().orEmpty()
                if (token.isBlank()) return@addOnCompleteListener
                syncProvidedToken(context, token)
            }
        }.onFailure {
            logWarn("Firebase is not fully configured yet", it)
        }
    }

    fun syncPendingTokenIfAny(context: Context) {
        val pending = SessionManager.getPendingFcmToken().orEmpty()
        if (pending.isNotBlank() && SessionManager.hasToken()) {
            syncProvidedToken(context, pending)
        }
    }

    fun syncProvidedToken(context: Context, token: String) {
        if (token.isBlank()) return
        if (!SessionManager.hasToken()) {
            SessionManager.savePendingFcmToken(token)
            return
        }
        ApiClient.api.saveDeviceToken(
            mapOf(
                "token" to token,
                "platform" to "android",
                "app_version" to BuildConfig.VERSION_NAME
            )
        ).enqueue(object : Callback<ApiMessage> {
            override fun onResponse(call: Call<ApiMessage>, response: Response<ApiMessage>) {
                if (response.isSuccessful) {
                    SessionManager.clearPendingFcmToken()
                } else {
                    SessionManager.savePendingFcmToken(token)
                }
            }

            override fun onFailure(call: Call<ApiMessage>, t: Throwable) {
                SessionManager.savePendingFcmToken(token)
                logWarn("Failed to sync FCM token", t)
            }
        })
    }
}
