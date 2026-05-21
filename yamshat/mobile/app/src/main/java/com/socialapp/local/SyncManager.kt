package com.socialapp.local

import android.content.Context
import android.util.Log
import com.google.gson.Gson
import com.socialapp.models.Post
import com.socialapp.network.ApiClient
import com.socialapp.network.ApiService
import com.socialapp.sync.ConflictResolver
import com.socialapp.sync.SyncMergeStrategy
import com.socialapp.utils.NetworkMonitor
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

data class SyncRunSummary(
    val processedActions: Int = 0,
    val mergedPosts: Int = 0,
    val conflicts: Int = 0,
    val failedActions: Int = 0,
)

class SyncManager(
    private val context: Context,
    private val apiService: ApiService = ApiClient.api,
    private val database: AppDatabase = AppDatabase.getDatabase(context),
) {
    private val gson = Gson()

    suspend fun runSync(): SyncRunSummary = withContext(Dispatchers.IO) {
        if (!NetworkMonitor.isConnected(context)) {
            return@withContext SyncRunSummary()
        }

        var processed = 0
        var failed = 0
        var merged = 0
        var conflicts = 0

        database.offlineActionDao().getPendingActions().forEach { action ->
            val success = runCatching { dispatchAction(action) }.getOrDefault(false)
            if (success) {
                processed += 1
                database.offlineActionDao().deleteAction(action.id)
            } else {
                failed += 1
                database.offlineActionDao().incrementRetryCount(action.id)
            }
        }

        val checkpoint = database.syncCheckpointDao().get(SyncCheckpointEntity.FEED_SCOPE)
            ?: SyncCheckpointEntity(scope = SyncCheckpointEntity.FEED_SCOPE)

        val response = apiService.getPosts(page = 1, limit = 50).execute()
        if (response.isSuccessful) {
            val remotePosts = response.body().orEmpty()
            val syncAt = System.currentTimeMillis()
            remotePosts.forEach { post ->
                val remoteEntity = post.toEntity(syncAt)
                val localEntity = database.postDao().getPostById(post.id)
                val resolution = ConflictResolver.resolve(localEntity, remoteEntity)
                database.postDao().upsert(resolution.entity)
                merged += 1
                if (resolution.strategy == SyncMergeStrategy.MERGED) conflicts += 1
            }

            val fingerprint = remotePosts.joinToString(separator = "|") {
                "${it.id}:${it.version}:${it.updated_at.orEmpty()}:${it.likes}"
            }.hashCode().toString()

            database.syncCheckpointDao().upsert(
                checkpoint.copy(
                    lastSyncAt = syncAt,
                    lastFingerprint = fingerprint,
                )
            )
        }

        SyncRunSummary(
            processedActions = processed,
            mergedPosts = merged,
            conflicts = conflicts,
            failedActions = failed,
        )
    }

    fun scheduleSync(immediate: Boolean = false) {
        com.socialapp.sync.SmartSyncScheduler.schedule(context, immediate)
    }

    private fun dispatchAction(action: OfflineActionEntity): Boolean {
        return when (action.actionType) {
            "CREATE_POST" -> {
                val payload = gson.fromJson(action.dataJson, Map::class.java) as Map<String, String?>
                apiService.createPost(payload).execute().isSuccessful
            }
            "SEND_MESSAGE" -> {
                val payload = gson.fromJson(action.dataJson, Map::class.java) as Map<String, Any?>
                apiService.sendMessage(payload).execute().isSuccessful
            }
            "LIKE_POST" -> {
                val payload = gson.fromJson(action.dataJson, Map::class.java) as Map<String, String>
                apiService.like(payload).execute().isSuccessful
            }
            "COMMENT" -> {
                val payload = gson.fromJson(action.dataJson, Map::class.java) as Map<String, String>
                apiService.comment(payload).execute().isSuccessful
            }
            else -> false
        }
    }

    private fun Post.toEntity(syncAt: Long): PostEntity {
        val contentHash = ConflictResolver.fingerprint(content, media, likes)
        return PostEntity(
            id = id,
            username = username,
            content = content,
            media = media,
            likes = likes,
            created_at = created_at,
            updated_at = updated_at,
            version = version,
            contentHash = contentHash,
            dirty = false,
            lastSyncedAt = syncAt,
        )
    }
}
