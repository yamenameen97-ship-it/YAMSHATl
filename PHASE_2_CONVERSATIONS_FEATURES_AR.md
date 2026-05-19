# المرحلة 2 - ميزات المحادثات المحسّنة

## نظرة عامة

تم تطوير مجموعة شاملة من ميزات إدارة المحادثات لتحسين تجربة المستخدم في تنظيم الرسائل والمحادثات.

## الميزات المنفذة

### 1. أرشفة المحادثات (Archive)
- **الوصف:** إخفاء المحادثة من الصندوق الوارد الرئيسي دون حذفها
- **الفوائد:** تنظيم أفضل للمحادثات النشطة
- **المسارات:**
  - `POST /inbox/{other_user_id}/archive` - أرشفة محادثة
  - `POST /inbox/{other_user_id}/unarchive` - إلغاء أرشفة
  - `GET /inbox/archived` - عرض المحادثات المؤرشفة

### 2. تثبيت المحادثات (Pin)
- **الوصف:** تثبيت محادثات مهمة في أعلى الصندوق الوارد
- **الفوائد:** سهولة الوصول للمحادثات المهمة
- **المميزات:**
  - دعم ترتيب متعدد المستويات
  - إعادة ترتيب المحادثات المثبتة
- **المسارات:**
  - `POST /inbox/{other_user_id}/pin` - تثبيت محادثة
  - `POST /inbox/{other_user_id}/unpin` - إلغاء التثبيت
  - `POST /inbox/reorder-pinned` - إعادة ترتيب المحادثات المثبتة

### 3. كتم المحادثات (Mute)
- **الوصف:** إيقاف الإشعارات من محادثة معينة
- **الفوائد:** تقليل الإزعاج من المحادثات غير الضرورية
- **المسارات:**
  - `POST /inbox/{other_user_id}/mute` - كتم محادثة
  - `POST /inbox/{other_user_id}/unmute` - إلغاء الكتم

### 4. حذف المحادثات (Delete)
- **الوصف:** حذف محادثة بشكل نهائي (soft delete)
- **الفوائد:** تنظيف الصندوق الوارد
- **المميزات:**
  - حذف ناعم (soft delete) - يمكن استعادة البيانات
  - إمكانية استعادة المحادثات المحذوفة
- **المسارات:**
  - `POST /inbox/{other_user_id}/delete` - حذف محادثة
  - `POST /inbox/{other_user_id}/restore` - استعادة محادثة
  - `GET /inbox/deleted` - عرض المحادثات المحذوفة

## نموذج قاعدة البيانات

### جدول `conversation_states`

```sql
CREATE TABLE conversation_states (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    other_user_id INTEGER NOT NULL,
    
    -- حالات المحادثة
    is_archived BOOLEAN DEFAULT FALSE,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_muted BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    
    -- الترتيب والأولويات
    pin_order INTEGER,
    
    -- الطوابع الزمنية
    archived_at TIMESTAMP,
    pinned_at TIMESTAMP,
    muted_at TIMESTAMP,
    deleted_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, other_user_id)
);
```

## الفرز الذكي

يتم فرز المحادثات بالترتيب التالي:

1. **المحادثات المثبتة أولاً** - مرتبة حسب `pin_order`
2. **المحادثات النشطة** - مرتبة حسب آخر رسالة (الأحدث أولاً)
3. **المحادثات المؤرشفة** - في قسم منفصل

## واجهات برمجية (API)

### الحصول على المحادثات

```bash
# الحصول على الصندوق الوارد الرئيسي
GET /inbox/

# الحصول على المحادثات المؤرشفة
GET /inbox/archived

# الحصول على المحادثات المحذوفة
GET /inbox/deleted

# الحصول على حالة محادثة معينة
GET /inbox/{other_user_id}/state
```

### إدارة المحادثات

```bash
# أرشفة
POST /inbox/{other_user_id}/archive
POST /inbox/{other_user_id}/unarchive

# تثبيت
POST /inbox/{other_user_id}/pin
POST /inbox/{other_user_id}/unpin

# كتم
POST /inbox/{other_user_id}/mute
POST /inbox/{other_user_id}/unmute

# حذف
POST /inbox/{other_user_id}/delete
POST /inbox/{other_user_id}/restore

# إعادة ترتيب
POST /inbox/reorder-pinned
{
    "pinned_order": [1, 2, 3]
}
```

## الملفات المضافة

### Backend
- `backend/app/models/conversation_state.py` - نموذج حالة المحادثة
- `backend/app/services/inbox_service_v2.py` - خدمة الصندوق الوارد المحسّنة
- `backend/app/api/routes/inbox_v2.py` - مسارات الصندوق الوارد الكاملة

## التكامل مع Frontend

يجب تحديث الملفات التالية في Frontend:

### الملفات المطلوبة للتحديث
- `frontend/src/api/chat.js` - إضافة دوال API جديدة
- `frontend/src/pages/Inbox.jsx` - تحديث واجهة المستخدم
- `frontend/src/services/socketManager.js` - إضافة أحداث البث المباشر

### دوال API المطلوبة

```javascript
// أرشفة
export const archiveChat = (userId) => api.post(`/inbox/${userId}/archive`);
export const unarchiveChat = (userId) => api.post(`/inbox/${userId}/unarchive`);

// تثبيت
export const pinChat = (userId) => api.post(`/inbox/${userId}/pin`);
export const unpinChat = (userId) => api.post(`/inbox/${userId}/unpin`);

// كتم
export const muteChat = (userId) => api.post(`/inbox/${userId}/mute`);
export const unmuteChat = (userId) => api.post(`/inbox/${userId}/unmute`);

// حذف
export const deleteChat = (userId) => api.post(`/inbox/${userId}/delete`);
export const restoreChat = (userId) => api.post(`/inbox/${userId}/restore`);

// إعادة ترتيب
export const reorderPinnedChats = (order) => 
  api.post(`/inbox/reorder-pinned`, { pinned_order: order });
```

## الميزات المستقبلية

- [ ] البحث والفلترة المتقدمة
- [ ] التصنيفات المخصصة للمحادثات
- [ ] الإشعارات الذكية
- [ ] التوقيت المجدول للأرشفة التلقائية
- [ ] النسخ الاحتياطي والاستعادة

## ملاحظات التطوير

1. تم استخدام Soft Delete لضمان عدم فقدان البيانات
2. جميع العمليات معفاة من الخطأ وتتعامل مع الحالات الحدية
3. تم تحسين الأداء باستخدام الفهارس المناسبة
4. جميع الطوابع الزمنية بصيغة UTC

## الاختبار

للاختبار، يمكن استخدام أدوات مثل Postman أو curl:

```bash
# أرشفة محادثة
curl -X POST http://localhost:8000/inbox/2/archive \
  -H "Authorization: Bearer YOUR_TOKEN"

# تثبيت محادثة
curl -X POST http://localhost:8000/inbox/2/pin \
  -H "Authorization: Bearer YOUR_TOKEN"

# الحصول على المحادثات
curl http://localhost:8000/inbox/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## الخطوات التالية

1. تحديث Frontend لاستخدام الواجهات الجديدة
2. إضافة اختبارات شاملة
3. تحسين الأداء للمستخدمين الذين لديهم محادثات كثيرة
4. إضافة ميزات متقدمة مثل البحث والفلترة
