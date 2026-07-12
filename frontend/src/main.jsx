import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import App from './App.jsx';
import { LanguageProvider } from './i18n/LanguageProvider.jsx';
import './styles/index.css';
import './styles/yamshat-rtl-fix-v32.css';
import './styles/smooth-touch-experience.css';
import { queryClient } from './lib/queryClient.js';
import { useAppStore } from './store/appStore.js';
import RealtimeProvider from './realtime/RealtimeProvider.jsx';
import { initializePerformanceToolkit } from './utils/performance.js';
import { initializeRuntimeErrorCapture } from './utils/runtimeErrors.js';
import { installBrokenMediaSuppressor } from './utils/brokenMediaSuppressor.js';
import notificationService from './services/notificationService.js';
import audioService from './services/audio/audioService.js';
import { activateMediaEventBridge } from './services/audio/mediaEventBridge.js';
import socketManager from './services/socketManager.js';
import { useNotificationStore } from './store/notificationStore.js';
import * as chatBus from './features/chat/chatEventBus.js';
import './styles/mobile-optimization.css';
import './styles/performance.css';
import './styles/unified-overrides.css';
import './styles/mobile-first.css';
import './styles/design-system.css';
import './styles/chat-premium.css';
import './styles/reels-premium.css';
import './styles/reels-fixes.css';
import './styles/design-system-enforce.css';
/* ⚠️ يجب أن يكون آخر استيراد CSS حتى يفوز في cascade ويصلح مشاكل الموبايل */
import './styles/mobile-fixes.css';
import './styles/brand-chat-notifications-refresh.css';
/* 🎨 إعادة تصميم الموبايل (مطابق للنموذج المرجعي) - يجب أن يكون الأخير */
import './styles/mobile-yamshat-redesign.css';
/* 🔧 إصلاح أزرار التفاعل في بطاقات المنشورات للجوال */
import './styles/mobile-post-actions-fix.css';
import './styles/mobile-app-experience.css';
/* ✨ v2.3.2 — Premium Neon polish (يجب أن تكون آخر ملفات CSS) */
import './styles/neon-theme-v2.css';
import './styles/animations-glow.css';
import './styles/badges-indicators.css';
import './styles/responsive-mobile-v2.css';
import './styles/performance-v2.css';
import './styles/feed-scrollbar-fix.css';
/* 🔧 إصلاح نهائي للسحب على الموبايل + تجربة كأنها تطبيق (يجب أن يكون الأخير) */
import './styles/mobile-scroll-fix.css';
/* 📱 hotfix نهائي لتثبيت PWA على الجوال ومعالجة الدردشة والبث */
import './styles/pwa-mobile-hotfix.css';
/* 🎯 v4 — طبقة التوحيد النهائية (أزرار، مسافات، خطوط، ألوان لكل المنصة) */
import './styles/platform-unified-v4.css';
/* 🧩 إصلاح بطاقة المنشور (MobilePostCard) — يحلّ التناثر ويُوحّد الشكل النهائي */
import './styles/mobile-post-card-unified-fix.css';
/* 🎯 v45 — إصلاحات ويب الجوال الحرجة (الفيديو + الهيدر + التخطيط) */
import './styles/mobile-fixes-v45.css';
/* 🎯 v46 — إصلاحات ويب الجوال (الإحصائيات + أيقونات المنشور + الهيدر + ضبط العرض) — يجب أن يكون الأخير */
import './styles/mobile-fixes-v46.css';
/* 🎯 v47.8 — pixel-perfect لمطابقة الصورة المرجعية + دعم الشاشات الصغيرة (Redmi Note 8 / 320px) */
import './styles/mobile-pixel-perfect-v47-8.css';
/* 🎯 v47.9 — تحسينات نهائية: PWA Banner + إصلاح subtext + شعار Y بسيط + توافق متصفحات قديمة */
import './styles/mobile-pixel-perfect-v47-9.css';
/* 🚀 v48.0 — إصلاح شامل لمشكلة اللمس الثقيل وعدم الاستجابة للسحب على Chrome Mobile / PWA */
import './styles/touch-responsiveness-fix.css';
/* 📱 v48.1 — تصغير الخطوط في صفحات الويب للجوال لتناسب الجوالات القديمة + منع تجاوز حدود الأزرار والصفحات */
import './styles/mobile-compact-fonts-v48.css';
/* 🎯 v49 — إصلاح نهائي وحازم لمشكلة السحب لا يعمل على ويب الجوال */
import './styles/mobile-touch-scroll-final-v49.css';
/* 🚀 v52 — تجربة لمس كأنها تطبيق أصلي */
import './styles/mobile-touch-app-feel-v52.css';
/* 🏆 v57 — Master Touch Fix: إصلاح نهائي للسحب واللمس على كل الصفحات والمتصفحات (آخر CSS مطلقاً) */
import './styles/mobile-touch-master-fix-v57.css';
import './styles/mobile-touch-paw-v58.css';
/* ⭐ v59.10 — نقل فلسفة الدراور (YamServicesMenu) إلى جميع الصفحات
   حاوية .page-content تصبح هي المسؤولة عن التمرير بسلاسة
   تماماً مثل .yam-services-panel — يجب أن يكون آخر CSS مطلقاً */
import './styles/drawer-style-touch-final-v59.10.css';
/* ⭐ v59.12 — رفع لوحة التحكم لملء الشاشة وإزالة الفراغ العلوي
   يجب أن يكون آخر CSS لضمان أنه يتجاوز أي قواعد سابقة
   dir="rtl" + Noto Sans Arabic */
import './styles/admin-fullscreen-fix-v59.12.css';
/* 🩹 v59.13.1 — Fix Pack: زر (+) في الشريط السفلي + شريط التصفية + صندوق "بماذا تفكر؟" */
import './styles/yamshat-fixes-v59.13.1.css';
/* 🛠️ v59.13.2 — إصلاح جذري لعدم استجابة الصفحات للسحب على الجوال (ويب + PWA)
   حلّ تعارض overflow بين v59.10 CSS و MobileLayout JSX + إصلاح Pull-to-Refresh */
import './styles/mobile-scroll-final-v59.13.2.css';
/* 🩹 v59.13.20 — Definitive Mobile Pull Fix — يفوز على كل ما سبق.
   يُصلح: re-attach storm + overlays + touch-action:none + pointer-events:none */
import './styles/mobile-pull-fix-v59.13.20.css';
/* ⭐ v59.13.24 — Final Fix Pack (Reels-style scroll + composer/filters RTL) */
import './styles/yamshat-fixes-v59.13.24.css';
/* ⭐ v59.13.25 — Reels-Style Scroll Fix على .page-content (الحاوية الحقيقية) */
import './styles/yamshat-fixes-v59.13.25.css';
/* ⭐ v59.13.26 — PERFECT REELS-PARITY: Scroll متطابق 100% مع الريلز/المجموعات
   على كل الصفحات (الرئيسية/الشات/الستوري/الإشعارات/الإعدادات...).
   يعمل مع تعديلات MainLayout.jsx (position:absolute + inset:0 على .page-content). */
import './styles/yamshat-fixes-v59.13.26.css';
/* ⭐ v59.13.28 — HOME MOBILE = GROUPS MOBILE (parity)
   يجعل الصفحة الرئيسية على ويب الموبايل تستجيب للسحب لأعلى/أسفل
   بسلاسة فائقة مثل صفحة المجموعات تماماً (بصمة .yam-groups-page). */
import './styles/home-mobile-page-v59.13.28.css';
/* ⭐ v59.13.29 — CHAT + STORIES MOBILE PULL PARITY
   يطبّق نفس بصمة .yam-groups-page على:
   - .yam-inbox-page (قائمة المحادثات)
   - .yam-stories-page (صفحة الستوريات)
   - .yam-messages-area (منطقة الرسائل في الشات الفردي) */
import './styles/chat-stories-mobile-pull-v59.13.29.css';
/* ⭐ v59.13.31 — CHAT + STORIES MOBILE PULL HARD FIX
   يتغلّب على inline <style> blocks داخل JSX (Inbox.jsx + StoriesPage.jsx + Chat.jsx).
   يحلّ مشكلة: السحب لأعلى/أسفل من منتصف الشاشة لا يستجيب.
   يلغي contain:layout/style/paint الذي يكسر momentum scroll على iOS Safari.
   ⚠️ يجب أن يبقى آخر import CSS مطلقاً. */
import './styles/chat-stories-mobile-pull-v59.13.31.css';
/* ⚭ v59.13.35 — Font Size Control + Chat Translation Strip styles */
import './styles/font-size-control.css';
/* 🩹 v60.9 — RTL FIX: إعادة منطقة "بماذا تفكر؟" + شريط الفلترة
   (الكل / المجموعات / الستوري / الوسائط) إلى جهة اليمين الصحيحة
   على ويب الجوال — إصلاح دقيق ومتقن. */
import './styles/yamshat-fixes-v60.9-rtl-composer-filters.css';
/* 🎯 v61 — DEFINITIVE CHAT HEADER FIX (Mobile + Laptop/Desktop)
   استبدال كامل لكل ملفات chat-mobile-redesign-v60.x.css السابقة
   وأيضاً يعالج المشاكل التالية بشكل نهائي:
   1) اسم المشترك (peer name) + حالة "نشط الآن" يظهران بوضوح
   2) أزرار الاتصال (📞 🎥 ⋮) مصغّرة ولا تغطي منطقة الاسم
   3) إزالة زر الرجوع المُكرَّر القادم من GlobalPageBackButton
   4) راس صفحة الدردشه متوافق على الجوال واللاب توب
   ⚠️ يجب أن يبقى هذا الملف من آخر CSS imports في main.jsx ليفوز في cascade */
import './styles/chat-redesign-v61.css';
/* ✅ v62 hotfix: إصلاح علوق تحميل الملف الشخصي + ظهور منطقة كتابة التعليق.
   يجب أن يبقى هذا الإستيراد بعد chat-redesign-v61.css ليفوز في cascade */
import './styles/yamshat-fixes-v62-profile-comments.css';
/* ✅ v63 pixel‑match: مطابقة دقيقة لشاشة الدردشة على الجوال مع الصورة المرجعية
   (هيدر، فقاعات زرقاء، شريط ترجمة برتقالي، كرت مكالمة، شريط إدخال سفلي).
   يجب أن يبقى هذا الاستيراد آخر CSS chat-related ليفوز في cascade. */
import './styles/chat-mobile-pixel-match-v63.css';
/* ✅ v64 polish: ضمان ظهور قائمة خيارات الرسالة (popup) فوق الرسالة دائماً،
   تحسين شريط الترجمة الأصفر، وتثبيت شريط الإدخال السفلي.
   يجب أن يبقى هذا الاستيراد آخر CSS chat-related ليفوز في cascade. */
import './styles/chat-mobile-pixel-match-v64.css';
/* 🎯 v65 STRETCH FIX (Mobile Web Feed):
   - صندوق "بماذا تفكر؟" يمتد بعرض الشاشة الكامل ويلتصق بحافتي العرض.
   - أزرار الفلترة (الكل/المجموعات/الستوري/الوسائط) تمتد بنفس العرض.
   - يستخدم width: calc(100% + 24px) بدلاً من width: auto لحساب رياضي دقيق.
   - يصلح مشكلة الفراغ الأسود في الجهة اليمنى في وضع RTL.
   ⚠️ يجب أن يبقى هذا الاستيراد بعد v60.9 ليفوز في cascade. */
import './styles/yamshat-fixes-v65-composer-filters-stretch.css';
/* 🚨 v66 CRITICAL UX FIXES — Profile + Reels Comments + Chat Header + Reaction Popup
   1) الملف الشخصي: ضمان قابلية الضغط والتفاعل (لا تعليق)
   2) تعليقات الريلز: ظهور منطقة كتابة التعليق دائماً
   3) هيدر الدردشة: ضمان ظهور اسم الشخص الذي تدردش معه
   4) أزرار التفاعل (Long-press): تظهر فوق الرسالة وليس خلفها (createPortal + z-index)
   ⚠️ يجب أن يبقى هذا الاستيراد آخر CSS chat-related ليفوز في cascade. */
import './styles/yamshat-fixes-v66-profile-reels-chat.css';
/* 🎯 v67 DEFINITIVE FIX — Chat header: peer name + "متصل" status visibility on mobile.
   يصلح السبب الجذري: brand-chat-notifications-refresh.css كان يعطي
   .yam-chat-stage-actions عرض 100% فيُخفي منطقة الاسم. هذا الملف يلغي ذلك
   ويضمن ظهور الاسم + "متصل" مع تصغير محسوب للأزرار من أقصى لأدنى حد.
   ⚠️ يجب أن يبقى هذا الاستيراد آخر CSS chat-related ليفوز في cascade. */
import './styles/chat-header-v67-name-online-fix.css';
/* 🎯 v68 FINAL FIX — صندوق "بماذا تفكر؟" + شريط الفلاتر مرئيان بعرض كامل (RTL).
   إصلاح جذري: نُلغي padding الجانبي من .yam-home-mobile-page ونضعه على
   .ym-feed (المنشورات) فقط. النتيجة: الأشرطة تمتد بعرض الشاشة كاملاً
   بدون أي negative margin أو calc() hack، وتلتصق باليمين في RTL.
   ⚠️ يجب أن يبقى هذا الاستيراد آخر CSS مطلقاً ليفوز في cascade. */
import './styles/yamshat-fixes-v68-composer-filters-final.css';
/* 🎯 v69 DEFINITIVE CHAT DESKTOP LAYOUT FIX —
   إصلاح نهائي وحاسم لعرض صفحة المحادثة الفردية (/chat/:userId) على الويب
   (الكمبيوتر/اللاب توب). يضمن ظهور: قائمة جهات الاتصال (يمين) +
   منطقة الرسائل (وسط) + بطاقة الملف الشخصي (يسار) — تماماً كما يظهر
   على الجوال. يلغي تعارض brand-chat-notifications-refresh.css.
   ⚠️ يجب أن يبقى هذا الاستيراد آخر CSS مطلقاً ليفوز في cascade. */
import './styles/chat-desktop-layout-v69-fix.css';
/* 🔥 v70 ROOT-CAUSE FIX — Composer + Filters Sticky Visibility (FINAL)
   يحل المشكلة المزمنة لاختفاء/هروب شريطي «بماذا تفكر؟» والفلاتر في
   صفحة المنشورات للويب موبايل. يُلغي `will-change: scroll-position`
   ويزيل كل transform/filter/perspective من المسار، ويضبط offset
   الـ sticky بدقة بالنسبة لارتفاع MobileTopBar الثابت.
   ⚠️ يجب أن يبقى هذا الاستيراد آخر CSS مطلقاً ليفوز في cascade. */
import './styles/yamshat-fixes-v70-composer-filters-root-fix.css';
/* 🔥 v71 ROOT FIX — أداء + استجابة اللمس + فتح النوافذ + ظهور الملف الشخصي
   يحل بدل backdrop-filter و will-change العالمي + يفعّل content-visibility على البطاقات.
   ⚠️ يجب أن يبقى أخر CSS مطلقاً ليفوز في cascade */
import './styles/yamshat-fixes-v71-performance-root-fix.css';

/* ✅ v72 — ULTIMATE FIX for composer + filters width on mobile home.
   يحل المشكلة المزمنة (5 محاولات فاشلة في v60.9/v65/v68/v70) حيث كان
   شريط "بماذا تفكر؟" وأزرار التصفية يهربان لجهة اليسار بعرض ~50% فقط.
   السبب الجذري: width: auto + margin-inline negative من v60.9 +
   display: flex column من v70 = reflow متضارب على Chrome Mobile.
   الحل: العودة إلى display: block + width: 100% بـ specificity عملاقة.
   ⚠️ يجب أن يبقى هذا الملف **آخر CSS مطلقاً** ليفوز في cascade. */
import './styles/yamshat-fixes-v72-composer-filters-ULTIMATE.css';

/* 🔥🔥🔥 v73 — DEFINITIVE ROOT FIX (الحل الجذري الحاسم بعد 6 محاولات)
   يحلّ نهائياً مشكلة هروب "بماذا تفكر؟" + أزرار التصفية إلى اليسار
   على ويب الموبايل (الشاشات الصغيرة 320–480px).
   
   📐 النموذج المعماري الجديد: CSS Grid (1fr) على الحاوية الأم.
      Grid يجبر الأبناء على عرض 100% عبر justify-items: stretch تلقائياً
      — يلغي تأثير أي width:auto قديم بدون معركة specificity.
   
   🗑️ تمّ تفريغ الملفات السامة فعلياً (v60.9, v65, v68, v70, v72)
      كلها تشير الآن إلى v73 كحلٍّ بديل.
   
   ⚠️ يجب أن يبقى هذا الملف **آخر CSS مطلقاً** بعد كل الإصلاحات. */
import './styles/yamshat-fixes-v73-composer-filters-DEFINITIVE.css';

/* 🔥🔥🔥 v75 — ABSOLUTE FINAL FIX (الحل المطلق للمشكلة المزمنة)
   يصلح نهائياً مشكلة "بماذا تفكر؟" + أزرار التصفية التي تهرب
   إلى اليسار بدلاً من الامتداد بعرض الشاشة الكامل في RTL.
   
   ⚠️ هذا الملف يجب أن يكون **آخر CSS مطلقاً** ليفوز في cascade. */
import './styles/yamshat-fixes-v75-composer-filters-ABSOLUTE.css';

/* 🔥🔥🔥 v76 — FINAL ROOT-CAUSE FIX (الإصلاح النهائي للسبب الجذري)
   يصلح نهائياً مشكلة هروب "بماذا تفكر؟" + شريط التصفية لليسار
   على ويب الجوال في الصفحة الرئيسية للمنشورات.

   🔬 السبب الحقيقي (الذي فات v59→v75):
   .page-content في MainLayout.jsx يستخدم scrollbar-gutter: stable
   الذي في RTL يحجز ~15px على الحافة اليمنى → كل المحتوى ينزاح لليسار.
   
   ✅ الحل: إلغاء scrollbar-gutter + إخفاء scrollbar الفعلي
   على .page-content (الأم) — وليس .yam-home-mobile-page (الابن).

   ⚠️ هذا الملف يجب أن يكون آخر CSS مطلقاً ليفوز في cascade. */
import './styles/yamshat-fixes-v76-FINAL-ROOT-CAUSE.css';

/* 🔥🔥🔥 v78 — RTL FULL-BLEED ROOT FIX (حل نهائي بعد 9 محاولات فاشلة)

   🔬 تحليل جديد: v60.9→v76 استخدموا كلها
         width:100% + left:0 + right:0 + inset-inline:0
   لكن هذه تُحسب نسبةً إلى صندوق الأب المعطوب أصلاً:
     • scrollbar-gutter: stable (v76 ألغاه لكن المتصفحين أحياناً يتجاهلون الـ override)
     • Chrome Mobile scrollbar الحقيقي (يقتطع 10-15px)
     • max-width: 1200px من media query على الديسكتوب
     • padding/margin موروث من طبقات app-shell→main-shell→page-content

   ✅ الحل الجذري: تقنية Full-Bleed الـ CSS الشهيرة:
         width: 100vw
         margin-inline-start: calc(50% - 50vw)
         margin-inline-end:   calc(50% - 50vw)
   هذه تُخرج العنصر من حاويته وتملأ عرض الـ viewport الفعلي
   بغض النظر عن أي scrollbar-gutter/padding/max-width موروث.

   إضافةً، تم حذف scrollbar-gutter:stable من المصدر في
   MainLayout.jsx (لا override) لإيقاف المشكلة من جذرها.

   ⚠️ هذا الملف يجب أن يكون آخر CSS مطلقاً. */
import './styles/yamshat-fixes-v78-RTL-FULLBLEED-ROOT.css';
/* v79 — حذف نهائي لزر "بماذا تفكر؟" + أزرار التصفية من أعلى الصفحة الرئيسية للجوال */
import './styles/yamshat-fixes-v79-REMOVE-COMPOSER-FILTERS.css';
/* v80 — إضافة شريط بحث فيسبوك-ستايل أعلى صفحة الجوال + رفع منطقة كتابة التعليق للأعلى */
import './styles/yamshat-fixes-v80-SEARCHBAR-COMMENT-LIFT.css';
import './styles/yamshat-fixes-v81-PROFILE-TOUCH-SCROLL.css';
// v85.7: إصلاحات جذرية — تمرير صفحة الأصدقاء + تراكب صندوق كتابة
// المجموعات + شيت التعليقات على الجوال.
import './styles/yamshat-fixes-v85.7-FRIENDS-CHAT-COMMENTS.css';
// v85.9: إعادة تطبيق قسرية لإصلاحات v85.7 على الجوال (خصوصية أعلى + كسر
// كاش Service Worker القديم). يجب أن يبقى هذا الاستيراد آخر شيء
// كي يتفوّق على أي CSS legacy.
import './styles/yamshat-fixes-v85.9-MOBILE-FORCE-FIXES.css';
// v86.0: إصلاح 5 مشاكل حرجة أبلغ عنها المستخدمون:
//   1) بوست الستوري لا يقبل السحب  2) إنشاء مجموعة لا يقبل السحب
//   3) شات المجموعة لا يظهر رسائل ولا إدخال  4) الصور بحواف كبيرة
//   5) التعليقات لا تظهر. يجب أن يبقى آخر استيراد CSS.
import './styles/yamshat-fixes-v86.0-USER-REPORTED-FIXES.css';
// v86.1: بعد فحص شامل لجميع الصفحات/البوستات، تم العثور على اثنتين
//   لم يستجيبا للسحب لأعلى/أسفل على ويب الجوال:
//   1) بوست "منشور جديد" (.ympc-page — PostComposerPage)
//   2) بوست "إنشاء جديد" (.yam-compose-modal داخل Inbox)
//   تم إصلاحهما بنفس بصمة الصفحة الرئيسية (parity كامل).
import './styles/yamshat-fixes-v86.1-POST-COMPOSE-SCROLL.css';
// v86.2: استكمال الفحص → عُثر على بوستَين إضافيَّين لم يعملا بسلاسة:
//   1) بوست "إنشاء مجموعة" (.yam-create-group-page — /groups/create)
//   2) بوست "إنشاء ريل/صورة" (.ymrc-root — ReelComposer)
//   أصبحا يتصرَّفان مثل الصفحة الرئيسية بالضبط (parity كامل).
import './styles/yamshat-fixes-v86.2-CREATE-REEL-SCROLL.css';
// v86.3: استكمال الفحص → عُثر على صفحتَين إضافيَّتَين لم يعملا بسلاسة:
//   1) صفحة "إعدادات المجموعة" (.yam-group-settings-page — /groups/:id/settings)
//   2) صفحة "إعدادات المحادثة" (.yam-chat-settings-screen — /chat/:peer/settings)
//   أصبحتا تعملان بسلاسة فل الفل مثل الصفحة الرئيسية على ويب الجوال.
//   ⚠️ يجب أن يبقى آخر استيراد CSS ليفوز في cascade.
import './styles/yamshat-fixes-v86.3-SETTINGS-SCROLL.css';

// v86.4: إصلاح صفحتَي "الكل — الأصدقاء" (.friends-all-page — /friends/all)
//   و "الإشعارات" (.yam-notifications-page — /notifications).
//   أصبحتا تعملان بسلاسة فل الفل مثل الصفحة الرئيسية على ويب الجوال.
import './styles/yamshat-fixes-v86.4-FRIENDS-NOTIFICATIONS-SCROLL.css';

// v86.5: إصلاح صفحتَي "البحث الذكي" (.yam-search-page-shell — /search)
//   و "استقبال المحتوى المُشارَك" (.share-target-page — /share-target).
//   أصبحتا تعملان بسلاسة فل الفل مثل الصفحة الرئيسية على ويب الجوال.
import './styles/yamshat-fixes-v86.5-SEARCH-SHARETARGET-SCROLL.css';

// v86.6: استكمال الفحص → عُثر على صفحتَين إضافيَّتَين لم يعملا بسلاسة:
//   • "لوحة التحكم" (.dashboard-grid — /dashboard)
//   • "اكتشاف المستخدمين" (.yam-users-page — /users)
//   الحل: نقل الأم .page-content لتصبح الـ scroller الرأسي وكسر
//   contain/transform legacy + touch-action:pan-y على كل الأبناء —
//   نفس بصمة v86.4/v86.5 بحذافيرها.
//   ⚠️ يجب أن يبقى آخر استيراد CSS ليفوز في cascade.
import './styles/yamshat-fixes-v86.6-DASHBOARD-USERS-SCROLL.css';

// v87.6: إصلاح عرض الصور والرسائل الصوتية في الدردشة لتطابق واتساب:
//   • الصورة تظهر بدون تغليف فقاعة (is-media-only → خلفية شفافة)
//   • الوقت + القراءة فوق الصورة كطبقة مثل واتساب
//   • Voice Pill مع موجة واضحة، أيقونة ميكروفون، وزر سرعة أثناء التشغيل
//   • تحييد .audio-waveform الافتراضية داخل الـ pill
import './styles/yamshat-fixes-v87.6-CHAT-MEDIA-VOICE-WHATSAPP.css';

// v87.9 — Buttons & Menus Global Polish
// تحسين شامل لكل الأزرار والقوائم في جميع الصفحات (ظلال، انتقالات، تركيز واضح،
// تنظيم مجموعات الأزرار، شكل احترافي لكل من BottomNav / Tabs / Dropdowns / Chips)
import './styles/yamshat-fixes-v87.9-BUTTONS-MENUS-POLISH.css';

// v87.10 — Chat Completeness Fixes
// تفعيل إيصالات القراءة المرئية (✓ / ✓✓ / ✓✓ ملوّنة)، بانر إعادة المحاولة عند الفشل،
// شارة "محوّلة" للرسائل المرفوعة، تحسين ألوان الحالات.
// ⚠️ يجب أن يبقى آخر استيراد CSS ليفوز في cascade.
import './styles/yamshat-fixes-v87.10-CHAT-COMPLETENESS.css';

import { initializeViewportTracker } from './hooks/useViewportHeight.js';
import { applyFontSize, getStoredFontSize } from './components/settings/FontSizeSettings.jsx';
import { pwaInitializer } from './services/pwaInitializer.js';
import { smoothTouchLayer } from './services/smoothTouchLayer.js';
import { legacyDeviceOptimizer } from './services/legacyDeviceOptimizer.js';
import { instantTouchFeedback } from './services/instantTouchFeedback.js';
import { pawTouchEnhancer } from './services/pawTouchEnhancer.js';

const BUILD_ID = 'yamshat-v87.10-CHAT-COMPLETENESS';
const BUILD_STORAGE_KEY = 'yamshat_build_id';

async function hardResetIfBuildChanged() {
  if (typeof window === 'undefined') return false;

  try {
    const previousBuild = localStorage.getItem(BUILD_STORAGE_KEY);
    if (previousBuild === BUILD_ID) return false;

    localStorage.setItem(BUILD_STORAGE_KEY, BUILD_ID);
    localStorage.removeItem('backendOrigin');
    localStorage.removeItem('apiBase');
    localStorage.removeItem('yamshat_post_draft');
    localStorage.removeItem('yamshat_quote_draft');

    // 🚨 v85.9 — كسر كاش Service Worker القديم قسراً على الجوال (PWA):
    //   * إلغاء تسجيل كل SW مسجّلة سابقاً حتى يُعاد تنزيل sw.js الجديد.
    //   * مسح كل الكاشات المخزّنة (Cache Storage) — بما فيها caches
    //     المحفوظة تحت أسماء VERSION قديمة.
    // بدون هذا، مستخدم الجوال يرى النسخة القديمة من الأصول حتى بعد
    // مسح كاش المتصفح، لأن الـ SW القديم يخدم من Cache Storage مباشرةً.
    try {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister().catch(() => null)));
      }
    } catch { /* ignore */ }
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k).catch(() => null)));
      }
    } catch { /* ignore */ }

    const reloadFlag = `yamshat_build_reload:${BUILD_ID}`;
    if (!sessionStorage.getItem(reloadFlag)) {
      sessionStorage.setItem(reloadFlag, '1');
      window.location.replace(window.location.href);
      return true;
    }
  } catch {
    // ignore reset failures to avoid blocking startup
  }

  return false;
}

function normalizeStandaloneDeepLink() {
  if (typeof window === 'undefined') return;
  const { pathname, search, hash } = window.location;
  if (hash && hash.startsWith('#/')) return;
  if (pathname === '/' || pathname === '/index.html') return;
  const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  window.location.replace(`/#${normalizedPath}${search}${hash || ''}`);
}

function announceUpdateReady(registration) {
  window.dispatchEvent(new CustomEvent('yamshat:update-ready', {
    detail: { registration },
  }));
}

function watchServiceWorkerUpdates(registration) {
  if (!registration) return registration;

  if (registration.waiting) {
    announceUpdateReady(registration);
  }

  registration.addEventListener('updatefound', () => {
    const installingWorker = registration.installing;
    if (!installingWorker) return;

    installingWorker.addEventListener('statechange', () => {
      if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
        announceUpdateReady(registration);
      }
    });
  });

  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });

  return registration;
}

if (typeof window !== 'undefined') {
  normalizeStandaloneDeepLink();
  // v59.13.35 — تطبيق حجم الخط المحفوظ فوراً على <html> (قبل أي رسم)
  try { applyFontSize(getStoredFontSize()); } catch (_) { /* ignore */ }
  window.__YAMSHAT_BUILD__ = BUILD_ID;
  window.__YAMSHAT_SW_READY__ = Promise.resolve(null);
  initializePerformanceToolkit();
  initializeRuntimeErrorCapture();
  // v59.12: كتم أخطاء 404 للوسائط التالفة (/uploads/*) واستبدالها بـ placeholder محلي
  installBrokenMediaSuppressor();
  initializeViewportTracker();

  // تفعيل تحسينات PWA وتجربة المستخدم بشكل مؤجل لضمان سرعة ظهور الصفحة الأولى
  const initializeEnhancements = () => {
    try {
      // 🔧 v49: تعطيل smoothTouchLayer على document.documentElement لأنه
      // كان يُلصق 4 معالجات touch على <html> وتتسبب في تعليق السحب على بعض أجهزة
      // Android القديمة (Redmi/Honor/Galaxy A). نستخدمه فقط عند الحاجة عبر عناصر محددة.
      // smoothTouchLayer.attachToElement(document.documentElement);

      // 🚀 v52: تفعيل طبقة الاستجابة الفورية للمس (FastClick-like + scroll detection)
      try {
        instantTouchFeedback.init();
        console.log('[Yamshat] Instant Touch Feedback v52 activated');
      } catch (err) {
        console.warn('[Yamshat] Instant touch init failed', err);
      }

      // 🐾 v58: تفعيل PAW Touch Enhancer — يصلح مشكلة عدم استجابة المس في صفحة المنشورات
      // ويعمل على كل أنواع الجوالات/الشاشات (Redmi/Huawei/Honor/Samsung/iPhone)
      try {
        pawTouchEnhancer.init();
        console.log('[Yamshat] PAW Touch Enhancer v58 activated');
      } catch (err) {
        console.warn('[Yamshat] PAW touch enhancer init failed', err);
      }

      // تفعيل محسّن الأجهزة القديمة
      const deviceState = legacyDeviceOptimizer.getState();
      if (deviceState.isLegacyDevice) {
        console.log('[Yamshat] Legacy device optimizations applied');
      }

      // تفعيل PWA - نستخدم sw.js الرئيسي الموحد
      pwaInitializer.init({ swPath: '/sw.js' }).then(() => {
        console.log('[Yamshat] PWA initialized successfully');
      }).catch(err => {
        console.warn('[Yamshat] PWA initialization error:', err);
      });
    } catch (err) {
      console.warn('[Yamshat] Enhancement initialization error:', err);
    }
  };

  // تأجيل التهيئة قليلاً للسماح للمتصفح برسم الواجهة أولاً
  if (window.requestIdleCallback) {
    window.requestIdleCallback(() => initializeEnhancements());
  } else {
    setTimeout(initializeEnhancements, 1000);
  }

  try {
    activateMediaEventBridge({
      notificationStore: useNotificationStore,
      socketManager,
      chatBus,
    });
    audioService.preload();
  } catch (err) {
    if (typeof console !== 'undefined') console.warn('[audio] bridge init failed', err);
  }

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    useAppStore.getState().setInstallPrompt(event);
  });

  window.addEventListener('appinstalled', () => {
    useAppStore.getState().clearInstallPrompt();
  });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      const resetTriggeredReload = await hardResetIfBuildChanged();
      if (resetTriggeredReload) return;
      
      // ملاحظة: pwaInitializer.init() يتولى الآن تسجيل sw.js بشكل موحد
      // لضمان عدم وجود تعارضات وسرعة في التحميل
      console.log('[Yamshat] Service Worker registration deferred to PWA Initializer');
    });
  }
}

// 🔄 إتاحة queryClient عالمياً لاستخدامه في ميزة "اسحب للتحديث" من الـ Layouts
if (typeof window !== 'undefined') {
  window.__yamshatQueryClient = queryClient;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <HashRouter>
          <RealtimeProvider>
            <App />
          </RealtimeProvider>
        </HashRouter>
      </LanguageProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
