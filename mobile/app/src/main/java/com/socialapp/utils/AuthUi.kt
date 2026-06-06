package com.socialapp.utils

import android.content.ClipboardManager
import android.content.Context
import org.json.JSONObject
import retrofit2.Response

object AuthUi {
    private val emailRegex = Regex("^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$", RegexOption.IGNORE_CASE)
    private val translations = linkedMapOf(
        "Missing or invalid registration fields" to "بيانات التسجيل ناقصة أو غير صحيحة",
        "Email already exists" to "البريد الإلكتروني مستخدم بالفعل",
        "Username already exists" to "اسم المستخدم مستخدم بالفعل",
        "Email or username already exists" to "البريد الإلكتروني أو اسم المستخدم مستخدم بالفعل",
        "Identifier and password are required" to "اكتب البريد أو اسم المستخدم وكلمة المرور",
        "Invalid credentials" to "البريد الإلكتروني أو اسم المستخدم أو كلمة المرور غير صحيحة",
        "Incorrect password" to "كلمة المرور غير صحيحة",
        "Email or username not found" to "البريد الإلكتروني أو اسم المستخدم غير صحيح",
        "Invalid email format" to "صيغة البريد الإلكتروني غير صحيحة",
        "Invalid email address" to "البريد الإلكتروني غير صحيح",
        "Email verification required" to "لازم تفعّل البريد الإلكتروني الأول",
        "Too many login attempts" to "تم تجاوز عدد محاولات الدخول، حاول بعد قليل",
        "Too many registration attempts" to "تم تجاوز عدد محاولات إنشاء الحساب، حاول بعد قليل",
        "Too many attempts, try again later" to "عدد المحاولات كبير، حاول بعد قليل",
        "Password must be at least 6 characters" to "كلمة المرور لازم تكون 6 أحرف على الأقل",
        "Email and code are required" to "اكتب البريد الإلكتروني ورمز التحقق",
        "Reset code not found" to "رمز التحقق غير موجود أو لم يتم طلبه بعد",
        "Reset code expired" to "رمز التحقق انتهت صلاحيته. اطلب رمز جديد",
        "Invalid reset code" to "رمز التحقق غير صحيح",
        "Password reset successfully" to "تم تحديث كلمة المرور بنجاح",
        "Verification code not found" to "رمز التفعيل غير موجود",
        "Verification code expired" to "رمز التفعيل انتهت صلاحيته",
        "Invalid verification code" to "رمز التفعيل غير صحيح",
        "If the account exists, a reset code has been sent" to "لو الحساب موجود، بعتنا رمز تحقق على البريد الإلكتروني",
        "Reset code verified" to "تم التحقق من الرمز بنجاح",
        "Email verified successfully" to "تم تأكيد البريد الإلكتروني بنجاح",
        "Account created successfully. Please verify your email to continue." to "تم إنشاء الحساب. فعّل بريدك الإلكتروني قبل تسجيل الدخول",
        "User not found" to "الحساب غير موجود",
    )

    fun looksLikeEmail(value: String?): Boolean = value.orEmpty().contains('@')

    fun isValidEmail(value: String?): Boolean = emailRegex.matches(value.orEmpty().trim())

    fun normalizeOtpDigits(value: String?, length: Int = 6): String {
        return value.orEmpty().filter { it.isDigit() }.take(length)
    }

    fun localizeAuthMessage(value: String?, fallback: String): String {
        val text = value.orEmpty().trim()
        if (text.isBlank()) return fallback
        if (text.any { it.code > 127 }) return text
        translations.forEach { (key, translated) ->
            if (text == key || text.contains(key, ignoreCase = true)) {
                return translated
            }
        }
        return text
    }

    fun parseApiDetail(errorText: String, fallback: String): String {
        if (errorText.isBlank()) return fallback
        return runCatching {
            val json = JSONObject(errorText)
            val detail = json.opt("detail")
            when (detail) {
                is JSONObject -> {
                    localizeAuthMessage(
                        detail.optString("message").ifBlank { detail.optString("detail") },
                        fallback,
                    )
                }
                else -> localizeAuthMessage(json.optString("detail").ifBlank { json.optString("message") }, fallback)
            }
        }.getOrElse {
            localizeAuthMessage(errorText, fallback)
        }
    }

    fun <T> extractErrorMessage(response: Response<T>, fallbackMessage: String?, defaultMessage: String): String {
        fallbackMessage?.takeIf { it.isNotBlank() }?.let {
            return localizeAuthMessage(it, defaultMessage)
        }
        val errorText = runCatching { response.errorBody()?.string().orEmpty() }.getOrDefault("")
        if (errorText.isNotBlank()) {
            val parsed = parseApiDetail(errorText, defaultMessage)
            if (parsed.isNotBlank()) return parsed
            if (response.code() == 404 || errorText.contains("Not Found", ignoreCase = true)) {
                return "تعذر الوصول إلى خادم التطبيق"
            }
        }
        return when (response.code()) {
            400 -> defaultMessage
            401 -> "بيانات الدخول غير صحيحة"
            403 -> "لازم تفعّل البريد الإلكتروني الأول"
            404 -> "تعذر الوصول إلى خادم التطبيق"
            409 -> fallbackMessage ?: "هذا الحساب مسجل بالفعل"
            429 -> "تم تجاوز عدد المحاولات، حاول بعد قليل"
            in 500..599 -> "الخادم مشغول حالياً، حاول مرة أخرى"
            else -> fallbackMessage ?: defaultMessage
        }
    }

    fun readClipboardOtp(context: Context, length: Int = 6): String {
        val manager = context.getSystemService(Context.CLIPBOARD_SERVICE) as? ClipboardManager ?: return ""
        val clip = manager.primaryClip ?: return ""
        val item = clip.getItemAt(0) ?: return ""
        return normalizeOtpDigits(item.coerceToText(context)?.toString(), length)
    }
}
