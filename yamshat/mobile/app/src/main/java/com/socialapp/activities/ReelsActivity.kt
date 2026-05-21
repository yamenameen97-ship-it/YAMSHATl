package com.socialapp.activities

import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.media3.common.util.UnstableApi
import androidx.viewpager2.widget.ViewPager2
import com.socialapp.adapters.ReelsAdapter
import com.socialapp.databinding.ActivityReelsBinding
import com.socialapp.models.Reel
import com.socialapp.network.ApiClient
import com.socialapp.reels.ReelsRecommendationEngine
import com.socialapp.utils.AppAnalytics
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

@UnstableApi
class ReelsActivity : AppCompatActivity() {

    private lateinit var binding: ActivityReelsBinding
    private lateinit var reelsAdapter: ReelsAdapter
    private val recommendationEngine = ReelsRecommendationEngine()
    private val watchedAuthors = mutableListOf<String>()
    private val watchedTags = mutableListOf<String>()
    private var pageCallback: ViewPager2.OnPageChangeCallback? = null
    private var currentPage = 1
    private var isLoading = false
    private var hasMore = true

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityReelsBinding.inflate(layoutInflater)
        setContentView(binding.root)
        reelsAdapter = ReelsAdapter(mutableListOf()) { reel -> updateRecommendationHint(reel) }
        binding.viewPager.adapter = reelsAdapter
        binding.viewPager.offscreenPageLimit = 1
        pageCallback = object : ViewPager2.OnPageChangeCallback() {
            override fun onPageSelected(position: Int) {
                reelsAdapter.playVideo(position)
                val current = reelsAdapter.currentItems().getOrNull(position) ?: return
                watchedAuthors.add(0, current.username)
                current.tags.reversed().forEach { watchedTags.add(0, it) }
                trimSignals()
                if (hasMore && !isLoading && position >= reelsAdapter.itemCount - 3) {
                    loadReels(currentPage + 1, append = true)
                }
            }
        }
        binding.viewPager.registerOnPageChangeCallback(pageCallback!!)
        loadReels(page = 1, append = false)
    }

    override fun onResume() {
        super.onResume()
        AppAnalytics.trackScreen("reels")
    }

    override fun onDestroy() {
        pageCallback?.let(binding.viewPager::unregisterOnPageChangeCallback)
        reelsAdapter.release()
        binding.viewPager.adapter = null
        super.onDestroy()
    }

    private fun loadReels(page: Int, append: Boolean) {
        if (isLoading || (!append && page != 1)) return
        isLoading = true
        ApiClient.api.getReels(page = page, limit = 10)
            .enqueue(object : Callback<List<Reel>> {
                override fun onResponse(call: Call<List<Reel>>, response: Response<List<Reel>>) {
                    isLoading = false
                    val reels = response.body().orEmpty()
                    if (reels.isEmpty()) {
                        hasMore = false
                        if (!append) {
                            Toast.makeText(this@ReelsActivity, "لا يوجد فيديوهات حالياً", Toast.LENGTH_SHORT).show()
                        }
                        return
                    }
                    currentPage = page
                    val ranked = recommendationEngine.rank(
                        reels = reels,
                        recentAuthors = watchedAuthors.take(6),
                        recentTags = watchedTags.take(8),
                    )
                    if (append) {
                        reelsAdapter.appendItems(ranked)
                    } else {
                        reelsAdapter = ReelsAdapter(ranked.toMutableList()) { reel -> updateRecommendationHint(reel) }
                        binding.viewPager.adapter = reelsAdapter
                    }
                    if (binding.viewPager.currentItem == 0 && !append) {
                        binding.viewPager.post { reelsAdapter.playVideo(0) }
                    }
                    updateRecommendationHint(reelsAdapter.currentItems().getOrNull(binding.viewPager.currentItem))
                }

                override fun onFailure(call: Call<List<Reel>>, t: Throwable) {
                    isLoading = false
                    Toast.makeText(this@ReelsActivity, t.message ?: "Load failed", Toast.LENGTH_SHORT).show()
                }
            })
    }

    private fun updateRecommendationHint(current: Reel?) {
        val suggestion = recommendationEngine.nextSuggestion(current, reelsAdapter.currentItems())
        binding.recommendationHint.text = if (suggestion == null) {
            "الاقتراحات ستظهر بعد مشاهدة عدة مقاطع"
        } else {
            val reason = suggestion.tags.firstOrNull()?.let { "لأنك تتابع $it" } ?: "مناسب لسجل المشاهدة"
            "التالي المقترح: @${suggestion.username} • $reason"
        }
    }

    private fun trimSignals() {
        while (watchedAuthors.size > 8) watchedAuthors.removeLast()
        while (watchedTags.size > 12) watchedTags.removeLast()
    }
}
