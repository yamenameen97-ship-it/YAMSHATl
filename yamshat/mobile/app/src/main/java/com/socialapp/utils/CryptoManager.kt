package com.socialapp.utils

import android.content.Context
import android.util.Base64
import java.nio.charset.StandardCharsets
import java.security.KeyStore
import java.security.MessageDigest
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.SecretKeyFactory
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.PBEKeySpec
import javax.crypto.spec.SecretKeySpec
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties

object CryptoManager {
    private const val PREFIX = "ENCv1:"
    private const val PREF_NAME = "chat_e2e"
    private const val ITERATIONS = 120000
    private const val SECRET_STORAGE_PREFIX = "KSV2:"
    private const val KEYSTORE_ALIAS = "yamshat_chat_secret_master_key"
    private const val ANDROID_KEYSTORE = "AndroidKeyStore"
    private const val DB_KEY_ALIAS = "yamshat_db_master_key"
    private const val FILE_KEY_ALIAS = "yamshat_file_master_key"

    private fun secretKey(currentUser: String, peer: String): String {
        val pair = listOf(currentUser.trim(), peer.trim()).sorted().joinToString("::")
        return "secret_$pair"
    }

    private fun secretPrefs(context: Context) = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)

    fun saveSecret(context: Context, currentUser: String, peer: String, secret: String) {
        val prefs = secretPrefs(context)
        val key = secretKey(currentUser, peer)
        if (secret.isBlank()) {
            prefs.edit().remove(key).apply()
            return
        }
        val encrypted = encryptStoredSecret(secret.trim())
        prefs.edit().putString(key, encrypted).apply()
    }

    fun getSecret(context: Context, currentUser: String, peer: String): String {
        val prefs = secretPrefs(context)
        val stored = prefs.getString(secretKey(currentUser, peer), "")?.trim().orEmpty()
        if (stored.isBlank()) return ""

        if (!stored.startsWith(SECRET_STORAGE_PREFIX)) {
            saveSecret(context, currentUser, peer, stored)
            return stored
        }

        return decryptStoredSecret(stored).orEmpty()
    }

    fun hasSecret(context: Context, currentUser: String, peer: String): Boolean {
        return getSecret(context, currentUser, peer).isNotBlank()
    }

    private fun deriveAesKey(secret: String, currentUser: String, peer: String): SecretKeySpec {
        val pairSalt = listOf(currentUser.trim(), peer.trim()).sorted().joinToString("|yamshat|")
        val digest = MessageDigest.getInstance("SHA-256").digest(pairSalt.toByteArray(StandardCharsets.UTF_8))
        val factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256")
        val spec = PBEKeySpec(secret.toCharArray(), digest, ITERATIONS, 256)
        val encoded = factory.generateSecret(spec).encoded
        return SecretKeySpec(encoded, "AES")
    }

    fun encrypt(context: Context, currentUser: String, peer: String, plainText: String): String {
        if (plainText.isBlank()) return plainText
        val secret = getSecret(context, currentUser, peer)
        if (secret.isBlank()) return plainText
        val key = deriveAesKey(secret, currentUser, peer)
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(Cipher.ENCRYPT_MODE, key)
        val iv = cipher.iv
        val encrypted = cipher.doFinal(plainText.toByteArray(StandardCharsets.UTF_8))
        return PREFIX +
            Base64.encodeToString(iv, Base64.NO_WRAP) + ":" +
            Base64.encodeToString(encrypted, Base64.NO_WRAP)
    }

    fun decrypt(context: Context, currentUser: String, peer: String, encryptedText: String?): String {
        val text = encryptedText.orEmpty()
        if (!text.startsWith(PREFIX)) return text
        val secret = getSecret(context, currentUser, peer)
        if (secret.isBlank()) return "🔐 رسالة مشفرة — فعّل E2E لقراءتها"
        return runCatching {
            val parts = text.split(":")
            val iv = Base64.decode(parts.getOrNull(1).orEmpty(), Base64.NO_WRAP)
            val payload = Base64.decode(parts.drop(2).joinToString(":"), Base64.NO_WRAP)
            val cipher = Cipher.getInstance("AES/GCM/NoPadding")
            cipher.init(Cipher.DECRYPT_MODE, deriveAesKey(secret, currentUser, peer), GCMParameterSpec(128, iv))
            String(cipher.doFinal(payload), StandardCharsets.UTF_8)
        }.getOrElse {
            "🔐 تعذر فك التشفير بهذه العبارة السرية"
        }
    }

    private fun encryptStoredSecret(plainText: String): String {
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(Cipher.ENCRYPT_MODE, getOrCreateKeystoreKey())
        val iv = Base64.encodeToString(cipher.iv, Base64.NO_WRAP)
        val encrypted = Base64.encodeToString(
            cipher.doFinal(plainText.toByteArray(StandardCharsets.UTF_8)),
            Base64.NO_WRAP,
        )
        return "$SECRET_STORAGE_PREFIX$iv:$encrypted"
    }

    private fun decryptStoredSecret(payload: String): String? {
        return runCatching {
            val raw = payload.removePrefix(SECRET_STORAGE_PREFIX)
            val parts = raw.split(":")
            val iv = Base64.decode(parts.getOrNull(0).orEmpty(), Base64.NO_WRAP)
            val encrypted = Base64.decode(parts.getOrNull(1).orEmpty(), Base64.NO_WRAP)
            val cipher = Cipher.getInstance("AES/GCM/NoPadding")
            cipher.init(Cipher.DECRYPT_MODE, getOrCreateKeystoreKey(), GCMParameterSpec(128, iv))
            String(cipher.doFinal(encrypted), StandardCharsets.UTF_8)
        }.getOrNull()
    }

    private fun getOrCreateKeystoreKey(alias: String = KEYSTORE_ALIAS): SecretKey {
        val keyStore = KeyStore.getInstance(ANDROID_KEYSTORE).apply { load(null) }
        val existing = keyStore.getKey(alias, null) as? SecretKey
        if (existing != null) return existing

        val keyGenerator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, ANDROID_KEYSTORE)
        val spec = KeyGenParameterSpec.Builder(
            alias,
            KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT,
        )
            .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
            .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
            .setKeySize(256)
            .setRandomizedEncryptionRequired(true)
            .build()
        keyGenerator.init(spec)
        return keyGenerator.generateKey()
    }

    fun getDatabasePassphrase(): String {
        val key = getOrCreateKeystoreKey(DB_KEY_ALIAS)
        return Base64.encodeToString(key.encoded, Base64.NO_WRAP)
    }

    fun encryptFile(context: Context, inputFile: java.io.File, outputFile: java.io.File) {
        val key = getOrCreateKeystoreKey(FILE_KEY_ALIAS)
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(Cipher.ENCRYPT_MODE, key)
        
        val iv = cipher.iv
        outputFile.outputStream().use { out ->
            out.write(iv)
            val encrypted = cipher.doFinal(inputFile.readBytes())
            out.write(encrypted)
        }
    }

    fun decryptFile(context: Context, inputFile: java.io.File): ByteArray {
        val key = getOrCreateKeystoreKey(FILE_KEY_ALIAS)
        inputFile.inputStream().use { input ->
            val iv = ByteArray(12)
            input.read(iv)
            val cipher = Cipher.getInstance("AES/GCM/NoPadding")
            cipher.init(Cipher.DECRYPT_MODE, key, GCMParameterSpec(128, iv))
            return cipher.doFinal(input.readBytes())
        }
    }
}
