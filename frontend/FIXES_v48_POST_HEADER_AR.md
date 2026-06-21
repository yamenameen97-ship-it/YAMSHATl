# إصلاح هيدر المنشور في الجوال — v48

## المطلوب
1. سحب اسم المستخدم الذي نشر المنشور إلى **جانب الصورة الشخصية مباشرة** ليكون بالترتيب العربي الصحيح.
2. عند **الضغط على الاسم أو الصورة** يفتح **صفحة الملف الشخصي** (مثل صفحة `yamenameen97`).

## التغييرات

### 1) `src/components/mobile/MobilePostCard.jsx`

- استيراد `useNavigate` من `react-router-dom`.
- استخراج `cleanUsername` من `post.username` أو من `handle` (بعد إزالة `@`).
- دالة `goToProfile(e)` تُنفّذ `navigate('/profile/<username>')`.
- إعادة هيكلة الهيدر إلى مجموعتين:
  - **اليسار**: زر النقاط `⋯` فقط.
  - **اليمين** (مجموعة هوية موحّدة `ym-identity-group`):
    `[ الاسم + الوقت ]` **ملتصق مباشرة** بـ `[ صورة الـ Avatar الدائرية ]`
- كلٌّ من `ym-post-title-area` و `ym-post-avatar` أصبح **قابلاً للنقر** (`role="link"`, `tabIndex=0`, `onClick`, `onKeyDown` لدعم Enter/Space)، ويظهر تأثير ضغط (`scale`) وحلقة تركيز (`focus-visible`) للوصولية.
- CSS الجديد:
  - `.ym-identity-group { display:flex; gap:8px; align-items:center; flex:0 1 auto; }`
  - `.ym-clickable { cursor:pointer; transition:opacity .15s, transform .15s; }`
  - `.ym-clickable:hover { opacity:0.85; }`
  - `.ym-clickable:active { transform:scale(0.97); }`
  - `.ym-clickable:focus-visible { outline:2px solid #8B5CF6; outline-offset:2px; border-radius:8px; }`

### 2) `src/pages/FeedMobile.jsx`

- داخل `normalizePost(p, i)`: تمت إضافة الحقل الصريح
  `username: handle.replace(/^@/, '')`
  ليُمرَّر إلى `MobilePostCard` ويُستخدم في بناء رابط البروفايل `/profile/:username`.

## النتيجة البصرية

قبل (الصورة المرفقة): الاسم بعيد عن الأفاتار، فراغ كبير بينهما.

بعد: الاسم ملاصق للأفاتار تماماً مثل الصورة المرجعية الثانية (yamenameen97 ↔ Y).

## التوجيه (Routing)

المسار `/profile/:username` موجود مسبقاً في `App.jsx`:

```
<Route path="/profile/:username" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
```

وبالتالي الضغط على اسم `yamenameen97` يفتح الصفحة `/profile/yamenameen97` ويُعرض الملف الشخصي بنفس تصميم الصورة المرجعية الثانية (غلاف + أفاتار + متابعين + متابع + إعجابات + تبويبات: المنشورات / الريلز / ثم الإعجاب).
