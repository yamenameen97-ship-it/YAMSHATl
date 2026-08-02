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

import './styles/yamshat-call-bubble-v88.56.css';
// v87.9 — Buttons & Menus Global Polish
// تحسين شامل لكل الأزرار والقوائم في جميع الصفحات (ظلال، انتقالات، تركيز واضح،
// تنظيم مجموعات الأزرار، شكل احترافي لكل من BottomNav / Tabs / Dropdowns / Chips)
import './styles/yamshat-fixes-v87.9-BUTTONS-MENUS-POLISH.css';

// v87.10 — Chat Completeness Fixes
// تفعيل إيصالات القراءة المرئية (✓ / ✓✓ / ✓✓ ملوّنة)، بانر إعادة المحاولة عند الفشل،
// شارة "محوّلة" للرسائل المرفوعة، تحسين ألوان الحالات.
import './styles/yamshat-fixes-v87.10-CHAT-COMPLETENESS.css';

// v87.15 — Reinforced mobile fixes (deployment-safe)
// 1) الستوريات لا تختبئ تحت الأزرار العلوية حتى بدون :has
// 2) شات المجموعة يصبح keyboard-aware بدون تراكب أو زر إرسال شبح
// 3) صفحة كتابة المنشور تستعيد السحب واللمس الطبيعي على الجوال
// ⚠️ يجب أن يبقى آخر استيراد CSS مطلقاً.
import './styles/yamshat-fixes-v87.14-STORIES-GROUPCHAT-COMPOSER.css';
// v87.16: آخر طبقة إصلاح للدردشة — إزالة التغليف الزائد عن الصور والرسائل
// الصوتية حتى مع وجود CSS legacy أو كاش قديم.
import './styles/yamshat-fixes-v87.16-CHAT-MEDIA-FINAL-POLISH.css';
// v87.17: إصلاح صفحة الإعدادات الرئيسية (.settings-wrap) + كل الفروع
// (.settings-shell) لتعمل مثل الصفحة الرئيسية (.yam-home-mobile-page)
// — السحب باللمس للأعلى والأسفل على البستات يستجيب بسلاسة فل الفل.
import './styles/yamshat-fixes-v87.17-SETTINGS-MAIN-SCROLL.css';

// v87.18: FINAL ROOT FIX للسحب على ويب-جوال في كل صفحات الإعدادات
// (رئيسية + فرعية) وكل البستات في الصفحة الرئيسية للمنشورات.
// نجعل .settings-wrap و .settings-shell نفسها scroll containers
// (height:100dvh + overflow-y:auto + touch-action:pan-y + momentum
// scroll) — مطابقة 1:1 لـ .yam-home-mobile-page. + إصلاح صفحة
// الملف الشخصي التي كانت شاشة بيضاء بسبب دالة غير معرّفة.
// ⚠️ يجب أن يبقى آخر استيراد CSS مطلقاً.
import './styles/yamshat-fixes-v87.18-SETTINGS-POSTS-SCROLL-FINAL.css';
// v87.21: إصلاح نهائي لويب-الجوال داخل الشات — إزالة غلاف الصور وفرض
// شكل WhatsApp-like للرسائل الصوتية مع زر تشغيل بالطرف. يجب أن يبقى آخر
// استيراد CSS لكسر أي طبقات legacy/كاش قديم.
import './styles/yamshat-fixes-v87.21-CHAT-MOBILE-WEB-MEDIA-VOICE.css';

// ✅ v87.22 — إصلاحات المستخدم الحرجة الأربعة:
//   1) صفحة الملف الشخصي على الجوال قابلة للسحب عمودياً.
//   2) وسائط المنشورات (صور/فيديو) تُعرض دون تكسّر.
//   3) الرسائل الصوتية بموجة + سهم تشغيل + عرض المدّة الفعلية.
//   4) نافذة الإبلاغ تُظهر زر الإرسال دائماً.
import './styles/yamshat-fixes-v87.22-FOUR-CRITICAL-FIXES.css';

// ⭐ v87.23 — إصلاح جذري لسحب صفحات الإعدادات على ويب-الجوال:
// تطبيق نمط .yam-home-mobile-page (من صفحة المنشورات الناجح) على
// .settings-wrap + .settings-shell. هذا الملف يوفّق بين الجماليات
// وقواعد التمرير الموروثة، ويضمن momentum scroll حقيقي على iOS.
// يجب أن يبقى آخر استيراد CSS ليفوز في Cascade.
import './styles/yamshat-fixes-v87.23-SETTINGS-YAM-HOME-MOBILE.css';

// ⭐ v88.9 (2026-07-18) — إصلاح جذري لقص الصور في المنشورات والدردشة
// على شاشات الجوال الصغيرة (وشات ويب موبايل). يفرض object-fit:contain
// ويرفع max-height ذكيًا لإظهار الصور كاملة. يجب أن يبقى آخر استيراد CSS.
import './styles/yamshat-fixes-v88.9-IMAGE-CROP-FINAL-FIX.css';

// ✅ v87.24 — الإصلاح النهائي الشامل للمشاكل الأربع:
// 1) البروفايل لا يسحب → overflow-y:auto + touch-action:pan-y جذري
// 2) الصور/الفيديو في المنشورات تتكسر → aspect-ratio + object-fit:contain
// 3) الرسائل الصوتية في الشات → yam-voice-pill إعادة بناء كاملة
// 4) زر إرسال البلاغ مختفي → report-modal-card flex-column + sticky buttons
// يجب أن يكون آخر CSS في Cascade ليتغلب على كل الطبقات السابقة.
import './styles/yamshat-fixes-v87.24-FINAL-COMPLETE-FIX.css';

// ✅ v88 — الحل النهائي الجذري: الصوت + الصور + الفيديو داخل الشات
import './styles/yamshat-fixes-v88-MEDIA-VOICE-FINAL.css';

// ✅ v88.5.1 — إصلاحان مطلوبان من المستخدم:
//   1) زر تشغيل № الرسالة الصوتية يختفي (دائرة بيضاء فارغة) → إعادة إظهار № دائماً.
//   2) توحيد أزرار الكومبوزر داخل مستطيل واحد فوق صندوق الكتابة:
//      الإيموجي + المرفق + GIF + الصورة + المايك + الإرسال كلّها بمسار واحد.
// يجب أن يكون آخر import ليفوز في Cascade.
import './styles/yamshat-fixes-v88.5.1-VOICE-PLAY-COMPOSER-UNIFIED.css';

// v88.8: IMAGE VIEWER FIX — إصلاح عرض الصور في الدردشة
// المشكلة: كانت الصورة تظهر كمستطيل ضيق مع اقتصاص أعلى وأسفل
// (object-fit: cover في الملفات القديمة). الإصلاح: contain لعرض
// الصورة كاملة داخل الفقاعة، وعند الضغط عليها تُفتح بالحجم الكامل.
// يجب أن يكون هذا آخر import CSS ليفوز في Cascade.
import './styles/yamshat-fixes-v88.8-IMAGE-VIEWER-FIX.css';

// v88.17: must stay last — preserves full post media on the mobile feed.
import './styles/yamshat-fixes-v88.17-MOBILE-FEED-UPDATE-STABILITY.css';

// ✅ v88.19: FINAL FIX — صندوق تعليقات المنشور على الجوال (MobileCommentsSheet)
// المشكلة: صندوق كتابة التعليق كان يختفي جزئياً خلف أزرار نظام الهاتف السفلية
// (home indicator / gesture bar) لأن التصميم القديم استخدم position:absolute
// مع bottom:var(--ym-kb-inset) الذي يساوي 0 بدون كيبورد → التصاق بحافة الشاشة.
// الحل: مطابقة سلوك درج تعليقات الريلز — الـ overlay يرفع البانل عبر
// padding-bottom: safe-area + kb-inset، والـ composer flex-item عادي بلا تثبيت.
// يجب أن يبقى هذا آخر import CSS ليفوز في Cascade على كل الطبقات السابقة.
import './styles/yamshat-fixes-v88.19-COMMENTS-SHEET-FINAL.css';

// ✅ v88.23: FINAL FIX — سحب صفحتَي معالج إنشاء المجموعة وإعدادات إشعارات المجموعة
// المشكلة: كلا الصفحتين (.yamg-page) لم تستجيبا للسحب باللمس للأعلى والأسفل
// على الجوال، ما يمنع الوصول إلى زر "التالي" في المعالج وإلى بقية إعدادات
// الإشعارات. الحل: تطبيق بصمة .yam-home-mobile-page 1:1 على .yamg-page —
// نفس النهج الذي نجح في v87.17 مع .settings-wrap / .settings-shell.
// يجب أن يبقى هذا آخر import CSS ليفوز في Cascade على كل الطبقات السابقة.
import './styles/yamshat-fixes-v88.23-GROUP-WIZARD-NOTIF-SCROLL.css';

// ✅ v88.30 — الإصلاح النهائي الحاسم لصفحة إعدادات إشعارات المجموعة
// (GroupNotificationSettings.jsx). v88.23 لم يكفِ لأن البنية أعمق
// (بطاقات متعددة + شبكة grid + switches) وطبقات legacy كانت تُلغي
// pan-y على بعض الأبناء. هذا الملف يطبّق بصمة .yam-home-mobile-page
// (v59.13.28) + .settings-wrap (v87.17) بشكل حاسم وأخير على
// .yamg-page مع padding-bottom أوسع (180-260px حسب طول الشاشة)
// ليظهر آخر عنصر (كتم الإشارات) فوق BottomNav.
// ⚠️ يجب أن يبقى آخر CSS import ليفوز في cascade.
import './styles/yamshat-fixes-v88.30-GROUP-NOTIF-SCROLL-FINAL.css';

// ✅ v88.31 — إصلاحان حاسمان في الدردشة الفردية:
//   (1) إعادة إظهار زر النقاط الثلاث ⋮ الذي اختفى بعد v88.22
//       (بسبب قواعد legacy تخفي :nth-of-type(3) وكانت تستهدف
//       زر البحث سابقاً — الآن هي تستهدف زر ⋮ الجديد).
//   (2) منع خروج فقاعة الرسائل الصوتية (.yam-voice-pill) عن
//       حدود الشاشة من الجانب الأيسر — يبرز رأس زر التشغيل
//       والفقاعة تتجاوز الحاوية.
// ⚠️ يبقى هذا هو استيراد الدردشة — لكن v88.33 (السوق) سيأتي بعده.
import './styles/yamshat-fixes-v88.31-CHAT-HEADER-DOTS-VOICE-OVERFLOW.css';

// ✅ v88.33 — SHOP MARKETPLACE SCROLL — FINAL ROOT FIX
//   شكوى المستخدم: صفحات التسوق (بطاقات المنتجات + نافذة "إرسال طلب"
//   + نافذة "إضافة إعلان") لا يعمل فيها السحب للأعلى والأسفل.
//   يطبّق نفس نمط الإصلاح المُثبت في v81 (Profile) و v87.17/v87.18
//   (Settings) على .shop-page + .yam-shop-page + .ml-panel / .ml-body.
import './styles/yamshat-fixes-v88.33-SHOP-SCROLL-FINAL.css';

// ✅ v88.37 — GROUP NOTIFICATION SETTINGS SCROLL — ROOT FIX
//   شكوى المستخدم: صفحة إعدادات إشعارات المجموعة تظهر غير قابلة
//   للسحب للأعلى والأسفل — إصلاح جذري مطابق لبصمة v81/v87.17/v88.30.
//   يأتي بعد v88.33 ليفوز في cascade على قواعد .page-content الأعمّ.
import './styles/yamshat-fixes-v88.37-GROUP-NOTIF-SCROLL-ROOT.css';

// ✅ v88.38 — EDIT PROFILE MODAL — ROOT FIX
//   شكوى المستخدم: زر التعديل لا يفتح محرر بيانات الحساب ويفتح الثيم.
//   يضمن تفوّق EditProfileModal على أي مودال ثيم عالق (z-index + visibility).
// ⚠️ يجب أن يبقى هذا آخر CSS import — يفوز في cascade على كل ما قبله.
import './styles/yamshat-fixes-v88.38-EDIT-PROFILE-ROOT.css';

// v88.42 PROFILE MEDIA ROOT FIX:
//  - يستعيد بست تعديل الأفاتار والغلاف (مودال بمعاينة + اختيار + حفظ).
//  - يستثني مودالات cover-editor/avatar-editor من قاعدة الإخفاء في v88.38.
//  - يضمن استجابة أزرار 'تعديل الغلاف' و '📷' على الموبايل و iOS.
import './styles/yamshat-fixes-v88.42-PROFILE-MEDIA.css';

// v88.91 FEED REELS PAIR (Grid):
//  - بطاقة زوج ريلز بنمط YouTube Shorts داخل الفيد.
//  - تُدرج بعد كل 5 منشورات في FeedMobile و FeedEnhanced.
//  - تدعم الجوال واللابتوب (عمودان دائماً).
import './styles/yamshat-fixes-v88.91-FEED-REELS-PAIR.css';

import { initializeViewportTracker } from './hooks/useViewportHeight.js';
import { applyFontSize, getStoredFontSize } from './components/settings/FontSizeSettings.jsx';
import { pwaInitializer } from './services/pwaInitializer.js';
import { smoothTouchLayer } from './services/smoothTouchLayer.js';
import { legacyDeviceOptimizer } from './services/legacyDeviceOptimizer.js';
import { instantTouchFeedback } from './services/instantTouchFeedback.js';
import { pawTouchEnhancer } from './services/pawTouchEnhancer.js';

const BUILD_ID = 'yamshat-v89.20-SHARE-TARGET-UPDATE-LOOP-FIX';
const BUILD_STORAGE_KEY = 'yamshat_build_id';
const LAST_RESET_KEY = 'yamshat_build_reset_ts';
const BUILD_CURRENT_TAG = 'v89.20';

// ✅ v89.01: أداة موحّدة تحدّد ما إذا كنّا حالياً داخل مسار /share-target.
//    نستخدمها لمنع أي reload/skipWaiting أثناء استقبال المشاركة الخارجية،
//    وهو ما كان يُنتج حلقة reload لا نهائية وصفحة بيضاء.
function isInShareTargetFlow() {
  try {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname || '';
    const hash = window.location.hash || '';
    return path === '/share-target'
      || path.startsWith('/share-target/')
      || hash.startsWith('#/share-target')
      || hash.includes('/share-target');
  } catch (_) {
    return false;
  }
}

// ✅ v88.95 ROOT FIX #4: نقطة إصلاح نظام المشاركات الرابعة والأخيرة.
//    قبل v88.95: hardResetIfBuildChanged كانت تحذف caches وترسل SKIP_WAITING
//    فقط، بدون إبطال queryClient وبدون مسح مفاتيح persister/IndexedDB.
//    النتيجة: بعد رفع نسخة جديدة، React Query يعرض بيانات قديمة تُغذّى
//    من stores/IndexedDB/localStorage قبل أن يصل أي SW جديد.
//
//    الإصلاحات في هذه النسخة:
//    (1) BUILD_ID يتقدّم فعلياً إلى v88.95 (v88.94 كان لا يزال يحمل v88.93).
//    (2) إبطال queryClient كاملاً (removeQueries + invalidate) لكل مفاتيح
//        البيانات الحيّة قبل انطلاق التطبيق.
//    (3) مسح مفاتيح localStorage الخاصة بالكاش (Query persister-like keys)
//        وحذف قواعد IndexedDB القديمة للفيد/الريلز/الستوريز/الشات.
//    (4) إزالة الاستثناء الحرفي القديم من فلتر caches (كان يعفي v88.93 دوماً).
//    (5) safety-net بعد mount: إبطال إجباري إن كان SW موجوداً مسبقاً
//        (لأن controllerchange لن يُطلق أبداً في هذه الحالة).
//
//    نحرس أنفسنا من update-loop عبر LAST_RESET_KEY: لا نُعيد التصفير أكثر
//    من مرة كل 30 ثانية (يمنع تكرار reload على أجهزة أندرويد الضعيفة).

// v88.95: مفاتيح الاستعلامات الحيّة — تُستخدم في hardReset وفي مستمع SW معاً
const LIVE_QUERY_KEYS = [
  'feed-data',
  'feed',
  'posts',
  'reels-feed',
  'reels',
  'stories',
  'notifications',
  'topbar-notifications-count',
];

// v88.95: مفاتيح localStorage التي قد تحوي كاش قديم لـ React Query أو stores
//         مرتبطة بالبيانات الحيّة (تُمسح عند تبدّل BUILD_ID فقط، ليس عند كل تشغيل).
const STALE_LOCALSTORAGE_PREFIXES = [
  'REACT_QUERY_OFFLINE_CACHE',
  'tanstack-query',
  'yamshat_query_',
  'yamshat_feed_cache',
  'yamshat_reels_cache',
  'yamshat_stories_cache',
  'yamshat_notifications_cache',
];

// v88.95: قواعد بيانات IndexedDB القديمة/الفانية التي قد تُغذّي setQueryData بكاش قديم.
//   ⚠️ لا نمس القواعد الحرجة الحيّة:
//      • 'yamshat-pwa-db'          → payloads share-target قيد الانتظار
//      • 'yamshat-offline'         → offline queue للطلبات المؤجلة
//      • 'yamshat-offline-session' → كاش الجلسات لتصفح بلا نت (v88.76)
//      • 'yamshat-background-sync-db' → sync خلفي
//      • 'yamshat_reels_v88_41'    → آخر 10 ريلز مُشاهدة (تجربة تشغيل فوري)
//   نُنظّف فقط الأسماء التاريخية القديمة التي قد تكون بقيت من نسخ سابقة كـ persister-like.
const STALE_INDEXEDDB_NAMES = [
  'yamshat-feed-cache',
  'yamshat-reels-cache',
  'yamshat-stories-cache',
  'yamshat-notifications-cache',
  'yamshat-query-cache',
  'yamshat_query_cache',
  'yamshat_feed_cache',
  'REACT_QUERY_OFFLINE_CACHE',
  'tanstack-query',
];

function purgeStaleLocalStorageKeys() {
  try {
    if (typeof localStorage === 'undefined') return;
    const toRemove = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key) continue;
      // لا نمس مفتاحَي BUILD نفسيهما، ولا مفاتيح الجلسة/التفضيلات الحرجة
      if (key === BUILD_STORAGE_KEY || key === LAST_RESET_KEY) continue;
      if (STALE_LOCALSTORAGE_PREFIXES.some((p) => key.startsWith(p))) {
        toRemove.push(key);
      }
    }
    toRemove.forEach((k) => {
      try { localStorage.removeItem(k); } catch (_) { /* ignore */ }
    });
    if (toRemove.length) {
      console.log('[Yamshat] Purged', toRemove.length, 'stale localStorage keys');
    }
  } catch (err) {
    console.warn('[Yamshat] localStorage purge failed:', err);
  }
}

async function purgeStaleIndexedDBs() {
  try {
    if (typeof indexedDB === 'undefined') return;
    await Promise.all(
      STALE_INDEXEDDB_NAMES.map((name) => new Promise((resolve) => {
        try {
          const req = indexedDB.deleteDatabase(name);
          req.onsuccess = () => resolve(true);
          req.onerror = () => resolve(false);
          req.onblocked = () => resolve(false);
          // safety timeout — بعض المتصفحات لا تُطلق onsuccess إذا كان الاتصال محجوباً
          setTimeout(() => resolve(false), 1500);
        } catch (_) {
          resolve(false);
        }
      }))
    );
    console.log('[Yamshat] Stale IndexedDB caches deletion attempted');
  } catch (err) {
    console.warn('[Yamshat] IndexedDB purge failed:', err);
  }
}

function invalidateLiveQueriesHard(reason) {
  try {
    LIVE_QUERY_KEYS.forEach((key) => {
      try { queryClient.removeQueries({ queryKey: [key] }); } catch (_) { /* ignore */ }
      try {
        queryClient.invalidateQueries({ queryKey: [key], refetchType: 'all' });
      } catch (_) { /* ignore */ }
    });
    // إعادة الجلب الفوري لأهم استعلام (الفيد) بمجرد تركيبه
    try { queryClient.resetQueries({ queryKey: ['feed-data'] }); } catch (_) { /* ignore */ }

    // ✅ v88.95 ROOT FIX #3: مسح Map الكاش الداخلي في axios.
    //   getChatThreads / getPresence / getBlockStatus تستعمل cache: true عبر
    //   Map في axios.js. عند رفع BUILD_ID (تحديث الواجهة) يبقى الـ Map يحمل
    //   نتائج فارغة (chat_threads / users) من نافذة الحياة السابقة، فتظل
    //   قائمة المحادثات وأسماء الأشخاص لا تظهر رغم أن الباكاند يعيد بيانات.
    //   نُطلق حدثاً مخصّصاً + استدعاءً مباشراً كي يُمسح فوراً.
    try {
      if (typeof window !== 'undefined') {
        if (typeof window.__yamshatClearAxiosCache === 'function') {
          window.__yamshatClearAxiosCache();
        }
        window.dispatchEvent(new CustomEvent('yamshat:hard-reset', { detail: { reason } }));
      }
    } catch (_) { /* ignore */ }

    console.log('[Yamshat] queryClient invalidated hard:', reason);
  } catch (err) {
    console.warn('[Yamshat] queryClient invalidation failed:', err);
  }
}
async function hardResetIfBuildChanged() {
  if (typeof window === 'undefined') return false;

  let previousBuild = null;
  try {
    previousBuild = localStorage.getItem(BUILD_STORAGE_KEY);
  } catch { /* storage unavailable */ }

  // لا يوجد تغيير → لا شيء نفعله.
  if (previousBuild === BUILD_ID) return false;

  // حماية من الحلقة: نتحقّق من آخر reset
  let lastResetTs = 0;
  try {
    lastResetTs = Number(localStorage.getItem(LAST_RESET_KEY) || 0);
  } catch { /* ignore */ }
  const now = Date.now();
  const withinCooldown = lastResetTs && (now - lastResetTs) < 30_000; // 30s

  try {
    localStorage.setItem(BUILD_STORAGE_KEY, BUILD_ID);
    localStorage.setItem(LAST_RESET_KEY, String(now));
  } catch { /* ignore */ }

  if (withinCooldown) {
    console.warn('[Yamshat] Build changed but within reset cooldown — skipping hard reset');
    return false;
  }

  // 🔥 (a) حذف كل الكاشات القديمة التي لا تحمل BUILD_ID الحالي
  //     v88.95: أُزيل الاستثناء الحرفي لـ v88.93 (كان يمنع تنظيفه عند الترقية).
  try {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => !k.includes(BUILD_CURRENT_TAG) && !k.includes(BUILD_ID))
          .map((k) => caches.delete(k).catch(() => null))
      );
      console.log('[Yamshat] Old caches purged after build change');
    }
  } catch (err) {
    console.warn('[Yamshat] Cache purge failed:', err);
  }

  // 🔥 (b) v88.95 ROOT FIX #4: إبطال queryClient قبل انطلاق التطبيق
  //        حتى لا يعرض React Query أي بيانات قديمة مُهيّأة من stores/persister.
  invalidateLiveQueriesHard('hardResetIfBuildChanged');

  // 🔥 (c) v88.95: مسح مفاتيح localStorage التي تخصّ كاش React Query/الفيد/الريلز
  purgeStaleLocalStorageKeys();

  // 🔥 (d) v88.95: حذف قواعد IndexedDB القديمة التي تُغذّي setQueryData بكاش قديم
  //        (لا تنتظر — نتركها تعمل بالتوازي حتى لا نؤخّر إقلاع التطبيق)
  purgeStaleIndexedDBs();

  // 🔥 (e) طلب SKIP_WAITING من كل SW registrations كي يتم استبدال SW القديم فوراً
  //
  // ✅ v89.01 ROOT FIX #1: أثناء مسار /share-target لا نرسل SKIP_WAITING إطلاقاً.
  //    إرسال SKIP_WAITING إلى SW يُطلق controllerchange في نفس اللحظة التي
  //    يعالج فيها SW طلب POST القادم من يوتيوب → SW يفوّت الطلب →
  //    nginx يُعيد index.html → HashRouter بلا hash → صفحة بيضاء / حلقة reload.
  //    السلوك الآمن: نتخطى تحديث SW في هذه اللحظة، وسيُطبَّق التحديث لاحقاً عبر
  //    updatefound → <AppUpdatePrompt />. خارج مسار /share-target: نُبقي السلوك كما هو.
  try {
    if ('serviceWorker' in navigator) {
      if (isInShareTargetFlow()) {
        console.log('[Yamshat] SKIP_WAITING suppressed — currently inside /share-target flow');
      } else {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          try {
            if (reg.waiting) {
              reg.waiting.postMessage({ type: 'SKIP_WAITING' });
            }
            // ⚠️ v89.01: أزلنا postMessage({SKIP_WAITING}) إلى reg.active —
            //    لا يفعل شيئاً بروتوكولياً إلا الإخلال بالتوقيت، وكان يُسهم في
            //    إطلاق controllerchange دائماً عند تبدّل BUILD_ID.
            await reg.update().catch(() => null);
          } catch { /* ignore individual reg */ }
        }
      }
    }
  } catch (err) {
    console.warn('[Yamshat] SW skipWaiting failed:', err);
  }

  return false;
}

// ✅ v89.02 ROOT FIX #3: انتظار SW قبل التوجيه من /share-target إلى /#/share-target
//   السبب الجذري:
//     قبل الإصلاح كنا نستدعي normalizeStandaloneDeepLink() بشكل متزامن قبل أي
//     تسجيل لـ Service Worker → عند وصول POST من يوتيوب إلى /share-target عبر
//     nginx fallback، كنا نعيد التوجيه فوراً إلى /#/share-target?shared=0&via=direct
//     قبل أن يحصل SW على فرصة معالجة الطلب وحفظ الحمولة في IndexedDB.
//     النتيجة: ShareTargetLanding يقرأ null → صفحة فارغة.
//
//   الحل:
//     - لأي مسار غير /share-target: نُطبّق نفس المنطق فوراً (لا تغيير).
//     - لمسار /share-target تحديداً:
//         1) لا نعيد التوجيه فوراً.
//         2) ننتظر navigator.serviceWorker.ready (بمهلة قصوى 3s) مع polling
//            لتحكم SW في العميل (navigator.serviceWorker.controller).
//         3) إذا سيطر SW خلال المهلة → نعتبر أن الحمولة قد حُفظت في IndexedDB
//            بواسطة handleShareTarget، فنوجّه مع via=sw&shared=1.
//         4) إذا انتهت المهلة → نتابع بالتوجيه القديم via=direct&shared=0
//            كـ fallback (بدل الوقوف على صفحة بيضاء).
//     - في جميع الحالات: التوجيه يستخدم replace ولا يحدث reload.
function normalizeStandaloneDeepLink() {
  if (typeof window === 'undefined') return;
  const { pathname, search, hash } = window.location;

  // ✅ v89.04 ROOT FIX #4: fallback كامل لأي فشل في ServiceWorker API
  //   السبب الجذري (المشكلة #4):
  //     في v89.02 كنّا نستدعي navigator.serviceWorker.ready ونعتمد على أنّه
  //     سيتحلّ خلال 3s. لكن هناك حالات فشل صامتة:
  //       (a) SW API موجود لكنّه معطّل (وضع خفي / متصفح قديم / policy)
  //       (b) navigator.serviceWorker.ready لا يُرجع أبداً (Promise معلّق)
  //       (c) الاستدعاء نفسه يرمي (mobile FF قديم على أندرويد قديم)
  //     كان window.location.replace بمعامل search الفارغ يُبقيه فارغاً بلا
  //     أي توجيه إن حصلت أي إثر أعلاه → صفحة بيضاء.
  //
  //   الحل الجذري متعدد الطبقات:
  //     1) safeRedirect() — أي فشل داخلي في replace يستخدم href كـ fallback.
  //     2) try/catch حول كل استدعاء SW مع سقوط فوري إلى direct.
  //     3) مؤقّت طوارئ خارجي 5s يضمن أن التوجيه يحدث حتى لو تعلّق كل شيء.
  //     4) params دائماً غير فارغة (shared+via+ts) → hash router يقرأها بدقة.
  //     5) safeRedirect يتحقق من window.location قبل الاستدعاء ويستخدم
  //        window.location.href كـ ultimate fallback.
  if (pathname === '/share-target') {
    // ✅ v89.19 ROOT FIX #1 + #2: توجيه متزامن فوري — لا انتظار لـ Service Worker
    //   السبب الجذري السابق:
    //     normalizeStandaloneDeepLink كان ينتظر navigator.serviceWorker.ready
    //     (حتى 3s مؤقّت داخلي + 5s مؤقّت خارجي) قبل التوجيه. خلال هذه المدة
    //     تكون الصفحة تعرض ما يراه HashRouter على المسار "/" (الصفحة الرئيسية
    //     الفارغة بدون تسجيل دخول = شاشة بيضاء). ثم يُوجِّه إلى /#/share-target
    //     لكن ShareTargetLanding يقرأ null لأن SW لم يحفظ الحمولة بعد.
    //
    //   الحل الجذري:
    //     1) توجيه متزامن فوري باستخدام history.replaceState (بدون إعادة تحميل).
    //     2) لا ننتظر SW إطلاقاً — ShareTargetLanding يستطيع polling الحمولة
    //        من IndexedDB / Cache Storage / in-memory stash بمجرد وصوله.
    //     3) إذا فشل replaceState → fallback إلى location.replace (مع إعادة تحميل).
    //     4) إذا فشل ذلك أيضاً → تعيين hash مباشرة.
    const stParams = new URLSearchParams(search || '');
    let stVia = 'direct';
    let stShared = '0';
    try {
      if (navigator?.serviceWorker?.controller) {
        stVia = 'sw';
        stShared = '1';
      }
    } catch (_) { /* keep direct */ }
    stParams.set('via', stVia);
    stParams.set('shared', stShared);
    stParams.set('ts', String(Date.now()));
    const stHash = '#/share-target?' + stParams.toString();
    const stTarget = '/' + stHash;

    // (1) الأفضل: history.replaceState — يغيّر URL بدون إعادة تحميل الصفحة
    //     HashRouter سيقرأ hash الجديد عند تهيئته ويُعرض ShareTargetLanding فوراً.
    try {
      window.history.replaceState(null, '', stTarget);
      // إطلاق حدث hashchange حتى HashRouter يلتقط التغيير إن كان قد تهيّأ بالفعل
      try { window.dispatchEvent(new HashChangeEvent('hashchange')); } catch (_) {
        try { window.dispatchEvent(new Event('hashchange')); } catch (__) { /* ignore */ }
      }
      return;
    } catch (_) { /* fallthrough */ }

    // (2) fallback: location.replace (قد يُسبب إعادة تحميل — لكنه مضمون)
    try { window.location.replace(stTarget); return; } catch (_) { /* fallthrough */ }

    // (3) fallback: location.href
    try { window.location.href = stTarget; return; } catch (_) { /* fallthrough */ }

    // (4) آخر ملاذ: تعيين hash فقط (يُبقي pathname = /share-target لكن hash = #/share-target)
    //     HashRouter قد لا يلتقطه لأن pathname ليس "/"، لكن نحاول.
    try { window.location.hash = stHash; } catch (_) { /* give up gracefully */ }
    return;
  }

   if (hash && hash.startsWith('#/')) return;
  if (pathname === '/' || pathname === '/index.html') return;
  const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  try {
    window.location.replace(`/#${normalizedPath}${search}${hash || ''}`);
  } catch (_) {
    try { window.location.href = `/#${normalizedPath}${search}${hash || ''}`; } catch (__) { /* ignore */ }
  }
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

  // ✅ v89.01 ROOT FIX #1 (السبب الرئيسي للصفحة البيضاء):
  //   الاستماع لـ controllerchange + window.location.reload() هنا + مستمع مماثل
  //   داخل pwaInitializer = تعارض مزدوج. عند وصول POST من يوتيوب إلى
  //   /share-target يُفعّل SW جديد → controllerchange → reload → SW يفوّت
  //   الطلب في الشوط الثاني → nginx fallback يُعيد index.html بدون hash →
  //   HashRouter يقرأ '/share-target' بدون hash → صفحة بيضاء وحلقة reload لا نهائية.
  //
  //   الحل: نُلغي reload تماماً من هذا المستمع. تحديث SW يفعلياً عبر updatefound →
  //   <AppUpdatePrompt /> بضغطة المستخدم. لم نعد بحاجة لأي reload تلقائي هنا.
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('[Yamshat] controllerchange observed (no reload — handled by <AppUpdatePrompt />)');
  });

  return registration;
}

// ✅ v89.09 ROOT FIX #4: قاتل Service Workers القديمة (kill-switch)
//   السبب الجذري:
//     الأجهزة التي كانت تحمل sw-pwa-enhanced.js أو sw-enhanced.js (SW قديم بلا
//     معالج /share-target) تبقى تستخدمه إلى الأبد حتى بعد رفع نسخة تحتوي
//     على sw.js الصحيح — لأن المتصفح لا يتحقق تلقائياً من ملف SW مختلف.
//     النتيجة: كل POST من يوتيوب/تويتر/إنستجرام يفوّت المعالج ويصل إلى
//     nginx فقط → صفحة فارغة أو شاشة تحميل لا نهائية.
//   الحل:
//     نفحص كل registrations الحالية ونُلغي تسجيل أي واحدة scriptURL منها
//     يشير إلى ملفات SW القديمة. sw.js الجديد سيتسجّل بعدها بشكل نظيف.
async function killLegacyServiceWorkers() {
  try {
    if (!('serviceWorker' in navigator)) return;
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const reg of registrations) {
      try {
        const scriptURL = reg?.active?.scriptURL
          || reg?.waiting?.scriptURL
          || reg?.installing?.scriptURL
          || '';
        // نُلغي أي SW لا يتطابق مع /sw.js الحديث
        const isLegacy = /\/sw-pwa-enhanced\.js(\?|$)/i.test(scriptURL)
          || /\/sw-enhanced\.js(\?|$)/i.test(scriptURL);
        if (isLegacy) {
          console.warn('[Yamshat v89.09] Unregistering legacy SW:', scriptURL);
          await reg.unregister().catch(() => null);
        }
      } catch (_) { /* ignore individual */ }
    }
  } catch (err) {
    console.warn('[Yamshat v89.09] killLegacyServiceWorkers failed (non-fatal):', err?.message);
  }
}

if (typeof window !== 'undefined') {
  // ✅ v89.15 ROOT FIX #1 (المشكلة #4): stashInMemoryPayload عالمي فوراً — قبل أي شيء.
  //   السبب الجذري:
  //     في v89.14 كان postMessage YAMSHAT_SHARE_PAYLOAD_FALLBACK يصل إلى نافذة
  //     ShareTargetLanding قبل أن يُركّب المستمع (عند فتح النافذة لأول مرة).
  //     النتيجة: نفقد payload بالكامل → شاشة بيضاء بدون بيانات.
  //   الحل:
  //     نُركّب مستمع message على navigator.serviceWorker فوراً — قبل أي تحميل
  //     لـ React أو تسجيل SW — ونخزّن أي payload وارد في:
  //       (a) window.__YAMSHAT_STASHED_SHARE_PAYLOAD__  — للـ landing يقرأها مباشرة.
  //       (b) localStorage.yamshat.shareFallback         — للصمود عبر reload.
  //     ShareTargetLanding يفحص هذين المصدرين أولاً قبل IDB.
  try {
    if (!window.__YAMSHAT_SHARE_STASH_INSTALLED__) {
      window.__YAMSHAT_SHARE_STASH_INSTALLED__ = true;
      window.__YAMSHAT_STASHED_SHARE_PAYLOAD__ = null;
      const stashInMemoryPayload = (payload) => {
        try {
          if (!payload || typeof payload !== 'object') return;
          window.__YAMSHAT_STASHED_SHARE_PAYLOAD__ = payload;
          try { localStorage.setItem('yamshat.shareFallback', JSON.stringify(payload)); } catch (_) { /* ignore */ }
          // إشارة داخلية لأي مستمع لاحق يريد أن يعرف بوصول الحمولة
          try {
            window.dispatchEvent(new CustomEvent('yamshat:share-payload-stashed', { detail: payload }));
          } catch (_) { /* ignore */ }
        } catch (_) { /* ignore */ }
      };
      window.__YAMSHAT_STASH_SHARE_PAYLOAD__ = stashInMemoryPayload;
      // نُركّب المستمع فوراً — يبقى حيّاً طوال عمر النافذة
      try {
        if (navigator && navigator.serviceWorker) {
          navigator.serviceWorker.addEventListener('message', (event) => {
            try {
              const t = event?.data?.type;
              if (t === 'YAMSHAT_SHARE_PAYLOAD_FALLBACK') {
                stashInMemoryPayload(event.data.payload || null);
              } else if (t === 'YAMSHAT_SHARE_RECEIVED') {
                // إشارة "وصلت الحمولة إلى IDB" — نبقيها للـ landing
                try {
                  window.dispatchEvent(new CustomEvent('yamshat:share-received', { detail: event.data || {} }));
                } catch (_) { /* ignore */ }
              }
            } catch (_) { /* ignore */ }
          });
        }
      } catch (_) { /* ignore */ }
    }
  } catch (_) { /* ignore */ }

  // ✅ v89.10 ROOT FIX #5: killLegacyServiceWorkers قبل normalizeStandaloneDeepLink.
  //   السبب الجذري:
  //     في v89.09 كنّا نستدعي normalizeStandaloneDeepLink() أولاً وهي تفحص
  //     navigator.serviceWorker.controller. إذا كان SW القديم (sw-pwa-enhanced)
  //     ما زال مسيطراً → alreadyControlled=true → التوجيه فوري إلى via=sw&shared=1
  //     مع أن SW القديم لا يحفظ payload → ShareTargetLanding يقرأ null → شاشة بيضاء.
  //   الحل: نقتل SW القديم أوّلاً (بشكل غير حاجب — تنظيف لاحق) ثم نُطبِّق التوجيه.
  //   في الطلبات القادمة، pwaInitializer سيُسجِّل /sw.js الحديث.
  killLegacyServiceWorkers();
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

  // ✅ v89.01 ROOT FIX #2 (pwaInitializer.init() كان مؤجّلاً داخل requestIdleCallback):
  //   قبل هذا الإصلاح كنّا نؤجّل init() داخل requestIdleCallback (أو setTimeout 1000ms).
  //   نتيجةً لذلك، عندما يرسل يوتيوب/إنستغرام POST إلى /share-target في أول مشاركة،
  //   لم يكن SW مُسجَّلاً بعد → handleShareTarget لا يُستدعى أبداً → nginx fallback
  //   يُعيد index.html → HashRouter يقرأ /share-target بدون hash → SPA بيضاء.
  //
  //   الحل: نفصل تسجيل Service Worker (يجب أن يحدث فوراً وبشكل متزامن مع بقية التمهيد)
  //   عن باقي تحسينات اللمس/الأجهزة القديمة (التي تُبقى داخل requestIdleCallback
  //   لأنها لا تعطّل استقبال المشاركة).
  //   → نستدعي pwaInitializer.init({ swPath: '/sw.js' }) فوراً هنا،
  //   قبل أي أرباح أداء مؤجّلة.
  try {
    pwaInitializer.init({ swPath: '/sw.js' }).then(() => {
      console.log('[Yamshat] PWA initialized successfully (eager — v89.01)');
    }).catch(err => {
      console.warn('[Yamshat] PWA initialization error:', err);
    });
  } catch (err) {
    console.warn('[Yamshat] Eager PWA init failed:', err);
  }

  // تفعيل تحسينات UX/اللمس بشكل مؤجل لضمان سرعة ظهور الصفحة الأولى
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

      // v89.01: pwaInitializer.init() أصبح يُستدعى فوراً أعلاه (خارج requestIdleCallback).
      // نبقي هنا على استدعاء idempotent كـ safety-net إذا فشل الاستدعاء العاجل لأي سبب.
      if (!pwaInitializer?.state?.isInitialized && !pwaInitializer?.state?.initPromise) {
        pwaInitializer.init({ swPath: '/sw.js' }).then(() => {
          console.log('[Yamshat] PWA initialized successfully (idle fallback)');
        }).catch(err => {
          console.warn('[Yamshat] PWA initialization error (idle fallback):', err);
        });
      }
    } catch (err) {
      console.warn('[Yamshat] Enhancement initialization error:', err);
    }
  };

  // تأجيل تحسينات اللمس فقط — تسجيل SW تم فعلياً قبل هذه النقطة.
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
    // ✅ v89.18 ROOT FIX #7: خزّن event في window أيضاً
    //   ليمكن لـ ShareTargetLanding قراءته حتّى إذا أطلق event قبل mount
    try { window.__YAMSHAT_DEFERRED_INSTALL_PROMPT__ = event; } catch (_) { /* ignore */ }
  });

  window.addEventListener('appinstalled', () => {
    useAppStore.getState().clearInstallPrompt();
    try { window.__YAMSHAT_DEFERRED_INSTALL_PROMPT__ = null; } catch (_) { /* ignore */ }
  });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      const resetTriggeredReload = await hardResetIfBuildChanged();
      if (resetTriggeredReload) return;
      
      // ملاحظة: pwaInitializer.init() يتولى الآن تسجيل sw.js بشكل موحد
      // لضمان عدم وجود تعارضات وسرعة في التحميل
      console.log('[Yamshat] Service Worker registration deferred to PWA Initializer');

      // ✅ v88.76 Offline PWA — تفعيل جسر كاش الجلسات
      // يراقب تغيرات HashRouter ويسجّل كل صفحة مُتصفّحة في IndexedDB
      // ينبّه في أول تشغيل standalone بأن التصفح بلا نت مفعّل
      try {
        const mod = await import('./offline/offlineSessionCache.js');
        const offlineCache = mod.default || mod;

        const recordCurrentPage = () => {
          try {
            const hash = window.location.hash || '#/';
            const path = hash.replace(/^#/, '') || '/';
            offlineCache.markPageVisited(path, { title: document.title, hash });
          } catch (_) { /* ignore */ }
        };

        // تسجيل أولي للمسار الحالي + مراقبة التنقل (HashRouter)
        recordCurrentPage();
        window.addEventListener('hashchange', recordCurrentPage);
        window.addEventListener('popstate', recordCurrentPage);

        // إشعار أول تشغيل في وضع PWA standalone
        if (offlineCache.isStandalonePWA()) {
          const NOTIFIED_KEY = 'yamshat:offline-pwa-notified-v88.76';
          if (!localStorage.getItem(NOTIFIED_KEY)) {
            try {
              window.dispatchEvent(new CustomEvent('yamshat:toast', {
                detail: {
                  type: 'success',
                  title: 'تم تفعيل التصفح بلا إنترنت ✓',
                  description: 'أخر الستوريات، الدردشات، والملفات ستظل متاحة حتى مع انقطاع النت.',
                },
              }));
            } catch (_) { /* ignore */ }
            localStorage.setItem(NOTIFIED_KEY, String(Date.now()));
          }
          console.log('[Offline-PWA] session cache active (standalone mode detected)');
        } else {
          console.log('[Offline-PWA] session cache active (browser mode)');
        }
      } catch (err) {
        console.warn('[Offline-PWA] session cache init failed:', err);
      }
    });
  }
}

// 🔄 إتاحة queryClient عالمياً لاستخدامه في ميزة "اسحب للتحديث" من الـ Layouts
if (typeof window !== 'undefined') {
  window.__yamshatQueryClient = queryClient;
}

// ✅ v88.94 ROOT FIX #2: مستمع موحّد يُبطل استعلامات البيانات الحيّة
//   عند تفعيل SW جديد (yamshat:sw-activated من public/sw.js:291)
//   أو عند أول سيطرة SW على الصفحة (yamshat:sw-controlling من controllerchange).
//
//   السبب الجذري:
//   - قبل تفعيل SW: طلبات /api/feed و /api/posts و /api/reels/feed و /api/stories
//     و /api/notifications تمر مباشرة عبر fetch عادي (بدون SW controller)،
//     فلا يُطبَّق عليها منطق NEVER_CACHE_API_PATTERNS الموجود في sw.js.
//   - النتيجة: قد يعرض المستخدم فيداً قديماً أو فارغاً في أول تحميل بعد PWA install/update.
//   - بعد تفعيل SW: نُبطل هذه الاستعلامات فوراً → React Query يُعيد الجلب،
//     وهذه المرة يمر الطلب عبر SW → NEVER_CACHE_API_PATTERNS يمنع أي كاش قديم →
//     يصل الفيد الحيّ الصحيح من الخادم.
if (typeof window !== 'undefined') {
  let __swRefreshInFlight = false;
  const refreshLiveQueriesForSW = (reason) => {
    if (__swRefreshInFlight) return;
    __swRefreshInFlight = true;
    try {
      console.log('[Yamshat] SW live-refresh triggered by:', reason);
      LIVE_QUERY_KEYS.forEach((key) => {
        try {
          queryClient.invalidateQueries({ queryKey: [key], refetchType: 'active' });
        } catch (_) { /* ignore */ }
      });
      // إجبار إعادة الجلب الفوري لأهم الاستعلامات الحيّة (حتى لو كانت غير active حالياً)
      try {
        queryClient.refetchQueries({ queryKey: ['feed-data'], type: 'active' });
      } catch (_) { /* ignore */ }
    } finally {
      // نافذة صغيرة لمنع الاستدعاء المزدوج (activated + controllerchange قد يصلان معاً)
      setTimeout(() => { __swRefreshInFlight = false; }, 1500);
    }
  };

  window.addEventListener('yamshat:sw-activated', (ev) => {
    refreshLiveQueriesForSW(`sw-activated ${ev?.detail?.version || ''}`.trim());
  });
  window.addEventListener('yamshat:sw-controlling', () => {
    refreshLiveQueriesForSW('sw-controlling');
  });

  // ✅ v88.95 ROOT FIX #4 (safety-net):
  //    إذا كان SW موجوداً ومسيطراً بالفعل عند تحميل الصفحة (حالة إعادة
  //    التحميل الشائعة)، فإن controllerchange لن يُطلق أبداً → مستمع
  //    yamshat:sw-controlling لن يعمل → بدون هذه الشبكة سيبقى React Query
  //    محتفظاً بأي بيانات قديمة رتّبها التطبيق داخلياً.
  //    نُبطل هنا مرة واحدة بعد ~800ms من التحميل، ضمن حارس مضاد للتكرار.
  window.addEventListener('load', () => {
    setTimeout(() => {
      try {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          refreshLiveQueriesForSW('post-load-safety-net (existing controller)');
        }
      } catch (_) { /* ignore */ }
    }, 800);
  });
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
