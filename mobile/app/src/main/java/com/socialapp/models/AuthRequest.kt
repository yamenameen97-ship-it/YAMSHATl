package com.socialapp.models

data class AuthRequest(
    val username: String,
    val password: String,
    val fcm_token: String? = null,
)
