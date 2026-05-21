package com.socialapp.network

import android.content.Context
import android.content.SharedPreferences
import android.util.Base64
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import org.json.JSONObject
import java.util.UUID
import java.util.concurrent.TimeUnit

object SessionManager {
    private const val PREF_NAME = "social_app_secure"
    private const val LEGACY_PREF_NAME = "social_app"
    private const val LEGACY_APP_PREF_NAME = "app"
    private const val KEY_ACCESS_TOKEN = "access_token"
    private const val KEY_REFRESH_TOKEN = "refresh_token"
    private const val KEY_ACCESS_EXPIRY = "access_expiry_ms"
    private const val KEY_REFRESH_EXPIRY = "refresh_expiry_ms"
    private const val KEY_USERNAME = "username"
    private const val KEY_EMAIL = "email"
    private const val KEY_ROLE = "role"
    private const val KEY_AVATAR = "avatar"
    private const val KEY_PERMISSIONS = "permissions"
    private const val KEY_PENDING_FCM = "pending_fcm_token"
    private const val KEY_FORCE_LOGOUT_REASON = "forced_logout_reason"
    private const val KEY_ONBOARDING_COMPLETED = "onboarding_completed"
    private const val KEY_UNREAD_NOTIFICATIONS = "unread_notifications"
    private const val KEY_SESSION_ID = "session_id"
    private const val KEY_AUTH_AT = "authenticated_at_ms"
    private const val KEY_LAST_ACTIVITY_AT = "last_activity_at_ms"
    private const val KEY_LAST_BACKGROUND_AT = "last_background_at_ms"

    private const val SESSION_IDLE_TIMEOUT_MS = 20 * 60 * 1000L
    private const val SESSION_BACKGROUND_TIMEOUT_MS = 15 * 60 * 1000L
    private const val SESSION_MAX_AUTH_AGE_MS = 14 * 24 * 60 * 60 * 1000L

    private lateinit var prefs: SharedPreferences
    private lateinit var appContext: Context

    fun init(context: Context) {
        appContext = context.applicationContext
        prefs = buildPreferences(appContext)
        migrateLegacyPreferences()
    }

    val applicationContext: Context?
        get() = if (::appContext.isInitialized) appContext else null

    fun hasToken(): Boolean = !getToken().isNullOrBlank()

    fun saveSession(
        accessToken: String?,
        refreshToken: String? = null,
        username: String? = null,
        email: String? = null,
        role: String? = null,
        permissions: List<String>? = null,
        avatar: String? = null,
        expiresInMinutes: Int? = null,
        refreshExpiresInDays: Int? = null,
    ) {
        val now = System.currentTimeMillis()
        val editor = prefs.edit()
        accessToken?.takeIf { it.isNotBlank() }?.let { editor.putString(KEY_ACCESS_TOKEN, it) } ?: editor.remove(KEY_ACCESS_TOKEN)
        refreshToken?.takeIf { it.isNotBlank() }?.let { editor.putString(KEY_REFRESH_TOKEN, it) } ?: Unit
        username?.let { editor.putString(KEY_USERNAME, it) }
        email?.let { editor.putString(KEY_EMAIL, it) }
        editor.putString(KEY_ROLE, role?.takeIf { it.isNotBlank() } ?: getRole())
        avatar?.let { editor.putString(KEY_AVATAR, it) }
        permissions?.let { editor.putStringSet(KEY_PERMISSIONS, it.filter { item -> item.isNotBlank() }.toSet()) }

        val accessExpiry = accessToken?.let { resolveTokenExpiry(it, expiresInMinutes?.let { minutes -> TimeUnit.MINUTES.toMillis(minutes.toLong()) }) }
        if (accessExpiry != null) editor.putLong(KEY_ACCESS_EXPIRY, accessExpiry) else editor.remove(KEY_ACCESS_EXPIRY)

        val refreshExpiry = refreshToken?.let { resolveTokenExpiry(it, refreshExpiresInDays?.let { days -> TimeUnit.DAYS.toMillis(days.toLong()) }) }
        if (refreshExpiry != null) editor.putLong(KEY_REFRESH_EXPIRY, refreshExpiry) else if (refreshToken == null) editor.remove(KEY_REFRESH_EXPIRY)

        editor.putString(KEY_SESSION_ID, UUID.randomUUID().toString())
        editor.putLong(KEY_AUTH_AT, now)
        editor.putLong(KEY_LAST_ACTIVITY_AT, now)
        editor.remove(KEY_LAST_BACKGROUND_AT)
        editor.remove(KEY_FORCE_LOGOUT_REASON)
        editor.apply()
    }

    fun saveToken(token: String?) {
        saveSession(
            accessToken = token,
            refreshToken = getRefreshToken(),
            username = getUsername(),
            email = getEmail(),
            role = getRole(),
            permissions = getPermissions(),
            avatar = getAvatar(),
        )
    }

    fun getToken(): String? = prefs.getString(KEY_ACCESS_TOKEN, null)

    fun getRefreshToken(): String? = prefs.getString(KEY_REFRESH_TOKEN, null)

    fun saveUsername(username: String) {
        prefs.edit().putString(KEY_USERNAME, username).apply()
    }

    fun getUsername(): String = prefs.getString(KEY_USERNAME, "") ?: ""

    fun saveEmail(email: String?) {
        prefs.edit().putString(KEY_EMAIL, email ?: "").apply()
    }

    fun getEmail(): String = prefs.getString(KEY_EMAIL, "") ?: ""

    fun saveAvatar(avatar: String?) {
        prefs.edit().putString(KEY_AVATAR, avatar ?: "").apply()
    }

    fun getAvatar(): String = prefs.getString(KEY_AVATAR, "") ?: ""

    fun saveRole(role: String?) {
        prefs.edit().putString(KEY_ROLE, role?.takeIf { it.isNotBlank() } ?: "user").apply()
    }

    fun getRole(): String = prefs.getString(KEY_ROLE, "user") ?: "user"

    fun savePermissions(permissions: List<String>?) {
        prefs.edit().putStringSet(KEY_PERMISSIONS, permissions.orEmpty().filter { it.isNotBlank() }.toSet()).apply()
    }

    fun getPermissions(): List<String> = prefs.getStringSet(KEY_PERMISSIONS, emptySet())?.toList()?.sorted() ?: emptyList()

    fun getSessionId(): String = prefs.getString(KEY_SESSION_ID, "") ?: ""

    fun isAccessTokenExpired(skewSeconds: Long = 45L): Boolean {
        val expiry = prefs.getLong(KEY_ACCESS_EXPIRY, 0L)
        if (expiry <= 0L) return false
        return System.currentTimeMillis() + TimeUnit.SECONDS.toMillis(skewSeconds) >= expiry
    }

    fun isRefreshTokenExpired(skewSeconds: Long = 60L): Boolean {
        val expiry = prefs.getLong(KEY_REFRESH_EXPIRY, 0L)
        if (expiry <= 0L) return false
        return System.currentTimeMillis() + TimeUnit.SECONDS.toMillis(skewSeconds) >= expiry
    }

    fun canRefreshSession(): Boolean = !getRefreshToken().isNullOrBlank() && !isRefreshTokenExpired()

    fun savePendingFcmToken(token: String) {
        prefs.edit().putString(KEY_PENDING_FCM, token).apply()
    }

    fun getPendingFcmToken(): String? = prefs.getString(KEY_PENDING_FCM, null)

    fun clearPendingFcmToken() {
        prefs.edit().remove(KEY_PENDING_FCM).apply()
    }

    fun markForcedLogout(reason: String) {
        prefs.edit().putString(KEY_FORCE_LOGOUT_REASON, reason).apply()
    }

    fun consumeForcedLogoutReason(): String? {
        val reason = prefs.getString(KEY_FORCE_LOGOUT_REASON, null)
        prefs.edit().remove(KEY_FORCE_LOGOUT_REASON).apply()
        return reason
    }

    fun isOnboardingCompleted(): Boolean = prefs.getBoolean(KEY_ONBOARDING_COMPLETED, false)

    fun setOnboardingCompleted(completed: Boolean) {
        prefs.edit().putBoolean(KEY_ONBOARDING_COMPLETED, completed).apply()
    }

    fun getUnreadNotificationCount(): Int = prefs.getInt(KEY_UNREAD_NOTIFICATIONS, 0)

    fun setUnreadNotificationCount(count: Int) {
        prefs.edit().putInt(KEY_UNREAD_NOTIFICATIONS, count.coerceAtLeast(0)).apply()
    }

    fun incrementUnreadNotificationCount() {
        setUnreadNotificationCount(getUnreadNotificationCount() + 1)
    }

    fun recordUserPresence() {
        if (!hasToken()) return
        prefs.edit()
            .putLong(KEY_LAST_ACTIVITY_AT, System.currentTimeMillis())
            .remove(KEY_LAST_BACKGROUND_AT)
            .apply()
    }

    fun markAppBackgrounded() {
        if (!hasToken()) return
        prefs.edit().putLong(KEY_LAST_BACKGROUND_AT, System.currentTimeMillis()).apply()
    }

    fun isSessionHardenedExpired(now: Long = System.currentTimeMillis()): Boolean {
        if (!hasToken()) return false
        val authAt = prefs.getLong(KEY_AUTH_AT, 0L)
        if (authAt > 0L && now - authAt > SESSION_MAX_AUTH_AGE_MS) return true

        val lastActivityAt = prefs.getLong(KEY_LAST_ACTIVITY_AT, 0L)
        if (lastActivityAt > 0L && now - lastActivityAt > SESSION_IDLE_TIMEOUT_MS) return true

        val backgroundAt = prefs.getLong(KEY_LAST_BACKGROUND_AT, 0L)
        if (backgroundAt > 0L && now - backgroundAt > SESSION_BACKGROUND_TIMEOUT_MS) return true

        return false
    }

    fun handleAppForegroundResume(): Boolean {
        if (!hasToken()) return false
        
        // Auto-refresh token if expired but refresh token is available
        if (isAccessTokenExpired() && canRefreshSession()) {
            // This will be handled by OkHttp Authenticator during next request,
            // but we can proactively trigger it or just return false to allow activity to proceed
            return false 
        }

        if (!isSessionHardenedExpired()) {
            recordUserPresence()
            return false
        }
        
        // Attempt session recovery if it's just a mild timeout
        val lastActivityAt = prefs.getLong(KEY_LAST_ACTIVITY_AT, 0L)
        if (System.currentTimeMillis() - lastActivityAt < SESSION_IDLE_TIMEOUT_MS * 1.5) {
            recordUserPresence()
            return false
        }

        markForcedLogout("تم قفل الجلسة لحمايتك بعد فترة خمول، سجّل دخولك تاني")
        clearSession(preserveOnboarding = true)
        return true
    }

    fun clearSession(preserveOnboarding: Boolean = true) {
        val onboardingCompleted = isOnboardingCompleted()
        val unreadCount = getUnreadNotificationCount()
        prefs.edit().clear().apply()
        if (preserveOnboarding) {
            prefs.edit()
                .putBoolean(KEY_ONBOARDING_COMPLETED, onboardingCompleted)
                .putInt(KEY_UNREAD_NOTIFICATIONS, unreadCount)
                .apply()
        }
    }

    private fun buildPreferences(context: Context): SharedPreferences {
        return runCatching {
            val masterKey = MasterKey.Builder(context)
                .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                .build()
            EncryptedSharedPreferences.create(
                context,
                PREF_NAME,
                masterKey,
                EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
            )
        }.getOrElse {
            context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
        }
    }

    private fun migrateLegacyPreferences() {
        if (prefs.contains(KEY_ACCESS_TOKEN) || prefs.contains(KEY_REFRESH_TOKEN)) return

        val legacySocial = appContext.getSharedPreferences(LEGACY_PREF_NAME, Context.MODE_PRIVATE)
        val legacyApp = appContext.getSharedPreferences(LEGACY_APP_PREF_NAME, Context.MODE_PRIVATE)
        val legacyToken = decodeLegacyToken(legacySocial.getString("token", null))
            ?: decodeLegacyToken(legacyApp.getString("token", null))

        val now = System.currentTimeMillis()
        val editor = prefs.edit()
        legacyToken?.let { editor.putString(KEY_ACCESS_TOKEN, it) }
        legacySocial.getString("username", null)?.let { editor.putString(KEY_USERNAME, it) }
        legacyApp.getString("username", null)?.let { editor.putString(KEY_USERNAME, it) }
        legacySocial.getString("email", null)?.let { editor.putString(KEY_EMAIL, it) }
        legacySocial.getString("role", null)?.let { editor.putString(KEY_ROLE, it) }
        legacySocial.getStringSet("permissions", emptySet())?.let { editor.putStringSet(KEY_PERMISSIONS, it) }
        legacyApp.getString("pending_fcm_token", null)?.let { editor.putString(KEY_PENDING_FCM, it) }
        editor.putString(KEY_SESSION_ID, UUID.randomUUID().toString())
        editor.putLong(KEY_AUTH_AT, now)
        editor.putLong(KEY_LAST_ACTIVITY_AT, now)
        editor.apply()

        legacyToken?.let { token ->
            val expiry = resolveTokenExpiry(token, null)
            if (expiry != null) prefs.edit().putLong(KEY_ACCESS_EXPIRY, expiry).apply()
        }
    }

    private fun decodeLegacyToken(encoded: String?): String? {
        if (encoded.isNullOrBlank()) return null
        return runCatching { String(Base64.decode(encoded, Base64.DEFAULT)) }.getOrNull() ?: encoded
    }

    private fun resolveTokenExpiry(token: String, fallbackDurationMs: Long?): Long? {
        decodeJwtExpiry(token)?.let { return it }
        return fallbackDurationMs?.let { System.currentTimeMillis() + it }
    }

    private fun decodeJwtExpiry(token: String?): Long? {
        if (token.isNullOrBlank() || token.count { it == '.' } < 2) return null
        val payloadPart = token.split('.')[1]
        return runCatching {
            val padded = payloadPart.padEnd(((payloadPart.length + 3) / 4) * 4, '=')
            val decoded = String(Base64.decode(padded, Base64.URL_SAFE or Base64.NO_WRAP or Base64.NO_PADDING))
            JSONObject(decoded).optLong("exp").takeIf { it > 0 }?.times(1000L)
        }.getOrNull()
    }
}
