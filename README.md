# YAMSHAT Production Platform

تم تحويل المشروع إلى منصة **FastAPI Microservices + Kubernetes + GitHub Actions + GitOps + Observability**.

## المكونات الجديدة
- `user-service/` لخدمات المستخدمين والمصادقة والمنشورات والتعليقات والمتابعة
- `chat-service/` للمحادثات و WebSocket و inbox
- `notification-service/` للإشعارات
- `gateway/` كبوابة API مع Distributed Rate Limiting باستخدام Redis Token Bucket
- `k8s/` لجميع ملفات Kubernetes الجاهزة للنشر
- `.github/workflows/` لخطوط CI/CD و GitOps
- `gitops-repo/` نموذج GitOps Repository مع ArgoCD
- `monitoring/` لإعداد Prometheus / Grafana / Loki / Jaeger / Alertmanager

## التشغيل المحلي
```bash
docker compose up --build
```

## مسارات مهمة
- Gateway: `http://localhost:8000`
- Health: `http://localhost:8000/health`
- Metrics: `http://localhost:8000/metrics`
- WebSocket chat مباشر من `chat-service` عبر مسار `/ws` في Ingress

## GitHub Secrets المطلوبة
- `DOCKER_USERNAME`
- `DOCKER_PASSWORD`
- `KUBE_CONFIG`
- `GITOPS_REPO_TOKEN`

## النشر التقليدي
```bash
kubectl apply -f k8s/
```

## تفعيل ArgoCD
```bash
./scripts/install-argocd.sh
```

## ملاحظات Production
- استخدم image tags مبنية على `${GITHUB_SHA}` بدل `latest` في الإنتاج
- عدّل قيم `your-dockerhub-username` داخل ملفات `k8s/` و `gitops-repo/`
- أنشئ Secret حقيقي بدل `k8s/02-secrets.example.yaml`
