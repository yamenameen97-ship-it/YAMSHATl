package com.socialapp.signal

import android.content.ContentValues
import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import com.socialapp.utils.SecureBlobCodec
import java.nio.ByteBuffer

class DBHelper(context: Context) : SQLiteOpenHelper(context, "signal.secure.db", null, 1) {

    override fun onConfigure(db: SQLiteDatabase) {
        super.onConfigure(db)
        db.execSQL("PRAGMA secure_delete=ON")
    }

    override fun onCreate(db: SQLiteDatabase) {
        db.execSQL("CREATE TABLE store (key TEXT PRIMARY KEY, value BLOB NOT NULL)")
    }

    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) = Unit

    fun putBytes(key: String, value: ByteArray) {
        val values = ContentValues().apply {
            put("key", key)
            put("value", SecureBlobCodec.encrypt(value))
        }
        writableDatabase.insertWithOnConflict("store", null, values, SQLiteDatabase.CONFLICT_REPLACE)
    }

    fun putInt(key: String, value: Int) {
        putBytes(key, ByteBuffer.allocate(4).putInt(value).array())
    }

    fun getBytes(key: String): ByteArray? {
        readableDatabase.rawQuery("SELECT value FROM store WHERE key=?", arrayOf(key)).use { cursor ->
            if (!cursor.moveToFirst()) return null
            return runCatching { SecureBlobCodec.decrypt(cursor.getBlob(0)) }.getOrDefault(cursor.getBlob(0))
        }
    }

    fun getInt(key: String): Int {
        val data = getBytes(key) ?: return 0
        return ByteBuffer.wrap(data).int
    }

    fun exists(key: String): Boolean = getBytes(key) != null

    fun delete(key: String) {
        writableDatabase.delete("store", "key=?", arrayOf(key))
    }

    fun deletePrefix(prefix: String) {
        writableDatabase.delete("store", "key LIKE ?", arrayOf("$prefix%"))
    }

    fun getAllBytes(prefix: String): List<ByteArray> {
        val list = mutableListOf<ByteArray>()
        readableDatabase.rawQuery("SELECT value FROM store WHERE key LIKE ? ORDER BY key ASC", arrayOf("$prefix%")).use { cursor ->
            while (cursor.moveToNext()) {
                val data = cursor.getBlob(0)
                list.add(runCatching { SecureBlobCodec.decrypt(data) }.getOrDefault(data))
            }
        }
        return list
    }

    fun getKeys(prefix: String): List<String> {
        val list = mutableListOf<String>()
        readableDatabase.rawQuery("SELECT key FROM store WHERE key LIKE ? ORDER BY key ASC", arrayOf("$prefix%")).use { cursor ->
            while (cursor.moveToNext()) {
                list.add(cursor.getString(0))
            }
        }
        return list
    }
}
