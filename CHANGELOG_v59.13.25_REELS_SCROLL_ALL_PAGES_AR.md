# YAMSHAT — تحديث v59.13.25 (السحب يعمل في كل الصفحات مثل الريلز)

> 🎯 **مشكلة المستخدم**: "اصلاح مشكلة سحب الصفحات بالصفحه الرئيسيه وصفحة الشات وبقية الصفحات
> ما تستجيب للسحب للاعلى والاسفل... اريد ضبطها لتعمل مثل صفحة الريلز وصفحة المجموعات
> فهاتين الصفحتين فقط السحب للاعلى والاسفل فيهما مضبوط ويعملان بسلاسه."

---

## 🔎 التشخيص الجذري (لماذا الريلز/المجموعات تعملان وغيرهما لا)

### الصفحات التي تعمل بسلاسة:
- **Reels.jsx** → تنشئ حاوية تمرير داخلية `.ym-reels-feed` بنفسها:
  ```css
  .ym-reels-feed {
    overflow-y: auto;
    scroll-snap-type: y mandatory;
    -webkit-overflow-scrolling: touch;
  }
  ```
- **GroupsHome.jsx** → تنشئ `.yam-groups-page` بنفسها:
  ```css
  .yam-groups-page {
    height: 100dvh;
    overflow-y: auto;
  }
  ```

كلاهما **مستقل تماماً** عن تنسيقات MainLayout العامة → التمرير العمودي الأصلي للمتصفح يعمل دون تدخل.

### الصفحات المكسورة:
- **Dashboard, Chat, Home (FeedEnhanced), Friends, Notifications, Search, Profile, Settings, Wallet, Inbox, Stories ...**
- جميعها تعتمد على `<main class="page-content">` من `MainLayout.jsx` لتكون حاوية التمرير.
- **المشكلة الحقيقية المكتشفة**: ملفات CSS الأخيرة (v59.13.20 و v59.13.24) كانت تستهدف `.mobile-main-content`
  وهي class تابعة لـ `MobileLayout.jsx` (في مجلد `/layouts/`) الذي **لا يُستخدم في الـ App الحقيقي**.
- `App.jsx` يستخدم `MainLayout` من `/components/layout/MainLayout.jsx` الذي يولّد `.page-content` فقط.
- النتيجة: قواعد `touch-action`, `overflow-y`, `-webkit-overflow-scrolling` لم تكن تُطبَّق على الـ DOM
  الفعلي، فالتمرير كان يعتمد على القواعد القديمة المتراكمة (بعضها معطّل بـ `touch-action: manipulation`
  أو حاويات داخلية بـ `overflow: hidden`).

---

## ✅ الحل في v59.13.25

### الفلسفة:
> **نسخ "بصمة Reels" تماماً إلى `.page-content` لتعمل كل الصفحات بنفس السلاسة.**

### ما تم:
1. **ملف CSS جديد**: `styles/yamshat-fixes-v59.13.25.css` يُحمَّل **آخر شيء** في `main.jsx`
   ليفوز في cascade على كل ما سبق.

2. **القاعدة الذهبية على `.page-content`**:
   ```css
   .page-content {
     flex: 1 1 auto !important;
     min-height: 0 !important;
     overflow-y: auto !important;
     overflow-x: hidden !important;
     -webkit-overflow-scrolling: touch !important;
     overscroll-behavior-y: contain !important;
     touch-action: pan-y !important;             /* ⭐ pan-y فقط، لا manipulation ولا none */
     transform: translateZ(0);                    /* GPU للسلاسة */
     will-change: scroll-position;
     overflow-anchor: none !important;            /* لا يقفز عند تحميل صور */
   }
   ```
   هذه هي **بالضبط** بصمة `.ym-reels-feed` و `.yam-groups-page`.

3. **تنظيف أبناء `.page-content`**:
   - كل الأبناء يحصلون على `touch-action: pan-y`.
   - الكاروسيلات الأفقية الصريحة (`.ym-filters`, `.stories-row`, `.yam-categories-scroll`,
     `[data-horizontal-scroll="true"]`) تحصل على `touch-action: pan-x`.
   - الأزرار والروابط: `touch-action: manipulation` (تسمح بـ pan-y).
   - حقول الإدخال النصية: `touch-action: auto`.
   - الفيديو: `touch-action: manipulation`.
   - الصور: `touch-action: pan-y` + `-webkit-user-drag: none`.

4. **منع أي حاوية داخلية من ابتلاع السحب**:
   صفحات بعينها (`.yam-friends-page`, `.yam-users-page`, `.yam-notifications-page`,
   `.yam-search-page`, `.yam-profile-page`, `.yam-settings-page`, `.yam-wallet-page`,
   `.yam-inbox-page`, `.yam-stories-page`, `.yam-laptop-page`, `.yam-feed-page`) تُجبر على:
   ```css
   min-height: 100%;
   overflow: visible !important;  /* لا تُنشئ scroll container داخلي */
   touch-action: pan-y !important;
   ```
   النتيجة: التمرير يقع على `.page-content` الأم (مثل الريلز) ولا تتنافس عليه حاويات داخلية.

5. **معالجة خاصة لصفحة الشات**:
   لأن `Chat.jsx` تستخدم `<MainLayout hideNav lockScroll>` (تقفل page-content)، نضمن أن:
   - قائمة المحادثات (`.yam-chat-list`, `.ym-chat-list`) لها سكرول داخلي عمودي.
   - منطقة الرسائل (`.ym-messages-area`, `.messages-list`, `.chat-messages`) لها سكرول داخلي عمودي.
   - كلاهما بـ `touch-action: pan-y` + `-webkit-overflow-scrolling: touch`.

6. **استثناءات صحيحة محفوظة**:
   - وضع المحادثة الفردية (`/chat/:id`): يبقى `overflow: hidden` على `.page-content` كما كان.
   - وضع الريلز (`/reels`): يبقى `overflow: hidden` على `.page-content` (الـ `.ym-reels-feed`
     الداخلي يدير السكرول snap).

7. **حماية احتياطية**:
   - أي `style="touch-action: none"` ديناميكي يُلغى بـ `touch-action: pan-y`.
   - `html`, `body`, `#root`, `.app-shell` كلها بـ `touch-action: pan-y pinch-zoom`.

---

## 📂 الملفات المعدّلة في v59.13.25

| الملف | نوع التعديل |
|-------|-------------|
| `frontend/src/styles/yamshat-fixes-v59.13.25.css` | ✨ ملف جديد (357 سطر) |
| `frontend/src/main.jsx` | إضافة import للـ CSS الجديد كآخر سطر CSS |
| `CHANGELOG_v59.13.25_REELS_SCROLL_ALL_PAGES_AR.md` | ✨ سجل التغييرات |

**لم يتم تعديل أي JS** — الحل بالكامل في CSS لأنه:
- `MainLayout` الحقيقي **لا يستخدم PullToRefresh** أصلاً.
- المشكلة كانت أن قواعد CSS تستهدف class خاطئة (`.mobile-main-content` بدل `.page-content`).

---

## 🧪 النتيجة المتوقعة

| الصفحة | قبل v59.13.25 | بعد v59.13.25 |
|--------|--------------|--------------|
| الرئيسية (Feed / `/`) | ❌ لا تتمرّر | ✅ سلسة مثل الريلز |
| الدردشة (`/chat`) | ❌ لا تتمرّر | ✅ سلسة (قائمة + رسائل) |
| Dashboard (`/dashboard`) | ❌ لا تتمرّر | ✅ سلسة |
| الإشعارات (`/notifications`) | ❌ لا تتمرّر | ✅ سلسة |
| الأصدقاء (`/friends`) | ❌ لا تتمرّر | ✅ سلسة |
| البحث (`/search`) | ❌ لا تتمرّر | ✅ سلسة |
| الملف الشخصي (`/profile`) | ❌ لا تتمرّر | ✅ سلسة |
| الإعدادات (`/settings`) | ❌ لا تتمرّر | ✅ سلسة |
| المحفظة (`/wallet`) | ❌ لا تتمرّر | ✅ سلسة |
| الستوري (`/stories`) | ❌ لا تتمرّر | ✅ سلسة |
| الريلز (`/reels`) | ✅ سلسة | ✅ سلسة (دون أي تغيير) |
| المجموعات (`/groups`) | ✅ سلسة | ✅ سلسة (دون أي تغيير) |

---

## 🔧 ملاحظات للنشر

1. **لا حاجة لتغيير backend** — تعديل فرونت-إند فقط.
2. **لا dependencies جديدة** — CSS خام بدون مكتبات.
3. **لا breaking changes** — يستثني الريلز/المجموعات صراحةً ويُبقي سلوكهما الأصلي.
4. **يجب أن يبقى `yamshat-fixes-v59.13.25.css` آخر import CSS** في `main.jsx`.
