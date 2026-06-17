# تقرير v52 — استكمال ربط لوحة التحكم الإدارية (Admin Dashboard Integration)

> **الإصدار:** v52 (Dashboard ↔ Pages ↔ Backend Wiring)
> **تاريخ:** يونيو 2026
> **النطاق:** لوحة المدير + الإشعارات + البلاغات + التنقل الجانبي

---

## 🎯 الهدف من النسخة
استكمال الربط الكامل بين لوحة التحكم الإدارية (`/admin/dashboard`) وجميع الصفحات الفرعية، مع نقل المعلومات الدقيقة لكل من:
- المحتويات (منشورات، ريلز، ستوري، شات)
- **الإشعارات** (إجمالي / غير مقروء / يومي / حسب النوع)
- **البلاغات** (مفتوحة / تحت المراجعة / حسب نوع الهدف)
- النشاطات اللحظية المُجمَّعة من مصادر متعددة

---

## 🔧 التغييرات على الـ Backend

### 1) `backend/app/services/dashboard_live_service.py`
**إضافات جوهرية:**

| العنصر | الوصف |
| --- | --- |
| `_REPORTS_MODEL_AVAILABLE` | استيراد مرن لنموذج `Report` لمنع تعطل النظام في حال غيابه |
| **بطاقتان جديدتان في `_stat_cards`** | `reports` (البلاغات المفتوحة) و `notifications` (إشعارات غير مقروءة) — كلتاهما مع `trend` شهري حقيقي |
| `_humanize_minutes()` | دالة مساعدة لعرض الوقت بصياغة عربية (منذ X دقيقة/ساعة/يوم) |
| **`_recent_activities` مُعاد كتابتها كلياً** | تجميع من **4 مصادر**: منشورات + مستخدمون جدد + بلاغات + إشعارات نظام — مع ترتيب زمني وحقول `kind` و `target` لكل عنصر |
| `_notifications_summary()` | إجمالي، غير مقروء، اليوم، التوزيع حسب النوع |
| `_reports_summary()` | إجمالي، حسب الحالة (`pending/reviewing/resolved/dismissed/escalated`)، حسب نوع الهدف (`user/post/comment/...`) |
| **حقلان جديدان في `get_live_dashboard`** | `notifications_summary` و `reports_summary` |

**شكل الاستجابة الكامل بعد التحديث:**
```json
{
  "stat_cards": [ /* 7 بطاقات (كان 5) */ ],
  "views_trend": [...],
  "content_distribution": [...],
  "recent_activities": [
    { "id": "post-12", "user": "ahmed", "text": "نشر منشوراً جديداً · منذ 5 دقيقة",
      "kind": "post", "target": "/admin/posts", "created_at": "...", "badge": "LIVE" }
  ],
  "posts_table": [...], "chat_table": [...],
  "stories_table": [...], "reels_table": [...],
  "kpis": [...],
  "daily_views_values": [...], "daily_views_labels": [...],
  "audience": [...],
  "notifications_summary": { "total": 245, "unread": 12, "today": 8, "by_type": [...] },
  "reports_summary": { "total": 48, "pending": 6, "reviewing": 2, "resolved": 35,
                       "dismissed": 5, "escalated": 0, "today": 3, "by_target": [...] },
  "generated_at": "2026-06-17T22:00:00"
}
```

---

## 🔧 التغييرات على الـ Frontend

### 2) `frontend/src/api/admin.js`
- ✨ **`getAdminReportsStats()`** — يربط مباشرة `GET /api/reports/admin/stats` (يُستخدم في الـ Sidebar وفي AdminLayout)
- ✨ **`getAdminUnreadNotificationCount()`** — دالة مساعدة لاحتساب عدد الإشعارات غير المقروءة بسرعة

### 3) `frontend/src/pages/admin/AdminDashboard.jsx`
- ✅ **7 بطاقات إحصائية** بدلاً من 5 (أُضيفت `reports` و `notifications`)
- ✅ **Grid متجاوب**: 7 أعمدة → 4 → 3 → 2 حسب عرض الشاشة
- ✅ **النشاطات الأخيرة قابلة للنقر بشكل فردي** — كل عنصر يفتح صفحته الخاصة عبر `kind/target`:
  - `post` → `/admin/posts`
  - `user` → `/admin/users`
  - `report` → `/admin/reports`
  - `notification` → `/admin/notifications`
- ✅ **ألوان شارات ديناميكية**: `LIVE` (أخضر) / `NEW` (بنفسجي) / `BLAGH` (أحمر)
- ✅ بطاقات `chat` و `notifications` في `STAT_TARGETS` لها وجهات صحيحة الآن

### 4) `frontend/src/components/admin/AdminLayout.jsx`
- ✅ **يحمّل إحصائيات البلاغات** عبر `getAdminReportsStats()` ويعدّ المفتوحة منها (pending + reviewing)
- ✅ **يحسب الإشعارات غير المقروءة** ديناميكياً من البيانات المحملة
- ✅ **يمرر `badges` للـ Sidebar** لعرض العدد الحي بجانب الروابط
- ✅ **اشتراك في أحداث Socket إضافية**: `admin:report_created`, `admin:report_updated`, `admin:report_resolved`, `reports:new`
- ✅ **Fallback دوري كل 60 ثانية** لإعادة جلب الأعداد إذا تعطل الـ socket

### 5) `frontend/src/components/admin/AdminSidebar.jsx`
- ✅ يستقبل prop جديد `badges = { '/admin/reports': N, '/admin/notifications': M }`
- ✅ شارة حية متحركة (`admin-nav-badge-live`) عند وجود عدد > 0
- ✅ يدعم العرض `99+` لما يتجاوز العدد 99
- ✅ يحافظ على السلوك القديم (الشارة الثابتة `HOT`) كـ fallback

### 6) `frontend/src/styles/admin-modern.css`
- ✨ **`.admin-nav-badge-live`** — تدرّج لوني أحمر/برتقالي + ظل ناعم + **أنيميشن نبض** لجذب الانتباه
- ✨ كيفرايم `admin-nav-badge-pulse` (2s ease-in-out infinite)

### 7) `frontend/src/pages/admin/AdminNotifications.jsx` — **إعادة تصميم كاملة**
| الميزة الجديدة | الوصف |
| --- | --- |
| فلاتر الحالة | الكل / غير مقروء / مقروء |
| فلتر النوع | ديناميكي حسب الأنواع الموجودة (SYSTEM, ALERT, REPORT, MESSAGE, LIKE, ...) |
| بحث نصي | يطابق العنوان + المحتوى + اسم المستخدم |
| **تعليم مفرد كمقروء** | زر `markAdminNotificationRead` لكل صف غير مقروء |
| **تعليم الكل دفعة واحدة** | `Promise.allSettled` لجميع غير المقروءة |
| توزيع حسب النوع | شارات ملوّنة في بطاقة الملخص |
| ألوان موحّدة لكل نوع | `TYPE_BADGE_COLORS` map |
| **تحديث دوري كل 30 ثانية** | لضمان عرض الإشعارات اللحظية |
| Counter "X من Y" | يظهر عدد النتائج المفلترة من الإجمالي |

---

## 📊 خريطة الربط الكاملة (Routing Map)

```
لوحة التحكم الرئيسية /admin/dashboard
│
├─ 7 بطاقات إحصائية → كل بطاقة تفتح صفحتها التفصيلية
│  ├─ users          → /admin/users
│  ├─ views          → /admin/reports
│  ├─ revenue        → /admin/reports
│  ├─ posts          → /admin/posts
│  ├─ reels          → /admin/reels
│  ├─ reports  [NEW] → /admin/reports     (مع شارة حية في الـ Sidebar)
│  └─ notifications [NEW] → /admin/notifications (مع شارة حية في الـ Sidebar)
│
├─ المشاهدات (Area Chart)    → /admin/reports
├─ توزيع المحتوى (Donut)    → /admin/reports
├─ النشاطات الأخيرة         → كل عنصر يفتح صفحته (post/user/report/notification)
├─ إدارة المنشورات (Preview) → /admin/posts
├─ إدارة الشات (Preview)    → /admin/chat
├─ إدارة الستوري (Preview)  → /admin/stories
├─ إدارة الريلز (Preview)   → /admin/reels
└─ التقارير والإحصائيات    → /admin/reports
```

---

## 🔄 الأحداث اللحظية المدعومة (Socket Events)

### يستمع لها الـ AdminLayout الآن:
| الحدث | الإجراء |
| --- | --- |
| `admin:notification` | إضافة إشعار جديد + إظهار Toast |
| `admin:user_updated / _status_changed / _deleted` | إعادة تحميل الإشعارات |
| `admin:post_created / _updated / _deleted / posts_bulk_deleted` | إعادة تحميل |
| `admin:live_updated` | إعادة تحميل |
| `admin:report_created` ✨ جديد | إعادة جلب إحصائيات البلاغات + تحديث الشارة |
| `admin:report_updated` ✨ جديد | إعادة جلب إحصائيات البلاغات |
| `admin:report_resolved` ✨ جديد | تقليل عدّاد البلاغات في الـ Sidebar |
| `reports:new` ✨ جديد | تنبيه لحظي عند بلاغ جديد |

---

## ✅ نقاط الجودة والاختبار

- **Backward Compatible**: كل البيانات القديمة محفوظة، الحقول الجديدة إضافية فقط
- **Graceful Degradation**: استيراد مرن لـ `Report` model — لا تعطل في حال عدم وجوده
- **Error Boundaries**: كل query محاطة بـ `try/except` لمنع تعطل الـ endpoint كاملاً
- **Performance**: استخدام `cache` و `cacheTtlMs` في الـ axios layer (8–12 ثانية)
- **Mobile-friendly**: Grid متجاوب من 7 أعمدة (Desktop) إلى عمودين (Mobile)
- **RTL**: مدعوم بالكامل، فونت `Noto Sans Arabic`

---

## 📂 الملفات المعدّلة

```
backend/app/services/dashboard_live_service.py   (تحديث: +220 سطر)
frontend/src/api/admin.js                        (تحديث: +13 سطر)
frontend/src/pages/admin/AdminDashboard.jsx      (تحديث: +50 سطر)
frontend/src/components/admin/AdminLayout.jsx    (تحديث: +45 سطر)
frontend/src/components/admin/AdminSidebar.jsx   (تحديث: +12 سطر)
frontend/src/styles/admin-modern.css             (تحديث: +18 سطر)
frontend/src/pages/admin/AdminNotifications.jsx  (إعادة كتابة: 320 سطر)
```

---

## 🚀 طريقة النشر
1. لا حاجة لـ migration على قاعدة البيانات (التغييرات قراءة فقط).
2. أعد بناء الواجهة: `cd frontend && npm run build`
3. أعد تشغيل الـ backend (FastAPI/uvicorn) — endpoint `/api/admin/dashboard/live` سيعيد الحقول الجديدة تلقائياً.

---

**تم بحمد الله — v52 جاهز للنشر** ✅
