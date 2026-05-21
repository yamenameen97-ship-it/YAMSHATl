package com.socialapp.network

import android.content.Context
import okhttp3.Interceptor
import okhttp3.MultipartBody
import okhttp3.Response
import java.io.IOException
import kotlin.math.min

class RetryInterceptor(
    private val contextProvider: () -> Context?,
    private val maxRetries: Int = 2,
) : Interceptor {
    private val retryableCodes = setOf(408, 429, 500, 502, 503, 504)

    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request()
        val shouldRetry = request.body !is MultipartBody &&
            request.header("X-No-Retry") != "true" &&
            !request.url.encodedPath.contains("/auth/logout")

        var attempt = 0
        var lastError: IOException? = null

        while (true) {
            val context = contextProvider()
            if (context != null && !com.socialapp.utils.NetworkMonitor.isConnected(context)) {
                throw AppError.Network()
            }

            try {
                val response = chain.proceed(request)
                if (!shouldRetry || response.isSuccessful || response.code !in retryableCodes || attempt >= maxRetries) {
                    // Map API errors if not successful and not retrying
                    if (!response.isSuccessful && !shouldRetry) {
                        // We don't throw here to avoid breaking Retrofit's Call/Response flow, 
                        // but we could wrap it if we were using a different architecture.
                    }
                    return response
                }

                val delayMs = retryDelayFor(response.code, response.header("Retry-After"), attempt)
                response.close()
                Thread.sleep(delayMs)
            } catch (io: IOException) {
                lastError = io
                if (!shouldRetry || attempt >= maxRetries) throw io
                Thread.sleep(retryDelayFor(null, null, attempt))
            }

            attempt += 1
        }
    }

    private fun retryDelayFor(code: Int?, retryAfterHeader: String?, attempt: Int): Long {
        if (code == 429) {
            val retryAfterSeconds = retryAfterHeader?.trim()?.toLongOrNull()
            if (retryAfterSeconds != null) {
                return min(retryAfterSeconds * 1000L, 5_000L)
            }
        }
        return when (attempt) {
            0 -> 450L
            1 -> 1_100L
            else -> 1_800L
        }
    }
}
