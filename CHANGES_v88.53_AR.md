# YAMSHAT v88.53 — نظام القيود الإدارية الموحّد
================================================

تمّ إضافة نظام قيود موحّد (User Restrictions) يدعم:
- comment_mute       → كتم من التعليق (24 ساعة قابلة للمضاعفة عند التكرار)
- post_ban           → حظر رفع منشور (48 ساعة)
- reels_ban          → حظر رفع ريلز (يومان)
- groups_join_ban    → حظر الانضمام للمجموعات (أسبوع)
- story_ban          → حظر رفع ستوري (يومان)
- dm_strangers_ban   → حظر مراسلة الغرباء (حتى نظر الإدارة)

## الملفات المضافة
- backend/app/models/user_restriction.py
- backend/app/services/restriction_service.py
- backend/app/api/routes/restrictions.py
- backend/alembic/versions/20260724_0019_user_restrictions.py
- frontend/src/api/restrictions.js
- frontend/src/components/notifications/RestrictionNotificationCard.jsx

## الملفات المعدّلة
- backend/app/models/__init__.py                  (import UserRestriction)
- backend/app/main.py                             (تسجيل راوتر restrictions)
- backend/app/api/routes/comments.py              (منع التعليق عند comment_mute)
- backend/app/api/routes/posts.py                 (منع النشر عند post_ban)
- backend/app/api/routes/reels.py                 (منع رفع الريلز عند reels_ban)
- backend/app/api/routes/stories.py               (منع رفع الستوري عند story_ban)
- backend/app/api/routes/groups.py                (منع الانضمام عند groups_join_ban)
- backend/app/api/routes/chat.py                  (منع DM للغرباء عند dm_strangers_ban)
- frontend/src/pages/Notifications.jsx            (عرض بطاقة القيد الإدارية)

## السلوك
- عند فرض الإدارة قيداً → يُنشأ سجل UserRestriction + إشعار نصّه رسمي
  يظهر للمستخدم في مركز الإشعارات.
- بطاقة الإشعار تحوي زر "طلب مراجعه" — عند الضغط يُفتح Modal ببوست نص
  ثم زر "ارسال" الذي يرسل الطلب للإدارة كرسالة ويُخفي الإشعار من عند
  المستخدم فوراً بعد الإرسال.
- إذا لم يُرسِل المستخدم الطلب يبقى الإشعار كما هو حتى يقوم هو بحذفه/تركه.
- عند ردّ الإدارة (قبول/رفض) → يختفي إشعار القيد ويصل إشعار جديد بالنتيجة.
- التكرار يضاعف مدة الحظر تلقائياً (2^repeat_count).

## نقاط الـ API الجديدة
- POST   /api/admin/restrictions                فرض قيد على مستخدم
- DELETE /api/admin/restrictions/{id}           رفع قيد يدوياً
- POST   /api/admin/restrictions/{id}/resolve   ردّ الإدارة على طلب مراجعة
- GET    /api/admin/restrictions                قائمة كل القيود
- GET    /api/restrictions/me                   قيودي السارية (للمستخدم)
- POST   /api/restrictions/{id}/appeal          إرسال طلب مراجعة
