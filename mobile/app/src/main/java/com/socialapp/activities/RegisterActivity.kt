package com.socialapp.activities

import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.socialapp.BuildConfig
import com.socialapp.databinding.ActivityRegisterBinding
import com.socialapp.models.ApiMessage
import com.socialapp.network.ApiClient
import com.socialapp.network.SessionManager
import com.socialapp.signal.SignalProtocolManager
import com.socialapp.utils.ActionRateLimiter
import com.socialapp.utils.ActivitySecurity
import com.socialapp.utils.AuthUi
import com.socialapp.utils.CrashReporter
import com.socialapp.utils.FirebaseBridge
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

class RegisterActivity : AppCompatActivity() {
    private lateinit var binding: ActivityRegisterBinding
    private var authRequestInFlight = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        ActivitySecurity.enableSecureWindow(this)
        binding = ActivityRegisterBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.registerBtn.setOnClickListener {
            if (authRequestInFlight) return@setOnClickListener
            doRegister()
        }
        binding.loginBtn.setOnClickListener {
            if (authRequestInFlight) return@setOnClickListener
            finish()
        }
    }

    private fun doRegister() {
        if (!ActionRateLimiter.allow("register_submit", maxHits = 4, windowMs = 60_000L, minIntervalMs = 1_500L)) {
            toast("استنى شوية قبل ما تعيد المحاولة")
            return
        }

        val name = binding.nameInput.text?.toString()?.trim().orEmpty()
        val email = binding.emailInput.text?.toString()?.trim().orEmpty().lowercase()
        val password = binding.passwordInput.text?.toString()?.trim().orEmpty()
        val confirmPassword = binding.confirmPasswordInput.text?.toString()?.trim().orEmpty()

        if (name.isBlank() || email.isBlank() || password.isBlank()) {
            toast("اكتب اسم المستخدم والبريد وكلمة المرور")
            return
        }
        if (name.contains(' ')) {
            toast("اسم المستخدم لازم يكون بدون مسافات")
            return
        }
        if (!AuthUi.isValidEmail(email)) {
            toast("البريد الإلكتروني غير صحيح")
            return
        }
        if (password.length < 6) {
            toast("كلمة المرور يجب أن تكون 6 أحرف على الأقل")
            return
        }
        if (password != confirmPassword) {
            toast("تأكيد كلمة المرور غير مطابق")
            return
        }

        setLoading(true)
        ApiClient.api.register(mapOf("name" to name, "username" to name, "email" to email, "password" to password))
            .enqueue(object : Callback<ApiMessage> {
                override fun onResponse(call: Call<ApiMessage>, response: Response<ApiMessage>) {
                    setLoading(false)
                    val body = response.body()
                    val sessionToken = body.sessionToken()
                    if (response.isSuccessful && body?.email_verification_required == true) {
                        toast(AuthUi.localizeAuthMessage(body.message, "تم إنشاء الحساب. فعّل بريدك أولاً"))
                        openVerifyEmail(body.email.orEmpty(), body.message.orEmpty(), body.dev_verification_code.orEmpty())
                        return
                    }
                    if (response.isSuccessful && sessionToken.isNotBlank()) {
                        saveSession(body, sessionToken)
                        toast(body?.message ?: "تم إنشاء الحساب")
                        openMain()
                        return
                    }
                    toast(AuthUi.extractErrorMessage(response, body?.message, "فشل إنشاء الحساب"))
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

    private fun openVerifyEmail(email: String, message: String, devCode: String) {
        val intent = Intent(this, VerifyEmailActivity::class.java)
            .putExtra(VerifyEmailActivity.EXTRA_EMAIL, email)
            .putExtra(VerifyEmailActivity.EXTRA_MESSAGE, if (message.isNotBlank()) AuthUi.localizeAuthMessage(message, message) else "تم إنشاء الحساب. أدخل كود التحقق")
            .putExtra(VerifyEmailActivity.EXTRA_DEV_CODE, devCode)
        startActivity(intent)
        finish()
    }

    private fun openMain() {
        val targetPath = if (SessionManager.getRole().equals("admin", ignoreCase = true) && SessionManager.getEmail().equals(BuildConfig.PRIMARY_ADMIN_EMAIL, ignoreCase = true)) {
            "/admin/dashboard"
        } else {
            "/"
        }
        startActivity(Intent(this, MainActivity::class.java).putExtra(MainActivity.EXTRA_TARGET_PATH, targetPath))
        finishAffinity()
    }

    private fun setLoading(isLoading: Boolean) {
        authRequestInFlight = isLoading
        binding.registerBtn.isEnabled = !isLoading
        binding.loginBtn.isEnabled = !isLoading
        binding.registerBtn.text = if (isLoading) "جاري إنشاء الحساب..." else "إنشاء الحساب"
        binding.loginBtn.text = "العودة إلى تسجيل الدخول"
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
            Log.w("RegisterActivity", message, throwable)
        }
    }
}
