package com.socialapp.signal

import android.content.Context
import org.whispersystems.libsignal.IdentityKey
import org.whispersystems.libsignal.IdentityKeyPair
import org.whispersystems.libsignal.InvalidKeyException
import org.whispersystems.libsignal.InvalidKeyIdException
import org.whispersystems.libsignal.SignalProtocolAddress
import org.whispersystems.libsignal.state.IdentityKeyStore
import org.whispersystems.libsignal.state.PreKeyRecord
import org.whispersystems.libsignal.state.PreKeyStore
import org.whispersystems.libsignal.state.SessionRecord
import org.whispersystems.libsignal.state.SessionStore
import org.whispersystems.libsignal.state.SignalProtocolStore
import org.whispersystems.libsignal.state.SignedPreKeyRecord
import org.whispersystems.libsignal.state.SignedPreKeyStore

class SignalStore(
    context: Context,
    namespace: String,
) : SignalProtocolStore {

    private val dbHelper = DBHelper(context.applicationContext)
    private val prefix = "signal_${namespace.ifBlank { "default" }.replace(Regex("[^A-Za-z0-9_.-]"), "_")}_"

    private fun key(name: String): String = prefix + name
    private fun sessionKey(address: SignalProtocolAddress): String = key("session_${address.name}_${address.deviceId}")
    private fun trustedIdentityKey(address: SignalProtocolAddress): String = key("identity_remote_${address.name}_${address.deviceId}")

    fun hasIdentity(): Boolean = dbHelper.exists(key("identity_key_pair"))

    fun saveIdentityKeyPair(identityKeyPair: IdentityKeyPair) {
        dbHelper.putBytes(key("identity_key_pair"), identityKeyPair.serialize())
    }

    fun saveRegistrationId(registrationId: Int) {
        dbHelper.putInt(key("registration_id"), registrationId)
    }

    override fun getIdentityKeyPair(): IdentityKeyPair {
        val data = dbHelper.getBytes(key("identity_key_pair"))
            ?: throw IllegalStateException("Signal identity key pair is missing")
        return IdentityKeyPair(data)
    }

    override fun getLocalRegistrationId(): Int {
        return dbHelper.getInt(key("registration_id"))
    }

    override fun saveIdentity(address: SignalProtocolAddress, identityKey: IdentityKey): Boolean {
        val existing = getIdentity(address)
        dbHelper.putBytes(trustedIdentityKey(address), identityKey.serialize())
        return existing != null && existing != identityKey
    }

    override fun isTrustedIdentity(
        address: SignalProtocolAddress,
        identityKey: IdentityKey,
        direction: IdentityKeyStore.Direction,
    ): Boolean {
        val existing = getIdentity(address)
        return existing == null || existing == identityKey
    }

    override fun getIdentity(address: SignalProtocolAddress): IdentityKey? {
        val data = dbHelper.getBytes(trustedIdentityKey(address)) ?: return null
        return try {
            IdentityKey(data, 0)
        } catch (_: InvalidKeyException) {
            null
        }
    }

    override fun loadPreKey(preKeyId: Int): PreKeyRecord {
        val data = dbHelper.getBytes(key("prekey_$preKeyId")) ?: throw InvalidKeyIdException("Missing prekey: $preKeyId")
        return PreKeyRecord(data)
    }

    override fun storePreKey(preKeyId: Int, record: PreKeyRecord) {
        dbHelper.putBytes(key("prekey_$preKeyId"), record.serialize())
    }

    override fun containsPreKey(preKeyId: Int): Boolean {
        return dbHelper.exists(key("prekey_$preKeyId"))
    }

    override fun removePreKey(preKeyId: Int) {
        dbHelper.delete(key("prekey_$preKeyId"))
    }

    override fun loadSignedPreKey(signedPreKeyId: Int): SignedPreKeyRecord {
        val data = dbHelper.getBytes(key("signed_prekey_$signedPreKeyId"))
            ?: throw InvalidKeyIdException("Missing signed prekey: $signedPreKeyId")
        return SignedPreKeyRecord(data)
    }

    override fun loadSignedPreKeys(): MutableList<SignedPreKeyRecord> {
        return dbHelper.getAllBytes(key("signed_prekey_"))
            .map { SignedPreKeyRecord(it) }
            .toMutableList()
    }

    override fun storeSignedPreKey(signedPreKeyId: Int, record: SignedPreKeyRecord) {
        dbHelper.putBytes(key("signed_prekey_$signedPreKeyId"), record.serialize())
    }

    override fun containsSignedPreKey(signedPreKeyId: Int): Boolean {
        return dbHelper.exists(key("signed_prekey_$signedPreKeyId"))
    }

    override fun removeSignedPreKey(signedPreKeyId: Int) {
        dbHelper.delete(key("signed_prekey_$signedPreKeyId"))
    }

    override fun loadSession(address: SignalProtocolAddress): SessionRecord {
        val data = dbHelper.getBytes(sessionKey(address)) ?: return SessionRecord()
        return SessionRecord(data)
    }

    override fun getSubDeviceSessions(name: String): MutableList<Int> {
        val prefixValue = key("session_${name}_")
        return dbHelper.getKeys(prefixValue)
            .mapNotNull { it.substringAfterLast('_').toIntOrNull() }
            .distinct()
            .sorted()
            .toMutableList()
    }

    override fun storeSession(address: SignalProtocolAddress, record: SessionRecord) {
        dbHelper.putBytes(sessionKey(address), record.serialize())
    }

    override fun containsSession(address: SignalProtocolAddress): Boolean {
        return dbHelper.exists(sessionKey(address))
    }

    override fun deleteSession(address: SignalProtocolAddress) {
        dbHelper.delete(sessionKey(address))
    }

    override fun deleteAllSessions(name: String) {
        dbHelper.deletePrefix(key("session_${name}_"))
    }
}
