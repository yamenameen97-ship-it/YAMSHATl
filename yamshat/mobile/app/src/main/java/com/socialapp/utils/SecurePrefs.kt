package com.socialapp.utils

import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import com.socialapp.BuildConfig

object SecurePrefs {
    fun get(context: Context, name: String): SharedPreferences {
        return runCatching {
            val masterKey = MasterKey.Builder(context.applicationContext)
                .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                .build()
            EncryptedSharedPreferences.create(
                context.applicationContext,
                name,
                masterKey,
                EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
            )
        }.getOrElse {
            if (BuildConfig.ENABLE_LOGS) {
                Log.w("SecurePrefs", "EncryptedSharedPreferences unavailable for $name", it)
            }
            context.applicationContext.getSharedPreferences(name, Context.MODE_PRIVATE)
        }
    }
}
