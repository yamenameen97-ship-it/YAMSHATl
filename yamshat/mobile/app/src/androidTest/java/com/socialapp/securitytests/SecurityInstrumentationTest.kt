package com.socialapp.securitytests

import android.content.Context
import android.content.pm.ApplicationInfo
import android.view.WindowManager
import androidx.test.core.app.ActivityScenario
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import com.socialapp.activities.MainActivity
import com.socialapp.network.SessionManager
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class SecurityInstrumentationTest {
    @Before
    fun setupSession() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        SessionManager.init(context)
        SessionManager.saveSession(accessToken = "instrumentation-token", username = "security_tester")
    }

    @Test
    fun validatesNoBackupAndSecureWindowFlags() {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val appInfo = context.packageManager.getApplicationInfo(context.packageName, 0)
        assertFalse((appInfo.flags and ApplicationInfo.FLAG_ALLOW_BACKUP) != 0)

        ActivityScenario.launch(MainActivity::class.java).use { scenario ->
            scenario.onActivity { activity ->
                val secureFlag = activity.window.attributes.flags and WindowManager.LayoutParams.FLAG_SECURE
                assertEquals(WindowManager.LayoutParams.FLAG_SECURE, secureFlag)
            }
        }
    }

    @Test
    fun mainActivityIsSingleTask() {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val component = android.content.ComponentName(context, MainActivity::class.java)
        val info = context.packageManager.getActivityInfo(component, 0)
        assertEquals(android.content.pm.ActivityInfo.LAUNCH_SINGLE_TASK, info.launchMode)
        assertTrue(info.exported)
    }
}
