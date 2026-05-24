package com.socialapp.activities

import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.socialapp.databinding.ActivityGroupsBinding
import com.socialapp.network.ApiClient
import com.socialapp.utils.AppAnalytics
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

class GroupsActivity : AppCompatActivity() {

    private lateinit var binding: ActivityGroupsBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityGroupsBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.createGroupBtn.setOnClickListener {
            ApiClient.api.createGroup(
                mapOf("name" to binding.groupName.text.toString())
            ).enqueue(object : Callback<com.socialapp.models.ApiMessage> {
                override fun onResponse(
                    call: Call<com.socialapp.models.ApiMessage>,
                    response: Response<com.socialapp.models.ApiMessage>
                ) {
                    Toast.makeText(this@GroupsActivity, response.body()?.message ?: "تم الإنشاء", Toast.LENGTH_SHORT).show()
                }

                override fun onFailure(call: Call<com.socialapp.models.ApiMessage>, t: Throwable) {
                    Toast.makeText(this@GroupsActivity, t.message ?: "Create failed", Toast.LENGTH_SHORT).show()
                }
            })
        }
    }

    override fun onResume() {
        super.onResume()
        AppAnalytics.trackScreen("groups")
    }
}
