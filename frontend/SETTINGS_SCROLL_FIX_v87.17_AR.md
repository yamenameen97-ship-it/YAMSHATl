# 🎯 إصلاح السحب في صفحة الإعدادات — v87.17

## الشكوى
> "صفحة الإعدادات وكل الصفحات المتفرّعة منها — البستات (البطاقات)
> لا تستجيب للمس والسحب للأعلى والأسفل بسبب التغليف. الصفحة الرئيسية
> للمنشورات تعمل بسلاسة فل الفل — اجعل الإعدادات مطابقة لها."

## التشخيص
- **الصفحة الرئيسية للمنشورات** (`.yam-home-mobile-page` — v59.13.28)
  تعمل بسلاسة لأنها مغلَّفة في scroll container داخلي:
  `height:100dvh + overflow-y:auto + touch-action:pan-y +
  -webkit-overflow-scrolling:touch`.

- **`Settings.jsx`** يستخدم `.settings-wrap` كغلاف عادي، ويعتمد على
  `.page-content` من `MainLayout`. طبقات legacy
  (`mobile-touch-master-v57` / `drawer-v59.10` / `mobile-scroll-final-v59.13.2`)
  كانت تفرض `touch-action:none` أو `contain` على أبنائه، فيتوقف
  السحب باللمس عندما تفيض البطاقات (خصوصاً على الشاشات الطويلة).

- **الصفحات الفرعية** (`ProfileSettingsPage`, `FeedSettingsPage`,
  `ReelsSettingsPage`, `StoriesSettingsPage`, `InboxSettingsPage`,
  `VoiceRoomsSettingsPage`, `EngagementSettingsPage`, `WalletSettingsPage`,
  `NotificationsSettingsPage`, `SessionsPage`, `SecuritySettingsPage`,
  `CloseFriendsManagerPage`, `HideStoryFromPage`, `MutedStoriesPage`)
  تستخدم `SettingsShell` (`.settings-shell`) — نفس المشكلة تماماً.

- ملاحظة إضافية: `.settings-sidebar` على الموبايل كانت مضبوطة
  `position: sticky` + `max-height: calc(100vh - 90px)` +
  `overflow-y: auto` — يخلق scroll container متداخل يشوّش لمس
  السحب على المحتوى الرئيسي.

## الحل
ملف واحد: `src/styles/yamshat-fixes-v87.17-SETTINGS-MAIN-SCROLL.css`
يطبّق بصمة `.yam-home-mobile-page` 1:1 على:

1. **`.settings-wrap`** — الصفحة الرئيسية (`Settings.jsx`)
2. **`.settings-shell`** — كل الفروع (`SettingsShell` shared layout)

مع:
- `.page-content:has(.settings-wrap)` و `:has(.settings-shell)`
  تصبح scroll container سلس (`100dvh` + `overflow-y:auto` +
  `-webkit-overflow-scrolling:touch` + كسر `contain/transform/filter`).
- الحاوية الداخلية `.settings-wrap` / `.settings-shell` تُعطى
  `min-height:100dvh` + `overflow:visible` + `touch-action:pan-y`
  حتى يعمل السحب على الأم (نفس نمط v86.3 لـ `.yam-group-settings-page`).
- Header (`.settings-hero` / `.settings-shell-header`) يصبح
  **sticky** ليبقى ظاهراً أثناء السحب.
- كل الأبناء (`.s-card`, `.settings-row`, `.list-row`, `.stats-grid`,
  `.metric-card`, `.settings-group`, `.settings-section`, `form`,
  `section`) تحصل على `touch-action:pan-y` + كسر `contain`.
- العناصر التفاعلية (buttons, links, toggles, inputs, selects)
  تحصل على `touch-action:manipulation` — تستقبل النقر لكن لا
  تبتلع السحب العمودي.
- `textarea` و `[contenteditable]` تحصل على `pan-y` لتمرير محتواها.
- الكاروسيلات الأفقية (`.settings-shell-tabs`) تُترك `pan-x` فقط.
- `.settings-sidebar` على الموبايل: `static` + `max-height:none` +
  `overflow:visible` (لا scroller متداخل).
- إبطال أي `pointer-events:none` أو `touch-action:none` قادم من
  طبقات legacy على الغلاف والأبناء.
- iOS Safari: `@supports (-webkit-touch-callout: none)` — تأكيد
  `momentum scrolling` على الحاويات الأم.
- `padding-bottom` كافٍ (140px موبايل / 180px شاشات طويلة) ليصل
  المستخدم لآخر عنصر دون أن يعلق خلف BottomNav.

## الصفحات المُصلَحة
- `/settings` — الصفحة الرئيسية للإعدادات ✅
- `/settings/profile` — الملف الشخصي ✅
- `/settings/feed` — الخلاصة ✅
- `/settings/reels` — الريلز ✅
- `/settings/stories` — الستوريز ✅
- `/settings/inbox` — الرسائل ✅
- `/settings/voice` — الغرف الصوتية ✅
- `/settings/engagement` — التفاعل والمعارك ✅
- `/settings/wallet` — المحفظة ✅
- `/settings/notifications` — الإشعارات ✅
- `/settings/sessions` — الجلسات ✅
- `/settings/security` — الأمان ✅
- `/settings/close-friends` — الأصدقاء المقرّبون ✅
- `/settings/hide-story` — إخفاء الستوري من ✅
- `/settings/muted-stories` — الستوريز المكتومة ✅

## القيود الملتزم بها
- ✅ صفر مكتبات جديدة، صفر `node_modules`
- ✅ صفر تعديلات وظيفية على المكونات (JSX/JS كما هو)
- ✅ CSS فقط — ملف واحد جديد + استيراد واحد في `main.jsx`
- ✅ لا تأثير على أي صفحة أخرى (استخدام `:has()` selectors مقيّدة)
- ✅ يحترم `prefers-reduced-motion`

## ترتيب الاستيراد
```jsx
// main.jsx
import './styles/yamshat-fixes-v87.16-CHAT-MEDIA-FINAL-POLISH.css';
import './styles/yamshat-fixes-v87.17-SETTINGS-MAIN-SCROLL.css'; // ⭐ آخر واحد
```

## البناء
```
BUILD_ID = 'yamshat-v87.17-SETTINGS-MAIN-SCROLL'
version  = 87.17.0
```
