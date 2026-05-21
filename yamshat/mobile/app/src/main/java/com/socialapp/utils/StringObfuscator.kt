package com.socialapp.utils

import android.util.Base64
import java.nio.charset.StandardCharsets

/**
 * A simple yet effective string obfuscator to hide sensitive strings like URLs, 
 * API keys, and internal identifiers from static analysis tools.
 */
object StringObfuscator {
    
    // Simple XOR key for obfuscation - in a real scenario, this could be dynamic
    private const val KEY = "yamshat_security_key_2024"

    /**
     * Decodes an obfuscated string.
     * Use the companion 'obfuscate' method during development to get the encoded strings.
     */
    fun decode(obfuscated: String): String {
        return try {
            val data = Base64.decode(obfuscated, Base64.DEFAULT)
            val result = ByteArray(data.size)
            val keyBytes = KEY.toByteArray(StandardCharsets.UTF_8)
            
            for (i in data.indices) {
                result[i] = (data[i].toInt() xor keyBytes[i % keyBytes.size].toInt()).toByte()
            }
            
            String(result, StandardCharsets.UTF_8)
        } catch (e: Exception) {
            ""
        }
    }

    /**
     * Utility method to be used by developers to generate obfuscated strings.
     * Not used in the production app.
     */
    fun obfuscate(plain: String): String {
        val data = plain.toByteArray(StandardCharsets.UTF_8)
        val keyBytes = KEY.toByteArray(StandardCharsets.UTF_8)
        val result = ByteArray(data.size)
        
        for (i in data.indices) {
            result[i] = (data[i].toInt() xor keyBytes[i % keyBytes.size].toInt()).toByte()
        }
        
        return Base64.encodeToString(result, Base64.NO_WRAP)
    }
}
