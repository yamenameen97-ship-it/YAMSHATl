package com.socialapp.models

data class MessageItem(
    val id: Int? = null,
    val sender: String = "",
    val receiver: String? = null,
    val message: String = "",
    val content: String? = null,
    val type: String? = "text",
    val media_url: String? = null,
    val deleted: Boolean? = false,
    val status: String? = "sent",
    val created_at: String? = null,
    val edited_at: String? = null,
    var displayMessage: String? = null
)
