# v49 — فتح الملف الشخصي عند الضغط على اسم/أفاتار المنشور

## الملفات المعدّلة:
1. components/feed/PostCard.jsx          — desktop feed post card
2. components/feed/PostCardOptimized.jsx — optimized variant
3. components/feed/PostCardAdvanced.jsx  — advanced variant
4. components/feed/ProFeedPostCard.jsx   — Pro feed card
5. components/mobile/MobilePostCard.jsx  — already done in v48 ✅

## التغيير:
- إضافة useNavigate من react-router-dom
- دالة goToAuthorProfile تستخرج post.username (تنظيف @ والمسافات)
  وتنقل إلى /profile/:username
- جعل الأفاتار + اسم المستخدم قابلين للنقر مع:
  * role="link"
  * tabIndex=0
  * onKeyDown (Enter/Space)
  * aria-label عربي
  * cursor: pointer
- يعمل على كل صفحات ويب الجوال وويب اللابتوب لأن المسار
  /profile/:username موجود في App.jsx
