package com.socialapp.models

import com.google.gson.annotations.SerializedName

data class Post(
    val id: Int = 0,
    @SerializedName("user_id")
    val userId: Int = 0,
    val username: String = "",
    val avatar: String? = null,
    val content: String = "",
    @SerializedName("content_html")
    val contentHtml: String? = null,
    @SerializedName("image_url")
    val imageUrl: String? = null,
    val media: String? = null,
    @SerializedName("media_urls")
    val mediaUrls: List<String>? = null,
    @SerializedName("like_count")
    val likeCount: Int = 0,
    @SerializedName("comment_count")
    val commentCount: Int = 0,
    @SerializedName("share_count")
    val shareCount: Int = 0,
    @SerializedName("liked_by_me")
    val likedByMe: Boolean = false,
    @SerializedName("saved_by_me")
    val savedByMe: Boolean = false,
    @SerializedName("created_at")
    val createdAt: String = ""
)

data class PostsResponse(
    val posts: List<Post> = emptyList(),
    val recommendations: List<Post>? = null,
    val pagination: Pagination? = null
)

data class Pagination(
    val total: Int = 0,
    val page: Int = 1,
    val limit: Int = 20,
    val pages: Int = 1,
    @SerializedName("has_next")
    val hasNext: Boolean = false
)
