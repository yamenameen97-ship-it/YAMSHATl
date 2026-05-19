package com.socialapp.utils

import android.content.Context
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import com.socialapp.models.GroupMessage
import com.socialapp.models.MessageItem

object ConversationCache {
    private const val PREF_NAME = "conversation_cache_secure"
    private val gson = Gson()

    fun savePrivate(context: Context, peer: String, messages: List<MessageItem>) {
        saveJson(context, "private_${peer.trim().lowercase()}", gson.toJson(messages))
    }

    fun loadPrivate(context: Context, peer: String): List<MessageItem> {
        val type = object : TypeToken<List<MessageItem>>() {}.type
        return loadJson(context, "private_${peer.trim().lowercase()}")
            ?.let { runCatching { gson.fromJson<List<MessageItem>>(it, type) }.getOrNull() }
            .orEmpty()
    }

    fun saveGroup(context: Context, groupId: Int, messages: List<GroupMessage>) {
        saveJson(context, "group_$groupId", gson.toJson(messages))
    }

    fun loadGroup(context: Context, groupId: Int): List<GroupMessage> {
        val type = object : TypeToken<List<GroupMessage>>() {}.type
        return loadJson(context, "group_$groupId")
            ?.let { runCatching { gson.fromJson<List<GroupMessage>>(it, type) }.getOrNull() }
            .orEmpty()
    }

    private fun saveJson(context: Context, key: String, value: String) {
        SecurePrefs.get(context, PREF_NAME)
            .edit()
            .putString(key, value)
            .apply()
    }

    private fun loadJson(context: Context, key: String): String? {
        return SecurePrefs.get(context, PREF_NAME)
            .getString(key, null)
    }
}
