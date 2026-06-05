# دليل دمج البث المباشر مع الخلاصة (Live Feed Integration Guide)

## 📋 نظرة عامة

هذا الدليل يشرح كيفية دمج نظام البث المباشر مع الخلاصة (Feed) بحيث يتم عرض ثلاثة أنواع من المحتوى:
1. **المنشورات العادية (Posts)**
2. **الستوريات (Stories)**
3. **البثوث المباشرة (Live Streams)**

---

## 🔧 الملفات المضافة والمعدلة

### الملفات المضافة في الباك إند (Backend)

#### 1. `/backend/app/services/live_feed_service.py` ✅
**الوصف:** خدمة شاملة لإدارة البث المباشر والمنشورات المرتبطة به
**الوظائف الرئيسية:**
- `create_live_post()` - إنشاء منشور بث مباشر جديد
- `end_live_stream()` - إنهاء البث وتحويله إلى بث مسجل
- `update_stream_viewers()` - تحديث عدد المشاهدين
- `get_active_live_streams()` - جلب البثوث النشطة مع الترتيب (أصدقاء → متابعين → مقترحات)
- `get_feed_content()` - جلب محتوى الخلاصة مع التصفية حسب النوع

#### 2. `/backend/app/api/live_feed_routes.py` ✅
**الوصف:** مسارات API للبث والخلاصة
**المسارات الرئيسية:**
```
POST   /api/v1/feed/live/create              - إنشاء منشور بث مباشر
POST   /api/v1/feed/live/{stream_id}/end     - إنهاء البث
POST   /api/v1/feed/live/{stream_id}/viewers - تحديث عدد المشاهدين
GET    /api/v1/feed/live/active              - جلب البثوث النشطة
GET    /api/v1/feed/content                  - جلب محتوى الخلاصة
GET    /api/v1/feed/live/{stream_id}/stats   - جلب إحصائيات البث
POST   /api/v1/feed/live/{stream_id}/link-post - ربط البث بمنشور
```

### الملفات المعدلة في الباك إند

#### 1. `/backend/app/models/post.py` ✅
**التعديلات:**
- إضافة حقل `post_type` - نوع المنشور (POST, STORY, LIVE, RECORDED_STREAM)
- إضافة حقل `live_stream_id` - معرف البث المرتبط
- إضافة حقل `thumbnail_url` - صورة مصغرة للبث
- إضافة حقل `viewers_count` - عدد المشاهدين
- إضافة حقل `is_live` - هل البث نشط
- إضافة حقل `stream_duration` - مدة البث
- إضافة حقول `stream_started_at` و `stream_ended_at` - أوقات البث

#### 2. `/backend/app/main.py` ✅
**التعديلات:**
- استيراد `live_feed_routes`
- تسجيل `live_feed_routes.router` في التطبيق

### الملفات المضافة في الواجهة الأمامية (Frontend)

#### 1. `/frontend/src/hooks/useUnifiedFeed.js` ✅
**الوصف:** Hook للخلاصة الموحدة
**الوظائف:**
- `useUnifiedFeed()` - Hook رئيسي لإدارة الخلاصة
- `useLiveStreamManagement()` - Hook لإدارة البث المباشر
- `fetchFeedContent()` - جلب محتوى الخلاصة
- `fetchActiveLiveStreams()` - جلب البثوث النشطة
- `createLivePost()` - إنشاء منشور بث
- `endLiveStreamPost()` - إنهاء البث
- `updateStreamViewers()` - تحديث عدد المشاهدين

#### 2. الملفات المنسوخة من `MiuiFastConnect`
- ✅ `/frontend/src/pages/FeedEnhanced.jsx` - الخلاصة المحسنة
- ✅ `/frontend/src/pages/FeedMobile.jsx` - الخلاصة للجوال
- ✅ `/frontend/src/pages/LiveStudio.jsx` - صفحة التحكم بالبث
- ✅ `/frontend/src/pages/LiveStudio_Advanced.jsx` - نسخة متقدمة من التحكم
- ✅ `/frontend/src/pages/LiveViewer.jsx` - صفحة عرض البث
- ✅ `/frontend/src/layouts/MainLayout.jsx` - التخطيط الرئيسي
- ✅ `/frontend/src/layouts/MobileLayout.jsx` - التخطيط للجوال
- ✅ `/frontend/src/components/MobileTabs.jsx` - التبويبات للجوال
- ✅ `/frontend/src/components/MobilePostCard.jsx` - بطاقة المنشور للجوال
- ✅ `/frontend/src/styles/modern-live-viewer.css` - أنماط عرض البث
- ✅ `/frontend/src/api/liveStreamApi.js` - API للبث المباشر

---

## 🚀 خطوات التطبيق

### المرحلة 1: التحقق من قاعدة البيانات

```bash
# تأكد من تطبيق التعديلات على جدول posts
# يجب أن يحتوي على الحقول الجديدة:
# - post_type
# - live_stream_id
# - thumbnail_url
# - viewers_count
# - is_live
# - stream_duration
# - stream_started_at
# - stream_ended_at

# إذا لم تكن الحقول موجودة، أنشئ migration:
alembic revision --autogenerate -m "add_live_stream_fields_to_posts"
alembic upgrade head
```

### المرحلة 2: تحديث الواجهة الأمامية

#### أ. تحديث الـ Router الرئيسي

```jsx
// frontend/src/App.jsx

import FeedEnhanced from './pages/FeedEnhanced.jsx';
import LiveStudio from './pages/LiveStudio.jsx';
import LiveViewer from './pages/LiveViewer.jsx';

// إضافة المسارات:
<Route path="/feed" element={<FeedEnhanced />} />
<Route path="/live/control" element={<LiveStudio />} />
<Route path="/live/view/:streamId" element={<LiveViewer />} />
<Route path="/live/studio-advanced" element={<LiveStudio_Advanced />} />
```

#### ب. تحديث الصفحة الرئيسية

```jsx
// frontend/src/pages/Home.jsx

import FeedEnhanced from './FeedEnhanced.jsx';

export default function Home() {
  return <FeedEnhanced />;
}
```

### المرحلة 3: ربط البث بالخلاصة

#### في صفحة `LiveStudio.jsx`:

عند بدء البث، استدعِ:

```javascript
import { useLiveStreamManagement } from '../hooks/useUnifiedFeed.js';

const { startLiveStream } = useLiveStreamManagement();

const handleStartStream = async (streamId) => {
  try {
    const result = await startLiveStream({
      stream_id: streamId,
      title: newStreamData.title,
      thumbnail_url: thumbnailUrl,
      description: newStreamData.description,
    });
    
    console.log('تم إنشاء منشور البث:', result);
    // الآن سيظهر البث في الخلاصة تلقائياً
  } catch (error) {
    console.error('خطأ:', error);
  }
};
```

#### عند إنهاء البث:

```javascript
const { stopLiveStream } = useLiveStreamManagement();

const handleEndStream = async (streamId, duration) => {
  try {
    const result = await stopLiveStream(streamId, duration);
    console.log('تم إنهاء البث:', result);
    // سيتحول المنشور إلى بث مسجل تلقائياً
  } catch (error) {
    console.error('خطأ:', error);
  }
};
```

### المرحلة 4: تحديث عدد المشاهدين

```javascript
import { useLiveStreamManagement } from '../hooks/useUnifiedFeed.js';

const { updateViewers } = useLiveStreamManagement();

// في حلقة تحديث الإحصائيات:
useEffect(() => {
  const interval = setInterval(() => {
    updateViewers(streamId, currentViewerCount);
  }, 5000); // كل 5 ثوان

  return () => clearInterval(interval);
}, [streamId]);
```

### المرحلة 5: عرض الخلاصة مع التبويبات

```jsx
import { useUnifiedFeed } from '../hooks/useUnifiedFeed.js';

export default function Feed() {
  const {
    activeTab,
    switchTab,
    posts,
    liveStreams,
    isLoading,
    refreshFeed,
    loadMore,
  } = useUnifiedFeed();

  return (
    <div>
      {/* التبويبات */}
      <div className="tabs">
        <button 
          onClick={() => switchTab(null)}
          className={activeTab === null ? 'active' : ''}
        >
          المنشورات
        </button>
        <button 
          onClick={() => switchTab('stories')}
          className={activeTab === 'stories' ? 'active' : ''}
        >
          الستوريات
        </button>
        <button 
          onClick={() => switchTab('live')}
          className={activeTab === 'live' ? 'active' : ''}
        >
          البث المباشر
        </button>
      </div>

      {/* المحتوى */}
      <div className="feed-content">
        {isLoading && <div>جاري التحميل...</div>}
        
        {activeTab === 'live' ? (
          // عرض البثوث المباشرة
          liveStreams.map(stream => (
            <LiveStreamCard key={stream.id} stream={stream} />
          ))
        ) : (
          // عرض المنشورات والستوريات
          posts.map(post => (
            <PostCard key={post.id} post={post} />
          ))
        )}

        <button onClick={loadMore}>تحميل المزيد</button>
      </div>
    </div>
  );
}
```

---

## 📊 هيكل البيانات

### منشور البث المباشر (Live Post)

```json
{
  "id": 123,
  "user_id": 55,
  "username": "Ahmed",
  "content": "بث مباشر جديد",
  "post_type": "LIVE",
  "live_stream_id": "stream_55_1717592400",
  "thumbnail_url": "https://example.com/thumbnail.jpg",
  "viewers_count": 120,
  "is_live": true,
  "stream_started_at": "2026-06-05T10:00:00",
  "stream_ended_at": null,
  "created_at": "2026-06-05T10:00:00"
}
```

### منشور البث المسجل (Recorded Stream Post)

```json
{
  "id": 123,
  "user_id": 55,
  "username": "Ahmed",
  "content": "بث مباشر جديد",
  "post_type": "RECORDED_STREAM",
  "live_stream_id": "stream_55_1717592400",
  "thumbnail_url": "https://example.com/thumbnail.jpg",
  "viewers_count": 120,
  "is_live": false,
  "stream_duration": "1h 20m",
  "stream_started_at": "2026-06-05T10:00:00",
  "stream_ended_at": "2026-06-05T11:20:00",
  "created_at": "2026-06-05T10:00:00"
}
```

---

## 🔄 تدفق العمليات

### عند بدء البث:

```
1. المستخدم يملأ بيانات البث (العنوان، الوصف، إلخ)
2. ينقر على "بدء البث"
3. يتم استدعاء LiveStudio.handleCreateStream()
4. يتم إنشاء جلسة بث عبر API
5. يتم استدعاء startLiveStream() من useUnifiedFeed
6. يتم إنشاء منشور بث مباشر في الخلاصة
7. يظهر البث في تبويب "البث المباشر" للجميع
8. يتم بدء تحديث الإحصائيات (المشاهدين، التعليقات، إلخ)
```

### عند إنهاء البث:

```
1. المستخدم ينقر على "إنهاء البث"
2. يتم استدعاء endLiveStream()
3. يتم إيقاف تحديث الإحصائيات
4. يتم استدعاء stopLiveStream() من useUnifiedFeed
5. يتم تحديث منشور البث:
   - post_type: LIVE → RECORDED_STREAM
   - is_live: true → false
   - stream_ended_at: يتم تعيينه
   - stream_duration: يتم حسابها
6. يختفي البث من تبويب "البث المباشر"
7. يظهر كمنشور فيديو عادي في الخلاصة
```

---

## ✅ قائمة التحقق

### الباك إند:
- [ ] تم تطبيق التعديلات على جدول `posts`
- [ ] تم إضافة `live_feed_service.py`
- [ ] تم إضافة `live_feed_routes.py`
- [ ] تم تسجيل الـ router في `main.py`
- [ ] تم اختبار API endpoints

### الواجهة الأمامية:
- [ ] تم نسخ ملفات الواجهة من `MiuiFastConnect`
- [ ] تم إنشاء `useUnifiedFeed.js`
- [ ] تم تحديث الـ Router الرئيسي
- [ ] تم ربط `LiveStudio` مع `useUnifiedFeed`
- [ ] تم عرض التبويبات الثلاث (منشورات، ستوري، بث)
- [ ] تم اختبار الخلاصة على الجوال والويب

### الاختبار:
- [ ] اختبار إنشاء بث مباشر جديد
- [ ] التحقق من ظهور البث في الخلاصة
- [ ] اختبار تحديث عدد المشاهدين
- [ ] اختبار إنهاء البث وتحويله إلى بث مسجل
- [ ] اختبار التبديل بين التبويبات
- [ ] اختبار الترتيب (أصدقاء → متابعين → مقترحات)
- [ ] اختبار على أجهزة مختلفة (جوال، ويب، تابلت)

---

## 🐛 استكشاف الأخطاء

### المشكلة: البث لا يظهر في الخلاصة

**الحل:**
1. تحقق من أن `live_feed_routes` مسجل في `main.py`
2. تأكد من أن `createLivePost()` يتم استدعاؤها عند بدء البث
3. تحقق من السجلات (logs) للأخطاء

### المشكلة: خطأ في تحديث عدد المشاهدين

**الحل:**
1. تأكد من أن `stream_id` صحيح
2. تحقق من أن البث موجود في قاعدة البيانات
3. تحقق من صلاحيات المستخدم

### المشكلة: التبويبات لا تعمل

**الحل:**
1. تحقق من أن `useUnifiedFeed` يتم استيراده بشكل صحيح
2. تأكد من أن `switchTab()` يتم استدعاؤها بشكل صحيح
3. تحقق من أن الـ query parameters صحيحة

---

## 📚 المراجع

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [React Query Documentation](https://tanstack.com/query/latest)
- [React Router Documentation](https://reactrouter.com/)

---

## 📞 الدعم

في حالة وجود مشاكل أو استفسارات، يرجى:
1. مراجعة السجلات (logs)
2. التحقق من قائمة التحقق أعلاه
3. مراجعة قسم استكشاف الأخطاء

---

**آخر تحديث:** 2026-06-05
**الحالة:** ✅ جاهز للتطبيق
