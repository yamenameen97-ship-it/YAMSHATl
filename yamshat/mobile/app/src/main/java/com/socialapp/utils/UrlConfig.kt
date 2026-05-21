package com.socialapp.utils

import com.socialapp.BuildConfig

object UrlConfig {
    // Obfuscated hosts to prevent easy string searching
    private val LEGACY_BACKEND_HOST = StringObfuscator.decode("GwwXAxYVBRUfCR4cChcWFg==") // yamshati.onrender.com
    private val CURRENT_BACKEND_HOST = StringObfuscator.decode("GwwXAxYVBRUfCR4YChcWFg==") // yamshatl.onrender.com
    private val LEGACY_FRONTEND_HOST = StringObfuscator.decode("GwwXAxYVBRUfCR4cCh8NChcWFg==") // yamshati-1.onrender.com
    private val PREVIOUS_FRONTEND_HOST = StringObfuscator.decode("GwwXAxYVBRUfCR4YCh8NChcWFg==") // yamshatl-1.onrender.com
    private val CURRENT_FRONTEND_HOST = StringObfuscator.decode("GwwXAxYVBRUfCR4YCh8NCxsNChcWFg==") // yamshatl-11.onrender.com

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
    
    fun streamUrl(): String = sanitize(BuildConfig.STREAM_URL).trimEnd('/')
    
    fun cdnUrl(): String = sanitize(BuildConfig.CDN_URL).trimEnd('/')

    fun webAppUrl(): String {
        val sanitized = sanitize(BuildConfig.WEB_APP_URL).trimEnd('/')
        return "$sanitized/"
    }

    fun webAppUrlWithoutTrailingSlash(): String = webAppUrl().trimEnd('/')
}
