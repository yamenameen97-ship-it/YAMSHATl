# v87.12 — استكمال نظام الستوري (كتم القصص + مكتبة الموسيقى)

هذه الحزمة تُصلح النقصَين المتبقيَين في نظام الستوري بعد v87.11:

| # | النقص | الحالة السابقة | v87.12 |
|---|-------|----------------|--------|
| 1 | كتم قصص مستخدم (Mute User Stories) | غير موجود | ✅ model + migration + 3 endpoints + منطق رؤية فعّال + صفحة إدارة + زر في العارض |
| 2 | الأصوات/الموسيقى: الحقل موجود كنص فقط، بدون مكتبة أو دمج فعلي | حقل نصي فارغ `music` في StoryEditor | ✅ كتالوج موسيقى مدمج + endpoint + مُنتقي موسيقى مع معاينة + مشغل خلفية فعلي في العارض |

---

## 1) كتم قصص مستخدم (Mute User Stories) — تنفيذ كامل من الصفر

### قبل v87.12
- لا يوجد model، لا migration، لا endpoint، لا منطق.
- `UserMute` الموجود هو كتم عام (يؤثر على الإشعارات والبوستات)، وليس مخصصاً للقصص.
- لم يكن بإمكان المستخدم كتم قصص شخص ما دون حظره بالكامل.

### بعد v87.12

#### الـ Backend
**ملف جديد**: `backend/app/models/muted_story_user.py`
```python
class MutedStoryUser(Base):
    __tablename__ = 'muted_story_users'
    id, muter_id (FK users), muted_id (FK users), created_at
    UNIQUE(muter_id, muted_id)
```

**Alembic migration جديدة**: `backend/alembic/versions/20260712_0016_muted_story_users.py`
- تنشئ الجدول بأمان (idempotent).
- `down_revision = "20260712_0015"`.

**تسجيل في** `backend/app/models/__init__.py`.

**استيراد في** `backend/app/api/routes/users.py`.

**3 endpoints جديدة في** `backend/app/api/routes/users.py`:
| Method | Path | الغاية |
|--------|------|--------|
| GET  | `/users/me/muted-story-users`     | جلب القائمة الحالية |
| POST | `/users/mute-story`               | كتم قصص مستخدم `{ username }` |
| POST | `/users/unmute-story`             | إلغاء كتم قصص مستخدم `{ username }` |

**دمج في منطق الرؤية** — `backend/app/services/story_db_service.py`:
- دالة مساعدة جديدة: `_load_muted_story_ids(db, viewer_id)` — المستخدمون المكتومة قصصهم.
- في `_visible_filter()` (شريط `/stories` و`/stories/grouped`):
  - يُطرح `muted_stories` من `friends` و`close`.
  - يُضاف إلى قائمة الاستبعاد `~Story.user_id.in_(...)`.
- في `serialize_story()`:
  - حقل جديد `is_muted_by_viewer` في الرد — يخبر الواجهة إذا كان المشاهد قد كتم قصص صاحب القصة.

#### الـ Frontend
**ملف جديد**: `frontend/src/pages/settings/MutedStoriesPage.jsx`
- عرض قائمة المستخدمين المكتومة قصصهم.
- زر «كتم قصص مستخدم» يفتح `UserPickerModal`.
- زر «إلغاء الكتم» بجوار كل عضو.
- شرح الفرق بين الكتم والحظر.

**إضافات في** `frontend/src/api/stories.js`:
```js
export const getMutedStoryUsers = () => API.get('/users/me/muted-story-users', …);
export const muteUserStories = (username) => API.post('/users/mute-story', { username });
export const unmuteUserStories = (username) => API.post('/users/unmute-story', { username });
```

**route جديد في** `App.jsx`: `/settings/stories/muted`.

**زر «فتح» جديد** في `StoriesSettingsPage.jsx` يقود إلى الصفحة.

**زر في عارض الستوري** (`StoryViewerEnhanced.jsx`):
- زر 🔕 لكل قصة ليست لي — عند الضغط يكتم/يُلغي كتم قصص المستخدم.
- حالة الزر تتحدث فورياً (optimistic) من حقل `is_muted_by_viewer`.

---

## 2) مكتبة الموسيقى والدمج الفعلي — تنفيذ كامل

### قبل v87.12
- `StoryEditor.jsx` يحتوي حقل نصي `music` فقط — المستخدم يكتب نصاً لا يُشغَّل أبداً.
- `StoryViewerEnhanced.jsx` لا يشغّل أي موسيقى خلفية.
- الـ Backend يخزن حقل `music` كنص خام بلا معنى عملي.

### بعد v87.12

#### الـ Backend
**كتالوج موسيقى مدمج** في `story_db_service.py`:
```python
STORY_MUSIC_CATALOG = {
    'none': '',  'upbeat': '/sounds/story/upbeat.mp3',
    'chill': '/sounds/story/chill.mp3',  'romantic': '/sounds/story/romantic.mp3',
    'epic': '/sounds/story/epic.mp3',  'fun': '/sounds/story/fun.mp3',
    'sad': '/sounds/story/sad.mp3',  'party': '/sounds/story/party.mp3',
    'lofi': '/sounds/story/lofi.mp3',  'acoustic': '/sounds/story/acoustic.mp3',
    'ambient': '/sounds/story/ambient.mp3',  'cinematic': '/sounds/story/cinematic.mp3',
}
```

**دالة تحويل**: `_resolve_music_url(music_field)` — تحول مفتاح الكتالوج إلى رابط ملف صوتي.
- تدعم أيضاً الروابط الخارجية (http/https) كمدخلات مباشرة.

**endpoint جديد** في `stories.py`:
| Method | Path | الغاية |
|--------|------|--------|
| GET  | `/stories/music-catalog`  | جلب كتالوج الموسيقى المتاح |

**تحسين التسلسل**: `serialize_story()` يضيف حقل `music_url` — رابط ملف الموسيقى الفعلي.

#### الـ Frontend
**مُنتقي موسيقى كامل** في `StoryEditor.jsx`:
- زر يفتح نافذة مكتبة الموسيقى.
- كل مقطع له زر معاينة (▶ / ⏸) لتجربة الصوت قبل النشر.
- اختيار المقطع يحفظ مفتاحه (مثل 'upbeat', 'chill') في حقل `music`.
- نظافة: إيقاف المعاينة عند إغلاق المحرر.

**مشغل موسيقى خلفية** في `StoryViewerEnhanced.jsx`:
- عند فتح قصة لها `music_url`، يُشغّل الموسيقى تلقائياً.
- زر 🎶/🎵 لكتم/تشغيل الموسيقى (منفصل عن كتم صوت الفيديو).
- إيقاف الموسيقى عند الانتقال بين القصص أو إغلاق العارض.

---

## قواعد الأمان
- جدول `muted_story_users` يعتمد `ON DELETE CASCADE` على `users.id`.
- `UniqueConstraint(muter_id, muted_id)` يمنع تكرار الصفوف.
- تحقق `Cannot mute your own stories` في الـ endpoint.
- الكتم لا يؤثر على الحظر (`user_blocks`) أو الإخفاء (`hidden_story_users`) — مستقل تماماً.
- ملفات الموسيقى المدمجة في `/sounds/story/` — يمكن استبدالها بملفات حقيقية لاحقاً.

## ملفات مُعدَّلة أو مُضافة
```
Added   backend/app/models/muted_story_user.py
Added   backend/alembic/versions/20260712_0016_muted_story_users.py
Added   frontend/src/pages/settings/MutedStoriesPage.jsx
Added   FIXES_v87.12_STORIES_MUTE_MUSIC_AR.md

Modified backend/app/models/__init__.py             (تسجيل MutedStoryUser)
Modified backend/app/api/routes/users.py            (3 endpoints جديدة + استيراد)
Modified backend/app/api/routes/stories.py          (endpoint كتالوج الموسيقى)
Modified backend/app/services/story_db_service.py   (كتالوج موسيقى + دمج mute في الفلترة + is_muted_by_viewer)
Modified frontend/src/api/stories.js                (3 دوال mute + كتالوج موسيقى)
Modified frontend/src/components/stories/StoryEditor.jsx       (مُنتقي موسيقى كامل)
Modified frontend/src/components/stories/StoryViewerEnhanced.jsx (مشغل موسيقى + زر كتم القصص)
Modified frontend/src/pages/settings/StoriesSettingsPage.jsx    (زر «فتح» للقصص المكتومة)
Modified frontend/src/App.jsx                        (route جديد + lazy import)
```

## خطوات النشر
1. تطبيق الـ migration الجديدة عند الإقلاع (تتم تلقائياً في `db.bootstrap.initialize_database`).
2. وضع ملفات الموسيقى في `frontend/public/sounds/story/` (upbeat.mp3, chill.mp3, …).
3. إعادة بناء الفرونت (`npm run build`) — لا مكتبات جديدة مطلوبة.
