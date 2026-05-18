package com.socialapp.models

data class SignalKeyUploadRequest(
    val registration_id: Int,
    val device_id: Int,
    val identity_key: String,
    val signed_prekey_id: Int,
    val signed_prekey: String,
    val signed_prekey_signature: String,
    val prekeys: List<SignalPreKeyDto>,
)
