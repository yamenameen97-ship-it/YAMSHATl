# Yamshat v59.4 — إصلاح ثغرات الـ Chat Microservice + توحيد تخزين الرسائل

> **الهدف**: استكمال خطة v59.2 (التي وحَّدت نظام المجموعات) بنفس المنطق على نظام
> الدردشة: حذف microservice مكرَّر وغير آمن، وجعل **`backend monolith` المصدر الوحيد**
> للحقيقة لتخزين الرسائل (PostgreSQL/`Message` model)، مع تشديد كل المسارات.

---

## 1️⃣ المشكلة قبل التحديث

كان `services/chat-service/` يحتوي على **ملفين** متناقضين:

### `services/chat-service/main.py` — WebSocket بدائي
```python
@app.websocket('/ws')
async def chat(ws: WebSocket):
    await ws.accept()
    connections.append(ws)
    while True:
        msg = await ws.receive_text()
        for c in list(connections):
            await c.send_text(msg)
```
الثغرات:
1. **لا JWT auth إطلاقاً** — أي عميل يفتح socket بدون توكن.
2. **broadcast لكل المتصلين** — رسالة Ahmed تذهب لكل مستخدمي العالم.
3. **لا حد لحجم الرسالة** — DoS بإرسال 1 GB.
4. **لا تنظيف للاتصالات المعطّلة** — تسريب ذاكرة لا نهائي.
5. **لا ping/pong heartbeat** — اتصالات شبح.

### `services/chat-service/chat_actions_service.py` — REST منفصل
ثغرات وعيوب معمارية حرجة:
| # | الثغرة | الخطورة |
|---|--------|---------|
| 1 | `allow_origins=["*"]` + `allow_credentials=True` | **CSRF كامل** |
| 2 | **لا JWT auth على أي endpoint** — `requester_id` يأتي من body ويُصدَّق! | **انتحال شامل** |
| 3 | تخزين الرسائل في ملف JSON محلي `chat_messages_db.json` منفصل عن DB | **فقدان بيانات، عدم اتساق، تكرار** |
| 4 | لا rate-limit، لا max-length على المحتوى | **DoS و spam** |
| 5 | قراءة/كتابة الملف بلا locking (race conditions) | **فساد بيانات** |
| 6 | الـ Dockerfile يشغّل `main.py` فقط (port 8000) ⇒ `chat_actions_service` (port 8006) كان **ميتاً لكن مَنشور في الكود** | **سطح هجوم** و**ارتباك deploy** |
| 7 | `delete_for_everyone` بلا نافذة آمنة في الـ WS الـ monolith كذلك | تناسق |
| 8 | الـ ingress يوجّه `/ws` لـ `chat-service` (الإصدار البدائي) بدلاً من backend monolith الآمن | **يتجاوز كل حماية الـ monolith** |

في الوقت نفسه، الـ **monolith backend** عنده تطبيق دردشة كامل وآمن:
- `app/models/message.py` → `Message` (SQLAlchemy/PostgreSQL) مع تشفير، attachments، reactions، replies.
- `app/api/routes/chat.py` → 30+ endpoint مع JWT auth، rate-limit، malware scan، edit window.
- WebSocket `/ws/{user_id}?token=...` يتحقق من ملكية الـ JWT.

**النتيجة**: نظامان متوازيان للرسائل — أحدهما آمن (لكن متجاوَز) والآخر مكشوف.

---

## 2️⃣ ما الذي أُنجز

### 🧹 حذف microservice الدردشة (مصدر التكرار والثغرات)
- **حُذف بالكامل** المجلد `services/chat-service/` (`main.py`, `chat_actions_service.py`, `Dockerfile`, …).
- **حُذف** k8s manifest `k8s/06-chat-service.yaml`.
- **حُذف** ServiceMonitor الخاص بـ chat-service من `k8s/10-servicemonitors.yaml`.
- **حُذف** بناء `chat-service` من `infra/docker-compose.yml`.

### 🔀 إعادة توجيه كل مسارات الدردشة إلى backend monolith (المصدر الموحَّد)
- `gateway/main.py`:
  - أُضيف متغيّر بيئة جديد `BACKEND_SERVICE_URL` (افتراضي `http://backend:8000`).
  - `CHAT_SERVICE_URL` صار alias لـ `BACKEND_SERVICE_URL` ⇒ صفر تغيّر للـ clients.
  - وُسِّعت جدول التوجيه ROUTE_TABLE لتغطية:
    `/chat`, `/messages`, `/conversations`, `/inbox`, `/ws`,
    `/api/chat`, `/api/inbox`, `/api/messages`, `/api/conversations`, `/api/ws`.
- `k8s/09-ingress.yaml`:
  - `/ws` و `/api/ws` يُوجَّهان إلى `backend` (مع أنوتيشن WebSocket Upgrade nginx).
- `k8s/08-gateway.yaml`:
  - أُضيف `BACKEND_SERVICE_URL`، و `CHAT_SERVICE_URL` يُحال إلى `backend:8000`.

### 🛡️ تشديد الـ gateway (دفاع متعدد الطبقات)
- **strip headers حساسة** من الـ proxy قبل التمرير: `X-User-ID`, `X-User-Username`, `X-Internal-Token` (تمنع spoofing).
- **حد جسم أقصى** قابل للتحكم عبر `GATEWAY_MAX_BODY_BYTES` (افتراضي 20 MB) ⇒ 413 قبل لمس الـ upstream.
- إضافة `X-Forwarded-For/Proto/Host` بشكل متّسق للـ audit log في الـ backend.

### 🧱 تعزيز أمان الـ backend monolith (دفاع التطبيق)
في `backend/app/api/routes/chat.py`:
- ثوابت جديدة معلَنة بوضوح في رأس الملف:
  - `MAX_MESSAGE_LENGTH = 8000`
  - `EDIT_WINDOW_HOURS = 24`
  - `DELETE_FOR_EVERYONE_HOURS = 24`
- **`POST /chat/send_message`**: يرفض رسائل أطول من `MAX_MESSAGE_LENGTH` (413).
- **`POST /chat/edit_message`**: نفس حد الطول + استخدام الثابت بدلاً من رقم سحري.
- **`POST /chat/delete_message`**: فرض **نافذة 24 ساعة لحذف الجميع** (سلوك مثل WhatsApp) — قبل التحديث كان أي مرسل قادراً على محو رسالة عمرها سنة.

### 🗄️ سكربت ترحيل البيانات القديمة
`scripts/migrate_chat_json_to_db.py`:
- يقرأ `chat_messages_db.json` القديم من أي مسار.
- يطابق `sender_id/receiver_id` (id رقمي أو username) مع جدول `users` النشط.
- يحترم `deleted_for_everyone`, `is_edited`, `edited_at`, `timestamp`.
- **idempotent** عبر `client_id = legacy:{old_id}` (إعادة التشغيل آمنة).
- يُولِّد تقريراً JSON بجوار الملف المصدر (`*.migration-report.json`).

---

## 3️⃣ خرائط مقارنة قبل/بعد

### تخزين الرسائل
| | قبل (v59.3) | بعد (v59.4) |
|---|-------------|-------------|
| المصدر | ❌ مزدوج: PostgreSQL + ملف JSON محلي | ✅ موحَّد: PostgreSQL/`Message` فقط |
| التشفير | جزئي (الـ monolith فقط) | كل المسارات تمر عبر `encrypt_message` |
| تكامل ACID | لا (ملف JSON) | نعم (transactions) |
| الـ scaling | لا (state محلي) | نعم (DB مشترَكة) |
| النسخ الاحتياطي | لا | ✅ موجود في pg_dump العام |

### حماية WebSocket
| | قبل | بعد |
|---|------|------|
| JWT auth | ❌ لا | ✅ مطلوب + يطابق `user_id` |
| Per-user routing | ❌ broadcast للكل | ✅ `room=username:X` |
| Rate limit | ❌ لا | ✅ `allow_socket_message` |
| Heartbeat | ❌ لا | ✅ ping/pong |
| Auto-cleanup | ❌ leak | ✅ via connection_manager |

### حذف/تعديل الرسائل
| | قبل | بعد |
|---|------|------|
| من يحذف للجميع | أي شخص يُمرّر `requester_id` | المرسل فقط (JWT) |
| نافذة الحذف للجميع | غير مفعَّلة | ✅ 24 ساعة فرض صلب |
| نافذة التعديل | 24h لكن hard-coded | ✅ ثابت قابل للضبط |
| حد طول الرسالة | بلا حد | ✅ 8000 حرف (413) |

---

## 4️⃣ الملفات المتأثّرة

```
حُذف:
  services/chat-service/                                    (microservice غير آمن بالكامل)
  k8s/06-chat-service.yaml                                  (deployment + service)

أُعيد كتابتها:
  infra/docker-compose.yml                                  (إزالة chat-service، إضافة backend)
  k8s/09-ingress.yaml                                       (/ws → backend مع WS upgrade)
  k8s/10-servicemonitors.yaml                               (إزالة chat-service، إضافة backend)

عُدِّل (in-place):
  gateway/main.py                                           (توجيهات + حماية headers + max-body)
  k8s/08-gateway.yaml                                       (BACKEND_SERVICE_URL)
  backend/app/api/routes/chat.py                            (ثوابت + حد طول + نافذة حذف)

جديد:
  scripts/migrate_chat_json_to_db.py                        (ترحيل البيانات القديمة)
  CHANGELOG_v59.4_CHAT_SECURITY_UNIFY_AR.md                 (هذا الملف)
```

---

## 5️⃣ خطوات الإطلاق (Deploy Checklist)

1. **(اختياري) ترحيل بيانات قديمة**: إن كان الإنتاج يحتوي `chat_messages_db.json`:
   ```bash
   kubectl cp app-prod/chat-service-xxx:/app/chat_messages_db.json ./legacy_chat.json
   DATABASE_URL=postgresql+psycopg2://... \
     python scripts/migrate_chat_json_to_db.py ./legacy_chat.json
   ```
2. **نشر backend monolith** بالإصدار الجديد (يحتوي حدود الطول + نافذة الحذف).
3. **نشر gateway** بالإصدار الجديد (التوجيهات الجديدة + strip headers).
4. **تطبيق k8s manifests**:
   ```bash
   kubectl delete deployment chat-service -n app-prod
   kubectl delete service chat-service -n app-prod
   kubectl apply -f k8s/08-gateway.yaml -f k8s/09-ingress.yaml -f k8s/10-servicemonitors.yaml
   ```
5. **مراقبة الـ metrics**: تأكد من أن `yamshat_gateway_requests_total{path="/api/chat/..."}` يظهر `status=200` وأن latency معقول.

---

## 6️⃣ التحقق

- ✅ كل ملفات Python (`gateway/main.py`, `backend/app/api/routes/chat.py`, `scripts/migrate_chat_json_to_db.py`) تجتاز AST parsing.
- ✅ كل ملفات YAML (`docker-compose.yml`, `k8s/*.yaml`) تجتاز PyYAML safe_load.
- ✅ صفر إشارة متبقية إلى `chat-service` كـ host upstream في `gateway/`, `k8s/`, `infra/`.
- ✅ صفر إشارة إلى `chat_messages_db.json` كبديل تخزين في الـ runtime code.
- ✅ توافق رجعي كامل مع `frontend/src/api/*.js` — كل المسارات (`/api/chat/...`, `/api/inbox/...`, `/api/ws/...`) تعمل بدون أي تعديل في الواجهة.

---

**النتيجة**: نظام دردشة آمن، موحَّد، قابل للتوسع، بمصدر حقيقة واحد فقط (PostgreSQL).
لا توجد بعد الآن مسارات «خلفية» تتجاوز JWT أو تخزن رسائل في ملفات JSON محلية.
