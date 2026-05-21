package com.socialapp.network

import java.io.IOException

sealed class AppError : Exception() {
    data class Network(val messageAr: String = "لا يوجد اتصال بالإنترنت") : AppError()
    data class Server(val code: Int, val messageAr: String = "خطأ في الخادم") : AppError()
    data class Auth(val messageAr: String = "انتهت الجلسة، يرجى تسجيل الدخول") : AppError()
    data class Validation(val errors: Map<String, String>) : AppError()
    data class Unknown(val originalException: Throwable? = null) : AppError()
    
    fun getDisplayMessage(): String {
        return when (this) {
            is Network -> messageAr
            is Server -> messageAr
            is Auth -> messageAr
            is Validation -> errors.values.firstOrNull() ?: "بيانات غير صالحة"
            is Unknown -> "حدث خطأ غير متوقع"
        }
    }
}

object ApiErrorMapper {
    fun map(throwable: Throwable): AppError {
        return when (throwable) {
            is IOException -> AppError.Network()
            is AppError -> throwable
            else -> AppError.Unknown(throwable)
        }
    }

    fun mapResponseCode(code: Int, message: String? = null): AppError {
        return when (code) {
            401, 403 -> AppError.Auth()
            in 400..499 -> AppError.Validation(mapOf("error" to (message ?: "بيانات غير صالحة")))
            in 500..599 -> AppError.Server(code, "الخادم يواجه مشاكل حالياً")
            else -> AppError.Unknown()
        }
    }
}
