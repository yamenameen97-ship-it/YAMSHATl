# CHANGELOG v59.13.37 — إصلاح خمسة نواقص حرجة في `Chat.jsx`

التاريخ: 2026-06-27
الإصدار: **59.13.37**
الملف الرئيسي: `frontend/src/pages/Chat.jsx`

---

## ملخص الإصلاحات

تمت معالجة خمس مشاكل حرجة كانت تُعطّل وظائف رئيسية في صفحة الشات الفردي. جميع الإصلاحات تستخدم **store actions** و**API endpoints** الموجودة مسبقًا (لا حاجة لأي تعديل في الباك إند أو متجر Zustand).

| # | المشكلة قبل الإصلاح | الإصلاح في v59.13.37 |
|---|---|---|
| 1 | `setMessages(...)` غير المعرَّف يستدعى في 3 أماكن (السطور 713, 714, 727) → `ReferenceError` يُعطّل الحذف/التنجيم/Reaction Picker بالكامل | استبدال جميع الاستدعاءات بـ `handleDelete()` و `applyMessagePatch()` و `handleReact()` |
| 2 | التفاعلات (`handleReact`) تُحفظ في `localStorage` فقط ولا تصل للباك إند → الطرف الآخر لا يرى التفاعل | استدعاء `reactToMessage()` / `unreactToMessage()` API مع تحديث متفائل (optimistic) و rollback عند الفشل |
| 3 | لا توجد آلية لتحميل الرسائل الأقدم — `prependConversationPage` و `hasMore` موجودة في الـ store لكن لا UI يستدعيها | إضافة زر **«⤴ تحميل رسائل أقدم»** أعلى منطقة الرسائل + استدعاء `getMessages(peer, 60, oldestMessageId)` + الحفاظ على موضع التمرير بعد الحقن |
| 4 | `onReport` في Long-Press Toolbar يعرض Toast كاذبًا فقط ولا يفتح `ReportModal` | استبدال Toast الكاذب باستدعاء `setReportTarget(...)` (مطابق لإصلاح v59.13.17 في ChatBubble) |
| 5 | حفظ تعديل الرسالة في المودال يطبق التعديل محليًا فقط ولا يستدعي `editMessage()` API → التعديل لا يصل للسيرفر | استدعاء `editMessageApi(messageId, newText)` مع تحديث متفائل، عرض حالة «جارٍ الحفظ…»، و rollback إلى النص الأصلي عند فشل الـ API |

---

## التفاصيل التقنية

### Fix #1 — استبدال `setMessages` غير المعرَّف
**الأماكن**: السطور 713 (`onDelete`), 714 (`onStar`), 727 (`onPick` في Reaction Picker).
**السبب الجذري**: المكوّن يعتمد على `messages` المشتقة من `useChatStore` (السطر 242) — لا يوجد `useState` يُسمى `messages`/`setMessages` على الإطلاق. أيّ نقرة على «حذف» أو «تنجيم» أو اختيار إيموجي كانت تُلقي `ReferenceError: setMessages is not defined` وتُجمّد الواجهة.

**الحل**:
- `onDelete` → `handleDelete(id, false)` (الذي يستدعي `deleteMessageApi` ثم `applyMessagePatch` بحالة `DELETED`).
- `onStar` → `applyMessagePatch(peer, [id], { starred: !m.starred })` + Toast.
- `onPick` (Reaction Picker) → `handleReact(message, emoji)` الموحَّد.

### Fix #2 — مزامنة التفاعلات مع الباك إند
**قبل**: `handleReact` يكتفي بـ `setReactionsByMessage(...)` التي تُحفظ في `localStorage` فقط عبر `savePeerReactions`.
**بعد**: نُحافظ على نفس التحديث المحلي (لاستجابة فورية)، لكنّنا نستدعي `reactToMessage(messageId, emoji)` (أو `unreactToMessage` للإزالة، أو الاثنين معًا للتبديل بين إيموجي وآخر) خلف الكواليس.
- في حال فشل الـ API: نُعيد الحالة السابقة (rollback) ونعرض Toast خطأ.

### Fix #3 — تحميل الرسائل الأقدم
**المضاف**:
- `loadingOlder` / `loadingOlderRef` لمنع الاستدعاء المكرر.
- `hasMoreOlder` و `oldestMessageId` يقرأان من `conversationState`.
- دالة `loadOlderMessages` تستدعي `getMessages(peer, 60, oldestMessageId)` ثم `prependConversationPage(peer, items, { hasMore, oldestMessageId })`.
- بعد الحقن: نُعيد ضبط `scrollTop` بمقدار الفرق في `scrollHeight` للحفاظ على موضع المستخدم البصري.
- زر في أعلى منطقة الرسائل: «⤴ تحميل رسائل أقدم» (يتحول إلى «⏳ جارٍ تحميل الأقدم…» أثناء التحميل).
- مؤشّر «— بداية المحادثة —» عند انتهاء الصفحات.

### Fix #4 — Long-Press Report يفتح ReportModal
**قبل**: `onReport={(m) => pushToast({ type: 'success', title: 'تم إرسال البلاغ' ... })}` (لا يصل للسيرفر).
**بعد**: `setReportTarget({ id: m?.id || m?.client_id, label: ... })` — وهو نفس النمط المستخدم في `ChatBubble.onReport` منذ v59.13.17، ويفتح `<ReportModal ... />` الموجود مسبقًا في أسفل الصفحة.

### Fix #5 — حفظ تعديل الرسالة يصل للسيرفر
**قبل**: زر «حفظ التعديل» يستدعي `applyMessagePatch` فقط ويغلق المودال — لا API call.
**بعد**:
1. تعليم حالة «جارٍ الحفظ…» على المودال (`saving: true`) لتعطيل الزر.
2. تطبيق التحديث متفاءل عبر `applyMessagePatch`.
3. `await editMessageApi(messageId, newText)`.
4. عند النجاح: Toast نجاح + إغلاق المودال.
5. عند الفشل: **rollback** للنص الأصلي عبر `applyMessagePatch` مع `edited: false`، وإعادة فتح المودال للسماح بإعادة المحاولة + Toast خطأ يحمل `detail` من السيرفر.

---

## التحقق

- ✅ فحص بناء Chat.jsx ببارسر Babel/JSX يمر بنجاح (`OK: syntax valid`).
- ✅ لا يوجد أي استخدام لـ `setMessages` بعد الإصلاح (تحقق عبر `grep`).
- ✅ `handleDelete` معرَّف (السطر 515) قبل استخدامه في JSX (السطر 802).
- ✅ جميع الـ APIs المستخدمة (`reactToMessage`, `unreactToMessage`, `editMessage`) موجودة فعليًا في `frontend/src/api/chat.js`.
- ✅ جميع الـ store actions (`applyMessagePatch`, `prependConversationPage`) موجودة في `frontend/src/stores/chatStore.js`.

---

## الملفات المعدَّلة

1. `frontend/src/pages/Chat.jsx` — 6 تعديلات مجمعة (multi-edit).
2. `frontend/package.json` — رفع الإصدار `59.13.36` → `59.13.37`.
3. `CHANGELOG_v59.13.37_CHAT_FIVE_FIXES_AR.md` — هذا الملف.
