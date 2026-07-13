# v87.11 — استكمال نظام الستوري (Close Friends + Hide Story From)

هذه الحزمة تُصلح النقصَين المتبقيَين في نظام الستوري بعد v87.10:

| # | النقص | الحالة السابقة | v87.11 |
|---|-------|----------------|--------|
| 1 | إدارة الأصدقاء المقربين (Close Friends) | Backend موجود (model + 3 endpoints) لكن **لا صفحة UI للإدارة** | ✅ صفحة كاملة `/settings/stories/close-friends` |
| 2 | إخفاء القصة من مستخدمين محددين (Hide Story From) | مجرد مصفوفة فارغة في localStorage — لا model ولا API ولا تأثير حقيقي | ✅ model + migration + 3 endpoints + صفحة + منطق رؤية فعّال |

---

## 1) Close Friends — صفحة إدارة كاملة

### قبل v87.11
- الـ Backend كان جاهزاً بالفعل:
  - `backend/app/models/close_friend.py` — الجدول موجود.
  - في `users.py`: `GET /users/me/close-friends` و`POST /users/close-friends` و`DELETE /users/close-friends/{username}`.
  - منطق الرؤية في `story_db_service.py` يستخدم `_load_close_friend_ids()` بالفعل.
- لكن في الواجهة كان هناك فقط زر تبديل `closeFriendsOnly` في إعدادات الستوري، **دون أي طريقة لإضافة/إزالة أعضاء القائمة**.

### بعد v87.11
- ملف جديد: `frontend/src/pages/settings/CloseFriendsManagerPage.jsx`
  - عرض قائمة المقربين الحاليين (اسم مستخدم، أفاتار، تاريخ الإضافة).
  - زر «إضافة صديق مقرّب» يفتح `UserPickerModal` مع بحث فوري.
  - زر «إزالة» بجوار كل عضو.
- ملف جديد: `frontend/src/components/stories/UserPickerModal.jsx`
  - نافذة قابلة لإعادة الاستخدام تعرض قائمة المستخدمين مع خانة بحث.
  - تستبعد الأعضاء الموجودين مسبقاً من نتائج البحث.
- إضافات في `frontend/src/api/users.js`: لا شيء جديد (الدوال موجودة أصلاً).
- إضافة route في `App.jsx`: `/settings/stories/close-friends`.
- في `StoriesSettingsPage.jsx`: زر «فتح» جديد يقود إلى الصفحة.

---

## 2) Hide Story From — تنفيذ كامل من الصفر

### قبل v87.11
- `hideStoryFrom: []` في `StoriesSettingsPage.jsx` فقط، محفوظاً في localStorage.
- لا model، لا migration، لا endpoint، لا منطق يستبعد المستخدم فعلياً من رؤية القصص.
- أي مستخدم "مُخفى" عنه كان لا يزال يرى كل القصص كالمعتاد.

### بعد v87.11

#### الـ Backend
**ملف جديد**: `backend/app/models/hidden_story_user.py`
```python
class HiddenStoryUser(Base):
    __tablename__ = 'hidden_story_users'
    id, owner_id (FK users), hidden_id (FK users), created_at
    UNIQUE(owner_id, hidden_id)
```

**Alembic migration جديدة**: `backend/alembic/versions/20260712_0015_hidden_story_users.py`
- تنشئ الجدول بأمان (idempotent — تتجاهل إذا كان الجدول موجوداً).
- `down_revision = "20260707_0014"`.

**تسجيل في** `backend/app/models/__init__.py`.

**3 endpoints جديدة في** `backend/app/api/routes/users.py`:
| Method | Path | الغاية |
|--------|------|--------|
| GET  | `/users/me/hidden-story-users`     | جلب القائمة الحالية |
| POST | `/users/hide-story-from`           | إضافة مستخدم `{ username }` |
| DELETE | `/users/hide-story-from/{username}` | إزالة مستخدم |

**دمج في منطق الرؤية** — `backend/app/services/story_db_service.py`:
- دالتان مساعدتان جديدتان:
  - `_load_hidden_from_me_ids(db, viewer_id)` — الحسابات التي أخفت قصصها عني.
  - `_load_my_hidden_targets(db, owner_id)` — من أخفيت قصصي عنه (احتياطي).
- في `_visible_filter()` (شريط `/stories` و`/stories/grouped`):
  - يُطرح `hidden_from_me` من `friends` و`close`.
  - يُضاف إلى قائمة الاستبعاد `~Story.user_id.in_(...)` — double-safety.
- في `list_user_stories()` (deep-link `/stories/user/{user_id}`):
  - إن كان `target_user_id` أخفى قصصه عني → `PermissionError('Hidden')` (يظهر 403 في الواجهة).
- في `get_story()` (قصة مفردة):
  - نفس الفحص → `PermissionError('Hidden')`.

#### الـ Frontend
**ملف جديد**: `frontend/src/pages/settings/HideStoryFromPage.jsx`
- تحذير مرئي بأن هذا يخصّ القصص فقط (بخلاف الحظر الكامل).
- عرض القائمة الحالية + زر «إظهار» لإزالة أي عضو.
- زر «إخفاء القصة من مستخدم» يفتح `UserPickerModal`.

**إضافات في** `frontend/src/api/users.js`:
```js
export const getHiddenStoryUsers = () => API.get('/users/me/hidden-story-users', …);
export const addHiddenStoryUser = (username) => API.post('/users/hide-story-from', { username });
export const removeHiddenStoryUser = (username) => API.delete(`/users/hide-story-from/${username}`);
```

**route جديد في** `App.jsx`: `/settings/stories/hide-from`.

**زر «فتح» جديد** في `StoriesSettingsPage.jsx` يقود إلى الصفحة.

---

## قواعد الأمان
- كلا الجدولين (`close_friends` و`hidden_story_users`) يعتمدان `ON DELETE CASCADE` على `users.id` — لا يبقى صف يتيم عند حذف حساب.
- `UniqueConstraint(owner_id, hidden_id)` يمنع تكرار الصفوف.
- تحقق `Cannot hide from yourself` في نقطة النهاية.
- الفلترة تعمل بشكل idempotent: طلب إضافة مستخدم مضاف مسبقاً لا يفشل ولا يُنشئ صفاً مكرراً.
- المنطق الجديد لا يمسّ الحظر الحالي (`user_blocks`) — بل يعمل بالإضافة إليه.

## ملفات مُعدَّلة أو مُضافة
```
Added   backend/app/models/hidden_story_user.py
Added   backend/alembic/versions/20260712_0015_hidden_story_users.py
Added   frontend/src/pages/settings/CloseFriendsManagerPage.jsx
Added   frontend/src/pages/settings/HideStoryFromPage.jsx
Added   frontend/src/components/stories/UserPickerModal.jsx

Modified backend/app/models/__init__.py            (تسجيل HiddenStoryUser)
Modified backend/app/api/routes/users.py           (3 endpoints جديدة)
Modified backend/app/services/story_db_service.py  (دمج hide في الفلترة)
Modified frontend/src/api/users.js                 (3 دوال API جديدة)
Modified frontend/src/App.jsx                      (routes جديدة + lazy imports)
Modified frontend/src/pages/settings/StoriesSettingsPage.jsx (أزرار «فتح»)

Added   FIXES_v87.11_STORIES_COMPLETENESS_AR.md
```

## خطوات النشر
1. تطبيق الـ migration الجديدة عند الإقلاع (تتم تلقائياً في `db.bootstrap.initialize_database`).
2. إعادة بناء الفرونت (`npm run build`) — لا مكتبات جديدة مطلوبة.
