# 📋 CHANGELOG — v59.13.34 — إصلاح بوست التعليقات بالجوال + عدّادات الريلز + حفظ الريلز في قاعدة البيانات

> **الإصدار:** v59.13.34
> **التاريخ:** 2026-06-27
> **النطاق:** Frontend (CSS + JSX) + Backend (Python/FastAPI)
> **اللغة:** RTL — `dir="rtl"` + Noto Sans Arabic

---

## 🎯 المشاكل المُبلَّغ عنها من المستخدم

1. **بوست التعليق على المنشور في صفحة الجوال يظهر كبير جداً ويغطي الصفحة، ولا تظهر منطقة الكتابة.**
   - يجب أن يكون مثل بوست التعليق في صفحة المنشورات بنسخة الويب العادي.

2. **العدّادات في أزرار التفاعل بالريلز (إعجاب/تعليق/مشاركة) تعرض قيماً تجريبية وهمية.**
   - يجب تصفيرها وعرض الأرقام الفعلية من قاعدة البيانات فقط.

3. **الريلز لا يتم تخزينها في قاعدة البيانات.**
   - كلما يُرفع ريل ويُحدَّث الموقع/الملفات، تختفي الريلز المرفوعة سابقاً عند إعادة الدخول.

---

## ✅ الإصلاحات المُطبَّقة

### 🟢 إصلاح 1 — بوست التعليق في الجوال (Bottom Sheet)

**الملف:** `frontend/src/styles/mobile-yamshat-redesign.css`

**السبب الجذري:**
- `.ym-sheet` كان يستخدم `height: 55dvh; max-height: 55dvh;` بحجم ثابت يغطي معظم الشاشة.
- الـ composer (منطقة الكتابة) لم يكن `sticky` ولا يحمل `safe-area-inset-bottom` بنفسه → عند ظهور لوحة المفاتيح في الجوال، كان يختفي.
- الـ overlay كان بدون `position: relative` على `.ym-sheet` فيتم قص الـ composer.

**الحل:**
```css
.ym-sheet {
  height: auto;
  max-height: min(72dvh, 560px);
  min-height: 320px;
  position: relative;
  overflow: hidden;
  font-family: 'Noto Sans Arabic', 'Tajawal', system-ui, sans-serif;
}

.ym-sheet-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.ym-sheet-composer {
  position: sticky;
  bottom: 0;
  z-index: 2;
  background: var(--ym-card, #141A29);
  padding-bottom: calc(10px + env(safe-area-inset-bottom, 0px));
  flex-shrink: 0;
}
```

**النتيجة:**
- ✅ البوست بحجم متوسط مطابق لنسخة الويب.
- ✅ منطقة الكتابة (composer) ظاهرة دائماً ولو ظهرت لوحة المفاتيح.
- ✅ منطقة التعليقات قابلة للتمرير داخلها بدون أن تطغى على الـ composer.

---

### 🟢 إصلاح 2 — تصفير عدّادات الريلز التجريبية

**الملف:** `frontend/src/pages/Reels.jsx`

**السبب الجذري:**
داخل `normalizeReel()` كانت تُستخدم قيم fallback وهمية:
```js
likes_count: Number(item.likes_count || 1200),   // ❌
comments_count: Number(item.comments_count || 128), // ❌
share_count: Number(item.share_count || 356),    // ❌
```
بالإضافة إلى:
- `username: 'yamenameen97'`
- `is_verified: true`
- `content: 'الليل، المدينة، والإضاءة البنفسجية'`
- `hashtags: ['Yamshat', 'Reels', 'Night']`
- `useState(0.42)` لشريط التقدم.
- `setReels([normalizeReel({})])` كان يولّد ريل تجريبي عند الفشل.

**الحل:**
```js
likes_count: Number(item.likes_count ?? 0) || 0,
comments_count: Number(item.comments_count ?? 0) || 0,
share_count: Number(item.share_count ?? item.shares_count ?? 0) || 0,
views_count: Number(item.views_count ?? 0) || 0,
username: item.username || item.user?.username || '',
is_verified: Boolean(item.is_verified ?? item.user?.is_verified ?? false),
content: item.content || item.caption || item.description || '',
hashtags: Array.isArray(item.hashtags) ? item.hashtags : [],
```
- `progress` يبدأ من `0` بدلاً من `0.42`.
- عند الفشل: `setReels([])` (قائمة فارغة حقيقية) بدل ريل تجريبي.

**النتيجة:**
- ✅ كل العدّادات تعرض الأرقام الفعلية من قاعدة البيانات.
- ✅ لا يوجد ريل وهمي يظهر عند فشل الـ API.
- ✅ شريط التقدم يبدأ من 0 ويتحدّث من الفيديو الفعلي.

---

### 🟢 إصلاح 3 — حفظ الريلز في قاعدة البيانات (المشكلة الكبرى)

**الملفات:**
- `backend/app/api/routes/reels.py`
- `frontend/src/pages/ReelComposer.jsx`

#### 🔴 المشكلة الجذرية (Backend):

في `_load_reels_items()` كان الكود يقوم بالآتي عند كل جلب للفيد:

```python
if not video_ok:                # _media_file_exists يفحص /uploads/<file> محلياً
    reel.is_deleted = True      # ❌ يُعلِّم السجل كمحذوف نهائياً
    db.add(reel)
    continue
db.commit()
```

**ماذا يحدث فعلياً عند نشر التحديثات:**
1. المستخدم يرفع ريل → يُحفظ في DB + الملف في `/uploads/abc.mp4`.
2. عند إعادة نشر الـ backend (أو إعادة تشغيل الحاوية)، يكون `/uploads/` غير دائم → الملف يُمسح.
3. عند جلب الفيد، `_media_file_exists` يُرجع `False` → الكود يضع `is_deleted = True`.
4. **النتيجة:** السجل في قاعدة البيانات موجود، لكن مُعلَّم كمحذوف → لا يعود في أي استعلام أبداً.

#### ✅ الحل (Backend):

```python
def _load_reels_items(db, current_user, *, limit, offset, category):
    query = db.query(Reel).filter(Reel.is_deleted.is_(False))
    if str(category or 'all').strip().lower() != 'all':
        query = query.filter(Reel.category == str(category).strip())
    reels = query.order_by(desc(Reel.created_at), Reel.id.desc())\
                 .offset(offset).limit(limit).all()
    serialized = []
    for reel in reels:
        try:
            payload = _serialize_reel(db, reel, current_user=current_user)
        except Exception as exc:
            logger.warning('Failed to serialize reel %s: %s', reel.id, exc)
            continue
        # نُسجِّل تحذيراً فقط — لا نحذف السجل ولا نستبعده من النتائج
        try:
            if not _media_file_exists(payload.get('video_url')):
                logger.warning(
                    'Reel %s media file missing on disk (kept in DB): %s',
                    reel.id, payload.get('video_url'),
                )
        except Exception:
            pass
        serialized.append(payload)
    return serialized
```

**التغييرات الجوهرية:**
- ❌ **إزالة** `reel.is_deleted = True` نهائياً عند فقد الملف.
- ❌ **إزالة** `db.commit()` في نهاية الـ feed loader (لا نعدّل أي شيء).
- ❌ **إزالة** `fetch_limit = max(limit * 4, limit + 20)` لأننا لا نُفلتر بعد الآن.
- ✅ السجل يبقى دائماً في قاعدة البيانات.
- ✅ تسجيل تحذير في الـ logs فقط (لمراقبة الـ filesystem).

#### ✅ تعزيز ثانٍ (Frontend) — ضمان وصول الملف للـ backend:

في `ReelComposer.jsx::onConfirm()` كان الكود يعتمد كلياً على `mediaUploadService.uploadFile()` لإنتاج `mediaUrl`. إذا فشلت الخدمة أو أعادت سلسلة فارغة، كان الـ backend يرفض الطلب بـ `400 Bad Request` ولا يحفظ شيئاً.

**الحل الجديد:** عند غياب `mediaUrl` نرفع الملف مباشرة كـ `multipart/form-data` إلى `POST /reels` (وهو مسار مدعوم أصلاً في الـ backend سطر 204):
```js
const fd = new FormData();
fd.append('file', file, file.name || `reel-${Date.now()}.webm`);
fd.append('caption', captions || '');
fd.append('category', 'general');
await API.post('/reels', fd, {
  headers: { 'Content-Type': 'multipart/form-data' },
  onUploadProgress: (e) => { /* تحديث شريط التقدم */ },
});
```

**النتيجة:**
- ✅ الريلز المرفوعة سابقاً تبقى ظاهرة دائماً (حتى بعد إعادة نشر الـ backend).
- ✅ مسار رفع موثوق مزدوج (خدمة الرفع + multipart مباشر) يضمن الحفظ في DB.
- ✅ إذا فُقد ملف الفيديو من الـ filesystem، السجل يبقى ويُسجَّل تحذير فقط.

> 💡 **توصية إنتاجية:** لمنع فقد ملفات `/uploads/` عند إعادة النشر، اربط مجلد `/uploads/` بـ Persistent Volume أو خزّن الملفات في خدمة خارجية (S3 / R2 / MinIO).

---

## 📂 ملفات معدّلة

| الملف | النوع | الوصف |
|--------|------|--------|
| `frontend/src/styles/mobile-yamshat-redesign.css` | CSS | تصغير ارتفاع الـ sheet، composer ثابت |
| `frontend/src/pages/Reels.jsx` | JSX | تصفير العدّادات/البيانات التجريبية |
| `frontend/src/pages/ReelComposer.jsx` | JSX | fallback لرفع multipart مباشر |
| `backend/app/api/routes/reels.py` | Python | إيقاف حذف السجلات عند فقد الملف |
| `frontend/package.json` | JSON | رفع الإصدار إلى 59.13.34 |
| `CHANGELOG_v59.13.34_*_AR.md` | MD | هذا الملف |

---

## 🧪 سيناريوهات اختبار يدوي

### اختبار 1 — بوست التعليق في الجوال
1. افتح المنشورات على الجوال (عرض ≤ 768px).
2. اضغط زر التعليق على أي منشور.
3. **متوقع:** الـ sheet يظهر بارتفاع متوسط (≤ 72% من الشاشة)، حقل الكتابة ظاهر بالأسفل ولا تغطّيه لوحة المفاتيح.

### اختبار 2 — عدّادات الريلز
1. افتح صفحة `/reels` بدون أي ريل في DB.
2. **متوقع:** قائمة فارغة + لا يظهر أي ريل تجريبي يحمل اسم `yamenameen97` أو رقم `1.2K` إعجاب.
3. ارفع ريل واحد → يجب أن تظهر العدّادات `0/0/0` وتزداد عند التفاعل الفعلي.

### اختبار 3 — حفظ الريلز
1. ارفع ريل من `/reels/composer`.
2. ادخل إلى `/reels` → الريل يظهر.
3. أعد تشغيل/نشر الـ backend (حتى لو مُسحت `/uploads/`).
4. ادخل مجدداً إلى `/reels` → **متوقع:** الريل ما زال يظهر في القائمة (لن يُحذف من قاعدة البيانات).

---

## 🚀 خطوات التطبيق

```bash
# Backend
cd backend
# لا تحتاج migrations — التعديل في query logic فقط
docker compose restart backend  # أو إعادة تشغيل خدمة FastAPI

# Frontend
cd frontend
npm run build
# أو في التطوير:
npm run dev
```

---

## 📌 ملاحظات

- لم نُغيّر أي schema في قاعدة البيانات.
- لم نُغيّر أي endpoint موجود — فقط منطق `_load_reels_items` الداخلي.
- التوافق العكسي محفوظ مع جميع الإصدارات السابقة من الواجهات.
- **بدون nodemodules** كما طُلب: مجلد `node_modules/` غير مُضمَّن في الـ ZIP.
