Yamshat Premium Chat Upgrade
============================

المشروع الآن يشمل:
- دردشة نصية + صوتيات Voice Notes
- مشاركة صور وفيديو وملفات مرفوعة
- Online Status + Last Seen
- Delete for Everyone
- Read Receipts + Typing ping
- مكالمات صوت/فيديو عبر LiveKit من الويب ومن تطبيق الجوال
- Push Notifications جاهزة عبر Firebase FCM
- تشفير طرفي اختياري E2E للمحادثات الخاصة
- Anti-Spam + Moderation أساسي على مستوى الباك إند
- Admin Dashboard جديد مبني بـ React مع Charts + Tables + Live Updates
- Analytics Engine لإحصاءات الأونلاين والرسائل/الدقيقة والنمو
- نظام Moderation إداري: Ban / Mute / Restrict + Auto anti-spam
- Audit Logs لتسجيل الحركات الإدارية والعمليات المهمة
- Report User / Report Message + Live Admin Panel
- تحسينات أداء في قاعدة البيانات وفهارس الرسائل والحضور

أهم الإعدادات المطلوبة في backend/.env.example:
- DATABASE_URL
- SECRET_KEY
- LIVEKIT_WS_URL / LIVEKIT_URL
- LIVEKIT_API_KEY
- LIVEKIT_SECRET
- FIREBASE_SERVICE_ACCOUNT_JSON أو FIREBASE_SERVICE_ACCOUNT_PATH

ملاحظات تشغيل سريعة:
1) شغّل الباك إند Flask مع PostgreSQL.
2) اربط LiveKit بالقيم البيئية السابقة.
3) ضع ملف google-services.json في تطبيق Android كما هو موجود داخل المشروع.
4) فعّل Firebase Cloud Messaging لمفاتيح الإشعارات.
5) افتح chat.html أو تطبيق Android ثم فعّل E2E من زر القفل إذا رغبت.

ملفات رئيسية تم تحديثها:
- backend/chat.py
- backend/db.py
- backend/auth.py
- backend/config.py
- frontend/chat.html
- frontend/call.html
- frontend/admin.html
- frontend/admin-panel/*
- admin-react/*
- frontend/assets/app.js
- mobile/app/src/main/java/com/socialapp/activities/ChatActivity.kt
- mobile/app/src/main/java/com/socialapp/activities/LiveActivity.kt
