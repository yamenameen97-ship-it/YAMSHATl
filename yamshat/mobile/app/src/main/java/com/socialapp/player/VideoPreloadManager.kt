package com.socialapp.player

import android.content.Context
import android.net.Uri
import androidx.media3.common.util.UnstableApi
import androidx.media3.datasource.DataSpec
import androidx.media3.datasource.cache.CacheWriter
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch

@UnstableApi
class VideoPreloadManager(private val context: Context) {
    private val scope = CoroutineScope(Dispatchers.IO)
    private val preloadJobs = mutableMapOf<String, Job>()

    fun preloadVideo(url: String) {
        if (preloadJobs.containsKey(url)) return

        val job = scope.launch {
            try {
                val cacheDataSource = VideoCacheManager.getCacheDataSourceFactory(context).createDataSource()
                val dataSpec = DataSpec(Uri.parse(url), 0, 500 * 1024) // Preload first 500KB
                
                val cacheWriter = CacheWriter(
                    cacheDataSource,
                    dataSpec,
                    null,
                    null
                )
                cacheWriter.cache()
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
        preloadJobs[url] = job
    }

    fun cancelPreload(url: String) {
        preloadJobs[url]?.cancel()
        preloadJobs.remove(url)
    }

    fun release() {
        preloadJobs.values.forEach { it.cancel() }
        preloadJobs.clear()
    }
}
