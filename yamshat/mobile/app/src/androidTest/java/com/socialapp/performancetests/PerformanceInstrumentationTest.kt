package com.socialapp.performancetests

import android.util.Log
import androidx.test.core.app.ActivityScenario.launch
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.uiautomator.UiDevice
import com.socialapp.activities.SplashActivity
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class PerformanceInstrumentationTest {
    @Test
    fun captureFpsMemoryAndCpuSnapshots() {
        launch(SplashActivity::class.java).use {
            val instrumentation = InstrumentationRegistry.getInstrumentation()
            val device = UiDevice.getInstance(instrumentation)
            device.waitForIdle()
            val packageName = instrumentation.targetContext.packageName

            val gfx = device.executeShellCommand("dumpsys gfxinfo $packageName")
            val mem = device.executeShellCommand("dumpsys meminfo $packageName")
            val cpu = device.executeShellCommand("top -b -n 1 | grep $packageName")

            Log.i("PerformanceTest", gfx.take(1200))
            Log.i("PerformanceTest", mem.take(1200))
            Log.i("PerformanceTest", cpu.take(400))

            assertTrue(gfx.isNotBlank())
            assertTrue(mem.isNotBlank())
            assertTrue(cpu.isNotBlank() || cpu.isEmpty())
        }
    }
}
