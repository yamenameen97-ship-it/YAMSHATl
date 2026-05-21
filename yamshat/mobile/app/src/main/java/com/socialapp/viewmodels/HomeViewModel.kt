package com.socialapp.viewmodels

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.socialapp.models.Post
import com.socialapp.network.ApiClient
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.launch
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response
import javax.inject.Inject

data class FeedUiState(
    val posts: List<Post> = emptyList(),
    val page: Int = 1,
    val isInitialLoading: Boolean = false,
    val isAppending: Boolean = false,
    val showSkeleton: Boolean = false,
    val endReached: Boolean = false,
)

@HiltViewModel
class HomeViewModel @Inject constructor() : ViewModel() {
    private val _posts = MutableLiveData<List<Post>>(emptyList())
    val posts: LiveData<List<Post>> = _posts

    private val _isLoading = MutableLiveData(false)
    val isLoading: LiveData<Boolean> = _isLoading

    private val _uiState = MutableLiveData(FeedUiState(showSkeleton = true))
    val uiState: LiveData<FeedUiState> = _uiState

    fun fetchPosts(nextPage: Boolean = false) {
        val current = _uiState.value ?: FeedUiState(showSkeleton = true)
        if (current.isInitialLoading || current.isAppending || current.endReached) return

        val targetPage = if (nextPage) current.page + 1 else 1
        _uiState.value = current.copy(
            page = targetPage,
            isInitialLoading = !nextPage,
            isAppending = nextPage,
            showSkeleton = !nextPage,
        )
        _isLoading.value = true

        viewModelScope.launch {
            ApiClient.api.getPosts(targetPage).enqueue(object : Callback<List<Post>> {
                override fun onResponse(call: Call<List<Post>>, response: Response<List<Post>>) {
                    val incoming = response.body().orEmpty()
                    val merged = if (nextPage) current.posts + incoming else incoming
                    _posts.postValue(merged)
                    _uiState.postValue(
                        FeedUiState(
                            posts = merged,
                            page = targetPage,
                            endReached = incoming.isEmpty(),
                        )
                    )
                    _isLoading.postValue(false)
                }

                override fun onFailure(call: Call<List<Post>>, t: Throwable) {
                    _uiState.postValue(current.copy(isInitialLoading = false, isAppending = false, showSkeleton = false))
                    _isLoading.postValue(false)
                }
            })
        }
    }
}
