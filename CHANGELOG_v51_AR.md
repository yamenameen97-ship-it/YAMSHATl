# yam-shat — CHANGELOG v51 (AR)

## 🎯 الإصلاحات في هذه النسخة (v51)

### 1️⃣ ترويسة المنشور — الاسم بجوار الصورة الشخصية مباشرة
- **الملف:** `frontend/src/pages/FeedEnhanced.jsx`
- **المشكلة السابقة:** الاسم والمعرف ووقت النشر كانوا بعيدين عن الصورة الشخصية (فجوة كبيرة)، والوقت كان منفصل في `yam-post-meta-v2`.
- **الحل:**
  - دمج `المعرف · الوقت` في سطر واحد تحت الاسم (مثل الصورة المرجعية).
  - تغيير `flex: 1` إلى `flex: 0 0 auto` على `.yam-post-author-v2-reversed` لجعل النص يلتصق بالصورة.
  - زر الخيارات (`...`) أصبح وحده على اليسار في `.yam-post-meta-v2`.

**النتيجة:** الترويسة الآن مطابقة تماماً للصورة المرجعية:
```
[الصورة] yamenameen97 ✓
         @yamenameen97 · منذ 4 دقيقة
```

---

### 2️⃣ لوحة الأدمن — إزالة الفراغ العلوي + ضغط الارتفاع + شريط سحب
- **الملفات:** `frontend/src/pages/admin/AdminDashboard.jsx`

#### أ) إزالة الفراغ العلوي:
- `admin-page-shell-modern`: `padding: 0 10px 6px` (كان `6px 12px 10px`).
- `admin-topbar-modern`: `min-height: 38px` و `padding: 2px 12px` (كان `44px / 4px 12px`).
- `breadcrumbs`: `margin: 0` و `padding: 2px 0` و `font-size: 10px`.
- `ls-admin`: `padding-top: 0` و `margin-top: 0` و `gap: 6px`.

#### ب) تقليل ارتفاع الصناديق:
- `.ls-card`: `min-height: 200px` (كان `240px`).
- `@media max-width 1280px`: `.ls-card` → `height: 195px`.
- `padding` داخل البطاقة: `8px 10px` (كان `10px 12px`).
- المسافات بين الصفوف: `gap: 6px` (كان `8px`).

#### ج) شريط سحب واضح داخل كل صندوق:
- `.ls-activity` و `.ls-table-wrap`:
  - عرض الشريط: `6px` (كان `4-5px`).
  - لون أكثر وضوحاً: `rgba(139,92,246,0.75)` مع تتبع track مرئي.
  - hover state أزرق-بنفسجي قوي.
  - `overflow-y: auto` مُفعّل لكل الجداول والقوائم لإظهار باقي المحتوى عند السحب.

---

## 📁 الملفات المُعدّلة
1. `frontend/src/pages/FeedEnhanced.jsx`
2. `frontend/src/pages/admin/AdminDashboard.jsx`

## ✅ التحقق
- لا تغيير في المنطق (logic) أو الـ API.
- التغييرات بصرية CSS + إعادة هيكلة صغيرة لـ JSX (دمج الوقت داخل سطر المعرف).
- متوافق مع RTL ومع `Noto Sans Arabic`.
