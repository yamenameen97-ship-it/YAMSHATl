package com.socialapp.models

import com.google.gson.annotations.SerializedName

data class GroupMessage(
    @SerializedName("id")
    val id: String = "",
    
    @SerializedName("group_id")
    val groupId: String = "",
    
    @SerializedName("sender_username")
    val senderUsername: String = "",
    
    @SerializedName("sender_avatar")
    val senderAvatar: String = "",
    
    @SerializedName("sender_display_name")
    val senderDisplayName: String = "",
    
    @SerializedName("content")
    val content: String = "",
    
    @SerializedName("message_type")
    val messageType: String = "text", // text, image, video, voice, file
    
    @SerializedName("attachments")
    val attachments: List<Map<String, Any>> = emptyList(),
    
    @SerializedName("created_at")
    val createdAt: String = "",
    
    @SerializedName("edited_at")
    val editedAt: String? = null,
    
    @SerializedName("is_edited")
    val isEdited: Boolean = false,
    
    @SerializedName("is_deleted")
    val isDeleted: Boolean = false,
    
    @SerializedName("reply_to")
    val replyTo: String? = null,
    
    @SerializedName("reactions")
    val reactions: Map<String, List<String>> = emptyMap(), // emoji -> list of usernames
    
    @SerializedName("seen_by")
    val seenBy: List<String> = emptyList(),
    
    @SerializedName("seen_count")
    val seenCount: Int = 0,

    var displayMessage: String = "",
    var isOwn: Boolean = false
) {
    /**
     * الحصول على عدد التفاعلات
     */
    fun getReactionCount(emoji: String): Int {
        return reactions[emoji]?.size ?: 0
    }
    
    /**
     * التحقق من وجود تفاعل معين من المستخدم
     */
    fun hasReaction(emoji: String, username: String): Boolean {
        return reactions[emoji]?.contains(username) ?: false
    }
    
    /**
     * التحقق من قراءة الرسالة من قبل المستخدم
     */
    fun isSeenBy(username: String): Boolean {
        return seenBy.contains(username)
    }
    
    /**
     * الحصول على نسبة القراءة
     */
    fun getSeenPercentage(totalMembers: Int): Int {
        return if (totalMembers > 0) (seenCount * 100) / totalMembers else 0
    }
}

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
