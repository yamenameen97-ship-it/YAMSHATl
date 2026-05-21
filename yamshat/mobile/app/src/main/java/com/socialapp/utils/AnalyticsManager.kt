package com.socialapp.utils

import android.content.Context
import android.os.Bundle
import com.google.firebase.analytics.FirebaseAnalytics

class AnalyticsManager(context: Context) {
    private val firebaseAnalytics = FirebaseAnalytics.getInstance(context)

    fun trackScreen(screenName: String) {
        val bundle = Bundle().apply {
            putString(FirebaseAnalytics.Param.SCREEN_NAME, screenName)
            putString(FirebaseAnalytics.Param.SCREEN_CLASS, screenName)
        }
        firebaseAnalytics.logEvent(FirebaseAnalytics.Event.SCREEN_VIEW, bundle)
    }

    fun trackEvent(eventName: String, params: Bundle? = null) {
        firebaseAnalytics.logEvent(eventName, params)
    }

    fun trackWatchTime(contentId: String, durationMs: Long) {
        val bundle = Bundle().apply {
            putString("content_id", contentId)
            putLong("duration_ms", durationMs)
        }
        firebaseAnalytics.logEvent("watch_time", bundle)
    }
}
