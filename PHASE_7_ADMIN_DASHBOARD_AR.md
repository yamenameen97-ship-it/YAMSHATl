# المرحلة 7 - لوحة الإدارة الكاملة

## نظرة عامة

تم تطوير لوحة إدارة شاملة لإدارة المستخدمين والمحتوى والبلاغات والإحصائيات.

## الميزات المنفذة

### 1. إدارة المستخدمين (User Management)

#### الميزات:
- **عرض المستخدمين**
  - قائمة كاملة بجميع المستخدمين
  - البحث والفلترة
  - الفرز حسب الدور أو الحالة

- **حظر المستخدمين**
  - حظر دائم مع تسجيل السبب
  - إلغاء الحظر
  - تتبع المستخدمين المحظورين

- **حذف الحسابات**
  - حذف نهائي للحساب
  - حذف جميع البيانات المرتبطة
  - تسجيل الإجراء

- **تعديل الصلاحيات**
  - تغيير دور المستخدم
  - تعيين مسؤولين ومشرفين
  - إدارة الصلاحيات

#### الخدمات:
- `get_all_users()` - الحصول على قائمة المستخدمين
- `ban_user()` - حظر مستخدم
- `unban_user()` - إلغاء حظر
- `delete_user()` - حذف حساب
- `edit_user_permissions()` - تعديل الصلاحيات

### 2. إدارة البلاغات (Report Management)

#### الميزات:
- **عرض البلاغات**
  - قائمة البلاغات المعلقة
  - فلترة حسب الحالة
  - عرض التفاصيل

- **حل البلاغات**
  - تحديد الإجراء المتخذ
  - إضافة ملاحظات الحل
  - تسجيل القرار

- **رفض البلاغات**
  - رفض البلاغات غير الصحيحة
  - إضافة سبب الرفض
  - تتبع المرفوضة

#### الخدمات:
- `get_reports()` - الحصول على البلاغات
- `resolve_report()` - حل بلاغ
- `dismiss_report()` - رفض بلاغ

### 3. الإحصائيات الحية (Live Statistics)

#### المقاييس:
- **إحصائيات المستخدمين**
  - إجمالي المستخدمين
  - المستخدمون النشطون
  - المستخدمون المحظورون
  - المستخدمون الجدد

- **إحصائيات المحتوى**
  - إجمالي المنشورات
  - إجمالي الرسائل
  - إجمالي التعليقات

- **إحصائيات البث المباشر**
  - الغرف النشطة
  - إجمالي المشاهدين
  - الهدايا المرسلة
  - الإيرادات

- **إحصائيات الأداء**
  - متوسط وقت الاستجابة
  - عدد الأخطاء

#### الخدمات:
- `get_dashboard_statistics()` - إحصائيات لوحة المعلومات
- `get_user_statistics()` - إحصائيات مستخدم
- `get_system_statistics()` - إحصائيات النظام

### 4. إدارة المحتوى (Content Management)

#### الميزات:
- **حذف المنشورات**
  - حذف منشورات غير مناسبة
  - تسجيل السبب
  - تتبع المحذوفة

- **حذف التعليقات**
  - حذف تعليقات غير مناسبة
  - تسجيل السبب

- **مراقبة التعليقات**
  - عرض التعليقات المشبوهة
  - اتخاذ إجراء سريع

#### الخدمات:
- `delete_post()` - حذف منشور
- `delete_comment()` - حذف تعليق

### 5. سجلات التدقيق (Audit Logs)

#### الميزات:
- **تتبع الإجراءات**
  - تسجيل جميع إجراءات الإدارة
  - معرفة من قام بالإجراء
  - معرفة متى تم الإجراء

- **البحث والفلترة**
  - البحث حسب المسؤول
  - البحث حسب نوع الإجراء
  - عرض التفاصيل

#### الخدمات:
- `log_admin_action()` - تسجيل إجراء
- `get_audit_logs()` - الحصول على السجلات

### 6. إشعارات الإدارة (Admin Notifications)

#### الميزات:
- **إشعارات فورية**
  - بلاغات جديدة
  - تنبيهات النظام
  - تحديثات مهمة

- **إدارة الإشعارات**
  - تعليم كمقروء
  - حذف الإشعارات
  - تصفية الإشعارات

#### الخدمات:
- `create_admin_notification()` - إنشاء إشعار
- `get_admin_notifications()` - الحصول على الإشعارات
- `mark_notification_as_read()` - تعليم كمقروء

## نماذج قاعدة البيانات

### جدول `admin_audit_logs`
```sql
CREATE TABLE admin_audit_logs (
    id INTEGER PRIMARY KEY,
    admin_id INTEGER NOT NULL,
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id INTEGER,
    details JSON,
    reason TEXT,
    ip_address VARCHAR(50),
    user_agent VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### جدول `user_reports`
```sql
CREATE TABLE user_reports (
    id INTEGER PRIMARY KEY,
    reporter_id INTEGER NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id INTEGER NOT NULL,
    reason VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    resolved_by INTEGER,
    resolution_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);
```

### جدول `admin_notifications`
```sql
CREATE TABLE admin_notifications (
    id INTEGER PRIMARY KEY,
    admin_id INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    link VARCHAR(500),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### جدول `system_statistics`
```sql
CREATE TABLE system_statistics (
    id INTEGER PRIMARY KEY,
    date TIMESTAMP UNIQUE NOT NULL,
    total_users INTEGER DEFAULT 0,
    active_users INTEGER DEFAULT 0,
    new_users INTEGER DEFAULT 0,
    banned_users INTEGER DEFAULT 0,
    total_posts INTEGER DEFAULT 0,
    total_messages INTEGER DEFAULT 0,
    total_comments INTEGER DEFAULT 0,
    active_live_rooms INTEGER DEFAULT 0,
    total_viewers INTEGER DEFAULT 0,
    total_gifts_sent INTEGER DEFAULT 0,
    total_revenue INTEGER DEFAULT 0,
    avg_response_time INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## واجهات برمجية (API)

### لوحة المعلومات

```bash
# الحصول على بيانات لوحة المعلومات
GET /admin/dashboard
```

### إدارة المستخدمين

```bash
# الحصول على قائمة المستخدمين
GET /admin/users?skip=0&limit=50&search=username&role=user

# الحصول على إحصائيات مستخدم
GET /admin/users/{user_id}

# حظر مستخدم
POST /admin/users/{user_id}/ban
{
    "reason": "سلوك مسيء"
}

# إلغاء الحظر
POST /admin/users/{user_id}/unban

# حذف حساب
DELETE /admin/users/{user_id}
{
    "reason": "طلب المستخدم"
}

# تعديل الصلاحيات
POST /admin/users/{user_id}/permissions
{
    "role": "moderator"
}
```

### إدارة البلاغات

```bash
# الحصول على البلاغات
GET /admin/reports?status=pending&skip=0&limit=50

# حل بلاغ
POST /admin/reports/{report_id}/resolve
{
    "action": "ban_user",
    "notes": "تم حظر المستخدم"
}

# رفض بلاغ
POST /admin/reports/{report_id}/dismiss
{
    "reason": "بلاغ غير صحيح"
}
```

### إدارة المحتوى

```bash
# حذف منشور
DELETE /admin/posts/{post_id}
{
    "reason": "محتوى غير مناسب"
}

# حذف تعليق
DELETE /admin/comments/{comment_id}
{
    "reason": "تعليق مسيء"
}
```

### الإحصائيات

```bash
# إحصائيات النظام
GET /admin/statistics/system?days=7
```

### سجلات التدقيق

```bash
# الحصول على سجلات التدقيق
GET /admin/audit-logs?admin_id=1&action=ban_user&skip=0&limit=50
```

### إشعارات الإدارة

```bash
# الحصول على الإشعارات
GET /admin/notifications?unread_only=false&skip=0&limit=50

# تعليم إشعار كمقروء
POST /admin/notifications/{notification_id}/read
```

## الملفات المضافة

### Backend
- `backend/app/models/admin_audit.py` - نماذج الإدارة والتدقيق
- `backend/app/services/admin_dashboard_service.py` - خدمة لوحة الإدارة
- `backend/app/api/routes/admin_dashboard_v2.py` - مسارات لوحة الإدارة

## التكامل مع Frontend

### الملفات المطلوبة للتحديث
- `frontend/src/pages/admin/Dashboard.jsx` - لوحة المعلومات
- `frontend/src/pages/admin/Users.jsx` - إدارة المستخدمين
- `frontend/src/pages/admin/Reports.jsx` - إدارة البلاغات
- `frontend/src/pages/admin/Statistics.jsx` - الإحصائيات
- `frontend/src/api/admin.js` - دوال API الإدارة

## الميزات المستقبلية

- [ ] تقارير متقدمة
- [ ] جدولة الإجراءات
- [ ] التنبيهات الذكية
- [ ] تحليلات متقدمة
- [ ] النسخ الاحتياطية التلقائية

## ملاحظات الأمان

1. التحقق من الصلاحيات على جميع المسارات
2. تسجيل جميع الإجراءات الإدارية
3. حماية البيانات الحساسة
4. تقييد الوصول حسب الدور

## الاختبار

```bash
# الحصول على بيانات لوحة المعلومات
curl http://localhost:8000/admin/dashboard \
  -H "Authorization: Bearer ADMIN_TOKEN"

# حظر مستخدم
curl -X POST http://localhost:8000/admin/users/5/ban \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "سلوك مسيء"}'

# الحصول على البلاغات
curl http://localhost:8000/admin/reports?status=pending \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

## الخطوات التالية

1. تحديث Frontend لاستخدام الواجهات الجديدة
2. إضافة اختبارات شاملة
3. تحسين الأداء للأنظمة الكبيرة
4. إضافة ميزات متقدمة مثل التقارير المخصصة
