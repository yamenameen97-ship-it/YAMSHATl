import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
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

export default function AdminReports() {
  const [summary, setSummary] = useState({ totals: {}, roles: [], generated_at: '' });
  const { pushToast } = useToast();

  useEffect(() => {
    getAdminReportsSummary().then(({ data }) => setSummary(data));
  }, []);

  const handleExport = async (format) => {
    const { data } = await exportAdminReport(format);
    saveBlob(data, `yamshat-admin-report.${format}`);
    pushToast({ title: `تم تصدير ${format.toUpperCase()}`, description: 'الملف جاهز للتحميل.', type: 'success' });
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
      { key: 'engagement', label: 'كثافة التفاعل', value: `${engagementLoad}%`, description: 'مؤشر مبسط للعلاقة بين المحتوى والتفاعل والرسائل.' },
      { key: 'generated', label: 'آخر توليد', value: summary.generated_at ? new Date(summary.generated_at).toLocaleString('ar-EG') : '—', description: 'توقيت آخر ملخص تم سحبه من الباك إند.' },
    ];
  }, [summary]);

  return (
    <AdminLayout>
      <section className="dashboard-hero-grid small-gap">
        <Card className="hero-card">
          <h3 className="section-title">التقارير والتحليلات</h3>
          <p className="muted">تصدير PDF و Excel مع ملخص مؤشرات فوري وقابل للتقديم للإدارة أو فرق التشغيل.</p>
          <div className="action-row wide">
            <Button onClick={() => handleExport('pdf')}>تصدير PDF</Button>
            <Button variant="secondary" onClick={() => handleExport('xlsx')}>تصدير Excel</Button>
          </div>
        </Card>
        <Card>
          <h3 className="section-title">ملخص سريع</h3>
          <div className="status-list compact-grid">
            <div><strong>{summary.totals?.users || 0}</strong><span>مستخدم</span></div>
            <div><strong>{summary.totals?.active_users || 0}</strong><span>نشط</span></div>
            <div><strong>{summary.totals?.posts || 0}</strong><span>منشور</span></div>
            <div><strong>{summary.totals?.messages || 0}</strong><span>رسالة</span></div>
          </div>
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
          <div className="card-head"><h3 className="section-title">إجمالي المؤشرات</h3></div>
          <div className="queue-grid compact-cards">
            {Object.entries(summary.totals || {}).map(([key, value]) => (
              <div key={key} className="queue-card compact">
                <span className="queue-label">{key}</span>
                <strong>{value}</strong>
                <p>بيانات محدثة مباشرة من قاعدة البيانات.</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="card-head"><h3 className="section-title">توزيع الأدوار</h3></div>
          <DonutChart data={(summary.roles || []).map((role) => ({ label: role.role, value: role.count }))} />
        </Card>
      </section>

      <Card>
        <div className="card-head"><h3 className="section-title">تفاصيل الأدوار</h3></div>
        <div className="rbac-grid">
          {(summary.roles || []).map((role) => (
            <div key={role.role} className="permission-card">
              <strong>{role.role}</strong>
              <span>{role.count} مستخدم</span>
            </div>
          ))}
        </div>
      </Card>
    </AdminLayout>
  );
}
