package com.socialapp.domain.usecases

import com.socialapp.models.ApiMessage
import com.socialapp.repositories.MainRepository
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertThrows
import org.junit.Test
import org.mockito.kotlin.any
import org.mockito.kotlin.doReturn
import org.mockito.kotlin.mock

@OptIn(ExperimentalCoroutinesApi::class)
class AuthUseCasesTest {
    @Test
    fun loginUseCase_requiresPassword() = runTest {
        val repository = mock<MainRepository>()
        val useCase = LoginUseCase(repository)

        assertThrows(IllegalArgumentException::class.java) {
            kotlinx.coroutines.runBlocking {
                useCase(mapOf("email" to "user@test.com"))
            }
        }
    }

    @Test
    fun sendMessageUseCase_returnsRepositoryResult() = runTest {
        val repository = mock<MainRepository> {
            onBlocking { sendMessage(any()) } doReturn ApiMessage(ok = true, message = "queued")
        }
        val useCase = SendMessageUseCase(repository)

        val result = useCase(mapOf("message" to "hello"))

        assertEquals("queued", result.message)
    }
}
