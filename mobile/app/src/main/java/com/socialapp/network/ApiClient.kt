package com.socialapp.network

import android.content.Context
import com.socialapp.BuildConfig
import com.socialapp.utils.UrlConfig
import okhttp3.CertificatePinner
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.net.URI
import java.util.concurrent.TimeUnit

object ApiClient {
    val BASE_URL: String = UrlConfig.apiBaseUrl()
    val SOCKET_URL: String = UrlConfig.socketUrl()

    private const val PIN_RENDER_LEAF = "sha256/T4eoRdbfIYF3G9IOGamqR3Vgye2bNLHQTSCOY8u3y5w="
    private const val PIN_RENDER_INTERMEDIATE = "sha256/kIdp6NNEd8wsugYyyIYFsi1ylMCED3hZbSR8ZFsa/A4="
    private const val PIN_LIVEKIT_LEAF = "sha256/+6V8bDj5+MQ+137sP3WXi8JVMgZdf4/ge7hNFcT79Bc="
    private const val PIN_LIVEKIT_INTERMEDIATE = "sha256/rnhtVs65ADYfQGtMuB0jq2kZwwHy6/iqnBiUKcK1m0Y="

    private val logging = HttpLoggingInterceptor().apply {
        level = if (BuildConfig.ENABLE_LOGS) HttpLoggingInterceptor.Level.BASIC else HttpLoggingInterceptor.Level.NONE
    }

    private fun hostFromUrl(rawUrl: String): String? {
        val normalized = rawUrl
            .trim()
            .replaceFirst("wss://", "https://", ignoreCase = true)
            .replaceFirst("ws://", "http://", ignoreCase = true)
        return runCatching { URI(normalized).host }.getOrNull()
    }

    private fun certificatePinner(): CertificatePinner? {
        val knownPins = mapOf(
            "yamshat1-ahj8.onrender.com" to listOf(PIN_RENDER_LEAF, PIN_RENDER_INTERMEDIATE),
            "yamshat1-1-yg1o.onrender.com" to listOf(PIN_RENDER_LEAF, PIN_RENDER_INTERMEDIATE),
            "yamshat-enqr8c2d.livekit.cloud" to listOf(PIN_LIVEKIT_LEAF, PIN_LIVEKIT_INTERMEDIATE),
        )

        val activeHosts = linkedSetOf<String>()
        hostFromUrl(BASE_URL)?.let(activeHosts::add)
        hostFromUrl(SOCKET_URL)?.let(activeHosts::add)
        hostFromUrl(BuildConfig.WEB_APP_URL)?.let(activeHosts::add)
        hostFromUrl(BuildConfig.LIVEKIT_URL)?.let(activeHosts::add)

        val builder = CertificatePinner.Builder()
        activeHosts.forEach { host ->
            knownPins[host]?.forEach { pin ->
                builder.add(host, pin)
            }
        }

        return if (activeHosts.any { host -> knownPins.containsKey(host) }) builder.build() else null
    }

    private val okHttpClient: OkHttpClient by lazy {
        val contextProvider: () -> Context? = { SessionManager.applicationContext }
        val retryInterceptor = RetryInterceptor(contextProvider = contextProvider)

        OkHttpClient.Builder()
            .addInterceptor(retryInterceptor)
            .addInterceptor(AuthInterceptor())
            .addInterceptor(logging)
            .authenticator(RefreshTokenAuthenticator())
            .connectTimeout(25, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .apply {
                if (BuildConfig.ENABLE_SSL_PINNING) {
                    certificatePinner()?.let { pinner -> certificatePinner(pinner) }
                }
            }
            .build()
    }

    val api: ApiService by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(ApiService::class.java)
    }
}
