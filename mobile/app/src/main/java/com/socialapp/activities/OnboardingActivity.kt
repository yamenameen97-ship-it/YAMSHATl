package com.socialapp.activities

import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.RecyclerView
import androidx.viewpager2.widget.ViewPager2
import com.socialapp.R
import com.socialapp.network.SessionManager
import com.socialapp.utils.ActivitySecurity
import com.socialapp.utils.UiKit

class OnboardingActivity : AppCompatActivity() {
    private lateinit var pager: ViewPager2
    private lateinit var stepText: TextView
    private lateinit var skipButton: Button
    private lateinit var nextButton: Button
    private lateinit var startButton: Button

    private val pages = listOf(
        OnboardingPage("🚀", "أهلاً بك في يمشات", "دخول أسرع وتجربة موبايل أكثر أمانًا مع حفظ جلسة مشفّر وإدارة محسّنة للتوكنات."),
        OnboardingPage("💬", "شات أسرع وأهدى", "تقليل السبام من الضغطات المتكررة، تحسين التعامل مع انقطاع الإنترنت، وكاش محلي لآخر المحادثات."),
        OnboardingPage("🔔", "تنبيهات وربط أذكى", "فتح عميق للروابط داخل التطبيق، عدّاد Badge للإشعارات، وتجديد جلسة تلقائي عند الحاجة."),
    )

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        ActivitySecurity.enableSecureWindow(this)
        setContentView(R.layout.activity_onboarding)
        UiKit.prepareScreen(this, findViewById(android.R.id.content))

        pager = findViewById(R.id.onboardingPager)
        stepText = findViewById(R.id.stepText)
        skipButton = findViewById(R.id.skipBtn)
        nextButton = findViewById(R.id.nextBtn)
        startButton = findViewById(R.id.startBtn)

        pager.adapter = OnboardingAdapter(pages)
        pager.registerOnPageChangeCallback(object : ViewPager2.OnPageChangeCallback() {
            override fun onPageSelected(position: Int) {
                super.onPageSelected(position)
                val step = position + 1
                stepText.text = "الخطوة $step من ${pages.size}"
                val isLast = position == pages.lastIndex
                nextButton.visibility = if (isLast) View.GONE else View.VISIBLE
                startButton.visibility = if (isLast) View.VISIBLE else View.GONE
            }
        })

        stepText.text = "الخطوة 1 من ${pages.size}"
        skipButton.setOnClickListener { finishOnboarding() }
        nextButton.setOnClickListener { pager.currentItem = (pager.currentItem + 1).coerceAtMost(pages.lastIndex) }
        startButton.setOnClickListener { finishOnboarding() }
    }

    private fun finishOnboarding() {
        SessionManager.setOnboardingCompleted(true)
        val intent = if (SessionManager.hasToken()) {
            Intent(this, MainActivity::class.java)
        } else {
            Intent(this, LoginActivity::class.java)
        }
        startActivity(intent)
        finish()
    }

    private data class OnboardingPage(
        val icon: String,
        val title: String,
        val description: String,
    )

    private class OnboardingAdapter(
        private val items: List<OnboardingPage>,
    ) : RecyclerView.Adapter<OnboardingAdapter.ViewHolder>() {
        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
            val view = LayoutInflater.from(parent.context).inflate(R.layout.item_onboarding_page, parent, false)
            return ViewHolder(view)
        }

        override fun onBindViewHolder(holder: ViewHolder, position: Int) {
            holder.bind(items[position])
        }

        override fun getItemCount(): Int = items.size

        class ViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
            private val icon = itemView.findViewById<TextView>(R.id.pageIcon)
            private val title = itemView.findViewById<TextView>(R.id.pageTitle)
            private val description = itemView.findViewById<TextView>(R.id.pageDescription)

            fun bind(item: OnboardingPage) {
                icon.text = item.icon
                title.text = item.title
                description.text = item.description
            }
        }
    }
}
