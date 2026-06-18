-- =====================================================================
-- مايجريشن: فهارس تسريع تسجيل الدخول
-- =====================================================================
-- تشغيل مرة واحدة على قاعدة بيانات الإنتاج عبر Render Dashboard → PSQL
-- =====================================================================

-- فهرس على lower(email) - يطابق الاستعلام بالضبط
CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_users_lower_email
  ON users (lower(email));

-- فهرس على lower(username)
CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_users_lower_username
  ON users (lower(username));

-- فهرس مركّب على is_active
CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_users_is_active_email
  ON users (is_active, lower(email)) WHERE is_active = true;

-- إحصائيات محدّثة
ANALYZE users;
