package com.socialapp.repositories

import com.socialapp.models.*
import com.socialapp.network.ApiService
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resumeWithException
import kotlin.coroutines.resume

/**
 * مستودع الستوري المتقدم
 * يتعامل مع جميع عمليات البيانات المتعلقة بالقصص
 */

interface StoryRepository {
    suspend fun getStories(userId: String? = null): List<AdvancedStory>
    suspend fun getStoryById(storyId: String): AdvancedStory
    suspend fun createStory(request: CreateStoryRequest): AdvancedStory
    suspend fun updateStory(storyId: String, request: UpdateStoryRequest): AdvancedStory
    suspend fun deleteStory(storyId: String): Boolean
    suspend fun archiveStory(storyId: String): Boolean
    suspend fun pinStory(storyId: String): Boolean
    suspend fun shareStory(storyId: String): Boolean
    
    suspend fun getViewers(storyId: String): List<StoryViewer>
    suspend fun getReactions(storyId: String): List<StoryReaction>
    suspend fun getReplies(storyId: String): List<StoryReply>
    
    suspend fun addReaction(request: StoryReactionRequest): StoryReaction
    suspend fun removeReaction(storyId: String, reactionId: String): Boolean
    
    suspend fun addReply(request: StoryReplyRequest): StoryReply
    suspend fun deleteReply(storyId: String, replyId: String): Boolean
    
    suspend fun recordView(request: ViewStoryRequest): Boolean
    
    suspend fun getArchivedStories(userId: String): List<AdvancedStory>
    suspend fun getPinnedStories(userId: String): List<AdvancedStory>
}

class AdvancedStoryRepositoryImpl(
    private val apiService: ApiService
) : StoryRepository {
    
    override suspend fun getStories(userId: String?): List<AdvancedStory> {
        return suspendCancellableCoroutine { continuation ->
            val call = if (userId != null) {
                apiService.getUserStories(userId)
            } else {
                apiService.getStories()
            }
            
            call.enqueue(object : Callback<List<AdvancedStory>> {
                override fun onResponse(
                    call: Call<List<AdvancedStory>>,
                    response: Response<List<AdvancedStory>>
                ) {
                    if (response.isSuccessful) {
                        continuation.resume(response.body() ?: emptyList())
                    } else {
                        continuation.resumeWithException(
                            Exception("Failed to fetch stories: ${response.code()}")
                        )
                    }
                }
                
                override fun onFailure(call: Call<List<AdvancedStory>>, t: Throwable) {
                    continuation.resumeWithException(t)
                }
            })
        }
    }
    
    override suspend fun getStoryById(storyId: String): AdvancedStory {
        return suspendCancellableCoroutine { continuation ->
            apiService.getStoryById(storyId).enqueue(
                object : Callback<AdvancedStory> {
                    override fun onResponse(
                        call: Call<AdvancedStory>,
                        response: Response<AdvancedStory>
                    ) {
                        if (response.isSuccessful) {
                            continuation.resume(response.body() ?: throw Exception("Empty response"))
                        } else {
                            continuation.resumeWithException(
                                Exception("Failed to fetch story: ${response.code()}")
                            )
                        }
                    }
                    
                    override fun onFailure(call: Call<AdvancedStory>, t: Throwable) {
                        continuation.resumeWithException(t)
                    }
                }
            )
        }
    }
    
    override suspend fun createStory(request: CreateStoryRequest): AdvancedStory {
        return suspendCancellableCoroutine { continuation ->
            apiService.createStory(request).enqueue(
                object : Callback<AdvancedStory> {
                    override fun onResponse(
                        call: Call<AdvancedStory>,
                        response: Response<AdvancedStory>
                    ) {
                        if (response.isSuccessful) {
                            continuation.resume(response.body() ?: throw Exception("Empty response"))
                        } else {
                            continuation.resumeWithException(
                                Exception("Failed to create story: ${response.code()}")
                            )
                        }
                    }
                    
                    override fun onFailure(call: Call<AdvancedStory>, t: Throwable) {
                        continuation.resumeWithException(t)
                    }
                }
            )
        }
    }
    
    override suspend fun updateStory(
        storyId: String,
        request: UpdateStoryRequest
    ): AdvancedStory {
        return suspendCancellableCoroutine { continuation ->
            apiService.updateStory(storyId, request).enqueue(
                object : Callback<AdvancedStory> {
                    override fun onResponse(
                        call: Call<AdvancedStory>,
                        response: Response<AdvancedStory>
                    ) {
                        if (response.isSuccessful) {
                            continuation.resume(response.body() ?: throw Exception("Empty response"))
                        } else {
                            continuation.resumeWithException(
                                Exception("Failed to update story: ${response.code()}")
                            )
                        }
                    }
                    
                    override fun onFailure(call: Call<AdvancedStory>, t: Throwable) {
                        continuation.resumeWithException(t)
                    }
                }
            )
        }
    }
    
    override suspend fun deleteStory(storyId: String): Boolean {
        return suspendCancellableCoroutine { continuation ->
            apiService.deleteStory(storyId).enqueue(
                object : Callback<Void> {
                    override fun onResponse(call: Call<Void>, response: Response<Void>) {
                        continuation.resume(response.isSuccessful)
                    }
                    
                    override fun onFailure(call: Call<Void>, t: Throwable) {
                        continuation.resumeWithException(t)
                    }
                }
            )
        }
    }
    
    override suspend fun archiveStory(storyId: String): Boolean {
        return suspendCancellableCoroutine { continuation ->
            apiService.archiveStory(storyId).enqueue(
                object : Callback<Void> {
                    override fun onResponse(call: Call<Void>, response: Response<Void>) {
                        continuation.resume(response.isSuccessful)
                    }
                    
                    override fun onFailure(call: Call<Void>, t: Throwable) {
                        continuation.resumeWithException(t)
                    }
                }
            )
        }
    }
    
    override suspend fun pinStory(storyId: String): Boolean {
        return suspendCancellableCoroutine { continuation ->
            apiService.pinStory(storyId).enqueue(
                object : Callback<Void> {
                    override fun onResponse(call: Call<Void>, response: Response<Void>) {
                        continuation.resume(response.isSuccessful)
                    }
                    
                    override fun onFailure(call: Call<Void>, t: Throwable) {
                        continuation.resumeWithException(t)
                    }
                }
            )
        }
    }
    
    override suspend fun shareStory(storyId: String): Boolean {
        return suspendCancellableCoroutine { continuation ->
            apiService.shareStory(storyId).enqueue(
                object : Callback<Void> {
                    override fun onResponse(call: Call<Void>, response: Response<Void>) {
                        continuation.resume(response.isSuccessful)
                    }
                    
                    override fun onFailure(call: Call<Void>, t: Throwable) {
                        continuation.resumeWithException(t)
                    }
                }
            )
        }
    }
    
    override suspend fun getViewers(storyId: String): List<StoryViewer> {
        return suspendCancellableCoroutine { continuation ->
            apiService.getStoryViewers(storyId).enqueue(
                object : Callback<List<StoryViewer>> {
                    override fun onResponse(
                        call: Call<List<StoryViewer>>,
                        response: Response<List<StoryViewer>>
                    ) {
                        if (response.isSuccessful) {
                            continuation.resume(response.body() ?: emptyList())
                        } else {
                            continuation.resumeWithException(
                                Exception("Failed to fetch viewers: ${response.code()}")
                            )
                        }
                    }
                    
                    override fun onFailure(call: Call<List<StoryViewer>>, t: Throwable) {
                        continuation.resumeWithException(t)
                    }
                }
            )
        }
    }
    
    override suspend fun getReactions(storyId: String): List<StoryReaction> {
        return suspendCancellableCoroutine { continuation ->
            apiService.getStoryReactions(storyId).enqueue(
                object : Callback<List<StoryReaction>> {
                    override fun onResponse(
                        call: Call<List<StoryReaction>>,
                        response: Response<List<StoryReaction>>
                    ) {
                        if (response.isSuccessful) {
                            continuation.resume(response.body() ?: emptyList())
                        } else {
                            continuation.resumeWithException(
                                Exception("Failed to fetch reactions: ${response.code()}")
                            )
                        }
                    }
                    
                    override fun onFailure(call: Call<List<StoryReaction>>, t: Throwable) {
                        continuation.resumeWithException(t)
                    }
                }
            )
        }
    }
    
    override suspend fun getReplies(storyId: String): List<StoryReply> {
        return suspendCancellableCoroutine { continuation ->
            apiService.getStoryReplies(storyId).enqueue(
                object : Callback<List<StoryReply>> {
                    override fun onResponse(
                        call: Call<List<StoryReply>>,
                        response: Response<List<StoryReply>>
                    ) {
                        if (response.isSuccessful) {
                            continuation.resume(response.body() ?: emptyList())
                        } else {
                            continuation.resumeWithException(
                                Exception("Failed to fetch replies: ${response.code()}")
                            )
                        }
                    }
                    
                    override fun onFailure(call: Call<List<StoryReply>>, t: Throwable) {
                        continuation.resumeWithException(t)
                    }
                }
            )
        }
    }
    
    override suspend fun addReaction(request: StoryReactionRequest): StoryReaction {
        return suspendCancellableCoroutine { continuation ->
            apiService.addStoryReaction(request).enqueue(
                object : Callback<StoryReaction> {
                    override fun onResponse(
                        call: Call<StoryReaction>,
                        response: Response<StoryReaction>
                    ) {
                        if (response.isSuccessful) {
                            continuation.resume(response.body() ?: throw Exception("Empty response"))
                        } else {
                            continuation.resumeWithException(
                                Exception("Failed to add reaction: ${response.code()}")
                            )
                        }
                    }
                    
                    override fun onFailure(call: Call<StoryReaction>, t: Throwable) {
                        continuation.resumeWithException(t)
                    }
                }
            )
        }
    }
    
    override suspend fun removeReaction(storyId: String, reactionId: String): Boolean {
        return suspendCancellableCoroutine { continuation ->
            apiService.removeStoryReaction(storyId, reactionId).enqueue(
                object : Callback<Void> {
                    override fun onResponse(call: Call<Void>, response: Response<Void>) {
                        continuation.resume(response.isSuccessful)
                    }
                    
                    override fun onFailure(call: Call<Void>, t: Throwable) {
                        continuation.resumeWithException(t)
                    }
                }
            )
        }
    }
    
    override suspend fun addReply(request: StoryReplyRequest): StoryReply {
        return suspendCancellableCoroutine { continuation ->
            apiService.addStoryReply(request).enqueue(
                object : Callback<StoryReply> {
                    override fun onResponse(
                        call: Call<StoryReply>,
                        response: Response<StoryReply>
                    ) {
                        if (response.isSuccessful) {
                            continuation.resume(response.body() ?: throw Exception("Empty response"))
                        } else {
                            continuation.resumeWithException(
                                Exception("Failed to add reply: ${response.code()}")
                            )
                        }
                    }
                    
                    override fun onFailure(call: Call<StoryReply>, t: Throwable) {
                        continuation.resumeWithException(t)
                    }
                }
            )
        }
    }
    
    override suspend fun deleteReply(storyId: String, replyId: String): Boolean {
        return suspendCancellableCoroutine { continuation ->
            apiService.deleteStoryReply(storyId, replyId).enqueue(
                object : Callback<Void> {
                    override fun onResponse(call: Call<Void>, response: Response<Void>) {
                        continuation.resume(response.isSuccessful)
                    }
                    
                    override fun onFailure(call: Call<Void>, t: Throwable) {
                        continuation.resumeWithException(t)
                    }
                }
            )
        }
    }
    
    override suspend fun recordView(request: ViewStoryRequest): Boolean {
        return suspendCancellableCoroutine { continuation ->
            apiService.recordStoryView(request).enqueue(
                object : Callback<Void> {
                    override fun onResponse(call: Call<Void>, response: Response<Void>) {
                        continuation.resume(response.isSuccessful)
                    }
                    
                    override fun onFailure(call: Call<Void>, t: Throwable) {
                        continuation.resumeWithException(t)
                    }
                }
            )
        }
    }
    
    override suspend fun getArchivedStories(userId: String): List<AdvancedStory> {
        return suspendCancellableCoroutine { continuation ->
            apiService.getArchivedStories(userId).enqueue(
                object : Callback<List<AdvancedStory>> {
                    override fun onResponse(
                        call: Call<List<AdvancedStory>>,
                        response: Response<List<AdvancedStory>>
                    ) {
                        if (response.isSuccessful) {
                            continuation.resume(response.body() ?: emptyList())
                        } else {
                            continuation.resumeWithException(
                                Exception("Failed to fetch archived stories: ${response.code()}")
                            )
                        }
                    }
                    
                    override fun onFailure(call: Call<List<AdvancedStory>>, t: Throwable) {
                        continuation.resumeWithException(t)
                    }
                }
            )
        }
    }
    
    override suspend fun getPinnedStories(userId: String): List<AdvancedStory> {
        return suspendCancellableCoroutine { continuation ->
            apiService.getPinnedStories(userId).enqueue(
                object : Callback<List<AdvancedStory>> {
                    override fun onResponse(
                        call: Call<List<AdvancedStory>>,
                        response: Response<List<AdvancedStory>>
                    ) {
                        if (response.isSuccessful) {
                            continuation.resume(response.body() ?: emptyList())
                        } else {
                            continuation.resumeWithException(
                                Exception("Failed to fetch pinned stories: ${response.code()}")
                            )
                        }
                    }
                    
                    override fun onFailure(call: Call<List<AdvancedStory>>, t: Throwable) {
                        continuation.resumeWithException(t)
                    }
                }
            )
        }
    }
}
