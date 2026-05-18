package com.socialapp.services

import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.socialapp.utils.FirebaseBridge
import com.socialapp.utils.NotificationHelper

class MyFirebaseService : FirebaseMessagingService() {
    override fun onNewToken(token: String) {
        super.onNewToken(token)
        FirebaseBridge.syncProvidedToken(applicationContext, token)
    }

    override fun onMessageReceived(message: RemoteMessage) {
        super.onMessageReceived(message)
        val title = message.notification?.title ?: message.data["title"] ?: "Yamshat"
        val body = message.notification?.body ?: message.data["body"] ?: "لديك إشعار جديد"
        NotificationHelper.incrementBadgeCount()
        NotificationHelper.showNotification(applicationContext, title, body, message.data)
    }
}
