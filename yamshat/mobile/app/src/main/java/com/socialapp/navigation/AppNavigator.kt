package com.socialapp.navigation

import android.content.Context
import android.content.Intent
import android.net.Uri
import com.socialapp.activities.*

class AppNavigator(private val context: Context) {

    fun navigateToHome() {
        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        context.startActivity(intent)
    }

    fun navigateToChat(chatId: String? = null) {
        val intent = Intent(context, ChatActivity::class.java).apply {
            putExtra("CHAT_ID", chatId)
        }
        context.startActivity(intent)
    }

    fun navigateToProfile(userId: String) {
        val intent = Intent(context, ProfileActivity::class.java).apply {
            putExtra("USER_ID", userId)
        }
        context.startActivity(intent)
    }

    fun handleDeepLink(uri: Uri) {
        // Example: yamshat://profile/123 or yamshat://chat/456
        val pathSegments = uri.pathSegments
        when (uri.host) {
            "profile" -> if (pathSegments.isNotEmpty()) navigateToProfile(pathSegments[0])
            "chat" -> if (pathSegments.isNotEmpty()) navigateToChat(pathSegments[0])
            else -> navigateToHome()
        }
    }

    fun navigateToLogin() {
        val intent = Intent(context, LoginActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        context.startActivity(intent)
    }
}
