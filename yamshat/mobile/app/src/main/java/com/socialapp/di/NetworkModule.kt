package com.socialapp.di

import android.content.Context
import com.socialapp.BuildConfig
import com.socialapp.network.*
import com.socialapp.utils.UrlConfig
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import okhttp3.CertificatePinner
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.net.URI
import java.util.concurrent.TimeUnit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {

    @Provides
    @Singleton
    fun provideLoggingInterceptor(): HttpLoggingInterceptor {
        return HttpLoggingInterceptor().apply {
            level = if (BuildConfig.ENABLE_LOGS) HttpLoggingInterceptor.Level.BASIC else HttpLoggingInterceptor.Level.NONE
        }
    }

    private fun hostFromUrl(rawUrl: String): String? {
        val normalized = rawUrl
            .trim()
            .replaceFirst("wss://", "https://", ignoreCase = true)
            .replaceFirst("ws://", "http://", ignoreCase = true)
        return runCatching { URI(normalized).host }.getOrNull()
    }

    @Provides
    @Singleton
    fun provideCertificatePinner(): CertificatePinner? {
        if (!BuildConfig.ENABLE_SSL_PINNING) return null
        
        val PIN_RENDER_LEAF = "sha256/T4eoRdbfIYF3G9IOGamqR3Vgye2bNLHQTSCOY8u3y5w="
        val PIN_RENDER_INTERMEDIATE = "sha256/kIdp6NNEd8wsugYyyIYFsi1ylMCED3hZbSR8ZFsa/A4="
        val PIN_LIVEKIT_LEAF = "sha256/+6V8bDj5+MQ+137sP3WXi8JVMgZdf4/ge7hNFcT79Bc="
        val PIN_LIVEKIT_INTERMEDIATE = "sha256/rnhtVs65ADYfQGtMuB0jq2kZwwHy6/iqnBiUKcK1m0Y="

        val knownPins = mapOf(
            "yamshatl.onrender.com" to listOf(PIN_RENDER_LEAF, PIN_RENDER_INTERMEDIATE),
            "yamshatl-11.onrender.com" to listOf(PIN_RENDER_LEAF, PIN_RENDER_INTERMEDIATE),
            "yamshat-enqr8c2d.livekit.cloud" to listOf(PIN_LIVEKIT_LEAF, PIN_LIVEKIT_INTERMEDIATE),
        )

        val activeHosts = linkedSetOf<String>()
        hostFromUrl(UrlConfig.apiBaseUrl())?.let(activeHosts::add)
        hostFromUrl(UrlConfig.socketUrl())?.let(activeHosts::add)
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

    @Provides
    @Singleton
    fun provideOkHttpClient(
        loggingInterceptor: HttpLoggingInterceptor,
        certificatePinner: CertificatePinner?
    ): OkHttpClient {
        val contextProvider: () -> Context? = { SessionManager.applicationContext }
        val retryInterceptor = RetryInterceptor(contextProvider = contextProvider)

        return OkHttpClient.Builder()
            .addInterceptor(retryInterceptor)
            .addInterceptor(AuthInterceptor())
            .addInterceptor(loggingInterceptor)
            .authenticator(RefreshTokenAuthenticator())
            .connectTimeout(25, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .apply {
                if (BuildConfig.ENABLE_SSL_PINNING && certificatePinner != null) {
                    certificatePinner(certificatePinner)
                }
            }
            .build()
    }

    @Provides
    @Singleton
    fun provideApiService(okHttpClient: OkHttpClient): ApiService {
        return Retrofit.Builder()
            .baseUrl(UrlConfig.apiBaseUrl())
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(ApiService::class.java)
    }
}
