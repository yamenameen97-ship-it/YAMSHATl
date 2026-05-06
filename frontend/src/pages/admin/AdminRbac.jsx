import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import Card from '../../components/ui/Card.jsx';
import { getAdminRbac } from '../../api/admin.js';

export default function AdminRbac() {
  const [rbac, setRbac] = useState({ current_role: '', current_permissions: [], roles: [] });

  useEffect(() => {
    getAdminRbac().then(({ data }) => setRbac(data));
  }, []);

  return (
    <AdminLayout>
      <section className="dashboard-hero-grid small-gap">
        <Card>
          <span className="badge">Current Role</span>
          <h2>{rbac.current_role || '—'}</h2>
          <p className="muted">الصلاحيات الحالية للحساب المعتمد داخل لوحة التحكم.</p>
        </Card>
        <Card>
          <h3 className="section-title">Current Permissions</h3>
          <div className="badge-wrap">
            {(rbac.current_permissions || []).map((permission) => <span key={permission} className="glass-chip">{permission}</span>)}
          </div>
        </Card>
      </section>

      <Card>
        <div className="card-head"><h3 className="section-title">Roles & Permissions Matrix</h3></div>
        <div className="rbac-grid role-grid">
          {(rbac.roles || []).map((role) => (
            <div key={role.role} className="permission-card">
              <strong>{role.label}</strong>
              <div className="badge-wrap compact">
                {role.permissions.map((permission) => <span key={permission} className="role-pill neutral">{permission}</span>)}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </AdminLayout>
  );
}
