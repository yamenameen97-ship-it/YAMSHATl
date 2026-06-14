# 🚨 نظام البلاغات الشامل - YAMSHAT

> تم تنفيذ نظام بلاغات احترافي يغطي **كل** محتوى المنصة، مع لوحة إدارة كاملة للمشرفين.

---

## 📦 الملفات المُضافة (جديدة)

### Backend
| الملف | الوصف |
|------|------|
| `backend/app/models/report.py` | نموذج `Report` و `ReportEvent` |
| `backend/app/schemas/report.py` | Pydantic schemas |
| `backend/app/services/report_service.py` | منطق العمل الكامل |
| `backend/app/api/routes/reports.py` | الراوتر (8 endpoints) |
| `backend/alembic/versions/20260614_0010_reports_system.py` | هجرة قاعدة البيانات |

### Frontend
| الملف | الوصف |
|------|------|
| `frontend/src/components/reports/ReportModal.jsx` | نافذة الإبلاغ (RTL) |
| `frontend/src/components/reports/MoreOptionsMenu.jsx` | قائمة الثلاث نقاط الموحّدة |
| `frontend/src/components/admin/AdminReportsPanel.jsx` | لوحة الأدمن (RTL) |
| `frontend/src/api/reports.js` | خدمات API |

### الوثائق
- `REPORTS_SYSTEM_INTEGRATION_AR.html` — دليل التكامل الكامل (RTL + Noto Sans Arabic)

---

## 🔧 التعديلات على ملفات موجودة

- `backend/app/models/__init__.py` — تسجيل `Report` و `ReportEvent`
- `backend/app/main.py` — تسجيل راوتر `/api/reports`

---

## 🎯 الأماكن التي يعمل فيها زر "إبلاغ"

| المكان | نوع الكيان | الكود |
|--------|-----------|------|
| المنشورات | `post` | في `PostCard` |
| الريلز | `reel` | في صفحة Reels |
| الستوري | `story` | في عارض الستوري |
| تعليقات المنشورات | `comment` | في قائمة التعليقات |
| تعليقات الريلز | `reel_comment` | في تعليقات الريل |
| رسائل الشات | `message` | في فقاعة الرسالة |
| رسائل المجموعات | `group_message` | في فقاعة الرسالة |
| الحسابات | `user` | في الملف الشخصي |
| المجموعات | `group` | في صفحة المجموعة |
| الغرف الصوتية | `voice_room` | في الغرفة الصوتية |

---

## 🚀 خطوات التشغيل

```bash
# 1) تشغيل الهجرة
cd backend
alembic upgrade head

# 2) إعادة تشغيل الباك إند
# الراوتر مسجّل تلقائياً في main.py

# 3) الواجهة — استبدل أزرار الثلاث نقاط بـ <MoreOptionsMenu />
```

---

## 🧠 المزايا الذكية المضافة من عندي

1. **Snapshot للمحتوى** — يحفظ نسخة من المحتوى وقت البلاغ (يصمد ضد الحذف)
2. **تجميع البلاغات المكررة** — عداد تلقائي
3. **ترقية الأولوية التلقائية** — 5 بلاغات → high، 10 → urgent
4. **أولوية حسب السبب** — self_harm/violence = urgent فوراً
5. **إشعارات لحظية للمشرفين** — لكل بلاغ جديد
6. **إشعار المُبلِّغ بالنتيجة** — بعد المعالجة
7. **سجل أحداث (Audit Trail)** — جدول `report_events`
8. **منع البلاغ على النفس**
9. **تسجيل IP/User-Agent** — لمكافحة سوء الاستخدام
10. **إجراءات جماعية (Bulk)** — معالجة عدة بلاغات بنقرة

---

**بارك الله فيكم وزادكم علماً 🌹**
