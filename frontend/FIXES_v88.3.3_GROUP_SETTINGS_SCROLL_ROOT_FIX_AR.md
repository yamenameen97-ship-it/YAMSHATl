# 🔥 YAMSHAT v88.3.3 — إصلاح جذري نهائي لسحب صفحة إعدادات المجموعة (نمط بوست البلاغات)

## 📌 المشكلة
صفحة **إعدادات المجموعة** (`/groups/:groupId/settings`) على ويب-الجوال (وأحياناً على اللابتوب) لا تقبل السحب لأعلى/لأسفل — لا يمكن الوصول إلى الأقسام السفلية (إدارة الأعضاء، الصلاحيات، الخصوصية، الإحصائيات، إدارة متقدمة، حذف المجموعة). بينما **نافذة الإبلاغ (ReportModal)** كانت تعمل بسلاسة تامة كما في الصورة الثانية.

## 🎯 التشخيص الجذري (Root Cause) — تحليل موازٍ لإصلاح v88.2

بعد قراءة الشيفرة، وُجدت **ثلاث طبقات متداخلة** كلها تحاول التحكم بنفس عنصر التمرير `.page-content` فتتعارض:

1. **`pages/GroupSettings.jsx`** — كان يُضيف class مباشرة على `.page-content`:
   ```js
   pageContent.classList.add('group-settings-page-content-scroll');
   ```

2. **`styles/group-settings.css`** — قواعد `!important` تفرض `overflow-y: auto` على `.page-content.group-settings-page-content-scroll`.

3. **`styles/yamshat-fixes-v86.3-SETTINGS-SCROLL.css`** — قواعد أشد ضراوة تفرض:
   ```css
   .page-content:has(.yam-group-settings-page) {
     height: 100dvh !important;
     max-height: 100dvh !important;
     padding: 0 !important;
     padding-bottom: 0 !important;
   }
   ```

**النتيجة الكارثية**:
- `.page-content` مبنية في `MainLayout` بـ `position: absolute; inset: 0` + `padding-top: var(--yam-top-chrome-height); padding-bottom: var(--yam-bottom-chrome-height)`.
- فرض `height: 100dvh` **بالإضافة إلى** `inset: 0` **يخلق تعارضاً** — بعض المتصفحات (خاصة WebKit على iOS) تحسب الارتفاع ضعف المطلوب أو تصفّره.
- فرض `padding: 0 !important` يُخفي المحتوى تحت الشريط العلوي وخلف BottomNav — والأخطر: يجعل حاوية التمرير أطول من نافذة العرض بمقدار غير متوقع → المتصفح يفشل في تفعيل momentum scrolling.
- إضافة class على `.page-content` كانت تفعّل هذه القواعد الضارة معاً.

**بالمقابل**، نافذة `ReportModal.jsx` (الصورة الثانية — تعمل فل الفل ✅) بنية بسيطة تماماً:
- حاوية `position: fixed; inset: 0` بأبعاد صريحة.
- `flex column` مع `overflow: hidden` على المستوى الخارجي.
- **div داخلي واحد** بـ `flex: 1 1 auto; overflowY: auto; WebkitOverflowScrolling: touch`.
- **لا `!important`، لا تعارض طبقات، لا فرض height/padding على `.page-content` الأم**.

## ✅ الحل — أخذ المعرفة من "بوست البلاغات" (نفس منهج إصلاح v88.2)

`.page-content` في `MainLayout.jsx` مبنية أصلاً بنفس بصمة `.ym-reels-feed` الناجحة (position:absolute; inset:0; overflow-y:auto) — أي **هي بالفعل scroller ممتاز**. الحل هو **عدم تلويثها** بأي class أو قواعد `!important` تُفسد بنيتها.

### التغييرات المطبقة

#### 1. `src/pages/GroupSettings.jsx`
- **إزالة** `pageContent.classList.add('group-settings-page-content-scroll')` — كانت الشرارة التي تُفعّل القواعد الكارثية.
- **إضافة** data-attribute بديل `data-yam-group-settings-active="true"` — لا يطابق أي selector `[class*="..."]` legacy.
- **إضافة** fallback JS يضبط `overflow-y`, `-webkit-overflow-scrolling`, `touch-action`, `overscroll-behavior-y` كـ inline-style مباشرة على `.page-content` للمتصفحات التي لا تدعم `:has()`.
- **تنظيف** عند unmount: إعادة القيم الأصلية وإزالة الـdata-attribute.

#### 2. `src/styles/group-settings.css`
- **حذف** القواعد الضارة:
  - `html body .page-content.group-settings-page-content-scroll { overflow-y: auto !important; ... }`
  - `.page-content.group-settings-page-content-scroll .page-shell-glow { ... }`
- **إضافة** قواعد نظيفة عبر:
  - `:has(> .page-shell-glow > .yam-group-settings-page)` — للمتصفحات الحديثة.
  - `[data-yam-group-settings-active="true"]` — يطابق ما يضعه JS من `.jsx` أعلاه.
- **لا نمس** `height` أو `inset` أو `padding` الأصلية لـ `.page-content`.

#### 3. `src/styles/yamshat-fixes-v86.3-SETTINGS-SCROLL.css`
- **حذف** القواعد التي تفرض `height: 100dvh !important` و `padding: 0 !important` على `.page-content:has(.yam-group-settings-page)`.
- **إبقاء** فقط الخصائص التي **لا تكسر** بنية `.page-content` الأصلية: `touch-action`, `overscroll-behavior-y`, `contain: none`, `will-change: auto`, `transform: none`, `pointer-events: auto`.
- **إبقاء** كتلة `main.mobile-main-content:has(.yam-group-settings-page)` كما هي (تخص layout قديم مختلف).

#### 4. `frontend/package.json`
- `88.3.2` → `88.3.3`.

## 🧪 كيفية التحقق

1. افتح `/groups/{group-id}/settings` (أي مجموعة أنت مالكها/مشرف فيها).
2. اسحب لأعلى وأسفل بإصبعك — يجب أن ينتقل المحتوى **بسلاسة كاملة مع momentum scroll**، مثل نافذة الإبلاغ تماماً.
3. الأزرار (نسخ الرابط، مشاركة، إضافة عضو، تعديل، حفظ الصلاحيات، حذف المجموعة، إلخ) ما زالت تعمل عند النقر.
4. الشريط العلوي (MobileTopBar) والسفلي (BottomNav) لا يحجبان المحتوى.
5. آخر عنصر (زر "حذف المجموعة") يظهر فوق BottomNav بمساحة كافية (padding-bottom في `.yam-group-settings-page`).
6. الرأس `.yam-settings-header` يبقى ظاهراً sticky أثناء السحب (كما في v86.3).

## 📁 الملفات المتأثرة
- `frontend/src/pages/GroupSettings.jsx` ← تغيير المنطق (class → data-attribute + inline-style)
- `frontend/src/styles/group-settings.css` ← حذف قواعد class القديمة، إضافة قواعد `:has()` + data-attr النظيفة
- `frontend/src/styles/yamshat-fixes-v86.3-SETTINGS-SCROLL.css` ← تفكيك القواعد الضارة على `.page-content`
- `frontend/package.json` ← `88.3.2` → `88.3.3`

## 🧠 الدرس المشترك مع v88.2 (ProfilePage)

**لا تُلوّث `.page-content` بأي class عريض، ولا تفرض `height` أو `padding` عليها بـ `!important`.**
`.page-content` هي scroller ناجح جاهز (نفس بصمة الريلز) — كل ما تحتاجه صفحتك هو أن تكون حاوية flow طبيعية داخلها (`overflow: visible; min-height: 100%`). إن اضطررت لتفعيل خصائص تمرير إضافية، استعمل `data-attribute` (وليس class) + fallback inline-style من JS، بالتوازي مع قاعدة `:has()` واحدة نظيفة في CSS.

هذا بالضبط ما يجعل **بوست البلاغات** يعمل فل الفل — وهو ما طبّقناه الآن على إعدادات المجموعة.

---
**تاريخ الإصلاح**: 2026-07-17
**رقم الإصدار**: v88.3.3
**المرجع الناجح المستفاد منه**: `ReportModal.jsx` (بوست البلاغات) + إصلاح v88.2 للملف الشخصي.
