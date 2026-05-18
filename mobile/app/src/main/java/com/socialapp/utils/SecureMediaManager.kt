package com.socialapp.utils

import android.content.Context
import java.io.File
import java.util.concurrent.TimeUnit

object SecureMediaManager {
    private const val SECURE_MEDIA_DIR = "secure_media"
    private const val SECURE_MEDIA_TMP_DIR = "secure_media_tmp"
    private const val RETENTION_HOURS = 12L

    fun secureCacheDir(context: Context): File {
        val dir = File(context.noBackupFilesDir, SECURE_MEDIA_DIR)
        if (!dir.exists()) dir.mkdirs()
        File(dir, ".nomedia").takeIf { !it.exists() }?.writeText("")
        return dir
    }

    fun createSecureTempFile(context: Context, prefix: String, extension: String): File {
        cleanupOldFiles(context)
        val dir = File(secureCacheDir(context), SECURE_MEDIA_TMP_DIR)
        if (!dir.exists()) dir.mkdirs()
        File(dir, ".nomedia").takeIf { !it.exists() }?.writeText("")
        val normalizedExt = extension.trim().ifBlank { ".tmp" }.let {
            if (it.startsWith('.')) it else ".$it"
        }
        return File.createTempFile(prefix, normalizedExt, dir).apply {
            setReadable(false, false)
            setWritable(true, true)
            deleteOnExit()
        }
    }

    fun cleanupOldFiles(context: Context) {
        val cutoff = System.currentTimeMillis() - TimeUnit.HOURS.toMillis(RETENTION_HOURS)
        secureCacheDir(context).walkTopDown()
            .filter { it.isFile && it.name != ".nomedia" }
            .forEach { file ->
                if (file.lastModified() < cutoff) {
                    runCatching { file.delete() }
                }
            }
    }
}
