# YAMSHAT — تحديث v59.13.28 (Home Mobile = Groups Mobile Parity)

> 🎯 **شكوى المستخدم (نهائية وحاسمة)**:
> "أريد الصفحة الرئيسية بالويب موبايل تعمل بالمس والسحب لأعلى وأسفل
> مثل صفحة المجموعات تماماً. العاطلة الآن الصفحة الرئيسية، والصالحة
> صفحة المجموعات بالويب موبايل. الصفحة الرئيسية ويب موبايل عندما
> أسحب لفوق ولتحت ما ترضى، ما تستجيب، ما تقبل ما تسحب.
> ما أريد هو أن تشوف كيف هي صفحة المجموعات على ويب موبايل معمولة،
> وتعمل الصفحة الرئيسية لويب موبايل مثلها. خفيفة ومرنة وتعمل بسلاسة
> بدون مشاكل، من أي منطقة أسحب تستجيب."

تاريخ الإصدار: 2026-06-26

---

## 🔎 لماذا فشلت v59.13.26 على الصفحة الرئيسية فقط

نسخة v59.13.26 حاولت أن تجعل كل الصفحات تعمل مثل الريلز عبر ضبط
`.page-content` في `MainLayout` بـ `position: absolute; inset: 0`.
هذا نجح على بعض الصفحات لكن **فشل على الصفحة الرئيسية** لسببين:

### السبب الأول — تعارض ملفات CSS القديمة
ملف `mobile-scroll-final-v59.13.2.css` يستهدف selectors قديمة:
```css
main.mobile-main-content { ... overflow-y: auto !important; ... }
.mobile-layout-container { overflow: hidden !important; }
```
وملف `mobile-pull-fix-v59.13.20.css` يضع قواعد متعددة على
`.ym-feed` و `.page-content` معاً. هذا الضباب في cascade يجعل
المتصفح غير متأكد أين هي حاوية التمرير الفعلية على الصفحة الرئيسية،
فيعطّل momentum scroll على iOS Safari.

### السبب الثاني — `FeedMobile` لا يملك scroll container خاصاً به
على عكس `GroupsHome` (يستخدم `<div className="yam-groups-page">`
بـ `height: 100dvh; overflow-y: auto`)، كانت `FeedMobile` تكتفي بـ:
```jsx
<>
  <MobileComposer />
  <MobileFilterPills />
  <div className="ym-feed">...</div>
</>
```
**فراغ بدون wrapper** — يعتمد كلياً على `.page-content` في
MainLayout، الذي يعاني من تعارضات CSS أعلاه.

### لماذا صفحة المجموعات تعمل بسلاسة فائقة؟
لأنها تنشئ scroll container داخلياً مستقلاً بأبعاد ثابتة:
```css
.yam-groups-page {
  height: 100dvh;
  overflow-y: auto;
}
```
هذا يعطي المتصفح **حاوية تمرير ذات أبعاد ثابتة معروفة مقدماً** →
iOS Safari يفعّل momentum scroll بثقة، ومن أي منطقة يلمس فيها
المستخدم يعمل السحب فوراً.

---

## ✅ الحل في v59.13.28 (مماثل 1:1 لصفحة المجموعات)

نُغلّف محتوى `FeedMobile.jsx` بـ `<div className="yam-home-mobile-page">`
يطبّق **نفس بصمة `.yam-groups-page` بالضبط**.

### 1️⃣ ملف CSS جديد: `home-mobile-page-v59.13.28.css`

ينشئ كلاس `.yam-home-mobile-page` يحاكي `.yam-groups-page` 1:1:

```css
.yam-home-mobile-page {
  height: 100vh;
  height: 100dvh;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px 12px calc(100px + env(safe-area-inset-bottom, 0px)) 12px;
  font-family: 'Noto Sans Arabic', 'Tajawal', sans-serif;
  direction: rtl;

  /* السر: momentum scroll حقيقي على iOS */
  -webkit-overflow-scrolling: touch;
  touch-action: pan-y;
  overscroll-behavior-y: contain;
  overscroll-behavior-x: none;

  /* لا transform يكسر momentum */
  transform: none;
  filter: none;
  perspective: none;

  pointer-events: auto;
  scroll-behavior: smooth;
  overflow-anchor: none;
}
```

بالإضافة إلى:
- `@supports (-webkit-touch-callout: none)` لضمان iOS Safari
- معالجة `.ym-feed` كحاوية محتوى داخلية شفافة (لا overflow ذاتي)
- ضبط الكاروسيلات الأفقية بـ `touch-action: pan-x`
- ضبط الأزرار/الروابط بـ `touch-action: manipulation`
- ضبط الحقول النصية بـ `touch-action: auto`
- ضبط الصور بـ `touch-action: pan-y` + منع السحب
- حماية صريحة عبر `:has(.yam-home-mobile-page)` على `.page-content`
  لإلغاء padding من الأم لتجنب double-padding

### 2️⃣ تعديل `FeedMobile.jsx`

تغليف المحتوى بـ wrapper جديد:

```jsx
return (
  <>
    {/* ⭐ v59.13.28 — wrapper مطابق لـ .yam-groups-page */}
    <div
      className="yam-home-mobile-page"
      dir="rtl"
      role="region"
      aria-label="الصفحة الرئيسية"
      style={{ fontFamily: "'Noto Sans Arabic','Tajawal','Cairo',sans-serif" }}
    >
      <MobileComposer ... />
      <MobileFilterPills ... />
      <div className="ym-feed">
        {filtered.map(post => <MobilePostCard ... />)}
      </div>
      {empty && <div className="ym-empty">...</div>}
    </div>

    {/* بوتوم شيت التعليقات + Modal خيارات المنشور خارج scroll container
       لأنها overlays fixed/portal */}
    <MobileCommentsSheet ... />
    <Modal ... />
  </>
);
```

### 3️⃣ تسجيل ملف CSS كآخر import في `main.jsx`

```js
import './styles/yamshat-fixes-v59.13.26.css';
import './styles/home-mobile-page-v59.13.28.css'; // ⭐ الجديد
```

---

## 📂 الملفات المعدّلة في v59.13.28

| الملف | نوع التعديل |
|-------|-------------|
| `frontend/src/styles/home-mobile-page-v59.13.28.css` | ✨ ملف جديد (~260 سطر) — بصمة المجموعات على الصفحة الرئيسية |
| `frontend/src/pages/FeedMobile.jsx` | ✏️ تغليف المحتوى بـ `<div className="yam-home-mobile-page">` |
| `frontend/src/main.jsx` | ➕ إضافة import الملف الجديد كآخر CSS |
| `frontend/package.json` | 🔢 ترقية النسخة إلى `59.13.28` |
| `CHANGELOG_v59.13.28_HOME_MOBILE_GROUPS_PARITY_AR.md` | ✨ هذا الملف |

**لا تعديلات وظيفية على JS** — كل المنطق الحالي
(فلاتر/إعجاب/تعليق/مشاركة/حفظ/قائمة المزيد) يعمل بدون تغيير.
**لا dependencies جديدة** — صفر nodi_modules، صفر مكتبات.

---

## 🧪 النتيجة المتوقعة

| السلوك | قبل v59.13.28 | بعد v59.13.28 |
|--------|---------------|---------------|
| السحب لأعلى/أسفل من أي منطقة | ❌ لا يستجيب | ✅ يستجيب فوراً |
| momentum scroll على iOS Safari | ❌ يتوقف فجأة | ✅ سلس مثل المجموعات |
| السحب من فوق منشور/فيديو | ❌ يبتلع الحدث | ✅ يمرر كاملاً |
| السحب من فوق الفلاتر الأفقية | ⚠️ كان يتعارض | ✅ pan-y عمودي + pan-x للفلتر نفسه |
| السحب من فوق Composer | ❌ كان يفتح المؤلّف | ✅ يمرر السحب أولاً، النقر فقط يفتح |
| pull-to-refresh (إن وُجد) | ❌ لا يعمل | ✅ يعمل (يعتمد على pan-y) |
| صفحة المجموعات | ✅ كانت تعمل | ✅ مستمرة بدون تأثير |
| صفحة الريلز | ✅ كانت تعمل | ✅ مستمرة بدون تأثير |

---

## 🎯 المبدأ المعماري

> **"الصفحة الرئيسية أصبحت توأماً معماري لصفحة المجموعات":**
> كلاهما تحتوي على `<div>` جذري بـ `height: 100dvh; overflow-y: auto`
> داخل `<MainLayout>`. هذا يضمن سلوك تمرير متطابق 100% بدون
> الاعتماد على ضبط `.page-content` في MainLayout (الذي قد يتعارض
> مع ملفات CSS قديمة على بعض الصفحات).

---

## 🔧 ملاحظات للنشر

1. ✅ **لا تغيير backend** — تعديل فرونت-إند بحت.
2. ✅ **لا dependencies جديدة** — CSS و JSX خام.
3. ✅ **لا breaking changes** — صفحات الريلز/المجموعات/المحادثة
   الفردية محفوظة بسلوكها الأصلي.
4. ⚠️ **يجب أن يبقى `home-mobile-page-v59.13.28.css` آخر import CSS**
   في `main.jsx` ليفوز في cascade على أي إصلاحات سابقة.
5. ⚠️ **في حال إضافة filter جديد**: التأكد من أن العنصر داخل
   `.yam-home-mobile-page` يحترم `touch-action: pan-y` على
   الأقل، أو `pan-x` إذا كان كاروسيل أفقي.

---

✨ **نهاية الإصلاح** — الصفحة الرئيسية على ويب الموبايل تتمرّر
الآن بنفس سلاسة صفحة المجموعات تماماً. من أي منطقة في الصفحة،
السحب لأعلى/أسفل يستجيب فوراً، بـ momentum scroll حقيقي.
