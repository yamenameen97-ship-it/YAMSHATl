package com.socialapp.activities

import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.socialapp.databinding.ActivitySplashBinding
import com.socialapp.models.ApiMessage
import com.socialapp.network.ApiClient
import com.socialapp.network.SessionManager
import com.socialapp.utils.ActivitySecurity
import com.socialapp.utils.CrashReporter
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

class SplashActivity : AppCompatActivity() {
    private lateinit var binding: ActivitySplashBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        ActivitySecurity.enableSecureWindow(this)
        binding = ActivitySplashBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val forcedLogoutReason = SessionManager.consumeForcedLogoutReason()
        if (!forcedLogoutReason.isNullOrBlank()) {
            Toast.makeText(this, forcedLogoutReason, Toast.LENGTH_LONG).show()
        }

        Handler(Looper.getMainLooper()).postDelayed({ routeUser() }, 850)
    }

    private fun routeUser() {
        if (!SessionManager.isOnboardingCompleted()) {
            startActivity(Intent(this, OnboardingActivity::class.java))
            finish()
            return
        }

        if (!SessionManager.hasToken()) {
            openLogin()
            return
        }

        if (SessionManager.isAccessTokenExpired() && SessionManager.canRefreshSession()) {
            refreshSessionAndContinue()
            return
        }

        if (SessionManager.isAccessTokenExpired() && !SessionManager.canRefreshSession()) {
            SessionManager.clearSession(preserveOnboarding = true)
            openLogin()
            return
        }

        openMain()
    }

    private fun refreshSessionAndContinue() {
        val refreshToken = SessionManager.getRefreshToken().orEmpty()
        if (refreshToken.isBlank()) {
            SessionManager.clearSession(preserveOnboarding = true)
            openLogin()
            return
        }

        ApiClient.api.refreshSession(mapOf("refresh_token" to refreshToken)).enqueue(object : Callback<ApiMessage> {
            override fun onResponse(call: Call<ApiMessage>, response: Response<ApiMessage>) {
                val body = response.body()
                val accessToken = body?.access_token?.takeIf { it.isNotBlank() } ?: body?.token.orEmpty()
                if (!response.isSuccessful || accessToken.isBlank()) {
                    SessionManager.clearSession(preserveOnboarding = true)
                    openLogin()
                    return
                }
                SessionManager.saveSession(
                    accessToken = accessToken,
                    refreshToken = body?.refresh_token,
                    username = body?.username ?: body?.user,
                    email = body?.email,
                    role = body?.role,
                    permissions = body?.permissions,
                    avatar = body?.avatar,
                    expiresInMinutes = body?.expires_in_minutes,
                    refreshExpiresInDays = body?.refresh_expires_in_days,
                )
                CrashReporter.setUser(userId = (body?.username ?: body?.user).orEmpty().ifBlank { body?.email.orEmpty() }, email = body?.email)
                openMain()
            }

            override fun onFailure(call: Call<ApiMessage>, t: Throwable) {
                SessionManager.clearSession(preserveOnboarding = true)
                openLogin()
            }
        })
    }

    private fun openMain() {
        startActivity(Intent(this, MainActivity::class.java))
        finish()
    }

    private fun openLogin() {
        startActivity(Intent(this, LoginActivity::class.java))
        finish()
    }
}
