package com.socialapp.network

import com.socialapp.models.ApiMessage
import com.socialapp.models.MessageItem
import com.socialapp.models.NotificationItem
import com.socialapp.models.Post
import com.socialapp.models.Reel
import com.socialapp.models.SignalKeyBundleResponse
import com.socialapp.models.SignalKeyUploadRequest
import okhttp3.MultipartBody
import retrofit2.Call
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Multipart
import retrofit2.http.POST
import retrofit2.http.Part
import retrofit2.http.Path
import retrofit2.http.Query

interface ApiService {
    @POST("auth/register")
    fun register(@Body body: Map<String, String>): Call<ApiMessage>

    @POST("auth/login")
    fun login(@Body body: Map<String, String>): Call<ApiMessage>

    @POST("auth/verify-email")
    fun verifyEmail(@Body body: Map<String, String>): Call<ApiMessage>

    @POST("auth/resend-verification")
    fun resendVerification(@Body body: Map<String, String>): Call<ApiMessage>

    @POST("auth/forgot-password")
    fun forgotPassword(@Body body: Map<String, String>): Call<ApiMessage>

    @POST("auth/verify-reset-code")
    fun verifyResetCode(@Body body: Map<String, String>): Call<ApiMessage>

    @POST("auth/reset-password")
    fun resetPassword(@Body body: Map<String, String>): Call<ApiMessage>

    @POST("auth/refresh")
    fun refreshSession(@Body body: Map<String, String>): Call<ApiMessage>

    @POST("auth/logout")
    fun logout(@Body body: Map<String, String> = emptyMap()): Call<ApiMessage>

    @POST("users/fcm-token")
    fun saveDeviceToken(@Body body: Map<String, String>): Call<ApiMessage>

    @GET("posts")
    fun getPosts(@Query("mode") mode: String = "following", @Query("page") page: Int = 1): Call<com.socialapp.models.PostsResponse>

    @POST("posts")
    fun createPost(@Body body: Map<String, String?>): Call<ApiMessage>

    @POST("posts/{id}/like")
    fun likePost(@Path("id") id: Int): Call<ApiMessage>

    @POST("posts/{id}/comment")
    fun commentOnPost(@Path("id") id: Int, @Body body: Map<String, String>): Call<ApiMessage>

    @POST("send_message")
    fun sendMessage(@Body body: Map<String, @JvmSuppressWildcards Any?>): Call<ApiMessage>

    @POST("keys/upload")
    fun uploadSignalKeys(@Body body: SignalKeyUploadRequest): Call<ApiMessage>

    @GET("keys/{username}")
    fun getSignalKeys(@Path("username") username: String): Call<SignalKeyBundleResponse>

    @GET("get_messages")
    fun getMessages(@Query("receiver") receiver: String): Call<List<MessageItem>>

    @POST("delete_message")
    fun deleteMessage(@Body body: Map<String, @JvmSuppressWildcards Any>): Call<ApiMessage>

    @POST("edit_message")
    fun editMessage(@Body body: Map<String, @JvmSuppressWildcards Any>): Call<ApiMessage>

    // حذف الدردشة كاملة (لدي / للجميع)
    @POST("delete_conversation")
    fun deleteConversation(@Body body: Map<String, @JvmSuppressWildcards Any>): Call<ApiMessage>

    // حذف/تعديل المنشورات
    @retrofit2.http.DELETE("posts/{post_id}")
    fun deletePost(@retrofit2.http.Path("post_id") postId: String,
                   @retrofit2.http.Query("requester") requester: String? = null): Call<ApiMessage>

    @retrofit2.http.PUT("posts/{post_id}")
    fun editPost(@retrofit2.http.Path("post_id") postId: String,
                 @Body body: Map<String, @JvmSuppressWildcards Any>): Call<ApiMessage>

    @POST("message_seen")
    fun messageSeen(@Body body: Map<String, String>): Call<ApiMessage>

    @POST("typing")
    fun typing(@Body body: Map<String, @JvmSuppressWildcards Any>): Call<ApiMessage>

    @POST("update_online")
    fun updateOnline(@Body body: Map<String, Boolean>): Call<ApiMessage>

    @GET("presence/{username}")
    fun getPresence(@Path("username") username: String): Call<ApiMessage>

    @POST("create_call_token")
    fun createCallToken(@Body body: Map<String, String>): Call<ApiMessage>

    @GET("reels")
    fun getReels(): Call<List<Reel>>

    // حذف ريل (cascade_stories=true لحذف الستوري المرتبط تلقائياً)
    @retrofit2.http.DELETE("reels/{reel_id}")
    fun deleteReel(
        @retrofit2.http.Path("reel_id") reelId: String,
        @retrofit2.http.Query("cascade_stories") cascadeStories: Boolean = true
    ): Call<Map<String, @JvmSuppressWildcards Any>>

    @GET("notifications")
    fun getNotifications(): Call<List<NotificationItem>>

    @POST("notifications/read/{id}")
    fun markNotificationRead(@Path("id") id: Int): Call<ApiMessage>

    @POST("create_group")
    fun createGroup(@Body body: Map<String, String>): Call<ApiMessage>

    @POST("track")
    fun track(@Body body: Map<String, String>): Call<ApiMessage>

    @POST("like")
    fun like(@Body body: Map<String, String>): Call<ApiMessage>

    @POST("comment")
    fun comment(@Body body: Map<String, String>): Call<ApiMessage>

    @POST("follow")
    fun follow(@Body body: Map<String, String>): Call<ApiMessage>

    @Multipart
    @POST("upload")
    fun uploadFile(@Part file: MultipartBody.Part): Call<Map<String, String>>

    @GET("groups")
    fun getGroups(): Call<List<com.socialapp.models.GroupInfo>>

    @GET("group/{groupId}")
    fun getGroupInfo(@Path("groupId") groupId: Int): Call<com.socialapp.models.GroupInfo>

    @POST("group/send_message")
    fun sendGroupMessage(@Body body: Map<String, @JvmSuppressWildcards Any?>): Call<ApiMessage>

    @GET("group/{groupId}/messages")
    fun getGroupMessages(@Path("groupId") groupId: Int, @Query("limit") limit: Int = 50): Call<List<com.socialapp.models.GroupMessage>>

    @POST("group/{groupId}/message/{messageId}/delete")
    fun deleteGroupMessage(@Path("groupId") groupId: Int, @Path("messageId") messageId: Int): Call<ApiMessage>

    @POST("group/{groupId}/message/{messageId}/reaction")
    fun addGroupMessageReaction(@Path("groupId") groupId: Int, @Path("messageId") messageId: Int, @Body body: Map<String, String>): Call<ApiMessage>

    @POST("group/{groupId}/message/{messageId}/seen")
    fun markGroupMessageSeen(@Path("groupId") groupId: Int, @Path("messageId") messageId: Int): Call<ApiMessage>

    @POST("group/{groupId}/join")
    fun joinGroup(@Path("groupId") groupId: Int): Call<ApiMessage>

    @POST("group/{groupId}/leave")
    fun leaveGroup(@Path("groupId") groupId: Int): Call<ApiMessage>

    @GET("group/{groupId}/members")
    fun getGroupMembers(@Path("groupId") groupId: Int): Call<List<com.socialapp.models.GroupMember>>

    @POST("group/{groupId}/member/{username}/remove")
    fun removeGroupMember(@Path("groupId") groupId: Int, @Path("username") username: String): Call<ApiMessage>

    @POST("group/{groupId}/member/{username}/promote")
    fun promoteGroupMember(@Path("groupId") groupId: Int, @Path("username") username: String): Call<ApiMessage>

    @POST("group/{groupId}/typing")
    fun groupTyping(@Path("groupId") groupId: Int, @Body body: Map<String, @JvmSuppressWildcards Any>): Call<ApiMessage>
}
