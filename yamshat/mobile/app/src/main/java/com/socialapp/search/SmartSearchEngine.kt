package com.socialapp.search

import com.socialapp.models.Post
import com.socialapp.models.Reel
import com.socialapp.models.SearchResultItem
import com.socialapp.models.Story

class SmartSearchEngine {
    fun search(
        query: String,
        posts: List<Post> = emptyList(),
        reels: List<Reel> = emptyList(),
        stories: List<Story> = emptyList(),
    ): List<SearchResultItem> {
        val normalizedQuery = tokenize(query)
        if (normalizedQuery.isEmpty()) return emptyList()

        val results = mutableListOf<SearchResultItem>()
        posts.forEach { post ->
            val haystack = listOf(post.username, post.content).joinToString(" ")
            val score = score(normalizedQuery, haystack)
            if (score > 0) {
                results += SearchResultItem(
                    id = "post-${post.id}",
                    title = post.username,
                    subtitle = post.content.take(80),
                    route = "/post/${post.id}",
                    score = score,
                    source = "post",
                )
            }
        }
        reels.forEach { reel ->
            val haystack = listOf(reel.username, reel.caption.orEmpty(), reel.tags.joinToString(" ")).joinToString(" ")
            val score = score(normalizedQuery, haystack) + reel.likes_count.coerceAtMost(50)
            if (score > 0) {
                results += SearchResultItem(
                    id = "reel-${reel.id}",
                    title = reel.username,
                    subtitle = reel.caption.orEmpty().ifBlank { reel.tags.joinToString(" • ") }.take(80),
                    route = "/reels/${reel.id}",
                    score = score,
                    source = "reel",
                )
            }
        }
        stories.forEachIndexed { index, story ->
            val haystack = listOf(story.username, story.mediaUrl.orEmpty()).joinToString(" ")
            val score = score(normalizedQuery, haystack)
            if (score > 0) {
                results += SearchResultItem(
                    id = story.id.ifBlank { "story-$index" },
                    title = story.username,
                    subtitle = if (story.isSeen) "ستوري تمت مشاهدتها" else "ستوري جديدة",
                    route = "/stories/${story.id.ifBlank { index.toString() }}",
                    score = score,
                    source = "story",
                )
            }
        }

        return results.sortedByDescending { it.score }.take(25)
    }

    private fun score(queryTokens: List<String>, text: String): Int {
        val normalizedText = normalize(text)
        var total = 0
        queryTokens.forEach { token ->
            if (normalizedText.startsWith(token)) total += 45
            if (" $token" in " $normalizedText") total += 30
            if (normalizedText.contains(token)) total += 20
        }
        return total
    }

    private fun tokenize(query: String): List<String> {
        return normalize(query)
            .split(Regex("\\s+"))
            .filter { it.length >= 2 }
            .distinct()
    }

    private fun normalize(text: String): String {
        return text
            .lowercase()
            .replace("أ", "ا")
            .replace("إ", "ا")
            .replace("آ", "ا")
            .replace("ة", "ه")
            .replace("ى", "ي")
    }
}
