package com.socialapp.local

import com.google.gson.Gson
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class OfflineActionQueue(private val database: AppDatabase) {
    private val scope = CoroutineScope(Dispatchers.IO)
    private val gson = Gson()

    fun addAction(type: String, dataJson: String, entityKey: String? = null, lastKnownVersion: Long? = null) {
        scope.launch {
            database.offlineActionDao().insertAction(
                OfflineActionEntity(
                    actionType = type,
                    dataJson = dataJson,
                    entityKey = entityKey,
                    lastKnownVersion = lastKnownVersion,
                )
            )
        }
    }

    fun addAction(type: String, payload: Map<String, Any?>, entityKey: String? = null, lastKnownVersion: Long? = null) {
        addAction(type, gson.toJson(payload), entityKey, lastKnownVersion)
    }

    fun clearQueue() {
        scope.launch {
            database.offlineActionDao().clearAll()
        }
    }
}
