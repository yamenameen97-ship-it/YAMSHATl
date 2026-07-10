import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import MainLayout from '../components/layout/MainLayout.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';
import Input from '../components/ui/Input.jsx';
import EmptyState from '../components/feedback/EmptyState.jsx';
import ErrorState from '../components/feedback/ErrorState.jsx';
import { ListSkeleton } from '../components/feedback/Skeleton.jsx';
import { followUser, getUsers } from '../api/users.js';
import { banAdminUser, deleteAdminUser, updateAdminUser } from '../api/admin.js';
import { blockUserApi, unblockUserApi } from '../api/chat.js';
import { getCurrentUsername, hasPermission } from '../utils/auth.js';
import useDebouncedValue from '../hooks/useDebouncedValue.js';
import { rankSuggestedUsers } from '../services/recommendationService.js';

const emptyEditForm = { username: '', email: '', role: 'user', is_active: true };

async function fetchUsers() {
  const { data } = await getUsers();
  return Array.isArray(data) ? data : [];
}

export default function Users() {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState([]);
  const [actionError, setActionError] = useState('');
  const [busyUser, setBusyUser] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [confirmAction, setConfirmAction] = useState(null);
  const navigate = useNavigate();
  const currentUser = getCurrentUsername();
  const debouncedQuery = useDebouncedValue(query, 250);

  const canEditUsers = hasPermission('users.edit');
  const canBanUsers = hasPermission('users.ban');
  const canDeleteUsers = hasPermission('users.delete');

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });

  useEffect(() => {
    setItems(Array.isArray(data) ? data : []);
  }, [data]);

  const enrichedUsers = useMemo(() => rankSuggestedUsers(
    (items || [])
      .filter((user) => (user?.username || user?.name) && (user.username || user.name) !== currentUser)
      .map((user) => ({
        ...user,
        username: user.username || user.name,
        blocked_by_me: Boolean(user.blocked_by_me),
      })),
    currentUser,
  ), [currentUser, items]);

  const users = useMemo(() => {
    if (!debouncedQuery) return enrichedUsers;
    return enrichedUsers.filter((user) => user.username.toLowerCase().includes(debouncedQuery.toLowerCase()));
  }, [debouncedQuery, enrichedUsers]);

  const suggestions = useMemo(() => enrichedUsers.slice(0, 5).map((user) => user.username), [enrichedUsers]);
  const suggestedUsers = useMemo(() => enrichedUsers.slice(0, 6), [enrichedUsers]);

  const syncUser = (username, updater) => {
    setItems((prev) => prev.map((item) => {
      const itemUsername = item.username || item.name;
      if (itemUsername !== username) return item;
      return typeof updater === 'function' ? updater(item) : { ...item, ...updater };
    }));
  };

  const handleFollowToggle = async (user) => {
    try {
      setBusyUser(`follow-${user.username}`);
      setActionError('');
      const { data: response } = await followUser(user.username);
      syncUser(user.username, (item) => ({
        ...item,
        following: Boolean(response?.following),
        followers_count: Number(response?.followers ?? item.followers_count ?? 0),
      }));
    } catch (err) {
      setActionError(err?.response?.data?.message || err?.response?.data?.detail || 'تعذر تحديث حالة المتابعة.');
    } finally {
      setBusyUser('');
    }
  };

  const handleBlockToggle = async (user) => {
    try {
      setBusyUser(`block-${user.username}`);
      setActionError('');
      const response = user.blocked_by_me ? await unblockUserApi(user.username) : await blockUserApi(user.username);
      syncUser(user.username, { blocked_by_me: Boolean(response?.data?.blocked_by_me) });
    } catch (err) {
      setActionError(err?.response?.data?.message || err?.response?.data?.detail || 'تعذر تحديث حالة الحظر.');
    } finally {
      setBusyUser('');
    }
  };

  const openEdit = (user) => {
    setEditingUser(user);
    setEditForm({
      username: user.username,
      email: user.email || '',
      role: user.role || 'user',
      is_active: Boolean(user.is_active ?? true),
    });
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    try {
      setBusyUser(`edit-${editingUser.username}`);
      setActionError('');
      const { data: updated } = await updateAdminUser(editingUser.id, editForm);
      syncUser(editingUser.username, updated || {});
      setEditingUser(null);
    } catch (err) {
      setActionError(err?.response?.data?.detail || 'تعذر حفظ بيانات المستخدم.');
    } finally {
      setBusyUser('');
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmAction?.user) return;
    const user = confirmAction.user;
    try {
      setBusyUser(`${confirmAction.type}-${user.username}`);
      setActionError('');
      if (confirmAction.type === 'ban') {
        const { data: updated } = await banAdminUser(user.id, !user.is_active);
        syncUser(user.username, updated || {});
      } else if (confirmAction.type === 'delete') {
        await deleteAdminUser(user.id);
        setItems((prev) => prev.filter((item) => item.id !== user.id));
      }
      setConfirmAction(null);
    } catch (err) {
      setActionError(err?.response?.data?.detail || 'تعذر تنفيذ العملية المطلوبة.');
    } finally {
      setBusyUser('');
    }
  };

  return (
    <MainLayout>
      <div className="yam-users-page">
      <div className="section-head">
        <div>
          <h3 className="section-title">Suggested users + people discovery</h3>
          <p className="muted">تمت إضافة ترتيب اقتراح المستخدمين حسب التفاعل، النشاط، والمتابعين المشتركين.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 18, gridTemplateColumns: 'minmax(0, 1fr) 320px' }}>
        <div>
          <Card className="search-panel-card">
            <div className="search-shell large enabled-search-shell">
              <span>⌕</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث باسم المستخدم..." />
            </div>
            {suggestions.length > 0 ? (
              <div className="search-suggestions">
                {suggestions.map((username) => (
                  <button key={username} type="button" className="mini-action" onClick={() => setQuery(username)}>{username}</button>
                ))}
              </div>
            ) : null}
          </Card>

          {actionError ? <div className="alert error">{actionError}</div> : null}
          {isLoading ? <ListSkeleton count={8} /> : null}
          {isError ? (
            <ErrorState title="تعذر تحميل المستخدمين" description={error?.response?.data?.message || error?.message} onRetry={refetch} />
          ) : null}
          {!isLoading && !isError && users.length === 0 ? (
            <EmptyState icon="🧑‍🤝‍🧑" title="لا يوجد مستخدمون مطابقون" description="جرّب كلمة بحث مختلفة أو أعد التحديث." actionLabel="تحديث" onAction={refetch} />
          ) : null}

          <div className="list-grid users-rich-grid">
            {users.map((user) => (
              <Card key={user.username} className="user-row responsive-user-row users-rich-row">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.username} className="avatar-circle avatar-image" />
                ) : (
                  <div className="avatar-circle">{user.username.slice(0, 1).toUpperCase()}</div>
                )}
                <div className="user-meta expanded-user-meta">
                  <strong>{user.username}</strong>
                  <span className="muted">{user.recommendation_reason}</span>
                  <div className="profile-mini-stats">
                    <span>Score {Math.round(user.recommendation_score || 0)}</span>
                    <span>المتابعون {Number(user.followers_count || 0)}</span>
                    <span>يتابع {Number(user.following_count || 0)}</span>
                    {user.role ? <span>الدور {user.role}</span> : null}
                  </div>
                </div>
                <div className="user-row-actions">
                  <Button variant="secondary" onClick={() => navigate(`/profile/${encodeURIComponent(user.username)}`)}>الملف الشخصي</Button>
                  <Button variant="secondary" onClick={() => navigate(`/chat/${encodeURIComponent(user.username)}`)} disabled={user.blocked_by_me}>فتح الشات</Button>
                  <Button variant="secondary" onClick={() => handleBlockToggle(user)} disabled={busyUser === `block-${user.username}`}>
                    {busyUser === `block-${user.username}` ? 'جارٍ التحديث...' : user.blocked_by_me ? 'إلغاء الحظر' : 'حظر'}
                  </Button>
                  <Button onClick={() => handleFollowToggle(user)} disabled={busyUser === `follow-${user.username}`}>
                    {busyUser === `follow-${user.username}` ? 'جارٍ التحديث...' : user.following ? 'إلغاء المتابعة' : 'متابعة'}
                  </Button>
                  {canEditUsers ? <Button variant="secondary" onClick={() => openEdit(user)}>تعديل</Button> : null}
                  {canBanUsers ? (
                    <Button variant="secondary" onClick={() => setConfirmAction({ type: 'ban', user })} disabled={busyUser === `ban-${user.username}`}>
                      {busyUser === `ban-${user.username}` ? 'جارٍ التنفيذ...' : user.is_active ? 'حظر' : 'استعادة'}
                    </Button>
                  ) : null}
                  {canDeleteUsers ? (
                    <Button variant="secondary" onClick={() => setConfirmAction({ type: 'delete', user })} disabled={busyUser === `delete-${user.username}`}>
                      {busyUser === `delete-${user.username}` ? 'جارٍ الحذف...' : 'حذف'}
                    </Button>
                  ) : null}
                </div>
              </Card>
            ))}
          </div>
        </div>

        <Card style={{ padding: 18, alignSelf: 'start' }}>
          <h3 style={{ marginTop: 0 }}>Suggested users</h3>
          <div style={{ display: 'grid', gap: 12 }}>
            {suggestedUsers.map((user, index) => (
              <div key={user.username} style={{ padding: 12, borderRadius: 14, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(15,23,42,0.58)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <strong>#{index + 1} {user.username}</strong>
                    <div className="muted" style={{ marginTop: 6 }}>{user.recommendation_reason}</div>
                  </div>
                  <span style={{ opacity: 0.75 }}>{Math.round(user.recommendation_score || 0)}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Modal open={Boolean(editingUser)} title="تعديل بيانات المستخدم" onClose={() => setEditingUser(null)}>
        <div className="modal-stack">
          <Input label="Username" value={editForm.username} onChange={(event) => setEditForm((prev) => ({ ...prev, username: event.target.value }))} />
          <Input label="Email" value={editForm.email} onChange={(event) => setEditForm((prev) => ({ ...prev, email: event.target.value }))} />
          <label className="field select-field">
            <span className="field-label">Role</span>
            <select className="input" value={editForm.role} onChange={(event) => setEditForm((prev) => ({ ...prev, role: event.target.value }))}>
              <option value="admin">Admin</option>
              <option value="moderator">Moderator</option>
              <option value="user">User</option>
            </select>
          </label>
          <label className="checkbox-row">
            <input type="checkbox" checked={editForm.is_active} onChange={(event) => setEditForm((prev) => ({ ...prev, is_active: event.target.checked }))} />
            <span>الحساب نشط</span>
          </label>
          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setEditingUser(null)}>إلغاء</Button>
            <Button onClick={handleSaveEdit} loading={busyUser === `edit-${editingUser?.username || ''}`}>حفظ التغييرات</Button>
          </div>
        </div>
      </Modal>

      <Modal open={Boolean(confirmAction)} title={confirmAction?.type === 'delete' ? 'تأكيد حذف المستخدم' : 'تأكيد تغيير الحالة'} onClose={() => setConfirmAction(null)}>
        <div className="modal-stack">
          <p>
            {confirmAction?.type === 'delete'
              ? `هل تريد حذف المستخدم ${confirmAction?.user?.username} نهائياً؟`
              : confirmAction?.user?.is_active
                ? `هل تريد حظر المستخدم ${confirmAction?.user?.username}؟`
                : `هل تريد استعادة المستخدم ${confirmAction?.user?.username}؟`}
          </p>
          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setConfirmAction(null)}>إلغاء</Button>
            <Button onClick={handleConfirmAction} loading={busyUser === `${confirmAction?.type}-${confirmAction?.user?.username || ''}`}>
              {confirmAction?.type === 'delete' ? 'تأكيد الحذف' : 'تأكيد العملية'}
            </Button>
          </div>
        </div>
      </Modal>
      </div>
    </MainLayout>
  );
}
