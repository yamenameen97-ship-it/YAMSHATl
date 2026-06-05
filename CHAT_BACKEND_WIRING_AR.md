# استكمال ربط الشات بالـ Backend زر بزر — حفظ الرسائل والوسائط

تاريخ التعديل: 2026-06-05

## ✨ ملخص

تم استكمال ربط الشات (الخاص + المجموعات) بالـ Backend زر بزر،
مع إنشاء الجداول اللازمة لحفظ الرسائل والوسائط والتفاعلات
حفظاً دائماً في قاعدة البيانات.

كل التعديلات **Render-safe**: لا تكسر أي ملف موجود،
لا تغيّر أسماء ملفات/مسارات، وكل الأعمدة الجديدة nullable أو
لها قيم افتراضية حتى لا يكسر النشر على قواعد البيانات الموجودة.

---

## 🗄️ ما الذي أُضيف على قاعدة البيانات؟

### 1) أعمدة جديدة على جدول `messages`

| العمود | النوع | الغرض |
|---|---|---|
| `reply_to_id` | INTEGER FK → messages.id | معرف الرسالة المردود عليها |
| `forwarded_from_id` | INTEGER FK → messages.id | معرف الرسالة الأصلية عند التمرير |
| `edited_at` | TIMESTAMP | وقت آخر تعديل |
| `is_edited` | BOOLEAN | فلاج سريع للتعديل |
| `is_recalled` | BOOLEAN | هل تم استرجاع الرسالة |
| `expires_at` | TIMESTAMP | للرسائل المختفية تلقائياً |
| `reactions_count` | INTEGER | عدّاد سريع للتفاعلات (تفادي JOIN) |

### 2) جدول جديد: `message_reactions`

| العمود | النوع | الغرض |
|---|---|---|
| `id` | PK | |
| `message_id` | FK → messages.id (CASCADE) | الرسالة المرتبطة |
| `user_id` | FK → users.id (CASCADE) | المستخدم |
| `reaction` | VARCHAR(32) | الإيموجي أو الكود |
| `created_at` | TIMESTAMP | |

قيد فريد: `(message_id, user_id, reaction)` — يمنع التكرار ويسمح بتفاعل واحد لكل (مستخدم/إيموجي).

### 3) جدول جديد: `message_attachments`

| العمود | النوع | الغرض |
|---|---|---|
| `id` | PK | |
| `message_id` | FK → messages.id (CASCADE) | |
| `url` | TEXT | الرابط الأساسي |
| `cdn_url` | TEXT | رابط CDN (Cloudinary/ImageKit) |
| `thumbnail_url` | TEXT | صورة مصغّرة |
| `kind` | VARCHAR(20) | image / video / audio / voice / file / gif / sticker |
| `mime_type` | VARCHAR(128) | |
| `file_name` | VARCHAR(255) | |
| `file_size` | BIGINT | حجم بالبايت |
| `width`, `height` | INTEGER | للوسائط البصرية |
| `duration_seconds` | FLOAT | للصوت/الفيديو |
| `waveform` | TEXT (JSON) | تموجات الصوت لرسائل voice |
| `position` | INTEGER | ترتيب المرفق داخل ألبوم |

هذا الجدول يفك القيد القديم (رابط واحد فقط لكل رسالة) ويسمح
برسالة واحدة بأكثر من صورة/فيديو/ملف.

### 4) جدول `chat_typing_state` (اختياري)

لـ HTTP fallback لمؤشر الكتابة (في حال انقطاع Socket).

### 5) فهرس مركّب جديد على messages

`(sender_id, receiver_id, id)` — لإسراع جلب صفحة محادثة.

---

## 🔌 ما الذي أُضيف على الـ API؟

### Endpoints جديدة في `/api/chat`

| Method | Path | الغرض |
|---|---|---|
| POST | `/edit_message` | تعديل نص رسالة (نافذة 24 ساعة) |
| POST | `/forward_message` | تمرير رسالة لعدة مستلمين/مجموعات |
| GET | `/search_messages` | بحث نصي بكامل/داخل محادثة |
| POST | `/typing` | إرسال حالة الكتابة (HTTP) |
| GET | `/{message_id}/reactions` | كل التفاعلات + ملخص |
| DELETE | `/{message_id}/react` | إزالة تفاعل |
| POST | `/{message_id}/react` | إضافة/تبديل تفاعل (toggle) |

### تحسينات على `POST /send_message`

الـ payload الآن يدعم:

```json
{
  "receiver": "user_or_group_id",
  "message": "text...",
  "type": "text|image|video|audio|voice|file",
  "client_id": "uuid-for-idempotency",
  "media_url": "single-url (legacy)",
  "attachments": [
    {
      "url": "https://...",
      "cdn_url": "https://...",
      "thumbnail_url": "https://...",
      "kind": "image",
      "mime_type": "image/png",
      "file_name": "photo.png",
      "file_size": 12345,
      "width": 1920,
      "height": 1080,
      "duration_seconds": null,
      "waveform": null,
      "position": 0
    }
  ],
  "reply_to_id": 123,
  "forwarded_from_id": 456,
  "disappearing_in_seconds": 86400
}
```

### تحسينات على Recall و Reactions

- **Recall**: كان placeholder → الآن يكتب فعلياً `is_recalled = true`، يحذف
  المحتوى للطرفين، ويتحقق من نافذة الساعة.
- **Reactions**: كان placeholder بدون DB → الآن يحفظ في
  `message_reactions` ويبث `message_reaction` عبر Socket.IO.

### تحسينات `serialize_message`

الـ payload المُرجَع من الـ backend صار يتضمن (تلقائياً لكل رسالة):

- `attachments[]` — المرفقات المتعددة
- `reply_to` — معاينة الرسالة المردود عليها (`{id, sender, content, media_url, ...}`)
- `reply_to_id`, `forwarded_from_id`, `is_forwarded`
- `is_edited`, `edited_at`, `is_recalled`, `expires_at`
- `reactions` — `{ summary: [{reaction, count}], total }`
- `reactions_count`

كل هذا متوافق مع الـ frontend الحالي ولا يكسر العقود القديمة
(`media_url`, `content`, `type`, إلخ كلها لا تزال موجودة).

---

## 🎨 ما الذي أُضيف على Frontend (`src/api/chat.js`)؟

```js
// جديد:
sendRichMessage(payload)
editMessage(message_id, content)
forwardMessage(message_id, receivers[])
recallMessage(message_id)
reactToMessage(message_id, reaction)        // toggle
unreactToMessage(message_id, reaction?)
getMessageReactions(message_id)
searchMessagesApi(q, { peer?, limit? })
sendTypingState(to, isTyping)
applyRetentionPolicy(chat_id, '24h'|'7d'|'30d'|'forever')
```

كلها تستخدم نفس instance `axios` المُدار مركزياً (مع الـ
auth interceptor, CSRF, إعادة المحاولة, الكاش).

---

## 🚀 خطوات النشر

### على Render أو أي بيئة Postgres:

```bash
cd backend
alembic upgrade head    # سيطبق 20260605_0005_chat_messages_full_wiring
```

أو إذا كنت تعتمد على bootstrap التلقائي عند الإقلاع، فقد تم
تحديث `db/bootstrap.py` ليرفع `CURRENT_ALEMBIC_REVISION` إلى
`20260605_0005`، وأضيفت كل الأعمدة الجديدة عبر
`_add_column_if_missing` تلقائياً.

### Frontend

`npm run build` كالعادة — لا يحتاج خطوات إضافية.
الـ endpoints الجديدة كلها متوافقة مع الـ backend أعلاه.

---

## ✅ Socket.IO Events الجديدة

| الحدث | متى يُبث | الحمولة |
|---|---|---|
| `message_edited` | بعد POST /edit_message | كامل الرسالة بعد التعديل |
| `message_reaction` | بعد POST/DELETE /{id}/react | `{message_id, user, reaction, action, total, summary}` |

الأحداث القديمة (`new_private_message`, `new_message`, `message_deleted`,
`messages_delivered`, `messages_seen`, `new_notification`) لم تتغير.

---

## 🛡️ ملاحظات أمان

- كل الـ endpoints الجديدة محمية بـ `get_current_user`.
- `edit_message` و `recall_message` يتحققان أن `sender_id == current_user.id`.
- نافذة التعديل: 24 ساعة. نافذة الـ recall: ساعة.
- `forward_message` يتحقق من الـ block status لكل مستلم.
- المرفقات المُرسلة تمر على `scan_media_for_malware` قبل الحفظ.
- `bleach.clean` على نصوص الرسائل المعدّلة.

---

## 📦 الملفات المُعدَّلة / المضافة

### مضاف:
- `backend/alembic/versions/20260605_0005_chat_messages_full_wiring.py`
- `backend/app/models/message_reaction.py`
- `backend/app/models/message_attachment.py`
- `CHAT_BACKEND_WIRING_AR.md` (هذا الملف)

### مُعدَّل:
- `backend/app/models/message.py` — أعمدة جديدة + علاقات
- `backend/app/models/__init__.py` — تسجيل النماذج الجديدة
- `backend/app/api/routes/chat.py` — endpoints جديدة + حذف كود مكرر ميت
- `backend/app/services/chat_features.py` — تنفيذ فعلي لـ recall + reactions + retention
- `backend/app/services/chat_realtime.py` — `serialize_message` صار يضم attachments/reactions/reply
- `backend/app/db/bootstrap.py` — أعمدة جديدة + رفع `CURRENT_ALEMBIC_REVISION`
- `frontend/src/api/chat.js` — أغلفة جديدة للـ endpoints

---

## 🧪 اختبار سريع

```bash
# 1) تأكد أن الـ migration تعمل
cd backend && alembic upgrade head

# 2) شغّل backend
uvicorn app.main:app --reload

# 3) اختبر إرسال رسالة مع مرفقات متعددة
curl -X POST http://localhost:8000/api/send_message \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "receiver": "yamen",
    "message": "ألبوم صور",
    "type": "image",
    "attachments": [
      {"url": "/uploads/a.jpg", "kind": "image", "mime_type": "image/jpeg", "position": 0},
      {"url": "/uploads/b.jpg", "kind": "image", "mime_type": "image/jpeg", "position": 1}
    ]
  }'

# 4) اختبر التعديل
curl -X POST http://localhost:8000/api/edit_message \
  -H "Authorization: Bearer <token>" \
  -d '{"message_id": 1, "content": "نص محدث"}'

# 5) اختبر تفاعل
curl -X POST http://localhost:8000/api/1/react \
  -H "Authorization: Bearer <token>" \
  -d '{"reaction": "❤️"}'

# 6) بحث
curl -G http://localhost:8000/api/search_messages \
  -H "Authorization: Bearer <token>" \
  --data-urlencode "q=ألبوم"
```

---

تم إكمال الربط بالكامل ✅
