import AdminLayout from '../../components/admin/AdminLayout.jsx';
import AnalyticsDashboard from '../../admin/components/AnalyticsDashboard.jsx';

/**
 * ========================================================================
 * AdminAnalytics — لوحة التحليلات التفاعلية والتقارير القابلة للتصدير
 * v89.34 — ADMIN_ANALYTICS_INTERACTIVE_CHARTS_AND_EXPORT
 * ------------------------------------------------------------------------
 * تعالج هذه الصفحة النقص الموضّح في وثائق المراجعة:
 *  ❌ قبل: لوحة تحكم الإدارة تفتقر إلى رسوم بيانية تفاعلية متقدمة توضح
 *          معدلات نشاط المستخدمين بشكل زمني، بالإضافة إلى غياب ميزة تصدير
 *          البيانات الشاملة للمسؤولين بصيغ مثل PDF أو CSV.
 *  ✅ بعد: رسوم بيانية متقدمة (Line/Area/Bar/Pie/Radar) عبر Recharts
 *          + تصدير كامل للبيانات إلى PDF (نافذة الطباعة الأصلية)
 *          + تصدير إلى CSV مع دعم UTF-8 BOM للعربية في Excel.
 *  🎯 بدون إضافة أي مكتبات جديدة (recharts موجودة أصلاً).
 * ========================================================================
 */
export default function AdminAnalytics() {
  return (
    <AdminLayout>
      <div dir="rtl" style={{ fontFamily: "'Noto Sans Arabic', system-ui, sans-serif" }}>
        <AnalyticsDashboard />
      </div>
    </AdminLayout>
  );
}
