package com.socialapp.activities

import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.socialapp.databinding.ActivityGroupsBinding
import com.socialapp.network.ApiClient
import com.socialapp.utils.ActionRateLimiter
import com.socialapp.utils.AppAnalytics
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

/**
 * GroupsActivity — v85.1
 * ------------------------------------------------------
 * الإصلاح #5:
 *   - إضافة التحقق من الاسم الفارغ قبل الإرسال
 *   - إضافة معالجة أخطاء الشبكة بشكل صحيح
 *   - إعادة توجيه المستخدم إلى GroupsListActivity بعد الإنشاء
 *     للاطلاع على كل المجموعات (بدلاً من شاشة معلّقة بلا قائمة)
 *   - إضافة rate-limit لمنع الضغط المتكرر
 */
class GroupsActivity : AppCompatActivity() {

    private lateinit var binding: ActivityGroupsBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityGroupsBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.createGroupBtn.setOnClickListener { onCreateClicked() }
    }

    override fun onResume() {
        super.onResume()
        AppAnalytics.trackScreen("groups")
    }

    private fun onCreateClicked() {
        val name = binding.groupName.text.toString().trim()
        if (name.isEmpty()) {
            toast("من فضلك أدخل اسم المجموعة")
            return
        }
        if (name.length < 2) {
            toast("اسم المجموعة قصير جداً (حرفين على الأقل)")
            return
        }
        if (name.length > 60) {
            toast("اسم المجموعة طويل جداً (٦٠ حرفاً حد أقصى)")
            return
        }
        if (!ActionRateLimiter.allow("create_group", maxHits = 3, windowMs = 30_000L, minIntervalMs = 1_500L)) {
            toast("استنى شوية قبل ما تعمل مجموعة تانية")
            return
        }

        val payload = mapOf(
            "name" to name,
            "description" to "",
            "category" to "",
        )

        binding.createGroupBtn.isEnabled = false
        ApiClient.api.createGroup(payload).enqueue(object : Callback<com.socialapp.models.ApiMessage> {
            override fun onResponse(
                call: Call<com.socialapp.models.ApiMessage>,
                response: Response<com.socialapp.models.ApiMessage>
            ) {
                binding.createGroupBtn.isEnabled = true
                if (response.isSuccessful) {
                    toast("تم إنشاء المجموعة بنجاح")
                    binding.groupName.setText("")
                    // انتقال للقائمة الكاملة لعرض المجموعة الجديدة
                    startActivity(Intent(this@GroupsActivity, GroupsListActivity::class.java))
                    finish()
                } else {
                    toast("فشل الإنشاء (${response.code()})")
                }
            }

            override fun onFailure(call: Call<com.socialapp.models.ApiMessage>, t: Throwable) {
                binding.createGroupBtn.isEnabled = true
                toast(t.message ?: "فشل الإنشاء — تحقق من الاتصال")
            }
        })
    }

    private fun toast(msg: String) {
        Toast.makeText(this, msg, Toast.LENGTH_SHORT).show()
    }
}
