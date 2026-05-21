package com.socialapp.ui.components

import android.content.Context
import android.util.AttributeSet
import com.google.android.material.button.MaterialButton
import com.socialapp.R

class PrimaryButton @JvmOverloads constructor(
    context: Context, attrs: AttributeSet? = null, defStyleAttr: Int = com.google.android.material.R.attr.materialButtonStyle
) : MaterialButton(context, attrs, defStyleAttr) {

    init {
        // Apply design system defaults
        setBackgroundColor(context.getColor(R.color.design_primary))
        setTextColor(context.getColor(R.color.design_on_primary))
        cornerRadius = context.resources.getDimensionPixelSize(R.dimen.button_corner_radius)
        letterSpacing = 0.05f
    }
}
