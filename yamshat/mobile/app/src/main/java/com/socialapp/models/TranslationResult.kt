package com.socialapp.models

data class TranslationResult(
    val originalText: String,
    val translatedText: String,
    val sourceLanguage: String,
    val targetLanguage: String,
    val isFromCache: Boolean = false,
)
