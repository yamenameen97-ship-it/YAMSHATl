package com.socialapp.repositories

import android.util.Log
import com.socialapp.models.ApiMessage
import com.socialapp.models.GroupInfo
import com.socialapp.models.GroupMember
import com.socialapp.models.GroupMessage
import com.socialapp.network.ApiClient
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

/**
 * Repository لإدارة عمليات المجموعات
 */
class GroupRepository {
    private val apiService = ApiClient.api
    private val TAG = "GroupRepository"
    
    // ============ عمليات المجموعات الأساسية ============
    
    /**
     * جلب قائمة المجموعات
     */
    fun getGroups(
        onSuccess: (List<GroupInfo>) -> Unit,
        onError: (String) -> Unit
    ) {
        apiService.getGroups().enqueue(object : Callback<List<GroupInfo>> {
            override fun onResponse(call: Call<List<GroupInfo>>, response: Response<List<GroupInfo>>) {
                if (response.isSuccessful) {
                    response.body()?.let { groups ->
                        Log.d(TAG, "Groups fetched successfully: ${groups.size}")
                        onSuccess(groups)
                    } ?: onError("Empty response")
                } else {
                    onError("Error: ${response.code()} - ${response.message()}")
                }
            }
            
            override fun onFailure(call: Call<List<GroupInfo>>, t: Throwable) {
                Log.e(TAG, "Failed to fetch groups", t)
                onError(t.message ?: "Unknown error")
            }
        })
    }
    
    /**
     * إنشاء مجموعة جديدة
     */
    fun createGroup(
        name: String,
        description: String,
        category: String = "",
        onSuccess: (ApiMessage) -> Unit,
        onError: (String) -> Unit
    ) {
        val body: Map<String, Any?> = mapOf(
            "name" to name,
            "description" to description,
            "category" to category
        )
        
        apiService.createGroup(body).enqueue(object : Callback<ApiMessage> {
            override fun onResponse(call: Call<ApiMessage>, response: Response<ApiMessage>) {
                if (response.isSuccessful) {
                    response.body()?.let { message ->
                        Log.d(TAG, "Group created successfully")
                        onSuccess(message)
                    } ?: onError("Empty response")
                } else {
                    onError("Error: ${response.code()} - ${response.message()}")
                }
            }
            
            override fun onFailure(call: Call<ApiMessage>, t: Throwable) {
                Log.e(TAG, "Failed to create group", t)
                onError(t.message ?: "Unknown error")
            }
        })
    }
    
    /**
     * جلب تفاصيل المجموعة
     */
    fun getGroupInfo(
        groupId: Int,
        onSuccess: (GroupInfo) -> Unit,
        onError: (String) -> Unit
    ) {
        apiService.getGroupInfo(groupId).enqueue(object : Callback<GroupInfo> {
            override fun onResponse(call: Call<GroupInfo>, response: Response<GroupInfo>) {
                if (response.isSuccessful) {
                    response.body()?.let { group ->
                        Log.d(TAG, "Group info fetched: ${group.name}")
                        onSuccess(group)
                    } ?: onError("Empty response")
                } else {
                    onError("Error: ${response.code()} - ${response.message()}")
                }
            }
            
            override fun onFailure(call: Call<GroupInfo>, t: Throwable) {
                Log.e(TAG, "Failed to fetch group info", t)
                onError(t.message ?: "Unknown error")
            }
        })
    }
    
    /**
     * الانضمام للمجموعة
     */
    fun joinGroup(
        groupId: Int,
        onSuccess: (ApiMessage) -> Unit,
        onError: (String) -> Unit
    ) {
        apiService.joinGroup(groupId).enqueue(object : Callback<ApiMessage> {
            override fun onResponse(call: Call<ApiMessage>, response: Response<ApiMessage>) {
                if (response.isSuccessful) {
                    response.body()?.let { message ->
                        Log.d(TAG, "Joined group successfully")
                        onSuccess(message)
                    } ?: onError("Empty response")
                } else {
                    onError("Error: ${response.code()} - ${response.message()}")
                }
            }
            
            override fun onFailure(call: Call<ApiMessage>, t: Throwable) {
                Log.e(TAG, "Failed to join group", t)
                onError(t.message ?: "Unknown error")
            }
        })
    }
    
    /**
     * مغادرة المجموعة
     */
    fun leaveGroup(
        groupId: Int,
        onSuccess: (ApiMessage) -> Unit,
        onError: (String) -> Unit
    ) {
        apiService.leaveGroup(groupId).enqueue(object : Callback<ApiMessage> {
            override fun onResponse(call: Call<ApiMessage>, response: Response<ApiMessage>) {
                if (response.isSuccessful) {
                    response.body()?.let { message ->
                        Log.d(TAG, "Left group successfully")
                        onSuccess(message)
                    } ?: onError("Empty response")
                } else {
                    onError("Error: ${response.code()} - ${response.message()}")
                }
            }
            
            override fun onFailure(call: Call<ApiMessage>, t: Throwable) {
                Log.e(TAG, "Failed to leave group", t)
                onError(t.message ?: "Unknown error")
            }
        })
    }
    
    // ============ عمليات الأعضاء ============
    
    /**
     * جلب أعضاء المجموعة
     */
    fun getGroupMembers(
        groupId: Int,
        onSuccess: (List<GroupMember>) -> Unit,
        onError: (String) -> Unit
    ) {
        apiService.getGroupMembers(groupId).enqueue(object : Callback<List<GroupMember>> {
            override fun onResponse(call: Call<List<GroupMember>>, response: Response<List<GroupMember>>) {
                if (response.isSuccessful) {
                    response.body()?.let { members ->
                        Log.d(TAG, "Members fetched: ${members.size}")
                        onSuccess(members)
                    } ?: onError("Empty response")
                } else {
                    onError("Error: ${response.code()} - ${response.message()}")
                }
            }
            
            override fun onFailure(call: Call<List<GroupMember>>, t: Throwable) {
                Log.e(TAG, "Failed to fetch members", t)
                onError(t.message ?: "Unknown error")
            }
        })
    }
    
    /**
     * إزالة عضو من المجموعة
     */
    fun removeGroupMember(
        groupId: Int,
        username: String,
        onSuccess: (ApiMessage) -> Unit,
        onError: (String) -> Unit
    ) {
        apiService.removeGroupMember(groupId, username).enqueue(object : Callback<ApiMessage> {
            override fun onResponse(call: Call<ApiMessage>, response: Response<ApiMessage>) {
                if (response.isSuccessful) {
                    response.body()?.let { message ->
                        Log.d(TAG, "Member removed successfully")
                        onSuccess(message)
                    } ?: onError("Empty response")
                } else {
                    onError("Error: ${response.code()} - ${response.message()}")
                }
            }
            
            override fun onFailure(call: Call<ApiMessage>, t: Throwable) {
                Log.e(TAG, "Failed to remove member", t)
                onError(t.message ?: "Unknown error")
            }
        })
    }
    
    /**
     * ترقية عضو
     */
    fun promoteGroupMember(
        groupId: Int,
        username: String,
        role: String = "admin",
        onSuccess: (ApiMessage) -> Unit,
        onError: (String) -> Unit
    ) {
        apiService.promoteGroupMember(groupId, username, mapOf("role" to role)).enqueue(object : Callback<ApiMessage> {
            override fun onResponse(call: Call<ApiMessage>, response: Response<ApiMessage>) {
                if (response.isSuccessful) {
                    response.body()?.let { message ->
                        Log.d(TAG, "Member promoted successfully")
                        onSuccess(message)
                    } ?: onError("Empty response")
                } else {
                    onError("Error: ${response.code()} - ${response.message()}")
                }
            }
            
            override fun onFailure(call: Call<ApiMessage>, t: Throwable) {
                Log.e(TAG, "Failed to promote member", t)
                onError(t.message ?: "Unknown error")
            }
        })
    }
    
    // ============ عمليات الرسائل ============
    
    /**
     * إرسال رسالة إلى المجموعة
     */
    fun sendGroupMessage(
        groupId: Int,
        content: String,
        senderAvatar: String = "",
        senderDisplayName: String = "",
        onSuccess: (ApiMessage) -> Unit,
        onError: (String) -> Unit
    ) {
        val body = mapOf(
            "content" to content,
            "sender_avatar" to senderAvatar,
            "sender_display_name" to senderDisplayName
        )
        
        apiService.sendGroupMessage(groupId, body).enqueue(object : Callback<ApiMessage> {
            override fun onResponse(call: Call<ApiMessage>, response: Response<ApiMessage>) {
                if (response.isSuccessful) {
                    response.body()?.let { message ->
                        Log.d(TAG, "Message sent successfully")
                        onSuccess(message)
                    } ?: onError("Empty response")
                } else {
                    onError("Error: ${response.code()} - ${response.message()}")
                }
            }
            
            override fun onFailure(call: Call<ApiMessage>, t: Throwable) {
                Log.e(TAG, "Failed to send message", t)
                onError(t.message ?: "Unknown error")
            }
        })
    }
    
    /**
     * جلب رسائل المجموعة
     */
    fun getGroupMessages(
        groupId: Int,
        limit: Int = 50,
        onSuccess: (List<GroupMessage>) -> Unit,
        onError: (String) -> Unit
    ) {
        apiService.getGroupMessages(groupId, limit).enqueue(object : Callback<List<GroupMessage>> {
            override fun onResponse(call: Call<List<GroupMessage>>, response: Response<List<GroupMessage>>) {
                if (response.isSuccessful) {
                    response.body()?.let { messages ->
                        Log.d(TAG, "Messages fetched: ${messages.size}")
                        onSuccess(messages)
                    } ?: onError("Empty response")
                } else {
                    onError("Error: ${response.code()} - ${response.message()}")
                }
            }
            
            override fun onFailure(call: Call<List<GroupMessage>>, t: Throwable) {
                Log.e(TAG, "Failed to fetch messages", t)
                onError(t.message ?: "Unknown error")
            }
        })
    }
    
    /**
     * حذف رسالة
     */
    fun deleteGroupMessage(
        groupId: Int,
        messageId: String,
        onSuccess: (ApiMessage) -> Unit,
        onError: (String) -> Unit
    ) {
        apiService.deleteGroupMessage(groupId, messageId).enqueue(object : Callback<ApiMessage> {
            override fun onResponse(call: Call<ApiMessage>, response: Response<ApiMessage>) {
                if (response.isSuccessful) {
                    response.body()?.let { message ->
                        Log.d(TAG, "Message deleted successfully")
                        onSuccess(message)
                    } ?: onError("Empty response")
                } else {
                    onError("Error: ${response.code()} - ${response.message()}")
                }
            }
            
            override fun onFailure(call: Call<ApiMessage>, t: Throwable) {
                Log.e(TAG, "Failed to delete message", t)
                onError(t.message ?: "Unknown error")
            }
        })
    }
    
    // ============ عمليات التفاعلات ============
    
    /**
     * إضافة تفاعل على رسالة
     */
    fun addGroupMessageReaction(
        groupId: Int,
        messageId: String,
        emoji: String,
        onSuccess: (ApiMessage) -> Unit,
        onError: (String) -> Unit
    ) {
        val body = mapOf("emoji" to emoji)
        
        apiService.addGroupMessageReaction(groupId, messageId, body).enqueue(object : Callback<ApiMessage> {
            override fun onResponse(call: Call<ApiMessage>, response: Response<ApiMessage>) {
                if (response.isSuccessful) {
                    response.body()?.let { message ->
                        Log.d(TAG, "Reaction added successfully")
                        onSuccess(message)
                    } ?: onError("Empty response")
                } else {
                    onError("Error: ${response.code()} - ${response.message()}")
                }
            }
            
            override fun onFailure(call: Call<ApiMessage>, t: Throwable) {
                Log.e(TAG, "Failed to add reaction", t)
                onError(t.message ?: "Unknown error")
            }
        })
    }
    
    /**
     * تحديد الرسالة كمقروءة
     */
    fun markGroupMessageSeen(
        groupId: Int,
        messageId: String,
        onSuccess: (ApiMessage) -> Unit,
        onError: (String) -> Unit
    ) {
        apiService.markGroupMessageSeen(groupId, messageId).enqueue(object : Callback<ApiMessage> {
            override fun onResponse(call: Call<ApiMessage>, response: Response<ApiMessage>) {
                if (response.isSuccessful) {
                    response.body()?.let { message ->
                        Log.d(TAG, "Message marked as seen")
                        onSuccess(message)
                    } ?: onError("Empty response")
                } else {
                    onError("Error: ${response.code()} - ${response.message()}")
                }
            }
            
            override fun onFailure(call: Call<ApiMessage>, t: Throwable) {
                Log.e(TAG, "Failed to mark message as seen", t)
                onError(t.message ?: "Unknown error")
            }
        })
    }
    
    /**
     * إرسال مؤشر الكتابة
     */
    fun sendGroupTyping(
        groupId: Int,
        isTyping: Boolean,
        onSuccess: (ApiMessage) -> Unit,
        onError: (String) -> Unit
    ) {
        val body = mapOf("is_typing" to isTyping)
        
        apiService.groupTyping(groupId, body).enqueue(object : Callback<ApiMessage> {
            override fun onResponse(call: Call<ApiMessage>, response: Response<ApiMessage>) {
                if (response.isSuccessful) {
                    response.body()?.let { message ->
                        Log.d(TAG, "Typing indicator sent")
                        onSuccess(message)
                    } ?: onError("Empty response")
                } else {
                    onError("Error: ${response.code()} - ${response.message()}")
                }
            }
            
            override fun onFailure(call: Call<ApiMessage>, t: Throwable) {
                Log.e(TAG, "Failed to send typing indicator", t)
                onError(t.message ?: "Unknown error")
            }
        })
    }
}
