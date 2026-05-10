import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import EmptyState from '../../components/feedback/EmptyState.jsx';
import ErrorState from '../../components/feedback/ErrorState.jsx';
import { AdminOverviewSkeleton } from '../../components/feedback/Skeleton.jsx';
import useDebouncedValue from '../../hooks/useDebouncedValue.js';
import { getAdminRbac, getAdminUsers, updateAdminUser } from '../../api/admin.js';
import socket from '../../api/socket.js';
import { useToast } from '../../components/admin/ToastProvider.jsx';

const defaultRbac = { current_role: '', current_permissions: [], roles: [] };

export default function AdminRbac() {
  const [rbac, setRbac] = useState(defaultRbac);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [userLoading, setUserLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionBusyKey, setActionBusyKey] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const { pushToast } = useToast();

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

  const loadUsers = async () => {
    try {
      setUserLoading(true);
      const { data } = await getAdminUsers({ page: 1, page_size: 20, search: debouncedSearch, status: 'all', role: 'all' });
      setUsers(data?.items || []);
    } catch (err) {
      pushToast({ title: 'تعذر تحميل المستخدمين', description: err?.response?.data?.detail || 'حاول مرة أخرى.', type: 'error' });
      setUsers([]);
    } finally {
      setUserLoading(false);
    }
  };

  useEffect(() => {
    loadRbac();
  }, []);

  useEffect(() => {
    loadUsers();
  }, [debouncedSearch]);

  useEffect(() => {
    const sync = () => {
      loadUsers();
      loadRbac();
    };
    socket.on('admin:user_updated', sync);
    socket.on('admin:user_deleted', sync);
    socket.on('admin:user_status_changed', sync);
    return () => {
      socket.off('admin:user_updated', sync);
      socket.off('admin:user_deleted', sync);
      socket.off('admin:user_status_changed', sync);
    };
  }, [debouncedSearch]);

  const roleMap = useMemo(() => Object.fromEntries((rbac.roles || []).map((role) => [role.role, role])), [rbac.roles]);

  const handleAssignRole = async (user, role) => {
    try {
      setActionBusyKey(`${user.id}-${role}`);
      await updateAdminUser(user.id, { role });
      pushToast({ title: 'تم تحديث الدور', description: `${user.username} → ${role}`, type: 'success' });
      await Promise.all([loadUsers(), loadRbac()]);
    } catch (error) {
      pushToast({ title: 'تعذر تحديث الدور', description: error?.response?.data?.detail || 'حاول مرة أخرى.', type: 'error' });
    } finally {
      setActionBusyKey('');
    }
  };

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
          <p className="muted">تم ربط الصفحة بواجهة RBAC الحقيقية وإضافة Assign / Remove Role مباشرة على المستخدمين مع تحديث حي فور التنفيذ.</p>
          <div className="action-row wide">
            <Button loading={loading} disabled={loading} onClick={loadRbac}>تحديث الصلاحيات</Button>
            <Button variant="secondary" loading={userLoading} disabled={userLoading} onClick={loadUsers}>تحديث المستخدمين</Button>
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
                  <p>{(role.permissions || []).slice(0, 3).join(' • ') || 'بدون صلاحيات'}</p>
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

      <Card>
        <div className="card-head split">
          <div>
            <h3 className="section-title">Assign / Remove Role</h3>
            <p className="muted no-margin">تعديل مباشر لدور المستخدم مع تحديث الصلاحيات فوراً بعد نجاح العملية.</p>
          </div>
          <Input label="بحث مستخدم" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="اسم المستخدم أو البريد" />
        </div>

        {userLoading ? <AdminOverviewSkeleton /> : null}

        {!userLoading && users.length === 0 ? (
          <EmptyState icon="👤" title="لا يوجد مستخدمون مطابقون" description="جرّب بحث مختلف أو أعد التحميل." actionLabel="إعادة التحميل" onAction={loadUsers} />
        ) : null}

        {!userLoading && users.length > 0 ? (
          <div className="table-shell">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>المستخدم</th>
                  <th>الدور الحالي</th>
                  <th>صلاحيات الدور</th>
                  <th>Assign Role</th>
                  <th>Remove Role</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const permissions = roleMap[user.role]?.permissions || [];
                  return (
                    <tr key={user.id}>
                      <td>
                        <strong>{user.username}</strong>
                        <small>{user.email}</small>
                      </td>
                      <td><span className={`role-pill ${user.role}`}>{user.role}</span></td>
                      <td>
                        <div className="badge-wrap compact">
                          {permissions.length ? permissions.slice(0, 4).map((permission) => <span key={permission} className="glass-chip">{permission}</span>) : <span className="muted">لا توجد صلاحيات</span>}
                        </div>
                      </td>
                      <td>
                        <div className="hero-actions-wrap">
                          {['admin', 'moderator', 'user'].map((role) => (
                            <button
                              key={role}
                              type="button"
                              className="mini-action"
                              disabled={user.role === role || actionBusyKey === `${user.id}-${role}`}
                              aria-busy={actionBusyKey === `${user.id}-${role}`}
                              onClick={() => handleAssignRole(user, role)}
                            >
                              {actionBusyKey === `${user.id}-${role}` ? '...' : `Assign ${role}`}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="mini-action danger"
                          disabled={user.role === 'user' || actionBusyKey === `${user.id}-user`}
                          aria-busy={actionBusyKey === `${user.id}-user`}
                          onClick={() => handleAssignRole(user, 'user')}
                        >
                          {actionBusyKey === `${user.id}-user` ? '...' : 'Remove Role'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </Card>
    </AdminLayout>
  );
}
