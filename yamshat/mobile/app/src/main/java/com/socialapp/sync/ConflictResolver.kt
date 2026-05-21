package com.socialapp.sync

import com.socialapp.local.PostEntity
import java.security.MessageDigest

enum class SyncMergeStrategy {
    SERVER_WINS,
    CLIENT_WINS,
    MERGED,
    LOCAL_ONLY,
    REMOTE_ONLY,
}

data class ConflictResolutionResult(
    val entity: PostEntity,
    val strategy: SyncMergeStrategy,
    val hasConflict: Boolean,
)

object ConflictResolver {
    fun resolve(local: PostEntity?, remote: PostEntity?): ConflictResolutionResult {
        if (local == null && remote == null) {
            throw IllegalArgumentException("Both local and remote entities are null")
        }
        if (local == null) return ConflictResolutionResult(remote!!, SyncMergeStrategy.REMOTE_ONLY, false)
        if (remote == null) return ConflictResolutionResult(local, SyncMergeStrategy.LOCAL_ONLY, false)

        if (local.contentHash == remote.contentHash && local.media == remote.media && local.likes == remote.likes) {
            val freshest = if (remote.version >= local.version) remote else local
            return ConflictResolutionResult(freshest.copy(dirty = false), SyncMergeStrategy.SERVER_WINS, false)
        }

        if (!local.dirty && remote.version >= local.version) {
            return ConflictResolutionResult(remote.copy(dirty = false), SyncMergeStrategy.SERVER_WINS, false)
        }

        if (local.dirty && remote.version <= local.version) {
            return ConflictResolutionResult(local, SyncMergeStrategy.CLIENT_WINS, false)
        }

        val mergedContent = when {
            local.content.isBlank() -> remote.content
            remote.content.isBlank() -> local.content
            local.content == remote.content -> local.content
            else -> listOf(local.content.trim(), remote.content.trim()).distinct().joinToString("\n\n")
        }

        val merged = remote.copy(
            content = mergedContent,
            media = local.media ?: remote.media,
            likes = maxOf(local.likes, remote.likes),
            version = maxOf(local.version, remote.version) + 1,
            contentHash = fingerprint(mergedContent, local.media ?: remote.media, maxOf(local.likes, remote.likes)),
            dirty = true,
            lastSyncedAt = maxOf(local.lastSyncedAt, remote.lastSyncedAt),
        )
        return ConflictResolutionResult(merged, SyncMergeStrategy.MERGED, true)
    }

    fun fingerprint(content: String, media: String?, likes: Int): String {
        val input = "$content|${media.orEmpty()}|$likes"
        val bytes = MessageDigest.getInstance("SHA-256").digest(input.toByteArray())
        return bytes.joinToString(separator = "") { "%02x".format(it) }
    }
}
