# YAMSHAT FastAPI Backend

باك إند مبني على FastAPI + PostgreSQL + SQLAlchemy + JWT.

## الموجود فعليًا في الكود الحالي
- تسجيل حساب وتسجيل دخول JWT
- منشورات وتعليقات ومتابعة
- Inbox و Chat WebSocket
- حفظ FCM token للمستخدم
- تدفق **استرجاع كلمة المرور** عبر البريد (يتطلب Redis + SMTP فعّال)

## غير الموجود كمسار مكتمل داخل هذا الكود
- تحقق بريد إلكتروني كامل بعد التسجيل Signup Email Verification
- مسارات المجموعات والبث المباشر داخل نسخة FastAPI الحالية

> ملاحظة: نسخة السيرفر المنشورة حاليًا تحتوي مسارات إضافية للمجموعات والبث، لكن هذا الأرشيف المنظّف يحتفظ فقط بالهيكل الأساسي الواضح والقابل للصيانة.

## التشغيل المحلي
```bash
cd backend
cp .env.example .env
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## أهم المسارات
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/forgot-password`
- `POST /api/auth/verify-code`
- `GET /api/posts`
- `POST /api/posts`
- `GET /api/comments/{post_id}`
- `POST /api/comments/{post_id}`
- `GET /api/inbox`
- `GET /api/chat/messages/{other_user_id}`
- `WS /ws/{user_id}?token=JWT_TOKEN`
