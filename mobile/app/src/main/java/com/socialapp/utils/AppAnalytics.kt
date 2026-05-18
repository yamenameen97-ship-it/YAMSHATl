package com.socialapp.utils

import android.content.Context
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
