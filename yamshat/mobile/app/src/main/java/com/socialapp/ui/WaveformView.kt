package com.socialapp.ui

import android.content.Context
import android.graphics.Canvas
import android.graphics.Paint
import android.util.AttributeSet
import android.view.View
import androidx.core.content.ContextCompat
import com.socialapp.R
import kotlin.math.max
import kotlin.random.Random

class WaveformView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
) : View(context, attrs) {

    private val activePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = ContextCompat.getColor(context, R.color.primary_soft)
    }
    private val inactivePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = ContextCompat.getColor(context, R.color.divider)
    }

    private var seed: Int = 0
    private var bars: List<Float> = buildBars(seed)
    private var progress: Float = 0f

    fun setSeed(seed: Int) {
        if (this.seed == seed) return
        this.seed = seed
        bars = buildBars(seed)
        invalidate()
    }

    fun setProgress(progress: Float) {
        this.progress = progress.coerceIn(0f, 1f)
        invalidate()
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        if (bars.isEmpty()) return
        val safeHeight = height.toFloat().coerceAtLeast(1f)
        val safeWidth = width.toFloat().coerceAtLeast(1f)
        val barWidth = safeWidth / (bars.size * 1.8f)
        val gap = barWidth * 0.8f
        val totalBarsWidth = (barWidth * bars.size) + (gap * (bars.size - 1))
        var x = max(0f, (safeWidth - totalBarsWidth) / 2f)
        val progressX = safeWidth * progress
        bars.forEach {
            val barHeight = safeHeight * (0.22f + it * 0.68f)
            val top = (safeHeight - barHeight) / 2f
            val paint = if (x <= progressX) activePaint else inactivePaint
            canvas.drawRoundRect(x, top, x + barWidth, top + barHeight, barWidth, barWidth, paint)
            x += barWidth + gap
        }
    }

    private fun buildBars(seed: Int): List<Float> {
        val random = Random(seed)
        return List(22) { 0.18f + random.nextFloat() * 0.82f }
    }
}
