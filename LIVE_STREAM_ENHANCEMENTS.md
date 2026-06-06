# تحسينات نظام البث المباشر - Live Stream Enhancements

## نظرة عامة

تم تطوير نظام شامل لإدارة البث المباشر في منصة يمشات يتضمن جميع الميزات المطلوبة من إدارة المشتركين والحظر والكتم وتحكم الكاميرا.

---

## 📋 الملفات المضافة والمحدثة

### 1. نماذج قاعدة البيانات (Backend Models)

#### `backend/app/models/live_viewers.py` ✨ جديد
نموذج شامل لتخزين بيانات المشتركين والبث والكاميرا:

**الجداول المضافة:**

- **`live_stream_viewers`** - بيانات المشاهدين الحاليين
  - `stream_id`: معرف البث
  - `user_id`: معرف المستخدم
  - `is_banned`: حالة الحظر
  - `is_muted`: حالة الكتم
  - `hearts_sent`: عدد القلوب المرسلة
  - `gifts_sent`: عدد الهدايا المرسلة
  - `comments_count`: عدد التعليقات

- **`live_stream_sessions`** - جلسات البث المباشر
  - معلومات البث الكاملة (العنوان، الوصف، الفئة)
  - حالة البث (pending, active, paused, ended)
  - إحصائيات شاملة (عدد المشاهدين، القلوب، الهدايا، التعليقات)
  - معلومات الكاميرا والميكروفون
  - درجة صحة البث والأداء

- **`live_stream_host_settings`** - إعدادات المضيف
  - إعدادات الاعتدال الآلي
  - قائمة المشرفين والصلاحيات
  - إعدادات الهدايا والدردشة

- **`live_stream_camera_states`** - حالة الكاميرا
  - حالة الكاميرا والميكروفون
  - معلومات الجهاز والدقة
  - معدل الإطارات والبتريت

---

### 2. خدمات الباك اند (Backend Services)

#### `services/live-service/comprehensive_live_service.py` ✨ جديد
خدمة شاملة لإدارة البث المباشر مع جميع الميزات:

**الميزات الرئيسية:**

1. **إدارة البث**
   - `create_stream()` - إنشاء بث جديد
   - `start_stream()` - بدء البث
   - `end_stream()` - إنهاء البث

2. **إدارة المشتركين**
   - `add_viewer()` - إضافة مشاهد
   - `remove_viewer()` - إزالة مشاهد
   - `get_viewers()` - الحصول على قائمة المشاهدين

3. **نظام الحظر والكتم**
   - `mute_user()` - كتم صوت المستخدم (مع جدولة فك الكتم)
   - `unmute_user()` - فك كتم صوت المستخدم
   - `ban_user()` - حظر المستخدم (مؤقت/طويل الأجل/دائم)
   - `unban_user()` - رفع حظر المستخدم
   - `is_user_banned()` - التحقق من حظر المستخدم
   - `is_user_muted()` - التحقق من كتم صوت المستخدم

4. **إدارة الكاميرا**
   - `update_camera_state()` - تحديث حالة الكاميرا والميكروفون
   - `close_camera()` - إغلاق الكاميرا

5. **الإحصائيات**
   - `get_stream_stats()` - الحصول على إحصائيات البث

**نقاط API المتاحة:**
```
POST   /live/create                      - إنشاء بث
POST   /live/{stream_id}/start           - بدء البث
POST   /live/{stream_id}/end             - إنهاء البث
POST   /live/{stream_id}/add-viewer      - إضافة مشاهد
POST   /live/{stream_id}/remove-viewer   - إزالة مشاهد
GET    /live/{stream_id}/viewers         - الحصول على المشاهدين
POST   /live/{stream_id}/mute            - كتم المستخدم
POST   /live/{stream_id}/unmute          - فك الكتم
POST   /live/{stream_id}/ban             - حظر المستخدم
POST   /live/{stream_id}/unban           - رفع الحظر
PUT    /live/{stream_id}/camera          - تحديث الكاميرا
POST   /live/{stream_id}/close-camera    - إغلاق الكاميرا
GET    /live/{stream_id}/stats           - الإحصائيات
GET    /live/{stream_id}                 - بيانات البث
GET    /live/                            - البثوث النشطة
```

---

### 3. واجهات API الأمامية (Frontend APIs)

#### `frontend/src/services/api/advancedLiveStreamApi.js` ✨ جديد
واجهات API محدثة تتضمن جميع الخدمات الجديدة:

**الدوال المتاحة:**

```javascript
// إدارة البث
createLiveStream(streamData)
startLiveStream(streamId, payload)
endLiveStream(streamId)
getLiveStreamDetails(streamId)

// إدارة المشتركين
addViewer(streamId, viewerData)
removeViewer(streamId, userId)
getStreamViewers(streamId)

// الحظر والكتم
muteUser(streamId, userId, moderatorId, reason, durationMinutes)
unmuteUser(streamId, userId)
banUser(streamId, userId, moderatorId, reason, duration)
unbanUser(streamId, userId)

// الكاميرا
updateCameraState(streamId, cameraData)
closeCameraStream(streamId)
toggleCamera(streamId, enabled)
toggleMicrophone(streamId, enabled)

// الإحصائيات والتسجيل
getStreamStats(streamId)
recordLiveStream(streamId, recordingData)

// دوال مساعدة
applyModerationAction(streamId, actionData)
getUserStreamStatus(streamId, userId)
updateStreamStats(streamId)
```

---

### 4. مكونات React (React Components)

#### `frontend/src/components/live/ViewersManagementPanel.jsx` ✨ جديد
لوحة شاملة لإدارة المشاهدين والحظر والكتم:

**الميزات:**
- عرض قائمة المشاهدين الحاليين مع الصور الرمزية
- تصفية المشاهدين (الكل، المكتومون، المحظورون)
- إجراءات سريعة:
  - 🔇 كتم الصوت / رفع الكتم
  - 🚫 حظر / رفع الحظر
  - ❌ إزالة من البث
- عرض إحصائيات المشاهد (القلوب، الهدايا، التعليقات)
- تحديث تلقائي كل 5 ثوان
- واجهة سهلة الاستخدام مع قائمة إجراءات

#### `frontend/src/pages/LiveStudio_Enhanced.jsx` ✨ محدث
صفحة تحكم البث المباشر المحسّنة مع جميع الأزرار المرتبطة:

**الأزرار المرتبطة:**
- ▶ **بدء البث** - إنشاء وبدء بث جديد
- ⏹ **إيقاف البث** - إنهاء البث المباشر
- 📷 **تبديل الكاميرا** - تشغيل/إيقاف الكاميرا
- 🎤 **تبديل الميكروفون** - كتم/تشغيل الميكروفون
- ⏺ **التسجيل** - بدء/إيقاف تسجيل البث

**الميزات الإضافية:**
- عرض إحصائيات البث الحية (المشاهدون، القلوب، الهدايا، المدة)
- لوحة رسائل مع إرسال تعليقات
- لوحة إدارة المشاهدين (Viewers Management Panel)
- لوحة الهدايا مع خيارات متعددة
- تحديث تلقائي للإحصائيات كل 5 ثوان

---

### 5. أنماط CSS (Stylesheets)

#### `frontend/src/styles/viewers-management.css` ✨ جديد
تنسيق شامل لوحة إدارة المشاهدين:
- تصميم حديث مع تدرجات لونية
- واجهة سهلة الاستخدام
- استجابة كاملة للأجهزة المختلفة
- رسوم متحركة سلسة
- ألوان مميزة للحالات المختلفة (مكتوم، محظور)

---

## 🔧 كيفية الاستخدام

### 1. تثبيت الجداول الجديدة

```bash
# تشغيل الهجرات
alembic upgrade head
```

### 2. استخدام الخدمة في الباك اند

```python
from services.live_service.comprehensive_live_service import ComprehensiveLiveService

# إنشاء خدمة
live_service = ComprehensiveLiveService()

# إنشاء بث
stream = await live_service.create_stream(
    host_id=1,
    host_username="ahmed",
    request=CreateStreamRequest(
        title="البث الأول",
        description="وصف البث",
        category="ألعاب",
        quality="720p"
    )
)

# كتم مستخدم
await live_service.mute_user(
    stream_id=stream["stream_id"],
    user_id=5,
    moderator_id=1,
    reason="سبام",
    duration_minutes=5
)

# حظر مستخدم
await live_service.ban_user(
    stream_id=stream["stream_id"],
    user_id=5,
    moderator_id=1,
    reason="سلوك سيء",
    duration=BanDuration.TEMPORARY
)
```

### 3. استخدام واجهات API في الأمامي

```javascript
import {
  createLiveStream,
  muteUser,
  banUser,
  updateCameraState,
  getStreamViewers,
} from '../services/api/advancedLiveStreamApi.js';

// إنشاء بث
const stream = await createLiveStream({
  title: "البث الأول",
  description: "وصف البث",
  category: "ألعاب",
  quality: "720p"
});

// كتم مستخدم
await muteUser(
  stream.data.stream_id,
  userId,
  moderatorId,
  "سبام",
  5
);

// حظر مستخدم
await banUser(
  stream.data.stream_id,
  userId,
  moderatorId,
  "سلوك سيء",
  "temporary"
);

// تحديث الكاميرا
await updateCameraState(stream.data.stream_id, {
  cameraEnabled: false,
  microphoneEnabled: true
});

// الحصول على المشاهدين
const viewers = await getStreamViewers(stream.data.stream_id);
```

### 4. استخدام المكونات في React

```jsx
import ViewersManagementPanel from '../components/live/ViewersManagementPanel.jsx';
import LiveStudioEnhanced from '../pages/LiveStudio_Enhanced.jsx';

// استخدام لوحة إدارة المشاهدين
<ViewersManagementPanel
  streamId={streamId}
  hostId={hostId}
  onViewerCountChange={(count) => console.log(count)}
/>

// استخدام صفحة البث المحسّنة
<LiveStudioEnhanced />
```

---

## 📊 معايير الأداء

### الجداول المضافة:
- **live_stream_viewers**: تخزين بيانات المشاهدين الحاليين
- **live_stream_sessions**: تخزين جلسات البث
- **live_stream_host_settings**: إعدادات المضيف
- **live_stream_camera_states**: حالة الكاميرا

### عمليات محسّنة:
- تحديث الإحصائيات كل 5 ثوان
- جدولة فك الكتم والحظر تلقائياً
- تخزين مؤقت للبثوث النشطة
- معالجة WebSocket للتحديثات الحية

---

## 🔐 الأمان

### ميزات الأمان المضافة:
- التحقق من صلاحيات المضيف قبل تطبيق الإجراءات
- تسجيل جميع إجراءات الاعتدال
- التحقق من حالة الحظر عند إضافة مشاهد
- معالجة آمنة للأخطاء

---

## 🚀 الخطوات التالية

1. **دمج الخدمات مع الباك اند الرئيسي**
   - إضافة endpoints جديدة في main API
   - ربط الخدمة مع قاعدة البيانات

2. **اختبار شامل**
   - اختبار وحدات (Unit Tests)
   - اختبار التكامل (Integration Tests)
   - اختبار الأداء (Performance Tests)

3. **نشر في الإنتاج**
   - تشغيل الهجرات
   - تحديث الواجهة الأمامية
   - مراقبة الأداء

---

## 📝 ملاحظات إضافية

- جميع الأوقات مخزنة بصيغة UTC
- معرفات البث تستخدم صيغة `stream_{host_id}_{timestamp}`
- الحظر المؤقت يستمر 24 ساعة افتراضياً
- الكتم يستمر 5 دقائق افتراضياً
- الإحصائيات تُحدّث تلقائياً كل 5 ثوان

---

## 📞 الدعم والمساعدة

للمزيد من المعلومات أو الإبلاغ عن مشاكل، يرجى التواصل مع فريق التطوير.

---

**آخر تحديث:** يونيو 2026
**الإصدار:** 1.0.0
