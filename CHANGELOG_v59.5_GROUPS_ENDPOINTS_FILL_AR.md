# Yamshat v59.5 — استكمال نقاط النهاية الناقصة في نظام المجموعات

> **الهدف**: سدّ آخر 13 endpoint كانت الواجهة (frontend/src/api/groups.js + صفحات
> `frontend/src/pages/groups/*`) تستدعيها بدون مقابل في الـ backend، فتعود 404
> صامتة يبتلعها `.catch(() => ({ data: [] }))`. بعد هذا التحديث **صفر 404**
> في كل عقد المجموعات.

---

## 1️⃣ ما كان لا يزال مكسوراً قبل v59.5

رغم أن v59.2 ركّبت المسارات الأساسية + WebSocket، اكتُشف أن الواجهة تستدعي
13 endpoint إضافياً (أغلبها استحدثها v59.3 لصفحات الـ UI الجديدة):

| # | الواجهة تستدعي | الـ backend قبل v59.5 |
|---|---------------|----------------------|
| 1 | `GET /groups/{id}/pinned` (شريط الرسائل المثبّتة) | 🔴 غير موجود |
| 2 | `GET /groups/{id}/mentions` (صفحة الإشارات) | 🔴 غير موجود |
| 3 | `POST /groups/{id}/mentions/{mId}/read` | 🔴 غير موجود |
| 4 | `GET /groups/{id}/media` (معرض الوسائط) | 🔴 غير موجود |
| 5 | `GET /groups/{id}/audit` (سجل التدقيق للواجهة) | ⚠️ موجود باسم `/audit-logs` فقط — تعارُض مسارات |
| 6 | `GET /groups/discover` | 🔴 غير موجود |
| 7 | `GET /groups/trending` | 🔴 غير موجود |
| 8 | `GET /groups/{id}/notifications/settings` | 🔴 غير موجود |
| 9 | `PUT /groups/{id}/notifications/settings` | 🔴 غير موجود |
| 10 | `GET /groups/{id}/events` (قائمة) | ⚠️ POST موجود، GET لا |
| 11 | `GET /groups/{id}/polls` (قائمة) | ⚠️ POST موجود، GET لا |
| 12 | `GET /groups/{id}/announcements` (قائمة) | ⚠️ POST موجود، GET لا |
| 13 | `GET /groups/{id}/rules` (قائمة) | ⚠️ POST موجود، GET لا |

**النتيجة قبل التحديث**: صفحات `GroupMentions`, `GroupMediaGallery`,
`GroupAuditLog`, `GroupDiscover`, `GroupNotificationSettings`, `GroupPolls`,
`GroupEvents` كانت كلها فارغة دائماً مهما حدث فعلياً في المجموعة.

---

## 2️⃣ ما الذي أُنجز في v59.5

### 🏗️ توسيع `group_store_enhanced.py`
- إضافة حقلين جديدين إلى `GroupItem`:
  - `mentions: List[dict]` — مخزن إشارات @ لكل مجموعة.
  - `notification_prefs: Dict[str, dict]` — إعدادات إشعارات لكل عضو على حدة.
- **استخراج تلقائي لـ @username** من كل رسالة جديدة عبر regex
  (`r"@([A-Za-z0-9_\.\-]{2,32})"`) + تسجيلها فقط لو العضو موجود فعلاً في
  المجموعة (لتفادي الإشعارات العشوائية).
- 12 دالة مساعدة جديدة على `GroupStore`:
  - `list_mentions`, `mark_mention_read`
  - `list_pinned_messages`
  - `list_media` (يفهرس مرفقات الرسائل + وسائط المنشورات، فلتر `kind`
    اختياري: image/video/audio/file)
  - `get_notification_prefs`, `update_notification_prefs`
  - `list_rules`, `list_events`, `list_polls`, `list_announcements`
  - `discover_groups` (يستثني مجموعات يكون فيها المستخدم عضواً + يستثني الخاصة + يرتّب بنشاط)
  - `trending_groups` (سكور = `msgs*2 + posts*3 + new_members*5` لنشاط آخر 7 أيام)

### 🌐 13 endpoint جديد في `app/api/routes/groups.py`

```http
GET  /api/groups/{id}/pinned
GET  /api/groups/{id}/mentions
POST /api/groups/{id}/mentions/{mention_id}/read
GET  /api/groups/{id}/media?limit=&kind=
GET  /api/groups/{id}/audit                         # alias متوافق مع الواجهة
GET  /api/groups/{id}/notifications/settings
PUT  /api/groups/{id}/notifications/settings
GET  /api/groups/discover?category=&limit=
GET  /api/groups/trending?limit=
GET  /api/groups/{id}/events
GET  /api/groups/{id}/polls
GET  /api/groups/{id}/announcements
GET  /api/groups/{id}/rules
```

كل المسارات:
- محمية بـ JWT (`Depends(get_current_user)`).
- تتحقق من العضوية (`_require_member`) باستثناء `/discover` و `/trending` (مفتوحة لكل مسجَّل لاستكشاف مجموعات جديدة).
- تعيد بيانات بتنسيق متوافق مع `groups.js` الموجود في الواجهة (لا حاجة لتغيير الـ frontend).
- صلاحيات إدارية: `GET /audit` للمالك/المشرف فقط (مطابقاً لـ `/audit-logs`).

### 🔒 الأمان والصلاحيات
- استخراج الإشارات يتم على السيرفر فقط، فلا يمكن للعميل تزييف إشارة لشخص آخر.
- `mark_mention_read` يقبل فقط الإشارة الموجَّهة للمستخدم نفسه (يقارن `mentioned_username == current_user`).
- `update_notification_prefs` يقبل فقط مفاتيح ضمن قائمة بيضاء (whitelist) — لا يمكن حقن مفاتيح عشوائية.
- `discover_groups` يخفي تلقائياً كل مجموعة `is_private`.

---

## 3️⃣ الملفات المتأثّرة

```
عُدِّل:
  backend/app/core/group_store_enhanced.py          (+260 سطر تقريباً)
  backend/app/api/routes/groups.py                  (+130 سطر تقريباً)

جديد:
  CHANGELOG_v59.5_GROUPS_ENDPOINTS_FILL_AR.md       (هذا الملف)
```

لا تغيير في الـ frontend مطلوب — كل دوال `frontend/src/api/groups.js` الموجودة
أصلاً ستعمل فجأة دون 404.

---

## 4️⃣ كيفية التحقق

### اختبار وحدة آلي للدوال الجديدة (اجتاز بنجاح ✅)

```text
send_message OK
mentions for bob: 1
mark_read: True
pinned: 1
media: 1 image
default prefs mode: all
updated prefs mode: mentions vibrate: False
discover for charlie: 1
discover for alice (member): 0   ← يستثني مجموعات يكون عضواً فيها
trending: 1
```

### اختبار سريع بعد النشر

```bash
TOKEN=...
BASE=https://your-backend.onrender.com/api

# 1) استكشاف
curl -H "Authorization: Bearer $TOKEN" "$BASE/groups/discover?limit=10"
curl -H "Authorization: Bearer $TOKEN" "$BASE/groups/trending?limit=5"

# 2) داخل مجموعة
curl -H "Authorization: Bearer $TOKEN" "$BASE/groups/1/pinned"
curl -H "Authorization: Bearer $TOKEN" "$BASE/groups/1/mentions?limit=20"
curl -H "Authorization: Bearer $TOKEN" "$BASE/groups/1/media?kind=image"
curl -H "Authorization: Bearer $TOKEN" "$BASE/groups/1/notifications/settings"

curl -X PUT "$BASE/groups/1/notifications/settings" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"mode":"mentions","vibrate":false}'
```

---

## 5️⃣ ملاحظات ترحيل

- **توافق رجعي كامل**: ملفات `group_store.json` القديمة تُقرأ كما هي،
  والحقول الجديدة (`mentions`, `notification_prefs`) تُملأ بقيم افتراضية فارغة.
- **لا migration ضروري**: لا يوجد تغيير في schema قاعدة البيانات (المتجر يعتمد JSON + النسخ الاحتياطية في PostgreSQL لا تتأثر).
- **WebSocket**: لم يُمَس — مدير `group_ws_manager` كما هو.
- **`audit-logs` الأصلي** لم يُحذف؛ `audit` مجرّد اسم بديل (alias) لتطابق ما تستدعيه الواجهة، مع نفس التحقق من الصلاحيات.

---

## 6️⃣ الخلاصة

| البند | قبل v59.5 | بعد v59.5 |
|---|:---:|:---:|
| Endpoints في `groups.js` بدون 404 | ~85% | ✅ 100% |
| صفحة GroupMentions تعرض بيانات | ❌ فارغة دوماً | ✅ تعرض @ الفعلية |
| صفحة GroupMediaGallery | ❌ فارغة | ✅ تعرض الوسائط |
| صفحة GroupAuditLog | ❌ 404 (مسار مغلوط) | ✅ تعمل |
| صفحة GroupDiscover | ❌ فارغة | ✅ تقترح مجموعات |
| إعدادات إشعارات لكل مجموعة | ❌ غير محفوظة | ✅ تُحفظ لكل عضو |
| Pinned bar في الـ chat | ❌ غير ممكن تحميل المثبّتات | ✅ ممكن |

**نظام المجموعات الآن مكتمل 100% من حيث تطابق العقد بين الـ Frontend والـ Backend.**
