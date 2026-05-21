package com.socialapp.utils

import android.content.Context
import android.os.Bundle
import androidx.core.os.bundleOf
import com.google.firebase.analytics.FirebaseAnalytics

object AppAnalytics {
    private var analytics: FirebaseAnalytics? = null

    fun init(context: Context) {
        analytics = FirebaseAnalytics.getInstance(context)
    }

    fun openApp() {
        analytics?.logEvent(FirebaseAnalytics.Event.APP_OPEN, null)
    }

    fun trackScreen(name: String) {
        analytics?.logEvent(
            FirebaseAnalytics.Event.SCREEN_VIEW,
            bundleOf(FirebaseAnalytics.Param.SCREEN_NAME to name)
        )
    }

    fun trackEvent(eventName: String, params: Map<String, Any?> = emptyMap()) {
        val bundle = Bundle().apply {
            params.forEach { (key, value) ->
                when (value) {
                    is String -> putString(key, value)
                    is Int -> putInt(key, value)
                    is Long -> putLong(key, value)
                    is Double -> putDouble(key, value)
                    is Boolean -> putBoolean(key, value)
                }
            }
        }
        analytics?.logEvent(eventName, bundle)
    }

    fun setUserProfile(userId: String, username: String) {
        analytics?.setUserId(userId)
        analytics?.setUserProperty("username", username)
    }

    fun trackUserFlow(step: String, status: String) {
        trackEvent("user_flow_step", mapOf(
            "step" to step,
            "status" to status
        ))
    }

    fun trackLike(postId: String) {
        analytics?.logEvent(
            "like_post",
            bundleOf("post_id" to postId)
        )
    }

    fun trackLogin(method: String) {
        analytics?.logEvent(
            FirebaseAnalytics.Event.LOGIN,
            bundleOf(FirebaseAnalytics.Param.METHOD to method)
        )
    }
}
