# المرحلة 8 - نظام الإشعارات الكامل

## نظرة عامة

تم تطوير نظام إشعارات شامل يدعم أنواع متعددة من الإشعارات مع Push Notifications ومركز إشعارات متقدم.

## الميزات المنفذة

### 1. أنواع الإشعارات (Notification Types)

#### الإشعارات المدعومة:
- **new_message** - رسالة جديدة
- **new_follow** - متابع جديد
- **new_like** - إعجاب جديد
- **new_comment** - تعليق جديد
- **new_share** - مشاركة جديدة
- **gift_received** - هدية جديدة
- **live_started** - بث مباشر جديد
- **mention** - إشارة جديدة
- **system_alert** - تنبيه نظام
- **admin_action** - إجراء إداري

### 2. إنشاء الإشعارات (Create Notifications)

#### الخدمات:
- `create_notification()` - إنشاء إشعار عام
- `create_message_notification()` - إشعار رسالة
- `create_follow_notification()` - إشعار متابع
- `create_like_notification()` - إشعار إعجاب
- `create_comment_notification()` - إشعار تعليق
- `create_gift_notification()` - إشعار هدية
- `create_live_notification()` - إشعار بث مباشر

#### مثال:
```python
create_message_notification(
    db,
    user_id=2,
    sender_id=1,
    message_preview="مرحبا، كيف حالك؟"
)
```

### 3. إدارة الإشعارات (Manage Notifications)

#### الميزات:
- **عرض الإشعارات**
  - جميع الإشعارات
  - الإشعارات غير المقروءة فقط
  - مع الفرز والترتيب

- **تعليم كمقروء**
  - تعليم إشعار واحد
  - تعليم جميع الإشعارات

- **حذف الإشعارات**
  - حذف إشعار واحد
  - حذف الإشعارات القديمة

#### الخدمات:
- `get_notifications()` - الحصول على الإشعارات
- `mark_as_read()` - تعليم كمقروء
- `mark_all_as_read()` - تعليم الكل
- `delete_notification()` - حذف إشعار
- `clear_old_notifications()` - حذف القديمة

### 4. Push Notifications

#### الميزات:
- **إشعارات الهاتف**
  - دعم Firebase Cloud Messaging (FCM)
  - دعم Apple Push Notification (APN)
  - تخصيص الإشعارات

- **إشعارات المتصفح**
  - Web Push Notifications
  - تخصيص الرموز والشارات
  - تصنيف الإشعارات

#### الخدمات:
- `send_push_notification()` - إرسال إشعار Push
- `send_browser_notification()` - إرسال إشعار متصفح

### 5. مركز الإشعارات (Notification Center)

#### الميزات:
- **عرض مركزي**
  - جميع الإشعارات في مكان واحد
  - فلترة حسب النوع
  - عرض الملخص

- **الإحصائيات**
  - عدد الإشعارات الكلي
  - عدد غير المقروءة
  - توزيع حسب النوع

- **التصنيف**
  - تصنيف الإشعارات حسب النوع
  - عرض مجموعات منفصلة

#### الخدمات:
- `get_notification_center()` - مركز الإشعارات
- `categorize_notifications()` - تصنيف الإشعارات
- `get_notification_summary()` - ملخص الإشعارات
- `get_unread_count()` - عدد غير المقروءة

### 6. تفضيلات الإشعارات (Preferences)

#### الميزات:
- **التحكم الكامل**
  - تفعيل/تعطيل الإشعارات
  - تفعيل/تعطيل أنواع محددة
  - اختيار قنوات الإشعارات

#### الخدمات:
- `get_notification_preferences()` - الحصول على التفضيلات

## نموذج قاعدة البيانات

### جدول `notifications`
```sql
CREATE TABLE notifications (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    body VARCHAR(500) NOT NULL,
    data JSON,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## واجهات برمجية (API)

### الحصول على الإشعارات

```bash
# جميع الإشعارات
GET /notifications/?skip=0&limit=50

# الإشعارات غير المقروءة فقط
GET /notifications/?unread_only=true

# مركز الإشعارات
GET /notifications/center

# الإشعارات المصنفة
GET /notifications/categorized

# الملخص
GET /notifications/summary

# عدد غير المقروءة
GET /notifications/unread-count

# التفضيلات
GET /notifications/preferences
```

### إدارة الإشعارات

```bash
# تعليم كمقروء
POST /notifications/{notification_id}/read

# تعليم الكل
POST /notifications/read-all

# حذف إشعار
DELETE /notifications/{notification_id}

# حذف القديمة
POST /notifications/clear-old?days=30
```

### إنشاء الإشعارات

```bash
# إشعار عام
POST /notifications/create
{
    "type": "system_alert",
    "title": "تنبيه مهم",
    "body": "تحديث جديد متاح",
    "data": {}
}

# إشعار رسالة
POST /notifications/message
{
    "sender_id": 1,
    "message_preview": "مرحبا"
}

# إشعار متابع
POST /notifications/follow
{
    "follower_id": 1
}

# إشعار إعجاب
POST /notifications/like
{
    "liker_id": 1,
    "post_id": 10
}

# إشعار تعليق
POST /notifications/comment
{
    "commenter_id": 1,
    "post_id": 10,
    "comment_preview": "تعليق رائع"
}

# إشعار هدية
POST /notifications/gift
{
    "sender_id": 1,
    "gift_name": "وردة",
    "amount": 1
}

# إشعار بث مباشر
POST /notifications/live
{
    "host_id": 1,
    "room_id": "room_123"
}
```

### Push Notifications

```bash
# إرسال إشعار Push
POST /notifications/push
{
    "title": "عنوان الإشعار",
    "body": "محتوى الإشعار",
    "data": {}
}

# إرسال إشعار متصفح
POST /notifications/browser
{
    "title": "عنوان الإشعار",
    "body": "محتوى الإشعار",
    "icon": "https://example.com/icon.png",
    "badge": "https://example.com/badge.png",
    "tag": "notification-tag"
}
```

## الملفات المضافة

### Backend
- `backend/app/services/notification_service_v2.py` - خدمة الإشعارات المحسّنة
- `backend/app/api/routes/notifications_v2.py` - مسارات الإشعارات

## التكامل مع Frontend

### الملفات المطلوبة للتحديث
- `frontend/src/api/notifications.js` - دوال API الإشعارات
- `frontend/src/pages/notifications/NotificationCenter.jsx` - مركز الإشعارات
- `frontend/src/components/notifications/NotificationBell.jsx` - جرس الإشعارات
- `frontend/src/components/notifications/NotificationPanel.jsx` - لوحة الإشعارات
- `frontend/src/services/notificationService.js` - خدمة الإشعارات

### دوال API المطلوبة

```javascript
// الحصول على الإشعارات
export const getNotifications = (unreadOnly = false) => 
  api.get(`/notifications/?unread_only=${unreadOnly}`);

// مركز الإشعارات
export const getNotificationCenter = () => 
  api.get(`/notifications/center`);

// تعليم كمقروء
export const markAsRead = (notificationId) => 
  api.post(`/notifications/${notificationId}/read`);

// تعليم الكل
export const markAllAsRead = () => 
  api.post(`/notifications/read-all`);

// حذف إشعار
export const deleteNotification = (notificationId) => 
  api.delete(`/notifications/${notificationId}`);

// عدد غير المقروءة
export const getUnreadCount = () => 
  api.get(`/notifications/unread-count`);
```

## الميزات المستقبلية

- [ ] جدولة الإشعارات
- [ ] إشعارات مخصصة
- [ ] تحليلات الإشعارات
- [ ] نماذج الإشعارات المتقدمة
- [ ] تكامل مع خدمات خارجية

## ملاحظات التطوير

1. جميع الإشعارات مخزنة في قاعدة البيانات
2. دعم كامل للعربية
3. معالجة الأخطاء الشاملة
4. أداء محسّنة مع الفهارس المناسبة

## الاختبار

```bash
# إنشاء إشعار رسالة
curl -X POST http://localhost:8000/notifications/message \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sender_id": 1,
    "message_preview": "مرحبا"
  }'

# الحصول على الإشعارات
curl http://localhost:8000/notifications/ \
  -H "Authorization: Bearer TOKEN"

# تعليم كمقروء
curl -X POST http://localhost:8000/notifications/1/read \
  -H "Authorization: Bearer TOKEN"
```

## الخطوات التالية

1. تحديث Frontend لاستخدام الواجهات الجديدة
2. تكامل مع Firebase Cloud Messaging
3. إضافة اختبارات شاملة
4. تحسين الأداء للمستخدمين الذين لديهم إشعارات كثيرة
5. إضافة ميزات متقدمة مثل الجدولة والتخصيص
