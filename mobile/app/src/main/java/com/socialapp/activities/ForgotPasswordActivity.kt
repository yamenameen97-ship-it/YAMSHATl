package com.socialapp.activities

import android.content.Intent
import android.os.Bundle
import android.widget.EditText
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.widget.doAfterTextChanged
import com.socialapp.databinding.ActivityForgotPasswordBinding
import com.socialapp.models.ApiMessage
import com.socialapp.network.ApiClient
import com.socialapp.utils.ActionRateLimiter
import com.socialapp.utils.ActivitySecurity
import com.socialapp.utils.AuthUi
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response
import com.socialapp.utils.UiKit

class ForgotPasswordActivity : AppCompatActivity() {
    private lateinit var binding: ActivityForgotPasswordBinding
    private var requestInFlight = false
    private var verifyInFlight = false
    private var saveInFlight = false
    private var lastAutoVerifiedCode = ""
    private val codeInputs by lazy {
        listOf(
            binding.codeDigit1,
            binding.codeDigit2,
            binding.codeDigit3,
            binding.codeDigit4,
            binding.codeDigit5,
            binding.codeDigit6,
        )
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        ActivitySecurity.enableSecureWindow(this)
        binding = ActivityForgotPasswordBinding.inflate(layoutInflater)
        setContentView(binding.root)
        UiKit.prepareScreen(this, binding.root)

        binding.emailInput.setText(intent.getStringExtra(EXTRA_EMAIL).orEmpty())
        binding.statusText.text = intent.getStringExtra(EXTRA_MESSAGE).orEmpty().ifBlank {
            "ابعت رمز التحقق على البريد، وبعدها لو الرمز صحيح هنفتح فورم تغيير كلمة المرور فوراً"
        }
        val devCode = intent.getStringExtra(EXTRA_DEV_CODE).orEmpty()
        if (devCode.isNotBlank()) {
            binding.devCodeText.text = "كود التطوير: $devCode"
            binding.devCodeText.alpha = 1f
        }

        setupCodeInputs()
        showVerificationStep(false)
        showResetStep(false)

        binding.sendCodeBtn.setOnClickListener {
            if (requestInFlight) return@setOnClickListener
            sendCode()
        }
        binding.readClipboardBtn.setOnClickListener {
            fillCode(AuthUi.readClipboardOtp(this))
        }
        binding.verifyCodeBtn.setOnClickListener {
            if (verifyInFlight) return@setOnClickListener
            verifyCode(autoTriggered = false)
        }
        binding.savePasswordBtn.setOnClickListener {
            if (saveInFlight) return@setOnClickListener
            saveNewPassword()
        }
        binding.backToLoginBtn.setOnClickListener {
            openLogin()
        }
    }

    private fun setupCodeInputs() {
        codeInputs.forEachIndexed { index, editText ->
            editText.doAfterTextChanged { editable ->
                if (editText.tag == true) return@doAfterTextChanged
                val digits = AuthUi.normalizeOtpDigits(editable?.toString())
                when {
                    digits.isBlank() -> Unit
                    digits.length > 1 -> fillCode(digits)
                    else -> {
                        if (editable?.toString() != digits) {
                            editText.tag = true
                            editText.setText(digits)
                            editText.setSelection(editText.text?.length ?: 0)
                            editText.tag = false
                        }
                        if (index < codeInputs.lastIndex) {
                            codeInputs[index + 1].requestFocus()
                        }
                    }
                }
                maybeAutoVerify()
            }
            editText.setOnKeyListener { _, keyCode, event ->
                if (keyCode == android.view.KeyEvent.KEYCODE_DEL && event.action == android.view.KeyEvent.ACTION_DOWN) {
                    if (editText.text.isNullOrBlank() && index > 0) {
                        codeInputs[index - 1].requestFocus()
                        codeInputs[index - 1].setSelection(codeInputs[index - 1].text?.length ?: 0)
                    }
                }
                false
            }
        }
    }

    private fun currentCode(): String = codeInputs.joinToString(separator = "") { it.text?.toString().orEmpty() }.filter { it.isDigit() }.take(6)

    private fun fillCode(code: String) {
        val normalized = AuthUi.normalizeOtpDigits(code)
        codeInputs.forEachIndexed { index, editText ->
            val digit = normalized.getOrNull(index)?.toString().orEmpty()
            editText.tag = true
            editText.setText(digit)
            if (digit.isNotEmpty()) editText.setSelection(editText.text?.length ?: 0)
            editText.tag = false
        }
        val focusIndex = normalized.length.coerceIn(0, codeInputs.lastIndex)
        codeInputs[focusIndex].requestFocus()
        maybeAutoVerify()
    }

    private fun validateEmail(): String? {
        val email = binding.emailInput.text?.toString()?.trim()?.lowercase().orEmpty()
        if (email.isBlank()) {
            toast("اكتب البريد الإلكتروني المسجل بالحساب")
            return null
        }
        if (!AuthUi.isValidEmail(email)) {
            toast("البريد الإلكتروني غير صحيح")
            return null
        }
        return email
    }

    private fun sendCode() {
        if (!ActionRateLimiter.allow("forgot_password_submit", maxHits = 4, windowMs = 60_000L, minIntervalMs = 1_500L)) {
            toast("استنى شوية قبل ما تعيد المحاولة")
            return
        }
        val email = validateEmail() ?: return

        setRequestLoading(true)
        ApiClient.api.forgotPassword(mapOf("email" to email))
            .enqueue(object : Callback<ApiMessage> {
                override fun onResponse(call: Call<ApiMessage>, response: Response<ApiMessage>) {
                    setRequestLoading(false)
                    val body = response.body()
                    if (!response.isSuccessful) {
                        toast(AuthUi.extractErrorMessage(response, body?.message, "تعذر إرسال رمز التحقق"))
                        return
                    }
                    binding.statusText.text = AuthUi.localizeAuthMessage(body?.message, "تم إرسال رمز التحقق")
                    val devCode = body?.dev_reset_code.orEmpty()
                    if (devCode.isNotBlank()) {
                        binding.devCodeText.text = "كود التطوير: $devCode"
                        binding.devCodeText.alpha = 1f
                    }
                    fillCode("")
                    lastAutoVerifiedCode = ""
                    showVerificationStep(true)
                    showResetStep(false)
                    fillCode(AuthUi.readClipboardOtp(this@ForgotPasswordActivity))
                    toast(AuthUi.localizeAuthMessage(body?.message, "تم إرسال رمز التحقق"))
                }

                override fun onFailure(call: Call<ApiMessage>, t: Throwable) {
                    setRequestLoading(false)
                    toast(t.message ?: "تعذر الاتصال بالخادم")
                }
            })
    }

    private fun maybeAutoVerify() {
        val code = currentCode()
        if (code.length == 6 && code != lastAutoVerifiedCode && !verifyInFlight && binding.verificationSection.visibility == android.view.View.VISIBLE) {
            verifyCode(autoTriggered = true)
        }
    }

    private fun verifyCode(autoTriggered: Boolean) {
        if (!ActionRateLimiter.allow("verify_reset_submit", maxHits = 8, windowMs = 60_000L, minIntervalMs = if (autoTriggered) 250L else 900L)) {
            if (!autoTriggered) toast("تمت محاولات كثيرة، حاول بعد قليل")
            return
        }
        val email = validateEmail() ?: return
        val code = currentCode()
        if (code.length != 6) {
            if (!autoTriggered) toast("اكتب رمز التحقق كامل من 6 أرقام")
            return
        }

        setVerifyLoading(true)
        ApiClient.api.verifyResetCode(mapOf("email" to email, "code" to code))
            .enqueue(object : Callback<ApiMessage> {
                override fun onResponse(call: Call<ApiMessage>, response: Response<ApiMessage>) {
                    setVerifyLoading(false)
                    val body = response.body()
                    if (!response.isSuccessful) {
                        lastAutoVerifiedCode = ""
                        toast(AuthUi.extractErrorMessage(response, body?.message, "رمز التحقق غير صحيح"))
                        return
                    }
                    lastAutoVerifiedCode = code
                    binding.statusText.text = AuthUi.localizeAuthMessage(body?.message, "تم التحقق من الرمز. اكتب كلمة المرور الجديدة")
                    showResetStep(true)
                    binding.newPasswordInput.requestFocus()
                    toast(AuthUi.localizeAuthMessage(body?.message, "تم التحقق من الرمز"))
                }

                override fun onFailure(call: Call<ApiMessage>, t: Throwable) {
                    setVerifyLoading(false)
                    lastAutoVerifiedCode = ""
                    if (!autoTriggered) toast(t.message ?: "تعذر الاتصال بالخادم")
                }
            })
    }

    private fun saveNewPassword() {
        if (!ActionRateLimiter.allow("reset_password_submit", maxHits = 6, windowMs = 60_000L, minIntervalMs = 1_000L)) {
            toast("استنى شوية قبل ما تعيد المحاولة")
            return
        }
        val email = validateEmail() ?: return
        val code = currentCode()
        if (code.length != 6) {
            toast("اكتب رمز التحقق الصحيح أولاً")
            showVerificationStep(true)
            return
        }

        val password = binding.newPasswordInput.text?.toString()?.trim().orEmpty()
        val confirmPassword = binding.confirmPasswordInput.text?.toString()?.trim().orEmpty()
        if (password.length < 6) {
            toast("كلمة المرور لازم تكون 6 أحرف على الأقل")
            return
        }
        if (password != confirmPassword) {
            toast("تأكيد كلمة المرور غير مطابق")
            return
        }

        setSaveLoading(true)
        ApiClient.api.resetPassword(mapOf("email" to email, "code" to code, "new_password" to password))
            .enqueue(object : Callback<ApiMessage> {
                override fun onResponse(call: Call<ApiMessage>, response: Response<ApiMessage>) {
                    setSaveLoading(false)
                    val body = response.body()
                    if (!response.isSuccessful) {
                        toast(AuthUi.extractErrorMessage(response, body?.message, "تعذر تحديث كلمة المرور"))
                        return
                    }
                    toast(AuthUi.localizeAuthMessage(body?.message, "تم تحديث كلمة المرور بنجاح"))
                    openLogin(email)
                }

                override fun onFailure(call: Call<ApiMessage>, t: Throwable) {
                    setSaveLoading(false)
                    toast(t.message ?: "تعذر الاتصال بالخادم")
                }
            })
    }

    private fun showVerificationStep(show: Boolean) {
        binding.verificationSection.visibility = if (show) android.view.View.VISIBLE else android.view.View.GONE
    }

    private fun showResetStep(show: Boolean) {
        binding.resetSection.visibility = if (show) android.view.View.VISIBLE else android.view.View.GONE
    }

    private fun setRequestLoading(isLoading: Boolean) {
        requestInFlight = isLoading
        binding.sendCodeBtn.isEnabled = !isLoading
        binding.emailInput.isEnabled = !isLoading && !verifyInFlight && !saveInFlight
        UiKit.setButtonLoading(binding.sendCodeBtn, isLoading, "إرسال رمز التحقق", "جاري إرسال الرمز...")
    }

    private fun setVerifyLoading(isLoading: Boolean) {
        verifyInFlight = isLoading
        binding.verifyCodeBtn.isEnabled = !isLoading
        binding.readClipboardBtn.isEnabled = !isLoading
        codeInputs.forEach { it.isEnabled = !isLoading }
        UiKit.setButtonLoading(binding.verifyCodeBtn, isLoading, "تأكيد الرمز", "جاري التحقق...")
    }

    private fun setSaveLoading(isLoading: Boolean) {
        saveInFlight = isLoading
        binding.savePasswordBtn.isEnabled = !isLoading
        binding.newPasswordInput.isEnabled = !isLoading
        binding.confirmPasswordInput.isEnabled = !isLoading
        UiKit.setButtonLoading(binding.savePasswordBtn, isLoading, "حفظ كلمة المرور الجديدة", "جاري حفظ كلمة المرور...")
    }

    private fun openLogin(presetEmail: String = binding.emailInput.text?.toString().orEmpty()) {
        startActivity(Intent(this, LoginActivity::class.java).putExtra(EXTRA_EMAIL, presetEmail))
        finish()
    }

    private fun toast(message: String) {
        Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
    }

    companion object {
        const val EXTRA_EMAIL = "extra_email"
        const val EXTRA_MESSAGE = "extra_message"
        const val EXTRA_DEV_CODE = "extra_dev_code"
    }
}
