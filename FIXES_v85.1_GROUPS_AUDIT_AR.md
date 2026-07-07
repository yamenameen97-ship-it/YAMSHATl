# 🔧 مراجعة نظام المجموعات — v85.1

**التاريخ:** 2026-07-07
**المدقّق:** Genspark AI Auditor
**النطاق:** كل ما يخص المجموعات (Groups) — الأزرار، الخدمات، الـ APIs، النماذج، الواجهات

---

## 🎯 المنهجية

تم فحص نظام المجموعات بأكمله من ثلاث زوايا:

1. **Backend** — `backend/app/api/routes/groups.py` و `backend/app/core/group_store*.py`
2. **Mobile (Android/Kotlin)** — `mobile/app/src/main/java/com/socialapp/{activities,adapters,models,network,repositories}`
3. **Layouts (XML)** — `mobile/app/src/main/res/layout/activity_group*.xml`

توقّفنا عند اكتشاف **5 نواقص/عيوب حرجة**، ثم قمنا بإصلاحها كاملة.

---

## 🔴 النواقص الخمس المكتشفة

### 🚨 النقص #1: مسارات API غير متطابقة — كل الطلبات تعطي 404

**الموقع:** `mobile/app/src/main/java/com/socialapp/network/ApiService.kt`

**التفصيل:**
- `BASE_URL` = `https://yamshat-1ya4.onrender.com/api/`
- `groups.router` مركّب في `backend/app/main.py` على prefix `/api/groups`
- ApiService كان يستدعي (بدون `groups/` prefix):

| ما كان في التطبيق | المسار الفعلي المرسل | ما يتوقعه الخادم | النتيجة |
|-----------|-----|-----|-----|
| `@POST("create_group")` | `/api/create_group` | `/api/groups` أو `/api/groups/create_group` | ❌ 404 |
| `@GET("groups")` | `/api/groups` | `/api/groups` | ✅ صدفة |
| `@GET("group/{id}")` | `/api/group/{id}` | `/api/groups/{id}` | ❌ 404 |
| `@POST("group/send_message")` | `/api/group/send_message` | `/api/groups/{id}/messages` | ❌ 404 |
| `@POST("group/{id}/join")` | `/api/group/{id}/join` | `/api/groups/{id}/join` | ❌ 404 |
| … كل استدعاءات المجموعات … | — | — | ❌ 404 |

**النتيجة الإجمالية:** كل الأزرار (إنشاء، انضمام، مغادرة، إرسال رسالة، حذف، تفاعل، typing، أعضاء) كانت تفشل بشكل صامت.

### 🚨 النقص #2: تعارض حقول نموذج `GroupMessage` — التطبيق لا يُترجم أصلاً

**الموقع:** `models/GroupMessage.kt` مقابل `activities/GroupChatActivity.kt` + `adapters/GroupMessageAdapter.kt`

**التفصيل:**

| النموذج (`GroupMessage.kt`) يعرف | الواجهة/المحوّل تستخدم | النتيجة |
|---|---|---|
| `senderUsername: String` | `.sender` | ❌ compile error |
| `senderDisplayName: String` | `.senderName` | ❌ compile error |
| `content: String` | `.message` | ❌ compile error |
| `messageType: String` | `.type` | ❌ compile error |
| `isDeleted: Boolean` | `.deleted` | ❌ compile error |
| `id: String` | `id: Int` | ❌ type mismatch |
| — | `.mediaUrl` (غير موجود أصلاً) | ❌ unresolved reference |
| — | `.status` (غير موجود أصلاً) | ❌ unresolved reference |

**النتيجة:** التطبيق **لا يُبنى** — أخطاء compile فورية عند فتح شاشة المجموعات.

### 🚨 النقص #3: زر إدارة الأعضاء (Kick / Promote) مفقود من الـ UI

**الموقع:** `activities/GroupChatActivity.kt::showMembersDialog`

**التفصيل:**
- الخادم يوفّر `POST /groups/{id}/members/{username}/remove` و `POST /groups/{id}/members/{username}/role`
- `ApiService` و `GroupRepository` يوفّران `removeGroupMember()` و `promoteGroupMember()`
- **لكن** الواجهة لا تعرض أي زر أو خيار لتنفيذ هذه العمليات
- `showMembersDialog()` كان مجرد قائمة عرض بدون أي تفاعل

**الأثر:** المالك/الأدمن لا يستطيع طرد عضو مسيء، ولا ترقية شخص للإدارة. النظام معطّل عملياً لصاحب المجموعة.

### 🚨 النقص #4: زر مغادرة المجموعة (Leave Group) مفقود من الـ UI

**الموقع:** `activities/GroupChatActivity.kt::showGroupSettings`

**التفصيل:**
- API `POST /groups/{id}/leave` موجود ومُختبَر
- Repository يحوي `leaveGroup()`
- **لكن** قائمة الإعدادات كانت تعرض فقط: "تحديث الرسائل" + "إعادة تحميل الأعضاء"
- **لا يوجد زر للخروج، ولا لحذف المجموعة (للمالك)، ولا لعرض القواعد**

**الأثر:** العضو محبوس في المجموعة — لا يستطيع الخروج منها من داخل التطبيق.

### 🚨 النقص #5: `GroupsActivity` القديم مكسور ومكرّر

**الموقع:** `activities/GroupsActivity.kt`

**التفصيل:**
- كان يسمح بإنشاء مجموعة بأسماء **فارغة** أو رمز واحد
- لا يتحقق من طول الاسم (0-∞)
- لا يوجد rate-limiting → يمكن الضغط 100 مرة في الثانية
- لا يعرض قائمة المجموعات الحالية → المستخدم يبقى معلّقاً بعد الإنشاء
- مكرّر مع `GroupsListActivity` بلا سبب واضح، والمستخدم لا يدري أيهما يستخدم

**الأثر:** يخلق مجموعات "قمامة" ويُحبط تجربة المستخدم.

---

## ✅ الإصلاحات المطبّقة

### الإصلاح #1 — إعادة كتابة كل نقاط النهاية في ApiService

**الملف:** `mobile/app/src/main/java/com/socialapp/network/ApiService.kt`

```kotlin
// قبل ❌
@POST("create_group")
fun createGroup(...): Call<ApiMessage>

@POST("group/{groupId}/join")
fun joinGroup(...): Call<ApiMessage>

// بعد ✅ — كل المسارات الآن ببادئة groups/
@POST("groups")
fun createGroup(@Body body: Map<String, @JvmSuppressWildcards Any?>): Call<ApiMessage>

@GET("groups/{groupId}")
fun getGroupInfo(@Path("groupId") groupId: Int): Call<GroupInfo>

@PUT("groups/{groupId}")
fun updateGroup(...): Call<GroupInfo>

@DELETE("groups/{groupId}")
fun deleteGroup(...): Call<ApiMessage>

@POST("groups/{groupId}/messages")
fun sendGroupMessage(@Path("groupId") groupId: Int, @Body body: Map<...>): Call<ApiMessage>

@DELETE("groups/{groupId}/messages/{messageId}")
fun deleteGroupMessage(...): Call<ApiMessage>

@POST("groups/{groupId}/messages/{messageId}/reactions")
fun addGroupMessageReaction(...): Call<ApiMessage>

@POST("groups/{groupId}/join")
fun joinGroup(...): Call<ApiMessage>

@POST("groups/{groupId}/leave")
fun leaveGroup(...): Call<ApiMessage>

@POST("groups/{groupId}/members/{username}/remove")
fun removeGroupMember(...): Call<ApiMessage>

@POST("groups/{groupId}/members/{username}/role")
fun promoteGroupMember(..., @Body body: Map<String, String>): Call<ApiMessage>

@GET("groups/search")
fun searchGroups(@Query("q") query: String): Call<List<GroupInfo>>
```

**إضافات جديدة:**
- `updateGroup` (PUT) — تعديل بيانات المجموعة
- `deleteGroup` (DELETE) — حذف المجموعة كلياً (للمالك)
- `searchGroups` — البحث عن مجموعات بالاسم

### الإصلاح #2 — توحيد نموذج `GroupMessage` مع أسماء بديلة (alternate)

**الملف:** `mobile/app/src/main/java/com/socialapp/models/GroupMessage.kt`

الحلّ استخدم `@SerializedName(alternate = [...])` من Gson للحفاظ على التوافق مع كل الاستخدامات القديمة والجديدة:

```kotlin
data class GroupMessage(
    val id: String = "",

    @SerializedName(value = "sender_username", alternate = ["sender", "sender_name"])
    val senderUsername: String = "",

    @SerializedName(value = "sender_display_name", alternate = ["senderName"])
    val senderDisplayName: String = "",

    @SerializedName(value = "content", alternate = ["message", "text"])
    val content: String = "",

    @SerializedName(value = "message_type", alternate = ["type"])
    val messageType: String = "text",

    @SerializedName(value = "media_url", alternate = ["mediaUrl", "attachment_url"])
    val mediaUrl: String? = null,

    @SerializedName(value = "is_deleted", alternate = ["deleted"])
    val isDeleted: Boolean = false,

    @SerializedName(value = "status", alternate = ["delivery_status"])
    val status: String = "sent",
    // ...
) {
    // Getters توافق مع الشيفرة القديمة
    val sender: String get() = senderUsername
    val senderName: String get() = senderDisplayName.ifBlank { senderUsername }
    val message: String get() = content
    val type: String get() = messageType
    val deleted: Boolean get() = isDeleted
}
```

**فائدة:**
- الشيفرة القديمة تستمر في العمل (`.sender`, `.message`, `.type`, `.deleted`)
- الشيفرة الجديدة تستخدم الأسماء الرسمية (`.senderUsername`, `.content`, `.messageType`, `.isDeleted`)
- الكاش القديم يبقى قابلاً للقراءة (بفضل `alternate`)

كذلك أُضيفت حقول ناقصة إلى `GroupInfo`:
- `isOwner: Boolean`
- `isAdmin: Boolean`
- `coverImageUrl: String?`
- `category: String?`
- `privacy: String?`

وإلى `GroupMember`:
- `isMuted: Boolean`
- `isBanned: Boolean`

### الإصلاح #3 — إضافة إدارة الأعضاء (Kick + Promote)

**الملف:** `mobile/app/src/main/java/com/socialapp/activities/GroupChatActivity.kt`

`showMembersDialog()` الجديد يعرض شارات الأدوار (👑 مالك، ⭐ أدمن، ⚪🟢 حالة الاتصال)، وعند الضغط على أي عضو تفتح قائمة موجّهة بالسياق:

```kotlin
private fun onMemberSelected(member: GroupMember) {
    val canModerate = currentGroup?.let { it.isOwner || it.isAdmin } == true &&
        member.username != currentUser &&
        member.role.lowercase() != "owner"

    if (!canModerate) {
        // عرض معلومات العضو فقط
        return
    }

    val options = arrayOf(
        if (member.role == "admin") "إزالة الأدمن" else "ترقية إلى أدمن",
        "إزالة من المجموعة"
    )
    // ...
    when (which) {
        0 -> promoteMember(member)      // POST /groups/{id}/members/{u}/role
        1 -> confirmRemoveMember(member) // POST /groups/{id}/members/{u}/remove
    }
}
```

**سلوك آمن:**
- لا يستطيع أحد إزالة نفسه
- لا يستطيع أحد إزالة المالك
- فقط المالك أو الأدمن يرون خيارات الإدارة
- تأكيد قبل الإزالة (AlertDialog)

### الإصلاح #4 — إضافة زر مغادرة/حذف المجموعة

**الملف:** `mobile/app/src/main/java/com/socialapp/activities/GroupChatActivity.kt`

`showGroupSettings()` الجديد:

```kotlin
val optionsList = mutableListOf(
    "🔄 تحديث الرسائل",
    "👥 إعادة تحميل الأعضاء",
    "🚪 مغادرة المجموعة"   // ← جديد
)
if (isOwner) {
    optionsList.add("🗑️ حذف المجموعة")   // ← جديد للمالك فقط
}
```

- `confirmLeaveGroup()` → يعرض تأكيد، ثم يستدعي `POST /groups/{id}/leave`، ثم يُنهي النشاط
- `confirmDeleteGroup()` → للمالك فقط، مع تحذير قوي بعدم إمكانية التراجع، ثم `DELETE /groups/{id}`

### الإصلاح #5 — تحصين `GroupsActivity`

**الملف:** `mobile/app/src/main/java/com/socialapp/activities/GroupsActivity.kt`

```kotlin
private fun onCreateClicked() {
    val name = binding.groupName.text.toString().trim()
    when {
        name.isEmpty() -> { toast("من فضلك أدخل اسم المجموعة"); return }
        name.length < 2 -> { toast("اسم المجموعة قصير جداً"); return }
        name.length > 60 -> { toast("اسم المجموعة طويل جداً"); return }
    }
    if (!ActionRateLimiter.allow("create_group", 3, 30_000L, 1_500L)) {
        toast("استنى شوية قبل ما تعمل مجموعة تانية")
        return
    }

    binding.createGroupBtn.isEnabled = false // منع النقر المزدوج

    val payload = mapOf("name" to name, "description" to "", "category" to "")
    ApiClient.api.createGroup(payload).enqueue(object : Callback<ApiMessage> {
        override fun onResponse(...) {
            binding.createGroupBtn.isEnabled = true
            if (response.isSuccessful) {
                // 🎯 التوجيه إلى القائمة الكاملة
                startActivity(Intent(this@GroupsActivity, GroupsListActivity::class.java))
                finish()
            }
            // ...
        }
    })
}
```

**تحسينات:**
- ✅ التحقق من طول الاسم (2-60 حرفاً)
- ✅ Rate-limit صارم (3 مجموعات كل 30 ثانية)
- ✅ تعطيل الزر أثناء الإنشاء لمنع النقر المزدوج
- ✅ التحقق من `response.isSuccessful` قبل الاعتراف بالنجاح
- ✅ التوجيه التلقائي إلى `GroupsListActivity` لعرض النتيجة

كذلك تم تحسين `GroupsListActivity` بنفس منطق التحقق من الأسماء.

---

## 📊 ملخص الإصلاحات

| # | النقص | الملفات المعدّلة | الحالة |
|---|-------|---------------|-------|
| 1 | مسارات API خاطئة → 404 | `network/ApiService.kt` | ✅ مُصلَح |
| 2 | حقول `GroupMessage` غير متوافقة | `models/GroupMessage.kt`, `adapters/GroupMessageAdapter.kt`, `activities/GroupChatActivity.kt` | ✅ مُصلَح |
| 3 | لا يوجد زر kick/promote | `activities/GroupChatActivity.kt` | ✅ مُصلَح |
| 4 | لا يوجد زر Leave/Delete Group | `activities/GroupChatActivity.kt` | ✅ مُصلَح |
| 5 | `GroupsActivity` بلا تحقق أو توجيه | `activities/GroupsActivity.kt`, `activities/GroupsListActivity.kt` | ✅ مُصلَح |

**+ ملفات صيانة:**
- `repositories/GroupRepository.kt` — تحديث التوقيعات لتطابق ApiService الجديد

---

## 🎁 قيمة إضافية بعد الإصلاح

- **APIs جديدة صار التطبيق يعرفها:** `updateGroup`, `deleteGroup`, `searchGroups`
- **دعم أدوار متكامل:** owner / admin / member — مع UI يعكس ذلك
- **تجربة مستخدم متسقة:** من إنشاء المجموعة → لعرضها → للتفاعل معها → لمغادرتها
- **آمن ضد الضغط المتكرر:** rate-limiting على كل الأزرار الحساسة

---

**الإصدار:** yam-shat-v85.1-GROUPS-COMPLETENESS
**تاريخ الإكمال:** 2026-07-07
