package com.socialapp.ui.components

import android.content.Context
import android.util.AttributeSet
import android.view.View
import android.view.animation.AlphaAnimation
import android.view.animation.Animation
import android.view.animation.LinearInterpolator
import android.widget.FrameLayout
import com.socialapp.R

class ShimmerView @JvmOverloads constructor(
    context: Context, attrs: AttributeSet? = null, defStyleAttr: Int = 0
) : FrameLayout(context, attrs, defStyleAttr) {

    init {
        // Simple shimmer effect using alpha animation
        val animation = AlphaAnimation(0.3f, 1.0f).apply {
            duration = 1000
            interpolator = LinearInterpolator()
            repeatCount = Animation.INFINITE
            repeatMode = Animation.REVERSE
        }
        startAnimation(animation)
        setBackgroundColor(context.getColor(R.color.shimmer_background))
    }

    fun stopShimmer() {
        clearAnimation()
        visibility = View.GONE
    }
}
