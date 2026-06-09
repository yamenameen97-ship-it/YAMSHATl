# دليل دمج الميزات الجديدة في يمشات 🎮

> هذا الدليل يشرح كيفية تفعيل الميزات العشر المُضافة دفعة واحدة.

## ✨ الميزات المُضافة

| # | الميزة | المسار |
|---|---|---|
| 1 | مركز المهام اليومية | `/engagement/tasks` |
| 2 | نظام مستويات المستخدم | `/engagement/level` |
| 3 | نظام مستويات المضيف | `/engagement/host-level` |
| 4 | شارات الإنجازات | `/engagement/achievements` |
| 5 | عجلة الحظ | `/engagement/wheel` |
| 6 | دعوة الأصدقاء + كود إحالة | `/engagement/referral` |
| 7 | متجر الإطارات | `/engagement/shop?item_type=frame` |
| 8 | متجر الصور الشخصية | `/engagement/shop?item_type=avatar` |
| 9 | خلفيات حساب مميزة | `/engagement/shop?item_type=background` |
| 10 | الغرف الصوتية الجماعية | `/voice/rooms` |

---

## 🗄️ 1) تطبيق ميغريشن قاعدة البيانات

```bash
cd backend
alembic upgrade head
```

سيتم إنشاء 14 جدولاً جديداً (daily_tasks، user_levels، host_levels،
achievements، lucky_wheel_prizes، shop_items، voice_rooms، ...).

## 🌱 2) زرع البيانات الأولية

```bash
python -m backend.scripts.seed_engagement
```

يُنشئ:
- 9 مهام يومية افتراضية
- 9 شارات إنجاز
- 8 جوائز لعجلة الحظ
- 13 عنصر متجر افتراضي (إطارات/صور/خلفيات/تأثيرات)

## 🔌 3) تسجيل الراوترات (مُضاف تلقائياً)

في `backend/app/main.py` أُضيف:
```python
_include("app.api.routes.engagement.router", prefix="/api/engagement")
_include("app.api.routes.voice_rooms.router", prefix="/api/voice")
```

## 🖥️ 4) إضافة المسارات للـ Frontend

في ملف `frontend/src/routes/*` أضف:

```jsx
import EngagementHub from "@/pages/EngagementHub";
import VoiceRoomsPage from "@/pages/VoiceRoomsPage";

// داخل <Routes>:
<Route path="/engagement" element={<EngagementHub />} />
<Route path="/voice-rooms" element={<VoiceRoomsPage />} />
```

## 🎯 5) ربط أحداث النظام بالمهام (تكامل اختياري)

أضف نداءات `increment_task_progress` في نقاط الأحداث الموجودة:

```python
from app.services.engagement_service import increment_task_progress

# عند تسجيل دخول:
increment_task_progress(db, user.id, "daily_login")

# عند نشر منشور:
increment_task_progress(db, user.id, "post_create")

# عند إعجاب:
increment_task_progress(db, user.id, "like_posts")

# عند إرسال رسالة:
increment_task_progress(db, user.id, "send_messages")

# عند إرسال هدية:
increment_task_progress(db, user.id, "send_gift")

# عند بدء بث (دقيقة واحدة):
increment_task_progress(db, user.id, "host_live_30m")
```

## 🏆 6) منح شارات الإنجاز عند تحقق الشروط

```python
from app.services.engagement_service import unlock_achievement

# عند نشر أول منشور:
unlock_achievement(db, user.id, "first_post")

# عند الوصول لـ 100 متابع:
if user.followers_count >= 100:
    unlock_achievement(db, user.id, "100_followers")
```

## ⭐ 7) منح XP عبر النظام

```python
from app.services.engagement_service import add_user_xp, add_host_xp

# عند نشر منشور:
add_user_xp(db, user.id, 20)

# عند انتهاء بث مباشر:
add_host_xp(db, host.id, xp_amount=100, minutes=30, viewers=50)
```

## 🤝 8) تكامل كود الإحالة عند التسجيل

في راوتر التسجيل `backend/app/api/routes/auth.py`، أضف بعد إنشاء المستخدم:

```python
from app.services.engagement_service import apply_referral_code

if signup_data.referral_code:
    apply_referral_code(db, new_user.id, signup_data.referral_code)
```

وأضف الحقل في `schemas/user.py`:
```python
referral_code: Optional[str] = None
```

---

## 📡 API Endpoints الكاملة

### Engagement
```
GET    /api/engagement/tasks                        قائمة المهام اليوم
POST   /api/engagement/tasks/{id}/claim             استلام مكافأة مهمة
GET    /api/engagement/level                        مستوى المستخدم
GET    /api/engagement/host-level                   مستوى المضيف
GET    /api/engagement/achievements                 الشارات
POST   /api/engagement/achievements/{id}/pin        تثبيت شارة
GET    /api/engagement/wheel                        حالة عجلة الحظ
POST   /api/engagement/wheel/spin?paid=false        دوران
GET    /api/engagement/referral                     كود الإحالة وإحصائيات
POST   /api/engagement/referral/apply?code=XXX      تطبيق كود
GET    /api/engagement/shop?item_type=frame         قائمة المتجر
POST   /api/engagement/shop/{id}/buy                شراء عنصر
GET    /api/engagement/inventory                    مخزون المستخدم
POST   /api/engagement/inventory/{id}/equip         تجهيز عنصر
```

### Voice Rooms
```
POST   /api/voice/rooms                             إنشاء غرفة
GET    /api/voice/rooms?category=general            قائمة الغرف
GET    /api/voice/rooms/{id}                        تفاصيل غرفة
POST   /api/voice/rooms/{id}/join                   انضمام
POST   /api/voice/rooms/{id}/leave                  مغادرة
POST   /api/voice/rooms/{id}/seats/take             أخذ مقعد
POST   /api/voice/rooms/{id}/seats/leave            مغادرة المقعد
POST   /api/voice/rooms/{id}/mute                   كتم
POST   /api/voice/rooms/{id}/close                  إغلاق (للمالك)
POST   /api/voice/rooms/{id}/messages               إرسال رسالة شات
GET    /api/voice/rooms/{id}/messages               جلب رسائل الشات
```

---

## 📂 الملفات المُضافة

### Backend
- `backend/app/models/engagement.py` (14 نموذجاً)
- `backend/app/services/engagement_service.py` (منطق الأعمال)
- `backend/app/services/seed_engagement.py` (البيانات الأولية)
- `backend/app/api/routes/engagement.py` (API)
- `backend/app/api/routes/voice_rooms.py` (API الغرف الصوتية)
- `backend/alembic/versions/20260610_0006_engagement_features.py` (ميغريشن)
- `backend/scripts/seed_engagement.py` (سكربت الزرع)

### Frontend
- `frontend/src/features/engagement/api/engagementApi.js`
- `frontend/src/features/engagement/components/DailyTasksCenter.jsx`
- `frontend/src/features/engagement/components/UserLevelBadge.jsx`
- `frontend/src/features/engagement/components/AchievementsGrid.jsx`
- `frontend/src/features/engagement/components/LuckyWheel.jsx`
- `frontend/src/features/engagement/components/ReferralPanel.jsx`
- `frontend/src/features/engagement/components/ShopPage.jsx`
- `frontend/src/features/voice-rooms/components/VoiceRoomsList.jsx`
- `frontend/src/features/voice-rooms/components/VoiceRoomView.jsx`
- `frontend/src/pages/EngagementHub.jsx`
- `frontend/src/pages/VoiceRoomsPage.jsx`

---

## 🎨 الملاحظات الفنية

- جميع الواجهات بـ **RTL** وخط **Noto Sans Arabic**.
- لا توجد أي مدوالس (modals): كل التفاعلات inline داخل البطاقات والصفحات.
- نظام XP تصاعدي: المستوى التالي يحتاج `level² × 100`.
- مكافآت الإحالة: 500 عملة للداعي + 200 عملة للمدعو.
- عجلة الحظ: دورة مجانية واحدة يومياً + دورات مدفوعة (100 عملة).
- الغرف الصوتية: تدعم Agora (channel جاهز)، 2-15 مقعداً، خاصة/عامة.

✅ كل الميزات جاهزة. شغّل `alembic upgrade head` + `seed_engagement` وأنت جاهز للانطلاق.
