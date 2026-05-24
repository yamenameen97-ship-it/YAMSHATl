package com.socialapp.models

import com.google.gson.annotations.SerializedName

data class GroupMessage(
    @SerializedName("id")
    val id: Int = 0,
    
    @SerializedName("group_id")
    val groupId: Int = 0,
    
    @SerializedName("sender")
    val sender: String = "",
    
    @SerializedName("sender_name")
    val senderName: String = "",
    
    @SerializedName("message")
    val message: String = "",
    
    @SerializedName("content")
    val content: String = "",
    
    @SerializedName("type")
    val type: String = "text", // text, image, video, voice, file
    
    @SerializedName("media_url")
    val mediaUrl: String? = null,
    
    @SerializedName("encrypted_message")
    val encryptedMessage: String? = null,
    
    @SerializedName("deleted")
    val deleted: Boolean? = false,
    
    @SerializedName("status")
    val status: String = "sent", // sent, delivered, seen
    
    @SerializedName("reactions")
    val reactions: Map<String, List<String>> = emptyMap(), // emoji -> list of usernames
    
    @SerializedName("reply_to_id")
    val replyToId: Int? = null,
    
    @SerializedName("reply_to_message")
    val replyToMessage: String? = null,
    
    @SerializedName("created_at")
    val createdAt: String = "",
    
    @SerializedName("updated_at")
    val updatedAt: String? = null,

    var displayMessage: String = "",
    var isOwn: Boolean = false
)

data class GroupInfo(
    @SerializedName("id")
    val id: Int = 0,
    
    @SerializedName("name")
    val name: String = "",
    
    @SerializedName("description")
    val description: String? = null,
    
    @SerializedName("owner")
    val owner: String = "",
    
    @SerializedName("avatar_url")
    val avatarUrl: String? = null,
    
    @SerializedName("members_count")
    val membersCount: Int = 0,
    
    @SerializedName("is_member")
    val isMember: Boolean = false,
    
    @SerializedName("created_at")
    val createdAt: String = "",
    
    @SerializedName("updated_at")
    val updatedAt: String? = null
)

data class GroupMember(
    @SerializedName("username")
    val username: String = "",
    
    @SerializedName("display_name")
    val displayName: String = "",
    
    @SerializedName("avatar_url")
    val avatarUrl: String? = null,
    
    @SerializedName("role")
    val role: String = "member", // member, admin, owner
    
    @SerializedName("joined_at")
    val joinedAt: String = "",
    
    @SerializedName("is_online")
    val isOnline: Boolean = false
)
