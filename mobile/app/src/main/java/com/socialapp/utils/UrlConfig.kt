package com.socialapp.utils

import com.socialapp.BuildConfig

object UrlConfig {
    private const val CURRENT_BACKEND_HOST = "yamshat1-ahj8.onrender.com"
    private const val CURRENT_FRONTEND_HOST = "yamshat1-1-yq1o.onrender.com"

    private fun sanitize(raw: String): String {
        return raw
            .trim()
            .replace(CURRENT_BACKEND_HOST, CURRENT_BACKEND_HOST, ignoreCase = true)
            .replace(CURRENT_FRONTEND_HOST, CURRENT_FRONTEND_HOST, ignoreCase = true)
    }

    fun apiBaseUrl(): String {
        val sanitized = sanitize(BuildConfig.BASE_URL).trimEnd('/')
        return "$sanitized/"
    }

    fun apiBaseWithoutTrailingSlash(): String = apiBaseUrl().trimEnd('/')

    fun socketUrl(): String = sanitize(BuildConfig.SOCKET_URL).trimEnd('/')

    fun webAppUrl(): String {
        val sanitized = sanitize(BuildConfig.WEB_APP_URL).trimEnd('/')
        return "$sanitized/"
    }

    fun webAppUrlWithoutTrailingSlash(): String = webAppUrl().trimEnd('/')
}
