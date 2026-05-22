package com.socialapp.utils

import com.socialapp.BuildConfig

object UrlConfig {
    private const val LEGACY_BACKEND_HOST = "yamshati.onrender.com"
    private const val CURRENT_BACKEND_HOST = "yamshat1-ahj8.onrender.com"
    private const val LEGACY_FRONTEND_HOST = "yamshati-1.onrender.com"
    private const val PREVIOUS_FRONTEND_HOST = "yamshat1-1.onrender.com"
    private const val CURRENT_FRONTEND_HOST = "yamshati-1-yg1o.onrender.com"

    private fun sanitize(raw: String): String {
        return raw
            .trim()
            .replace(LEGACY_BACKEND_HOST, CURRENT_BACKEND_HOST, ignoreCase = true)
            .replace(LEGACY_FRONTEND_HOST, CURRENT_FRONTEND_HOST, ignoreCase = true)
            .replace(PREVIOUS_FRONTEND_HOST, CURRENT_FRONTEND_HOST, ignoreCase = true)
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
