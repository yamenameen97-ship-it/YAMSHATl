# 🎯 إصلاح عرض الوسائط في البستات على الجوال — v87.19

## الشكوى
> "بينما كنت أنشر فيديوهات وصور في صفحة ويب-منشورات على الجوال كانت
> تتم بسلاسة، الآن تعطل ذلك. عندما رفعت صورة ظهرت مكسورة وعلى الصورة
> الأخرى ظهر الحرف 'أ' فقط والفيديو لم يظهر أصلاً. أصلح هذه المشكلة."

## التشخيص — سببان جذريان مستقلان

### 1) الفيديو لم يكن يظهر إطلاقاً ❌
في `pages/FeedMobile.jsx` كانت الدالة `buildBanner(post)` تفعل الآتي:
```js
if (!resolved || isVideoMediaUrl(resolved || firstMedia, post)) return null;
```
أي: **إذا كان الوسط فيديو → أعِد `null`** → `MobilePostCard` يتجاهل
البانر ولا يعرض شيئاً. ولا يوجد فرع من الأصل يعرض `<video>` في
`components/mobile/MobilePostCard.jsx`؛ الشرط كان:
```jsx
{banner && (banner.type === 'image' || banner.type === 'logo') && (...)}
```
النتيجة: منشور به فيديو يظهر كنص فقط (رأس + التسمية + الفوتر) بدون
أي وسط مرئي.

### 2) الصورة "مكسورة" ويظهر عليها حرف "أ" ❌
البطاقة تعرض:
```jsx
<img
  src={banner.url}
  alt={(text && String(text).trim().slice(0, 140)) || `صورة منشور من ${authorName}`}
  ...
/>
```
- الـ `alt` كان يحمل **نص المنشور كاملاً**. إذا كتب المستخدم "أ"
  كنص المنشور، فعندما تفشل الصورة في التحميل يعرض المتصفح `alt="أ"`
  في مكان الصورة — يظهر حرف واحد صغير في وسط إطار أسود ضخم
  (الشكل الذي رآه المستخدم).
- عند فشل التحميل الفعلي، `onError` كان يستبدل الصورة بنص عادي فقط
  "🖼️ تعذّر تحميل الصورة" بدون خلفية أنيقة → مظهر مكسور.
- كذلك، الصورة قبل التحميل كانت تظهر خلفية سوداء صرفة بلا skeleton.

## الحل

### ملف 1: `src/pages/FeedMobile.jsx`
دالة `buildBanner()` أصبحت تدعم الفيديو صراحةً:
```js
if (isVideo) {
  const videoCandidate = String(post.media_url || post.media || firstMedia || '');
  const posterCandidate = String(post.thumbnail_url || post.preview_url || post.image_url || '');
  const resolvedVideo = resolveMediaUrl(videoCandidate);
  const resolvedPoster = resolveMediaUrl(posterCandidate);
  if (!resolvedVideo) return null;
  return { type: 'video', url: resolvedVideo, poster: resolvedPoster || '' };
}
```
الاكتشاف يعتمد على أعمدة الـ backend الموحّدة القادمة من
`api/posts.js` (`has_video`, `media_type: 'video'`, `is_reel`) بالإضافة
لفحص اللاحقة (`.mp4/.webm/.mov/.m3u8/...`).

### ملف 2: `src/components/mobile/MobilePostCard.jsx`

**أ) دعم `<video>` بالكامل:**
```jsx
{banner.type === 'video' && (
  <div className="banner-video-container">
    <video
      src={banner.url}
      poster={banner.poster || undefined}
      controls
      playsInline
      preload="metadata"
      controlsList="nodownload noremoteplayback"
      onError={/* fallback أنيق */}
    >
      متصفحك لا يدعم تشغيل الفيديو.
    </video>
  </div>
)}
```
- `controls` = أزرار تشغيل/إيقاف/صوت (المتصفح الأصلي).
- `playsInline` = لا يفتح ملء الشاشة تلقائياً على iOS.
- `preload="metadata"` = تحميل ثوانٍ فقط لجلب المدة والـ poster.
- `poster` = من `thumbnail_url` تظهر معاينة الفيديو قبل التشغيل.

**ب) الصورة — إزالة الحرف "أ":**
```jsx
<img
  src={banner.url}
  alt=""                            {/* لا نص alt يتسرّب عند الفشل */}
  loading="lazy"
  decoding="async"
  referrerPolicy="no-referrer"
  onLoad={(e) => e.currentTarget.classList.add('is-loaded')}
  onError={/* fallback SVG أنيق */}
/>
```
- `alt=""` (فارغ) — لا يظهر نص المنشور مكان الصورة عند الفشل.
- `onLoad` يُشعل انتقال fade-in ناعم (`opacity 0→1`).
- `onError` يعرض بديلاً بصرياً محترماً (أيقونة صورة رمادية + سطر
  "تعذّر تحميل الصورة").

**ج) CSS للـ fallback الجديد:**
```css
.banner-image-container img {
  opacity: 0;
  transition: opacity 220ms ease-out;
  background: linear-gradient(135deg,
    rgba(139,92,246,0.10) 0%, rgba(15,20,34,0.6) 100%);
}
.banner-image-container img.is-loaded { opacity: 1; }

.banner-video-container video {
  width: 100%; height: 100%;
  object-fit: cover; display: block; background: #000;
}

.banner-image-fallback {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 10px;
  background: linear-gradient(135deg, #1a1f33 0%, #0f1422 100%);
  color: #9CA3AF; font-size: 0.9rem;
  padding: 16px;
}
```

## النتيجة
- ✅ **الفيديو** يظهر مع مشغل أصلي، poster للمعاينة، وتحكم كامل.
- ✅ **الصورة** تعرض skeleton أنيق قبل التحميل، ثم تظهر بانتقال ناعم.
- ✅ **عند الفشل** لا يظهر أبداً نص المنشور أو حرف عشوائي مكان الصورة
  — يظهر بديل بصري أنيق (أيقونة + رسالة).
- ✅ لا تغييرات على أي ملف آخر — فقط على `FeedMobile.jsx` +
  `MobilePostCard.jsx`.

## القيود
- ✅ صفر مكتبات جديدة، صفر `node_modules`
- ✅ JSX/CSS فقط — التغيير محصور في ملفين
- ✅ متوافق مع بيانات الـ backend الحالية (`has_video`, `media_type`,
  `media_url`, `thumbnail_url`, `media_urls`)
- ✅ يعمل بغض النظر عن مزوّد الوسائط (Cloudflare R2 / S3 / Bunny CDN)

## البناء
```
BUILD_ID = 'yamshat-v87.19-POSTS-VIDEO-IMAGE-RENDER-FIX'
version  = 87.19.0
```
