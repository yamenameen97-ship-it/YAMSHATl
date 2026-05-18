package com.socialapp.signal

import android.content.Context
import android.util.Base64
import com.socialapp.models.ApiMessage
import com.socialapp.models.SignalKeyBundleResponse
import com.socialapp.models.SignalKeyUploadRequest
import com.socialapp.models.SignalPreKeyDto
import com.socialapp.network.ApiClient
import com.socialapp.network.SessionManager
import com.socialapp.utils.LocalMessageCache
import org.whispersystems.libsignal.IdentityKey
import org.whispersystems.libsignal.SignalProtocolAddress
import org.whispersystems.libsignal.SessionBuilder
import org.whispersystems.libsignal.SessionCipher
import org.whispersystems.libsignal.ecc.Curve
import org.whispersystems.libsignal.protocol.CiphertextMessage
import org.whispersystems.libsignal.protocol.PreKeySignalMessage
import org.whispersystems.libsignal.protocol.SignalMessage
import org.whispersystems.libsignal.state.PreKeyBundle
import org.whispersystems.libsignal.state.PreKeyRecord
import org.whispersystems.libsignal.state.SignedPreKeyRecord
import org.whispersystems.libsignal.util.KeyHelper
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

object SignalProtocolManager {
    private const val DEVICE_ID = 1
    private const val PREFIX = "SGv2"
    private const val PREKEY_START = 1
    private const val PREKEY_COUNT = 50
    private const val SIGNED_PREKEY_ID = 1

    private fun username(): String = SessionManager.getUsername().trim()

    private fun store(context: Context): SignalStore {
        return SignalStore(context.applicationContext, username())
    }

    private fun address(peer: String): SignalProtocolAddress {
        return SignalProtocolAddress(peer.trim(), DEVICE_ID)
    }

    fun isSignalEnvelope(value: String?): Boolean {
        return value?.startsWith("$PREFIX:") == true
    }

    fun ensureInitialized(
        context: Context,
        forceUpload: Boolean = false,
        callback: ((Boolean, String?) -> Unit)? = null,
    ) {
        val activeUser = username()
        if (activeUser.isBlank()) {
            callback?.invoke(false, "المستخدم الحالي غير معروف")
            return
        }

        val signalStore = store(context)
        if (!signalStore.hasIdentity()) {
            val identityKeyPair = KeyHelper.generateIdentityKeyPair()
            val registrationId = KeyHelper.generateRegistrationId(false)
            val preKeys = KeyHelper.generatePreKeys(PREKEY_START, PREKEY_COUNT)
            val signedPreKey = KeyHelper.generateSignedPreKey(identityKeyPair, SIGNED_PREKEY_ID)

            signalStore.saveIdentityKeyPair(identityKeyPair)
            signalStore.saveRegistrationId(registrationId)
            preKeys.forEach { signalStore.storePreKey(it.id, it) }
            signalStore.storeSignedPreKey(signedPreKey.id, signedPreKey)
        }

        if (!forceUpload) {
            callback?.invoke(true, null)
            uploadLocalKeys(context, null)
            return
        }

        uploadLocalKeys(context, callback)
    }

    private fun uploadLocalKeys(context: Context, callback: ((Boolean, String?) -> Unit)?) {
        val signalStore = store(context)
        val signedPreKey = signalStore.loadSignedPreKeys().maxByOrNull { it.id }
        if (signedPreKey == null) {
            callback?.invoke(false, "تعذر العثور على المفاتيح الموقعة")
            return
        }

        val preKeys = mutableListOf<SignalPreKeyDto>()
        for (id in PREKEY_START until PREKEY_START + PREKEY_COUNT) {
            if (signalStore.containsPreKey(id)) {
                val record = signalStore.loadPreKey(id)
                preKeys.add(
                    SignalPreKeyDto(
                        key_id = id,
                        public_key = Base64.encodeToString(record.keyPair.publicKey.serialize(), Base64.NO_WRAP),
                    )
                )
            }
        }

        val body = SignalKeyUploadRequest(
            registration_id = signalStore.getLocalRegistrationId(),
            device_id = DEVICE_ID,
            identity_key = Base64.encodeToString(signalStore.getIdentityKeyPair().publicKey.serialize(), Base64.NO_WRAP),
            signed_prekey_id = signedPreKey.id,
            signed_prekey = Base64.encodeToString(signedPreKey.keyPair.publicKey.serialize(), Base64.NO_WRAP),
            signed_prekey_signature = Base64.encodeToString(signedPreKey.signature, Base64.NO_WRAP),
            prekeys = preKeys,
        )

        ApiClient.api.uploadSignalKeys(body).enqueue(object : Callback<ApiMessage> {
            override fun onResponse(call: Call<ApiMessage>, response: Response<ApiMessage>) {
                if (response.isSuccessful) callback?.invoke(true, null)
                else callback?.invoke(false, response.body()?.message ?: "فشل رفع مفاتيح التشفير")
            }

            override fun onFailure(call: Call<ApiMessage>, t: Throwable) {
                callback?.invoke(false, t.message ?: "تعذر مزامنة مفاتيح التشفير")
            }
        })
    }

    fun ensureSession(
        context: Context,
        receiver: String,
        callback: (Boolean, String?) -> Unit,
    ) {
        val cleanReceiver = receiver.trim()
        if (cleanReceiver.isBlank()) {
            callback(false, "المستلم غير صالح")
            return
        }

        val signalStore = store(context)
        val remoteAddress = address(cleanReceiver)
        if (signalStore.containsSession(remoteAddress)) {
            callback(true, null)
            return
        }

        ApiClient.api.getSignalKeys(cleanReceiver).enqueue(object : Callback<SignalKeyBundleResponse> {
            override fun onResponse(call: Call<SignalKeyBundleResponse>, response: Response<SignalKeyBundleResponse>) {
                val body = response.body()
                if (!response.isSuccessful || body == null) {
                    callback(false, body?.message ?: "المستلم لم يفعل التشفير بعد")
                    return
                }
                val firstPreKey = body.prekeys.firstOrNull()
                if (body.identity_key.isBlank() || body.signed_prekey.isBlank() || body.signed_prekey_signature.isBlank() || firstPreKey == null) {
                    callback(false, "مفاتيح المستلم غير مكتملة")
                    return
                }

                runCatching {
                    val bundle = PreKeyBundle(
                        body.registration_id,
                        body.device_id,
                        firstPreKey.key_id,
                        Curve.decodePoint(Base64.decode(firstPreKey.public_key, Base64.NO_WRAP), 0),
                        body.signed_prekey_id,
                        Curve.decodePoint(Base64.decode(body.signed_prekey, Base64.NO_WRAP), 0),
                        Base64.decode(body.signed_prekey_signature, Base64.NO_WRAP),
                        IdentityKey(Base64.decode(body.identity_key, Base64.NO_WRAP), 0),
                    )
                    SessionBuilder(signalStore, remoteAddress).process(bundle)
                }.onSuccess {
                    callback(true, null)
                }.onFailure {
                    callback(false, it.message ?: "فشل إنشاء جلسة التشفير")
                }
            }

            override fun onFailure(call: Call<SignalKeyBundleResponse>, t: Throwable) {
                callback(false, t.message ?: "تعذر جلب مفاتيح المستلم")
            }
        })
    }

    fun encryptOutgoing(
        context: Context,
        receiver: String,
        plainText: String,
        callback: (String?, String?) -> Unit,
    ) {
        if (plainText.isEmpty()) {
            callback("", null)
            return
        }

        ensureSession(context, receiver) { ok, error ->
            if (!ok) {
                callback(null, error ?: "تعذر بدء جلسة التشفير")
                return@ensureSession
            }

            runCatching {
                val cipher = SessionCipher(store(context), address(receiver))
                val encrypted = cipher.encrypt(plainText.toByteArray(Charsets.UTF_8))
                val envelope = "$PREFIX:${encrypted.type}:${Base64.encodeToString(encrypted.serialize(), Base64.NO_WRAP)}"
                LocalMessageCache.save(context, envelope, plainText)
                envelope
            }.onSuccess {
                callback(it, null)
            }.onFailure {
                callback(null, it.message ?: "فشل تشفير الرسالة")
            }
        }
    }

    fun decryptIncoming(
        context: Context,
        sender: String,
        cipherText: String?,
    ): String {
        val payload = cipherText.orEmpty()
        if (!isSignalEnvelope(payload)) return payload

        if (sender.trim() == username()) {
            return LocalMessageCache.get(context, payload) ?: "🔐 رسالة مشفرة محفوظة محليًا فقط"
        }

        return runCatching {
            val parts = payload.split(":", limit = 3)
            val type = parts.getOrNull(1)?.toIntOrNull() ?: CiphertextMessage.PREKEY_TYPE
            val encoded = parts.getOrNull(2).orEmpty()
            val decoded = Base64.decode(encoded, Base64.NO_WRAP)
            val sessionCipher = SessionCipher(store(context), address(sender))
            val plainBytes = if (type == CiphertextMessage.PREKEY_TYPE) {
                sessionCipher.decrypt(PreKeySignalMessage(decoded))
            } else {
                sessionCipher.decrypt(SignalMessage(decoded))
            }
            String(plainBytes, Charsets.UTF_8)
        }.getOrElse {
            "🔐 تعذر فك تشفير الرسالة"
        }
    }
}
