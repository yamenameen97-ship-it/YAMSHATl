package com.socialapp.utils

import android.util.Base64
import java.nio.charset.StandardCharsets
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties

object SecureBlobCodec {
    private const val KEYSTORE_ALIAS = "yamshat_secure_blob_key_v1"
    private const val ANDROID_KEYSTORE = "AndroidKeyStore"
    private const val PREFIX = "SDB1:"

    fun encrypt(input: ByteArray): ByteArray {
        if (input.isEmpty()) return input
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(Cipher.ENCRYPT_MODE, getOrCreateKey())
        val iv = Base64.encodeToString(cipher.iv, Base64.NO_WRAP)
        val encrypted = Base64.encodeToString(cipher.doFinal(input), Base64.NO_WRAP)
        return "$PREFIX$iv:$encrypted".toByteArray(StandardCharsets.UTF_8)
    }

    fun decrypt(input: ByteArray): ByteArray {
        if (input.isEmpty()) return input
        val raw = String(input, StandardCharsets.UTF_8)
        if (!raw.startsWith(PREFIX)) return input
        val payload = raw.removePrefix(PREFIX)
        val separator = payload.indexOf(':')
        if (separator <= 0) return input
        val iv = Base64.decode(payload.substring(0, separator), Base64.NO_WRAP)
        val encrypted = Base64.decode(payload.substring(separator + 1), Base64.NO_WRAP)
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(Cipher.DECRYPT_MODE, getOrCreateKey(), GCMParameterSpec(128, iv))
        return cipher.doFinal(encrypted)
    }

    private fun getOrCreateKey(): SecretKey {
        val keyStore = KeyStore.getInstance(ANDROID_KEYSTORE).apply { load(null) }
        val existing = keyStore.getKey(KEYSTORE_ALIAS, null) as? SecretKey
        if (existing != null) return existing

        val generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, ANDROID_KEYSTORE)
        val spec = KeyGenParameterSpec.Builder(
            KEYSTORE_ALIAS,
            KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT,
        )
            .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
            .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
            .setRandomizedEncryptionRequired(true)
            .setKeySize(256)
            .build()
        generator.init(spec)
        return generator.generateKey()
    }
}
