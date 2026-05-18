package com.socialapp.models

data class SignalPreKeyDto(
    val key_id: Int,
    val public_key: String,
)

data class SignalKeyBundleResponse(
    val ok: Boolean? = null,
    val username: String? = null,
    val registration_id: Int = 0,
    val device_id: Int = 1,
    val identity_key: String = "",
    val signed_prekey_id: Int = 0,
    val signed_prekey: String = "",
    val signed_prekey_signature: String = "",
    val prekeys: List<SignalPreKeyDto> = emptyList(),
    val message: String? = null,
)
