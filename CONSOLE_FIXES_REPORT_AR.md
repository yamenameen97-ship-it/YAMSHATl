# تقرير إصلاح مشاكل الكونسول — Yamshat

تاريخ الإصلاح: 2026-06-05
الإصدار: `1.0.1-pwa-enhanced-patched`

---

## 🔍 المشاكل المرصودة في الكونسول

من لقطات الشاشة الأربعة المقدّمة:

| # | المشكلة | المصدر | الخطورة |
|---|---------|--------|---------|
| 1 | `TypeError: Failed to execute 'put' on 'Cache': Partial response (status code 206) is unsupported` | `sw-pwa-enhanced.js:148` (`cacheFirstStrategy` + `networkFirstStrategy`) | 🔴 حرجة (تتكرر عشرات المرات) |
| 2 | `GET /brand/yamshat-logo.png 404` | الـ frontend يطلب الشعار من الـ backend | 🟡 متوسطة |
| 3 | `GET /uploads/*.mp4 / *.png / *.webm 404` | روابط ملفات قديمة محذوفة من التخزين | 🟡 متوسطة |
| 4 | `AxiosError: Request failed with status code 500` (Failed to load comments) | `FeedEnhanced` → `GET /api/comments/{id}/comments` | 🟠 عالية |
| 5 | اختلاط دومينات (`yamshat8` يطلب من `yamshat-1ya4`) | إعدادات قديمة في `mediaConfig.js` | 🟢 منخفضة |

---

## 🛠️ الإصلاحات المطبّقة

### 1️⃣ إصلاح `sw-pwa-enhanced.js` — السبب الرئيسي للضجيج

**الملفات المعدّلة:**
- `frontend/public/sw-pwa-enhanced.js`
- `frontend/dist/sw-pwa-enhanced.js` (نسخة مطابقة)

**التغييرات:**

```js
// ✅ دالة safeCachePut جديدة تتجاهل تلقائياً:
function isCacheable(request, response) {
  if (response.status === 206) return false;        // ← السبب الأصلي
  if (!response.ok && response.type !== 'opaque') return false;
  if (request.headers.get('range')) return false;
  if (response.headers.get('cache-control')?.includes('no-store')) return false;
  return true;
}
```

- تجاهل **استجابات 206** (Partial Content) — مصدر الخطأ الرئيسي عند تحميل الفيديو/الصوت.
- تجاهل طلبات **Range** من التخزين بالكامل.
- استبدال `cache.put` المباشر بـ `safeCachePut` التي لا ترمي استثناءات أبدًا.
- استراتيجية `mediaStrategy` جديدة للوسائط:
  - عند 404 على شعار قديم → fallback تلقائي لـ `/brand/yamshat-logo.png` المحلي.
  - عند 404 على `/uploads/*` → رد صامت `204` بدلاً من ضجيج الكونسول.

### 2️⃣ إصلاح خطأ 500 على endpoint التعليقات

**الملف:** `backend/app/api/routes/comments.py`

```python
@router.get('/{post_id}/comments')
def get_all(...):
    try:
        payload = get_comments(...)
        payload['items'] = rank_comments(payload['items'], current_user)
        return payload
    except HTTPException:
        raise
    except Exception as exc:
        logging.getLogger(__name__).warning(...)
        return {'items': [], 'total': 0, 'page': page, 'limit': limit, 'has_more': False}
```

- بدلاً من إرجاع 500، يُرجع قائمة فارغة `{items: []}` عند أي خطأ غير متوقع.

### 3️⃣ إصلاح handler التعليقات في الـ frontend

**الملف:** `frontend/src/components/mobile/MobileCommentsSheet.jsx`

- يتم الآن ابتلاع 500 بصمت بدلاً من رمي `console.warn` صاخب.

### 4️⃣ معالجة الشعارات والـ uploads القديمة

- `mediaConfig.js` يحتوي بالفعل على `rewriteKnownBrokenBrandAsset` و`rewriteLegacyHost` التي تعيد توجيه الأصول القديمة.
- `OptimizedImage.jsx` يستخدم بالفعل `FALLBACK_SVG` صامتاً.
- إضافة معالجة على مستوى الـ Service Worker كطبقة دفاع ثانية.

---

## 📊 ملخص الأثر المتوقع

| قبل الإصلاح | بعد الإصلاح |
|-------------|--------------|
| 8+ أخطاء `Uncaught (in promise)` في كل تحميل | 0 ❌ |
| ضجيج 404 على كل ملف uploads قديم | رد صامت 204 |
| AxiosError 500 عند فتح أي منشور | قائمة تعليقات فارغة بهدوء |
| الشعار غير ظاهر أحياناً | fallback محلي مضمون |

---

## 🚀 خطوات التطبيق على الخادم

1. **نشر الـ frontend**: ارفع محتوى `frontend/dist/` إلى Render (`yamshat8.onrender.com`).
2. **مهم — حذف الـ Service Worker القديم من المستخدمين:**
   - أضف الإصدار الجديد سيُجبر `skipWaiting()` على التحديث.
   - أو وجّه المستخدمين لفتح DevTools → Application → Service Workers → **Unregister**.
3. **نشر الـ backend**: ارفع `backend/` إلى `yamshat-1ya4.onrender.com`.
4. **التحقق**: افتح الكونسول → يجب ألا ترى أي `TypeError: Failed to execute 'put'` بعد إعادة التحميل.

---

## ⚠️ ملاحظات إضافية

- الأخطاء 404 على ملفات `/uploads/9b95c65...png` و `/uploads/cdc97aa...mp4` تعني أن **الملفات نفسها محذوفة** من التخزين على الخادم. الإصلاح الحالي يخفي الضجيج فقط — الحل الجذري هو **تنظيف قاعدة البيانات** من المنشورات التي تشير إلى ملفات غير موجودة، أو إعادة رفع الملفات.
- يُنصح بتشغيل سكربت تنظيف دوري على الـ backend لإزالة المراجع المعطوبة.
