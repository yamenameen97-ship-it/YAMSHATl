package com.socialapp.viewmodels

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.socialapp.models.MessageItem
import com.socialapp.network.ApiClient
import com.socialapp.network.SessionManager
import com.socialapp.utils.ConversationCache
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ChatViewModel @Inject constructor() : ViewModel() {
    private val _messages = MutableLiveData<List<MessageItem>>()
    val messages: LiveData<List<MessageItem>> = _messages

    private val _isTyping = MutableLiveData<Boolean>()
    val isTyping: LiveData<Boolean> = _isTyping

    private val _presenceStatus = MutableLiveData<String>()
    val presenceStatus: LiveData<String> = _presenceStatus

    fun loadMessages(receiver: String) {
        viewModelScope.launch {
            ApiClient.api.getMessages(receiver).enqueue(object : retrofit2.Callback<List<MessageItem>> {
                override fun onResponse(call: retrofit2.Call<List<MessageItem>>, response: retrofit2.Response<List<MessageItem>>) {
                    response.body()?.let { _messages.postValue(it) }
                }
                override fun onFailure(call: retrofit2.Call<List<MessageItem>>, t: Throwable) {}
            })
        }
    }

    fun setTyping(typing: Boolean) {
        _isTyping.postValue(typing)
    }

    fun updatePresence(status: String) {
        _presenceStatus.postValue(status)
    }
}
