package com.socialapp.models

data class MessageRequest(
    val receiver: String,
    val message: String,
    val room: String,
)
