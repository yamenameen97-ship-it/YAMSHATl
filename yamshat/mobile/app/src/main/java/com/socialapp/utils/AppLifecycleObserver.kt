package com.socialapp.utils

import androidx.lifecycle.DefaultLifecycleObserver
import androidx.lifecycle.LifecycleOwner
import android.util.Log

class AppLifecycleObserver(
    private val onBackground: () -> Unit,
    private val onForeground: () -> Unit
) : DefaultLifecycleObserver {

    override fun onStop(owner: LifecycleOwner) {
        super.onStop(owner)
        Log.d("Lifecycle", "App went to background")
        onBackground()
    }

    override fun onStart(owner: LifecycleOwner) {
        super.onStart(owner)
        Log.d("Lifecycle", "App came to foreground")
        onForeground()
    }
}
