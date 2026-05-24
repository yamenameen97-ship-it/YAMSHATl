package com.socialapp.network

import okhttp3.Interceptor
import okhttp3.Response

class AuthInterceptor : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        if (SessionManager.hasToken() && SessionManager.isSessionHardenedExpired()) {
            SessionManager.markForcedLogout("تم قفل الجلسة لحمايتك بعد فترة خمول، سجّل دخولك من جديد")
            SessionManager.clearSession(preserveOnboarding = true)
        }
        if (SessionManager.hasToken() && SessionManager.isAccessTokenExpired() && !SessionManager.canRefreshSession()) {
            SessionManager.markForcedLogout("انتهت صلاحية الجلسة، سجّل دخولك من جديد")
            SessionManager.clearSession(preserveOnboarding = true)
        }

        val original = chain.request()
        val token = SessionManager.getToken()
        val requestBuilder = original.newBuilder()
            .header("X-Session-Id", SessionManager.getSessionId())
        val request = if (!token.isNullOrBlank()) {
            requestBuilder
                .header("Authorization", "Bearer $token")
                .build()
        } else {
            requestBuilder.build()
        }
        return chain.proceed(request)
    }
}
