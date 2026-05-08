import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import EmptyState from '../../components/feedback/EmptyState.jsx';
import ErrorState from '../../components/feedback/ErrorState.jsx';
import { AdminOverviewSkeleton } from '../../components/feedback/Skeleton.jsx';
import { exportAdminReport, getAdminReportsSummary } from '../../api/admin.js';
import { DonutChart } from '../../components/admin/Charts.jsx';
import { useToast } from '../../components/admin/ToastProvider.jsx';

function saveBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.URL.revokeObjectURL(url);
}

const defaultSummary = {
  totals: {},
  roles: [],
  generated_at: '',
  report_management: {},
  revenue_dashboard: {},
  audit_logs: [],
  admin_activity: [],
};

export default function AdminReports() {
  const [summary, setSummary] = useState(defaultSummary);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exportingFormat, setExportingFormat] = useState('');
  const { pushToast } = useToast();

  const hasData = Boolean(
    Object.keys(summary.totals || {}).length ||
    (summary.roles || []).length ||
    summary.generated_at ||
    Object.keys(summary.report_management || {}).length ||
    Object.keys(summary.revenue_dashboard || {}).length ||
    (summary.audit_logs || []).length
  );

  const loadSummary = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await getAdminReportsSummary();
      setSummary({ ...defaultSummary, ...(data || {}) });
    } catch (err) {
      setError(err?.response?.data?.detail || 'تعذر تحميل ملخص التقارير حالياً.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  const handleExport = async (format) => {
    setExportingFormat(format);
    setError('');
    try {
      const { data } = await exportAdminReport(format);
      saveBlob(data, `yamshat-admin-report.${format}`);
      pushToast({ title: `تم تصدير ${format.toUpperCase()}`, description: 'الملف جاهز للتحميل.', type: 'success' });
    } catch (err) {
      const message = err?.response?.data?.detail || `تعذر تصدير ملف ${format.toUpperCase()} حالياً.`;
      setError(message);
      pushToast({ title: 'تعذر التصدير', description: message, type: 'error' });
    } finally {
      setExportingFormat('');
    }
  };

  const insights = useMemo(() => {
    const totals = summary.totals || {};
    const users = Number(totals.users || 0);
    const activeUsers = Number(totals.active_users || 0);
    const posts = Number(totals.posts || 0);
    const comments = Number(totals.comments || 0);
    const messages = Number(totals.messages || 0);
    const activityRate = users ? Math.round((activeUsers / users) * 100) : 0;
    const engagementLoad = posts ? Math.round(((comments + messages) / posts) * 100) : 0;
    return [
      { key: 'activity', label: 'معدل النشاط', value: `${activityRate}%`, description: 'نسبة المستخدمين النشطين إلى إجمالي المستخدمين.' },
      { key: 'engagement', label: 'Advanced Analytics', value: `${engagementLoad}%`, description: 'مؤشر مبسط للعلاقة بين المحتوى والتفاعل والرسائل.' },
      { key: 'generated', label: 'آخر توليد', value: summary.generated_at ? new Date(summary.generated_at).toLocaleString('ar-EG') : '—', description: 'توقيت آخر ملخص تم سحبه من الباك إند.' },
    ];
  }, [summary]);

  if (loading && !hasData) {
    return (
      <AdminLayout>
        <AdminOverviewSkeleton />
      </AdminLayout>
    );
  }

  if (error && !hasData) {
    return (
      <AdminLayout>
        <ErrorState title="تعذر تحميل التقارير" description={error} onRetry={loadSummary} />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {error ? <div className="alert error">{error}</div> : null}

      <section className="dashboard-hero-grid small-gap">
        <Card className="hero-card">
          <h3 className="section-title">Report Management & Advanced Analytics</h3>
          <p className="muted">التقارير دلوقتي فيها Audit Logs و User Reports و Stream Reports و Revenue Dashboard جنب التصدير لـ PDF و Excel.</p>
          <div className="action-row wide">
            <Button loading={exportingFormat === 'pdf'} disabled={Boolean(exportingFormat)} onClick={() => handleExport('pdf')}>تصدير PDF</Button>
            <Button variant="secondary" loading={exportingFormat === 'xlsx'} disabled={Boolean(exportingFormat)} onClick={() => handleExport('xlsx')}>تصدير Excel</Button>
            <Button variant="secondary" loading={loading} disabled={loading} onClick={loadSummary}>تحديث الملخص</Button>
          </div>
        </Card>
        <Card>
          <h3 className="section-title">ملخص سريع</h3>
          {Object.keys(summary.totals || {}).length ? (
            <div className="status-list compact-grid">
              <div><strong>{summary.totals?.users || 0}</strong><span>مستخدم</span></div>
              <div><strong>{summary.totals?.active_users || 0}</strong><span>نشط</span></div>
              <div><strong>{summary.totals?.posts || 0}</strong><span>منشور</span></div>
              <div><strong>{summary.totals?.messages || 0}</strong><span>رسالة</span></div>
            </div>
          ) : (
            <EmptyState icon="🗂️" title="لا يوجد ملخص جاهز بعد" description="بمجرد توفر أرقام من الباك إند سيظهر الملخص هنا تلقائياً." actionLabel="تحديث الآن" onAction={loadSummary} />
          )}
        </Card>
      </section>

      <section className="kpi-grid">
        {insights.map((item) => (
          <Card key={item.key} className="kpi-card">
            <div className="kpi-label">{item.label}</div>
            <div className="kpi-value">{item.value}</div>
            <div className="muted">{item.description}</div>
          </Card>
        ))}
      </section>

      <section className="two-column-grid">
        <Card>
          <div className="card-head"><h3 className="section-title">Report Management</h3></div>
          {Object.keys(summary.report_management || {}).length ? (
            <div className="queue-grid compact-cards">
              <div className="queue-card compact"><span className="queue-label">Open Reports</span><strong>{summary.report_management.open_reports || 0}</strong><p>إجمالي البلاغات المفتوحة.</p></div>
              <div className="queue-card compact"><span className="queue-label">User Reports</span><strong>{summary.report_management.user_reports || 0}</strong><p>بلاغات مرتبطة بالمستخدمين.</p></div>
              <div className="queue-card compact"><span className="queue-label">Stream Reports</span><strong>{summary.report_management.stream_reports || 0}</strong><p>بلاغات مرتبطة بالبث والغرف الحية.</p></div>
              <div className="queue-card compact"><span className="queue-label">Shadow Ban</span><strong>{summary.report_management.shadow_banned_users || 0}</strong><p>عدد الحسابات الموجودة ضمن الشادو بان.</p></div>
            </div>
          ) : (
            <EmptyState icon="🚨" title="لا توجد بيانات تقارير حالياً" description="سيظهر هذا القسم بعد وصول بلاغات أو بيانات مراجعة." />
          )}
        </Card>

        <Card>
          <div className="card-head"><h3 className="section-title">Revenue Dashboard</h3></div>
          {Object.keys(summary.revenue_dashboard || {}).length ? (
            <div className="status-list compact-grid">
              <div><strong>{summary.revenue_dashboard.coins_earned || 0}</strong><span>Coins Earned</span></div>
              <div><strong>{summary.revenue_dashboard.coins_spent || 0}</strong><span>Coins Spent</span></div>
              <div><strong>{summary.revenue_dashboard.coins_balance || 0}</strong><span>Balance</span></div>
              <div><strong>${(summary.revenue_dashboard.estimated_revenue || 0).toFixed(2)}</strong><span>Estimated Revenue</span></div>
            </div>
          ) : (
            <EmptyState icon="💰" title="لا توجد بيانات مالية بعد" description="عند توفر بيانات المحافظ سيتم عرض الإيرادات هنا." />
          )}
        </Card>
      </section>

      <section className="two-column-grid">
        <Card>
          <div className="card-head"><h3 className="section-title">إجمالي المؤشرات</h3></div>
          {Object.entries(summary.totals || {}).length ? (
            <div className="queue-grid compact-cards">
              {Object.entries(summary.totals || {}).map(([key, value]) => (
                <div key={key} className="queue-card compact">
                  <span className="queue-label">{key}</span>
                  <strong>{value}</strong>
                  <p>بيانات محدثة مباشرة من قاعدة البيانات.</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon="📊" title="لا توجد مؤشرات رقمية حالياً" description="الواجهة جاهزة لكن الملخص لم يرجع أي قيم بعد." />
          )}
        </Card>

        <Card>
          <div className="card-head"><h3 className="section-title">توزيع الأدوار</h3></div>
          {(summary.roles || []).length ? (
            <DonutChart data={(summary.roles || []).map((role) => ({ label: role.role, value: role.count }))} />
          ) : (
            <EmptyState icon="👥" title="لا يوجد توزيع أدوار بعد" description="سيظهر الرسم بمجرد وصول بيانات الأدوار من الخادم." />
          )}
        </Card>
      </section>

      <section className="two-column-grid">
        <Card>
          <div className="card-head"><h3 className="section-title">Admin Activity Tracking</h3></div>
          {(summary.admin_activity || []).length ? (
            <div className="queue-grid compact-cards">
              {(summary.admin_activity || []).map((item) => (
                <div key={item.label} className="queue-card compact">
                  <span className="queue-label">{item.label}</span>
                  <strong>{item.value}</strong>
                  <p>{item.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon="🧭" title="لا توجد مؤشرات نشاط حالياً" description="سيظهر تتبع نشاط الإدارة بمجرد توفر السجلات." />
          )}
        </Card>

        <Card>
          <div className="card-head"><h3 className="section-title">Audit Logs</h3></div>
          {(summary.audit_logs || []).length ? (
            <div className="queue-grid compact-cards">
              {(summary.audit_logs || []).map((log) => (
                <div key={log.id} className="queue-card compact">
                  <span className="queue-label">{log.title}</span>
                  <strong>{log.created_at ? new Date(log.created_at).toLocaleString('ar-EG') : 'الآن'}</strong>
                  <p>{log.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon="📜" title="لا يوجد Audit Logs بعد" description="أول ما أي إجراء إداري يحصل هيظهر هنا." actionLabel="إعادة التحميل" onAction={loadSummary} />
          )}
        </Card>
      </section>

      <Card>
        <div className="card-head"><h3 className="section-title">تفاصيل الأدوار</h3></div>
        {(summary.roles || []).length ? (
          <div className="rbac-grid">
            {(summary.roles || []).map((role) => (
              <div key={role.role} className="permission-card">
                <strong>{role.role}</strong>
                <span>{role.count} مستخدم</span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon="🧭" title="تفاصيل الأدوار غير متوفرة" description="لم تصل أي عناصر لأدوار المستخدمين حتى الآن." actionLabel="إعادة التحميل" onAction={loadSummary} />
        )}
      </Card>
    </AdminLayout>
  );
}
