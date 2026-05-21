package com.socialapp.models

import com.google.gson.annotations.SerializedName

data class Reel(
    @SerializedName("id")
    val id: Int = 0,
    @SerializedName("username")
    val username: String = "",
    @SerializedName("video_url")
    val video_url: String = "",
    @SerializedName("stream_url")
    val stream_url: String? = null,
    @SerializedName("thumbnail_url")
    val thumbnail_url: String? = null,
    @SerializedName("caption")
    val caption: String? = null,
    @SerializedName("likes_count")
    val likes_count: Int = 0,
    @SerializedName("tags")
    val tags: List<String> = emptyList(),
)
