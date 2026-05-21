package com.socialapp.repositories

import com.socialapp.models.ApiMessage
import com.socialapp.network.ApiService
import com.socialapp.network.SessionManager
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class MainRepository @Inject constructor(
    private val apiService: ApiService,
) {
    fun hasActiveSession(): Boolean = SessionManager.hasToken()

    fun getAuthToken(): String? = SessionManager.getToken()

    suspend fun login(credentials: Map<String, String>): ApiMessage {
        val response = apiService.login(credentials).execute()
        val body = response.body() ?: ApiMessage(ok = false, message = "Login failed")
        if (response.isSuccessful && !(body.access_token ?: body.token).isNullOrBlank()) {
            SessionManager.saveSession(
                accessToken = body.access_token ?: body.token,
                refreshToken = body.refresh_token,
                username = body.username ?: body.user,
                email = body.email,
                role = body.role,
                permissions = body.permissions,
                avatar = body.avatar,
                expiresInMinutes = body.expires_in_minutes,
                refreshExpiresInDays = body.refresh_expires_in_days,
            )
        }
        return body
    }

    suspend fun syncPushToken(token: String): Boolean {
        if (token.isBlank()) return false
        return runCatching {
            apiService.saveDeviceToken(mapOf("token" to token)).execute().isSuccessful
        }.getOrElse { false }
    }

    suspend fun sendMessage(message: Map<String, Any?>): ApiMessage {
        val response = apiService.sendMessage(message).execute()
        return response.body() ?: ApiMessage(ok = response.isSuccessful, message = if (response.isSuccessful) "queued" else "failed")
    }

    suspend fun createLiveRoom(roomDetails: Map<String, String>): ApiMessage {
        val payload = roomDetails.mapValues { it.value as Any }
        val response = apiService.createLive(payload).execute()
        return response.body() ?: ApiMessage(ok = response.isSuccessful, message = if (response.isSuccessful) "created" else "failed")
    }

    fun logout() {
        SessionManager.clearSession()
    }
}
