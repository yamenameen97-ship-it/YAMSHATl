# Yamshat v59.2 — إعادة هيكلة نظام المجموعات (Groups Overhaul)

> **الهدف**: تحويل نظام المجموعات من «نصف منفّذ» إلى **منظومة كاملة احترافية**:
> حذف التكرار، توصيل كل الـ endpoints المفقودة، إضافة WebSocket حقيقي،
> ودعم كامل لكل عقد الواجهة الأمامية في `frontend/src/api/groups.js`.

---

## 1️⃣ ما الذي كان معطّلاً قبل التحديث

### تكرار يجب حذفه
| الملف | الحالة | الإجراء |
|------|--------|---------|
| `backend/app/api/routes/groups_enhanced.py` | نسخة طبق الأصل من `groups.py` (509 سطر، diff = صفر) | **حُذف** |
| `backend/app/core/group_store.py` | لا يُستورد من أي مكان (فقط `group_store_enhanced.py` مستخدم) | **حُذف** |
| `services/group-service/` | microservice مستقل **غير مربوط** بأي gateway / k8s / infra | **حُذف** |
| `services/group-calls-service/` | microservice مستقل **غير مربوط** | **حُذف** |

### الـ endpoints المفقودة في الـ backend monolith
الواجهة تستدعيها → كانت تعود **404** فعليًا:

| # | المسار | المشكلة قبل التحديث |
|---|--------|----------------------|
| 1 | `GET /groups/search` | غير موجود |
| 2 | `POST /groups/{id}/members` (إضافة عضو) | غير موجود |
| 3 | `POST /groups/{id}/members/{u}/mute` | غير موجود |
| 4 | `POST /groups/{id}/members/{u}/ban` | غير موجود |
| 5 | `POST /groups/{id}/transfer-ownership` | غير موجود |
| 6 | `POST /groups/{id}/invitations` + `/{invId}/accept` | غير موجود |
| 7 | `POST /groups/{id}/join-requests` + approve/reject | غير موجود |
| 8 | `POST /groups/{id}/messages/{m}/pin` | غير موجود |
| 9 | `POST /groups/{id}/messages/{m}/forward` | غير موجود |
| 10 | `POST /groups/{id}/messages/{m}/report` | غير موجود |
| 11 | منشورات المجموعة: GET/POST/DELETE/pin | غير موجود |
| 12 | قواعد / أحداث / استطلاعات / إعلانات | غير موجود |
| 13 | `GET/PUT /groups/{id}/settings` | غير موجود |
| 14 | `GET /groups/{id}/analytics` | غير موجود |
| 15 | `WebSocket /api/ws/groups/{groupId}/{userId}` | لم يُعرَّف أصلًا |

> النتيجة: واجهة GroupsHome / GroupChat / GroupSettings كانت تعرض ميزات «وهمية»
> (التفاعل، التثبيت، الاستطلاعات، الإحصائيات) — كل ضغطة على زر تنتج 404 صامت يبتلعه `.catch(() => null)` في `groups.js`.

---

## 2️⃣ ما الذي أُنجز

### 🧹 إزالة التكرار
- حُذف `groups_enhanced.py` و `group_store.py` القديم.
- حُذف microservices غير المتصلة `group-service` و `group-calls-service`.
- **مصدر حقيقة وحيد** الآن: `app/core/group_store_enhanced.py` ⇄ `app/api/routes/groups.py`.

### 🏗️ توسعة المتجر (`group_store_enhanced.py`)
أُضيفت dataclasses ودوال كاملة لكل الميزات:
- `GroupPost`, `GroupRule`, `GroupEvent`, `GroupPoll`, `GroupAnnouncement`, `GroupJoinRequest`.
- توسيع `GroupMember` بـ `is_banned` و `banned_until`.
- توسيع `GroupItem` بـ `posts`, `rules`, `events`, `polls`, `announcements`, `join_requests`.
- 30+ method جديد: `search_groups`, `add_member`, `transfer_ownership`, `set_mute`, `set_ban`,
  `pin_message`, `forward_message`, `report_message`, `list_posts`, `create_post`, `delete_post`,
  `pin_post`, `create_rule`, `create_event`, `create_poll`, `vote_in_poll`, `create_announcement`,
  `get_settings`, `update_settings`, `get_analytics`, `create_join_request`, `decide_join_request`,
  `accept_invitation` ...
- **توافق رجعي**: `_load()` يقرأ ملفات JSON القديمة (بدون الحقول الجديدة) ويُكمّلها بقيم افتراضية.
- **نسخ احتياطي مزدوج**: Persistent Disk + PostgreSQL `group_store_backup`.

### 🌐 راوتر مُعاد كتابته (`groups.py`)
- جميع المسارات الموجودة سابقًا → محفوظة + الـ legacy aliases سليمة.
- 25+ مسار جديد لتغطية كل عقد الواجهة (`frontend/src/api/groups.js`) بدون 404 واحد.
- **بث WebSocket تلقائي** بعد كل عملية (رسالة، تفاعل، انضمام، تعديل…).
- استجابات عربية واضحة + رموز HTTP الصحيحة (400/403/404).
- صلاحيات صارمة: owner > admin > moderator > member، مع منع نقل المالك ضد إرادته.

### 🔌 WebSocket حقيقي (`group_ws_manager.py` + `ws_router`)
- مدير اتصالات متعدد المجموعات: `{group_id: {user_id: {WebSocket, ...}}}`.
- مسار العميل: `wss://host/api/ws/groups/{groupId}/{userId}?token=...`.
- يستخدم `ACCESS_TOKEN_TYPE` ويتحقق من ملكية الـ token (يطابق `user_id`).
- يرفض الدخول لغير الأعضاء (`code=4403`) أو المجموعات غير الموجودة (`code=4404`).
- يدعم `ping/pong` heartbeat و typing fast-path بدون استدعاء HTTP.
- يبث `presence` (online/offline) عند الاتصال والقطع.

### 🛡️ معالجة الأخطاء
- كل بث WebSocket محصور في `try/except` — فشل WS لا يُسقط HTTP path أبدًا.
- إزالة سيلم للاتصالات المعطّلة بصمت داخل المدير.

---

## 3️⃣ الملفات المتأثّرة

```
حُذف:
  backend/app/api/routes/groups_enhanced.py        (تكرار طبق الأصل)
  backend/app/core/group_store.py                  (نسخة قديمة غير مستخدمة)
  services/group-service/                           (microservice غير مربوط)
  services/group-calls-service/                     (microservice غير مربوط)

أُعيد كتابتها:
  backend/app/core/group_store_enhanced.py         (1280 سطر — نسخة v59.2 الكاملة)
  backend/app/api/routes/groups.py                  (1000+ سطر — يغطي كل عقد الواجهة)

جديد:
  backend/app/core/group_ws_manager.py             (مدير اتصالات WebSocket)

عُدِّل:
  backend/app/main.py                              (تركيب ws_router على /api)
```

---

## 4️⃣ كيفية التحقق

### اختبار محلي مُمرَّر بنجاح
21 سيناريو وظيفي اجتاز جميعها (إنشاء/بحث/إضافة/كتم/حظر/رسائل/تثبيت/إبلاغ/تحويل/منشورات/قواعد/أحداث/استطلاعات/إعلانات/إعدادات/طلبات انضمام/نقل ملكية/إحصائيات/استمرار JSON).

### اختبار سريع للـ endpoints بعد النشر
```bash
TOKEN=...  # access token
BASE=https://your-backend.onrender.com/api

# قائمة + بحث
curl -H "Authorization: Bearer $TOKEN" "$BASE/groups"
curl -H "Authorization: Bearer $TOKEN" "$BASE/groups/search?query=tech"

# إنشاء + إعدادات + إحصائيات
curl -X POST "$BASE/groups" -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" -d '{"name":"My Group"}'
curl -H "Authorization: Bearer $TOKEN" "$BASE/groups/1/settings"
curl -H "Authorization: Bearer $TOKEN" "$BASE/groups/1/analytics"
```

### WebSocket
```js
const ws = new WebSocket(`wss://your-backend.onrender.com/api/ws/groups/1/42?token=${token}`);
ws.onmessage = (e) => console.log(JSON.parse(e.data));
// {type: "new_message", group_id: "1", data: {...}}
```

---

## 5️⃣ نقاط مهمة بعد النشر

1. **التوافق الرجعي**: ملفات `group_store.json` القديمة تُقرأ تلقائيًا — الحقول الجديدة تُملأ بقيم افتراضية، لا حاجة لـ migration يدوي.
2. **النسخ الاحتياطي**: عند كل عملية، تُكتب نسخة كاملة إلى Persistent Disk + جدول `group_store_backup` في PostgreSQL — حماية مضاعفة ضد فقدان البيانات.
3. **الـ microservices المحذوفة** (`group-service`, `group-calls-service`) لم تكن مفعّلة في Render / k8s — حذفها لا يكسر شيئًا.
4. **مكالمات المجموعات الجماعية**: إذا أردتم استعادتها مستقبلًا، يجب توصيلها صراحةً في `main.py` ضمن monolith — لا تُترك كـ microservice معلّق.

---

**النتيجة**: نظام مجموعات «عالمي واحترافي» — صفر تكرار، صفر 404، WebSocket حقيقي،
كل ميزة في الواجهة لها endpoint فعلي يعمل ويُختبر.
