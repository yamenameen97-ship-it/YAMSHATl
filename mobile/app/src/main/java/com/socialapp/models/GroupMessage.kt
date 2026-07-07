package com.socialapp.models

import com.google.gson.annotations.SerializedName

/**
 * GroupMessage — v85.1 UNIFIED
 * ------------------------------------------------------------------
 * موحد على شكل واحد يتوافق مع:
 *   - عقد الخادم (backend/app/api/routes/groups.py)
 *   - المستخدمين في GroupChatActivity و GroupMessageAdapter
 * كل الحقول القديمة (sender/message/type/deleted…) بقيت كـ getters
 * حتى لا تنكسر الشيفرة الحالية.
 */
data class GroupMessage(
    @SerializedName("id")
    val id: String = "",

    @SerializedName("group_id")
    val groupId: String = "",

    @SerializedName(value = "sender_username", alternate = ["sender", "sender_name"])
    val senderUsername: String = "",

    @SerializedName(value = "sender_display_name", alternate = ["senderName"])
    val senderDisplayName: String = "",

    @SerializedName("sender_avatar")
    val senderAvatar: String = "",

    @SerializedName(value = "content", alternate = ["message", "text"])
    val content: String = "",

    @SerializedName(value = "message_type", alternate = ["type"])
    val messageType: String = "text", // text, image, video, voice, file

    @SerializedName(value = "media_url", alternate = ["mediaUrl", "attachment_url"])
    val mediaUrl: String? = null,

    @SerializedName("attachments")
    val attachments: List<Map<String, Any>> = emptyList(),

    @SerializedName("created_at")
    val createdAt: String = "",

    @SerializedName("edited_at")
    val editedAt: String? = null,

    @SerializedName(value = "is_edited", alternate = ["edited"])
    val isEdited: Boolean = false,

    @SerializedName(value = "is_deleted", alternate = ["deleted"])
    val isDeleted: Boolean = false,

    @SerializedName("reply_to")
    val replyTo: String? = null,

    @SerializedName("reactions")
    val reactions: Map<String, List<String>> = emptyMap(), // emoji -> list of usernames

    @SerializedName("seen_by")
    val seenBy: List<String> = emptyList(),

    @SerializedName("seen_count")
    val seenCount: Int = 0,

    @SerializedName(value = "status", alternate = ["delivery_status"])
    val status: String = "sent",

    // Client-side فقط
    var displayMessage: String = "",
    var isOwn: Boolean = false
) {
    /* ============================================================
     * توافق للأسماء القديمة داخل الشيفرة الحالية
     * (لا تُسريَل، مجرد فتحات للحفاظ على التوافق)
     * ============================================================ */
    val sender: String get() = senderUsername
    val senderName: String get() = senderDisplayName.ifBlank { senderUsername }
    val message: String get() = content
    val type: String get() = messageType
    val deleted: Boolean get() = isDeleted

    /**
     * الحصول على عدد التفاعلات
     */
    fun getReactionCount(emoji: String): Int = reactions[emoji]?.size ?: 0

    /**
     * التحقق من وجود تفاعل معين من المستخدم
     */
    fun hasReaction(emoji: String, username: String): Boolean =
        reactions[emoji]?.contains(username) ?: false

    /**
     * التحقق من قراءة الرسالة من قبل المستخدم
     */
    fun isSeenBy(username: String): Boolean = seenBy.contains(username)

    /**
     * الحصول على نسبة القراءة
     */
    fun getSeenPercentage(totalMembers: Int): Int =
        if (totalMembers > 0) (seenCount * 100) / totalMembers else 0
}

data class GroupInfo(
    @SerializedName("id")
    val id: Int = 0,

    @SerializedName("name")
    val name: String = "",

    @SerializedName("description")
    val description: String? = null,

    @SerializedName(value = "owner", alternate = ["owner_username", "created_by"])
    val owner: String = "",

    @SerializedName(value = "avatar_url", alternate = ["image_url"])
    val avatarUrl: String? = null,

    @SerializedName("cover_image_url")
    val coverImageUrl: String? = null,

    @SerializedName("category")
    val category: String? = null,

    @SerializedName("privacy")
    val privacy: String? = null,

    @SerializedName(value = "members_count", alternate = ["memberCount"])
    val membersCount: Int = 0,

    @SerializedName(value = "is_member", alternate = ["isMember"])
    val isMember: Boolean = false,

    @SerializedName(value = "is_owner", alternate = ["isOwner"])
    val isOwner: Boolean = false,

    @SerializedName(value = "is_admin", alternate = ["isAdmin"])
    val isAdmin: Boolean = false,

    @SerializedName("created_at")
    val createdAt: String = "",

    @SerializedName("updated_at")
    val updatedAt: String? = null
)

data class GroupMember(
    @SerializedName("username")
    val username: String = "",

    @SerializedName(value = "display_name", alternate = ["displayName"])
    val displayName: String = "",

    @SerializedName("avatar_url")
    val avatarUrl: String? = null,

    @SerializedName("role")
    val role: String = "member", // member, admin, owner

    @SerializedName("joined_at")
    val joinedAt: String = "",

    @SerializedName(value = "is_online", alternate = ["isOnline"])
    val isOnline: Boolean = false,

    @SerializedName(value = "is_muted", alternate = ["isMuted"])
    val isMuted: Boolean = false,

    @SerializedName(value = "is_banned", alternate = ["isBanned"])
    val isBanned: Boolean = false
)
