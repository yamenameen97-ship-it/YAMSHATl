package com.socialapp.models

data class Post(
    val id: Int = 0,
    val username: String = "",
    val content: String = "",
    val media: String? = null,
    val likes: Int = 0
)
