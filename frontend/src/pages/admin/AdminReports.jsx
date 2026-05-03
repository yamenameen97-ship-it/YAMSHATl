import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import { exportAdminReport, getAdminReportsSummary } from '../../api/admin.js';
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

  return (
    <AdminLayout>
      <section className="dashboard-hero-grid small-gap">
        <Card>
          <h3 className="section-title">تصدير التقارير</h3>
          <p className="muted">PDF و Excel مباشرة من الباك إند مع ملخص الأدوار والمؤشرات الأساسية.</p>
          <div className="action-row wide">
            <Button onClick={() => handleExport('pdf')}>تصدير PDF</Button>
            <Button variant="secondary" onClick={() => handleExport('xlsx')}>تصدير Excel</Button>
          </div>
        </Card>
        <Card>
          <h3 className="section-title">آخر توليد</h3>
          <p className="muted">{summary.generated_at ? new Date(summary.generated_at).toLocaleString('ar-EG') : '—'}</p>
        </Card>
      </section>

      <section className="kpi-grid">
        {Object.entries(summary.totals || {}).map(([key, value]) => (
          <Card key={key} className="kpi-card">
            <div className="kpi-label">{key}</div>
            <div className="kpi-value">{value}</div>
            <div className="muted">بيانات محدثة من قاعدة البيانات.</div>
          </Card>
        ))}
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
