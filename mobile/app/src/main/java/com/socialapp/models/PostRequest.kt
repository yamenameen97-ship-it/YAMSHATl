package com.socialapp.models

data class PostRequest(
    val content: String,
    val media: String? = null,
)
