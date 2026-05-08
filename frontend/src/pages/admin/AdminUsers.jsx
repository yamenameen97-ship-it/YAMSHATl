import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Input from '../../components/ui/Input.jsx';
import EmptyState from '../../components/feedback/EmptyState.jsx';
import ErrorState from '../../components/feedback/ErrorState.jsx';
import { TableSkeleton } from '../../components/feedback/Skeleton.jsx';
import useDebouncedValue from '../../hooks/useDebouncedValue.js';
import { banAdminUser, deleteAdminUser, getAdminUsers, updateAdminUser, toggleAdminShadowBan, getAdminBanHistory } from '../../api/admin.js';
import { useToast } from '../../components/admin/ToastProvider.jsx';

const emptyForm = { username: '', email: '', role: 'user', is_active: true };

const RISK_COLORS = { high: 'banned', medium: 'warning-soft', low: 'active' };
const RISK_LABELS = { high: '⚠️ مخاطر عالية', medium: '🟡 متابعة', low: '✅ آمن' };

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, page_size: 10 });
  const [filters, setFilters] = useState({ search: '', status: 'all', role: 'all' });
  const [detailUser, setDetailUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionBusyKey, setActionBusyKey] = useState('');
  const [banHistoryOpen, setBanHistoryOpen] = useState(false);
  const [banHistory, setBanHistory] = useState([]);
  const [banHistoryLoading, setBanHistoryLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'ban-history' | 'abuse'
  const debouncedSearch = useDebouncedValue(filters.search, 350);
  const { pushToast } = useToast();

  const loadUsers = async (page = pagination.page) => {
    try {
      setLoading(true);
      setLoadError('');
      const { data } = await getAdminUsers({ page, page_size: pagination.page_size, search: debouncedSearch, status: filters.status, role: filters.role });
      setUsers(data.items || []);
      setPagination(data.pagination || pagination);
    } catch (error) {
      const message = error?.response?.data?.detail || 'حدث خطأ غير متوقع.';
      setLoadError(message);
      pushToast({ title: 'تعذر تحميل المستخدمين', description: message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const loadBanHistory = async () => {
    setBanHistoryLoading(true);
    try {
      const { data } = await getAdminBanHistory(50);
      setBanHistory(data?.items || []);
    } catch {
      setBanHistory([]);
    } finally {
      setBanHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadUsers(1);
  }, [debouncedSearch, filters.status, filters.role]);

  useEffect(() => {
    if (activeTab === 'ban-history') loadBanHistory();
  }, [activeTab]);

  const openEdit = (user) => {
    setDetailUser(null);
    setEditingUser(user);
    setEditForm({ username: user.username, email: user.email, role: user.role, is_active: user.is_active });
  };

  const stats = useMemo(() => ({
    active: users.filter((item) => item.is_active).length,
    banned: users.filter((item) => !item.is_active).length,
    shadow: users.filter((item) => item.shadow_banned).length,
    high_risk: users.filter((item) => item.risk_level === 'high').length,
    admins: users.filter((item) => item.role === 'admin').length,
  }), [users]);

  const abuseSuspects = useMemo(() =>
    users.filter((item) => item.risk_level !== 'low').sort((a, b) => (b.abuse_reports_count || 0) - (a.abuse_reports_count || 0)),
    [users]
  );

  const handleSave = async () => {
    if (!editingUser) return;
    try {
      setActionBusyKey('save');
      await updateAdminUser(editingUser.id, editForm);
      pushToast({ title: 'تم تحديث المستخدم', description: `تم حفظ بيانات ${editForm.username}.`, type: 'success' });
      setEditingUser(null);
      await loadUsers(pagination.page);
    } catch (error) {
      pushToast({ title: 'تعذر حفظ التعديلات', description: error?.response?.data?.detail || 'حاول مرة تانية.', type: 'error' });
    } finally {
      setActionBusyKey('');
    }
  };

  const handleBanToggle = async (user) => {
    try {
      setActionBusyKey(`ban-${user.id}`);
      await banAdminUser(user.id, !user.is_active);
      pushToast({ title: user.is_active ? 'تم الحظر' : 'تمت الاستعادة', description: user.username, type: 'info' });
      await loadUsers(pagination.page);
    } catch (error) {
      pushToast({ title: 'تعذر تحديث الحالة', description: error?.response?.data?.detail || 'حاول مرة تانية.', type: 'error' });
    } finally {
      setActionBusyKey('');
    }
  };

  const handleShadowBan = async (user) => {
    const enabled = !user.shadow_banned;
    try {
      setActionBusyKey(`shadow-${user.id}`);
      await toggleAdminShadowBan(user.id, enabled);
      pushToast({ title: enabled ? 'تم Shadow Ban' : 'تم إلغاء Shadow Ban', description: user.username, type: 'info' });
      await loadUsers(pagination.page);
    } catch (error) {
      pushToast({ title: 'تعذر Shadow Ban', description: error?.response?.data?.detail || 'حاول مرة تانية.', type: 'error' });
    } finally {
      setActionBusyKey('');
    }
  };

  const handleDelete = async (user) => {
    const confirmed = window.confirm(`حذف المستخدم ${user.username} نهائياً؟`);
    if (!confirmed) return;

    try {
      setActionBusyKey(`delete-${user.id}`);
      await deleteAdminUser(user.id);
      pushToast({ title: 'تم حذف المستخدم', description: user.username, type: 'success' });
      await loadUsers(1);
    } catch (error) {
      pushToast({ title: 'تعذر حذف المستخدم', description: error?.response?.data?.detail || 'حاول مرة تانية.', type: 'error' });
    } finally {
      setActionBusyKey('');
    }
  };

  return (
    <AdminLayout>
      {/* ── Filters ── */}
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
            <div><strong>{stats.shadow}</strong><span>Shadow Ban</span></div>
            <div><strong>{stats.high_risk}</strong><span>Abuse Detection</span></div>
            <div><strong>{stats.admins}</strong><span>Admin</span></div>
            <div><strong>{pagination.total}</strong><span>الإجمالي</span></div>
          </div>
        </Card>
      </section>

      {/* ── Tab Navigation ── */}
      <div className="notifications-filter-row" style={{ marginBottom: 0 }}>
        {[
          { key: 'users', label: '👥 Users Management' },
          { key: 'ban-history', label: '🚫 Ban History' },
          { key: 'abuse', label: '⚠️ Abuse Detection' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`mini-action ${activeTab === tab.key ? 'active-filter-chip' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loadError && !loading ? <ErrorState title="تعذر تحميل المستخدمين" description={loadError} onRetry={() => loadUsers(pagination.page)} /> : null}

      {/* ── Users Table ── */}
      {activeTab === 'users' ? (
        <Card>
          <div className="card-head split">
            <div>
              <h3 className="section-title">Users Management</h3>
              <p className="muted">بحث فوري، Pagination، Ban، Shadow Ban، Abuse Detection، حذف، وعرض تفاصيل المستخدم.</p>
            </div>
            <div className="pagination-row">
              <Button variant="secondary" disabled={pagination.page <= 1 || loading} onClick={() => loadUsers(pagination.page - 1)}>السابق</Button>
              <span>صفحة {pagination.page} / {pagination.pages}</span>
              <Button variant="secondary" disabled={pagination.page >= pagination.pages || loading} onClick={() => loadUsers(pagination.page + 1)}>التالي</Button>
            </div>
          </div>

          {loading ? <TableSkeleton rows={6} columns={7} /> : null}

          {!loading && users.length === 0 ? (
            <EmptyState icon="🧑‍💼" title="لا توجد نتائج مطابقة" description="جرّب فلتر مختلف أو امسح البحث لعرض كل المستخدمين." actionLabel="إعادة التحميل" onAction={() => loadUsers(1)} />
          ) : null}

          {!loading && users.length > 0 ? (
            <div className="table-shell">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>المستخدم</th>
                    <th>الدور</th>
                    <th>الحالة</th>
                    <th>Abuse / Risk</th>
                    <th>آخر دخول</th>
                    <th>المتابعون</th>
                    <th>إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <button type="button" className="table-link" onClick={() => setDetailUser(user)}>{user.username}</button>
                        <small>{user.email}</small>
                        {user.shadow_banned ? <span className="glass-chip" style={{ marginLeft: 4 }}>👻 Shadow</span> : null}
                      </td>
                      <td><span className={`role-pill ${user.role}`}>{user.role}</span></td>
                      <td>
                        <span className={`status-pill ${user.is_active ? 'active' : 'banned'}`}>{user.is_active ? 'Active' : 'Banned'}</span>
                      </td>
                      <td>
                        <span className={`status-pill ${RISK_COLORS[user.risk_level] || 'active'}`}>{RISK_LABELS[user.risk_level] || '✅ آمن'}</span>
                        {(user.abuse_reports_count || 0) > 0 ? <small style={{ display: 'block' }}>🚨 {user.abuse_reports_count} بلاغ</small> : null}
                        {(user.spam_flags_count || 0) > 0 ? <small style={{ display: 'block' }}>🤖 {user.spam_flags_count} Spam</small> : null}
                      </td>
                      <td>{user.last_login_at ? new Date(user.last_login_at).toLocaleString('ar-EG') : '—'}</td>
                      <td>{user.followers_count}</td>
                      <td>
                        <div className="action-row">
                          <button type="button" className="mini-action" onClick={() => openEdit(user)}>تعديل</button>
                          <button type="button" className="mini-action" onClick={() => handleBanToggle(user)} disabled={actionBusyKey === `ban-${user.id}`} aria-busy={actionBusyKey === `ban-${user.id}`}>
                            {actionBusyKey === `ban-${user.id}` ? '...' : user.is_active ? '🚫 حظر' : '✅ استعادة'}
                          </button>
                          <button type="button" className="mini-action" onClick={() => handleShadowBan(user)} disabled={actionBusyKey === `shadow-${user.id}`} aria-busy={actionBusyKey === `shadow-${user.id}`}>
                            {actionBusyKey === `shadow-${user.id}` ? '...' : user.shadow_banned ? '👁️ إلغاء Shadow' : '👻 Shadow Ban'}
                          </button>
                          <button type="button" className="mini-action danger" onClick={() => handleDelete(user)} disabled={actionBusyKey === `delete-${user.id}`} aria-busy={actionBusyKey === `delete-${user.id}`}>
                            {actionBusyKey === `delete-${user.id}` ? 'جارٍ الحذف...' : 'حذف'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </Card>
      ) : null}

      {/* ── Ban History ── */}
      {activeTab === 'ban-history' ? (
        <Card>
          <div className="card-head split">
            <div>
              <h3 className="section-title">🚫 Ban History</h3>
              <p className="muted">سجل كامل لعمليات الحظر والاستعادة والشادو بان على المنصة.</p>
            </div>
            <Button variant="secondary" loading={banHistoryLoading} onClick={loadBanHistory}>تحديث</Button>
          </div>
          {banHistoryLoading ? <TableSkeleton rows={5} columns={4} /> : null}
          {!banHistoryLoading && banHistory.length === 0 ? (
            <EmptyState icon="📋" title="لا توجد سجلات حظر بعد" description="بمجرد تنفيذ أي إجراء حظر أو شادو بان هيظهر هنا تلقائياً." actionLabel="تحديث" onAction={loadBanHistory} />
          ) : null}
          {!banHistoryLoading && banHistory.length > 0 ? (
            <div className="table-shell">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>الإجراء</th>
                    <th>التفاصيل</th>
                    <th>النوع</th>
                    <th>التوقيت</th>
                  </tr>
                </thead>
                <tbody>
                  {banHistory.map((log) => (
                    <tr key={log.id}>
                      <td><strong>{log.title}</strong></td>
                      <td>{log.description}</td>
                      <td>
                        <span className={`status-pill ${log.action === 'user_banned' || log.action === 'shadow_ban_enabled' ? 'banned' : 'active'}`}>
                          {log.action === 'user_banned' ? '🚫 حظر' : log.action === 'user_restored' ? '✅ استعادة' : log.action === 'shadow_ban_enabled' ? '👻 Shadow ON' : '👁️ Shadow OFF'}
                        </span>
                      </td>
                      <td>{log.created_at ? new Date(log.created_at).toLocaleString('ar-EG') : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </Card>
      ) : null}

      {/* ── Abuse Detection ── */}
      {activeTab === 'abuse' ? (
        <Card>
          <div className="card-head split">
            <div>
              <h3 className="section-title">⚠️ Abuse Detection & Spam Detection</h3>
              <p className="muted">يعرض المستخدمين ذوي المخاطر المتوسطة والعالية بناءً على البلاغات وعمليات الدخول المشبوهة والنشاط غير الطبيعي.</p>
            </div>
            <Button variant="secondary" loading={loading} onClick={() => loadUsers(pagination.page)}>تحديث</Button>
          </div>
          {loading ? <TableSkeleton rows={4} columns={5} /> : null}
          {!loading && abuseSuspects.length === 0 ? (
            <EmptyState icon="✅" title="لا توجد مخاطر مكتشفة حالياً" description="رائع! كل المستخدمين على الصفحة الحالية ضمن المعدل الطبيعي." actionLabel="تحديث" onAction={() => loadUsers(pagination.page)} />
          ) : null}
          {!loading && abuseSuspects.length > 0 ? (
            <div className="table-shell">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>المستخدم</th>
                    <th>Risk Level</th>
                    <th>Abuse Reports</th>
                    <th>Spam Flags</th>
                    <th>Spam Status</th>
                    <th>إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {abuseSuspects.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <button type="button" className="table-link" onClick={() => setDetailUser(user)}>{user.username}</button>
                        <small>{user.email}</small>
                        {user.shadow_banned ? <span className="glass-chip" style={{ marginLeft: 4 }}>👻 Shadow</span> : null}
                      </td>
                      <td><span className={`status-pill ${RISK_COLORS[user.risk_level] || 'active'}`}>{RISK_LABELS[user.risk_level]}</span></td>
                      <td><strong>{user.abuse_reports_count || 0}</strong></td>
                      <td><strong>{user.spam_flags_count || 0}</strong></td>
                      <td>
                        <span className={`status-pill ${user.spam_detection_status === 'blocked' ? 'banned' : user.spam_detection_status === 'watch' ? 'warning-soft' : 'active'}`}>
                          {user.spam_detection_status === 'blocked' ? '🤖 Blocked' : user.spam_detection_status === 'watch' ? '👁 Watch' : '✅ Clear'}
                        </span>
                      </td>
                      <td>
                        <div className="action-row">
                          <button type="button" className="mini-action" onClick={() => handleBanToggle(user)} disabled={actionBusyKey === `ban-${user.id}`}>
                            {user.is_active ? '🚫 حظر' : '✅ استعادة'}
                          </button>
                          <button type="button" className="mini-action" onClick={() => handleShadowBan(user)} disabled={actionBusyKey === `shadow-${user.id}`}>
                            {user.shadow_banned ? '👁️ إلغاء Shadow' : '👻 Shadow Ban'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </Card>
      ) : null}

      {/* ── User Detail Modal ── */}
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
              <div><strong>{detailUser.shadow_banned ? '👻 مخفي' : '✅ ظاهر'}</strong><span>Shadow Ban</span></div>
              <div><strong>{detailUser.abuse_reports_count || 0}</strong><span>Abuse Reports</span></div>
              <div><strong>{detailUser.spam_flags_count || 0}</strong><span>Spam Flags</span></div>
              <div><strong>{detailUser.ban_history_count || 0}</strong><span>Ban History</span></div>
              <div><strong>{RISK_LABELS[detailUser.risk_level] || '✅ آمن'}</strong><span>Risk Level</span></div>
              <div><strong>{detailUser.created_at ? new Date(detailUser.created_at).toLocaleDateString('ar-EG') : '—'}</strong><span>تاريخ الإنشاء</span></div>
            </div>
            <div className="modal-actions">
              <Button variant="secondary" onClick={() => openEdit(detailUser)}>تعديل البيانات</Button>
              <Button variant="secondary" onClick={() => handleShadowBan(detailUser)} disabled={actionBusyKey === `shadow-${detailUser.id}`}>
                {detailUser.shadow_banned ? '👁️ إلغاء Shadow Ban' : '👻 Shadow Ban'}
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* ── Edit Modal ── */}
      <Modal open={Boolean(editingUser && editForm.username)} title="تعديل المستخدم" onClose={() => setEditingUser(null)}>
        <div className="modal-stack">
          <Input label="Username" value={editForm.username} onChange={(event) => setEditForm((prev) => ({ ...prev, username: event.target.value }))} />
          <Input label="Email" value={editForm.email} onChange={(event) => setEditForm((prev) => ({ ...prev, email: event.target.value }))} />
          <label className="field select-field"><span className="field-label">Role</span><select className="input" value={editForm.role} onChange={(event) => setEditForm((prev) => ({ ...prev, role: event.target.value }))}><option value="admin">Admin</option><option value="moderator">Moderator</option><option value="user">User</option></select></label>
          <label className="checkbox-row"><input type="checkbox" checked={editForm.is_active} onChange={(event) => setEditForm((prev) => ({ ...prev, is_active: event.target.checked }))} /><span>الحساب نشط</span></label>
          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setEditingUser(null)}>إلغاء</Button>
            <Button onClick={handleSave} loading={actionBusyKey === 'save'}>
              {actionBusyKey === 'save' ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}
            </Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
