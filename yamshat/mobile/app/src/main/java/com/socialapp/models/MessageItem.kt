package com.socialapp.models

import com.google.gson.annotations.SerializedName

data class MessageItem(
    @SerializedName("id")
    val id: Int? = null,
    @SerializedName("sender")
    val sender: String = "",
    @SerializedName("receiver")
    val receiver: String? = null,
    @SerializedName("message")
    val message: String = "",
    @SerializedName("content")
    val content: String? = null,
    @SerializedName("type")
    val type: String? = "text",
    @SerializedName("media_url")
    val media_url: String? = null,
    @SerializedName("deleted")
    val deleted: Boolean? = false,
    @SerializedName("status")
    var status: String? = "sent",
    @SerializedName("created_at")
    val created_at: String? = null,
    @SerializedName("edited_at")
    val edited_at: String? = null,
    @SerializedName("reactions")
    val reactions: Map<String, Int> = emptyMap(),
    @SerializedName("reply_to_id")
    val reply_to_id: Int? = null,
    @SerializedName("reply_to_sender")
    val reply_to_sender: String? = null,
    @SerializedName("reply_to_message")
    val reply_to_message: String? = null,
    @SerializedName("voice_duration_ms")
    val voice_duration_ms: Long? = null,
    @SerializedName("client_id")
    val client_id: String? = null,
    var displayMessage: String? = null,
) {
    fun localStableKey(): String {
        return buildString {
            append(id ?: -1)
            append('|')
            append(sender)
            append('|')
            append(receiver.orEmpty())
            append('|')
            append(type.orEmpty())
            append('|')
            append(created_at.orEmpty())
            append('|')
            append(message)
            append('|')
            append(media_url.orEmpty())
            append('|')
            append(client_id.orEmpty())
        }
    }
}
