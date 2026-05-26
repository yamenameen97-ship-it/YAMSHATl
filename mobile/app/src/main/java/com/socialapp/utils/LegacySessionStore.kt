package com.socialapp.utils

import android.content.Context
import android.util.Base64

@Deprecated("Use com.socialapp.network.SessionManager instead")
class LegacySessionStore(context: Context) {
    private val prefs = context.getSharedPreferences("app", Context.MODE_PRIVATE)

    fun saveToken(token: String?) {
        val encoded = if (token.isNullOrBlank()) null else Base64.encodeToString(token.toByteArray(), Base64.DEFAULT)
        prefs.edit().putString("token", encoded).apply()
    }

    fun getDecodedToken(): String? {
        val encoded = prefs.getString("token", null) ?: return null
        return runCatching {
            String(Base64.decode(encoded, Base64.DEFAULT))
        }.getOrNull()
    }

    fun saveUsername(username: String) {
        prefs.edit().putString("username", username).apply()
    }

    fun getUsername(): String? = prefs.getString("username", null)

    fun savePendingFcmToken(token: String) {
        prefs.edit().putString("pending_fcm_token", token).apply()
    }

    fun getPendingFcmToken(): String? = prefs.getString("pending_fcm_token", null)

    fun clearPendingFcmToken() {
        prefs.edit().remove("pending_fcm_token").apply()
    }

    fun clearSession() {
        prefs.edit().clear().apply()
    }
}
