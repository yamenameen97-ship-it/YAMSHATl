package com.socialapp.reels

import com.socialapp.models.Reel

class ReelsRecommendationEngine {
    fun rank(reels: List<Reel>, recentAuthors: List<String>, recentTags: List<String>): List<Reel> {
        if (reels.size <= 1) return reels
        val authorWeights = recentAuthors.withIndex().associate { it.value.lowercase() to (recentAuthors.size - it.index + 2) }
        val tagWeights = recentTags.withIndex().associate { it.value.lowercase() to (recentTags.size - it.index + 1) }
        return reels.sortedByDescending { reel ->
            val authorScore = authorWeights[reel.username.lowercase()] ?: 0
            val tagScore = reel.tags.sumOf { tagWeights[it.lowercase()] ?: 0 }
            val popularity = (reel.likes_count / 100).coerceAtMost(50)
            authorScore * 5 + tagScore * 3 + popularity
        }
    }

    fun nextSuggestion(current: Reel?, candidates: List<Reel>): Reel? {
        if (candidates.isEmpty()) return null
        if (current == null) return candidates.firstOrNull()
        val matchingTag = candidates.firstOrNull { candidate ->
            candidate.id != current.id && candidate.tags.any { it in current.tags }
        }
        return matchingTag ?: candidates.firstOrNull { it.id != current.id }
    }
}
