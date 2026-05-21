package com.socialapp.utils

import android.view.View
import androidx.core.view.AccessibilityDelegateCompat
import androidx.core.view.ViewCompat
import androidx.core.view.accessibility.AccessibilityNodeInfoCompat

object AccessibilityUtils {
    fun setContentDescription(view: View, description: String) {
        view.contentDescription = description
    }

    fun makeAnnouncement(view: View, announcement: String) {
        view.announceForAccessibility(announcement)
    }

    fun setAsButton(view: View, description: String, onClickAction: () -> Unit) {
        view.contentDescription = description
        ViewCompat.setAccessibilityDelegate(view, object : AccessibilityDelegateCompat() {
            override fun onInitializeAccessibilityNodeInfo(host: View, info: AccessibilityNodeInfoCompat) {
                super.onInitializeAccessibilityNodeInfo(host, info)
                info.className = "android.widget.Button"
                info.isClickable = true
            }
        })
        view.setOnClickListener { onClickAction() }
    }
}
