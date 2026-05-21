package com.socialapp.models

data class Post(
    val id: Int = 0,
    val username: String = "",
    val content: String = "",
    val media: String? = null,
    val created_at: String = "",
    val likes: Int = 0,
    val updated_at: String? = null,
    val version: Long = 1,
    val sync_state: String = "synced",
    val dirty: Boolean = false,
)
