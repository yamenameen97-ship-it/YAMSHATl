# 🎯 إصلاح السحب في الإعدادات + البستات + صفحة الملف الشخصي — v87.18

## الشكوى
> "صفحة الملف الشخصي بعد إصلاحها لم تعد تظهر، أظهرها.
> صفحة الإعدادات مع كل البستات — السحب للأعلى وأسفل على ويب-جوال
> معطّل بكل صفحات الإعدادات والبستات، أصلحهم."

## المشكلة الأولى — الملف الشخصي لا يظهر (شاشة بيضاء)

**السبب الجذري:** الكود في `pages/Profile.jsx` كان يستدعي دالة اسمها
`resolveMediaUrlPublic` (السطر 322) لكنها **غير مستوردة وغير معرَّفة**
في أي مكان في المشروع. الدالة الفعلية المتاحة في
`config/mediaConfig.js` اسمها **`resolveMediaUrl`**.

النتيجة: JavaScript `ReferenceError` عند كل `render` للصفحة →
React يوقف تشكيل الشجرة → المستخدم يرى شاشة سوداء/بيضاء.

**الحل:**
```jsx
// pages/Profile.jsx — الأسطر 1–13
import { resolveMediaUrl } from '../config/mediaConfig.js';
// ...
const avatarSrc = useMemo(() => {
  if (profile.avatar) return resolveMediaUrl(profile.avatar); // ✅ v87.18
  return null;
}, [profile.avatar]);
```

## المشكلة الثانية — السحب معطَّل في الإعدادات + البستات على الجوال

**لماذا v87.17 لم يكفِ:**
- v87.17 اعتمد على `.page-content:has(.settings-wrap)` لتحويل الحاوية
  الأم من `MainLayout` إلى scroll container.
- لكن `.page-content` **بالفعل** scroll container من `MainLayout`
  (`position:absolute; inset:0; overflow-y:auto`).
- محاولة تعديل خصائصها عبر `:has()` + `!important` تخلق حالة ضبابية
  في Cascade، وعلى iOS Safari `momentum scroll` لا يُنشَّط بثقة لأن
  شجرة `page-content → page-shell-glow → settings-wrap` تفصل الحاوية
  ذات الأبعاد الثابتة عن المحتوى الفائض.
- النمط المُثبت في v59.13.28 (`.yam-home-mobile-page`) الذي يعمل
  فل الفل هو: **الغلاف نفسه هو الـ scroll container**، لا الحاوية الأم.

**السبب الجذري النهائي:**
`.settings-wrap` و `.settings-shell` كانا حاويات عادية بلا أبعاد
ثابتة → المتصفح لا يُنشئ عليهما scroll container → السحب باللمس
يُبتَلع من الأم أو من طبقات legacy.

**الحل — v87.18:**
ملف CSS واحد جديد:
`src/styles/yamshat-fixes-v87.18-SETTINGS-POSTS-SCROLL-FINAL.css`

يطبّق بصمة `.yam-home-mobile-page` **1:1** على:

1. **`.settings-wrap`** — الصفحة الرئيسية للإعدادات (`Settings.jsx`)
2. **`.settings-shell`** — كل الصفحات الفرعية (`SettingsShell` shared)
3. **`.yam-home-mobile-page`** — تعزيز إضافي وحماية من طبقات لاحقة
4. **`.mobile-post-card` / `.post-card`** — بطاقات المنشورات

بصمة الـ scroll container:
```css
height: 100dvh !important;
overflow-y: auto !important;
overflow-x: hidden !important;
-webkit-overflow-scrolling: touch !important;
touch-action: pan-y !important;
overscroll-behavior-y: contain !important;
transform: none !important;
filter: none !important;
contain: none !important;
```

مع:
- Header داخلي (`.settings-hero` / `.settings-shell-header`) يبقى
  **sticky** فوق التمرير.
- كل الأبناء (بطاقات، أقسام، نماذج، شبكات) يحصلون على `touch-action:pan-y`
  وكسر `contain/transform/filter`.
- العناصر التفاعلية (أزرار، روابط، toggles) → `touch-action:manipulation`
  (تستقبل النقر لكن لا تبتلع السحب).
- الكاروسيلات الأفقية (`.settings-shell-tabs`) → `pan-x` فقط.
- `.settings-sidebar` على الموبايل → `static + max-height:none` (لا
  scroller متداخل ثانٍ).
- `padding-bottom` = 160–200px ليصل المستخدم لآخر عنصر فوق BottomNav.
- iOS Safari — `@supports (-webkit-touch-callout: none)` — تأكيد
  `momentum scrolling`.
- إبطال طبقات legacy القديمة داخل الحاويتين.

## الصفحات المُصلَحة

**صفحة الملف الشخصي (كانت شاشة بيضاء) ✅**
- `/profile` — الملف الشخصي للمستخدم الحالي
- `/profile/:username` — ملف أي مستخدم آخر

**السحب على الويب-جوال ✅**
- `/settings` — الصفحة الرئيسية للإعدادات
- `/settings/profile` — الملف الشخصي (إعدادات)
- `/settings/feed` — الخلاصة
- `/settings/reels` — الريلز
- `/settings/stories` — الستوريز
- `/settings/inbox` — الرسائل
- `/settings/voice` — الغرف الصوتية
- `/settings/engagement` — التفاعل والمعارك
- `/settings/wallet` — المحفظة
- `/settings/notifications` — الإشعارات
- `/settings/sessions` — الجلسات
- `/settings/security` — الأمان
- `/settings/close-friends` — الأصدقاء المقرّبون
- `/settings/hide-story` — إخفاء الستوري من
- `/settings/muted-stories` — الستوريز المكتومة
- `/` — الصفحة الرئيسية للمنشورات (البستات)

## القيود الملتزم بها
- ✅ صفر مكتبات جديدة، صفر `node_modules`
- ✅ صفر تعديلات وظيفية على مكوّنات أخرى (JSX/JS كما هو)
- ✅ Profile.jsx: تعديل واحد في السطر (import + استخدام الدالة الصحيحة)
- ✅ CSS: ملف واحد جديد + استيراد واحد في `main.jsx`
- ✅ لا تأثير على أي صفحة أخرى (selectors مقيّدة بأسماء classes مخصوصة)
- ✅ يحترم `prefers-reduced-motion`

## ترتيب الاستيراد النهائي في `main.jsx`
```jsx
import './styles/yamshat-fixes-v87.16-CHAT-MEDIA-FINAL-POLISH.css';
import './styles/yamshat-fixes-v87.17-SETTINGS-MAIN-SCROLL.css';
import './styles/yamshat-fixes-v87.18-SETTINGS-POSTS-SCROLL-FINAL.css'; // ⭐
```

## البناء
```
BUILD_ID = 'yamshat-v87.18-SETTINGS-POSTS-SCROLL-FINAL'
version  = 87.18.0
```
