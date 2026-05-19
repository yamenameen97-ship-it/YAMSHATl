package com.socialapp.utils

import android.content.Context
import java.security.MessageDigest

object LocalMessageCache {
    private const val PREF_NAME = "signal_message_cache_secure"

    private fun key(cipherText: String): String {
        val digest = MessageDigest.getInstance("SHA-256")
            .digest(cipherText.toByteArray(Charsets.UTF_8))
        return buildString {
            digest.forEach { append("%02x".format(it)) }
        }
    }

    fun save(context: Context, cipherText: String, plainText: String) {
        if (cipherText.isBlank()) return
        SecurePrefs.get(context, PREF_NAME)
            .edit()
            .putString(key(cipherText), plainText)
            .apply()
    }

    fun get(context: Context, cipherText: String): String? {
        if (cipherText.isBlank()) return null
        return SecurePrefs.get(context, PREF_NAME)
            .getString(key(cipherText), null)
    }
}
