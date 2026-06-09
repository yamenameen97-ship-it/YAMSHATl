# تقرير مراجعة وإصلاح الربط بين الفرونت إند والباك إند

**التاريخ:** 2026-06-09
**النسخة:** yamshat-unified-v5-integrated

---

## ✅ الوضع العام للمشروع

### الباك إند (FastAPI + SQLAlchemy + Alembic)

| المكون | الحالة |
|---|---|
| `app/main.py` | ✅ يحمّل **18 router** عبر `_include(...)` بأمان (try/except) |
| نماذج SQLAlchemy | ✅ 41 موديل (post, user, message, group, engagement, voice_rooms, ...) |
| Alembic migrations | ✅ 6 ملفات هجرة متسلسلة من `0001` إلى `0006` |
| الجداول الإضافية للـ Engagement | ✅ 15 جدول مُنشأ في `0006_engagement_features.py` |
| `app/models/__init__.py` | ✅ يستورد جميع النماذج بما فيها Engagement & VoiceRooms |
| `app/api/routes/__init__.py` | ✅ تم إضافة `engagement`, `voice_rooms`, `recommendations` للقائمة |

### الفرونت إند (React + Vite + Zustand + React Query)

| المكون | الحالة |
|---|---|
| `src/api/axios.js` | ✅ instance رئيسي مع CSRF + JWT + retry |
| `src/api/client.js` | 🆕 **تم إنشاؤه** للـ engagement (baseURL بدون `/api`) |
| `vite.config.js` | 🆕 **تم إضافة alias** `@` ← `./src` |
| `App.jsx` | 🆕 **تمت إضافة Routes** لـ `/engagement` و `/voice` |
| `Sidebar.jsx` | 🆕 **تمت إضافة روابط** للتنقل |

---

## 🔧 المشاكل التي تم إصلاحها

### 1. ❌ → ✅ alias `@` غير معرف في Vite
**المشكلة:** كل الملفات الجديدة في `features/engagement/` و `pages/EngagementHub.jsx` و `pages/VoiceRoomsPage.jsx` تستخدم استيرادات بصيغة `@/features/...` و `@/api/client`، لكن `vite.config.js` لم يكن يحوي تعريف alias. → الـ build كان سيفشل.

**الإصلاح:** إضافة `resolve.alias` إلى `vite.config.js`:
```js
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
},
```

### 2. ❌ → ✅ ملف `@/api/client` غير موجود
**المشكلة:** `engagementApi.js` يستورد `apiClient` من `@/api/client` لكن لا يوجد سوى `axios.js` الذي يضع `/api` في `baseURL` (تضاعف مع `/api/engagement/...`).

**الإصلاح:** إنشاء `src/api/client.js` جديد يوفر `apiClient` بـ:
- `baseURL = origin` (بدون `/api`) ليناسب المسارات الكاملة المكتوبة في `engagementApi.js`
- نفس CSRF + JWT + معالجة 401
- نفس `withCredentials: true` للكوكيز

### 3. ❌ → ✅ صفحات Engagement و VoiceRooms غير مربوطة في Router
**المشكلة:** الصفحات موجودة لكن لا يوجد لها أي `<Route>` في `App.jsx` → غير قابلة للوصول.

**الإصلاح:** إضافة 4 مسارات محمية في `App.jsx`:
```jsx
<Route path="/engagement" element={<ProtectedRoute><EngagementHub /></ProtectedRoute>} />
<Route path="/engagement/:tab" element={<ProtectedRoute><EngagementHub /></ProtectedRoute>} />
<Route path="/voice" element={<ProtectedRoute><VoiceRoomsPage /></ProtectedRoute>} />
<Route path="/voice/:roomId" element={<ProtectedRoute><VoiceRoomsPage /></ProtectedRoute>} />
```

### 4. ❌ → ✅ react-redux مستخدم بدون تثبيته
**المشكلة:** `VoiceRoomsPage.jsx` كان يستورد `useSelector` من `react-redux`، لكن المشروع يستخدم **Zustand** فقط ولا يوجد `react-redux` في `package.json` → runtime crash.

**الإصلاح:** استبدال `useSelector` بـ `useAppStore` (zustand):
```js
const currentUserId = useAppStore((s) => s?.session?.id ?? s?.session?.user?.id ?? null);
```

### 5. ❌ → ✅ لا يوجد وصول من شريط التنقل
**الإصلاح:** إضافة عنصرين في `Sidebar.jsx`:
- ⭐ مركز التفاعل → `/engagement`
- ♫ غرف صوتية → `/voice`

---

## 🔗 خريطة ربط Frontend ↔ Backend ↔ Database

### Engagement (المهام/المستويات/الشارات/عجلة الحظ/الإحالة/المتجر)

| Frontend (apiClient) | Backend (Router) | Service | Tables |
|---|---|---|---|
| `GET /api/engagement/tasks` | `engagement.get_tasks` | `engagement_service.get_today_tasks` | `daily_tasks`, `user_daily_tasks` |
| `POST /api/engagement/tasks/{id}/claim` | `engagement.claim_task_reward` | `claim_task` | `user_daily_tasks`, `user_levels`, `user_wallets` |
| `GET /api/engagement/level` | `engagement.my_level` | `get_or_create_user_level` | `user_levels` |
| `GET /api/engagement/host-level` | `engagement.my_host_level` | – | `host_levels` |
| `GET /api/engagement/achievements` | `engagement.list_achievements` | – | `achievements`, `user_achievements` |
| `POST /api/engagement/achievements/{id}/pin` | `engagement.pin_achievement` | – | `user_achievements` |
| `GET /api/engagement/wheel` | `engagement.get_wheel` | – | `lucky_wheel_prizes`, `lucky_wheel_spins` |
| `POST /api/engagement/wheel/spin` | `engagement.spin_wheel` | `spin_wheel` | `lucky_wheel_spins`, `user_wallets` |
| `GET /api/engagement/referral` | `engagement.referral_info` | – | `referral_codes`, `referrals` |
| `POST /api/engagement/referral/apply` | `engagement.apply_referral` | – | `referrals`, `user_wallets` |
| `GET /api/engagement/shop` | `engagement.list_shop` | – | `shop_items` |
| `POST /api/engagement/shop/{id}/buy` | `engagement.buy_item` | `buy_item` | `user_inventory`, `user_wallets` |
| `GET /api/engagement/inventory` | `engagement.my_inventory` | – | `user_inventory` |
| `POST /api/engagement/inventory/{id}/equip` | `engagement.equip` | – | `user_inventory` |

### Voice Rooms (الغرف الصوتية الجماعية)

| Frontend (apiClient) | Backend (Router) | Tables |
|---|---|---|
| `POST /api/voice/rooms` | `voice_rooms.create_room` | `voice_rooms` |
| `GET /api/voice/rooms` | `voice_rooms.list_rooms` | `voice_rooms`, `voice_room_members` |
| `GET /api/voice/rooms/{id}` | `voice_rooms.get_room` | `voice_rooms`, `voice_room_members` |
| `POST /api/voice/rooms/{id}/join` | `voice_rooms.join_room` | `voice_room_members` |
| `POST /api/voice/rooms/{id}/leave` | `voice_rooms.leave_room` | `voice_room_members` |
| `POST /api/voice/rooms/{id}/seats/take` | `voice_rooms.take_seat` | `voice_room_members` |
| `POST /api/voice/rooms/{id}/seats/leave` | `voice_rooms.leave_seat` | `voice_room_members` |
| `POST /api/voice/rooms/{id}/mute` | `voice_rooms.toggle_mute` | `voice_room_members` |
| `POST /api/voice/rooms/{id}/close` | `voice_rooms.close_room` | `voice_rooms` |
| `POST /api/voice/rooms/{id}/messages` | `voice_rooms.send_message` | `voice_room_messages` |
| `GET /api/voice/rooms/{id}/messages` | `voice_rooms.get_messages` | `voice_room_messages` |

### الميزات الأساسية (موجودة وتعمل من قبل)

| الخدمة | Routes | الجداول |
|---|---|---|
| Auth (login/register/2FA/social/captcha) | `/api/auth/*` | `users`, `user_sessions`, `login_challenges` |
| Posts (نشر/تعديل/إعجاب/حفظ/مشاركة/تعليق) | `/api/posts/*` | `posts`, `likes`, `post_saves`, `post_shares`, `comments`, `post_poll_votes`, `post_edit_history` |
| Stories & Reels | `/api/stories/*`, `/api/reels/*` | `stories`, `story_views`, `story_replies`, `reels`, `reel_likes`, `reel_comments`, `reel_views`, `saved_reels` |
| Chat / Inbox | `/api/chat/*`, `/api/inbox/*` | `messages`, `message_attachments`, `message_reactions`, `conversation_states` |
| Groups | `/api/groups/*` | `groups`, `group_members`, `group_invitations`, `group_join_requests`, `group_posts`, `group_rules`, `group_events`, `group_polls`, `group_announcements`, `group_settings` |
| Live Streaming | `/api/live/*` | `live_room_sessions`, `live_viewers`, `live_moderation` |
| Notifications | `/api/notifications/*` | `notifications` |
| Search | `/api/search/*` | `search_history` |
| Follow / Users | `/api/follow/*`, `/api/users/*` | `follows`, `user_blocks`, `user_mutes`, `close_friends`, `user_preferences`, `user_profile` |
| Admin Dashboard | `/api/admin/*` | `admin_audit`, `audit_log`, `app_setting` |

---

## 🧪 تحققات الجودة المُجراة

1. ✅ **فحص syntax** لجميع ملفات Python الحساسة (`main.py`, `engagement.py`, `voice_rooms.py`, `engagement_service.py`, models)
2. ✅ **فحص syntax** لـ `vite.config.js` عبر `node --check`
3. ✅ **فحص توازن الأقواس** في `App.jsx` بعد التعديل
4. ✅ **مطابقة الجداول** بين Migration `0006` ونماذج `engagement.py` (15 جدول)
5. ✅ **مطابقة الـ endpoints** بين `engagementApi.js` و `voice_rooms.py` و `engagement.py` (25 endpoint)
6. ✅ **عدم وجود redux** بعد الإصلاح (`grep -rn "react-redux"` يعود فارغاً في features و pages الجديدة)

---

## 🚀 خطوات التشغيل النهائية

### على بيئة Render أو محلياً:

```bash
# 1) تشغيل الـ migrations لإنشاء جداول Engagement & Voice Rooms
cd backend
alembic upgrade head

# 2) (اختياري) إدخال بيانات بذرية للمهام والمتجر وعجلة الحظ
python -c "from app.services.seed_engagement import run; run()"

# 3) تشغيل الباك إند
uvicorn app.main:app --host 0.0.0.0 --port 8000

# 4) تشغيل الفرونت إند
cd ../frontend
npm install
npm run dev          # تطوير
# أو
npm run build        # إنتاج
```

---

## 📝 ملاحظات

- **لا توجد مدوالس (modals) جديدة** — كل التفاعلات inline داخل الصفحات (`EngagementHub` يستخدم تابات، `VoiceRoomsPage` يبدّل بين قائمة/إنشاء/غرفة عبر state محلي).
- جميع الـ endpoints محمية بـ `get_current_user` (JWT cookie / Bearer).
- جميع العمليات الحساسة (شراء/spin/claim) تستخدم خصومات/إضافات على `user_wallets` بشكل atomic عبر `db.commit()` بعد التحقق.
- استمرارية الجلسة عبر CORS تعمل من خلال `cors_origin_regex` في `main.py`.
