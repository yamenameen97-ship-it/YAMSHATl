package com.socialapp.repositories

import com.socialapp.models.ApiMessage
import com.socialapp.models.MessageItem
import com.socialapp.network.ApiService
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.util.concurrent.ConcurrentHashMap

class ChatRepository(
    private val apiService: ApiService,
) {
    private val conversations = ConcurrentHashMap<String, MutableStateFlow<List<MessageItem>>>()

    private fun streamFor(chatId: String): MutableStateFlow<List<MessageItem>> {
        return conversations.getOrPut(chatId) { MutableStateFlow(emptyList()) }
    }

    suspend fun sendMessage(message: MessageItem): ApiMessage {
        val chatId = message.receiver ?: message.sender
        val current = streamFor(chatId)
        current.value = current.value + message.copy(status = "pending")

        val payload = mutableMapOf<String, Any?>(
            "receiver" to message.receiver,
            "message" to message.message,
            "type" to (message.type ?: "text"),
            "client_id" to message.client_id,
        )
        message.media_url?.let { payload["media"] = it }

        val response = apiService.sendMessage(payload).execute()
        val body = response.body() ?: ApiMessage(ok = response.isSuccessful, message = if (response.isSuccessful) "sent" else "failed")
        current.value = current.value.map {
            if (it.client_id == message.client_id || (it.id != null && it.id == message.id)) {
                it.copy(status = if (response.isSuccessful) "sent" else "failed")
            } else {
                it
            }
        }
        return body
    }

    fun getMessages(chatId: String): Flow<List<MessageItem>> = streamFor(chatId).asStateFlow()

    suspend fun setInitialMessages(chatId: String, messages: List<MessageItem>) {
        streamFor(chatId).value = messages
    }

    suspend fun markAsSeen(messageId: String) {
        apiService.messageSeen(mapOf("message_id" to messageId)).execute()
    }
}
