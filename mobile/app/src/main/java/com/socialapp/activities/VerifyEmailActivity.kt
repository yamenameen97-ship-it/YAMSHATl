package com.socialapp.activities

import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.socialapp.databinding.ActivityVerifyEmailBinding
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

class VerifyEmailActivity : AppCompatActivity() {
    private lateinit var binding: ActivityVerifyEmailBinding
    private var requestInFlight = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        ActivitySecurity.enableSecureWindow(this)
        binding = ActivityVerifyEmailBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val presetEmail = intent.getStringExtra(EXTRA_EMAIL).orEmpty()
        val presetMessage = intent.getStringExtra(EXTRA_MESSAGE).orEmpty()
        val presetCode = intent.getStringExtra(EXTRA_DEV_CODE).orEmpty()

        binding.emailInput.setText(presetEmail)
        if (presetMessage.isNotBlank()) {
            binding.statusText.text = presetMessage
        }
        if (presetCode.isNotBlank()) {
            binding.devCodeText.text = "كود التطوير: $presetCode"
            binding.devCodeText.alpha = 1f
        }

        binding.verifyBtn.setOnClickListener {
            if (requestInFlight) return@setOnClickListener
            doVerify()
        }

        binding.resendBtn.setOnClickListener {
            if (requestInFlight) return@setOnClickListener
            resendCode()
        }

        binding.backToLoginBtn.setOnClickListener {
            finish()
        }
    }

    private fun doVerify() {
        if (!ActionRateLimiter.allow("verify_email_submit", maxHits = 6, windowMs = 60_000L, minIntervalMs = 1_000L)) {
            toast("استنى لحظة قبل إعادة المحاولة")
            return
        }

        val email = binding.emailInput.text?.toString()?.trim().orEmpty().lowercase()
        val code = AuthUi.normalizeOtpDigits(binding.codeInput.text?.toString())
        if (!AuthUi.isValidEmail(email)) {
            toast("البريد الإلكتروني غير صحيح")
            return
        }
        if (code.length != 6) {
            toast("اكتب كود التفعيل كامل")
            return
        }

        setLoading(true, "جاري التحقق...")
        ApiClient.api.verifyEmail(mapOf("email" to email, "code" to code))
            .enqueue(object : Callback<ApiMessage> {
                override fun onResponse(call: Call<ApiMessage>, response: Response<ApiMessage>) {
                    setLoading(false)
                    val body = response.body()
                    val sessionToken = body.sessionToken()
                    if (!response.isSuccessful || sessionToken.isBlank()) {
                        toast(AuthUi.extractErrorMessage(response, body?.message, "فشل تأكيد البريد"))
                        return
                    }
                    saveSession(body, sessionToken)
                    toast(AuthUi.localizeAuthMessage(body?.message, "تم تأكيد البريد"))
                    openMain()
                }

                override fun onFailure(call: Call<ApiMessage>, t: Throwable) {
                    setLoading(false)
                    toast(t.message ?: "تعذر الاتصال بالخادم")
                }
            })
    }

    private fun resendCode() {
        if (!ActionRateLimiter.allow("resend_verify_submit", maxHits = 4, windowMs = 60_000L, minIntervalMs = 3_000L)) {
            toast("تم الإرسال قريباً، استنى شوية قبل إعادة الطلب")
            return
        }

        val email = binding.emailInput.text?.toString()?.trim().orEmpty().lowercase()
        if (!AuthUi.isValidEmail(email)) {
            toast("اكتب بريد إلكتروني صحيح أولاً")
            return
        }

        setLoading(true, "جاري إعادة الإرسال...")
        ApiClient.api.resendVerification(mapOf("email" to email))
            .enqueue(object : Callback<ApiMessage> {
                override fun onResponse(call: Call<ApiMessage>, response: Response<ApiMessage>) {
                    setLoading(false)
                    val body = response.body()
                    if (!response.isSuccessful) {
                        toast(AuthUi.extractErrorMessage(response, body?.message, "تعذر إعادة إرسال الكود"))
                        return
                    }
                    binding.statusText.text = AuthUi.localizeAuthMessage(body?.message, "تم إرسال كود جديد")
                    val devCode = body?.dev_verification_code.orEmpty()
                    if (devCode.isNotBlank()) {
                        binding.devCodeText.text = "كود التطوير: $devCode"
                        binding.devCodeText.alpha = 1f
                    }
                    toast(AuthUi.localizeAuthMessage(body?.message, "تم إرسال كود جديد"))
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
        }

        runCatching {
            SignalProtocolManager.ensureInitialized(this, forceUpload = true)
        }
    }

    private fun openMain() {
        startActivity(Intent(this, MainActivity::class.java))
        finishAffinity()
    }

    private fun setLoading(isLoading: Boolean, loadingText: String = "جاري التنفيذ...") {
        requestInFlight = isLoading
        binding.verifyBtn.isEnabled = !isLoading
        binding.resendBtn.isEnabled = !isLoading
        binding.backToLoginBtn.isEnabled = !isLoading
        binding.verifyBtn.text = if (isLoading) loadingText else "تأكيد البريد"
    }

    private fun toast(message: String) {
        Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
    }

    private fun ApiMessage?.sessionToken(): String {
        return this?.token?.takeIf { it.isNotBlank() }
            ?: this?.access_token?.takeIf { it.isNotBlank() }
            ?: ""
    }

    companion object {
        const val EXTRA_EMAIL = "extra_email"
        const val EXTRA_MESSAGE = "extra_message"
        const val EXTRA_DEV_CODE = "extra_dev_code"
    }
}
