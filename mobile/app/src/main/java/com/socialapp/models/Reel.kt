package com.socialapp.models

data class Reel(
    val id: Int = 0,
    val username: String,
    val video_url: String,
    // معرّف الستوري المرتبط بهذا الريل (إن وجد) - يُحذف تلقائياً عند حذف الريل
    val linked_story_id: String? = null
)
