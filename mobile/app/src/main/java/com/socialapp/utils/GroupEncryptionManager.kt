package com.socialapp.utils

import android.content.Context
import android.util.Base64
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.SecretKeySpec
import java.security.SecureRandom

/**
 * Group Encryption Manager
 * Handles end-to-end encryption for group messages using AES-GCM
 */
object GroupEncryptionManager {

    private const val ALGORITHM = "AES"
    private const val CIPHER_ALGORITHM = "AES/GCM/NoPadding"
    private const val KEY_SIZE = 256
    private const val TAG_LENGTH_BIT = 128
    private const val IV_LENGTH_BYTE = 12
    private const val PREF_NAME = "group_encryption"

    /**
     * Generate a group encryption key
     */
    fun generateGroupKey(): SecretKey {
        val keyGenerator = KeyGenerator.getInstance(ALGORITHM)
        keyGenerator.init(KEY_SIZE)
        return keyGenerator.generateKey()
    }

    /**
     * Encrypt a message for the group
     */
    fun encryptGroupMessage(
        context: Context,
        groupId: Int,
        message: String
    ): String? {
        return try {
            val key = getOrCreateGroupKey(context, groupId) ?: return null
            val cipher = Cipher.getInstance(CIPHER_ALGORITHM)
            
            // Generate random IV
            val iv = ByteArray(IV_LENGTH_BYTE)
            SecureRandom().nextBytes(iv)
            
            // Initialize cipher with IV
            val gcmSpec = GCMParameterSpec(TAG_LENGTH_BIT, iv)
            cipher.init(Cipher.ENCRYPT_MODE, key, gcmSpec)
            
            // Encrypt message
            val encryptedMessage = cipher.doFinal(message.toByteArray(Charsets.UTF_8))
            
            // Combine IV + encrypted message
            val combined = iv + encryptedMessage
            
            // Encode to Base64
            Base64.encodeToString(combined, Base64.DEFAULT)
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    /**
     * Decrypt a message from the group
     */
    fun decryptGroupMessage(
        context: Context,
        groupId: Int,
        encryptedMessage: String
    ): String? {
        return try {
            val key = getOrCreateGroupKey(context, groupId) ?: return null
            
            // Decode from Base64
            val combined = Base64.decode(encryptedMessage, Base64.DEFAULT)
            
            // Extract IV and encrypted data
            val iv = combined.copyOfRange(0, IV_LENGTH_BYTE)
            val encryptedData = combined.copyOfRange(IV_LENGTH_BYTE, combined.size)
            
            // Initialize cipher
            val cipher = Cipher.getInstance(CIPHER_ALGORITHM)
            val gcmSpec = GCMParameterSpec(TAG_LENGTH_BIT, iv)
            cipher.init(Cipher.DECRYPT_MODE, key, gcmSpec)
            
            // Decrypt message
            val decryptedMessage = cipher.doFinal(encryptedData)
            String(decryptedMessage, Charsets.UTF_8)
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    /**
     * Get or create a group encryption key
     */
    private fun getOrCreateGroupKey(context: Context, groupId: Int): SecretKey? {
        return try {
            val prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
            val keyAlias = "group_key_$groupId"

            // Try to restore an existing key from SharedPreferences
            val existingKey = prefs.getString(keyAlias, null)
            if (!existingKey.isNullOrBlank()) {
                val decodedKey = Base64.decode(existingKey, Base64.NO_WRAP)
                return SecretKeySpec(decodedKey, ALGORITHM)
            }

            // Create and persist a new key if one does not exist yet
            val newKey = generateGroupKey()
            prefs.edit()
                .putString(keyAlias, Base64.encodeToString(newKey.encoded, Base64.NO_WRAP))
                .apply()

            newKey
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    /**
     * Hash a message for integrity verification
     */
    fun hashMessage(message: String): String {
        return try {
            val digest = java.security.MessageDigest.getInstance("SHA-256")
            val hash = digest.digest(message.toByteArray(Charsets.UTF_8))
            Base64.encodeToString(hash, Base64.DEFAULT)
        } catch (e: Exception) {
            e.printStackTrace()
            ""
        }
    }

    /**
     * Verify message integrity
     */
    fun verifyMessageIntegrity(message: String, hash: String): Boolean {
        return hashMessage(message) == hash
    }
}
