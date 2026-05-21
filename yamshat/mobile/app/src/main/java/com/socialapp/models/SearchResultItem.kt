package com.socialapp.models

data class SearchResultItem(
    val id: String,
    val title: String,
    val subtitle: String,
    val route: String,
    val score: Int,
    val source: String,
)
