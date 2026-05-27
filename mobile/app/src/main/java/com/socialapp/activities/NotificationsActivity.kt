package com.socialapp.activities

import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import com.socialapp.databinding.ActivityNotificationsBinding
import com.socialapp.models.ApiMessage
import com.socialapp.models.NotificationItem
import com.socialapp.network.ApiClient
import com.socialapp.utils.AppAnalytics
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response
import com.socialapp.utils.UiKit

class NotificationsActivity : AppCompatActivity() {

    private lateinit var binding: ActivityNotificationsBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityNotificationsBinding.inflate(layoutInflater)
        setContentView(binding.root)
        UiKit.prepareScreen(this, binding.root)

        binding.recyclerNotif.layoutManager = LinearLayoutManager(this)
        binding.recyclerNotif.setHasFixedSize(true)
        loadNotifications()
    }

    override fun onResume() {
        super.onResume()
        AppAnalytics.trackScreen("notifications")
    }

    private fun loadNotifications() {
        ApiClient.api.getNotifications()
            .enqueue(object : Callback<List<NotificationItem>> {
                override fun onResponse(
                    call: Call<List<NotificationItem>>,
                    response: Response<List<NotificationItem>>
                ) {
                    binding.recyclerNotif.adapter = com.socialapp.adapters.NotificationAdapter(response.body().orEmpty()) { item ->
                        openNotification(item)
                    }
                }

                override fun onFailure(call: Call<List<NotificationItem>>, t: Throwable) {
                    Toast.makeText(this@NotificationsActivity, t.message ?: "Load failed", Toast.LENGTH_SHORT).show()
                }
            })
    }

    private fun openNotification(item: NotificationItem) {
        ApiClient.api.markNotificationRead(item.id).enqueue(object : Callback<ApiMessage> {
            override fun onResponse(call: Call<ApiMessage>, response: Response<ApiMessage>) = Unit
            override fun onFailure(call: Call<ApiMessage>, t: Throwable) = Unit
        })

        val sender = item.sender.ifBlank { item.from_user }
        if (sender.isNotBlank()) {
            startActivity(Intent(this, ChatActivity::class.java).putExtra("receiver", sender))
        }
    }
}
