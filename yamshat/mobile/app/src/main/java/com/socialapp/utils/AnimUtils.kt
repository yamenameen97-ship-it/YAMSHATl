package com.socialapp.utils

import android.view.View
import android.view.animation.AccelerateDecelerateInterpolator
import android.view.animation.AlphaAnimation
import android.view.animation.ScaleAnimation

object AnimUtils {
    fun fadeIn(view: View, duration: Long = 300) {
        view.visibility = View.VISIBLE
        val anim = AlphaAnimation(0f, 1f)
        anim.duration = duration
        view.startAnimation(anim)
    }

    fun scaleUp(view: View, duration: Long = 200) {
        val anim = ScaleAnimation(
            0.8f, 1.0f, 0.8f, 1.0f,
            ScaleAnimation.RELATIVE_TO_SELF, 0.5f,
            ScaleAnimation.RELATIVE_TO_SELF, 0.5f
        )
        anim.duration = duration
        anim.interpolator = AccelerateDecelerateInterpolator()
        view.startAnimation(anim)
    }

    fun applyRipple(view: View) {
        // Ensure background has ripple effect
        view.isClickable = true
        view.isFocusable = true
    }
}
