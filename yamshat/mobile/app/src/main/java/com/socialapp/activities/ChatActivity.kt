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
import android.widget.EditText
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
import com.socialapp.utils.SecureMediaManager
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
import java.text.SimpleDateFormat
import java.util.Date
import java.util.LinkedHashMap
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
    private var voiceRecordingStartedAt = 0L
    private var lastTypingAt = 0L
    private var callDialogVisible = false
    private var replyingTo: MessageItem? = null

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
            if (!isRecording) {
                binding.typingText.text = if (payload.optBoolean("is_typing", false)) "يكتب الآن..." else ""
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        ActivitySecurity.enableSecureWindow(this)
        binding = ActivityChatBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.chatTitle.text = receiver
        chatAdapter = ChatAdapter(mutableListOf(), sender) { message -> showMessageActions(message) }
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
        binding.clearReplyBtn.setOnClickListener { clearReplyState() }
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
        updateReplyPreview()
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
        chatAdapter.release()
    }

    private val clearTypingRunnable = Runnable {
        if (!isRecording) {
            binding.typingText.text = ""
        }
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

    private fun sendEncryptedPayload(
        message: String,
        type: String,
        mediaUrl: String? = null,
        retryCount: Int = 0,
        voiceDurationMs: Long? = null,
    ) {
        val replySource = replyingTo
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
                    displayMessage = message.ifBlank { defaultMediaLabel(type) },
                    reply_to_id = replySource?.id,
                    reply_to_sender = replySource?.sender,
                    reply_to_message = replySource?.displayMessage ?: replySource?.content ?: replySource?.message,
                    voice_duration_ms = voiceDurationMs,
                    client_id = "android_${System.currentTimeMillis()}",
                )

                if (retryCount == 0) {
                    chatAdapter.appendItem(optimisticMessage)
                    scrollToBottom()
                } else {
                    chatAdapter.replaceItem(optimisticMessage.copy(status = "sending"))
                }

                cacheConversation()

                val requestPayload = linkedMapOf<String, Any?>(
                    "receiver" to receiver,
                    "encrypted_message" to encrypted,
                    "type" to type,
                    "client_id" to optimisticMessage.client_id,
                    "media_url" to mediaUrl,
                    "reply_to_id" to replySource?.id,
                    "reply_to_message" to optimisticMessage.reply_to_message,
                    "voice_duration_ms" to voiceDurationMs,
                )

                if (!NetworkMonitor.isConnected(this)) {
                    toast("أنت أوفلاين، الرسالة اتحفظت محلياً لحد ما ترجع الشبكة")
                    binding.msgInput.setText("")
                    clearReplyState()
                    return@runOnUiThread
                }

                ApiClient.api.sendMessage(requestPayload).enqueue(object : Callback<ApiMessage> {
                    override fun onResponse(call: Call<ApiMessage>, response: Response<ApiMessage>) {
                        if (response.isSuccessful) {
                            binding.msgInput.setText("")
                            clearReplyState()
                            chatAdapter.replaceItem(optimisticMessage.copy(status = "sent"))
                            cacheConversation()
                            ApiClient.api.track(mapOf("event" to "send_message")).enqueue(simpleCallback())
                        } else {
                            handleSendFailure(optimisticMessage, message, type, mediaUrl, retryCount, voiceDurationMs)
                        }
                    }

                    override fun onFailure(call: Call<ApiMessage>, t: Throwable) {
                        handleSendFailure(optimisticMessage, message, type, mediaUrl, retryCount, voiceDurationMs)
                    }
                })
            }
        }
    }

    private fun handleSendFailure(
        item: MessageItem,
        message: String,
        type: String,
        mediaUrl: String?,
        retryCount: Int,
        voiceDurationMs: Long?,
    ) {
        if (retryCount < 3) {
            handler.postDelayed({
                replyingTo = item.reply_to_message?.let {
                    MessageItem(id = item.reply_to_id, sender = item.reply_to_sender.orEmpty(), message = it, displayMessage = it)
                }
                sendEncryptedPayload(message, type, mediaUrl, retryCount + 1, voiceDurationMs)
            }, 2000L * (retryCount + 1))
        } else {
            item.status = "failed"
            chatAdapter.replaceItem(item)
            cacheConversation()
        }
    }

    private fun loadMessages(scrollToBottom: Boolean) {
        val cachedSnapshot = ConversationCache.loadPrivate(this, receiver)
        ApiClient.api.getMessages(receiver)
            .enqueue(object : Callback<List<MessageItem>> {
                override fun onResponse(call: Call<List<MessageItem>>, response: Response<List<MessageItem>>) {
                    val items = response.body().orEmpty().map { remote ->
                        val rawContent = remote.content ?: remote.message
                        val displayText = if (remote.deleted == true) {
                            "تم حذف هذه الرسالة"
                        } else {
                            val signalText = SignalProtocolManager.decryptIncoming(
                                this@ChatActivity,
                                remote.sender,
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
                        remote.copy(displayMessage = displayText)
                    }
                    val merged = mergeCachedDecorations(items, cachedSnapshot)
                    chatAdapter.submitItems(merged)
                    ConversationCache.savePrivate(this@ChatActivity, receiver, merged)
                    if (scrollToBottom && merged.isNotEmpty()) {
                        binding.chatRecycler.scrollToPosition(merged.lastIndex)
                    }
                    ApiClient.api.messageSeen(mapOf("sender" to receiver)).enqueue(simpleCallback())
                }

                override fun onFailure(call: Call<List<MessageItem>>, t: Throwable) {
                    loadCachedMessages(showToast = scrollToBottom)
                    if (scrollToBottom) toast(t.message ?: "تعذر تحميل الرسائل")
                }
            })
    }

    private fun mergeCachedDecorations(remote: List<MessageItem>, cached: List<MessageItem>): List<MessageItem> {
        if (cached.isEmpty()) return remote
        val byId = cached.associateBy { it.id }
        val byKey = cached.associateBy { it.localStableKey() }
        return remote.map { item ->
            val cachedItem = item.id?.let(byId::get) ?: byKey[item.localStableKey()]
            if (cachedItem == null) {
                item
            } else {
                item.copy(
                    reactions = if (cachedItem.reactions.isNotEmpty()) cachedItem.reactions else item.reactions,
                    reply_to_id = cachedItem.reply_to_id ?: item.reply_to_id,
                    reply_to_sender = cachedItem.reply_to_sender ?: item.reply_to_sender,
                    reply_to_message = cachedItem.reply_to_message ?: item.reply_to_message,
                    voice_duration_ms = cachedItem.voice_duration_ms ?: item.voice_duration_ms,
                    displayMessage = if (!cachedItem.displayMessage.isNullOrBlank()) cachedItem.displayMessage else item.displayMessage,
                ).also { merged ->
                    merged.status = item.status ?: cachedItem.status
                }
            }
        }
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

    private fun showMessageActions(message: MessageItem) {
        val actions = mutableListOf<Pair<String, () -> Unit>>()
        actions += "الرد على الرسالة" to { startReply(message) }
        actions += "إضافة ❤️" to { addReaction(message, "❤️") }
        actions += "إضافة 👍" to { addReaction(message, "👍") }
        actions += "إضافة 😂" to { addReaction(message, "😂") }
        if (message.sender == sender && message.deleted != true) {
            actions += "تعديل الرسالة" to { promptEditMessage(message) }
            actions += "Delete For Everyone" to { confirmDelete(message) }
        }
        AlertDialog.Builder(this)
            .setTitle("إدارة الرسالة")
            .setItems(actions.map { it.first }.toTypedArray()) { _, which -> actions[which].second.invoke() }
            .setNegativeButton("إلغاء", null)
            .show()
    }

    private fun startReply(message: MessageItem) {
        replyingTo = message
        updateReplyPreview()
        binding.msgInput.requestFocus()
    }

    private fun clearReplyState() {
        replyingTo = null
        updateReplyPreview()
    }

    private fun updateReplyPreview() {
        val reply = replyingTo
        if (reply == null) {
            binding.replyPreviewCard.visibility = android.view.View.GONE
            return
        }
        binding.replyPreviewCard.visibility = android.view.View.VISIBLE
        binding.replyPreviewSender.text = reply.sender.ifBlank { receiver }
        binding.replyPreviewText.text = reply.displayMessage ?: reply.content ?: reply.message
    }

    private fun addReaction(message: MessageItem, emoji: String) {
        val current = chatAdapter.currentItems().toMutableList()
        val index = current.indexOfFirst { it.localStableKey() == message.localStableKey() || (message.id != null && it.id == message.id) }
        if (index < 0) return
        val target = current[index]
        val updatedReactions = LinkedHashMap(target.reactions)
        updatedReactions[emoji] = (updatedReactions[emoji] ?: 0) + 1
        val updated = target.copy(reactions = updatedReactions)
        current[index] = updated
        chatAdapter.submitItems(current)
        cacheConversation()
        ApiClient.api.track(mapOf("event" to "reaction_$emoji")).enqueue(simpleCallback())
    }

    private fun promptEditMessage(message: MessageItem) {
        val messageId = message.id ?: return
        val input = EditText(this).apply {
            setText(message.displayMessage ?: message.message)
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

    private fun confirmDelete(message: MessageItem) {
        val messageId = message.id ?: return
        AlertDialog.Builder(this)
            .setTitle("حذف الرسالة")
            .setMessage("هل تريد حذف الرسالة للطرفين؟")
            .setPositiveButton("حذف للجميع") { _, _ ->
                ApiClient.api.deleteMessage(mapOf("message_id" to messageId)).enqueue(object : Callback<ApiMessage> {
                    override fun onResponse(call: Call<ApiMessage>, response: Response<ApiMessage>) {
                        val current = chatAdapter.currentItems().toMutableList()
                        val index = current.indexOfFirst { it.localStableKey() == message.localStableKey() || it.id == message.id }
                        if (index >= 0) {
                            current[index] = current[index].copy(deleted = true, displayMessage = "تم حذف هذه الرسالة").also {
                                it.status = "deleted"
                            }
                            chatAdapter.submitItems(current)
                            cacheConversation()
                        }
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

    private fun uploadAndSendFile(file: File, mime: String, type: String, voiceDurationMs: Long? = null) {
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
                sendEncryptedPayload(message = message, type = type, mediaUrl = url, voiceDurationMs = voiceDurationMs)
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
        voiceRecordingStartedAt = System.currentTimeMillis()
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
        val durationMs = (System.currentTimeMillis() - voiceRecordingStartedAt).coerceAtLeast(1_000L)
        voiceFile = null
        isRecording = false
        voiceRecordingStartedAt = 0L
        binding.voiceBtn.setImageResource(android.R.drawable.ic_btn_speak_now)
        binding.typingText.text = ""
        if (!releaseOnly && file != null && file.exists()) {
            uploadAndSendFile(file, "audio/mp4", "voice", durationMs)
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
