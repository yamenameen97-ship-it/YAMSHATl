package com.socialapp.models

import android.os.Parcelable
import kotlinx.parcelize.Parcelize
import java.io.Serializable

/**
 * نموذج الستوري المتقدم - Advanced Story Model
 * يحتوي على جميع المميزات المتقدمة للقصص
 */

// ============ تعريفات الأنواع ============

enum class StoryReactionType {
    HEART,
    LAUGH,
    WOW,
    SAD,
    ANGRY,
    LIKE,
    LOVE
}

enum class StoryGestureType {
    SWIPE_LEFT,
    SWIPE_RIGHT,
    DOUBLE_TAP,
    LONG_PRESS,
    PINCH_ZOOM,
    ROTATE
}

enum class StickerType {
    EMOJI,
    GIF,
    TEXT,
    LOCATION,
    POLL,
    QUESTION,
    COUNTDOWN,
    MUSIC
}

enum class StoryPrivacy {
    PUBLIC,
    FOLLOWERS,
    CLOSE_FRIENDS,
    PRIVATE
}

// ============ نماذج البيانات ============

@Parcelize
data class StoryViewer(
    val userId: String = "",
    val username: String = "",
    val avatar: String = "",
    val viewedAt: String = "",
    val reactionType: StoryReactionType? = null,
    val replyText: String? = null,
    val isCloseFriend: Boolean = false
) : Parcelable, Serializable

@Parcelize
data class StoryReaction(
    val id: String = "",
    val userId: String = "",
    val username: String = "",
    val avatar: String = "",
    val reactionType: StoryReactionType = StoryReactionType.HEART,
    val timestamp: String = "",
    val x: Float = 0.5f,  // موضع التفاعل على الشاشة (0-1)
    val y: Float = 0.5f
) : Parcelable, Serializable

@Parcelize
data class StoryReply(
    val id: String = "",
    val userId: String = "",
    val username: String = "",
    val avatar: String = "",
    val message: String = "",
    val timestamp: String = "",
    val isDirectMessage: Boolean = false,
    val hasMedia: Boolean = false,
    val mediaUrl: String? = null
) : Parcelable, Serializable

@Parcelize
data class StorySticker(
    val id: String = "",
    val type: StickerType = StickerType.EMOJI,
    val content: String = "",  // emoji, URL للـ GIF، النص، إلخ
    val x: Float = 0.5f,
    val y: Float = 0.5f,
    val scale: Float = 1.0f,
    val rotation: Float = 0f,
    val opacity: Float = 1.0f,
    val metadata: Map<String, Any> = emptyMap()
) : Parcelable, Serializable

@Parcelize
data class StoryMusic(
    val id: String = "",
    val title: String = "",
    val artist: String = "",
    val albumArt: String = "",
    val audioUrl: String = "",
    val duration: Long = 0L,
    val startTime: Long = 0L,
    val endTime: Long = 0L,
    val isOriginalAudio: Boolean = false
) : Parcelable, Serializable

@Parcelize
data class StoryArchive(
    val id: String = "",
    val storyId: String = "",
    val archivedAt: String = "",
    val isExpired: Boolean = false,
    val expiresAt: String? = null
) : Parcelable, Serializable

@Parcelize
data class StoryGesture(
    val type: StoryGestureType = StoryGestureType.DOUBLE_TAP,
    val x: Float = 0.5f,
    val y: Float = 0.5f,
    val timestamp: String = ""
) : Parcelable, Serializable

@Parcelize
data class AdvancedStory(
    val id: String = "",
    val userId: String = "",
    val username: String = "",
    val userAvatar: String = "",
    val mediaUrl: String = "",
    val mediaType: String = "image",  // image, video, carousel
    val caption: String = "",
    val createdAt: String = "",
    val expiresAt: String = "",
    val duration: Long = 5000L,  // مدة عرض الستوري بالميلي ثانية
    
    // الخصوصية والإعدادات
    val privacy: StoryPrivacy = StoryPrivacy.PUBLIC,
    val allowReplies: Boolean = true,
    val allowReactions: Boolean = true,
    val allowSharing: Boolean = true,
    val isMuted: Boolean = false,
    val isArchived: Boolean = false,
    val isPinned: Boolean = false,
    
    // المشاهدين والتفاعلات
    val viewers: List<StoryViewer> = emptyList(),
    val viewCount: Int = 0,
    val reactions: List<StoryReaction> = emptyList(),
    val reactionCount: Int = 0,
    val replies: List<StoryReply> = emptyList(),
    val replyCount: Int = 0,
    val shares: Int = 0,
    
    // الملصقات والموسيقى
    val stickers: List<StorySticker> = emptyList(),
    val music: StoryMusic? = null,
    
    // التحريكات والتأثيرات
    val hasFilter: Boolean = false,
    val filterName: String? = null,
    val hasAnimation: Boolean = false,
    val animationType: String? = null,
    val brightness: Float = 1.0f,
    val contrast: Float = 1.0f,
    val saturation: Float = 1.0f,
    
    // البيانات الإضافية
    val location: String? = null,
    val locationCoordinates: Pair<Double, Double>? = null,
    val mentions: List<String> = emptyList(),
    val hashtags: List<String> = emptyList(),
    val metadata: Map<String, Any> = emptyMap(),
    
    // حالة المستخدم
    val hasViewed: Boolean = false,
    val myReaction: StoryReactionType? = null,
    val myReply: String? = null
) : Parcelable, Serializable

// ============ نماذج الطلبات والاستجابات ============

@Parcelize
data class CreateStoryRequest(
    val mediaUrl: String = "",
    val mediaType: String = "image",
    val caption: String = "",
    val privacy: StoryPrivacy = StoryPrivacy.PUBLIC,
    val stickers: List<StorySticker> = emptyList(),
    val music: StoryMusic? = null,
    val duration: Long = 5000L,
    val metadata: Map<String, Any> = emptyMap()
) : Parcelable, Serializable

@Parcelize
data class UpdateStoryRequest(
    val caption: String? = null,
    val privacy: StoryPrivacy? = null,
    val allowReplies: Boolean? = null,
    val allowReactions: Boolean? = null,
    val isArchived: Boolean? = null,
    val isPinned: Boolean? = null
) : Parcelable, Serializable

@Parcelize
data class StoryReactionRequest(
    val storyId: String = "",
    val reactionType: StoryReactionType = StoryReactionType.HEART,
    val x: Float = 0.5f,
    val y: Float = 0.5f
) : Parcelable, Serializable

@Parcelize
data class StoryReplyRequest(
    val storyId: String = "",
    val message: String = "",
    val isDirectMessage: Boolean = false,
    val mediaUrl: String? = null
) : Parcelable, Serializable

@Parcelize
data class ViewStoryRequest(
    val storyId: String = "",
    val viewDuration: Long = 0L,
    val hasReacted: Boolean = false
) : Parcelable, Serializable

// ============ نماذج الاستجابات ============

data class StoriesResponse(
    val success: Boolean = false,
    val stories: List<AdvancedStory> = emptyList(),
    val total: Int = 0,
    val message: String? = null
)

data class StoryResponse(
    val success: Boolean = false,
    val story: AdvancedStory? = null,
    val message: String? = null
)

data class ViewersResponse(
    val success: Boolean = false,
    val viewers: List<StoryViewer> = emptyList(),
    val total: Int = 0,
    val message: String? = null
)

data class ReactionsResponse(
    val success: Boolean = false,
    val reactions: List<StoryReaction> = emptyList(),
    val total: Int = 0,
    val summary: Map<StoryReactionType, Int> = emptyMap(),
    val message: String? = null
)

data class RepliesResponse(
    val success: Boolean = false,
    val replies: List<StoryReply> = emptyList(),
    val total: Int = 0,
    val message: String? = null
)

// ============ نماذج الحالة ============

data class StoryUIState(
    val isLoading: Boolean = false,
    val isError: Boolean = false,
    val errorMessage: String? = null,
    val stories: List<AdvancedStory> = emptyList(),
    val currentStoryIndex: Int = 0,
    val viewers: List<StoryViewer> = emptyList(),
    val reactions: List<StoryReaction> = emptyList(),
    val replies: List<StoryReply> = emptyList(),
    val showViewersList: Boolean = false,
    val showReactionsList: Boolean = false,
    val showRepliesList: Boolean = false,
    val showReplyInput: Boolean = false,
    val selectedReaction: StoryReactionType? = null,
    val replyText: String = ""
)

data class StoryCreationUIState(
    val isLoading: Boolean = false,
    val isError: Boolean = false,
    val errorMessage: String? = null,
    val mediaUrl: String? = null,
    val caption: String = "",
    val stickers: List<StorySticker> = emptyList(),
    val music: StoryMusic? = null,
    val privacy: StoryPrivacy = StoryPrivacy.PUBLIC,
    val brightness: Float = 1.0f,
    val contrast: Float = 1.0f,
    val saturation: Float = 1.0f,
    val selectedFilter: String? = null,
    val showStickerPicker: Boolean = false,
    val showMusicPicker: Boolean = false,
    val showPrivacyOptions: Boolean = false
)

// ============ نماذج الأحداث ============

sealed class StoryEvent {
    data class OnStoryViewed(val storyId: String, val viewDuration: Long) : StoryEvent()
    data class OnReactionAdded(val storyId: String, val reaction: StoryReactionType, val x: Float, val y: Float) : StoryEvent()
    data class OnReplyAdded(val storyId: String, val reply: String) : StoryEvent()
    data class OnStoryShared(val storyId: String) : StoryEvent()
    data class OnStoryArchived(val storyId: String) : StoryEvent()
    data class OnStoryDeleted(val storyId: String) : StoryEvent()
    object OnViewersListRequested : StoryEvent()
    object OnReactionsListRequested : StoryEvent()
    object OnRepliesListRequested : StoryEvent()
}
