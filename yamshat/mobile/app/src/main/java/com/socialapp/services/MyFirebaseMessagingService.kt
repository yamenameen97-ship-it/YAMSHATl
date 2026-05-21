package com.socialapp.services

import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import android.util.Log

class MyFirebaseMessagingService : FirebaseMessagingService() {
    private lateinit var notificationHelper: NotificationHelper

    override fun onCreate() {
        super.onCreate()
        notificationHelper = NotificationHelper(applicationContext)
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)
        
        Log.d("FCM", "From: ${remoteMessage.from}")

        // Handle data payload
        remoteMessage.data.isNotEmpty().let {
            val title = remoteMessage.data["title"] ?: "New Message"
            val body = remoteMessage.data["body"] ?: ""
            val type = remoteMessage.data["type"]
            
            if (type == "chat") {
                val chatId = remoteMessage.data["chatId"] ?: "0"
                notificationHelper.showChatNotification(title, body, chatId)
            }
        }

        // Handle notification payload
        remoteMessage.notification?.let {
            notificationHelper.showChatNotification(it.title ?: "", it.body ?: "", "default")
        }
    }

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        // Send token to server
    }
}
