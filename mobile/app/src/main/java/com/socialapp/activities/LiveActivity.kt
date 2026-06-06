package com.socialapp.activities

import android.Manifest
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.view.ViewGroup
import android.webkit.PermissionRequest
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.socialapp.databinding.ActivityLiveBinding
import com.socialapp.utils.UrlConfig
import com.socialapp.models.ApiMessage
import com.socialapp.network.ApiClient
import com.socialapp.network.SessionManager
import com.socialapp.utils.ActivitySecurity
import com.socialapp.utils.AppAnalytics
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

class LiveActivity : AppCompatActivity() {

    private lateinit var binding: ActivityLiveBinding
    private lateinit var webView: WebView
    private val mediaPermissionsLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        ActivitySecurity.enableSecureWindow(this)
        binding = ActivityLiveBinding.inflate(layoutInflater)
        setContentView(binding.root)
        requestMediaPermissionsIfNeeded()
        setupWebView()

        binding.startLive.setOnClickListener { createLiveRoom() }
        binding.watchLive.setOnClickListener {
            val requestedPath = intent.getStringExtra(EXTRA_TARGET_PATH)
            if (!requestedPath.isNullOrBlank()) {
                openAuthenticatedPage(requestedPath)
                return@setOnClickListener
            }
            val room = binding.roomInput.text.toString().trim()
            if (room.isNotBlank() && room.all(Char::isDigit)) {
                openAuthenticatedPage(buildLiveTargetPath(room))
            } else {
                openAuthenticatedPage(buildLiveTargetPath())
            }
        }

        val initialTarget = intent.getStringExtra(EXTRA_TARGET_PATH)
        openAuthenticatedPage(initialTarget ?: buildLiveTargetPath())
    }

    override fun onResume() {
        super.onResume()
        AppAnalytics.trackScreen("live")
    }

    override fun onDestroy() {
        if (::webView.isInitialized) {
            (webView.parent as? ViewGroup)?.removeView(webView)
            webView.destroy()
        }
        super.onDestroy()
    }

    private fun setupWebView() {
        webView = WebView(this)
        binding.videoContainer.addView(
            webView,
            ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
        )
        with(webView.settings) {
            javaScriptEnabled = true
            domStorageEnabled = true
            mediaPlaybackRequiresUserGesture = false
            mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
            allowContentAccess = true
            allowFileAccess = false
            cacheMode = WebSettings.LOAD_NO_CACHE
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                safeBrowsingEnabled = true
            }
        }
        webView.webViewClient = WebViewClient()
        webView.webChromeClient = object : WebChromeClient() {
            override fun onPermissionRequest(request: PermissionRequest) {
                val allowed = request.resources.filter {
                    it == PermissionRequest.RESOURCE_AUDIO_CAPTURE || it == PermissionRequest.RESOURCE_VIDEO_CAPTURE
                }
                runOnUiThread {
                    if (allowed.isNotEmpty()) {
                        request.grant(allowed.toTypedArray())
                    } else {
                        request.deny()
                    }
                }
            }
        }
    }

    private fun createLiveRoom() {
        val title = binding.roomInput.text.toString().trim().ifBlank { "Live Room" }
        ApiClient.api.createLive(
            mapOf("title" to title)
        ).enqueue(object : Callback<com.socialapp.models.LiveRoomInfo> {
            override fun onResponse(call: Call<com.socialapp.models.LiveRoomInfo>, response: Response<com.socialapp.models.LiveRoomInfo>) {
                if (response.isSuccessful) {
                    val roomId = response.body()?.id
                    if (!roomId.isNullOrBlank()) {
                        binding.roomInput.setText(roomId)
                        openAuthenticatedPage(buildLiveTargetPath(roomId))
                    } else {
                        openAuthenticatedPage(buildLiveTargetPath())
                    }
                    Toast.makeText(
                        this@LiveActivity,
                        "تم تجهيز البث المباشر",
                        Toast.LENGTH_LONG
                    ).show()
                } else {
                    Toast.makeText(this@LiveActivity, "Error: ${response.code()}", Toast.LENGTH_SHORT).show()
                }
            }

            override fun onFailure(call: Call<com.socialapp.models.LiveRoomInfo>, t: Throwable) {
                Toast.makeText(this@LiveActivity, t.message ?: "Live failed", Toast.LENGTH_SHORT).show()
            }
        })
    }

    private fun openAuthenticatedPage(path: String) {
        val webAppBase = UrlConfig.webAppUrlWithoutTrailingSlash()
        val targetUrl = if (path.startsWith("http")) path else "$webAppBase${if (path.startsWith("/")) path else "/$path"}"
        val safeToken = jsEscape(SessionManager.getToken().orEmpty())
        val safeUser = jsEscape(SessionManager.getUsername())
        val safeEmail = jsEscape(SessionManager.getEmail())
        val safeRole = jsEscape(SessionManager.getRole())
        val safePermissions = SessionManager.getPermissions().joinToString(separator = ",") { "'${jsEscape(it)}'" }
        val safeApiBase = jsEscape(UrlConfig.apiBaseWithoutTrailingSlash())
        val safeBackendOrigin = jsEscape(UrlConfig.socketUrl())
        val bootstrap = """
            <!doctype html>
            <html><head><meta charset="utf-8"></head><body style="background:#000;color:#fff;font-family:sans-serif;display:grid;place-items:center;height:100vh;">جاري التجهيز...</body>
            <script>
              const userPayload = {token:'$safeToken', access_token:'$safeToken', user:'$safeUser', username:'$safeUser', email:'$safeEmail', role:'$safeRole', permissions:[$safePermissions]};
              localStorage.setItem('apiBase', '$safeApiBase');
              localStorage.setItem('backendOrigin', '$safeBackendOrigin');
              localStorage.setItem('user', JSON.stringify(userPayload));
              localStorage.setItem('yamshatAuth', JSON.stringify(userPayload));
              localStorage.setItem('yamshatNativeShell', '1');
              window.location.replace('$targetUrl');
            </script></html>
        """.trimIndent()
        webView.loadDataWithBaseURL(UrlConfig.webAppUrl(), bootstrap, "text/html", "utf-8", null)
    }

    private fun buildLiveTargetPath(roomId: String? = null): String {
        val safeRoomId = roomId?.trim().orEmpty()
        return if (safeRoomId.isBlank()) {
            "/live/studio"
        } else {
            "/live/studio?room=${Uri.encode(safeRoomId)}"
        }
    }

    private fun jsEscape(value: String): String {
        return value
            .replace("\\", "\\\\")
            .replace("'", "\\'")
            .replace("\n", "\\n")
            .replace("\r", "")
    }

    private fun requestMediaPermissionsIfNeeded() {
        val permissions = mutableListOf(Manifest.permission.CAMERA, Manifest.permission.RECORD_AUDIO)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            permissions += Manifest.permission.POST_NOTIFICATIONS
        }
        val missing = permissions.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }
        if (missing.isNotEmpty()) {
            mediaPermissionsLauncher.launch(missing.toTypedArray())
        }
    }

    companion object {
        const val EXTRA_TARGET_PATH = "target_path"
    }
}
