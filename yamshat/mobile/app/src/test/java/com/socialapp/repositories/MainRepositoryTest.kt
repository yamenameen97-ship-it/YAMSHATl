package com.socialapp.repositories

import com.socialapp.models.ApiMessage
import com.socialapp.network.ApiService
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.mockito.kotlin.doReturn
import org.mockito.kotlin.mock
import retrofit2.Call
import retrofit2.Response

@OptIn(ExperimentalCoroutinesApi::class)
class MainRepositoryTest {
    @Test
    fun syncPushToken_returnsTrue_whenApiSucceeds() = runTest {
        val call = mock<Call<ApiMessage>> {
            on { execute() } doReturn Response.success(ApiMessage(ok = true))
        }
        val apiService = mock<ApiService> {
            on { saveDeviceToken(mapOf("token" to "push-token")) } doReturn call
        }

        val repository = MainRepository(apiService)

        assertTrue(repository.syncPushToken("push-token"))
    }

    @Test
    fun sendMessage_returnsBody() = runTest {
        val expected = ApiMessage(ok = true, message = "sent")
        val call = mock<Call<ApiMessage>> {
            on { execute() } doReturn Response.success(expected)
        }
        val apiService = mock<ApiService> {
            on { sendMessage(mapOf("receiver" to "sara", "message" to "hi")) } doReturn call
        }

        val repository = MainRepository(apiService)
        val result = repository.sendMessage(mapOf("receiver" to "sara", "message" to "hi"))

        assertEquals("sent", result.message)
    }
}
