package com.socialapp.network

import okhttp3.Authenticator
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.Response
import okhttp3.Route
import org.json.JSONArray
import org.json.JSONObject

class RefreshTokenAuthenticator : Authenticator {
    override fun authenticate(route: Route?, response: Response): Request? {
        if (responseCount(response) >= 2) {
            return null
        }

        synchronized(this) {
            val latestToken = SessionManager.getToken().orEmpty()
            val requestToken = response.request.header("Authorization")?.removePrefix("Bearer ")?.trim().orEmpty()
            if (latestToken.isNotBlank() && latestToken != requestToken) {
                return response.request.newBuilder()
                    .header("Authorization", "Bearer $latestToken")
                    .build()
            }

            if (!SessionManager.canRefreshSession()) {
                SessionManager.markForcedLogout("انتهت الجلسة، سجّل دخولك مرة تانية")
                SessionManager.clearSession(preserveOnboarding = true)
                return null
            }

            val refreshedToken = refreshTokens() ?: return null
            return response.request.newBuilder()
                .header("Authorization", "Bearer $refreshedToken")
                .header("X-Session-Id", SessionManager.getSessionId())
                .build()
        }
    }

    private fun refreshTokens(): String? {
        val refreshToken = SessionManager.getRefreshToken().orEmpty()
        if (refreshToken.isBlank()) return null

        val body = JSONObject()
            .put("refresh_token", refreshToken)
            .toString()
            .toRequestBody("application/json; charset=utf-8".toMediaType())

        val request = Request.Builder()
            .url("${com.socialapp.utils.UrlConfig.apiBaseWithoutTrailingSlash()}/auth/refresh")
            .header("Content-Type", "application/json")
            .header("X-Session-Id", SessionManager.getSessionId())
            .post(body)
            .build()

        val client = OkHttpClient.Builder().build()
        return runCatching {
            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    SessionManager.markForcedLogout("انتهت الجلسة، سجّل دخولك مرة تانية")
                    SessionManager.clearSession(preserveOnboarding = true)
                    return null
                }

                val payload = JSONObject(response.body?.string().orEmpty())
                val accessToken = payload.optString("access_token").ifBlank { payload.optString("token") }
                if (accessToken.isBlank()) {
                    SessionManager.clearSession(preserveOnboarding = true)
                    return null
                }

                val permissions = payload.optJSONArray("permissions").toStringList().ifEmpty { SessionManager.getPermissions() }
                SessionManager.saveSession(
                    accessToken = accessToken,
                    refreshToken = payload.optString("refresh_token").ifBlank { refreshToken },
                    username = payload.optString("username").ifBlank { payload.optString("user") }.ifBlank { SessionManager.getUsername() },
                    email = payload.optString("email").ifBlank { SessionManager.getEmail() },
                    role = payload.optString("role").ifBlank { SessionManager.getRole() },
                    permissions = permissions,
                    avatar = payload.optString("avatar").ifBlank { SessionManager.getAvatar() },
                    expiresInMinutes = payload.optInt("expires_in_minutes").takeIf { it > 0 },
                    refreshExpiresInDays = payload.optInt("refresh_expires_in_days").takeIf { it > 0 },
                )
                accessToken
            }
        }.getOrElse {
            SessionManager.markForcedLogout("تعذر تجديد الجلسة، جرّب تسجيل الدخول مرة تانية")
            SessionManager.clearSession(preserveOnboarding = true)
            null
        }
    }

    private fun JSONArray?.toStringList(): List<String> {
        if (this == null) return emptyList()
        return buildList {
            for (index in 0 until length()) {
                optString(index)?.trim()?.takeIf { it.isNotBlank() }?.let(::add)
            }
        }
    }

    private fun responseCount(response: Response): Int {
        var current: Response? = response
        var count = 1
        while (current?.priorResponse != null) {
            count += 1
            current = current.priorResponse
        }
        return count
    }
}
