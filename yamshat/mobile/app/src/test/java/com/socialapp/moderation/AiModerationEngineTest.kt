package com.socialapp.moderation

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class AiModerationEngineTest {
    private val engine = AiModerationEngine()

    @Test
    fun blocksClearlyRiskyContent() {
        val result = engine.evaluatePost("احتيال free money مع رابط https://spam.test")
        assertTrue(result.isBlocked)
        assertTrue(result.matchedTerms.isNotEmpty())
    }

    @Test
    fun allowsNormalCommunityContent() {
        val result = engine.evaluatePost("أهلاً يا جماعة، ده منشور جديد عن الستوري والريلز")
        assertFalse(result.isBlocked)
    }
}
