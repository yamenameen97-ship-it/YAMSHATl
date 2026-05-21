package com.socialapp.models

data class Story(
    val id: String = "",
    val username: String,
    val avatarUrl: String? = null,
    val mediaUrl: String? = null,
    val isSeen: Boolean = false,
    val expiresAtEpochMs: Long = System.currentTimeMillis() + 24L * 60L * 60L * 1000L,
)
