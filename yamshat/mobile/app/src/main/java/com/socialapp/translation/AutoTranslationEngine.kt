package com.socialapp.translation

import com.socialapp.models.TranslationResult
import java.util.LinkedHashMap

class AutoTranslationEngine {
    private val cache = object : LinkedHashMap<String, TranslationResult>(50, 0.75f, true) {
        override fun removeEldestEntry(eldest: MutableMap.MutableEntry<String, TranslationResult>?): Boolean = size > 50
    }

    private val arToEn = mapOf(
        "مرحبا" to "Hello",
        "اهلا" to "Welcome",
        "منشور جديد" to "New post",
        "لايف" to "Live",
        "تم الرفع" to "Uploaded",
        "تمت المراجعه" to "Reviewed",
    )

    private val enToAr = mapOf(
        "hello" to "مرحبا",
        "welcome" to "أهلاً بك",
        "new post" to "منشور جديد",
        "live" to "بث مباشر",
        "uploaded" to "تم الرفع",
        "reviewed" to "تمت المراجعة",
    )

    fun translate(text: String, targetLanguage: String, sourceLanguageHint: String? = null): TranslationResult {
        val normalizedTarget = targetLanguage.lowercase().trim()
        val sourceLanguage = sourceLanguageHint?.lowercase()?.trim() ?: detectLanguage(text)
        val cacheKey = "$sourceLanguage|$normalizedTarget|$text"
        cache[cacheKey]?.let { return it.copy(isFromCache = true) }

        if (sourceLanguage == normalizedTarget) {
            return TranslationResult(text, text, sourceLanguage, normalizedTarget, isFromCache = false)
        }

        val translated = when {
            sourceLanguage.startsWith("ar") && normalizedTarget.startsWith("en") -> replaceByDictionary(text, arToEn)
            sourceLanguage.startsWith("en") && normalizedTarget.startsWith("ar") -> replaceByDictionary(text, enToAr)
            else -> text
        }

        return TranslationResult(
            originalText = text,
            translatedText = translated,
            sourceLanguage = sourceLanguage,
            targetLanguage = normalizedTarget,
            isFromCache = false,
        ).also { cache[cacheKey] = it }
    }

    fun detectLanguage(text: String): String {
        return if (Regex("[\\u0600-\\u06FF]").containsMatchIn(text)) "ar" else "en"
    }

    private fun replaceByDictionary(text: String, dictionary: Map<String, String>): String {
        var output = text
        dictionary.forEach { (source, translated) ->
            output = output.replace(source, translated, ignoreCase = true)
        }
        return output
    }
}
