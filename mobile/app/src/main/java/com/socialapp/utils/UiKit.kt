package com.socialapp.utils

import android.animation.AnimatorSet
import android.animation.ObjectAnimator
import android.app.Activity
import android.content.res.ColorStateList
import android.graphics.drawable.Drawable
import android.view.View
import android.view.ViewGroup
import android.view.animation.AccelerateDecelerateInterpolator
import android.widget.Button
import android.widget.EditText
import android.widget.ImageButton
import android.widget.ProgressBar
import androidx.annotation.ColorRes
import androidx.annotation.DrawableRes
import androidx.appcompat.content.res.AppCompatResources
import androidx.core.content.ContextCompat
import androidx.core.view.children
import androidx.recyclerview.widget.RecyclerView
import com.google.android.material.card.MaterialCardView
import com.socialapp.R

object UiKit {
    fun prepareScreen(activity: Activity, root: View) {
        applyUnifiedStyles(root)
        runCatching { animateEntrance(root) }
    }

    fun setButtonLoading(button: Button, isLoading: Boolean, idleText: String, loadingText: String) {
        button.isEnabled = !isLoading
        button.alpha = if (isLoading) 0.82f else 1f
        button.text = if (isLoading) loadingText else idleText
    }

    fun setVisible(view: View, visible: Boolean) {
        if (visible && view.visibility != View.VISIBLE) {
            view.alpha = 0f
            view.visibility = View.VISIBLE
            view.animate().alpha(1f).setDuration(180L).start()
        } else if (!visible && view.visibility == View.VISIBLE) {
            view.animate().alpha(0f).setDuration(140L).withEndAction {
                view.visibility = View.GONE
                view.alpha = 1f
            }.start()
        }
    }

    fun styleDialogInput(editText: EditText) {
        editText.background = AppCompatResources.getDrawable(editText.context, R.drawable.bg_input)
        val padding = editText.context.resources.displayMetrics.density.times(16).toInt()
        editText.setPadding(padding, padding, padding, padding)
        editText.setTextColor(color(editText, R.color.text_primary))
        editText.setHintTextColor(color(editText, R.color.text_secondary))
    }

    fun animateListItem(view: View) {
        if (view.getTag(R.id.tag_ui_animated) == true) return
        view.setTag(R.id.tag_ui_animated, true)
        view.alpha = 0f
        view.translationY = 20f
        view.animate()
            .alpha(1f)
            .translationY(0f)
            .setDuration(180L)
            .setInterpolator(AccelerateDecelerateInterpolator())
            .start()
    }

    private fun animateEntrance(root: View) {
        root.alpha = 0f
        root.translationY = 14f
        root.animate()
            .alpha(1f)
            .translationY(0f)
            .setDuration(220L)
            .setInterpolator(AccelerateDecelerateInterpolator())
            .start()
    }

    private fun applyUnifiedStyles(view: View) {
        when (view) {
            is MaterialCardView -> {
                view.strokeColor = color(view, R.color.divider)
                view.strokeWidth = dp(view, 1)
                view.cardElevation = 0f
            }
            is ImageButton -> styleImageButton(view)
            is EditText -> {
                if ((view.id.takeIf { it != View.NO_ID }?.let { nameOf(view, it) } ?: "").contains("codeDigit", ignoreCase = true).not()) {
                    styleDialogInput(view)
                }
            }
            is ProgressBar -> {
                view.indeterminateTintList = ColorStateList.valueOf(color(view, R.color.primary))
            }
            is RecyclerView -> {
                view.clipToPadding = false
            }
        }
        if (view is ViewGroup) {
            view.children.forEach { child -> applyUnifiedStyles(child) }
        }
    }

    private fun styleImageButton(button: ImageButton) {
        button.background = AppCompatResources.getDrawable(button.context, R.drawable.bg_icon_button)
        button.imageTintList = ColorStateList.valueOf(color(button, R.color.text_primary))
        button.scaleType = ImageButton.ScaleType.CENTER_INSIDE
        val pad = dp(button, 10)
        button.setPadding(pad, pad, pad, pad)
    }

    private fun color(view: View, @ColorRes colorRes: Int): Int = ContextCompat.getColor(view.context, colorRes)

    private fun dp(view: View, value: Int): Int = (value * view.context.resources.displayMetrics.density).toInt()

    private fun nameOf(view: View, id: Int): String = runCatching { view.resources.getResourceEntryName(id) }.getOrDefault("")
}
