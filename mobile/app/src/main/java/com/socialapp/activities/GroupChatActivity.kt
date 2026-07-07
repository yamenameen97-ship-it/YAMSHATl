package com.socialapp.activities

import android.Manifest
import android.content.pm.PackageManager
import android.media.MediaRecorder
import android.net.Uri
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.text.Editable
import android.text.TextWatcher
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.LinearLayoutManager
import com.bumptech.glide.Glide
import com.bumptech.glide.load.engine.DiskCacheStrategy
import com.socialapp.adapters.GroupMessageAdapter
import com.socialapp.databinding.ActivityGroupChatBinding
import com.socialapp.models.ApiMessage
import com.socialapp.models.GroupInfo
import com.socialapp.models.GroupMember
import com.socialapp.models.GroupMessage
import com.socialapp.network.ApiClient
import com.socialapp.network.SessionManager
import com.socialapp.realtime.SocketManager
import com.socialapp.signal.SignalProtocolManager
import com.socialapp.utils.ActionRateLimiter
import com.socialapp.utils.ActivitySecurity
import com.socialapp.utils.AppAnalytics
import com.socialapp.utils.ConversationCache
import com.socialapp.utils.CryptoManager
import com.socialapp.utils.SecureMediaManager
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
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * GroupChatActivity — v85.1
 * Fixes:
 *  - محاذاة الحقول مع GroupMessage الموحّد (senderUsername/content/messageType/isDeleted/id:String)
 *  - إضافة أزرار: إزالة عضو، ترقية إلى أدمن (الإصلاح #3)
 *  - إضافة زر مغادرة المجموعة داخل إعدادات المجموعة (الإصلاح #4)
 *  - إضافة زر تعديل / حذف المجموعة (للمالك فقط)
 */
class GroupChatActivity : AppCompatActivity() {
    private lateinit var binding: ActivityGroupChatBinding
    private lateinit var messageAdapter: GroupMessageAdapter
    private val groupId by lazy { intent.getIntExtra("group_id", 0) }
    private val currentUser by lazy { SessionManager.getUsername().ifBlank { "User1" } }
    private val token by lazy { SessionManager.getToken().orEmpty() }
    private val handler = Handler(Looper.getMainLooper())
    private var recorder: MediaRecorder? = null
    private var voiceFile: File? = null
    private var isRecording = false
    private var lastTypingAt = 0L
    private var groupMembers = listOf<GroupMember>()
    private var currentGroup: GroupInfo? = null

    private val mediaPicker = registerForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
        uri?.let { uploadAndSendFromUri(it) }
    }

    private val recordPermissionLauncher = registerForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
        if (granted) startVoiceRecording() else toast("مطلوب إذن الميكروفون")
    }

    private val refreshListener = Emitter.Listener { runOnUiThread { loadGroupMessages(false) } }
    private val typingListener = Emitter.Listener { args ->
        val payload = args.firstOrNull() as? JSONObject ?: return@Listener
        if (payload.optInt("group_id") != groupId) return@Listener
        runOnUiThread {
            binding.typingText.text = if (payload.optBoolean("is_typing", false)) {
                "${payload.optString("user")} يكتب الآن..."
            } else {
                ""
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        ActivitySecurity.enableSecureWindow(this)
        binding = ActivityGroupChatBinding.inflate(layoutInflater)
        setContentView(binding.root)

        if (groupId == 0) {
            toast("معرف المجموعة غير صحيح")
            finish()
            return
        }

        messageAdapter = GroupMessageAdapter(
            mutableListOf(),
            currentUser,
            onLongClick = { message -> confirmDelete(message) },
            onReactionClick = { message, emoji -> addReaction(message, emoji) }
        )
        binding.messagesRecycler.layoutManager = LinearLayoutManager(this).apply { stackFromEnd = true }
        binding.messagesRecycler.adapter = messageAdapter
        binding.messagesRecycler.setHasFixedSize(true)
        binding.messagesRecycler.setItemViewCacheSize(20)

        binding.sendBtn.setOnClickListener { sendTextMessage() }
        binding.attachBtn.setOnClickListener { mediaPicker.launch(arrayOf("image/*", "video/*", "audio/*")) }
        binding.voiceBtn.setOnClickListener { toggleVoiceRecording() }
        binding.reactionsBtn.setOnClickListener { showReactionsMenu() }
        binding.membersBtn.setOnClickListener { showMembersDialog() }
        binding.settingsBtn.setOnClickListener { showGroupSettings() }

        binding.msgInput.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) = Unit
            override fun afterTextChanged(s: Editable?) = Unit
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                val now = System.currentTimeMillis()
                if (now - lastTypingAt > 900) {
                    lastTypingAt = now
                    val typing = !s.isNullOrBlank()
                    ApiClient.api.groupTyping(groupId, mapOf("is_typing" to typing)).enqueue(simpleCallback())
                    SocketManager.emitGroupTyping(groupId, currentUser, typing)
                    handler.removeCallbacks(clearTypingRunnable)
                    if (typing) handler.postDelayed(clearTypingRunnable, 1500)
                }
            }
        })

        loadCachedMessages(showToast = false)
        loadGroupInfo()
        loadGroupMembers()
        loadGroupMessages(true)
    }

    override fun onResume() {
        super.onResume()
        AppAnalytics.trackScreen("group_chat_$groupId")
        SocketManager.connectSocket(token, onConnected = {
            SocketManager.joinGroupRoom(groupId, currentUser, token)
            runOnUiThread { loadGroupMessages(false) }
        })
        registerSocketListeners()
    }

    override fun onPause() {
        super.onPause()
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
        ApiClient.api.groupTyping(groupId, mapOf("is_typing" to false)).enqueue(simpleCallback())
        SocketManager.emitGroupTyping(groupId, currentUser, false)
    }

    private fun registerSocketListeners() {
        SocketManager.on("new_group_message", refreshListener)
        SocketManager.on("group_message_deleted", refreshListener)
        SocketManager.on("group_messages_seen", refreshListener)
        SocketManager.on("group_typing_update", typingListener)
    }

    private fun unregisterSocketListeners() {
        SocketManager.off("new_group_message", refreshListener)
        SocketManager.off("group_message_deleted", refreshListener)
        SocketManager.off("group_messages_seen", refreshListener)
        SocketManager.off("group_typing_update", typingListener)
    }

    private fun loadGroupInfo() {
        ApiClient.api.getGroupInfo(groupId).enqueue(object : Callback<GroupInfo> {
            override fun onResponse(call: Call<GroupInfo>, response: Response<GroupInfo>) {
                val group = response.body() ?: return
                currentGroup = group
                binding.groupTitle.text = group.name
                binding.membersCount.text = "${group.membersCount} أعضاء"
                if (!group.avatarUrl.isNullOrEmpty()) {
                    Glide.with(this@GroupChatActivity)
                        .load(group.avatarUrl)
                        .diskCacheStrategy(DiskCacheStrategy.NONE)
                        .centerCrop()
                        .into(binding.groupAvatar)
                }
            }

            override fun onFailure(call: Call<GroupInfo>, t: Throwable) {
                toast(t.message ?: "فشل تحميل معلومات المجموعة")
            }
        })
    }

    private fun loadGroupMembers() {
        ApiClient.api.getGroupMembers(groupId).enqueue(object : Callback<List<GroupMember>> {
            override fun onResponse(call: Call<List<GroupMember>>, response: Response<List<GroupMember>>) {
                groupMembers = response.body().orEmpty()
            }

            override fun onFailure(call: Call<List<GroupMember>>, t: Throwable) {
                toast(t.message ?: "فشل تحميل الأعضاء")
            }
        })
    }

    private fun loadGroupMessages(scrollToBottom: Boolean) {
        ApiClient.api.getGroupMessages(groupId, 50).enqueue(object : Callback<List<GroupMessage>> {
            override fun onResponse(call: Call<List<GroupMessage>>, response: Response<List<GroupMessage>>) {
                val items = response.body().orEmpty().map {
                    val rawContent = it.content
                    val displayText = if (it.isDeleted) {
                        "تم حذف هذه الرسالة"
                    } else {
                        val signalText = SignalProtocolManager.decryptIncoming(
                            this@GroupChatActivity,
                            it.senderUsername,
                            rawContent,
                        )
                        if (signalText != rawContent) {
                            signalText
                        } else {
                            CryptoManager.decrypt(
                                this@GroupChatActivity,
                                currentUser,
                                "group_$groupId",
                                rawContent,
                            )
                        }
                    }
                    it.copy(displayMessage = displayText)
                }
                messageAdapter.submitItems(items)
                ConversationCache.saveGroup(this@GroupChatActivity, groupId, items)
                if (scrollToBottom && items.isNotEmpty()) {
                    binding.messagesRecycler.scrollToPosition(items.lastIndex)
                }
                items.lastOrNull()?.takeIf { it.id.isNotBlank() }?.let { last ->
                    ApiClient.api.markGroupMessageSeen(groupId, last.id).enqueue(simpleCallback())
                }
            }

            override fun onFailure(call: Call<List<GroupMessage>>, t: Throwable) {
                loadCachedMessages(showToast = scrollToBottom)
                if (scrollToBottom) toast(t.message ?: "تعذر تحميل الرسائل")
            }
        })
    }

    private fun loadCachedMessages(showToast: Boolean) {
        val cached = ConversationCache.loadGroup(this, groupId)
        if (cached.isNotEmpty()) {
            messageAdapter.submitItems(cached)
            scrollToBottom()
            if (showToast) toast("تم عرض آخر نسخة محفوظة محلياً")
        }
    }

    private fun sendTextMessage() {
        if (!ActionRateLimiter.allow("group_send_$groupId", maxHits = 8, windowMs = 20_000L, minIntervalMs = 650L)) {
            toast("أنت بتبعت بسرعة زيادة، اهدى ثانية")
            return
        }
        val message = binding.msgInput.text.toString().trim()
        if (message.isEmpty()) return
        sendEncryptedPayload(message = message, type = "text")
    }

    private fun sendEncryptedPayload(message: String, type: String, mediaUrl: String? = null) {
        SignalProtocolManager.encryptOutgoing(this, "group_$groupId", message.ifBlank { type }) { encrypted, error ->
            runOnUiThread {
                if (encrypted == null) {
                    toast(error ?: "فشل تشفير الرسالة")
                    return@runOnUiThread
                }

                val optimisticMessage = GroupMessage(
                    senderUsername = currentUser,
                    senderDisplayName = currentUser,
                    content = message,
                    messageType = type,
                    mediaUrl = mediaUrl,
                    status = if (NetworkMonitor.isConnected(this)) "sending" else "pending",
                    createdAt = nowTimestamp(),
                    displayMessage = message.ifBlank { defaultMediaLabel(type) },
                    isOwn = true,
                )
                messageAdapter.addMessage(optimisticMessage)
                scrollToBottom()
                cacheConversation()

                if (!NetworkMonitor.isConnected(this)) {
                    toast("أنت أوفلاين، الرسالة اتحفظت محلياً لحد ما ترجع الشبكة")
                    binding.msgInput.setText("")
                    return@runOnUiThread
                }

                val clientId = "android_${System.currentTimeMillis()}"
                ApiClient.api.sendGroupMessage(
                    groupId,
                    mapOf(
                        "content" to encrypted,
                        "message_type" to type,
                        "client_id" to clientId,
                        "media_url" to mediaUrl,
                    )
                ).enqueue(object : Callback<ApiMessage> {
                    override fun onResponse(call: Call<ApiMessage>, response: Response<ApiMessage>) {
                        binding.msgInput.setText("")
                        ApiClient.api.track(mapOf("event" to "send_group_message")).enqueue(simpleCallback())
                        loadGroupMessages(true)
                    }

                    override fun onFailure(call: Call<ApiMessage>, t: Throwable) {
                        toast(t.message ?: "فشل إرسال الرسالة")
                    }
                })
            }
        }
    }

    private fun uploadAndSendFromUri(uri: Uri) {
        if (!ActionRateLimiter.allow("group_media_$groupId", maxHits = 4, windowMs = 20_000L, minIntervalMs = 1_000L)) {
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
        voiceFile = SecureMediaManager.createSecureTempFile(this, "group_voice_", ".m4a")
        recorder = MediaRecorder().apply {
            setAudioSource(MediaRecorder.AudioSource.MIC)
            setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
            setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
            setOutputFile(voiceFile?.absolutePath)
            prepare()
            start()
        }
        isRecording = true
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
        binding.typingText.text = ""
        if (!releaseOnly && file != null && file.exists()) {
            uploadAndSendFile(file, "audio/mp4", "voice")
        }
    }

    private fun copyUriToTempFile(uri: Uri, mime: String): File? {
        return runCatching {
            val ext = when {
                mime.startsWith("image/") -> ".jpg"
                mime.startsWith("video/") -> ".mp4"
                mime.startsWith("audio/") -> ".m4a"
                else -> ".tmp"
            }
            val file = SecureMediaManager.createSecureTempFile(this, "group_upload_", ext)
            contentResolver.openInputStream(uri)?.use { input ->
                FileOutputStream(file).use { output -> input.copyTo(output) }
            }
            file
        }.getOrNull()
    }

    private fun confirmDelete(message: GroupMessage) {
        if (message.id.isBlank()) return
        AlertDialog.Builder(this)
            .setTitle("حذف الرسالة")
            .setMessage("هل تريد حذف الرسالة للجميع؟")
            .setPositiveButton("حذف") { _, _ ->
                ApiClient.api.deleteGroupMessage(groupId, message.id).enqueue(object : Callback<ApiMessage> {
                    override fun onResponse(call: Call<ApiMessage>, response: Response<ApiMessage>) {
                        loadGroupMessages(false)
                    }

                    override fun onFailure(call: Call<ApiMessage>, t: Throwable) {
                        toast(t.message ?: "تعذر حذف الرسالة")
                    }
                })
            }
            .setNegativeButton("إلغاء", null)
            .show()
    }

    private fun addReaction(message: GroupMessage, emoji: String) {
        if (message.id.isBlank()) return
        ApiClient.api.addGroupMessageReaction(groupId, message.id, mapOf("emoji" to emoji)).enqueue(object : Callback<ApiMessage> {
            override fun onResponse(call: Call<ApiMessage>, response: Response<ApiMessage>) {
                loadGroupMessages(false)
            }

            override fun onFailure(call: Call<ApiMessage>, t: Throwable) {
                toast(t.message ?: "تعذر إضافة التفاعل")
            }
        })
    }

    private fun showReactionsMenu() {
        val emojis = arrayOf("👍", "❤️", "🔥", "😂", "👏", "🎉")
        AlertDialog.Builder(this)
            .setTitle("إرسال تفاعل سريع")
            .setItems(emojis) { _, which ->
                val selected = emojis[which]
                binding.msgInput.append(" $selected")
            }
            .show()
    }

    /**
     * الإصلاح #3: نافذة الأعضاء الجديدة — تدعم الضغط لعرض إجراءات الإدارة
     * (إزالة، ترقية إلى أدمن) للمالك فقط.
     */
    private fun showMembersDialog() {
        val members = groupMembers
        if (members.isEmpty()) {
            AlertDialog.Builder(this)
                .setTitle("أعضاء المجموعة")
                .setMessage("لا يوجد أعضاء متاحين حالياً")
                .setPositiveButton("إغلاق", null)
                .show()
            return
        }

        val items = members.map { member ->
            val state = if (member.isOnline) "🟢" else "⚪"
            val badge = when (member.role.lowercase()) {
                "owner" -> " 👑"
                "admin" -> " ⭐"
                else -> ""
            }
            "$state ${member.displayName.ifBlank { member.username }}$badge"
        }.toTypedArray()

        AlertDialog.Builder(this)
            .setTitle("أعضاء المجموعة (${members.size})")
            .setItems(items) { _, which -> onMemberSelected(members[which]) }
            .setPositiveButton("إغلاق", null)
            .show()
    }

    private fun onMemberSelected(member: GroupMember) {
        val group = currentGroup
        val canModerate = group != null && (group.isOwner || group.isAdmin) &&
            member.username != currentUser &&
            member.role.lowercase() != "owner"

        if (!canModerate) {
            AlertDialog.Builder(this)
                .setTitle(member.displayName.ifBlank { member.username })
                .setMessage("الدور: ${member.role} — منضم منذ: ${member.joinedAt.take(10)}")
                .setPositiveButton("إغلاق", null)
                .show()
            return
        }

        val options = arrayOf(
            if (member.role.lowercase() == "admin") "إزالة الأدمن" else "ترقية إلى أدمن",
            "إزالة من المجموعة"
        )
        AlertDialog.Builder(this)
            .setTitle(member.displayName.ifBlank { member.username })
            .setItems(options) { _, which ->
                when (which) {
                    0 -> promoteMember(member)
                    1 -> confirmRemoveMember(member)
                }
            }
            .setNegativeButton("إلغاء", null)
            .show()
    }

    private fun promoteMember(member: GroupMember) {
        val newRole = if (member.role.lowercase() == "admin") "member" else "admin"
        ApiClient.api.promoteGroupMember(groupId, member.username, mapOf("role" to newRole))
            .enqueue(object : Callback<ApiMessage> {
                override fun onResponse(call: Call<ApiMessage>, response: Response<ApiMessage>) {
                    toast(if (newRole == "admin") "تمت الترقية" else "تمت إزالة صلاحيات الأدمن")
                    loadGroupMembers()
                }

                override fun onFailure(call: Call<ApiMessage>, t: Throwable) {
                    toast(t.message ?: "تعذر تنفيذ العملية")
                }
            })
    }

    private fun confirmRemoveMember(member: GroupMember) {
        AlertDialog.Builder(this)
            .setTitle("إزالة العضو")
            .setMessage("هل أنت متأكد من إزالة ${member.displayName.ifBlank { member.username }}؟")
            .setPositiveButton("إزالة") { _, _ ->
                ApiClient.api.removeGroupMember(groupId, member.username).enqueue(object : Callback<ApiMessage> {
                    override fun onResponse(call: Call<ApiMessage>, response: Response<ApiMessage>) {
                        toast("تمت إزالة العضو")
                        loadGroupMembers()
                    }

                    override fun onFailure(call: Call<ApiMessage>, t: Throwable) {
                        toast(t.message ?: "تعذر إزالة العضو")
                    }
                })
            }
            .setNegativeButton("إلغاء", null)
            .show()
    }

    /**
     * الإصلاح #4: قائمة إعدادات موسّعة تشمل زر مغادرة المجموعة،
     * وحذف المجموعة (للمالك)، وتحديث المحتوى.
     */
    private fun showGroupSettings() {
        val group = currentGroup
        val isOwner = group?.isOwner == true

        val optionsList = mutableListOf(
            "🔄 تحديث الرسائل",
            "👥 إعادة تحميل الأعضاء",
            "🚪 مغادرة المجموعة"
        )
        if (isOwner) {
            optionsList.add("🗑️ حذف المجموعة")
        }

        AlertDialog.Builder(this)
            .setTitle("إعدادات المجموعة")
            .setItems(optionsList.toTypedArray()) { _, which ->
                when (which) {
                    0 -> loadGroupMessages(true)
                    1 -> loadGroupMembers()
                    2 -> confirmLeaveGroup()
                    3 -> if (isOwner) confirmDeleteGroup()
                }
            }
            .setNegativeButton("إلغاء", null)
            .show()
    }

    private fun confirmLeaveGroup() {
        AlertDialog.Builder(this)
            .setTitle("مغادرة المجموعة")
            .setMessage("هل تريد فعلاً الخروج من المجموعة؟ لن تصلك الرسائل بعد الآن.")
            .setPositiveButton("مغادرة") { _, _ ->
                ApiClient.api.leaveGroup(groupId).enqueue(object : Callback<ApiMessage> {
                    override fun onResponse(call: Call<ApiMessage>, response: Response<ApiMessage>) {
                        toast("تمت مغادرة المجموعة")
                        finish()
                    }

                    override fun onFailure(call: Call<ApiMessage>, t: Throwable) {
                        toast(t.message ?: "تعذر مغادرة المجموعة")
                    }
                })
            }
            .setNegativeButton("إلغاء", null)
            .show()
    }

    private fun confirmDeleteGroup() {
        AlertDialog.Builder(this)
            .setTitle("حذف المجموعة")
            .setMessage("سيتم حذف المجموعة نهائياً لجميع الأعضاء. لا يمكن التراجع عن هذه العملية. متأكد؟")
            .setPositiveButton("حذف نهائي") { _, _ ->
                ApiClient.api.deleteGroup(groupId).enqueue(object : Callback<ApiMessage> {
                    override fun onResponse(call: Call<ApiMessage>, response: Response<ApiMessage>) {
                        toast("تم حذف المجموعة")
                        finish()
                    }

                    override fun onFailure(call: Call<ApiMessage>, t: Throwable) {
                        toast(t.message ?: "تعذر حذف المجموعة")
                    }
                })
            }
            .setNegativeButton("إلغاء", null)
            .show()
    }

    private fun cacheConversation() {
        ConversationCache.saveGroup(this, groupId, messageAdapter.currentItems())
    }

    private fun scrollToBottom() {
        val count = messageAdapter.itemCount
        if (count > 0) {
            binding.messagesRecycler.scrollToPosition(count - 1)
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
