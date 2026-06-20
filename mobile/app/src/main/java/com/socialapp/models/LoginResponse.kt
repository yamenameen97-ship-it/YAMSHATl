package com.socialapp.models

data class LoginResponse(
    val ok: Boolean? = null,
    val message: String? = null,
    val token: String? = null,
    val user: String? = null,
    val email: String? = null,
    val error: String? = null
)
