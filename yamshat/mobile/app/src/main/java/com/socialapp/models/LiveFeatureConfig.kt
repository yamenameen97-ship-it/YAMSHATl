package com.socialapp.models

data class LiveFeatureConfig(
    val coHosts: List<String> = emptyList(),
    val recordingEnabled: Boolean = true,
    val adaptiveBitrate: Boolean = true,
    val commentMonitoring: Boolean = true,
    val moderationMode: Boolean = true,
)
