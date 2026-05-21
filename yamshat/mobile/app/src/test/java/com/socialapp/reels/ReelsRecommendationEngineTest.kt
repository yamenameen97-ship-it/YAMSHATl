package com.socialapp.reels

import com.socialapp.models.Reel
import org.junit.Assert.assertEquals
import org.junit.Test

class ReelsRecommendationEngineTest {
    private val engine = ReelsRecommendationEngine()

    @Test
    fun prioritizesAuthorAndTagAffinity() {
        val reels = listOf(
            Reel(id = 1, username = "chef_sara", caption = "طبخ", likes_count = 20, tags = listOf("food")),
            Reel(id = 2, username = "travel_omar", caption = "سفر", likes_count = 400, tags = listOf("travel")),
        )

        val ranked = engine.rank(
            reels = reels,
            recentAuthors = listOf("chef_sara"),
            recentTags = listOf("food"),
        )

        assertEquals(1, ranked.first().id)
    }
}
