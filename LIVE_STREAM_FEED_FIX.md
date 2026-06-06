# إصلاح مشكلة عدم ظهور منشور البث المباشر في صفحة المنشورات

## ملخص المشكلة
كان منشور البث المباشر لا يظهر بشكل صحيح في صفحة المنشورات على الويب والجوال. كان يظهر فقط عنوان البث كمنشور عادي، بدون صورة الغلاف أو بيانات المضيف الكاملة.

## الأسباب الجذرية المكتشفة

### 1. **عدم إرسال بيانات الغلاف من الخلفية**
- الدالة `_serialize_record` في `backend/app/api/routes/live.py` لم تكن تُرجع حقول مهمة مثل:
  - `host_avatar`: صورة المضيف الشخصية
  - `thumbnail_url`: صورة غلاف البث
  - `host_username`: اسم المضيف
  - `viewers_count`: عدد المشاهدين (كان يُرجع `viewer_count` فقط)

### 2. **عدم حفظ صورة الغلاف عند إنشاء البث**
- الدالة `create_live` في الخلفية لم تكن تحفظ `thumbnail_url` في `extra_json`
- الواجهة الأمامية كانت ترفع صورة الغلاف لكن لم تُرسلها إلى الخلفية

### 3. **عدم دمج البث المباشر في التغذية الإخبارية**
- صفحة `FeedMobile.jsx` لم تكن تجلب البث المباشر النشط وتدمجه مع المنشورات
- صفحة `FeedEnhanced.jsx` كانت تجلب البث لكن لم تكن تعرضه بشكل صحيح

## التغييرات المُجراة

### 1. **تحديث الخلفية (`backend/app/api/routes/live.py`)**

#### أ) تحديث `_serialize_record` (السطور 159-204)
```python
# إضافة جلب بيانات المضيف
host_user = db.query(User).filter(User.id == record.host_user_id).first()
host_avatar = ""
if host_user:
    try:
        profile_data = json.loads(host_user.profile_json or '{}')
        host_avatar = profile_data.get('avatar') or host_user.avatar_url
    except:
        pass

# جلب صورة الغلاف من extra_json
snapshot = _read_extra_snapshot(record)
thumbnail_url = snapshot.get('thumbnail_url') or ""

# إضافة الحقول المفقودة إلى الاستجابة
payload.update({
    'host_username': record.host_username,
    'host_avatar': host_avatar,
    'thumbnail_url': thumbnail_url,
    'started_at': _iso(record.created_at),
    'viewers_count': int(record.viewer_count or 0),  # إضافة alias
    'comments_count': len(runtime_room.comments) if hasattr(runtime_room, 'comments') else 0,
    # ... باقي الحقول
})
```

#### ب) تحديث `create_live` (السطور 266-347)
```python
# استخراج thumbnail_url من الطلب
thumbnail_url = str(payload.get('thumbnail_url') or '').strip()

# حفظ thumbnail_url في extra_json للبث الموجود
if existing:
    extra = _read_extra_snapshot(existing)
    if thumbnail_url:
        extra['thumbnail_url'] = thumbnail_url
    existing.extra_json = json.dumps(extra, ensure_ascii=False)

# حفظ thumbnail_url في extra_json للبث الجديد
record = LiveRoomSession(
    # ... باقي الحقول
    extra_json=json.dumps({'thumbnail_url': thumbnail_url}, ensure_ascii=False) if thumbnail_url else None
)
```

### 2. **تحديث الواجهة الأمامية - LiveStudio.jsx**

#### إرسال thumbnail_url عند إنشاء البث (السطر 161)
```javascript
const response = await createLiveStream({
    title: title.trim(),
    description: description.trim(),
    category,
    quality,
    isPublic: newStreamData.isPublic,
    thumbnail_url: uploadedCover,  // ✅ إضافة صورة الغلاف
});
```

### 3. **تحديث FeedEnhanced.jsx**

#### تحديث `convertLiveStreamToPost` (السطور 84-117)
```javascript
function convertLiveStreamToPost(stream) {
    if (!stream || !stream.id) return null;
    const mediaUrl = stream.thumbnail_url || '';
    return {
        // ... باقي الحقول
        media: mediaUrl ? [{ 
            type: 'image-primary', 
            kind: 'image', 
            url: resolveMediaUrl(mediaUrl) 
        }] : []
    };
}
```

### 4. **تحديث FeedMobile.jsx**

#### أ) جلب البث المباشر النشط (السطور 134-149)
```javascript
const [liveStreams, setLiveStreams] = useState([]);
useEffect(() => {
    const fetchLives = async () => {
        try {
            const { getActiveLiveStreams } = await import('../services/api/liveStreamApi.js');
            const res = await getActiveLiveStreams({ limit: 5 });
            if (res?.data) setLiveStreams(res.data);
        } catch (err) {
            console.warn('Failed to fetch live streams for mobile feed', err);
        }
    };
    fetchLives();
    const timer = setInterval(fetchLives, 30000);
    return () => clearInterval(timer);
}, []);
```

#### ب) دمج البث مع المنشورات (السطور 171-206)
```javascript
const posts = useMemo(() => {
    const normalizedPosts = (Array.isArray(rawPosts) && rawPosts.length)
        ? rawPosts.map((p, i) => normalizePost(p, i))
        : [WELCOME_POST];

    // تحويل البث المباشر إلى منشورات
    const liveAsPosts = liveStreams.map((stream) => ({
        id: `live-${stream.id}`,
        rawId: null,
        authorName: stream.host_username || 'مستخدم',
        handle: `@${stream.host_username || 'مستخدم'}`,
        timeText: 'مباشر الآن',
        verified: true,
        avatarUrl: resolveMediaUrl(stream.host_avatar || ''),
        text: stream.title || 'بث مباشر جديد',
        banner: stream.thumbnail_url ? { type: 'image', url: resolveMediaUrl(stream.thumbnail_url) } : null,
        isLive: true,
        liveStreamId: stream.id,
        liveStream: stream,
        // ... باقي الحقول
    }));

    // دمج البث في البداية
    const combined = [...liveAsPosts, ...normalizedPosts];
    return combined.map((p) => {
        const o = overlay[p.id];
        return o ? { ...p, ...o } : p;
    });
}, [rawPosts, liveStreams, overlay]);
```

#### ج) عرض MobileLiveStreamCard (السطور 446-481)
```javascript
{filtered.map((post) => {
    if (post.isLive) {
        return (
            <MobileLiveStreamCard
                key={post.id}
                post={post}
                liveStream={post.liveStream || {
                    id: post.liveStreamId,
                    host_username: post.handle.replace(/^@/, ''),
                    host_name: post.authorName,
                    title: post.text,
                    thumbnail_url: post.banner?.url || '',
                    host_avatar: post.avatarUrl || '',
                    // ... باقي البيانات
                }}
            />
        );
    }
    // ... عرض المنشورات العادية
})}
```

## النتائج المتوقعة

### على الويب (Desktop)
✅ ظهور منشور البث المباشر مع:
- صورة غلاف البث بحجم كامل
- اسم المضيف وصورته الشخصية
- عنوان البث
- عدد المشاهدين والقلوب والتعليقات
- زر مباشر ملون مع تأثير إضاءة

### على الجوال (Mobile)
✅ ظهور بطاقة البث المباشر مع:
- صورة غلاف بنسبة 16:9
- شارة "مباشر" ملونة مع نقطة متحركة
- معلومات المضيف (الاسم والصورة)
- عنوان البث
- إحصائيات البث (المشاهدون، القلوب، التعليقات)
- زر "دخول البث" بتصميم جذاب

## خطوات الاختبار

### 1. إنشاء بث جديد
```
1. انتقل إلى صفحة البث (Live Studio)
2. أدخل عنوان البث
3. اختر صورة غلاف (مهم جداً)
4. اضغط "إنشاء البث"
5. ابدأ البث
```

### 2. التحقق من الظهور
```
الويب:
- افتح صفحة المنشورات (Feed)
- يجب أن تظهر بطاقة البث في الأعلى مع الصورة

الجوال:
- افتح صفحة المنشورات على الجوال
- يجب أن تظهر بطاقة البث المباشر مع كل التفاصيل
```

### 3. التحقق من التفاعل
```
- اضغط على البطاقة للدخول إلى البث
- يجب أن تنتقل إلى صفحة مشاهدة البث
```

## ملاحظات مهمة

1. **صورة الغلاف مهمة**: يجب تحميل صورة غلاف عند إنشاء البث لكي تظهر بشكل صحيح
2. **التحديث التلقائي**: صفحة المنشورات تحدّث البث المباشر كل 30 ثانية
3. **التوافقية**: التغييرات متوافقة مع جميع الأجهزة والمتصفحات
4. **الأداء**: لا توجد تأثيرات سلبية على الأداء

## الملفات المعدلة

1. `backend/app/api/routes/live.py` - تحديث serialization والحفظ
2. `frontend/src/pages/LiveStudio.jsx` - إرسال thumbnail_url
3. `frontend/src/pages/FeedEnhanced.jsx` - تحويل البث إلى منشورات
4. `frontend/src/pages/FeedMobile.jsx` - دمج البث مع المنشورات على الجوال
