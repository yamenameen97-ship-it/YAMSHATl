package com.socialapp.utils

import android.content.Context
import android.net.Uri
import androidx.media3.common.C
import androidx.media3.common.MediaItem
import androidx.media3.datasource.DataSpec
import androidx.media3.datasource.DefaultHttpDataSource
import androidx.media3.datasource.cache.CacheDataSource
import androidx.media3.datasource.cache.CacheWriter
import androidx.media3.datasource.cache.LeastRecentlyUsedCacheEvictor
import androidx.media3.datasource.cache.SimpleCache
import androidx.media3.exoplayer.DefaultLoadControl
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.exoplayer.source.DefaultMediaSourceFactory
import java.io.File
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.Executors
import java.util.concurrent.Future

object ReelPlaybackManager {
    private const val CACHE_FOLDER = "reels_video_cache"
    private const val CACHE_SIZE_BYTES = 256L * 1024L * 1024L
    private const val PRELOAD_BYTES = 2L * 1024L * 1024L

    @Volatile
    private var cacheInstance: SimpleCache? = null

    private val preloadExecutor = Executors.newSingleThreadExecutor()
    private val preloadTasks = ConcurrentHashMap<String, Future<*>>()

    private fun cache(context: Context): SimpleCache {
        return cacheInstance ?: synchronized(this) {
            cacheInstance ?: SimpleCache(
                File(context.cacheDir, CACHE_FOLDER),
                LeastRecentlyUsedCacheEvictor(CACHE_SIZE_BYTES),
            ).also { cacheInstance = it }
        }
    }

    private fun upstreamFactory(): DefaultHttpDataSource.Factory {
        return DefaultHttpDataSource.Factory()
            .setAllowCrossProtocolRedirects(true)
            .setConnectTimeoutMs(12_000)
            .setReadTimeoutMs(20_000)
    }

    private fun cacheDataSourceFactory(context: Context): CacheDataSource.Factory {
        return CacheDataSource.Factory()
            .setCache(cache(context.applicationContext))
            .setUpstreamDataSourceFactory(upstreamFactory())
            .setFlags(CacheDataSource.FLAG_IGNORE_CACHE_ON_ERROR)
    }

    fun mediaItem(url: String): MediaItem = MediaItem.fromUri(url)

    fun buildPlayer(context: Context): ExoPlayer {
        val appContext = context.applicationContext
        val loadControl = DefaultLoadControl.Builder()
            .setBufferDurationsMs(
                15_000,
                50_000,
                1_000,
                2_000,
            )
            .build()

        return ExoPlayer.Builder(appContext)
            .setLoadControl(loadControl)
            .setMediaSourceFactory(DefaultMediaSourceFactory(cacheDataSourceFactory(appContext)))
            .build()
            .apply {
                repeatMode = ExoPlayer.REPEAT_MODE_ONE
                videoScalingMode = C.VIDEO_SCALING_MODE_SCALE_TO_FIT_WITH_CROPPING
                playWhenReady = false
            }
    }

    fun preload(context: Context, url: String) {
        if (url.isBlank()) return
        if (preloadTasks[url]?.isDone == false) return

        val appContext = context.applicationContext
        preloadTasks[url] = preloadExecutor.submit {
            runCatching {
                val dataSource = cacheDataSourceFactory(appContext).createDataSource()
                val dataSpec = DataSpec.Builder()
                    .setUri(Uri.parse(url))
                    .setLength(PRELOAD_BYTES)
                    .build()
                CacheWriter(dataSource, dataSpec, ByteArray(DEFAULT_BUFFER_SIZE), null).cache()
            }
        }
    }

    fun cancelPreloads() {
        preloadTasks.values.forEach { it.cancel(true) }
        preloadTasks.clear()
    }
}
