package com.socialapp.domain.usecases

import com.socialapp.models.ApiMessage
import com.socialapp.repositories.MainRepository
import javax.inject.Inject

class LoginUseCase @Inject constructor(
    private val repository: MainRepository,
) {
    suspend operator fun invoke(credentials: Map<String, String>): ApiMessage {
        require(credentials["email"].orEmpty().isNotBlank() || credentials["username"].orEmpty().isNotBlank()) {
            "email or username is required"
        }
        require(credentials["password"].orEmpty().isNotBlank()) { "password is required" }
        return repository.login(credentials)
    }
}

class SendMessageUseCase @Inject constructor(
    private val repository: MainRepository,
) {
    suspend operator fun invoke(message: Map<String, Any?>): ApiMessage {
        require(message["message"]?.toString().orEmpty().isNotBlank() || message["media"]?.toString().orEmpty().isNotBlank()) {
            "message or media is required"
        }
        return repository.sendMessage(message)
    }
}

class UploadMediaUseCase @Inject constructor(
    private val repository: MainRepository,
) {
    suspend operator fun invoke(filePath: String): String {
        require(filePath.isNotBlank()) { "file path is required" }
        return filePath
    }
}

class CreateLiveRoomUseCase @Inject constructor(
    private val repository: MainRepository,
) {
    suspend operator fun invoke(roomDetails: Map<String, String>): ApiMessage {
        require(roomDetails["title"].orEmpty().isNotBlank()) { "title is required" }
        return repository.createLiveRoom(roomDetails)
    }
}
