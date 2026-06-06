package com.socialapp.activities

import android.Manifest
import android.annotation.SuppressLint
import android.content.ActivityNotFoundException
import android.content.Intent
import android.content.pm.PackageManager
import android.net.ConnectivityManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.util.Log
import android.view.MotionEvent
import android.view.View
import android.webkit.CookieManager
import android.webkit.PermissionRequest
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.addCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.google.firebase.messaging.FirebaseMessaging
import com.socialapp.BuildConfig
import com.socialapp.R
import com.socialapp.databinding.ActivityMainBinding
import com.socialapp.network.SessionManager
import com.socialapp.utils.ActivitySecurity
import com.socialapp.utils.NetworkMonitor
import com.socialapp.utils.NotificationHelper
import com.socialapp.utils.UrlConfig
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.util.Locale

class MainActivity : AppCompatActivity() {
    private lateinit var binding: ActivityMainBinding
    private var fileChooserCallback: ValueCallback<Array<Uri>>? = null
    private var currentTargetPath: String = DEFAULT_PATH
    private var showingOfflinePage = false
    private var networkCallback: ConnectivityManager.NetworkCallback? = null

    private val navTargets = mapOf(
        R.id.nav_home to "/",
        R.id.nav_stories to "/stories",
        R.id.nav_reels to "/reels",
        R.id.nav_chat to "/inbox",
        R.id.nav_profile to "/profile",
    )

    private val quickActionTargets = mapOf(
        R.id.actionNotifications to "/notifications",
        R.id.actionLive to "/live",
        R.id.actionGroups to "/groups",
        R.id.actionUsers to "/users",
    )

    private val notificationPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { }

    private val mediaPermissionsLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { }

    private val filePickerLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        val callback = fileChooserCallback ?: return@registerForActivityResult
        val uris = WebChromeClient.FileChooserParams.parseResult(result.resultCode, result.data)
        callback.onReceiveValue(uris)
        fileChooserCallback = null
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        ActivitySecurity.enableSecureWindow(this)

        if (!SessionManager.hasToken()) {
            openLogin()
            return
        }

        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        consumeForcedLogoutIfAny() ?: run {
            observeConnectivity()
            requestNotificationPermissionIfNeeded()
            requestMediaPermissionsIfNeeded()
            configureWebView()
            setupBottomNavigation()
            setupQuickActions()
            handleBackNavigation()
            loadInitialPage(intent)
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        if (SessionManager.hasToken()) {
            loadInitialPage(intent)
        } else {
            openLogin()
        }
    }

    override fun onResume() {
        super.onResume()
        SessionManager.handleAppForegroundResume()
        if (!::binding.isInitialized) return
        if (!SessionManager.hasToken()) {
            openLogin()
            return
        }
        if (consumeForcedLogoutIfAny() != null) return
        binding.webView.onResume()
        syncAuthToWebView()
        trySyncPushTokenWithSession()
        updateOfflineUi(NetworkMonitor.isConnected(this))
    }

    override fun onPause() {
        if (::binding.isInitialized) {
            binding.webView.onPause()
        }
        SessionManager.markAppBackgrounded()
        super.onPause()
    }

    override fun onUserInteraction() {
        super.onUserInteraction()
        SessionManager.recordUserPresence()
    }

    override fun onDestroy() {
        NetworkMonitor.unregister(this, networkCallback)
        fileChooserCallback?.onReceiveValue(null)
        fileChooserCallback = null
        if (::binding.isInitialized) {
            binding.webView.apply {
                stopLoading()
                destroy()
            }
        }
        super.onDestroy()
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun configureWebView() {
        val cookieManager = CookieManager.getInstance()
        cookieManager.setAcceptCookie(true)
        cookieManager.setAcceptThirdPartyCookies(binding.webView, false)

        binding.webView.apply {
            isFocusable = true
            isFocusableInTouchMode = true
            requestFocus(View.FOCUS_DOWN)
            setOnTouchListener { view, event ->
                if ((event.action == MotionEvent.ACTION_DOWN || event.action == MotionEvent.ACTION_UP) && !view.hasFocus()) {
                    view.requestFocus()
                }
                false
            }
            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                databaseEnabled = true
                allowFileAccess = false
                allowContentAccess = true
                mediaPlaybackRequiresUserGesture = false
                cacheMode = WebSettings.LOAD_NO_CACHE
                mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    safeBrowsingEnabled = true
                }
                builtInZoomControls = false
                displayZoomControls = false
                useWideViewPort = true
                loadWithOverviewMode = true
                javaScriptCanOpenWindowsAutomatically = true
                setSupportMultipleWindows(true)
                textZoom = 100
            }

            webChromeClient = object : WebChromeClient() {
                override fun onProgressChanged(view: WebView?, newProgress: Int) {
                    binding.progressBar.progress = newProgress
                    binding.progressBar.alpha = if (newProgress >= 100) 0f else 1f
                }

                override fun onShowFileChooser(
                    webView: WebView?,
                    filePathCallback: ValueCallback<Array<Uri>>?,
                    fileChooserParams: FileChooserParams?
                ): Boolean {
                    fileChooserCallback?.onReceiveValue(null)
                    fileChooserCallback = filePathCallback
                    return try {
                        val chooserIntent = fileChooserParams?.createIntent()?.apply {
                            addCategory(Intent.CATEGORY_OPENABLE)
                            type = type ?: "*/*"
                        } ?: Intent(Intent.ACTION_GET_CONTENT).apply {
                            addCategory(Intent.CATEGORY_OPENABLE)
                            type = "*/*"
                        }
                        filePickerLauncher.launch(chooserIntent)
                        true
                    } catch (_: ActivityNotFoundException) {
                        fileChooserCallback?.onReceiveValue(null)
                        fileChooserCallback = null
                        false
                    }
                }

                override fun onPermissionRequest(request: PermissionRequest) {
                    val requested = request.resources.orEmpty()
                    val allowed = requested.filter {
                        it == PermissionRequest.RESOURCE_AUDIO_CAPTURE || it == PermissionRequest.RESOURCE_VIDEO_CAPTURE
                    }
                    runOnUiThread {
                        if (allowed.isNotEmpty()) request.grant(allowed.toTypedArray()) else request.deny()
                    }
                }
            }

            webViewClient = object : WebViewClient() {
                override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                    val uri = request?.url ?: return false
                    return if (isInternalUrl(uri)) {
                        false
                    } else {
                        startActivity(Intent(Intent.ACTION_VIEW, uri))
                        true
                    }
                }

                override fun onPageFinished(view: WebView?, url: String?) {
                    super.onPageFinished(view, url)
                    syncAuthToWebView()
                    trySyncPushTokenWithSession()
                    syncBottomNavWithUrl(url)
                }
            }
        }
    }

    private fun observeConnectivity() {
        networkCallback = NetworkMonitor.register(this) { connected ->
            runOnUiThread {
                updateOfflineUi(connected)
                if (connected && showingOfflinePage) {
                    loadAuthenticatedPage(currentTargetPath)
                }
            }
        }
    }

    private fun updateOfflineUi(connected: Boolean) {
        if (!::binding.isInitialized) return
        binding.offlineBanner.visibility = if (connected) View.GONE else View.VISIBLE
    }

    private fun setupBottomNavigation() {
        binding.bottomNav.setOnItemSelectedListener { item ->
            val target = navTargets[item.itemId] ?: return@setOnItemSelectedListener false
            if (normalizeTargetPath(target) != currentTargetPath) {
                loadAuthenticatedPage(target)
            }
            true
        }
    }

    private fun setupQuickActions() {
        quickActionTargets.forEach { (viewId, targetPath) ->
            findViewById<View>(viewId)?.setOnClickListener {
                loadAuthenticatedPage(targetPath)
            }
        }
    }

    private fun syncBottomNavWithUrl(url: String?) {
        val uri = url?.let { runCatching { Uri.parse(it) }.getOrNull() } ?: return
        val host = uri.host?.lowercase(Locale.US)
        val configuredHost = Uri.parse(UrlConfig.webAppUrl()).host?.lowercase(Locale.US)
        if (host != null && configuredHost != null && host != configuredHost) return
        val path = normalizeTargetPath(uri.path ?: return)
        currentTargetPath = path
        val selectedId = itemIdForPath(path)
        if (selectedId != null && binding.bottomNav.selectedItemId != selectedId) {
            binding.bottomNav.selectedItemId = selectedId
        }
        if (path.contains("/notifications", ignoreCase = true)) {
            NotificationHelper.resetBadgeCount(this)
        }
        binding.subtitleText.text = subtitleForPath(path)
        updateChromeForPath(path)
    }

    private fun itemIdForPath(path: String): Int? = when {
        path.contains("/stories", ignoreCase = true) -> R.id.nav_stories
        path.contains("/reels", ignoreCase = true) -> R.id.nav_reels
        path.contains("/inbox", ignoreCase = true) || path.contains("/chat", ignoreCase = true) -> R.id.nav_chat
        path.contains("/profile", ignoreCase = true) -> R.id.nav_profile
        else -> R.id.nav_home
    }

    private fun subtitleForPath(path: String): String = when {
        path.contains("/notifications", ignoreCase = true) -> "مركز الإشعارات والتنبيهات اللحظية بنفس هوية يام شات"
        path.contains("/live", ignoreCase = true) -> "البث المباشر بنفس الهوية الداكنة والبنفسجية"
        path.contains("/groups", ignoreCase = true) -> "المجموعات وخدمات المجتمع موحدة داخل الجوال والويب"
        path.contains("/users", ignoreCase = true) -> "الأصدقاء والمتابعة وبدء المحادثات بنفس الستايل"
        path.contains("/dashboard", ignoreCase = true) -> "لوحة النشاط السريعة والخدمات المرتبطة"
        itemIdForPath(path) == R.id.nav_stories -> "الستوري بنفس الحلقات البنفسجية والواجهة الداكنة"
        itemIdForPath(path) == R.id.nav_reels -> "ريلز عمودي سريع بنفس توزيع المرجع"
        itemIdForPath(path) == R.id.nav_chat -> "الدردشات وقائمة الرسائل بستايل يام شات الجديد"
        itemIdForPath(path) == R.id.nav_profile -> "الملف الشخصي والإحصائيات بنفس الهوية"
        else -> "الصفحة الرئيسية ومنشورات المجتمع بستايل الجوال الجديد"
    }

    private fun updateChromeForPath(path: String) {
        val showNativeChrome = !path.startsWith("/admin")
        binding.headerCard.visibility = if (showNativeChrome) View.VISIBLE else View.GONE
        binding.bottomNav.visibility = if (showNativeChrome) View.VISIBLE else View.GONE
    }

    private fun handleBackNavigation() {
        onBackPressedDispatcher.addCallback(this) {
            if (binding.webView.canGoBack()) {
                binding.webView.goBack()
            } else {
                finish()
            }
        }
    }

    private fun requestNotificationPermissionIfNeeded() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
        ) {
            notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
        }
    }

    private fun requestMediaPermissionsIfNeeded() {
        val missing = listOf(
            Manifest.permission.CAMERA,
            Manifest.permission.RECORD_AUDIO
        ).filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }
        if (missing.isNotEmpty()) {
            mediaPermissionsLauncher.launch(missing.toTypedArray())
        }
    }

    private fun loadInitialPage(intent: Intent?) {
        val targetPath = resolveTargetPath(intent)
        currentTargetPath = targetPath
        binding.bottomNav.selectedItemId = itemIdForPath(targetPath) ?: R.id.nav_home
        binding.subtitleText.text = subtitleForPath(targetPath)
        updateChromeForPath(targetPath)
        loadAuthenticatedPage(targetPath)
    }

    private fun resolveTargetPath(intent: Intent?): String {
        val data = intent?.data
        if (data != null) {
            if (data.scheme.equals("yamshat", ignoreCase = true)) {
                val customPath = data.path?.takeIf { it.isNotBlank() && it != "/" }
                    ?: data.lastPathSegment?.takeIf { it.isNotBlank() }?.let { "/$it" }
                if (!customPath.isNullOrBlank()) {
                    return normalizeTargetPath(customPath)
                }
            }
            if (isInternalUrl(data)) {
                return normalizeTargetPath(data.path ?: DEFAULT_PATH)
            }
        }
        return normalizeTargetPath(
            intent?.getStringExtra(EXTRA_TARGET_PATH)
                ?.takeIf { it.isNotBlank() }
                ?: DEFAULT_PATH
        )
    }

    private fun normalizeTargetPath(targetPath: String): String {
        if (targetPath.startsWith("http://") || targetPath.startsWith("https://")) {
            return Uri.parse(targetPath).path ?: DEFAULT_PATH
        }
        return when {
            targetPath.startsWith("/") -> targetPath
            else -> "/$targetPath"
        }
    }

    private fun loadAuthenticatedPage(targetPath: String) {
        val token = SessionManager.getToken()
        if (token.isNullOrBlank()) {
            openLogin()
            return
        }

        currentTargetPath = normalizeTargetPath(targetPath)
        if (currentTargetPath.contains("/notifications", ignoreCase = true)) {
            NotificationHelper.resetBadgeCount(this)
        }

        if (!NetworkMonitor.isConnected(this)) {
            loadOfflinePage(currentTargetPath)
            return
        }

        val authPayload = buildAuthPayload()
        val apiBase = buildApiBase()
        val html = """
            <!DOCTYPE html>
            <html lang="ar">
            <head>
                <meta charset="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>Yamshat</title>
            </head>
            <body style="background:#121212;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;">
                <div>جاري فتح التطبيق...</div>
                <script>
                    localStorage.setItem('user', JSON.stringify($authPayload));
                    localStorage.setItem('yamshatAuth', JSON.stringify($authPayload));
                    localStorage.setItem('apiBase', ${jsString(apiBase)});
                    localStorage.setItem('backendOrigin', ${jsString(UrlConfig.socketUrl())});
                    localStorage.setItem('yamshatNativeShell', '1');
                    window.location.replace(${jsString(resolveTargetUrl(currentTargetPath))});
                </script>
            </body>
            </html>
        """.trimIndent()

        showingOfflinePage = false
        binding.webView.loadDataWithBaseURL(
            UrlConfig.webAppUrl(),
            html,
            "text/html",
            "utf-8",
            null
        )
    }

    private fun loadOfflinePage(targetPath: String) {
        showingOfflinePage = true
        val html = """
            <!DOCTYPE html>
            <html lang="ar">
            <head>
                <meta charset="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>Offline</title>
            </head>
            <body style="margin:0;background:#09070F;color:#F5F5F7;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;">
                <div style="max-width:320px;text-align:center;padding:24px;">
                    <div style="font-size:48px;">📡</div>
                    <h2 style="margin:12px 0 8px;">أنت حالياً أوفلاين</h2>
                    <p style="opacity:.85;line-height:1.7;">أول ما الإنترنت يرجع هنفتح <b>${escapeHtml(targetPath)}</b> تلقائي. حالياً تقدر تستخدم الأجزاء المحلية والكاش.</p>
                </div>
            </body>
            </html>
        """.trimIndent()
        binding.webView.loadDataWithBaseURL(UrlConfig.webAppUrl(), html, "text/html", "utf-8", null)
    }

    private fun buildAuthPayload(): String {
        val token = SessionManager.getToken().orEmpty()
        val refreshToken = SessionManager.getRefreshToken().orEmpty()
        val user = SessionManager.getUsername()
        val email = SessionManager.getEmail()
        val role = SessionManager.getRole()
        val avatar = SessionManager.getAvatar()
        val permissionsJson = SessionManager.getPermissions().joinToString(prefix = "[", postfix = "]") { jsString(it) }
        return "{" +
            "\"token\":${jsString(token)}," +
            "\"access_token\":${jsString(token)}," +
            "\"refresh_token\":${jsString(refreshToken)}," +
            "\"user\":${jsString(user)}," +
            "\"username\":${jsString(user)}," +
            "\"email\":${jsString(email)}," +
            "\"avatar\":${jsString(avatar)}," +
            "\"role\":${jsString(role)}," +
            "\"permissions\":$permissionsJson" +
            "}"
    }

    private fun syncAuthToWebView() {
        if (!::binding.isInitialized || !SessionManager.hasToken() || showingOfflinePage) return
        val script = "(" +
            "function(){" +
            "localStorage.setItem('user', JSON.stringify(${buildAuthPayload()}));" +
            "localStorage.setItem('yamshatAuth', JSON.stringify(${buildAuthPayload()}));" +
            "localStorage.setItem('apiBase', ${jsString(buildApiBase())});" +
            "localStorage.setItem('backendOrigin', ${jsString(UrlConfig.socketUrl())});" +
            "}" +
            ")();"
        binding.webView.evaluateJavascript(script, null)
    }

    private fun resolveTargetUrl(targetPath: String): String {
        val trimmedBase = UrlConfig.webAppUrlWithoutTrailingSlash()
        val normalizedPath = when {
            targetPath.startsWith("http://") || targetPath.startsWith("https://") -> return targetPath
            targetPath.startsWith("/") -> targetPath
            else -> "/$targetPath"
        }
        return "$trimmedBase$normalizedPath"
    }

    private fun buildApiBase(): String = UrlConfig.apiBaseWithoutTrailingSlash()

    private fun isInternalUrl(uri: Uri): Boolean {
        if (uri.scheme.equals("yamshat", ignoreCase = true)) return true
        val configuredHost = Uri.parse(UrlConfig.webAppUrl()).host?.lowercase(Locale.US)
        val currentHost = uri.host?.lowercase(Locale.US)
        return currentHost != null && currentHost == configuredHost
    }

    private fun trySyncPushTokenWithSession() {
        val authToken = SessionManager.getToken().orEmpty().trim()
        val cookie = CookieManager.getInstance().getCookie(UrlConfig.webAppUrl()).orEmpty().trim()
        if (cookie.isBlank() && authToken.isBlank()) return

        runCatching {
            FirebaseMessaging.getInstance().token
                .addOnSuccessListener { token ->
                    if (token.isNullOrBlank()) return@addOnSuccessListener
                    syncTokenWithWebSession(token, cookie, authToken)
                }
                .addOnFailureListener {
                    logWarn("Failed to fetch Firebase push token inside MainActivity", it)
                }
        }.onFailure {
            logWarn("Firebase push token sync is unavailable on this device", it)
        }
    }

    private fun syncTokenWithWebSession(token: String, cookie: String, authToken: String) {
        Thread {
            runCatching {
                val client = OkHttpClient.Builder().build()
                val builder = Request.Builder()
                    .url("${buildApiBase()}/users/fcm-token")
                    .addHeader("Content-Type", "application/json")

                if (cookie.isNotBlank()) {
                    builder.addHeader("Cookie", cookie)
                }
                if (authToken.isNotBlank()) {
                    builder.addHeader("Authorization", "Bearer $authToken")
                }

                val request = builder
                    .post(
                        """
                        {"token":"${escapeJson(token)}","platform":"android","app_version":"${escapeJson(BuildConfig.VERSION_NAME)}"}
                        """.trimIndent().toRequestBody("application/json; charset=utf-8".toMediaType())
                    )
                    .build()
                client.newCall(request).execute().close()
            }
        }.start()
    }

    private fun consumeForcedLogoutIfAny(): String? {
        val reason = SessionManager.consumeForcedLogoutReason() ?: return null
        toast(reason)
        openLogin()
        return reason
    }

    private fun escapeJson(value: String): String {
        return value
            .replace("\\", "\\\\")
            .replace("\"", "\\\"")
    }

    private fun escapeHtml(value: String): String {
        return value
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
    }

    private fun jsString(value: String): String {
        return "\"${escapeJson(value).replace("\n", "\\n").replace("\r", "\\r")}\""
    }

    private fun openLogin() {
        startActivity(Intent(this, LoginActivity::class.java))
        finish()
    }

    private fun toast(message: String) {
        Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
    }

    private fun logWarn(message: String, throwable: Throwable? = null) {
        if (BuildConfig.ENABLE_LOGS) {
            Log.w("MainActivity", message, throwable)
        }
    }

    companion object {
        const val EXTRA_TARGET_PATH = "target_path"
        private const val DEFAULT_PATH = "/"
    }
}
