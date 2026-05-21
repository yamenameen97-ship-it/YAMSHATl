package com.socialapp.moderation

import com.socialapp.models.ModerationDecision

class AiModerationEngine {
    private val blockedTerms = linkedSetOf(
        "سبام",
        "احتيال",
        "هكر",
        "porn",
        "xxx",
        "nude",
        "kill",
        "suicide",
        "مخدرات",
        "كراهية",
    )

    private val riskyTerms = linkedSetOf(
        "telegram",
        "whatsapp",
        "buy now",
        "free money",
        "مكسب مضمون",
        "رابط",
    )

    fun evaluatePost(text: String, mediaUrl: String? = null): ModerationDecision {
        val normalized = normalize(text)
        val matchedBlocked = blockedTerms.filter { normalized.contains(normalize(it)) }
        val matchedRisky = riskyTerms.filter { normalized.contains(normalize(it)) }
        val linkCount = Regex("https?://|www\\.", RegexOption.IGNORE_CASE).findAll(text).count()
        val repeatedChars = Regex("(.)\\1{5,}").containsMatchIn(text)
        val severity = matchedBlocked.size * 50 + matchedRisky.size * 15 + if (linkCount >= 3) 20 else 0 + if (repeatedChars) 10 else 0
        val shouldBlock = matchedBlocked.isNotEmpty() || severity >= 70
        val matchedTerms = (matchedBlocked + matchedRisky).distinct()
        val sanitized = matchedTerms.fold(text) { acc, term ->
            acc.replace(term, "•••", ignoreCase = true)
        }
        val reason = when {
            shouldBlock -> "المحتوى اتوقف تلقائياً لأنه يحتوي على ألفاظ أو مؤشرات خطرة"
            matchedTerms.isNotEmpty() || linkCount >= 2 -> "المحتوى مسموح لكنه يحتاج مراجعة أو تهذيب"
            mediaUrl != null && mediaUrl.isNotBlank() -> "تمت مراجعة النص والوسائط مبدئياً"
            else -> "المحتوى آمن مبدئياً"
        }
        return ModerationDecision(
            isBlocked = shouldBlock,
            severity = severity.coerceAtMost(100),
            matchedTerms = matchedTerms,
            reason = reason,
            sanitizedText = sanitized,
        )
    }

    private fun normalize(text: String): String {
        return text
            .lowercase()
            .replace("أ", "ا")
            .replace("إ", "ا")
            .replace("آ", "ا")
            .replace("ة", "ه")
            .replace("ى", "ي")
            .trim()
    }
}
