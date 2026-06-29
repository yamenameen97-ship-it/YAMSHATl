# YAMSHAT v62 — إصلاح علوق تحميل الملف الشخصي + ظهور منطقة كتابة التعليق

## المشاكل المُبلَّغ عنها

1. **الملف الشخصي عالق على رسالة "جارٍ تحميل الملف الشخصي..."**
   - الصفحة لا تتجاوز شاشة التحميل أبداً عند فتح "حسابي".

2. **منطقة كتابة التعليق غير ظاهرة في بوتوم شيت التعليقات**
   - عند فتح تعليقات أي منشور (في الصفحة الرئيسية)، يظهر فقط
     عنوان "التعليقات" + رسالة "لا توجد تعليقات بعد. كن أول من يعلّق!"
     لكن **حقل كتابة التعليق + زر الإرسال غير ظاهرين** في الأسفل.

---

## التشخيص

### 1) Profile.jsx — `ReferenceError`

كان `loadProfile()` يستخدم `requestSeqRef.current` (لمنع race
condition عند التنقّل السريع بين الملفات الشخصية) لكن **هذا الـ ref
لم يكن مُعرَّفاً أصلاً** عبر `useRef`. النتيجة:

```
ReferenceError: requestSeqRef is not defined
```

عند أول استدعاء لـ `loadProfile()`. الـ catch داخل `loadProfile`
لا يلتقط هذا الخطأ لأنه يحصل **قبل** الـ try block (في السطر الأول
`const mySeq = ++requestSeqRef.current;`)، فيتم رمي الخطأ خارج
الدالة وتبقى الحالة `profile = null` للأبد ⇒ تبقى الصفحة على
رسالة التحميل.

### 2) منطقة كتابة التعليق — مخفية خلف BottomNav أو محذوفة بسبب layout

داخل `MobileCommentsSheet.jsx` كان الـ composer مكتوباً صحيحاً
(`<footer className="ym-sheet-composer">...`) ومُنسَّقاً عبر
`mobile-yamshat-redesign.css` و `chat-redesign-v61.css`، ولكنّه
كان يستخدم `position: sticky; bottom: 0` داخل `.ym-sheet` الذي
لديه `overflow: hidden`. على بعض المتصفحات (خصوصاً WebView على
Android) يفشل sticky في هذا السياق فيختفي الـ composer أو يُنقل
خلف الـ BottomNav.

كذلك قاعدة إخفاء الـ BottomNav `body[data-ym-sheet="open"] .ym-bottomnav`
لها أولوية أقل من بعض `<style>` المضمَّنة في `BottomNav.jsx`، فلم
تكن تخفي الشريط السفلي بشكل قاطع.

---

## الحل (v62)

### تعديل #1 — `frontend/src/pages/Profile.jsx`

إضافة سطر واحد لتعريف `requestSeqRef` كـ `useRef(0)`:

```jsx
const avatarFileRef = useRef(null);
const coverFileRef = useRef(null);
// ✅ FIX (v62): إضافة requestSeqRef المفقود — كان يُستخدم في loadProfile دون تعريف
// مما يسبب ReferenceError ويُبقي الصفحة عالقة على "جارٍ تحميل الملف الشخصي..."
const requestSeqRef = useRef(0);
```

### تعديل #2 — ملف CSS جديد

`frontend/src/styles/yamshat-fixes-v62-profile-comments.css`

يحوي:

1. قواعد قوية لإخفاء **أي** `BottomNav` عند فتح الـ sheet
   (تستهدف `.ym-bottomnav`, `nav.ym-bottomnav`, وأي class يحوي
   `bottomnav`/`BottomNav`) باستعمال `!important`.

2. تعديل سلوك `.ym-sheet-composer` من `position: sticky`
   إلى `position: relative; flex: 0 0 auto;` داخل `flex-direction: column`،
   مع `flex-shrink: 0` وأمر صريح `visibility: visible; opacity: 1;`
   وَ`pointer-events: auto;` كي لا يختفي تحت أي ظرف.

3. ضمان `overflow: hidden` على `.ym-sheet` مع `overflow-y: auto`
   على `.ym-sheet-body` فقط — هذا يحبس التمرير داخل الجسم ويترك
   الـ composer ثابتاً في الأسفل دائماً.

4. توافق safe-area-inset-bottom للأجهزة ذات الـ notch.

### تعديل #3 — `frontend/src/main.jsx`

إضافة سطر استيراد واحد بعد `chat-redesign-v61.css` ليفوز في cascade:

```jsx
import './styles/chat-redesign-v61.css';
/* ✅ v62 hotfix: إصلاح علوق تحميل الملف الشخصي + ظهور منطقة كتابة التعليق. */
import './styles/yamshat-fixes-v62-profile-comments.css';
```

---

## الملفات المُعدَّلة

```
frontend/src/pages/Profile.jsx                                       [مُعدَّل]
frontend/src/main.jsx                                                [مُعدَّل: +1 سطر استيراد]
frontend/src/styles/yamshat-fixes-v62-profile-comments.css           [جديد]
frontend/FIXES_v62_PROFILE_COMMENTS_AR.md                            [جديد — هذا الملف]
```

---

## كيفية التحقق

1. افتح صفحة "حسابي" (`/profile`) → يجب أن يظهر الملف الشخصي
   مباشرة بدلاً من البقاء على رسالة التحميل.

2. افتح أي منشور في الصفحة الرئيسية واضغط على أيقونة التعليقات →
   يجب أن يظهر بوتوم شيت يحوي **في الأسفل** حقل "اكتب تعليقاً..."
   وزر الإرسال البنفسجي الدائري، مع اختفاء شريط التنقل السفلي.
