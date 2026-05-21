package com.socialapp.viewmodels

import androidx.arch.core.executor.testing.InstantTaskExecutorRule
import com.socialapp.repositories.MainRepository
import com.socialapp.testutils.getOrAwaitValue
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.mockito.kotlin.doReturn
import org.mockito.kotlin.mock

class MainViewModelTest {
    @get:Rule
    val instantTaskExecutorRule = InstantTaskExecutorRule()

    @Test
    fun checkLoginStatus_updatesStateFromRepository() {
        val repository = mock<MainRepository> {
            on { hasActiveSession() } doReturn true
        }
        val viewModel = MainViewModel(repository)

        assertEquals(true, viewModel.isLoggedIn.getOrAwaitValue())
    }

    @Test
    fun updateNetworkStatus_updatesLiveData() {
        val repository = mock<MainRepository> {
            on { hasActiveSession() } doReturn false
        }
        val viewModel = MainViewModel(repository)

        viewModel.updateNetworkStatus(true)

        assertEquals(true, viewModel.networkStatus.getOrAwaitValue())
    }
}
