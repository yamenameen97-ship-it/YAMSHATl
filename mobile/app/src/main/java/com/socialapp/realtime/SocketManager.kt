package com.socialapp.realtime

import com.socialapp.network.ApiClient
import io.socket.client.IO
import io.socket.client.Socket
import io.socket.emitter.Emitter
import org.json.JSONObject

object SocketManager {
    private var socket: Socket? = null

    @Synchronized
    fun connectSocket(token: String?, onConnected: (() -> Unit)? = null, onDisconnected: (() -> Unit)? = null): Socket? {
        if (socket?.connected() == true) return socket

        val opts = IO.Options().apply {
            reconnection = true
            reconnectionAttempts = Int.MAX_VALUE
            reconnectionDelay = 1000
            transports = arrayOf("websocket")
            forceNew = false
            if (!token.isNullOrBlank()) {
                extraHeaders = mutableMapOf("Authorization" to listOf("Bearer $token"))
                auth = mapOf("token" to token)
            }
        }

        socket = IO.socket(ApiClient.SOCKET_URL, opts).apply {
            off(Socket.EVENT_CONNECT)
            off(Socket.EVENT_DISCONNECT)
            on(Socket.EVENT_CONNECT) { onConnected?.invoke() }
            on(Socket.EVENT_DISCONNECT) { onDisconnected?.invoke() }
            connect()
        }
        return socket
    }

    fun getSocket(): Socket? = socket

    fun joinRoom(currentUser: String, peer: String, token: String?) {
        socket?.emit("join_chat", JSONObject().apply {
            put("user", currentUser)
            put("peer", peer)
            if (!token.isNullOrBlank()) put("token", token)
        })
    }

    fun emitPresence(currentUser: String, peer: String, online: Boolean) {
        socket?.emit("chat_presence", JSONObject().apply {
            put("user", currentUser)
            put("peer", peer)
            put("online", online)
        })
    }

    fun emitTyping(currentUser: String, peer: String, isTyping: Boolean) {
        socket?.emit("chat_typing", JSONObject().apply {
            put("sender", currentUser)
            put("receiver", peer)
            put("is_typing", isTyping)
        })
    }

    // Group Chat Methods
    fun joinGroupRoom(groupId: Int, currentUser: String, token: String?) {
        socket?.emit("join_group", JSONObject().apply {
            put("group_id", groupId)
            put("user", currentUser)
            if (!token.isNullOrBlank()) put("token", token)
        })
    }

    fun emitGroupTyping(groupId: Int, currentUser: String, isTyping: Boolean) {
        socket?.emit("group_typing", JSONObject().apply {
            put("group_id", groupId)
            put("user", currentUser)
            put("is_typing", isTyping)
        })
    }

    fun emitGroupMessageDeleted(groupId: Int, messageId: Int) {
        socket?.emit("group_message_deleted", JSONObject().apply {
            put("group_id", groupId)
            put("message_id", messageId)
        })
    }

    fun emitGroupReactionAdded(groupId: Int, messageId: Int, emoji: String) {
        socket?.emit("group_reaction_added", JSONObject().apply {
            put("group_id", groupId)
            put("message_id", messageId)
            put("emoji", emoji)
        })
    }

    fun on(event: String, listener: Emitter.Listener) {
        socket?.off(event, listener)
        socket?.on(event, listener)
    }

    fun off(event: String, listener: Emitter.Listener) {
        socket?.off(event, listener)
    }

    fun disconnect() {
        socket?.disconnect()
        socket?.off()
        socket = null
    }
}
