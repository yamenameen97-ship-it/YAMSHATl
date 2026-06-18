package com.socialapp.activities

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.media.MediaRecorder
import android.net.Uri
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.provider.OpenableColumns
import android.text.Editable
import android.text.TextWatcher
import android.webkit.MimeTypeMap
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.LinearLayoutManager
import com.socialapp.adapters.ChatAdapter
import com.socialapp.databinding.ActivityChatBinding
import com.socialapp.models.ApiMessage
import com.socialapp.models.MessageItem
import com.socialapp.network.ApiClient
import com.socialapp.network.SessionManager
import com.socialapp.realtime.SocketManager
import com.socialapp.signal.SignalProtocolManager
import com.socialapp.utils.ActionRateLimiter
import com.socialapp.utils.ActivitySecurity
import com.socialapp.utils.AppAnalytics
import com.socialapp.utils.ConversationCache
import com.socialapp.utils.CryptoManager
import com.socialapp.utils.NetworkMonitor
import io.socket.emitter.Emitter
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import org.json.JSONObject
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response
import java.io.File
import java.io.FileOutputStream
import com.socialapp.utils.SecureMediaManager
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class ChatActivity : AppCompatActivity() {
    private lateinit var binding: ActivityChatBinding
    private lateinit var chatAdapter: ChatAdapter
    private val sender by lazy { SessionManager.getUsername().ifBlank { "User1" } }
    private val receiver by lazy { intent.getStringExtra("receiver") ?: "User2" }
    private val token by lazy { SessionManager.getToken().orEmpty() }
    private val handler = Handler(Looper.getMainLooper())
    private var recorder: MediaRecorder? = null
    private var voiceFile: File? = null
    private var isRecording = false
    private var lastTypingAt = 0L
    private var callDialogVisible = false

    private val mediaPicker = registerForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
        uri?.let { uploadAndSendFromUri(it) }
    }

    private val recordPermissionLauncher = registerForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
        if (granted) startVoiceRecording() else toast("مطلوب إذن الميكروفون")
    }

    private val refreshListener = Emitter.Listener { runOnUiThread { loadMessages(false) } }
    private val incomingCallListener = Emitter.Listener { args ->
        val payload = args.firstOrNull() as? JSONObject ?: return@Listener
        val caller = payload.optString("caller").ifBlank { payload.optString("sender") }
        if (caller != receiver) return@Listener
        val roomId = payload.optString("room_id")
        val callType = payload.optString("call_type").ifBlank { "audio" }
        runOnUiThread {
            if (!callDialogVisible) {
                showIncomingCallDialog(caller, callType, roomId)
            }
        }
    }
    private val presenceListener = Emitter.Listener { args ->
        val payload = args.firstOrNull() as? JSONObject ?: return@Listener
        val user = payload.optString("user")
        if (user != receiver) return@Listener
        runOnUiThread {
            if (payload.optBoolean("is_online", false)) {
                binding.statusText.text = "🟢 متصل الآن"
            } else {
                val seen = payload.optString("last_seen")
                binding.statusText.text = "آخر ظهور: ${seen.replace('T', ' ').take(16).ifBlank { "غير متاح" }}"
            }
        }
    }
    private val typingListener = Emitter.Listener { args ->
        val payload = args.firstOrNull() as? JSONObject ?: return@Listener
        if (payload.optString("sender") != receiver) return@Listener
        runOnUiThread {
            binding.typingText.text = if (payload.optBoolean("is_typing", false)) "يكتب الآن..." else ""
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        ActivitySecurity.enableSecureWindow(this)
        binding = ActivityChatBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.chatTitle.text = receiver
        chatAdapter = ChatAdapter(mutableListOf(), sender) { message -> confirmMessageAction(message) }
        binding.chatRecycler.layoutManager = LinearLayoutManager(this).apply { stackFromEnd = true }
        binding.chatRecycler.adapter = chatAdapter
        binding.chatRecycler.setHasFixedSize(true)
        binding.chatRecycler.setItemViewCacheSize(20)

        binding.sendBtn.setOnClickListener { sendTextMessage() }
        binding.attachBtn.setOnClickListener { mediaPicker.launch(arrayOf("image/*", "video/*", "audio/*")) }
        binding.voiceBtn.setOnClickListener { toggleVoiceRecording() }
        binding.e2eBtn.setOnClickListener { ensureSignalReady() }
        binding.audioCallBtn.setOnClickListener { startCall("audio") }
        binding.videoCallBtn.setOnClickListener { startCall("video") }
        binding.msgInput.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) = Unit
            override fun afterTextChanged(s: Editable?) = Unit
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                val now = System.currentTimeMillis()
                if (now - lastTypingAt > 900) {
                    lastTypingAt = now
                    val typing = !s.isNullOrBlank()
                    ApiClient.api.typing(mapOf("receiver" to receiver, "is_typing" to typing)).enqueue(simpleCallback())
                    SocketManager.emitTyping(sender, receiver, typing)
                    handler.removeCallbacks(clearTypingRunnable)
                    if (typing) handler.postDelayed(clearTypingRunnable, 1500)
                }
            }
        })

        loadCachedMessages(showToast = false)
        ensureSignalReady(silent = true)
        loadMessages(true)
        fetchPresence()
    }

    override fun onResume() {
        super.onResume()
        AppAnalytics.trackScreen("chat")
        SocketManager.connectSocket(token, onConnected = {
            SocketManager.joinRoom(sender, receiver, token)
            runOnUiThread { loadMessages(false) }
        })
        registerSocketListeners()
        sendOnline(true)
    }

    override fun onPause() {
        super.onPause()
        sendOnline(false)
        unregisterSocketListeners()
        SocketManager.disconnect()
    }

    override fun onDestroy() {
        super.onDestroy()
        stopVoiceRecording(releaseOnly = true)
        unregisterSocketListeners()
        handler.removeCallbacksAndMessages(null)
    }

    private val clearTypingRunnable = Runnable {
        binding.typingText.text = ""
        ApiClient.api.typing(mapOf("receiver" to receiver, "is_typing" to false)).enqueue(simpleCallback())
        SocketManager.emitTyping(sender, receiver, false)
    }

    private fun registerSocketListeners() {
        SocketManager.on("new_private_message", refreshListener)
        SocketManager.on("message_deleted", refreshListener)
        SocketManager.on("messages_seen", refreshListener)
        SocketManager.on("messages_delivered", refreshListener)
        SocketManager.on("incoming_call", incomingCallListener)
        SocketManager.on("presence_update", presenceListener)
        SocketManager.on("typing_update", typingListener)
    }

    private fun unregisterSocketListeners() {
        SocketManager.off("new_private_message", refreshListener)
        SocketManager.off("message_deleted", refreshListener)
        SocketManager.off("messages_seen", refreshListener)
        SocketManager.off("messages_delivered", refreshListener)
        SocketManager.off("incoming_call", incomingCallListener)
        SocketManager.off("presence_update", presenceListener)
        SocketManager.off("typing_update", typingListener)
    }

    private fun sendTextMessage() {
        if (!ActionRateLimiter.allow("dm_send_$receiver", maxHits = 8, windowMs = 20_000L, minIntervalMs = 650L)) {
            toast("أنت بتبعت بسرعة زيادة، اهدى ثانية")
            return
        }
        val message = binding.msgInput.text.toString().trim()
        if (message.isEmpty()) return
        sendEncryptedPayload(message = message, type = "text")
    }

    private fun sendEncryptedPayload(message: String, type: String, mediaUrl: String? = null) {
        binding.sendBtn.isEnabled = false
        SignalProtocolManager.encryptOutgoing(this, receiver, message.ifBlank { type }) { encrypted, error ->
            runOnUiThread {
                binding.sendBtn.isEnabled = true
                if (encrypted == null) {
                    toast(error ?: "فشل تشفير الرسالة")
                    return@runOnUiThread
                }

                val optimisticMessage = MessageItem(
                    sender = sender,
                    receiver = receiver,
                    message = message,
                    content = message,
                    type = type,
                    media_url = mediaUrl,
                    status = if (NetworkMonitor.isConnected(this)) "sending" else "pending",
                    created_at = nowTimestamp(),
                    displayMessage = message.ifBlank { defaultMediaLabel(type) }
                )
                chatAdapter.appendItem(optimisticMessage)
                scrollToBottom()
                cacheConversation()

                if (!NetworkMonitor.isConnected(this)) {
                    toast("أنت أوفلاين، الرسالة اتحفظت محلياً لحد ما ترجع الشبكة")
                    binding.msgInput.setText("")
                    return@runOnUiThread
                }

                val clientId = "android_${System.currentTimeMillis()}"
                ApiClient.api.sendMessage(
                    mapOf(
                        "receiver" to receiver,
                        "encrypted_message" to encrypted,
                        "type" to type,
                        "client_id" to clientId,
                        "media_url" to mediaUrl,
                    )
                ).enqueue(object : Callback<ApiMessage> {
                    override fun onResponse(call: Call<ApiMessage>, response: Response<ApiMessage>) {
                        binding.msgInput.setText("")
                        ApiClient.api.track(mapOf("event" to "send_message")).enqueue(simpleCallback())
                        loadMessages(true)
                    }

                    override fun onFailure(call: Call<ApiMessage>, t: Throwable) {
                        toast(t.message ?: "فشل إرسال الرسالة")
                    }
                })
            }
        }
    }

    private fun loadMessages(scrollToBottom: Boolean) {
        ApiClient.api.getMessages(receiver)
            .enqueue(object : Callback<List<MessageItem>> {
                override fun onResponse(call: Call<List<MessageItem>>, response: Response<List<MessageItem>>) {
                    val items = response.body().orEmpty().map {
                        val rawContent = it.content ?: it.message
                        val displayText = if (it.deleted == true) {
                            "تم حذف هذه الرسالة"
                        } else {
                            val signalText = SignalProtocolManager.decryptIncoming(
                                this@ChatActivity,
                                it.sender,
                                rawContent,
                            )
                            if (signalText != rawContent) {
                                signalText
                            } else {
                                CryptoManager.decrypt(
                                    this@ChatActivity,
                                    sender,
                                    receiver,
                                    rawContent,
                                )
                            }
                        }
                        it.copy(displayMessage = displayText)
                    }
                    chatAdapter.submitItems(items)
                    ConversationCache.savePrivate(this@ChatActivity, receiver, items)
                    if (scrollToBottom && items.isNotEmpty()) {
                        binding.chatRecycler.scrollToPosition(items.lastIndex)
                    }
                    ApiClient.api.messageSeen(mapOf("sender" to receiver)).enqueue(simpleCallback())
                }

                override fun onFailure(call: Call<List<MessageItem>>, t: Throwable) {
                    loadCachedMessages(showToast = scrollToBottom)
                    if (scrollToBottom) toast(t.message ?: "تعذر تحميل الرسائل")
                }
            })
    }

    private fun loadCachedMessages(showToast: Boolean) {
        val cached = ConversationCache.loadPrivate(this, receiver)
        if (cached.isNotEmpty()) {
            chatAdapter.submitItems(cached)
            scrollToBottom()
            if (showToast) {
                toast("تم عرض آخر نسخة محفوظة محلياً")
            }
        }
    }

    private fun fetchPresence() {
        ApiClient.api.getPresence(receiver).enqueue(object : Callback<ApiMessage> {
            override fun onResponse(call: Call<ApiMessage>, response: Response<ApiMessage>) {
                val body = response.body()
                binding.statusText.text = if (body?.is_online == true) {
                    "🟢 متصل الآن"
                } else {
                    "آخر ظهور: ${body?.last_seen?.replace('T', ' ')?.take(16) ?: "غير متاح"}"
                }
            }

            override fun onFailure(call: Call<ApiMessage>, t: Throwable) {
                binding.statusText.text = "تعذر جلب الحالة"
            }
        })
    }

    private fun confirmMessageAction(message: MessageItem) {
        val id = message.id ?: return
        // التمييز بين رسائلي ورسائل الطرف الآخر:
        // - رسائلي: تعديل + حذف لدي + حذف لدى الجميع
        // - رسائل الآخرين: حذف لدي فقط
        val isMine = (message.sender ?: "") == sender
        val options = if (isMine) {
            arrayOf("تعديل الرسالة", "حذف لدي", "حذف لدى الجميع")
        } else {
            arrayOf("حذف لدي")
        }
        AlertDialog.Builder(this)
            .setTitle("إدارة الرسالة")
            .setItems(options) { _, which ->
                if (isMine) {
                    when (which) {
                        0 -> promptEditMessage(id, message.displayMessage ?: message.message)
                        1 -> confirmDeleteScoped(id, scope = "me")
                        2 -> confirmDeleteScoped(id, scope = "everyone")
                    }
                } else {
                    confirmDeleteScoped(id, scope = "me")
                }
            }
            .setNegativeButton("إلغاء", null)
            .show()
    }

    private fun promptEditMessage(messageId: Int, currentText: String) {
        val input = android.widget.EditText(this).apply {
            setText(currentText)
            setSelection(text.length)
            hint = "تعديل الرسالة"
        }
        AlertDialog.Builder(this)
            .setTitle("تعديل الرسالة")
            .setView(input)
            .setPositiveButton("حفظ") { _, _ ->
                val updatedText = input.text?.toString()?.trim().orEmpty()
                if (updatedText.isEmpty()) {
                    toast("اكتب الرسالة الجديدة")
                    return@setPositiveButton
                }
                ApiClient.api.editMessage(mapOf("message_id" to messageId, "message" to updatedText))
                    .enqueue(object : Callback<ApiMessage> {
                        override fun onResponse(call: Call<ApiMessage>, response: Response<ApiMessage>) {
                            loadMessages(false)
                        }

                        override fun onFailure(call: Call<ApiMessage>, t: Throwable) {
                            toast(t.message ?: "تعذر تعديل الرسالة")
                        }
                    })
            }
            .setNegativeButton("إلغاء", null)
            .show()
    }

    private fun confirmDelete(messageId: Int) {
        // متروك للتوافق الخلفي - يستدعي حذف لدى الجميع
        confirmDeleteScoped(messageId, scope = "everyone")
    }

    private fun confirmDeleteScoped(messageId: Int, scope: String) {
        val (title, msg) = when (scope) {
            "me"        -> "حذف لدي" to "سيتم حذف الرسالة من جهازك فقط، وستظل ظاهرة لدى الطرف الآخر."
            "everyone"  -> "حذف لدى الجميع" to "سيتم حذف الرسالة لدى جميع المشاركين في المحادثة."
            else        -> "حذف الرسالة" to "هل تريد حذف هذه الرسالة؟"
        }
        AlertDialog.Builder(this)
            .setTitle(title)
            .setMessage(msg)
            .setPositiveButton("حذف") { _, _ ->
                val body = mapOf(
                    "message_id" to messageId,
                    "scope" to scope,
                    "requester_id" to sender
                )
                ApiClient.api.deleteMessage(body).enqueue(object : Callback<ApiMessage> {
                    override fun onResponse(call: Call<ApiMessage>, response: Response<ApiMessage>) {
                        loadMessages(false)
                    }

                    override fun onFailure(call: Call<ApiMessage>, t: Throwable) {
                        toast(t.message ?: "تعذر حذف الرسالة")
                    }
                })
            }
            .setNegativeButton("إلغاء", null)
            .show()
    }

    // حذف الدردشة كاملة (لدي / للجميع)
    private fun confirmDeleteConversation() {
        val options = arrayOf("حذف الدردشة لدي فقط", "حذف الدردشة لدى الجميع")
        AlertDialog.Builder(this)
            .setTitle("حذف الدردشة")
            .setItems(options) { _, which ->
                val scope = if (which == 0) "me" else "everyone"
                val confirmMsg = if (scope == "me") {
                    "سيتم حذف الدردشة من جهازك فقط."
                } else {
                    "سيتم حذف الدردشة لدى جميع المشاركين."
                }
                AlertDialog.Builder(this)
                    .setTitle("تأكيد")
                    .setMessage(confirmMsg)
                    .setPositiveButton("حذف") { _, _ ->
                        val body = mapOf(
                            "conversation_id" to receiver,
                            "requester_id" to sender,
                            "scope" to scope
                        )
                        ApiClient.api.deleteConversation(body).enqueue(object : Callback<ApiMessage> {
                            override fun onResponse(call: Call<ApiMessage>, response: Response<ApiMessage>) {
                                toast("تم حذف الدردشة")
                                loadMessages(false)
                            }

                            override fun onFailure(call: Call<ApiMessage>, t: Throwable) {
                                toast(t.message ?: "تعذر حذف الدردشة")
                            }
                        })
                    }
                    .setNegativeButton("إلغاء", null)
                    .show()
            }
            .setNegativeButton("إلغاء", null)
            .show()
    }

    private fun sendOnline(online: Boolean) {
        ApiClient.api.updateOnline(mapOf("online" to online)).enqueue(simpleCallback())
        SocketManager.emitPresence(sender, receiver, online)
    }

    private fun ensureSignalReady(silent: Boolean = false) {
        SignalProtocolManager.ensureInitialized(this, forceUpload = true) { ok, error ->
            if (!silent) {
                runOnUiThread {
                    toast(if (ok) "تم تجهيز التشفير الطرفي لهذه المحادثة" else (error ?: "تعذر تجهيز التشفير"))
                }
            }
        }
    }

    private fun startCall(mode: String, existingRoomId: String? = null) {
        val payload = linkedMapOf(
            "receiver" to receiver,
            "call_type" to mode,
        )
        if (!existingRoomId.isNullOrBlank()) {
            payload["room_id"] = existingRoomId
        }

        ApiClient.api.createCallToken(payload).enqueue(object : Callback<ApiMessage> {
            override fun onResponse(call: Call<ApiMessage>, response: Response<ApiMessage>) {
                val body = response.body()
                val callToken = body?.token
                val liveKitUrl = body?.livekit_url
                val roomId = body?.room_id

                if (!response.isSuccessful || callToken.isNullOrBlank() || liveKitUrl.isNullOrBlank() || roomId.isNullOrBlank()) {
                    toast(body?.message ?: "تعذر تجهيز المكالمة")
                    return
                }

                openCallScreen(mode = mode, roomId = roomId, liveKitUrl = liveKitUrl, token = callToken)
            }

            override fun onFailure(call: Call<ApiMessage>, t: Throwable) {
                toast(t.message ?: "فشل بدء المكالمة")
            }
        })
    }

    private fun showIncomingCallDialog(caller: String, callType: String, roomId: String) {
        callDialogVisible = true
        val title = if (callType == "video") "مكالمة فيديو واردة" else "مكالمة صوتية واردة"
        val message = "$caller بيتصل بيك دلوقتي"
        AlertDialog.Builder(this)
            .setTitle(title)
            .setMessage(message)
            .setCancelable(false)
            .setPositiveButton("رد") { _, _ ->
                callDialogVisible = false
                startCall(callType, roomId)
            }
            .setNegativeButton("رفض") { dialog, _ ->
                callDialogVisible = false
                dialog.dismiss()
            }
            .setOnDismissListener { callDialogVisible = false }
            .show()
    }

    private fun openCallScreen(mode: String, roomId: String, liveKitUrl: String, token: String) {
        val intent = CallActivity.newIntent(
            context = this,
            peerUsername = receiver,
            callMode = mode,
            roomId = roomId,
            liveKitUrl = liveKitUrl,
            token = token,
        )
        startActivity(intent)
    }

    private fun uploadAndSendFromUri(uri: Uri) {
        if (!ActionRateLimiter.allow("dm_media_$receiver", maxHits = 4, windowMs = 20_000L, minIntervalMs = 1_000L)) {
            toast("استنى شوية قبل إرسال ملفات جديدة")
            return
        }
        val mime = contentResolver.getType(uri).orEmpty()
        val type = when {
            mime.startsWith("image/") -> "image"
            mime.startsWith("video/") -> "video"
            mime.startsWith("audio/") -> "voice"
            else -> "file"
        }
        val file = copyUriToTempFile(uri, mime) ?: run {
            toast("تعذر قراءة الملف")
            return
        }
        uploadAndSendFile(file, mime, type)
    }

    private fun uploadAndSendFile(file: File, mime: String, type: String) {
        if (!NetworkMonitor.isConnected(this)) {
            toast("لازم الإنترنت يكون شغال لرفع الملفات")
            return
        }
        val requestFile = file.asRequestBody(mime.toMediaTypeOrNull())
        val part = MultipartBody.Part.createFormData("file", file.name, requestFile)
        ApiClient.api.uploadFile(part).enqueue(object : Callback<Map<String, String>> {
            override fun onResponse(call: Call<Map<String, String>>, response: Response<Map<String, String>>) {
                val url = response.body()?.get("file_url") ?: response.body()?.get("url")
                if (url.isNullOrBlank()) {
                    toast("تعذر رفع الملف")
                    return
                }
                val message = binding.msgInput.text.toString().trim()
                sendEncryptedPayload(message = message, type = type, mediaUrl = url)
            }

            override fun onFailure(call: Call<Map<String, String>>, t: Throwable) {
                toast(t.message ?: "فشل رفع الملف")
            }
        })
    }

    private fun toggleVoiceRecording() {
        if (isRecording) {
            stopVoiceRecording(releaseOnly = false)
            return
        }
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) {
            startVoiceRecording()
        } else {
            recordPermissionLauncher.launch(Manifest.permission.RECORD_AUDIO)
        }
    }

    @Suppress("DEPRECATION")
    private fun startVoiceRecording() {
        voiceFile = SecureMediaManager.createSecureTempFile(this, "voice_", ".m4a")
        recorder = MediaRecorder().apply {
            setAudioSource(MediaRecorder.AudioSource.MIC)
            setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
            setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
            setOutputFile(voiceFile?.absolutePath)
            prepare()
            start()
        }
        isRecording = true
        binding.voiceBtn.setImageResource(android.R.drawable.ic_media_pause)
        binding.typingText.text = "جاري تسجيل الرسالة الصوتية..."
    }

    private fun stopVoiceRecording(releaseOnly: Boolean) {
        val localRecorder = recorder ?: return
        runCatching { localRecorder.stop() }
        runCatching { localRecorder.reset() }
        runCatching { localRecorder.release() }
        recorder = null
        val file = voiceFile
        voiceFile = null
        isRecording = false
        binding.voiceBtn.setImageResource(android.R.drawable.ic_btn_speak_now)
        binding.typingText.text = ""
        if (!releaseOnly && file != null && file.exists()) {
            uploadAndSendFile(file, "audio/mp4", "voice")
        }
    }

    private fun copyUriToTempFile(uri: Uri, mime: String): File? {
        return runCatching {
            val ext = MimeTypeMap.getSingleton().getExtensionFromMimeType(mime)?.let { ".${it}" }
                ?: queryFileName(uri)?.substringAfterLast('.', "tmp")?.let { ".${it}" }
                ?: ".tmp"
            val file = SecureMediaManager.createSecureTempFile(this, "chat_upload_", ext)
            contentResolver.openInputStream(uri)?.use { input ->
                FileOutputStream(file).use { output -> input.copyTo(output) }
            }
            file
        }.getOrNull()
    }

    private fun queryFileName(uri: Uri): String? {
        return contentResolver.query(uri, null, null, null, null)?.use { cursor ->
            val index = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
            if (index >= 0 && cursor.moveToFirst()) cursor.getString(index) else null
        }
    }

    private fun cacheConversation() {
        ConversationCache.savePrivate(this, receiver, chatAdapter.currentItems())
    }

    private fun scrollToBottom() {
        val count = chatAdapter.itemCount
        if (count > 0) {
            binding.chatRecycler.scrollToPosition(count - 1)
        }
    }

    private fun defaultMediaLabel(type: String): String = when (type) {
        "image" -> "📷 صورة"
        "video" -> "🎬 فيديو"
        "voice" -> "🎤 رسالة صوتية"
        else -> "📎 ملف"
    }

    private fun nowTimestamp(): String {
        return SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault()).format(Date())
    }

    private fun toast(message: String) {
        Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
    }

    private fun simpleCallback() = object : Callback<ApiMessage> {
        override fun onResponse(call: Call<ApiMessage>, response: Response<ApiMessage>) = Unit
        override fun onFailure(call: Call<ApiMessage>, t: Throwable) = Unit
    }
}
