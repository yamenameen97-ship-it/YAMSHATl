# تقرير مراجعة ربط الفرونت بالباك-إند — Yamshat v38

التاريخ: 2026-06-14

## ملخص تنفيذي

تمت مراجعة شاملة لجميع نقاط الاتصال بين تطبيق **frontend (React/Vite)** والـ **backend (FastAPI)**.
تم اكتشاف وإصلاح **ثلاث مشاكل ربط حرجة** كانت تؤدي إلى أخطاء 404 صامتة في الإنتاج.

## ✅ الإصلاحات المطبقة

### 1) تضاعف `/api/api/` في نظام البلاغات (Reports)
**المشكلة:** المتغير `API_BASE` ينتهي بـ `/api` (مثل `https://yamshat-1ya4.onrender.com/api`)، لكن ملفات البلاغات في الفرونت كانت تُلصق `/api/reports/...` على رأسه، فينتج عنوان مكرر:
```
https://yamshat-1ya4.onrender.com/api/api/reports/reasons   ❌ 404
```

**الملفات المُصحَّحة (14 موضعاً):**
- `frontend/src/api/reports.js`  (9 مواضع)
- `frontend/src/components/admin/AdminReportsPanel.jsx`  (4 مواضع)
- `frontend/src/components/reports/ReportModal.jsx`  (1 موضع)

**الإصلاح:** استبدال `${API_BASE}/api/reports/...` بـ `${API_BASE}/reports/...`.

### 2) تضاعف اسم المسار في راوتر Stories
**المشكلة:** ملف `backend/app/api/routes/stories.py` يعرّف داخلياً مساراته كـ `/stories/highlights`, `/stories/{id}/view` … لكنه كان يُحمَّل في `main.py` تحت `prefix="/api/stories"`، فينتج:
```
GET /api/stories/stories/highlights  ❌ 404
```
بينما الفرونت يطلب `/api/stories/highlights`.

**الإصلاح في `backend/app/main.py`:** تغيير prefix إلى `/api` فقط (لأن المسارات داخلياً تحتوي الجزء `/stories` بالفعل).

### 3) تضاعف اسم المسار في راوتر Recommendations
**المشكلة:** نفس الخطأ — `recommendations.py` يعرّف `/recommendations/users` ويُحمَّل تحت `/api/recommendations`، فيتولّد:
```
GET /api/recommendations/recommendations/users  ❌ 404
```

**الإصلاح في `backend/app/main.py`:** تغيير prefix إلى `/api` فقط.

### 4) ربط دوال إدارة البلاغات في `admin.js`
**المشكلة:** `updateReportStatus()` و `escalateReport()` في `frontend/src/api/admin.js` كانتا تطلبان مسارات غير موجودة:
- `POST /admin/reports/{id}/status`  ❌
- `POST /admin/reports/{id}/escalate`  ❌

**الإصلاح:** توجيهها إلى نقاط نظام البلاغات الموحَّد:
- `PATCH /reports/admin/{id}`  ✅
- `POST  /reports/admin/{id}/action` مع `{ action: 'escalate' }`  ✅

## 🟢 نقاط الربط التي تم التحقق منها وهي سليمة

| المجموعة | عدد الـ endpoints | الحالة |
|---|---|---|
| Auth (تسجيل/دخول/2FA/captcha) | 14 | ✅ |
| Users (بروفايل/متابعة/جلسات/تفضيلات) | 17 | ✅ |
| Posts (إنشاء/إعجاب/حفظ/تعليق) | 12 | ✅ |
| Comments | 6 | ✅ |
| Reels | 7 | ✅ |
| Stories | 9 | ✅ (بعد الإصلاح) |
| Recommendations | 3 | ✅ (بعد الإصلاح) |
| Reports | 9 | ✅ (بعد الإصلاح) |
| Admin (لوحة الإدارة) | 28 | ✅ |
| Chat (مع alias تحت `/api` و `/api/chat`) | 18 | ✅ |
| Groups | 10 | ✅ |
| Notifications | 8 | ✅ |
| Inbox | 4 | ✅ |
| Search | 3 | ✅ |
| Upload (مع resumable) | 9 | ✅ |
| Engagement (gamification) | 14 | ✅ |
| Voice Rooms (مع alias) | 8 | ✅ |
| Analytics | 4 | ✅ |
| Socket.IO `/socket.io` | ✅ مربوط في `main.py` (ASGIApp) |

## ℹ️ ملاحظات على الراوترات غير المُحمَّلة (مقصودة)

التالية موجودة في `backend/app/api/routes/` لكنها غير مُحمَّلة في `main.py`، وذلك مقصود:
- `auth_v2.py`, `profile_v2.py` — مكتوبة بـ **Flask Blueprint** (نسخ قديمة موروثة لا تتوافق مع FastAPI).
- `chat_enhanced.py`, `chat_enhanced_v2.py`, `posts_enhanced.py`, `groups_enhanced.py`, `inbox_v2.py`, `notifications_v2.py`, `search_enhanced.py`, `stories_reels_enhanced.py`, `admin_dashboard_v2.py`, `reels_fix.py` — مسوّدات تطويرية متقدمة لا تستخدمها الواجهة الأمامية حالياً (النسخ v1 تغطي كل ما يحتاجه الفرونت).
- `ws.py` — WebSocket مباشر؛ الفرونت يستخدم Socket.IO بدلاً منه.

## 🔐 طبقة CORS و Cold-start
- `cors_origin_regex = ^https://(?:[a-zA-Z0-9-]+\.)?onrender\.com$` → يغطي كل subdomains على Render.
- `global_exception_handler` يضمن وصول CORS headers حتى عند الأخطاء 5xx.
- `/api/warmup` و `/api/health` متاحان لتفادي 503 cold-start.
- `/api/_diag/routers` — endpoint تشخيصي يعرض حالة تركيب كل راوتر.

## 🚀 خطوات النشر التالية
1. رفع الحزمة الجديدة إلى Git.
2. إعادة نشر `yamshat-backend` على Render (سيلتقط تغييرات `main.py`).
3. إعادة بناء `yamshat-frontend` (سيلتقط تغييرات `reports.js` / `admin.js` / `AdminReportsPanel.jsx` / `ReportModal.jsx`).
4. التحقق بعد النشر عبر:
   ```
   curl https://yamshat-1ya4.onrender.com/api/_diag/routers
   curl https://yamshat-1ya4.onrender.com/api/reports/reasons
   curl https://yamshat-1ya4.onrender.com/api/stories/highlights
   curl https://yamshat-1ya4.onrender.com/api/recommendations/trending
   ```
