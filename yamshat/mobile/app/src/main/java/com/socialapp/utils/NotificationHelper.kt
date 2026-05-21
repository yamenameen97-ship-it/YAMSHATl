package com.socialapp.utils

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import com.socialapp.R
import com.socialapp.activities.MainActivity
import com.socialapp.network.SessionManager

object NotificationHelper {
    const val CHANNEL_MESSAGES = "messages_channel"
    const val CHANNEL_SOCIAL = "social_channel"
    const val CHANNEL_LIVE = "live_channel"
    const val GROUP_KEY_MESSAGES = "com.socialapp.MESSAGES"

    fun ensureChannels(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            
            val channels = listOf(
                NotificationChannel(CHANNEL_MESSAGES, "Messages", NotificationManager.IMPORTANCE_HIGH),
                NotificationChannel(CHANNEL_SOCIAL, "Social Updates", NotificationManager.IMPORTANCE_DEFAULT),
                NotificationChannel(CHANNEL_LIVE, "Live Streams", NotificationManager.IMPORTANCE_HIGH)
            )
            manager.createNotificationChannels(channels)
        }
    }

    fun showNotification(context: Context, title: String, body: String, data: Map<String, String> = emptyMap()) {
        ensureChannels(context)
        val targetPath = data["path"]?.takeIf { it.isNotBlank() } ?: when (data["screen"]) {
            "chat" -> "/inbox"
            "notifications" -> "/notifications"
            "profile" -> data["username"]?.takeIf { it.isNotBlank() }?.let { "/profile/$it" } ?: "/profile"
            "live" -> "/live"
            "groups" -> "/groups"
            "users" -> "/users"
            else -> "/notifications"
        }
        val intent = Intent(context, MainActivity::class.java).apply {
            putExtra(MainActivity.EXTRA_TARGET_PATH, targetPath)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
        }

        val pendingIntent = PendingIntent.getActivity(
            context,
            System.currentTimeMillis().toInt(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
        ) {
            return
        }

        val unreadCount = SessionManager.getUnreadNotificationCount().coerceAtLeast(1)
        val channelId = when(data["type"]) {
            "message" -> CHANNEL_MESSAGES
            "live" -> CHANNEL_LIVE
            else -> CHANNEL_SOCIAL
        }

        val notification = NotificationCompat.Builder(context, channelId)
            .setSmallIcon(R.drawable.ic_notification) // Ensure this exists or use fallback
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setNumber(unreadCount)
            .setGroup(if (data["type"] == "message") GROUP_KEY_MESSAGES else null)
            .setBadgeIconType(NotificationCompat.BADGE_ICON_SMALL)
            .setContentIntent(pendingIntent)
            .build()

        NotificationManagerCompat.from(context).notify(data["id"]?.toIntOrNull() ?: System.currentTimeMillis().toInt(), notification)
    }

    fun incrementBadgeCount() {
        SessionManager.incrementUnreadNotificationCount()
    }

    fun resetBadgeCount(context: Context) {
        SessionManager.setUnreadNotificationCount(0)
        NotificationManagerCompat.from(context).cancelAll()
    }
}
