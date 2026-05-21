package com.socialapp.search

import com.socialapp.models.Post
import com.socialapp.models.Reel
import com.socialapp.models.Story
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class SmartSearchEngineTest {
    private val engine = SmartSearchEngine()

    @Test
    fun returnsRankedResultsAcrossSources() {
        val results = engine.search(
            query = "ساره",
            posts = listOf(Post(id = 1, username = "ساره", content = "منشور جديد")),
            reels = listOf(Reel(id = 2, username = "ساره", caption = "ريل عن الطبخ", likes_count = 200)),
            stories = listOf(Story(id = "3", username = "ساره")),
        )

        assertTrue(results.isNotEmpty())
        assertEquals("reel", results.first().source)
    }
}
