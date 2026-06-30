# YAMSHAT v66 — إصلاحات حرجة: الملف الشخصي + تعليقات الريلز + هيدر الدردشة + أزرار التفاعل

## 🔴 شكاوى المستخدم

> 1. الملف الشخصي يظهر ولكن **يعلّق ولا يقبل الضغط أو التعديل ويتأخر بالفتح**.
> 2. مشكلة في التعليق على الريلز — **ما تظهر منطقة كتابة التعليق** كي أعلق على الريلز.
> 3. التأكد من **ظهور اسم الشخص الذي أدردش معه** عند فتح صفحة الشات في الأعلى (كما في الصورة).
> 4. مشكلة عند الضغط على رسالة داخل الشات مطولاً — **أزرار التفاعل تظهر خلف الرسالة** بدلاً من فوقها.

---

## 🎯 الإصلاحات

### 1️⃣ الملف الشخصي يعلّق ولا يستجيب للضغط

#### السبب الجذري
- طبقات shimmer / skeleton / `.profile-page-loading` كانت تبقى أحياناً مع `pointer-events: auto` بعد انتهاء التحميل، فتحجب النقرات.
- الأزرار داخل الـ Card الشخصي قد تتأثر بـ `pointer-events: none` غير مقصودة من قواعد CSS عامة.

#### الحل
في `yamshat-fixes-v66-profile-reels-chat.css`:
```css
body .profile-page-loading { pointer-events: none !important; }
body main button { pointer-events: auto !important; touch-action: manipulation !important; }
body .ym-skeleton, body [class*="skeleton"] { pointer-events: none !important; }
body button[aria-label*="تعديل"] {
  pointer-events: auto !important;
  cursor: pointer !important;
  position: relative !important;
  z-index: 5 !important;
}
```

كذلك إضافة `animation: yamProfileFadeOut 5s` للـ loader حتى لا يبقى عالقاً للأبد إذا فشل setProfile.

---

### 2️⃣ تعليقات الريلز — لا تظهر منطقة كتابة التعليق

#### السبب الجذري
- `.ym-reels-drawer-input` لم تكن `sticky` ولا `position: fixed`، فعند ظهور keyboard الجوال تُدفع خارج الـ viewport.
- `.ym-reels-drawer-panel` يستخدم `max-height: 70vh` (vh قديم) بدلاً من `dvh` الذي يحترم ارتفاع الـ viewport الديناميكي مع keyboard.

#### الحل
```css
body .ym-reels-drawer { height: 100dvh !important; }

body .ym-reels-drawer-panel {
  max-height: min(75dvh, 640px) !important;
  display: flex !important;
  flex-direction: column !important;
  overflow: hidden !important;
}

body .ym-reels-drawer-body {
  flex: 1 1 auto !important;
  min-height: 0 !important;
  overflow-y: auto !important;
}

/* ✅ منطقة الكتابة — ثابتة في الأسفل، مرئية دائماً */
body .ym-reels-drawer-input {
  flex: 0 0 auto !important;
  position: sticky !important;
  bottom: 0 !important;
  padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px)) !important;
  background: #0f0a1c !important;
  z-index: 5 !important;
  visibility: visible !important;
  opacity: 1 !important;
}
```

---

### 3️⃣ هيدر الدردشة — اسم الشخص لا يظهر

#### السبب الجذري
- `.yam-chat-stage-peer` كان `min-width: 0` بدون `flex: 1 1 auto`.
- على الشاشات الضيقة، الأزرار الـ 4 على اليسار (📞 🎥 ⌕ ⋮) كانت تأكل كل المساحة المتاحة، فتُختصر منطقة الاسم إلى صفر عرض.

#### الحل
```css
body .yam-chat-stage-peer {
  flex: 1 1 auto !important;
  min-width: 0 !important;
  display: flex !important;
  align-items: center !important;
  overflow: hidden !important;
}

body .yam-chat-stage-peer-copy strong {
  display: block !important;
  font-size: 16px !important;
  font-weight: 800 !important;
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
}

body .yam-chat-stage-actions {
  flex: 0 0 auto !important;
  flex-shrink: 0 !important;
}

/* على شاشات ≤ 380px نخفي زر البحث للإبقاء على الاسم واضحاً */
@media (max-width: 980px) {
  body .yam-chat-stage-header .yam-stage-icon[aria-label="بحث"] {
    display: none !important;
  }
}
```

---

### 4️⃣ أزرار التفاعل (Long-press) تظهر خلف الرسالة

#### 🎯 السبب الجذري (الأهم في هذه النسخة)

عند الضغط المطوّل على رسالة، يفتح `MessageContextPopup` بـ:
- `position: fixed`
- `z-index: 9998`

**لكنه يظهر خلف الرسالة!** السبب:

```css
.yam-bubble {
  will-change: transform;   /* ❌ ينشئ stacking context */
  isolation: isolate;       /* ❌ ينشئ stacking context */
}
.yam-message-row {
  /* framer-motion يضيف transform inline */
}
```

عندما يكون لدى الأب `will-change: transform` أو `transform` غير `none`، فإنه:
1. يُنشئ **containing block** جديد للأبناء `position: fixed`.
2. يُنشئ **stacking context** جديد.

والنتيجة: `position: fixed` للـ popup يُحسب بالنسبة للرسالة (لا للـ viewport)، و `z-index: 9998` يُحسب فقط داخل stacking context الرسالة الواحدة. الرسائل اللاحقة لها stacking contexts خاصة بها، فتظهر فوقه!

#### ✅ الحل (الجزء الأول — JavaScript)

تعديل `MessageContextPopup.jsx` لاستخدام `createPortal` من `react-dom`:

```jsx
import { createPortal } from 'react-dom';

// ...
return createPortal(
  <>
    <div className="yam-msg-overlay" onClick={() => onClose?.()} />
    <div className="yam-msg-popup-container" ...>
      {/* الإيموجي + شريط الأوامر */}
    </div>
  </>,
  document.body  // ⭐ ينقل العنصر إلى body مباشرة
);
```

بهذا، الـ popup لم يعد طفلاً لـ `.yam-message-row` في DOM، فلا يتأثر بـ stacking context تابع للرسالة.

#### ✅ الحل (الجزء الثاني — CSS)

```css
body > .yam-msg-overlay {
  position: fixed !important;
  inset: 0 !important;
  z-index: 999998 !important;
}

body > .yam-msg-popup-container,
body > .yam-msg-submenu {
  position: fixed !important;
  z-index: 999999 !important;
  /* لا transform/will-change/isolation هنا */
  transform: none !important;
  will-change: auto !important;
  isolation: auto !important;
}

/* احتياط إضافي */
body .yam-message-row { isolation: auto !important; }
```

---

## 📊 ملخص الملفات المعدّلة

| الملف | النوع | الوصف |
|---|---|---|
| `frontend/src/styles/yamshat-fixes-v66-profile-reels-chat.css` | 🆕 جديد | الإصلاح الرئيسي CSS (~280 سطر) |
| `frontend/src/components/chat/MessageContextPopup.jsx` | ✏️ معدّل | استخدام `createPortal(... , document.body)` |
| `frontend/src/main.jsx` | ✏️ معدّل | استيراد v66 CSS بعد v65 |
| `frontend/package.json` | ✏️ معدّل | تحديث الإصدار إلى 66.0.0 |
| `frontend/FIXES_v66_PROFILE_REELS_CHAT_AR.md` | 🆕 جديد | هذا الملف |

---

## ✅ النتيجة المتوقعة

| العنصر | قبل v66 | بعد v66 |
|---|---|---|
| الملف الشخصي | 🔴 يعلق، لا يقبل الضغط أو التعديل | ✅ يستجيب فوراً، الأزرار قابلة للضغط |
| تعليقات الريلز — منطقة الكتابة | 🔴 لا تظهر، مخفية خلف الـ keyboard | ✅ ثابتة في الأسفل، مرئية دائماً |
| اسم الشخص في هيدر الدردشة | 🔴 لا يظهر / مقصوص | ✅ ظاهر بوضوح مع الـ ellipsis عند الحاجة |
| أزرار التفاعل (Long-press) | 🔴 تظهر خلف الرسالة | ✅ تظهر فوق الرسالة (portal + z-index 999999) |

---

## 🚫 صفر تبعيات جديدة

- ✅ لا node_modules جديدة
- ✅ لا React libraries جديدة (createPortal جزء من react-dom الموجود مسبقاً)
- ✅ لا تغييرات في الـ backend
- ✅ CSS + JS فقط (مكوّن واحد + ملف CSS واحد)

---

## 🧪 اختبار يدوي

### اختبار 1: الملف الشخصي
1. افتح `/profile/your-username` على الجوال.
2. انتظر تحميل البيانات.
3. اضغط على أي زر (تعديل، إضافة منشور، تغيير الصورة).
4. ✅ يجب أن يستجيب فوراً.

### اختبار 2: تعليقات الريلز
1. افتح صفحة الريلز.
2. اضغط على أيقونة التعليق على أي ريل.
3. ✅ يجب أن تظهر منطقة كتابة التعليق في الأسفل.
4. اكتب نصاً واضغط Enter أو زر "إرسال".
5. ✅ يجب أن يُرسل التعليق بدون أن تختفي منطقة الكتابة.

### اختبار 3: هيدر الدردشة
1. افتح أي محادثة بين شخصين.
2. ✅ في الأعلى، يجب أن يظهر: زر الرجوع + الأفاتار + **اسم الشخص + حالته** + أزرار الإجراءات.

### اختبار 4: أزرار التفاعل
1. افتح أي محادثة.
2. اضغط مطوّلاً على أي رسالة (700ms على الجوال، أو زر يمين على سطح المكتب).
3. ✅ يجب أن تظهر أزرار الإيموجي (❤️ 😂 😮 😢 👍) **فوق** الرسالة، لا خلفها.
4. ✅ يجب أن يظهر شريط الأوامر (رد، نسخ، تعديل، حذف، المزيد) أيضاً فوق الرسالة.

---

## 📌 الإصدار

**v66.0.0** — إصلاحات حرجة لتجربة المستخدم (UX) مطابقة لجميع المشاكل المرفوعة من المستخدم في الجلسة.
