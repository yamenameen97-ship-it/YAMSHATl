package com.socialapp.translation

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class AutoTranslationEngineTest {
    private val engine = AutoTranslationEngine()

    @Test
    fun translatesArabicToEnglishWithCache() {
        val first = engine.translate("مرحبا", "en")
        val second = engine.translate("مرحبا", "en")

        assertEquals("Hello", first.translatedText)
        assertTrue(second.isFromCache)
    }

    @Test
    fun detectsArabicLanguage() {
        assertEquals("ar", engine.detectLanguage("منشور جديد"))
    }
}
