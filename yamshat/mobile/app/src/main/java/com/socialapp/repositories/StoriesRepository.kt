package com.socialapp.repositories

import com.socialapp.models.Story
import com.socialapp.network.ApiClient
import com.socialapp.network.SessionManager
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

class StoriesRepository {
    fun loadStories(onResult: (List<Story>) -> Unit) {
        ApiClient.api.getStories().enqueue(object : Callback<List<Story>> {
            override fun onResponse(call: Call<List<Story>>, response: Response<List<Story>>) {
                val remoteStories = response.body().orEmpty().filter { it.username.isNotBlank() }
                if (remoteStories.isNotEmpty()) {
                    onResult(remoteStories)
                } else {
                    onResult(fallbackStories())
                }
            }

            override fun onFailure(call: Call<List<Story>>, t: Throwable) {
                onResult(fallbackStories())
            }
        })
    }

    private fun fallbackStories(): List<Story> {
        val currentUser = SessionManager.getUsername().ifBlank { "You" }
        return listOf(
            Story(id = "me", username = currentUser, isSeen = false),
            Story(id = "sara", username = "Sara", isSeen = false),
            Story(id = "omar", username = "Omar", isSeen = true),
            Story(id = "noor", username = "Noor", isSeen = false),
        )
    }
}
