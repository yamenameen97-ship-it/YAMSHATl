package com.socialapp.utils

import java.util.ArrayDeque
import java.util.concurrent.ConcurrentHashMap

object ActionRateLimiter {
    private val history = ConcurrentHashMap<String, ArrayDeque<Long>>()

    @Synchronized
    fun allow(key: String, maxHits: Int, windowMs: Long, minIntervalMs: Long = 0L): Boolean {
        val now = System.currentTimeMillis()
        val queue = history.getOrPut(key) { ArrayDeque() }
        while (queue.isNotEmpty() && now - queue.first() > windowMs) {
            queue.removeFirst()
        }
        if (minIntervalMs > 0L && queue.isNotEmpty() && now - queue.last() < minIntervalMs) {
            return false
        }
        if (queue.size >= maxHits) {
            return false
        }
        queue.addLast(now)
        return true
    }

    @Synchronized
    fun retryAfterMs(key: String, windowMs: Long): Long {
        val queue = history[key] ?: return 0L
        val first = queue.firstOrNull() ?: return 0L
        val elapsed = System.currentTimeMillis() - first
        return (windowMs - elapsed).coerceAtLeast(0L)
    }
}
