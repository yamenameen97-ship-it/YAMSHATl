package com.socialapp.activities

import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.RecyclerView
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
    private val pageCallback = object : ViewPager2.OnPageChangeCallback() {
        override fun onPageSelected(position: Int) {
            reelsAdapter?.playVideo(position)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityReelsBinding.inflate(layoutInflater)
        setContentView(binding.root)

        configurePager()
        loadReels()
    }

    override fun onResume() {
        super.onResume()
        AppAnalytics.trackScreen("reels")
        reelsAdapter?.resumeActive()
    }

    override fun onPause() {
        reelsAdapter?.pauseAll()
        super.onPause()
    }

    override fun onDestroy() {
        binding.viewPager.unregisterOnPageChangeCallback(pageCallback)
        reelsAdapter?.releaseAll()
        super.onDestroy()
    }

    private fun configurePager() {
        binding.viewPager.offscreenPageLimit = 2
        binding.viewPager.registerOnPageChangeCallback(pageCallback)
        (binding.viewPager.getChildAt(0) as? RecyclerView)?.apply {
            overScrollMode = RecyclerView.OVER_SCROLL_NEVER
            itemAnimator = null
            setItemViewCacheSize(3)
        }
        binding.viewPager.setPageTransformer { page, position ->
            page.alpha = 1f - (kotlin.math.abs(position) * 0.08f).coerceAtMost(0.08f)
            page.scaleY = 1f - (kotlin.math.abs(position) * 0.015f).coerceAtMost(0.015f)
        }
    }

    private fun loadReels() {
        ApiClient.api.getReels()
            .enqueue(object : Callback<List<Reel>> {
                override fun onResponse(
                    call: Call<List<Reel>>,
                    response: Response<List<Reel>>,
                ) {
                    val reels = response.body().orEmpty()
                    if (reels.isEmpty()) {
                        Toast.makeText(this@ReelsActivity, "مفيش ريلز متاحة دلوقتي", Toast.LENGTH_SHORT).show()
                        return
                    }

                    reelsAdapter = ReelsAdapter(reels)
                    binding.viewPager.adapter = reelsAdapter
                    binding.viewPager.post {
                        reelsAdapter?.playVideo(binding.viewPager.currentItem)
                    }
                }

                override fun onFailure(call: Call<List<Reel>>, t: Throwable) {
                    Toast.makeText(this@ReelsActivity, t.message ?: "فشل تحميل الريلز", Toast.LENGTH_SHORT).show()
                }
            })
    }
}
