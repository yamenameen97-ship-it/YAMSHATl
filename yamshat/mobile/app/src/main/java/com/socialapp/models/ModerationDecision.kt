package com.socialapp.models

data class ModerationDecision(
    val isBlocked: Boolean,
    val severity: Int,
    val matchedTerms: List<String> = emptyList(),
    val reason: String = "",
    val sanitizedText: String = "",
)
