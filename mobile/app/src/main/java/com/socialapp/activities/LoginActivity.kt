package com.socialapp.activities

import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.socialapp.BuildConfig
import com.socialapp.databinding.ActivityLoginBinding
import com.socialapp.models.ApiMessage
import com.socialapp.network.ApiClient
import com.socialapp.network.SessionManager
import com.socialapp.signal.SignalProtocolManager
import com.socialapp.utils.ActionRateLimiter
import com.socialapp.utils.ActivitySecurity
import com.socialapp.utils.AuthUi
import com.socialapp.utils.CrashReporter
import com.socialapp.utils.FirebaseBridge
import org.json.JSONObject
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response
import com.socialapp.utils.UiKit

class LoginActivity : AppCompatActivity() {
    private lateinit var binding: ActivityLoginBinding
    private var authRequestInFlight = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        ActivitySecurity.enableSecureWindow(this)

        if (SessionManager.hasToken() && !SessionManager.isAccessTokenExpired()) {
            openMain(resolvePostLoginPath())
            return
        }

        binding = ActivityLoginBinding.inflate(layoutInflater)
        setContentView(binding.root)
        UiKit.prepareScreen(this, binding.root)
        binding.emailInput.setText(intent.getStringExtra(EXTRA_EMAIL).orEmpty())

        binding.loginBtn.setOnClickListener {
            if (authRequestInFlight) return@setOnClickListener
            doLogin()
        }
        binding.registerBtn.setOnClickListener {
            if (authRequestInFlight) return@setOnClickListener
            startActivity(Intent(this, RegisterActivity::class.java))
        }
        binding.forgotPasswordBtn.setOnClickListener {
            if (authRequestInFlight) return@setOnClickListener
            startActivity(
                Intent(this, ForgotPasswordActivity::class.java)
                    .putExtra(ForgotPasswordActivity.EXTRA_EMAIL, binding.emailInput.text?.toString().orEmpty().trim())
            )
        }
    }

    private fun doLogin() {
        if (!ActionRateLimiter.allow("login_submit", maxHits = 6, windowMs = 60_000L, minIntervalMs = 1_200L)) {
            toast("بلاش محاولات متكررة بسرعة، جرّب بعد ثواني")
            return
        }

        val identifier = binding.emailInput.text?.toString()?.trim().orEmpty()
        val password = binding.passwordInput.text?.toString()?.trim().orEmpty()

        if (identifier.isBlank()) {
            toast("اكتب البريد الإلكتروني أو اسم المستخدم")
            return
        }
        if (AuthUi.looksLikeEmail(identifier) && !AuthUi.isValidEmail(identifier)) {
            toast("البريد الإلكتروني غير صحيح")
            return
        }
        if (password.isBlank()) {
            toast("اكتب كلمة المرور")
            return
        }

        if (authRequestInFlight) return
        setLoading(true)
        ApiClient.api.login(mapOf("identifier" to identifier, "email" to identifier, "username" to identifier, "password" to password))
            .enqueue(object : Callback<ApiMessage> {
                override fun onResponse(call: Call<ApiMessage>, response: Response<ApiMessage>) {
                    setLoading(false)
                    val body = response.body()
                    val sessionToken = body.sessionToken()
                    if (response.isSuccessful && sessionToken.isNotBlank()) {
                        saveSession(body, sessionToken)
                        toast(body?.message ?: "تم تسجيل الدخول")
                        openMain(resolvePostLoginPath())
                        return
                    }

                    val rawError = readErrorText(response)
                    val verification = extractVerificationRequirement(rawError)
                    if (verification != null) {
                        toast(verification.message)
                        openVerifyEmail(verification.email, verification.message, verification.devCode)
                        return
                    }

                    toast(AuthUi.extractErrorMessage(response, body?.message, "فشل تسجيل الدخول"))
                }

                override fun onFailure(call: Call<ApiMessage>, t: Throwable) {
                    setLoading(false)
                    toast(t.message ?: "تعذر الاتصال بالخادم")
                }
            })
    }

    private fun saveSession(body: ApiMessage?, sessionToken: String) {
        val user = (body?.username ?: body?.user).orEmpty()
        SessionManager.saveSession(
            accessToken = sessionToken,
            refreshToken = body?.refresh_token,
            username = user.takeIf { it.isNotBlank() },
            email = body?.email,
            role = body?.role,
            permissions = body?.permissions,
            avatar = body?.avatar,
            expiresInMinutes = body?.expires_in_minutes,
            refreshExpiresInDays = body?.refresh_expires_in_days,
        )
        CrashReporter.setUser(userId = user.ifBlank { body?.email.orEmpty() }, email = body?.email)

        runCatching {
            FirebaseBridge.requestAndSyncToken(this)
            FirebaseBridge.syncPendingTokenIfAny(this)
        }.onFailure {
            logWarn("Failed to start Firebase token sync after auth", it)
        }

        runCatching {
            SignalProtocolManager.ensureInitialized(this, forceUpload = true)
        }.onFailure {
            logWarn("Failed to initialize Signal keys after auth", it)
        }
    }

    private fun resolvePostLoginPath(): String {
        val isAdmin = SessionManager.getRole().equals("admin", ignoreCase = true) &&
            SessionManager.getEmail().equals(BuildConfig.PRIMARY_ADMIN_EMAIL, ignoreCase = true)
        return if (isAdmin) "/admin/dashboard" else "/"
    }

    private fun openMain(targetPath: String = "/") {
        startActivity(Intent(this, MainActivity::class.java).putExtra(MainActivity.EXTRA_TARGET_PATH, targetPath))
        finish()
    }

    private fun openVerifyEmail(email: String, message: String, devCode: String) {
        val intent = Intent(this, VerifyEmailActivity::class.java)
            .putExtra(VerifyEmailActivity.EXTRA_EMAIL, email)
            .putExtra(VerifyEmailActivity.EXTRA_MESSAGE, message)
            .putExtra(VerifyEmailActivity.EXTRA_DEV_CODE, devCode)
        startActivity(intent)
    }

    private fun readErrorText(response: Response<ApiMessage>): String {
        return runCatching { response.errorBody()?.string().orEmpty() }.getOrDefault("")
    }

    private fun extractVerificationRequirement(errorText: String): PendingVerification? {
        if (errorText.isBlank()) return null
        return runCatching {
            val json = JSONObject(errorText)
            val detail = json.opt("detail")
            if (detail is JSONObject) {
                val message = detail.optString("message")
                val email = detail.optString("email")
                val devCode = detail.optString("dev_verification_code")
                if (message.contains("Email verification required", ignoreCase = true) || email.isNotBlank()) {
                    PendingVerification(
                        email = email,
                        message = "لازم تفعّل بريدك قبل الدخول",
                        devCode = devCode,
                    )
                } else {
                    null
                }
            } else {
                null
            }
        }.getOrNull()
    }

    private fun setLoading(isLoading: Boolean) {
        authRequestInFlight = isLoading
        binding.loginBtn.isEnabled = !isLoading
        binding.registerBtn.isEnabled = !isLoading
        binding.forgotPasswordBtn.isEnabled = !isLoading
        UiKit.setButtonLoading(binding.loginBtn, isLoading, "تسجيل الدخول", "جاري الدخول...")
        binding.registerBtn.text = "إنشاء حساب جديد"
    }

    private fun toast(message: String) {
        Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
    }

    private fun ApiMessage?.sessionToken(): String {
        return this?.token?.takeIf { it.isNotBlank() }
            ?: this?.access_token?.takeIf { it.isNotBlank() }
            ?: ""
    }

    private fun logWarn(message: String, throwable: Throwable? = null) {
        if (BuildConfig.ENABLE_LOGS) {
            Log.w("LoginActivity", message, throwable)
        }
    }

    companion object {
        private const val EXTRA_EMAIL = "extra_email"
    }

    private data class PendingVerification(
        val email: String,
        val message: String,
        val devCode: String,
    )
}
