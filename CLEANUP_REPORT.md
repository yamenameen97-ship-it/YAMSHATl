# تقرير التنظيف الشامل — yam-shat v87.8

**تاريخ التنظيف:** 2026-07-11
**عدد الملفات المحذوفة:** 27 ملف
**المساحة المُحرَّرة:** ~456 KB (من ملفات الكود)

---

## 🎯 المنهجية

تم التحقق من كل ملف قبل الحذف بالخطوات التالية:
1. البحث عن كل الاستخدامات (imports/references) في الكود
2. التأكد من عدم تسجيل الروترات في `main.py`
3. مقارنة محتوى الملفات المكررة (md5)
4. اختبار صحة الاستيرادات بعد الحذف (AST parse + import resolution)

---

## 🗑️ الملفات المحذوفة (كلها متحقق منها كغير مستخدمة)

### Backend — روترات مُعطَّلة (غير مُسجَّلة في `app/main.py`)
- `backend/app/api/routes/reels_fix.py` — نسخة قديمة استُبدلت بـ `reels.py` الحالي
- `backend/app/api/routes/admin_dashboard_v2.py`
- `backend/app/api/routes/auth_v2.py`
- `backend/app/api/routes/chat_enhanced.py`
- `backend/app/api/routes/chat_enhanced_v2.py`
- `backend/app/api/routes/inbox_v2.py`
- `backend/app/api/routes/profile_v2.py`
- `backend/app/api/routes/posts_enhanced.py`
- `backend/app/api/routes/search_enhanced.py`
- `backend/app/api/routes/groups_enhanced.py`
- `backend/app/api/routes/live.py` (كان مذكور فقط في تعليقات — كل الاستخدامات الحقيقية لـ live تمر عبر `services/live-service/` المستقلة)
- `backend/app/api/routes/stories_reels_enhanced.py`
- `backend/app/api/routes/ws.py` (WebSockets الحقيقية تُدار داخل `groups.py` و`ws_notifications.py`)

### Backend — خدمات غير مستخدمة
- `backend/app/services/inbox_service_v2.py` (كان يستخدمه `inbox_v2.py` المحذوف فقط)

### Backend — سكريبتات إصلاح لمرة واحدة (One-time patches)
- `backend/app/models/__init___engagement_patch.py` (ملف تعليمات patch نصية، ليس كود قابل للاستيراد)
- `backend/app/fix_admin_login.py` (سكريبت إصلاح لمرة واحدة)
- `backend/fix_admin_login.py` (نسخة أقدم بمسار جذر)
- `backend/fix_accounts.py` (سكريبت إصلاح لمرة واحدة)
- `backend/scripts/add_users_v2.py` (سكريبت seed بمسار hardcoded `/home/ubuntu/...`)
- `backend/scripts/migrate_db_v2.py` (migration يدوي بمسار hardcoded)

### Frontend — ملفات مكررة/قديمة
- `frontend/src/components/profile/ProfileHeader_Fixed.jsx` (نسخة أقدم 598 سطر — المستخدم فعلياً `ProfileHeader.jsx` v85 بـ 1161 سطر)
- `frontend/public/profile-pixel-perfect.html` (مطابق تماماً لـ `profile.html` — نفس md5)
- `frontend/public/yamshat-logo.jpg` (مطابق تماماً لـ `public/brand/yamshat-logo.jpg` — كل الاستخدامات في الكود تشير إلى `/brand/yamshat-logo.jpg`)

### Frontend — ملفات public غير مستخدمة
- `frontend/public/FIXES_v32_AR.html` (توثيق إصلاح قديم لا يشار له من أي مكان)
- `frontend/public/captcha-debug.html` (أداة debug غير مُشار لها)
- `frontend/public/yamshat_live_desktop.html` (صفحة معزولة غير مُشار لها)

### Services — نسخ v2 مكررة
- `services/live-service/enhanced_live_service_v2.py` (نسخة مصغّرة 20K مقابل الأصلية `enhanced_live_service.py` بـ 33K — الأصلية أشمل)

---

## ✅ الملفات التي أُبقيت رغم شكلها كإصلاحات (بسبب أنها **مستخدمة فعلياً**)

جميع ملفات `yamshat-fixes-v*.css` (29 ملف، 408 KB) و ملفات `*-fix*.css` **مُستوردة كلها في `frontend/src/main.jsx`** — حذفها سيكسر بناء الأنماط. دمجها في ملف واحد ممكن نظرياً لكنه يحمل مخاطرة عالية على ترتيب أولويات الـ CSS.

الملفات `__init__.py` الفارغة في backend/app/* هي ملفات ضرورية لنظام packages في بايثون — لا يجوز حذفها.

---

## 🧪 التحقق بعد الحذف

- ✅ جميع الروترات المُسجَّلة في `backend/app/main.py` موجودة
- ✅ جميع ملفات بايثون تحلَّل بدون أخطاء syntax
- ✅ جميع استيرادات CSS/JS المحلية في `frontend/src/main.jsx` تنتهي إلى ملفات موجودة
- ✅ لا توجد مجلدات فارغة نتجت عن الحذف
