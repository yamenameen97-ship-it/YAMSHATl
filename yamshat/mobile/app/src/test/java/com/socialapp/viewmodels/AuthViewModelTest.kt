package com.socialapp.viewmodels

import androidx.arch.core.executor.testing.InstantTaskExecutorRule
import com.socialapp.domain.usecases.LoginUseCase
import com.socialapp.models.ApiMessage
import com.socialapp.testutils.MainDispatcherRule
import com.socialapp.testutils.getOrAwaitValue
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.mockito.kotlin.any
import org.mockito.kotlin.doReturn
import org.mockito.kotlin.mock

@OptIn(ExperimentalCoroutinesApi::class)
class AuthViewModelTest {
    @get:Rule
    val instantTaskExecutorRule = InstantTaskExecutorRule()

    @get:Rule
    val mainDispatcherRule = MainDispatcherRule()

    @Test
    fun login_success_emitsSuccessState() = runTest {
        val loginUseCase = mock<LoginUseCase> {
            onBlocking { invoke(any()) } doReturn ApiMessage(ok = true, message = "ok")
        }
        val viewModel = AuthViewModel(loginUseCase)

        viewModel.login(mapOf("email" to "user@test.com", "password" to "123456"))
        advanceUntilIdle()

        val state = viewModel.authState.getOrAwaitValue()
        assertTrue(state is AuthViewModel.AuthState.Success)
    }
}
