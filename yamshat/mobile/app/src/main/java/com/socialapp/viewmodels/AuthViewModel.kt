package com.socialapp.viewmodels

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.socialapp.domain.usecases.LoginUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class AuthViewModel @Inject constructor(
    private val loginUseCase: LoginUseCase
) : ViewModel() {

    private val _authState = MutableLiveData<AuthState>()
    val authState: LiveData<AuthState> = _authState

    fun login(credentials: Map<String, String>) {
        _authState.value = AuthState.Loading
        viewModelScope.launch {
            try {
                loginUseCase(credentials)
                _authState.value = AuthState.Success("تم تسجيل الدخول بنجاح")
            } catch (e: Exception) {
                _authState.value = AuthState.Error(e.message ?: "فشل تسجيل الدخول")
            }
        }
    }

    sealed class AuthState {
        object Loading : AuthState()
        data class Success(val message: String) : AuthState()
        data class Error(val message: String) : AuthState()
    }
}
