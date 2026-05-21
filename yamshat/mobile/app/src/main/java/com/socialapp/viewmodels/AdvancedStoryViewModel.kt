package com.socialapp.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import com.socialapp.models.*
import com.socialapp.repositories.StoryRepository
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

/**
 * ViewModel متقدم لإدارة الستوري
 * يتعامل مع:
 * - تحميل القصص
 * - إدارة المشاهدين والتفاعلات
 * - إدارة الردود
 * - التحريكات والتأثيرات
 * - الأرشفة والحذف
 */

class AdvancedStoryViewModel(
    private val storyRepository: StoryRepository
) : ViewModel() {
    
    // ============ حالات الواجهة ============
    
    private val _storyUIState = MutableStateFlow(StoryUIState())
    val storyUIState: StateFlow<StoryUIState> = _storyUIState.asStateFlow()
    
    private val _creationUIState = MutableStateFlow(StoryCreationUIState())
    val creationUIState: StateFlow<StoryCreationUIState> = _creationUIState.asStateFlow()
    
    // ============ حالات البيانات ============
    
    private val _stories = MutableStateFlow<List<AdvancedStory>>(emptyList())
    val stories: StateFlow<List<AdvancedStory>> = _stories.asStateFlow()
    
    private val _currentStory = MutableStateFlow<AdvancedStory?>(null)
    val currentStory: StateFlow<AdvancedStory?> = _currentStory.asStateFlow()
    
    private val _viewers = MutableStateFlow<List<StoryViewer>>(emptyList())
    val viewers: StateFlow<List<StoryViewer>> = _viewers.asStateFlow()
    
    private val _reactions = MutableStateFlow<List<StoryReaction>>(emptyList())
    val reactions: StateFlow<List<StoryReaction>> = _reactions.asStateFlow()
    
    private val _replies = MutableStateFlow<List<StoryReply>>(emptyList())
    val replies: StateFlow<List<StoryReply>> = _replies.asStateFlow()
    
    // ============ حالات التحكم ============
    
    private val _isLoadingStories = MutableStateFlow(false)
    val isLoadingStories: StateFlow<Boolean> = _isLoadingStories.asStateFlow()
    
    private val _isLoadingViewers = MutableStateFlow(false)
    val isLoadingViewers: StateFlow<Boolean> = _isLoadingViewers.asStateFlow()
    
    private val _isLoadingReactions = MutableStateFlow(false)
    val isLoadingReactions: StateFlow<Boolean> = _isLoadingReactions.asStateFlow()
    
    private val _isLoadingReplies = MutableStateFlow(false)
    val isLoadingReplies: StateFlow<Boolean> = _isLoadingReplies.asStateFlow()
    
    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage.asStateFlow()
    
    // ============ دوال تحميل البيانات ============
    
    fun loadStories(userId: String? = null) {
        viewModelScope.launch {
            _isLoadingStories.value = true
            try {
                val loadedStories = storyRepository.getStories(userId)
                _stories.value = loadedStories
                
                // تحديث حالة الواجهة
                _storyUIState.value = _storyUIState.value.copy(
                    isLoading = false,
                    stories = loadedStories
                )
                
                if (loadedStories.isNotEmpty()) {
                    _currentStory.value = loadedStories[0]
                    _storyUIState.value = _storyUIState.value.copy(
                        currentStoryIndex = 0
                    )
                }
            } catch (e: Exception) {
                _errorMessage.value = e.message
                _storyUIState.value = _storyUIState.value.copy(
                    isError = true,
                    errorMessage = e.message
                )
            } finally {
                _isLoadingStories.value = false
            }
        }
    }
    
    fun loadViewers(storyId: String) {
        viewModelScope.launch {
            _isLoadingViewers.value = true
            try {
                val viewersList = storyRepository.getViewers(storyId)
                _viewers.value = viewersList
                
                _storyUIState.value = _storyUIState.value.copy(
                    showViewersList = true
                )
            } catch (e: Exception) {
                _errorMessage.value = e.message
            } finally {
                _isLoadingViewers.value = false
            }
        }
    }
    
    fun loadReactions(storyId: String) {
        viewModelScope.launch {
            _isLoadingReactions.value = true
            try {
                val reactionsList = storyRepository.getReactions(storyId)
                _reactions.value = reactionsList
                
                _storyUIState.value = _storyUIState.value.copy(
                    showReactionsList = true
                )
            } catch (e: Exception) {
                _errorMessage.value = e.message
            } finally {
                _isLoadingReactions.value = false
            }
        }
    }
    
    fun loadReplies(storyId: String) {
        viewModelScope.launch {
            _isLoadingReplies.value = true
            try {
                val repliesList = storyRepository.getReplies(storyId)
                _replies.value = repliesList
                
                _storyUIState.value = _storyUIState.value.copy(
                    showRepliesList = true
                )
            } catch (e: Exception) {
                _errorMessage.value = e.message
            } finally {
                _isLoadingReplies.value = false
            }
        }
    }
    
    // ============ دوال التفاعل ============
    
    fun addReaction(storyId: String, reactionType: StoryReactionType, x: Float, y: Float) {
        viewModelScope.launch {
            try {
                val request = StoryReactionRequest(
                    storyId = storyId,
                    reactionType = reactionType,
                    x = x,
                    y = y
                )
                
                storyRepository.addReaction(request)
                
                // تحديث الحالة المحلية
                _storyUIState.value = _storyUIState.value.copy(
                    selectedReaction = reactionType
                )
                
                // إعادة تحميل التفاعلات
                loadReactions(storyId)
            } catch (e: Exception) {
                _errorMessage.value = e.message
            }
        }
    }
    
    fun addReply(storyId: String, message: String, isDirectMessage: Boolean = false) {
        viewModelScope.launch {
            try {
                val request = StoryReplyRequest(
                    storyId = storyId,
                    message = message,
                    isDirectMessage = isDirectMessage
                )
                
                storyRepository.addReply(request)
                
                // تحديث الحالة
                _storyUIState.value = _storyUIState.value.copy(
                    replyText = "",
                    showReplyInput = false
                )
                
                // إعادة تحميل الردود
                loadReplies(storyId)
            } catch (e: Exception) {
                _errorMessage.value = e.message
            }
        }
    }
    
    fun recordStoryView(storyId: String, viewDuration: Long) {
        viewModelScope.launch {
            try {
                val request = ViewStoryRequest(
                    storyId = storyId,
                    viewDuration = viewDuration
                )
                
                storyRepository.recordView(request)
            } catch (e: Exception) {
                _errorMessage.value = e.message
            }
        }
    }
    
    // ============ دوال الإدارة ============
    
    fun archiveStory(storyId: String) {
        viewModelScope.launch {
            try {
                storyRepository.archiveStory(storyId)
                
                // تحديث القائمة المحلية
                _stories.value = _stories.value.map { story ->
                    if (story.id == storyId) {
                        story.copy(isArchived = true)
                    } else {
                        story
                    }
                }
            } catch (e: Exception) {
                _errorMessage.value = e.message
            }
        }
    }
    
    fun deleteStory(storyId: String) {
        viewModelScope.launch {
            try {
                storyRepository.deleteStory(storyId)
                
                // إزالة من القائمة
                _stories.value = _stories.value.filter { it.id != storyId }
            } catch (e: Exception) {
                _errorMessage.value = e.message
            }
        }
    }
    
    fun pinStory(storyId: String) {
        viewModelScope.launch {
            try {
                storyRepository.pinStory(storyId)
                
                _stories.value = _stories.value.map { story ->
                    if (story.id == storyId) {
                        story.copy(isPinned = true)
                    } else {
                        story
                    }
                }
            } catch (e: Exception) {
                _errorMessage.value = e.message
            }
        }
    }
    
    fun shareStory(storyId: String) {
        viewModelScope.launch {
            try {
                storyRepository.shareStory(storyId)
                
                _stories.value = _stories.value.map { story ->
                    if (story.id == storyId) {
                        story.copy(shares = story.shares + 1)
                    } else {
                        story
                    }
                }
            } catch (e: Exception) {
                _errorMessage.value = e.message
            }
        }
    }
    
    // ============ دوال الملاحة ============
    
    fun nextStory() {
        val currentIndex = _storyUIState.value.currentStoryIndex
        if (currentIndex < _stories.value.size - 1) {
            val nextIndex = currentIndex + 1
            _currentStory.value = _stories.value[nextIndex]
            _storyUIState.value = _storyUIState.value.copy(
                currentStoryIndex = nextIndex
            )
        }
    }
    
    fun previousStory() {
        val currentIndex = _storyUIState.value.currentStoryIndex
        if (currentIndex > 0) {
            val prevIndex = currentIndex - 1
            _currentStory.value = _stories.value[prevIndex]
            _storyUIState.value = _storyUIState.value.copy(
                currentStoryIndex = prevIndex
            )
        }
    }
    
    fun goToStory(index: Int) {
        if (index in _stories.value.indices) {
            _currentStory.value = _stories.value[index]
            _storyUIState.value = _storyUIState.value.copy(
                currentStoryIndex = index
            )
        }
    }
    
    // ============ دوال الواجهة ============
    
    fun toggleViewersList() {
        _storyUIState.value = _storyUIState.value.copy(
            showViewersList = !_storyUIState.value.showViewersList
        )
    }
    
    fun toggleReactionsList() {
        _storyUIState.value = _storyUIState.value.copy(
            showReactionsList = !_storyUIState.value.showReactionsList
        )
    }
    
    fun toggleRepliesList() {
        _storyUIState.value = _storyUIState.value.copy(
            showRepliesList = !_storyUIState.value.showRepliesList
        )
    }
    
    fun toggleReplyInput() {
        _storyUIState.value = _storyUIState.value.copy(
            showReplyInput = !_storyUIState.value.showReplyInput
        )
    }
    
    fun updateReplyText(text: String) {
        _storyUIState.value = _storyUIState.value.copy(
            replyText = text
        )
    }
    
    // ============ دوال الإنشاء ============
    
    fun updateMediaUrl(url: String) {
        _creationUIState.value = _creationUIState.value.copy(
            mediaUrl = url
        )
    }
    
    fun updateCaption(caption: String) {
        _creationUIState.value = _creationUIState.value.copy(
            caption = caption
        )
    }
    
    fun updatePrivacy(privacy: StoryPrivacy) {
        _creationUIState.value = _creationUIState.value.copy(
            privacy = privacy
        )
    }
    
    fun updateBrightness(brightness: Float) {
        _creationUIState.value = _creationUIState.value.copy(
            brightness = brightness.coerceIn(0.5f, 1.5f)
        )
    }
    
    fun updateContrast(contrast: Float) {
        _creationUIState.value = _creationUIState.value.copy(
            contrast = contrast.coerceIn(0.5f, 1.5f)
        )
    }
    
    fun updateSaturation(saturation: Float) {
        _creationUIState.value = _creationUIState.value.copy(
            saturation = saturation.coerceIn(0.5f, 1.5f)
        )
    }
    
    fun addSticker(sticker: StorySticker) {
        val currentStickers = _creationUIState.value.stickers.toMutableList()
        currentStickers.add(sticker)
        _creationUIState.value = _creationUIState.value.copy(
            stickers = currentStickers
        )
    }
    
    fun removeSticker(stickerId: String) {
        val currentStickers = _creationUIState.value.stickers.toMutableList()
        currentStickers.removeAll { it.id == stickerId }
        _creationUIState.value = _creationUIState.value.copy(
            stickers = currentStickers
        )
    }
    
    fun setMusic(music: StoryMusic) {
        _creationUIState.value = _creationUIState.value.copy(
            music = music
        )
    }
    
    fun removeMusic() {
        _creationUIState.value = _creationUIState.value.copy(
            music = null
        )
    }
    
    fun toggleStickerPicker() {
        _creationUIState.value = _creationUIState.value.copy(
            showStickerPicker = !_creationUIState.value.showStickerPicker
        )
    }
    
    fun toggleMusicPicker() {
        _creationUIState.value = _creationUIState.value.copy(
            showMusicPicker = !_creationUIState.value.showMusicPicker
        )
    }
    
    fun togglePrivacyOptions() {
        _creationUIState.value = _creationUIState.value.copy(
            showPrivacyOptions = !_creationUIState.value.showPrivacyOptions
        )
    }
    
    // ============ دوال الحفظ والنشر ============
    
    fun createStory() {
        viewModelScope.launch {
            val state = _creationUIState.value
            
            if (state.mediaUrl == null) {
                _errorMessage.value = "يجب تحديد صورة أو فيديو"
                return@launch
            }
            
            try {
                _creationUIState.value = _creationUIState.value.copy(
                    isLoading = true
                )
                
                val request = CreateStoryRequest(
                    mediaUrl = state.mediaUrl,
                    caption = state.caption,
                    privacy = state.privacy,
                    stickers = state.stickers,
                    music = state.music
                )
                
                val createdStory = storyRepository.createStory(request)
                
                // إضافة إلى القائمة
                _stories.value = listOf(createdStory) + _stories.value
                
                // إعادة تعيين نموذج الإنشاء
                _creationUIState.value = StoryCreationUIState()
                
            } catch (e: Exception) {
                _errorMessage.value = e.message
                _creationUIState.value = _creationUIState.value.copy(
                    isError = true,
                    errorMessage = e.message
                )
            } finally {
                _creationUIState.value = _creationUIState.value.copy(
                    isLoading = false
                )
            }
        }
    }
    
    fun clearError() {
        _errorMessage.value = null
        _storyUIState.value = _storyUIState.value.copy(
            isError = false,
            errorMessage = null
        )
    }
}
