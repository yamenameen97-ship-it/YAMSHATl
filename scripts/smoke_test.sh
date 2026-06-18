#!/usr/bin/env bash
# =====================================================================
# اختبار سريع للتأكد من أن /api/auth/login يعمل ولا يرجع 503
# =====================================================================
set -e

BASE_URL="${1:-https://yamshat-1ya4.onrender.com}"

echo "→ فحص الصحة..."
curl -fsS "$BASE_URL/api/health" | jq .

echo ""
echo "→ فحص الكابتشا..."
curl -fsS "$BASE_URL/api/auth/captcha" | head -c 200

echo ""
echo "→ محاولة تسجيل دخول (بيانات خاطئة - يجب أن يرجع 401 ليس 503)..."
HTTP=$(curl -s -o /tmp/login.out -w "%{http_code}" \
  -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"identifier":"test@example.com","password":"wrongpass123"}')
echo "HTTP: $HTTP"
cat /tmp/login.out

if [ "$HTTP" = "503" ]; then
  echo "❌ ما زال يرجع 503 - تحقق من سجلات Render"
  exit 1
fi
echo "✅ خدمة login لا ترجع 503 (الحالة الحالية: $HTTP)"
