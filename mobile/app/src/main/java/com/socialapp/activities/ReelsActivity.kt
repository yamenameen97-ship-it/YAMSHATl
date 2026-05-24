package com.socialapp.activities

import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.viewpager2.widget.ViewPager2
import com.socialapp.adapters.ReelsAdapter
import com.socialapp.databinding.ActivityReelsBinding
import com.socialapp.models.Reel
import com.socialapp.network.ApiClient
import com.socialapp.utils.AppAnalytics
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

class ReelsActivity : AppCompatActivity() {

    private lateinit var binding: ActivityReelsBinding
    private var reelsAdapter: ReelsAdapter? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityReelsBinding.inflate(layoutInflater)
        setContentView(binding.root)
        binding.viewPager.offscreenPageLimit = 1
        loadReels()
    }

    override fun onResume() {
        super.onResume()
        AppAnalytics.trackScreen("reels")
    }

    private fun loadReels() {
        ApiClient.api.getReels()
            .enqueue(object : Callback<List<Reel>> {
                override fun onResponse(
                    call: Call<List<Reel>>,
                    response: Response<List<Reel>>
                ) {
                    val reels = response.body().orEmpty()
                    reelsAdapter = ReelsAdapter(reels)
                    binding.viewPager.adapter = reelsAdapter
                    binding.viewPager.registerOnPageChangeCallback(object : ViewPager2.OnPageChangeCallback() {
                        override fun onPageSelected(position: Int) {
                            reelsAdapter?.playVideo(position)
                        }
                    })
                }

                override fun onFailure(call: Call<List<Reel>>, t: Throwable) {
                    Toast.makeText(this@ReelsActivity, t.message ?: "Load failed", Toast.LENGTH_SHORT).show()
                }
            })
    }
}
