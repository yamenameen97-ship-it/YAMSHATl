# YAMSHAT — تحديث v59.13.29 (Chat + Stories Mobile Pull Parity)

> 🎯 **شكوى المستخدم (متابعة v59.13.28)**:
> "اصلاح سحب الصفحة في صفحة الشات — السحب للأعلى وللأسفل
> اصلحها مثلما اصلحت الصفحة الرئيسية. اقرأ ملف الإصلاح
> كيف تم للصفحة الرئيسية واصلح صفحة الشات مثلها وأيضاً
> اصلح السحب لصفحة الستوري."

تاريخ الإصدار: 2026-06-26

---

## 📖 ملخص الإصلاح

في v59.13.28 جعلنا الصفحة الرئيسية على ويب الموبايل تتمرّر بنفس
سلاسة صفحة المجموعات عبر تغليفها بحاوية `.yam-home-mobile-page`
بسلوك مطابق 1:1 لـ `.yam-groups-page`.

في v59.13.29 نطبّق **نفس البصمة بالضبط** على ثلاث صفحات
أخرى كان السحب فيها متعطّلاً أو غير سلس على ويب الموبايل:

1. ✅ **`.yam-inbox-page`** — قائمة المحادثات (Inbox.jsx)
2. ✅ **`.yam-stories-page`** — صفحة الستوريات (StoriesPage.jsx)
3. ✅ **`.yam-messages-area`** — منطقة الرسائل في الشات الفردي (Chat.jsx)

---

## 🔎 لماذا كانت السحبة لا تعمل على هذه الصفحات؟

### قائمة المحادثات (Inbox)
- `.yam-inbox-page` كانت تستخدم `min-height: 100dvh` بدون
  `overflow-y: auto`، فهي تعتمد كلياً على `.page-content` من
  `MainLayout` للسحب.
- بسبب تعارضات CSS القديمة (`mobile-scroll-final-v59.13.2.css` +
  `mobile-pull-fix-v59.13.20.css`)، المتصفح يصبح غير متأكد أين
  هي حاوية التمرير الفعلية → momentum scroll يتوقف.

### صفحة الستوريات (Stories)
- `.yam-stories-page` كانت `<section>` عادية بـ `max-width: 1180px`
  و `padding: 16px 14px 32px;` فقط — بدون أي scroll container.
- على الموبايل، الشبكة (`.yam-stories-grid`) قد تكون أطول من الشاشة
  لكن السحب يعتمد على `.page-content` المتعارض.

### منطقة الرسائل في الشات (Messages Area)
- `.yam-messages-area` كانت تملك `overflow-y: auto` بالفعل، لكن
  بدون التأكيد القاطع على الموبايل (`touch-action: pan-y !important`،
  `-webkit-overflow-scrolling: touch !important`).
- على iOS Safari خصوصاً، أي قاعدة قديمة لـ `transform` أو `filter`
  أو `will-change` تكسر momentum scrolling.

---

## ✅ الحل في v59.13.29 (مماثل 1:1 لـ v59.13.28)

ملف CSS جديد: **`chat-stories-mobile-pull-v59.13.29.css`**

ينشئ نفس بصمة `.yam-groups-page` على الكلاسات الثلاثة، فقط
ضمن `@media (max-width: 980px)` (الموبايل/التابلت):

```css
@media (max-width: 980px) {
  .yam-inbox-page,
  .yam-stories-page {
    height: 100dvh;
    overflow-y: auto !important;
    -webkit-overflow-scrolling: touch;
    touch-action: pan-y;
    overscroll-behavior-y: contain;
    transform: none;
    filter: none;
    perspective: none;
    overflow-anchor: none;
  }

  .yam-messages-area {
    overflow-y: auto !important;
    -webkit-overflow-scrolling: touch !important;
    touch-action: pan-y !important;
    overscroll-behavior-y: contain !important;
    transform: none !important;
    filter: none !important;
  }
}
```

بالإضافة إلى:
- **`@supports (-webkit-touch-callout: none)`** — تأكيد iOS Safari
- **الكاروسيلات الأفقية** (`.yam-tabs`, `.yam-stories-bar`) — `pan-x` فقط
- **الأزرار/الروابط** — `touch-action: manipulation` (تسمح بـ pan-y عند البدء)
- **الصور/الفيديو** — `pan-y` + منع السحب (`user-drag: none`)
- **حماية `:has()`** — إلغاء padding من `.page-content` لتجنب double-padding
- **الحفاظ على padding الداخلي** — `.yam-inbox-screen` و `.yam-stories-page`
  تحتفظان بـ padding يحسب الهيدر (76px) + BottomNav (120px)

---

## 📂 الملفات المعدّلة في v59.13.29

| الملف | نوع التعديل |
|-------|-------------|
| `frontend/src/styles/chat-stories-mobile-pull-v59.13.29.css` | ✨ ملف جديد (~380 سطر) — بصمة المجموعات على Inbox + Stories + Messages |
| `frontend/src/main.jsx` | ➕ إضافة import الملف الجديد كآخر CSS |
| `frontend/package.json` | 🔢 ترقية النسخة إلى `59.13.29` |
| `CHANGELOG_v59.13.29_CHAT_STORIES_MOBILE_PULL_AR.md` | ✨ هذا الملف |

**لا تعديلات على JSX** — كل الكلاسات (`.yam-inbox-page`,
`.yam-stories-page`, `.yam-messages-area`) موجودة بالفعل في
الكود، نطبّق عليها CSS فقط.

**لا dependencies جديدة** — صفر `node_modules`، صفر مكتبات.

---

## 🧪 النتيجة المتوقعة

| السلوك | قبل v59.13.29 | بعد v59.13.29 |
|--------|---------------|---------------|
| السحب لأعلى/أسفل في قائمة المحادثات | ❌ لا يستجيب جيداً | ✅ يستجيب فوراً |
| السحب لأعلى/أسفل في صفحة الستوريات | ❌ لا يستجيب جيداً | ✅ يستجيب فوراً |
| السحب في منطقة الرسائل بالشات الفردي | ⚠️ يتقطع أحياناً | ✅ سلس مع momentum |
| momentum scroll على iOS Safari | ❌ يتوقف فجأة | ✅ سلس مثل المجموعات |
| السحب من فوق بطاقة محادثة/قصة | ❌ يبتلع الحدث | ✅ يمرر كاملاً |
| السحب من فوق شريط الستوريات الأفقي (Inbox) | ⚠️ كان يتعارض | ✅ pan-y عمودي + pan-x للشريط نفسه |
| السحب من فوق التبويبات (Stories) | ❌ كان يبتلع | ✅ يمرر السحب أولاً |
| الصفحة الرئيسية (v59.13.28) | ✅ كانت تعمل | ✅ مستمرة بدون تأثير |
| صفحة المجموعات | ✅ كانت تعمل | ✅ مستمرة بدون تأثير |
| صفحة الريلز | ✅ كانت تعمل | ✅ مستمرة بدون تأثير |

---

## 🎯 المبدأ المعماري

> **"كل الصفحات الرئيسية على ويب الموبايل أصبحت توأم معماري
> لصفحة المجموعات":** كل صفحة تحتوي على `<div>` جذري بـ
> `height: 100dvh; overflow-y: auto; touch-action: pan-y` داخل
> `<MainLayout>`. هذا يضمن سلوك تمرير متطابق 100% عبر الصفحات،
> بدون الاعتماد على ضبط `.page-content` في MainLayout (الذي قد
> يتعارض مع ملفات CSS قديمة على بعض الصفحات).

---

## 🔧 ملاحظات للنشر

1. ✅ **لا تغيير backend** — تعديل فرونت-إند بحت.
2. ✅ **لا dependencies جديدة** — CSS خام، لا JSX جديد.
3. ✅ **لا breaking changes** — كل الصفحات الأخرى محفوظة.
4. ⚠️ **يجب أن يبقى `chat-stories-mobile-pull-v59.13.29.css`
   آخر import CSS** في `main.jsx` (بعد v59.13.28) ليفوز في cascade.
5. ⚠️ **القواعد ضمن `@media (max-width: 980px)` فقط** — لا تأثير
   على الديسكتوب.

---

✨ **نهاية الإصلاح** — صفحات الشات (Inbox + Messages Area) والستوريات
على ويب الموبايل تتمرّر الآن بنفس سلاسة صفحة المجموعات تماماً.
من أي منطقة في الصفحة، السحب لأعلى/أسفل يستجيب فوراً، بـ momentum
scroll حقيقي على iOS Safari وكل المتصفحات.
