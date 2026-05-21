package com.socialapp.activities

import android.Manifest
import android.content.pm.PackageManager
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.view.ViewGroup
import android.webkit.PermissionRequest
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.EditText
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.google.gson.Gson
import com.socialapp.databinding.ActivityLiveBinding
import com.socialapp.models.ApiMessage
import com.socialapp.models.LiveFeatureConfig
import com.socialapp.network.ApiClient
import com.socialapp.network.SessionManager
import com.socialapp.utils.ActivitySecurity
import com.socialapp.utils.AppAnalytics
import com.socialapp.utils.NetworkMonitor
import com.socialapp.utils.UrlConfig
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

class LiveActivity : AppCompatActivity() {

    private lateinit var binding: ActivityLiveBinding
    private lateinit var webView: WebView
    private var networkCallback: ConnectivityManager.NetworkCallback? = null
    private var liveConfig = LiveFeatureConfig()
    private val gson = Gson()
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
        setupActions()
        observeNetworkQuality()

        val initialTarget = intent.getStringExtra(EXTRA_TARGET_PATH)
        openAuthenticatedPage(initialTarget ?: buildLiveTargetPath())
        renderConfigSummary()
    }

    override fun onResume() {
        super.onResume()
        AppAnalytics.trackScreen("live")
        renderConnectionQuality()
    }

    override fun onDestroy() {
        NetworkMonitor.unregister(this, networkCallback)
        if (::webView.isInitialized) {
            (webView.parent as? ViewGroup)?.removeView(webView)
            webView.destroy()
        }
        super.onDestroy()
    }

    private fun setupActions() {
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
        binding.coHostBtn.setOnClickListener { showCoHostDialog() }
        binding.moderationBtn.setOnClickListener { showModerationDialog() }
        binding.recordingBtn.setOnClickListener { toggleRecording() }
        binding.abrBtn.setOnClickListener { toggleAbr() }
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
            cacheMode = WebSettings.LOAD_DEFAULT
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                safeBrowsingEnabled = true
            }
        }
        webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                injectLiveConfig()
            }

            override fun onReceivedError(view: WebView?, errorCode: Int, description: String?, failingUrl: String?) {
                super.onReceivedError(view, errorCode, description, failingUrl)
                Toast.makeText(this@LiveActivity, "انقطع الاتصال، جاري المحاولة...", Toast.LENGTH_SHORT).show()
                view?.postDelayed({ view.reload() }, 3000)
            }
        }
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
        val payload = linkedMapOf<String, Any>(
            "title" to title,
            "co_hosts" to liveConfig.coHosts,
            "record_stream" to liveConfig.recordingEnabled,
            "adaptive_bitrate" to liveConfig.adaptiveBitrate,
            "comment_monitoring" to liveConfig.commentMonitoring,
        )
        ApiClient.api.createLive(payload).enqueue(object : Callback<ApiMessage> {
            override fun onResponse(call: Call<ApiMessage>, response: Response<ApiMessage>) {
                val roomId = response.body()?.room_id
                if (!roomId.isNullOrBlank()) {
                    binding.roomInput.setText(roomId)
                    openAuthenticatedPage(buildLiveTargetPath(roomId))
                } else {
                    openAuthenticatedPage(buildLiveTargetPath())
                }
                Toast.makeText(
                    this@LiveActivity,
                    response.body()?.message ?: "تم تجهيز البث المباشر",
                    Toast.LENGTH_LONG
                ).show()
            }

            override fun onFailure(call: Call<ApiMessage>, t: Throwable) {
                Toast.makeText(this@LiveActivity, t.message ?: "Live failed", Toast.LENGTH_SHORT).show()
            }
        })
    }

    private fun openAuthenticatedPage(path: String) {
        val webAppBase = UrlConfig.webAppUrlWithoutTrailingSlash()
        val baseUrl = if (path.startsWith("http")) path else "$webAppBase${if (path.startsWith("/")) path else "/$path"}"
        val targetUri = Uri.parse(baseUrl).buildUpon()
            .appendQueryParameter("recording", if (liveConfig.recordingEnabled) "1" else "0")
            .appendQueryParameter("abr", if (liveConfig.adaptiveBitrate) "auto" else "manual")
            .appendQueryParameter("moderation", if (liveConfig.moderationMode) "1" else "0")
            .appendQueryParameter("comment_monitoring", if (liveConfig.commentMonitoring) "1" else "0")
            .appendQueryParameter("cohosts", liveConfig.coHosts.joinToString(","))
            .build()
        val safeToken = jsEscape(SessionManager.getToken().orEmpty())
        val safeUser = jsEscape(SessionManager.getUsername())
        val safeEmail = jsEscape(SessionManager.getEmail())
        val safeRole = jsEscape(SessionManager.getRole())
        val safePermissions = SessionManager.getPermissions().joinToString(separator = ",") { "'${jsEscape(it)}'" }
        val safeApiBase = jsEscape(UrlConfig.apiBaseWithoutTrailingSlash())
        val safeBackendOrigin = jsEscape(UrlConfig.socketUrl())
        val safeLiveConfig = jsEscape(gson.toJson(liveConfig))
        val safeTarget = jsEscape(targetUri.toString())
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
              localStorage.setItem('yamshatLiveConfig', '$safeLiveConfig');
              window.location.replace('$safeTarget');
            </script></html>
        """.trimIndent()
        webView.loadDataWithBaseURL(UrlConfig.webAppUrl(), bootstrap, "text/html", "utf-8", null)
    }

    private fun injectLiveConfig() {
        if (!::webView.isInitialized) return
        val configJson = gson.toJson(liveConfig)
        val script = """
            (function() {
              try {
                localStorage.setItem('yamshatLiveConfig', ${toJsString(configJson)});
                window.dispatchEvent(new CustomEvent('yamshat-live-config', { detail: JSON.parse(${toJsString(configJson)}) }));
              } catch (e) {}
            })();
        """.trimIndent()
        webView.evaluateJavascript(script, null)
    }

    private fun showCoHostDialog() {
        val input = EditText(this).apply {
            hint = "user1,user2,user3"
            setText(liveConfig.coHosts.joinToString(","))
        }
        AlertDialog.Builder(this)
            .setTitle("Co-host usernames")
            .setView(input)
            .setPositiveButton("حفظ") { _, _ ->
                val hosts = input.text.toString()
                    .split(',')
                    .map { it.trim() }
                    .filter { it.isNotBlank() }
                    .distinct()
                liveConfig = liveConfig.copy(coHosts = hosts)
                renderConfigSummary()
                injectLiveConfig()
            }
            .setNegativeButton("إلغاء", null)
            .show()
    }

    private fun showModerationDialog() {
        val options = arrayOf("كتم مستخدم", "حظر مستخدم", "طرد مستخدم", "تبديل مراقبة التعليقات")
        AlertDialog.Builder(this)
            .setTitle("Moderation tools")
            .setItems(options) { _, which ->
                when (which) {
                    0 -> promptModerationTarget("mute")
                    1 -> promptModerationTarget("ban")
                    2 -> promptModerationTarget("kick")
                    3 -> {
                        liveConfig = liveConfig.copy(commentMonitoring = !liveConfig.commentMonitoring)
                        renderConfigSummary()
                        injectModerationEvent("monitor_comments", if (liveConfig.commentMonitoring) "enabled" else "disabled")
                    }
                }
            }
            .setNegativeButton("إلغاء", null)
            .show()
    }

    private fun promptModerationTarget(action: String) {
        val input = EditText(this).apply { hint = "username" }
        AlertDialog.Builder(this)
            .setTitle("$action target")
            .setView(input)
            .setPositiveButton("تنفيذ") { _, _ ->
                val user = input.text.toString().trim()
                if (user.isBlank()) return@setPositiveButton
                injectModerationEvent(action, user)
                Toast.makeText(this, "تم إرسال أمر $action إلى الواجهة", Toast.LENGTH_SHORT).show()
            }
            .setNegativeButton("إلغاء", null)
            .show()
    }

    private fun injectModerationEvent(action: String, target: String) {
        val payload = toJsString("{\"action\":\"$action\",\"target\":\"${target.replace("\"", "")}\"}")
        val script = """
            (function() {
              try {
                const payload = JSON.parse($payload);
                window.dispatchEvent(new CustomEvent('yamshat-live-moderation', { detail: payload }));
              } catch (e) {}
            })();
        """.trimIndent()
        webView.evaluateJavascript(script, null)
    }

    private fun toggleRecording() {
        liveConfig = liveConfig.copy(recordingEnabled = !liveConfig.recordingEnabled)
        renderConfigSummary()
        injectLiveConfig()
    }

    private fun toggleAbr() {
        liveConfig = liveConfig.copy(adaptiveBitrate = !liveConfig.adaptiveBitrate)
        renderConfigSummary()
        injectLiveConfig()
    }

    private fun renderConfigSummary() {
        binding.coHostSummary.text = "Co-hosts: ${liveConfig.coHosts.size}${if (liveConfig.coHosts.isNotEmpty()) " • ${liveConfig.coHosts.joinToString()}" else ""}"
        binding.recordingBtn.text = if (liveConfig.recordingEnabled) "Recording ON" else "Recording OFF"
        binding.abrBtn.text = if (liveConfig.adaptiveBitrate) "ABR Auto" else "ABR Manual"
        renderConnectionQuality()
    }

    private fun observeNetworkQuality() {
        networkCallback = NetworkMonitor.register(this) {
            runOnUiThread {
                renderConnectionQuality()
                injectLiveConfig()
            }
        }
    }

    private fun renderConnectionQuality() {
        binding.connectionQualityText.text = "جودة الاتصال: ${estimateConnectionLabel()}"
    }

    private fun estimateConnectionLabel(): String {
        val manager = getSystemService(ConnectivityManager::class.java) ?: return "Offline"
        val network = manager.activeNetwork ?: return "Offline"
        val caps = manager.getNetworkCapabilities(network) ?: return "Offline"
        val downKbps = caps.linkDownstreamBandwidthKbps
        return when {
            !caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED) -> "Offline"
            downKbps >= 12_000 -> "Excellent • ABR 1080p"
            downKbps >= 5_000 -> "Good • ABR 720p"
            downKbps >= 1_500 -> "Fair • ABR 480p"
            else -> "Low • audio-priority"
        }
    }

    private fun buildLiveTargetPath(roomId: String? = null): String {
        val safeRoomId = roomId?.trim().orEmpty()
        return if (safeRoomId.isBlank()) {
            "/live"
        } else {
            "/live?room=${Uri.encode(safeRoomId)}"
        }
    }

    private fun jsEscape(value: String): String {
        return value
            .replace("\\", "\\\\")
            .replace("'", "\\'")
            .replace("\n", "\\n")
            .replace("\r", "")
    }

    private fun toJsString(value: String): String {
        return "'${jsEscape(value)}'"
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
