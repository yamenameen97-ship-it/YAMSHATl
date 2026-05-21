package com.socialapp.utils

import android.content.ComponentCallbacks2
import android.content.Context
import android.widget.ImageView
import coil.ImageLoader
import coil.decode.VideoFrameDecoder
import coil.disk.DiskCache
import coil.load
import coil.memory.MemoryCache
import coil.request.CachePolicy
import com.socialapp.R

object ImageLoader {

    private var instance: ImageLoader? = null

    fun init(context: Context): ImageLoader {
        if (instance == null) {
            instance = ImageLoader.Builder(context)
                .memoryCache {
                    MemoryCache.Builder(context)
                        .maxSizePercent(0.18)
                        .build()
                }
                .diskCache {
                    DiskCache.Builder()
                        .directory(context.cacheDir.resolve("image_cache"))
                        .maxSizePercent(0.03)
                        .build()
                }
                .components {
                    add(VideoFrameDecoder.Factory())
                }
                .crossfade(true)
                .respectCacheHeaders(false)
                .build()
        }
        return instance!!
    }

    fun trimMemory(level: Int) {
        when {
            level >= ComponentCallbacks2.TRIM_MEMORY_RUNNING_LOW -> instance?.memoryCache?.trimToSize(0)
            level >= ComponentCallbacks2.TRIM_MEMORY_BACKGROUND -> instance?.memoryCache?.trimToSize((instance?.memoryCache?.maxSize ?: 0L) / 2)
        }
    }

    fun loadImage(
        imageView: ImageView,
        url: String?,
        placeholder: Int = R.drawable.ic_placeholder,
        error: Int = R.drawable.ic_error,
    ) {
        imageView.load(url, init(imageView.context)) {
            placeholder(placeholder)
            error(error)
            memoryCachePolicy(CachePolicy.ENABLED)
            diskCachePolicy(CachePolicy.ENABLED)
        }
    }
}
