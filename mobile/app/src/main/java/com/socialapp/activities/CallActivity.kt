package com.socialapp.activities

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import com.socialapp.databinding.ActivityCallBinding
import com.socialapp.utils.AppAnalytics
import io.livekit.android.LiveKit
import io.livekit.android.events.RoomEvent
import io.livekit.android.room.Room
import io.livekit.android.room.track.VideoTrack
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.launch

class CallActivity : AppCompatActivity() {

    private lateinit var binding: ActivityCallBinding
    private lateinit var room: Room
    private var roomEventsJob: Job? = null
    private var remoteVideoTrack: VideoTrack? = null
    private var localVideoTrack: VideoTrack? = null
    private var isMicEnabled = true
    private var isCameraEnabled = true

    private val peerUsername by lazy { intent.getStringExtra(EXTRA_PEER_USERNAME).orEmpty() }
    private val callMode by lazy { intent.getStringExtra(EXTRA_CALL_MODE)?.lowercase().orEmpty().ifBlank { MODE_AUDIO } }
    private val liveKitUrl by lazy { intent.getStringExtra(EXTRA_LIVEKIT_URL).orEmpty() }
    private val accessToken by lazy { intent.getStringExtra(EXTRA_TOKEN).orEmpty() }
    private val roomId by lazy { intent.getStringExtra(EXTRA_ROOM_ID).orEmpty() }
    private val isVideoCall by lazy { callMode == MODE_VIDEO }

    private val permissionsLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { result ->
        val audioGranted = result[Manifest.permission.RECORD_AUDIO] == true ||
            ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED
        val cameraGranted = !isVideoCall ||
            result[Manifest.permission.CAMERA] == true ||
            ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED

        if (audioGranted && cameraGranted) {
            connectToRoom()
        } else {
            toast("لازم سماح المايك${if (isVideoCall) " والكاميرا" else ""} علشان المكالمة تشتغل")
            finish()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityCallBinding.inflate(layoutInflater)
        setContentView(binding.root)

        if (peerUsername.isBlank() || liveKitUrl.isBlank() || accessToken.isBlank()) {
            toast("بيانات المكالمة ناقصة")
            finish()
            return
        }

        binding.peerName.text = peerUsername
        binding.callModeText.text = if (isVideoCall) "مكالمة فيديو • غرفة $roomId" else "مكالمة صوتية • غرفة $roomId"
        binding.statusText.text = "جاري تجهيز اتصال WebRTC..."
        binding.cameraBtn.visibility = if (isVideoCall) View.VISIBLE else View.GONE
        binding.localRenderer.visibility = if (isVideoCall) View.VISIBLE else View.GONE
        binding.remoteRenderer.visibility = if (isVideoCall) View.VISIBLE else View.INVISIBLE
        binding.waitingLabel.visibility = View.VISIBLE

        binding.micBtn.setOnClickListener { toggleMicrophone() }
        binding.cameraBtn.setOnClickListener { toggleCamera() }
        binding.endCallBtn.setOnClickListener { finishCall() }

        room = LiveKit.create(applicationContext)
        room.initVideoRenderer(binding.remoteRenderer)
        room.initVideoRenderer(binding.localRenderer)

        requestPermissionsAndStart()
    }

    override fun onResume() {
        super.onResume()
        AppAnalytics.trackScreen(if (isVideoCall) "video_call" else "audio_call")
    }

    override fun onDestroy() {
        remoteVideoTrack?.removeRenderer(binding.remoteRenderer)
        localVideoTrack?.removeRenderer(binding.localRenderer)
        roomEventsJob?.cancel()
        runCatching { room.disconnect() }
        runCatching { room.release() }
        runCatching { binding.remoteRenderer.release() }
        runCatching { binding.localRenderer.release() }
        super.onDestroy()
    }

    private fun requestPermissionsAndStart() {
        val needed = mutableListOf(Manifest.permission.RECORD_AUDIO)
        if (isVideoCall) needed += Manifest.permission.CAMERA
        val missing = needed.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }
        if (missing.isEmpty()) {
            connectToRoom()
        } else {
            permissionsLauncher.launch(missing.toTypedArray())
        }
    }

    private fun connectToRoom() {
        binding.statusText.text = "جاري الاتصال بالخادم..."

        roomEventsJob?.cancel()
        roomEventsJob = lifecycleScope.launch {
            room.events.collect { event: RoomEvent ->
                handleRoomEvent(event)
            }
        }

        lifecycleScope.launch {
            runCatching {
                room.connect(liveKitUrl, accessToken)
                val localParticipant = room.localParticipant
                localParticipant.setMicrophoneEnabled(true)
                isMicEnabled = true
                binding.micBtn.text = "كتم المايك"

                if (isVideoCall) {
                    localParticipant.setCameraEnabled(true)
                    isCameraEnabled = true
                    binding.cameraBtn.text = "قفل الكاميرا"
                    localVideoTrack = localParticipant.getOrCreateDefaultVideoTrack().also { track ->
                        track.addRenderer(binding.localRenderer)
                    }
                }

                binding.statusText.text = "المكالمة شغالة"
                if (!isVideoCall) {
                    binding.waitingLabel.text = "المكالمة الصوتية شغالة..."
                }
            }.onFailure {
                binding.statusText.text = "تعذر تشغيل المكالمة"
                toast(it.message ?: "فشل بدء المكالمة")
                finish()
            }
        }
    }

    private fun handleRoomEvent(event: RoomEvent) {
        when (event) {
            is RoomEvent.Connected -> {
                binding.statusText.text = "اتصلنا بنجاح، جاري تشغيل الصوت والصورة..."
            }
            is RoomEvent.TrackSubscribed -> {
                val track = event.track
                if (track is VideoTrack) {
                    val participantName = event.participant.identity.toString().ifBlank { peerUsername }
                    attachRemoteVideo(track, participantName)
                }
            }
            is RoomEvent.ParticipantDisconnected -> {
                binding.waitingLabel.visibility = View.VISIBLE
                binding.statusText.text = "الطرف الآخر خرج من المكالمة"
                remoteVideoTrack?.removeRenderer(binding.remoteRenderer)
                remoteVideoTrack = null
            }
            is RoomEvent.Disconnected -> {
                binding.statusText.text = "تم إنهاء الاتصال"
                finish()
            }
            is RoomEvent.Reconnecting -> {
                binding.statusText.text = "الاتصال وقع، بنحاول نرجع تاني..."
            }
            is RoomEvent.Reconnected -> {
                binding.statusText.text = "رجعنا للمكالمة تاني بنجاح"
            }
            is RoomEvent.FailedToConnect -> {
                binding.statusText.text = "فشل الاتصال بالمكالمة"
                toast(event.error.message ?: "تعذر الاتصال")
                finish()
            }
            else -> Unit
        }
    }

    private fun attachRemoteVideo(track: VideoTrack, participantName: String) {
        remoteVideoTrack?.removeRenderer(binding.remoteRenderer)
        remoteVideoTrack = track
        binding.waitingLabel.visibility = View.GONE
        binding.statusText.text = "متصل مع $participantName"
        track.addRenderer(binding.remoteRenderer)
    }

    private fun toggleMicrophone() {
        lifecycleScope.launch {
            val targetState = !isMicEnabled
            runCatching {
                room.localParticipant.setMicrophoneEnabled(targetState)
            }.onSuccess { ok ->
                if (ok) {
                    isMicEnabled = targetState
                    binding.micBtn.text = if (isMicEnabled) "كتم المايك" else "فتح المايك"
                }
            }.onFailure {
                toast(it.message ?: "تعذر التحكم في المايك")
            }
        }
    }

    private fun toggleCamera() {
        if (!isVideoCall) return
        lifecycleScope.launch {
            val targetState = !isCameraEnabled
            runCatching {
                room.localParticipant.setCameraEnabled(targetState)
            }.onSuccess { ok ->
                if (ok) {
                    isCameraEnabled = targetState
                    binding.cameraBtn.text = if (isCameraEnabled) "قفل الكاميرا" else "فتح الكاميرا"
                    binding.localRenderer.visibility = if (isCameraEnabled) View.VISIBLE else View.GONE
                    if (isCameraEnabled && localVideoTrack == null) {
                        localVideoTrack = room.localParticipant.getOrCreateDefaultVideoTrack().also { track ->
                            track.addRenderer(binding.localRenderer)
                        }
                    }
                }
            }.onFailure {
                toast(it.message ?: "تعذر التحكم في الكاميرا")
            }
        }
    }

    private fun finishCall() {
        binding.statusText.text = "جاري إنهاء المكالمة..."
        finish()
    }

    private fun toast(message: String) {
        Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
    }

    companion object {
        private const val EXTRA_PEER_USERNAME = "peer_username"
        private const val EXTRA_CALL_MODE = "call_mode"
        private const val EXTRA_ROOM_ID = "room_id"
        private const val EXTRA_LIVEKIT_URL = "livekit_url"
        private const val EXTRA_TOKEN = "token"

        private const val MODE_AUDIO = "audio"
        private const val MODE_VIDEO = "video"

        fun newIntent(
            context: Context,
            peerUsername: String,
            callMode: String,
            roomId: String,
            liveKitUrl: String,
            token: String,
        ): Intent {
            return Intent(context, CallActivity::class.java)
                .putExtra(EXTRA_PEER_USERNAME, peerUsername)
                .putExtra(EXTRA_CALL_MODE, callMode)
                .putExtra(EXTRA_ROOM_ID, roomId)
                .putExtra(EXTRA_LIVEKIT_URL, liveKitUrl)
                .putExtra(EXTRA_TOKEN, token)
        }
    }
}
