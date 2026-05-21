package com.socialapp.viewmodels

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.socialapp.repositories.MainRepository
import kotlinx.coroutines.launch
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject

@HiltViewModel
class MainViewModel @Inject constructor(
    private val repository: MainRepository
) : ViewModel() {

    private val _isLoggedIn = MutableLiveData<Boolean>()
    val isLoggedIn: LiveData<Boolean> = _isLoggedIn

    private val _navigationTarget = MutableLiveData<String>()
    val navigationTarget: LiveData<String> = _navigationTarget

    private val _networkStatus = MutableLiveData<Boolean>()
    val networkStatus: LiveData<Boolean> = _networkStatus

    init {
        checkLoginStatus()
    }

    fun checkLoginStatus() {
        _isLoggedIn.value = repository.hasActiveSession()
    }

    fun setNavigationTarget(target: String) {
        _navigationTarget.value = target
    }

    fun updateNetworkStatus(isConnected: Boolean) {
        _networkStatus.value = isConnected
    }

    fun syncPushToken(token: String) {
        viewModelScope.launch {
            repository.syncPushToken(token)
        }
    }
}
