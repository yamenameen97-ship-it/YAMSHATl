package com.socialapp.ui

import android.content.Context
import android.util.AttributeSet
import android.view.LayoutInflater
import android.widget.Button
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import com.socialapp.R

class ErrorStateView @JvmOverloads constructor(
    context: Context, attrs: AttributeSet? = null, defStyleAttr: Int = 0
) : LinearLayout(context, attrs, defStyleAttr) {

    private val imageView: ImageView
    private val textView: TextView
    private val retryButton: Button

    init {
        orientation = VERTICAL
        LayoutInflater.from(context).inflate(R.layout.view_error_state, this, true)
        imageView = findViewById(R.id.error_image)
        textView = findViewById(R.id.error_message)
        retryButton = findViewById(R.id.retry_button)
    }

    fun setState(message: String, onRetry: () -> Unit) {
        textView.text = message
        retryButton.setOnClickListener { onRetry() }
    }
    
    fun setError(error: com.socialapp.network.AppError, onRetry: () -> Unit) {
        textView.text = error.getDisplayMessage()
        if (error is com.socialapp.network.AppError.Network) {
            // imageView.setImageResource(R.drawable.ic_no_internet) // Assuming this exists
        }
        retryButton.setOnClickListener { onRetry() }
    }
}
