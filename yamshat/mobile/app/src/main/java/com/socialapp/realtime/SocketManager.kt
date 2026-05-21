package com.socialapp.realtime

import android.util.Log
import com.socialapp.BuildConfig
import com.socialapp.network.ApiClient
import io.socket.client.IO
import io.socket.client.Socket
import io.socket.emitter.Emitter
import kotlinx.coroutines.*
import org.json.JSONObject
import java.util.*
import java.util.concurrent.ConcurrentLinkedQueue

object SocketManager {
    private var socket: Socket? = null
    private val socketScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private var heartbeatJob: Job? = null
    
    // Reconnect Queue for messages emitted while offline
    private val pendingEmits = ConcurrentLinkedQueue<Pair<String, JSONObject>>()
    
    // Connection State Manager
    private var isReconnecting = false
    private var lastConnectedTime: Long = 0

    @Synchronized
    fun connectSocket(token: String?, onConnected: (() -> Unit)? = null, onDisconnected: (() -> Unit)? = null): Socket? {
        if (socket?.connected() == true) return socket

        val opts = IO.Options().apply {
            reconnection = true
            reconnectionAttempts = Int.MAX_VALUE
            reconnectionDelay = 1000
            reconnectionDelayMax = 5000
            randomizationFactor = 0.5
            timeout = 20000
            transports = arrayOf("websocket")
            forceNew = false
            if (!token.isNullOrBlank()) {
                extraHeaders = mutableMapOf("Authorization" to listOf("Bearer $token"))
                auth = mapOf("token" to token)
            }
        }

        socket = IO.socket(ApiClient.SOCKET_URL, opts).apply {
            off() // Clear all previous listeners
            
            on(Socket.EVENT_CONNECT) { 
                isReconnecting = false
                lastConnectedTime = System.currentTimeMillis()
                onConnected?.invoke() 
                startHeartbeat()
                processPendingEmits()
                syncMissedMessages()
                if (BuildConfig.ENABLE_LOGS) Log.d("SocketManager", "Connected")
            }
            
            on(Socket.EVENT_DISCONNECT) { 
                onDisconnected?.invoke() 
                heartbeatJob?.cancel()
                if (BuildConfig.ENABLE_LOGS) Log.d("SocketManager", "Disconnected")
            }
            
            on(Socket.EVENT_CONNECT_ERROR) { args ->
                isReconnecting = true
                if (BuildConfig.ENABLE_LOGS) Log.e("SocketManager", "Connect Error: ${args.getOrNull(0)}")
            }
            
            on(Socket.EVENT_RECONNECT_ATTEMPT) {
                isReconnecting = true
                if (BuildConfig.ENABLE_LOGS) Log.d("SocketManager", "Attempting Reconnect...")
            }
            
            connect()
        }
        return socket
    }

    private fun processPendingEmits() {
        while (pendingEmits.isNotEmpty()) {
            val (event, data) = pendingEmits.poll() ?: break
            socket?.emit(event, data)
        }
    }

    private fun syncMissedMessages() {
        // Sync missed messages since lastConnectedTime
        if (lastConnectedTime > 0) {
            socket?.emit("sync_messages", JSONObject().apply {
                put("since", lastConnectedTime)
            })
        }
    }

    fun safeEmit(event: String, data: JSONObject) {
        if (socket?.connected() == true) {
            socket?.emit(event, data)
        } else {
            pendingEmits.add(event to data)
        }
    }

    fun joinRoom(currentUser: String, peer: String, token: String?) {
        val data = JSONObject().apply {
            put("user", currentUser)
            put("peer", peer)
            if (!token.isNullOrBlank()) put("token", token)
        }
        safeEmit("join_chat", data)
    }

    fun emitPresence(currentUser: String, peer: String, online: Boolean) {
        val data = JSONObject().apply {
            put("user", currentUser)
            put("peer", peer)
            put("online", online)
        }
        safeEmit("chat_presence", data)
    }

    fun emitTyping(currentUser: String, peer: String, isTyping: Boolean) {
        val data = JSONObject().apply {
            put("sender", currentUser)
            put("receiver", peer)
            put("is_typing", isTyping)
        }
        safeEmit("chat_typing", data)
    }

    fun joinGroupRoom(groupId: Int, currentUser: String, token: String?) {
        val data = JSONObject().apply {
            put("group_id", groupId)
            put("user", currentUser)
            if (!token.isNullOrBlank()) put("token", token)
        }
        safeEmit("join_group", data)
    }

    fun on(event: String, listener: Emitter.Listener) {
        socket?.on(event, listener)
    }

    fun off(event: String, listener: Emitter.Listener) {
        socket?.off(event, listener)
    }

    private fun startHeartbeat() {
        heartbeatJob?.cancel()
        heartbeatJob = socketScope.launch {
            while (isActive && socket?.connected() == true) {
                socket?.emit("heartbeat", JSONObject().apply {
                    put("timestamp", System.currentTimeMillis())
                })
                delay(30000)
            }
        }
    }

    fun disconnect() {
        heartbeatJob?.cancel()
        socketScope.cancel()
        socket?.disconnect()
        socket?.off()
        socket = null
        pendingEmits.clear()
    }
}
