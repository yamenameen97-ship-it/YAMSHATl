package com.socialapp.models

data class NotificationItem(
    val id: Int = 0,
    val from_user: String = "",
    val sender: String = "",
    val type: String = "",
    val message: String = "",
    val seen: Int = 0,
    val read: Boolean = false,
    val link: String? = null,
    val created_at: String? = null
)
