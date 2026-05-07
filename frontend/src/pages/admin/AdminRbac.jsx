import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import EmptyState from '../../components/feedback/EmptyState.jsx';
import ErrorState from '../../components/feedback/ErrorState.jsx';
import { AdminOverviewSkeleton } from '../../components/feedback/Skeleton.jsx';
import { getAdminRbac } from '../../api/admin.js';

const defaultRbac = { current_role: '', current_permissions: [], roles: [] };

export default function AdminRbac() {
  const [rbac, setRbac] = useState(defaultRbac);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const hasRbacData = Boolean(rbac.current_role || (rbac.current_permissions || []).length || (rbac.roles || []).length);

  const loadRbac = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await getAdminRbac();
      setRbac({ ...defaultRbac, ...(data || {}) });
    } catch (err) {
      setError(err?.response?.data?.detail || 'تعذر تحميل صلاحيات الأدوار حالياً.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRbac();
  }, []);

  if (loading && !hasRbacData) {
    return (
      <AdminLayout>
        <AdminOverviewSkeleton />
      </AdminLayout>
    );
  }

  if (error && !hasRbacData) {
    return (
      <AdminLayout>
        <ErrorState title="تعذر تحميل صلاحيات الأدوار" description={error} onRetry={loadRbac} />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {error ? <div className="alert error">{error}</div> : null}

      <section className="dashboard-hero-grid small-gap">
        <Card className="hero-card">
          <span className="badge">RBAC</span>
          <h2>مصفوفة الصلاحيات والأدوار</h2>
          <p className="muted">تم تحسين الصفحة بحالة تحميل أولية، تحديث مباشر، وشاشة فارغة واضحة لو لم تصل بيانات RBAC من الباك إند.</p>
          <div className="action-row wide">
            <Button loading={loading} disabled={loading} onClick={loadRbac}>تحديث الصلاحيات</Button>
          </div>
        </Card>
        <Card>
          <span className="badge">Current Role</span>
          <h2>{rbac.current_role || '—'}</h2>
          <p className="muted">الصلاحيات الحالية للحساب المعتمد داخل لوحة التحكم.</p>
        </Card>
      </section>

      <section className="two-column-grid">
        <Card>
          <div className="card-head"><h3 className="section-title">Current Permissions</h3></div>
          {(rbac.current_permissions || []).length ? (
            <div className="badge-wrap">
              {(rbac.current_permissions || []).map((permission) => <span key={permission} className="glass-chip">{permission}</span>)}
            </div>
          ) : (
            <EmptyState icon="🔐" title="لا توجد صلاحيات مرتبطة بالحساب" description="قد يكون الحساب محدود الصلاحية أو لم تصل البيانات من الخادم بعد." actionLabel="إعادة التحميل" onAction={loadRbac} />
          )}
        </Card>

        <Card>
          <div className="card-head"><h3 className="section-title">ملخص الأدوار</h3></div>
          {(rbac.roles || []).length ? (
            <div className="queue-grid compact-cards">
              {(rbac.roles || []).map((role) => (
                <div key={role.role} className="queue-card compact">
                  <span className="queue-label">{role.label || role.role}</span>
                  <strong>{role.permissions?.length || 0} صلاحية</strong>
                  <p>ملف دور جاهز للمراجعة السريعة.</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon="🧩" title="لا توجد أدوار معرفة بعد" description="سيتم عرض الأدوار هنا بمجرد رجوع بيانات المصفوفة من الباك إند." />
          )}
        </Card>
      </section>

      <Card>
        <div className="card-head"><h3 className="section-title">Roles & Permissions Matrix</h3></div>
        {(rbac.roles || []).length ? (
          <div className="rbac-grid role-grid">
            {(rbac.roles || []).map((role) => (
              <div key={role.role} className="permission-card">
                <strong>{role.label || role.role}</strong>
                <div className="badge-wrap compact">
                  {(role.permissions || []).map((permission) => <span key={permission} className="role-pill neutral">{permission}</span>)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon="📚" title="مصفوفة الصلاحيات فارغة" description="لا توجد صفوف لعرض الأدوار والصلاحيات حالياً." actionLabel="إعادة التحميل" onAction={loadRbac} />
        )}
      </Card>
    </AdminLayout>
  );
}
