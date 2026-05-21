package com.socialapp.activities

import android.os.Bundle
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import com.socialapp.R
import com.socialapp.utils.NetworkMonitor
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
abstract class BaseActivity : AppCompatActivity() {

    private var errorView: View? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        checkSecurity()
    }

    override fun onResume() {
        super.onResume()
        checkSecurity()
    }

    private fun checkSecurity() {
        if (this is CrashActivity) return // Don't check on crash screen
        
        val threat = com.socialapp.utils.SecurityThreatDetector.detect(this)
        if (threat != null) {
            val intent = android.content.Intent(this, CrashActivity::class.java).apply {
                putExtra("error_message", threat.message)
                putExtra("is_security_threat", true)
                addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK or android.content.Intent.FLAG_ACTIVITY_CLEAR_TASK)
            }
            startActivity(intent)
            finish()
        }
    }

    fun showError(message: String, onRetry: () -> Unit) {
        if (errorView == null) {
            errorView = layoutInflater.inflate(R.layout.layout_error_retry, null)
            addContentView(errorView, ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            ))
        }
        
        errorView?.visibility = View.VISIBLE
        errorView?.findViewById<TextView>(R.id.error_message)?.text = message
        errorView?.findViewById<Button>(R.id.btn_retry)?.setOnClickListener {
            errorView?.visibility = View.GONE
            onRetry()
        }
    }

    fun hideError() {
        errorView?.visibility = View.GONE
    }

    fun checkNetworkAndRun(action: () -> Unit) {
        if (NetworkMonitor.isConnected(this)) {
            action()
        } else {
            showError("لا يوجد اتصال بالإنترنت") {
                checkNetworkAndRun(action)
            }
        }
    }
}
