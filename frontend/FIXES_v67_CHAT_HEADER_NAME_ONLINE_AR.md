# 🎯 إصلاحات v67 — هيدر الدردشة: ظهور الاسم + "متصل" (الإصلاح النهائي الجذري)

## المشكلة

عند فتح صفحة دردشة بين شخصين على الجوال، **لا يظهر اسم الصديق ولا كلمة "متصل"**
في أعلى الشات. تظهر فقط أزرار المكالمات (📞 🎥 ⋮) وزر الرجوع `<`.
هذه المشكلة استمرت رغم محاولات الإصلاح في v60.x، v61، v63، v66.

## السبب الجذري الحقيقي (الذي فاتنا في الإصلاحات السابقة)

في ملف `src/styles/brand-chat-notifications-refresh.css` يوجد عند الجوال:

```css
@media (max-width: 980px) {
  body .yam-chat-stage-actions {
    width: 100%;                    /* ❌ يأكل كل عرض الـ header */
    justify-content: space-between; /* ❌ يفرّق الأزرار على كامل الـ row */
  }
}
@media (max-width: 720px) {
  body .yam-chat-stage-actions {
    justify-content: space-around !important;
  }
}
```

هذا **أجبر** شريط الأزرار اليمنى (📞 🎥 ⋮) على أن يكون عرضه = 100% من الـ row
الكامل، مما طرد منطقة الـ `.yam-chat-stage-peer` (الأفاتار + الاسم + الحالة)
خارج تدفّق flex بصرياً، فأصبحت موجودة في الـ DOM لكنها **غير مرئية**
(عرضها يصبح ≈ صفر بسبب flex squeeze).

محاولات v66 السابقة كتبت `flex: 0 0 auto` على `.yam-chat-stage-actions`
لكن هذا **لا يلغي `width: 100%`** — في Flexbox عندما يكون
`flex-basis: auto` فإن قيمة `width` تطبَّق فعلياً. لذلك المشكلة استمرت.

## الحل النهائي

ملف جديد `src/styles/chat-header-v67-name-online-fix.css` يقوم بـ:

### (1) إلغاء جذري لـ `width: 100%` على الـ actions

```css
html body .yam-chat-stage-header .yam-chat-stage-actions,
html body .yam-chat-stage-actions {
  width: auto !important;          /* ❌ يلغي width: 100% */
  max-width: none !important;
  flex: 0 0 auto !important;
  margin-inline-start: auto !important;
  justify-content: flex-end !important;
}
```

### (2) تثبيت منطقة الـ peer لتأخذ المساحة المتبقية

```css
html body .yam-chat-stage-header .yam-chat-stage-peer {
  flex: 1 1 0% !important;   /* يجبر العنصر على أخذ كل ما يستطيع */
  min-width: 0 !important;
  display: flex !important;
}
```

### (3) ضمان ظهور النصوص (الاسم + متصل) بصرياً

- `display: block !important`
- `visibility: visible !important`
- `opacity: 1 !important`
- `white-space: nowrap` + `text-overflow: ellipsis` للقصّ الأنيق
- `width: 100%` على الـ strong/span داخل `peer-copy`

### (4) تصغير محسوب للأزرار من أقصى إلى أدنى حد (responsive)

| العرض | زر الرجوع | الأفاتار | أزرار الأكشن | حجم الاسم | حجم "متصل" |
|--------|------------|----------|--------------|-----------|--------------|
| > 980px | 38px | 42px | 36px | 16px | 12.5px |
| ≤ 980px | 38px | 42px | 36px (مع إخفاء البحث) | 16px | 12.5px |
| ≤ 380px | 34px | 38px | 32px | 15px | 11.5px |
| ≤ 340px | 30px | 34px | 30px | 14px | 11px |

### (5) رفع specificity عبر `html body` للفوز على cascade السابق

استخدام `html body .yam-chat-stage-header ...` يعطي specificity = 0,3,1
وهو أعلى من كل القواعد السابقة في باقي الملفات (بما فيها inline `<style>`
داخل Chat.jsx).

### (6) عرض كلمة "متصل" بدلاً من "نشط الآن" (حسب طلب المستخدم)

تعديل JSX في `src/pages/Chat.jsx`:

```jsx
<span className={(isOnline || isTyping) ? 'online' : 'offline'}>
  {isTyping ? 'جاري الكتابة...' : (isOnline ? 'متصل' : formatLastSeen(lastSeen, false))}
</span>
```

### (7) Fallback لو peer فارغ مؤقتاً (race condition أثناء التحميل)

```jsx
<strong>{peer || peerDetails?.username || peerDetails?.handle || 'جارٍ التحميل...'}</strong>
```

## الملفات المتأثرة

| الملف | الإجراء |
|------|---------|
| `src/styles/chat-header-v67-name-online-fix.css` | ✨ **جديد** — الإصلاح الجذري |
| `src/main.jsx` | إضافة import للملف الجديد بعد v66 |
| `src/pages/Chat.jsx` | عرض "متصل" + fallback للاسم |

## النتيجة المتوقعة

📱 **على الجوال (≤ 980px):**

```
┌──────────────────────────────────────────────────┐
│ <  [Y]  yamenameen97              📞  🎥  ⋮     │
│         متصل                                      │
└──────────────────────────────────────────────────┘
```

📱 **على شاشة 360×800 (Galaxy S):**

```
┌────────────────────────────────────────────┐
│ <  [Y] yamenameen97       📞  🎥  ⋮       │
│        متصل                                 │
└────────────────────────────────────────────┘
```

📱 **على شاشة 320×568 (iPhone SE):**

```
┌──────────────────────────────────────┐
│ < [Y] yamen…       📞 🎥 ⋮          │
│       متصل                            │
└──────────────────────────────────────┘
```

## كيف نضمن نجاح هذا الإصلاح هذه المرة؟

1. ✅ **اكتشفنا السبب الحقيقي** (`width: 100%` على actions) — لم يكن مكتشَفاً سابقاً.
2. ✅ **رفع specificity** عبر `html body` يفوز على كل cascade سابق.
3. ✅ **`!important` مدروس** على كل خاصية layout حرجة.
4. ✅ **يُحمَّل آخر** (`chat-header-v67-name-online-fix.css` بعد كل الملفات).
5. ✅ **Fallback** يضمن ظهور نص ولو فارغ Peer مؤقتاً.
6. ✅ **Responsive** من أكبر شاشة إلى أصغر شاشة (340px).
