package com.socialapp.player

import android.net.Uri
import com.socialapp.BuildConfig
import com.socialapp.utils.UrlConfig
import java.net.URLEncoder

object VideoDeliveryManager {
    fun optimizeVideoUrl(rawUrl: String): String {
        if (rawUrl.isBlank()) return rawUrl
        val template = BuildConfig.CDN_FETCH_TEMPLATE.trim()
        if (template.contains("{url}")) {
            return template
                .replace("{base}", BuildConfig.CDN_URL.trimEnd('/'))
                .replace("{url}", urlEncode(rawUrl))
        }
        val uri = runCatching { Uri.parse(rawUrl) }.getOrNull()
        return if (uri != null && uri.isAbsolute) {
            rawUrl
        } else {
            val base = UrlConfig.cdnUrl().ifBlank { UrlConfig.apiBaseWithoutTrailingSlash() }
            base.trimEnd('/') + "/" + rawUrl.trimStart('/')
        }
    }

    fun providerLabel(): String {
        val provider = BuildConfig.CDN_PROVIDER.trim().lowercase()
        return when {
            provider.contains("cloudflare") -> "Cloudflare"
            provider.contains("bunny") -> "BunnyCDN"
            provider.contains("imagekit") -> "ImageKit"
            provider == "auto" && BuildConfig.CDN_URL.contains("cloudflare", ignoreCase = true) -> "Cloudflare"
            provider == "auto" && BuildConfig.CDN_URL.contains("bunny", ignoreCase = true) -> "BunnyCDN"
            provider == "auto" && BuildConfig.CDN_URL.contains("imagekit", ignoreCase = true) -> "ImageKit"
            else -> "Origin"
        }
    }

    fun playbackBadge(url: String): String {
        val streamType = when {
            url.contains(".m3u8", ignoreCase = true) -> "HLS"
            url.contains(".mpd", ignoreCase = true) -> "DASH"
            else -> "MP4"
        }
        return "$streamType • ${providerLabel()}"
    }

    private fun urlEncode(value: String): String = URLEncoder.encode(value, Charsets.UTF_8.name())
}
