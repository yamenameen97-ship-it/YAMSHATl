package com.socialapp.local

import android.content.Context
import androidx.room.Dao
import androidx.room.Database
import androidx.room.Entity
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.PrimaryKey
import androidx.room.Query
import androidx.room.Room
import androidx.room.RoomDatabase
import com.socialapp.models.Post

@Entity(tableName = "posts")
data class PostEntity(
    @PrimaryKey val id: Int,
    val username: String,
    val content: String,
    val media: String? = null,
    val created_at: String = "",
    val likes: Int = 0,
    val updated_at: String? = null,
    val version: Long = 1,
    val contentHash: String = "",
    val dirty: Boolean = false,
    val deleted: Boolean = false,
    val lastSyncedAt: Long = 0L,
) {
    fun toDomain(): Post = Post(
        id = id,
        username = username,
        content = content,
        media = media,
        created_at = created_at,
        likes = likes,
        updated_at = updated_at,
        version = version,
        sync_state = if (dirty) "dirty" else "synced",
        dirty = dirty,
    )

    companion object {
        fun fromDomain(
            post: Post,
            dirty: Boolean = post.dirty,
            contentHash: String = post.content.hashCode().toString(),
            syncedAt: Long = System.currentTimeMillis(),
        ): PostEntity = PostEntity(
            id = post.id,
            username = post.username,
            content = post.content,
            media = post.media,
            created_at = post.created_at,
            likes = post.likes,
            updated_at = post.updated_at,
            version = post.version,
            contentHash = contentHash,
            dirty = dirty,
            lastSyncedAt = syncedAt,
        )
    }
}

@Entity(tableName = "offline_actions")
data class OfflineActionEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val actionType: String,
    val dataJson: String,
    val entityKey: String? = null,
    val clientMutationId: String = java.util.UUID.randomUUID().toString(),
    val lastKnownVersion: Long? = null,
    val timestamp: Long = System.currentTimeMillis(),
    val retryCount: Int = 0,
)

@Entity(tableName = "sync_checkpoints")
data class SyncCheckpointEntity(
    @PrimaryKey val scope: String = FEED_SCOPE,
    val lastSyncAt: Long = 0L,
    val lastFingerprint: String? = null,
    val lastCursor: String? = null,
) {
    companion object {
        const val FEED_SCOPE = "feed"
    }
}

@Dao
interface PostDao {
    @Query("SELECT * FROM posts WHERE deleted = 0 ORDER BY id DESC LIMIT :limit OFFSET :offset")
    suspend fun getPagedPosts(limit: Int, offset: Int): List<PostEntity>

    @Query("SELECT * FROM posts WHERE deleted = 0 ORDER BY id DESC")
    suspend fun getAllPosts(): List<PostEntity>

    @Query("SELECT * FROM posts WHERE id = :postId LIMIT 1")
    suspend fun getPostById(postId: Int): PostEntity?

    @Query("SELECT * FROM posts WHERE dirty = 1 ORDER BY created_at DESC")
    suspend fun getDirtyPosts(): List<PostEntity>

    @Query("SELECT COUNT(*) FROM posts WHERE deleted = 0")
    suspend fun getPostsCount(): Int

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPosts(posts: List<PostEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(post: PostEntity)

    @Query("UPDATE posts SET dirty = :dirty, version = :version, lastSyncedAt = :syncedAt WHERE id = :postId")
    suspend fun updateSyncState(postId: Int, dirty: Boolean, version: Long, syncedAt: Long)

    @Query("DELETE FROM posts")
    suspend fun deleteAll()
}

@Dao
interface OfflineActionDao {
    @Query("SELECT * FROM offline_actions ORDER BY timestamp ASC")
    suspend fun getAllActions(): List<OfflineActionEntity>

    @Query("SELECT * FROM offline_actions WHERE retryCount < :maxRetries ORDER BY timestamp ASC")
    suspend fun getPendingActions(maxRetries: Int = 6): List<OfflineActionEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAction(action: OfflineActionEntity)

    @Query("DELETE FROM offline_actions WHERE id = :actionId")
    suspend fun deleteAction(actionId: Long)

    @Query("UPDATE offline_actions SET retryCount = retryCount + 1 WHERE id = :actionId")
    suspend fun incrementRetryCount(actionId: Long)

    @Query("DELETE FROM offline_actions")
    suspend fun clearAll()
}

@Dao
interface SyncCheckpointDao {
    @Query("SELECT * FROM sync_checkpoints WHERE scope = :scope LIMIT 1")
    suspend fun get(scope: String): SyncCheckpointEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(checkpoint: SyncCheckpointEntity)
}

@Database(
    entities = [PostEntity::class, OfflineActionEntity::class, SyncCheckpointEntity::class],
    version = 3,
    exportSchema = false,
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun postDao(): PostDao
    abstract fun offlineActionDao(): OfflineActionDao
    abstract fun syncCheckpointDao(): SyncCheckpointDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "social_app_db"
                )
                    .fallbackToDestructiveMigration()
                    .build()
                INSTANCE = instance
                instance
            }
        }
    }
}
