package com.socialapp.uitests

import android.content.Context
import androidx.test.core.app.ActivityScenario
import androidx.test.core.app.ApplicationProvider
import androidx.test.espresso.Espresso.onView
import androidx.test.espresso.assertion.ViewAssertions.matches
import androidx.test.espresso.matcher.ViewMatchers.isDisplayed
import androidx.test.espresso.matcher.ViewMatchers.withId
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.socialapp.activities.MainActivity
import com.socialapp.R
import com.socialapp.network.SessionManager
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class MainActivityUiTest {

    @Before
    fun setupSession() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        SessionManager.init(context)
        SessionManager.saveSession(accessToken = "instrumentation-token", username = "ui_tester")
    }

    @Test
    fun testMainActivityIsDisplayed() {
        ActivityScenario.launch(MainActivity::class.java).use {
            onView(withId(R.id.main_layout)).check(matches(isDisplayed()))
        }
    }
}
