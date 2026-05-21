package com.socialapp.sync

import com.socialapp.local.PostEntity
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class ConflictResolverTest {
    @Test
    fun resolve_returnsRemoteOnly_whenLocalMissing() {
        val remote = PostEntity(id = 1, username = "sara", content = "remote", created_at = "2026-05-11")

        val result = ConflictResolver.resolve(null, remote)

        assertEquals(SyncMergeStrategy.REMOTE_ONLY, result.strategy)
        assertEquals("remote", result.entity.content)
    }

    @Test
    fun resolve_merges_whenBothChanged() {
        val local = PostEntity(
            id = 1,
            username = "sara",
            content = "local edit",
            created_at = "2026-05-11",
            version = 2,
            contentHash = ConflictResolver.fingerprint("local edit", null, 0),
            dirty = true,
        )
        val remote = PostEntity(
            id = 1,
            username = "sara",
            content = "remote edit",
            created_at = "2026-05-11",
            version = 3,
            contentHash = ConflictResolver.fingerprint("remote edit", null, 0),
        )

        val result = ConflictResolver.resolve(local, remote)

        assertEquals(SyncMergeStrategy.MERGED, result.strategy)
        assertTrue(result.entity.content.contains("local edit"))
        assertTrue(result.entity.content.contains("remote edit"))
        assertTrue(result.entity.dirty)
    }
}
