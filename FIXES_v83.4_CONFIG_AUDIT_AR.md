# تقرير الفحص الرابع — YAMSHAT v83.4

تاريخ الفحص: 2026-07-07
النطاق: مراجعة كاملة بعد إصلاحات v83.3 لاكتشاف **خمس نواقص جديدة غير مذكورة في v83.1/v83.2/v83.3**.
النتيجة: **اكتُشفت 5 نواقص حرجة جديدة وأُصلحت** + نقص مرتبط في تعبير Prometheus تم إصلاحه ضمناً.

---

## النواقص الخمسة الجديدة المُصلَحة

### 1️⃣ `backend/Dockerfile` مفقود كلياً — لا يمكن بناء صورة `yamshat/backend:v83.3`
**الملف الجديد:** `backend/Dockerfile`
**المشكلة:**
- `k8s/06-backend.yaml` (المُضاف في v83.3) يشير إلى `image: yamshat/backend:v83.3`.
- `infra/docker-compose.yml` (المُصلَح في v83.3) يستخدم `build: ../backend`.
- كل الخدمات الفرعية مثل `notification-service/Dockerfile` تنسخ `backend/requirements.txt` مما يوهم أن backend صورة قابلة للبناء.
- لكن **مجلد `backend/` لا يحتوي أي Dockerfile إطلاقاً** — فقط `nixpacks.toml` (لـ Render).

**النتائج قبل الإصلاح:**
- `docker compose up` من الجذر يفشل فوراً بـ `Cannot locate Dockerfile in ../backend`.
- سلسلة CI/CD (`docker build -t yamshat/backend:v83.3 ./backend`) تفشل ⇒ Deployment في K8s يبقى **ImagePullBackOff** إلى الأبد.
- إصلاحات v83.3 لـ `k8s/06-backend.yaml` عديمة الفائدة عملياً — Manifest صحيح، لكن لا صورة موجودة.

**الإصلاح:** أُنشئ `backend/Dockerfile` كامل:
- `python:3.11-slim` مع حزم النظام اللازمة (`libpq-dev`, `libjpeg-dev` لـ psycopg2/Pillow/reportlab).
- طبقة اعتمادات مؤقتة (`COPY requirements.txt` ثم `pip install` قبل نسخ الكود).
- مستخدم غير جذر `yamshat` للأمان.
- `HEALTHCHECK` داخلي على `/health`.
- نفس أمر الإقلاع الموجود في `nixpacks.toml`: `uvicorn app.main:application` — يضمن تطابق سلوك التطوير والإنتاج.

---

### 2️⃣ لا يوجد Deployment لـ Celery worker/beat — كل المهام الخلفية معطَّلة صامتاً
**الملف الجديد:** `k8s/12-celery.yaml`
**المشكلة:** `backend/app/celery_app.py` يعرِّف نظام Celery متكامل:
```python
celery_app = Celery('yamshat_tasks', broker=REDIS_URL, backend=REDIS_URL,
    include=['app.services.email', 'app.services.media_service',
             'app.services.notification_service', 'app.services.analytics_service'])

celery_app.conf.beat_schedule = {
    'cleanup-media-every-night': { 'schedule': crontab(hour=2, minute=0) },
    'cleanup-expired-sessions':  { 'schedule': crontab(hour=3, minute=0) },
    'cleanup-dead-rooms':        { 'schedule': crontab(minute='*/30') },
}
```
مع tasks حقيقية مثل `backend/app/services/email.py` تستعمل `@celery_app.task`.

لكن **لم يكن هناك أي `celery-worker` أو `celery-beat` Deployment في `k8s/`**. النتائج الصامتة في الإنتاج:
- كل `@celery_app.task.delay(...)` يُدفَع إلى Redis queue ⇒ يبقى للأبد بلا مستهلك.
- **إيميلات التحقق وإعادة تعيين كلمة المرور لا تُرسَل** (email.py يمر عبر celery) — فشل onboarding صامت.
- **غرف live الميتة لا تُنظَّف** ⇒ تسرُّب سجلات دائم في PostgreSQL و LiveKit.
- **جلسات refresh المنتهية لا تُمسَح** ⇒ تراكم لا نهائي في جدول الجلسات.
- **الوسائط اليتيمة على Cloudinary لا تُحذف** ⇒ فاتورة تخزين متضخمة.

لا شيء مما سبق يظهر في أي log أو dashboard — الأمر يبدو ناجحاً من طرف الـ API.

**الإصلاح:** أُضيف `k8s/12-celery.yaml` مع:
- `Deployment: celery-worker` بـ replicas=2، يعيد استخدام نفس صورة `yamshat/backend:v83.3` مع `command: celery ... worker`.
- `Deployment: celery-beat` بـ replicas=1 و `strategy: Recreate` (حرج — beat مزدوج ينتج تنفيذاً مضاعفاً لكل مهمة).
- `envFrom` من `yamshat-config` + `yamshat-secrets` (نفس النمط الموحّد).
- `livenessProbe` عبر `celery inspect ping` بدل HTTP.
- تثبيت Firebase SA لـ worker (يحتاجه لإرسال إشعارات push من tasks).

كما أُضيف تنبيه `CeleryWorkerDown` في `k8s/11-prometheus-rules.yaml` و `monitoring/alerts/app-alerts.yaml` لتجنّب تكرار المشكلة الصامتة.

---

### 3️⃣ ArgoCD Application يزامن `apps/` فقط — postgres/redis خارج التحكم كلياً
**الملفات:** `gitops-repo/argocd/app.yaml`, `gitops-repo/infra/postgres.yaml`, `gitops-repo/infra/redis.yaml`
**المشكلة:** الملف `gitops-repo/argocd/app.yaml` كان يعرّف Application واحدة فقط بـ `path: apps` ⇒ ArgoCD يزامن `gitops-repo/apps/` فقط.
لكن `gitops-repo/infra/postgres.yaml` و `redis.yaml` موجودان تحت `infra/` — **خارج مسار ArgoCD تماماً**.
مع `syncPolicy.automated.prune=true` (المضبوط في نفس الملف) نتائج ذلك:
1. **postgres/redis لا يُنشران عبر GitOps أبداً** — أي عنقود جديد يبقى بلا قاعدة بيانات.
2. أي تطبيق يدوي `kubectl apply -f k8s/03-postgres.yaml` يظهر كـ "resource خارج المصدر" ⇒ في أسوأ الحالات يُحذف عند إعادة scan.

بالإضافة إلى ذلك، الملفان `gitops-repo/infra/postgres.yaml` و `redis.yaml` كانا هيكلاً صرفاً:
- **postgres:** لا PVC، لا `POSTGRES_USER/DB/PASSWORD`، لا probes، لا resources ⇒ يقلع بمستخدم افتراضي بلا كلمة مرور ⇒ فشل مصادقة كامل من backend (الذي يستخدم `DATABASE_URL` بكلمة مرور من Secret).
- **redis:** لا `--appendonly yes` ⇒ فقدان rate-limit tokens و WebSocket presence عند أي restart ⇒ ثغرة أمنية (إعادة تعيين حدود brute-force).

**الإصلاح:**
1. `gitops-repo/argocd/app.yaml`: تحويله إلى **Application منفصلين**:
   - `yamshat-platform` (path: `apps`)  ← خدمات التطبيق (prune=true, selfHeal=true).
   - `yamshat-infra`    (path: `infra`) ← postgres/redis (prune=**false**, selfHeal=true — لتفادي حذف PVC صدفةً).
2. `gitops-repo/infra/postgres.yaml`: إعادة كتابة مطابقة لـ `k8s/03-postgres.yaml` مع PVC 10Gi، env من ConfigMap+Secret، probes، resources، وvolume دائم.
3. `gitops-repo/infra/redis.yaml`: مطابق لـ `k8s/04-redis.yaml` مع `--appendonly yes` و probes.

---

### 4️⃣ `infra/k8s/auth.yaml` بقايا zombie — `auth-service` بصورة placeholder تناقض المعمار
**الملف:** `infra/k8s/auth.yaml`
**المشكلة:** كان يعرّف:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-service
spec:
  replicas: 2
  ...
  containers:
    - name: auth
      image: auth-service:latest          # ← placeholder
```

هذا يناقض ثلاث حقائق معمارية موثّقة منذ v59.4:
1. `services/auth-service/` باقٍ فقط للتوثيق التاريخي.
2. `k8s/06-backend.yaml` هو المصدر الوحيد للحقيقة لـ auth (Backend monolith).
3. `k8s/08-gateway.yaml` يوجّه `AUTH_SERVICE_URL → http://backend:8000`.

النتائج المحتملة قبل الإصلاح:
- `kubectl apply -f infra/k8s/` من أي مطور جديد ⇒ ينشر Deployment بـ **ImagePullBackOff** فور التشغيل (لا صورة `auth-service:latest` في registry).
- يستهلك حصة pods بلا فائدة.
- يشوّه dashboard `kubectl get deployments -n app-prod` ⇒ فقدان ثقة.
- **الأخطر:** أي سكربت CI/CD قديم قد يعيد تطبيق هذا الملف بعد كل إصلاح ⇒ نفس مشكلة ArgoCD prune مع gateway في v83.3.

**الإصلاح:** تفريغه إلى شاهد قبر (tombstone) بلا موارد. توثيق سبب الحذف وإشارة إلى `k8s/06-backend.yaml` كمرجع صحيح. يمنع كل السكربتات المستقبلية من إعادة إحيائه.

---

### 5️⃣ `k8s/09-ingress.yaml` بدون TLS ولا cert-manager ⇒ تسجيل الدخول معطَّل صامتاً في الإنتاج
**الملف:** `k8s/09-ingress.yaml`
**المشكلة:** النسخة السابقة كانت **HTTP فقط** بلا `tls:`، بلا `cert-manager.io/cluster-issuer`، وبلا `ssl-redirect`. رغم أن `k8s/01-configmap.yaml` يعرّف:
```yaml
REFRESH_COOKIE_SECURE: 'true'
COOKIE_SAMESITE: none
```

نتائج ذلك في الإنتاج — علة حرجة **صامتة** لا تظهر في التطوير المحلي:

**(أ) فشل تسجيل الدخول في الإنتاج:**
- كل المتصفحات الحديثة (Chrome / Safari / Firefox / Edge) ترفض إرسال أي كوكي بخاصية `Secure` **إلا** على HTTPS.
- خاصية `SameSite=None` **تتطلب** خاصية `Secure` لتُقبل أصلاً — وإلا يُرفض الكوكي عند الإنشاء.
- ⇒ المستخدم يسجّل دخول ⇒ يستقبل `access_token` في الاستجابة ⇒ **لكن `refresh_token` cookie لا يُخزَّن أبداً** ⇒ بعد 60 دقيقة (`ACCESS_TOKEN_EXPIRE_MINUTES`) يخرج المستخدم تلقائياً بلا إمكانية تجديد.
- هذه علة لا تظهر في التطوير المحلي لأن Chrome يتجاوز فحص Secure على `localhost`.

**(ب) تكسّر WebSocket تحت الحمل:**
- nginx يفعّل `proxy_buffering` افتراضياً ⇒ رسائل الدردشة تُحجَز في buffer.
- Latency متأرجحة (spiky) على `/ws` و `/api/ws` تحت الحمل ⇒ تجربة سيئة في الغرف النشطة.

**(ج) لا آلية إصدار شهادة تلقائياً:**
- بدون `cert-manager.io/cluster-issuer` annotation، لا يوجد أي مسار مؤتمت لشهادة TLS. حتى لو أضاف الفريق `tls:` يدوياً، لن يوجد إصدار/تجديد تلقائي.

**الإصلاح:** إعادة كتابة `k8s/09-ingress.yaml` بالكامل مع:
1. قسم `tls:` كامل يُنشئ Secret اسمه `yamshat-tls`.
2. `cert-manager.io/cluster-issuer: letsencrypt-prod` (يفترض تركيب cert-manager + ClusterIssuer قياسي).
3. `ssl-redirect: 'true'` + `force-ssl-redirect: 'true'` ⇒ كل HTTP يعاد توجيهه إلى HTTPS.
4. HSTS: `hsts-max-age: 31536000` + `include-subdomains` ⇒ يمنع downgrade attacks.
5. `proxy-buffering: 'off'` + `proxy-request-buffering: 'off'` ⇒ استقرار WebSocket.

---

## نقص مرتبط أُصلح ضمناً — تعبير Prometheus خاطئ

**الملفات:** `k8s/11-prometheus-rules.yaml`, `monitoring/alerts/app-alerts.yaml`
**المشكلة:** التنبيه `BackendDown` (المُضاف في v83.2/v83.3) كان يستخدم:
```yaml
expr: up{job="backend"} == 0
```
لكن **kube-prometheus-stack مع ServiceMonitor CRD** يولّد المقياس `up` بعلامة `job` على صيغة `<namespace>/<servicemonitor-name>` (أي `monitoring/backend`) — ليس مجرد `"backend"`.

⇒ `up{job="backend"}` يعيد vector فارغ ⇒ التعبير لا يقيَّم أبداً ⇒ **التنبيه لا يُطلَق حتى لو انهارت كل pods الـ backend**. هذا يُبطِل بالكامل قصد إصلاح v83.2/v83.3.

**الإصلاح:** استبدال `job="backend"` بـ `service="backend"` (label يضيفه ServiceMonitor تلقائياً على المقاييس المكشوطة). أُضيف أيضاً `CeleryWorkerDown` لأن Gap #2 أضاف deployment جديد يستحق المراقبة.

---

## ملخّص الملفات المعدَّلة/المُنشأة

| # | الملف | الحالة |
|---|-------|--------|
| 1 | `backend/Dockerfile` | **جديد** |
| 2 | `k8s/12-celery.yaml` | **جديد** |
| 3 | `gitops-repo/argocd/app.yaml` | معدَّل (Application → ApplicationSet مزدوج) |
| 3 | `gitops-repo/infra/postgres.yaml` | إعادة كتابة كاملة |
| 3 | `gitops-repo/infra/redis.yaml` | إعادة كتابة كاملة |
| 4 | `infra/k8s/auth.yaml` | تفريغ إلى tombstone |
| 5 | `k8s/09-ingress.yaml` | إعادة كتابة كاملة مع TLS/HSTS |
| + | `k8s/11-prometheus-rules.yaml` | إصلاح selector + CeleryWorkerDown |
| + | `monitoring/alerts/app-alerts.yaml` | مزامنة |

## الاختبار الموصى به بعد النشر

1. **بناء الصورة:** `docker build -t yamshat/backend:v83.4 ./backend` ⇒ ينجح الآن.
2. **compose up:** `cd infra && docker compose up -d` ⇒ postgres + backend + celery يعملان.
3. **ArgoCD:** بعد push إلى gitops، `argocd app list` يعرض تطبيقين: `yamshat-platform` و `yamshat-infra` كلاهما `Synced/Healthy`.
4. **auth-service zombie:** `kubectl get deploy -n app-prod` ⇒ لا يوجد `auth-service` ⇒ تأكيد أن الملف zombie لم يعد ينشر شيئاً.
5. **HTTPS:** `curl -I http://api.yamshat.local/health` ⇒ 308 redirect إلى https. `curl -I https://api.yamshat.local/health` ⇒ 200 بشهادة صالحة.
6. **Cookie:** سجّل دخول ⇒ افحص DevTools > Application > Cookies ⇒ يجب أن يظهر `yamshat_refresh_token` مع `Secure` و `SameSite=None`.
7. **Celery:** `kubectl logs -n app-prod deployment/celery-beat` ⇒ يظهر "Scheduler: Sending due task cleanup-dead-rooms" كل 30 دقيقة.
8. **Prometheus:** `up{service="backend"}` في Prometheus UI ⇒ يعيد time-series حقيقية (كانت فارغة سابقاً).
