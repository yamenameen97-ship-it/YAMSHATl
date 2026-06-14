# إصلاحات الإصدار v26 — صفحة الريلز

## ١. إصلاح مشكلة عدم حفظ التعليق على الريلز ✅
**المشكلة:**
في `frontend/src/components/feed/NestedComments.jsx` كان مكوّن إدخال التعليق يُرسل كائنًا `{ content }`:
```js
onAddComment?.({ content: commentText.trim() });
```
بينما في `frontend/src/pages/Reels.jsx` كنا نُمرّر هذا الكائن مباشرةً إلى دالة `addComment`:
```js
const { data } = await addComment(activeReel.id, content); // ← content هنا كائن وليس نصًّا
```
ودالة الـAPI تتوقع نصًّا:
```js
export const addComment = (postId, content, parentId = null) =>
  API.post(`/posts/${postId}/comment`, { content, parent_id: parentId });
```
نتيجةً لذلك كان الخادم يستقبل `content` ككائن، فلا يُحفظ التعليق.

**الحل:**
- استخراج النص من الكائن (`payload.content`) قبل تمريره إلى `addComment`.
- التحقق من وجود نص فعلي قبل الإرسال.
- معالجة الاستجابة بصيغها المختلفة (`data.comment` / `data.data` / `data`).
- زيادة عدّاد التعليقات على الريل تلقائيًا.
- ربط `onReply` لدعم الردود المتداخلة.
- إظهار Toast للنجاح والخطأ.

## ٢. إخفاء نص "الجودة/الشبكة/Buffer events" ✅
**المشكلة:** الشريط العائم بأعلى الفيديو كان يُظهر:
- `الجودة الفعلية: موفر`
- `الشبكة: 4g`
- `Buffer events: 3`
- `الوضع: تلقائي`
- `آخر مشاهدة …`

وهو ما كان يغطي محتوى الريل.

**الحل:**
- إخفاء `reels-status-ribbon` بـ `display: none !important`.
- حذف صفّ `reel-meta-row` العلوي وشاريات `reel-chip ghost` من رأس الريل.
- الإبقاء فقط على شريط `reel-buffer-banner` عند حدوث Buffering فعلي (ويظهر بشكل مدمج).

## ٣. إخفاء تعليمات "مرر عموديًا أو اسحب للأعلى والأسفل" ✅
**الحل:** حذف العنصر `<p className="reel-hint">…</p>` ومحتوى الـ `reel-chip "الريلز"` و`reel-count-pill` من الـ `reel-top-overlay`. الآن الأعلى أصبح خاليًا تمامًا من النصوص المُغطّية، عدا الأزرار العائمة الجديدة.

## ٤. شريط علوي عائم بأزرار شفافة (Back + Search) ✅
أُضيف عنصر جديد على مستوى صفحة الريلز (وليس على مستوى كل ريل) باسم `reels-floating-top-bar` يحتوي على:
- **زر رجوع عائم** على يمين الشاشة (RTL → start) — يستخدم `navigate(-1)` أو `/` إذا لم يوجد تاريخ.
- **زر بحث شفاف** على يسار الشاشة (RTL → end) — ينتقل إلى مسار `/search` الموجود مسبقًا في `App.jsx`.

التصميم مطابق للقطة المرجعية من YAMSHAT:
- خلفية شبه شفافة `rgba(15,23,42,0.32)`.
- `backdrop-filter: blur(14px) saturate(140%)` لتأثير الزجاج.
- حدّ خفيف `1px rgba(255,255,255,0.18)`.
- شكل دائري `border-radius: 999px` بحجم `42×42`.
- يحترم `env(safe-area-inset-top)` للأجهزة ذات النوتش.
- `z-index: 40` فوق كل شيء.

## ٥. ربط أزرار التفاعل ورفعها للأعلى ✅
**القائم سابقًا:** `bottom-24` (~96px) وبعض الأزرار قريبة من شريط الفوتر.

**الجديد:**
- رُفع المربع إلى `bottom-36` (~144px) لإبعاده عن الفوتر.
- نُقل من `right-4` إلى `right-3` ليلتصق بحافة الشاشة.
- `z-index: 30` و `pointer-events-auto` للتأكد من قابلية الضغط.
- كل زر أصبح `<button type="button">` صريحًا.
- إضافة `aria-label` لكل زر (إعجاب، تعليقات، حفظ، مشاركة، بلاغ).
- إضافة `e.stopPropagation()` قبل استدعاء كل handler حتى لا يُؤدّي الضغط إلى إيقاف/تشغيل الفيديو بدلًا من تنفيذ الإجراء.
- المسافة بين الأزرار خُفّضت من `gap-4` إلى `gap-3` لإبقاء كومة الأزرار مُحكمة.

## الملفات المُعدّلة
- `frontend/src/pages/Reels.jsx` — تعديلات JSX و CSS داخلية فقط.

## التحقق
- ✅ Balanced braces/parens/brackets.
- ✅ `@babel/parser` parses the file successfully (JSX OK).

## ملاحظات
- لم يُلامس أي ملف خارج صفحة الريلز.
- لا تأثير على Backend أو Routes الأخرى.
- المسار `/search` موجود مسبقًا، فلا حاجة لإعداد إضافي.
