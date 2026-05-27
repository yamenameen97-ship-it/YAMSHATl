package com.socialapp.activities

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import com.socialapp.databinding.ActivityProfileBinding
import com.socialapp.network.ApiClient
import com.socialapp.network.SessionManager
import com.socialapp.utils.ActivitySecurity
import com.socialapp.utils.UiKit

class ProfileActivity : AppCompatActivity() {
    private lateinit var binding: ActivityProfileBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        ActivitySecurity.enableSecureWindow(this)
        binding = ActivityProfileBinding.inflate(layoutInflater)
        setContentView(binding.root)
        UiKit.prepareScreen(this, binding.root)

        binding.username.text = SessionManager.getUsername().ifBlank { "Guest" }
        binding.logoutBtn.setOnClickListener {
            runCatching { ApiClient.api.logout().enqueue(object : retrofit2.Callback<com.socialapp.models.ApiMessage> {
                override fun onResponse(call: retrofit2.Call<com.socialapp.models.ApiMessage>, response: retrofit2.Response<com.socialapp.models.ApiMessage>) = Unit
                override fun onFailure(call: retrofit2.Call<com.socialapp.models.ApiMessage>, t: Throwable) = Unit
            }) }
            SessionManager.clearSession(preserveOnboarding = true)
            startActivity(Intent(this, LoginActivity::class.java))
            finishAffinity()
        }
    }
}
