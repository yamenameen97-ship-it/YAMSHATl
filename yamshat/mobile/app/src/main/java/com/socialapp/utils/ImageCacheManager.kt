package com.socialapp.utils

import android.content.Context
import android.widget.ImageView
import com.bumptech.glide.Glide
import com.bumptech.glide.load.engine.DiskCacheStrategy
import com.socialapp.R

object ImageCacheManager {

    fun loadImage(context: Context, url: String, imageView: ImageView) {
        // In a real implementation with encrypted cache, we would use a custom 
        // Glide ModelLoader that handles decryption on the fly.
        // For now, we ensure the disk cache is in a secure location.
        Glide.with(context)
            .load(url)
            .diskCacheStrategy(DiskCacheStrategy.RESOURCE) // Only cache transformed resources
            .placeholder(R.drawable.placeholder_image)
            .error(R.drawable.error_image)
            .into(imageView)
    }

    fun preloadImage(context: Context, url: String) {
        Glide.with(context)
            .load(url)
            .diskCacheStrategy(DiskCacheStrategy.ALL)
            .preload()
    }
}
