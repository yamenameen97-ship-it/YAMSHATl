# YAMSHAT v85.9 — إعادة تطبيق قسرية لإصلاحات v85.7 على الجوال

## الشكوى
> «كل المشاكل المذكورة في `FIXES_v85.7_FRIENDS_CHAT_COMMENTS_AR.md` لم تُصلَح
> فعلياً على المنصة عبر الجوال، حتى بعد مسح كاش المتصفح وإعادة الدخول.»

## السبب الجذري (لماذا لم تنعكس إصلاحات v85.7 على الجوال؟)

### 1) BUILD_ID في `main.jsx` بقي عند v79
```js
const BUILD_ID = 'yamshat-v79-REMOVE-COMPOSER-FILTERS';
```
آلية `hardResetIfBuildChanged()` تقارن هذا الثابت بما هو محفوظ في
`localStorage`. طالما القيمة لم تتغيّر، **لا يتم مسح localStorage ولا
إجبار reload** — أي أن الأصول القديمة تبقى.

### 2) Service Worker يخدم النسخة القديمة (الأخطر)
```js
// frontend/public/sw.js
const VERSION = 'yamshat-v20260613-000529-1781309129731';
// frontend/public/sw-enhanced.js
const VERSION = 'yamshat-v20260609-FIX2-livefix-enh-1780995999999';
```
هذا `VERSION` هو مفتاح Cache Storage. طالما لم يتبدّل، `sw.js` القديم
يعتبر نفسه محدَّثاً ويُخدِّم `index.html` + `main.js` القديمَين من
Cache Storage. **مسح كاش المتصفح لا يمسح Cache Storage للـ SW** —
لذلك المستخدم مسح الكاش لكنه بقي يرى v85.6/v85.7 لم تنعكس.

### 3) CSS خصوصية أدنى من `chat-mobile-pixel-match-v63/v64` + `pwa-mobile-hotfix`
ملف v85.7 استعمل selectors مثل `html body [data-yam-group-root="true"] .yam-chat-input-wrap`.
لكن قواعد `pwa-mobile-hotfix.css` تستعمل `@media (max-width:720px)` مع
`.yam-chat-input-wrap { position: sticky !important }` — نفس التخصص + وسائط،
وقد تفوز حسب ترتيب التسلسل.

## الحلول المُطبَّقة في v85.9

### أ) تحديث `BUILD_ID` إلى `yamshat-v85.9-MOBILE-FORCE-FIXES`
عند أول تشغيل بعد النشر، `hardResetIfBuildChanged()` سيرى قيمة مختلفة
عن المخزّنة → يُشغّل مسار الإعادة الجديد.

### ب) توسيع `hardResetIfBuildChanged()` ليكسر Service Worker + Cache Storage
```js
// إلغاء تسجيل كل SWs مسجّلة سابقاً
const regs = await navigator.serviceWorker.getRegistrations();
await Promise.all(regs.map((r) => r.unregister()));

// مسح كل Cache Storage
const keys = await caches.keys();
await Promise.all(keys.map((k) => caches.delete(k)));
```
بعد ذلك يُعاد التحميل مرة واحدة، ويقوم `pwaInitializer.init({swPath:'/sw.js'})`
بتسجيل نسخة جديدة تماماً من `sw.js` (بـ VERSION الجديد).

### ج) تحديث VERSION في `sw.js` و`sw-enhanced.js`
```js
const VERSION = 'yamshat-v85.9-MOBILE-FORCE-FIXES-20260708-1';
```

### د) ملف CSS جديد `yamshat-fixes-v85.9-MOBILE-FORCE-FIXES.css`
selectors ثلاثية-أربعية `html body div[data-yam-group-root="true"] footer.yam-group-input-area`
+ نسخة داخل `@media (max-width:720px)` لتتفوق حتى في التخصص الوسائطي.
يُستورد كآخر ملف CSS في `main.jsx` — يفوز على كل ما سبقه.

### هـ) `MobileCommentsSheet.jsx` — دعم أشكال إرجاع متعدّدة + حماية من الحلقات
- يقبل: `[]`, `{items:[]}`, `{comments:[]}`, `{results:[]}`, `{data:[]}`, `{data:{items:[]}}`.
- `walk()` يستخدم `Set` لتتبّع IDs المرئية → لن يعلق أبداً في مرجع دائري
  حتى لو أرجع الـ backend شجرة بها loop.

## الملفات المُعدَّلة
```
frontend/src/main.jsx                           — BUILD_ID + hardReset SW/caches purge
frontend/src/styles/yamshat-fixes-v85.9-MOBILE-FORCE-FIXES.css  — جديد
frontend/src/components/mobile/MobileCommentsSheet.jsx           — دعم أشكال متعدّدة + seen Set
frontend/public/sw.js                           — VERSION جديد
frontend/public/sw-enhanced.js                  — VERSION جديد
```

## اختبارات يدوية على الجوال
1. **أول فتح بعد النشر**: يجب أن تحدث إعادة تحميل تلقائية واحدة (يظهر
   شعار التطبيق مرة، ثم يعود). هذا طبيعي — يعني أن SW القديم أُلغي
   والكاش القديم مُسِح.
2. **صفحة الأصدقاء**: افتح `/friends` → يجب أن يعمل السحب لأعلى/أسفل
   بسلاسة (كان معطلاً).
3. **دردشة المجموعة**: افتح أي مجموعة → يجب أن يظهر **مربع كتابة واحد
   فقط** أسفل الشاشة، وأزرار الإرسال والإرفاق ظاهرة وقابلة للضغط.
4. **التعليقات**: افتح منشور به تعليقات (العدّاد ≥ 1) → يجب أن يفتح
   الشيت ويظهر جميع التعليقات، بما فيها التعليقات اليتيمة (ردود على
   تعليق أب محذوف/مخفي).

— نهاية v85.9
