import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Input from '../../components/ui/Input.jsx';
import useDebouncedValue from '../../hooks/useDebouncedValue.js';
import { banAdminUser, deleteAdminUser, getAdminUsers, updateAdminUser } from '../../api/admin.js';
import { useToast } from '../../components/admin/ToastProvider.jsx';

const emptyForm = { username: '', email: '', role: 'user', is_active: true };

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, page_size: 10 });
  const [filters, setFilters] = useState({ search: '', status: 'all', role: 'all' });
  const [detailUser, setDetailUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const debouncedSearch = useDebouncedValue(filters.search, 350);
  const { pushToast } = useToast();

  const loadUsers = async (page = pagination.page) => {
    try {
      setLoading(true);
      const { data } = await getAdminUsers({ page, page_size: pagination.page_size, search: debouncedSearch, status: filters.status, role: filters.role });
      setUsers(data.items || []);
      setPagination(data.pagination || pagination);
    } catch (error) {
      pushToast({ title: 'تعذر تحميل المستخدمين', description: error?.response?.data?.detail || 'حدث خطأ غير متوقع.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers(1);
  }, [debouncedSearch, filters.status, filters.role]);

  const openEdit = (user) => {
    setDetailUser(null);
    setEditingUser(user);
    setEditForm({ username: user.username, email: user.email, role: user.role, is_active: user.is_active });
  };

  const stats = useMemo(() => ({
    active: users.filter((item) => item.is_active).length,
    banned: users.filter((item) => !item.is_active).length,
    admins: users.filter((item) => item.role === 'admin').length,
  }), [users]);

  const handleSave = async () => {
    if (!editingUser) return;
    await updateAdminUser(editingUser.id, editForm);
    pushToast({ title: 'تم تحديث المستخدم', description: `تم حفظ بيانات ${editForm.username}.`, type: 'success' });
    setEditingUser(null);
    loadUsers(pagination.page);
  };

  const handleBanToggle = async (user) => {
    await banAdminUser(user.id, !user.is_active);
    pushToast({ title: user.is_active ? 'تم الحظر' : 'تمت الاستعادة', description: user.username, type: 'info' });
    loadUsers(pagination.page);
  };

  const handleDelete = async (user) => {
    const confirmed = window.confirm(`حذف المستخدم ${user.username} نهائياً؟`);
    if (!confirmed) return;
    await deleteAdminUser(user.id);
    pushToast({ title: 'تم حذف المستخدم', description: user.username, type: 'success' });
    loadUsers(1);
  };

  return (
    <AdminLayout>
      <section className="dashboard-hero-grid small-gap">
        <Card>
          <div className="filters-row wrap">
            <Input label="Search" value={filters.search} onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))} placeholder="اسم المستخدم أو البريد" />
            <label className="field select-field"><span className="field-label">Status</span><select className="input" value={filters.status} onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}><option value="all">All</option><option value="active">Active</option><option value="banned">Banned</option></select></label>
            <label className="field select-field"><span className="field-label">Role</span><select className="input" value={filters.role} onChange={(event) => setFilters((prev) => ({ ...prev, role: event.target.value }))}><option value="all">All</option><option value="admin">Admin</option><option value="moderator">Moderator</option><option value="user">User</option></select></label>
          </div>
        </Card>
        <Card>
          <div className="status-list compact-grid">
            <div><strong>{stats.active}</strong><span>نشط</span></div>
            <div><strong>{stats.banned}</strong><span>محظور</span></div>
            <div><strong>{stats.admins}</strong><span>Admin</span></div>
            <div><strong>{pagination.total}</strong><span>الإجمالي</span></div>
          </div>
        </Card>
      </section>

      <Card>
        <div className="card-head split">
          <div>
            <h3 className="section-title">Users Management</h3>
            <p className="muted">بحث فوري، Pagination، Filters، تعديل، حظر، حذف، وعرض تفاصيل المستخدم.</p>
          </div>
          <div className="pagination-row">
            <Button variant="secondary" disabled={pagination.page <= 1} onClick={() => loadUsers(pagination.page - 1)}>السابق</Button>
            <span>صفحة {pagination.page} / {pagination.pages}</span>
            <Button variant="secondary" disabled={pagination.page >= pagination.pages} onClick={() => loadUsers(pagination.page + 1)}>التالي</Button>
          </div>
        </div>

        <div className="table-shell">
          <table className="admin-table">
            <thead>
              <tr>
                <th>المستخدم</th>
                <th>الدور</th>
                <th>الحالة</th>
                <th>آخر دخول</th>
                <th>المتابعون</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="table-empty">جارٍ تحميل المستخدمين...</td></tr>
              ) : users.length ? users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <button type="button" className="table-link" onClick={() => setDetailUser(user)}>{user.username}</button>
                    <small>{user.email}</small>
                  </td>
                  <td><span className={`role-pill ${user.role}`}>{user.role}</span></td>
                  <td><span className={`status-pill ${user.is_active ? 'active' : 'banned'}`}>{user.is_active ? 'Active' : 'Banned'}</span></td>
                  <td>{user.last_login_at ? new Date(user.last_login_at).toLocaleString('ar-EG') : '—'}</td>
                  <td>{user.followers_count}</td>
                  <td>
                    <div className="action-row">
                      <button type="button" className="mini-action" onClick={() => openEdit(user)}>تعديل</button>
                      <button type="button" className="mini-action" onClick={() => handleBanToggle(user)}>{user.is_active ? 'حظر' : 'استعادة'}</button>
                      <button type="button" className="mini-action danger" onClick={() => handleDelete(user)}>حذف</button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="6" className="table-empty">لا توجد نتائج مطابقة.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={Boolean(detailUser)} title={detailUser ? `ملف ${detailUser.username}` : 'تفاصيل المستخدم'} onClose={() => setDetailUser(null)}>
        {detailUser ? (
          <div className="modal-stack">
            <div className="profile-summary-card">
              <div className="avatar-circle large">{detailUser.username.slice(0, 1).toUpperCase()}</div>
              <div>
                <strong>{detailUser.username}</strong>
                <div className="muted">{detailUser.email}</div>
                <div className={`role-pill wide ${detailUser.role}`}>{detailUser.role}</div>
              </div>
            </div>
            <div className="stats-inline-grid">
              <div><strong>{detailUser.followers_count}</strong><span>متابعون</span></div>
              <div><strong>{detailUser.following_count}</strong><span>يتابع</span></div>
              <div><strong>{detailUser.is_active ? 'نشط' : 'محظور'}</strong><span>الحالة</span></div>
              <div><strong>{detailUser.created_at ? new Date(detailUser.created_at).toLocaleDateString('ar-EG') : '—'}</strong><span>تاريخ الإنشاء</span></div>
            </div>
            <div className="modal-actions">
              <Button variant="secondary" onClick={() => openEdit(detailUser)}>تعديل البيانات</Button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal open={Boolean(editingUser && editForm.username)} title="تعديل المستخدم" onClose={() => setEditingUser(null)}>
        <div className="modal-stack">
          <Input label="Username" value={editForm.username} onChange={(event) => setEditForm((prev) => ({ ...prev, username: event.target.value }))} />
          <Input label="Email" value={editForm.email} onChange={(event) => setEditForm((prev) => ({ ...prev, email: event.target.value }))} />
          <label className="field select-field"><span className="field-label">Role</span><select className="input" value={editForm.role} onChange={(event) => setEditForm((prev) => ({ ...prev, role: event.target.value }))}><option value="admin">Admin</option><option value="moderator">Moderator</option><option value="user">User</option></select></label>
          <label className="checkbox-row"><input type="checkbox" checked={editForm.is_active} onChange={(event) => setEditForm((prev) => ({ ...prev, is_active: event.target.checked }))} /><span>الحساب نشط</span></label>
          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setEditingUser(null)}>إلغاء</Button>
            <Button onClick={handleSave}>حفظ التغييرات</Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
