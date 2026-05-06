import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import MainLayout from '../components/layout/MainLayout.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import EmptyState from '../components/feedback/EmptyState.jsx';
import ErrorState from '../components/feedback/ErrorState.jsx';
import { ListSkeleton } from '../components/feedback/Skeleton.jsx';
import { followUser, getUsers } from '../api/users.js';
import { getCurrentUsername } from '../utils/auth.js';
import useDebouncedValue from '../hooks/useDebouncedValue.js';

async function fetchUsers() {
  const { data } = await getUsers();
  return Array.isArray(data) ? data : [];
}

export default function Users() {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState([]);
  const [actionError, setActionError] = useState('');
  const [busyUser, setBusyUser] = useState('');
  const navigate = useNavigate();
  const currentUser = getCurrentUsername();
  const debouncedQuery = useDebouncedValue(query, 250);
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });

  useEffect(() => {
    setItems(Array.isArray(data) ? data : []);
  }, [data]);

  const users = useMemo(() => {
    const list = (items || [])
      .filter((user) => (user?.username || user?.name) && (user.username || user.name) !== currentUser)
      .map((user) => ({ ...user, username: user.username || user.name }));

    if (!debouncedQuery) return list;
    return list.filter((user) => user.username.toLowerCase().includes(debouncedQuery.toLowerCase()));
  }, [currentUser, items, debouncedQuery]);

  const suggestions = useMemo(() => users.slice(0, 5).map((user) => user.username), [users]);

  const handleFollowToggle = async (user) => {
    try {
      setBusyUser(user.username);
      setActionError('');
      const { data: response } = await followUser(user.username);
      setItems((prev) => prev.map((item) => {
        const username = item.username || item.name;
        if (username !== user.username) return item;
        return {
          ...item,
          following: Boolean(response?.following),
          followers_count: Number(response?.followers ?? item.followers_count ?? 0),
          following_count: Number(item.following_count ?? 0),
        };
      }));
    } catch (err) {
      setActionError(err?.response?.data?.message || err?.response?.data?.detail || 'تعذر تحديث حالة المتابعة.');
    } finally {
      setBusyUser('');
    }
  };

  return (
    <MainLayout>
      <div className="section-head">
        <div>
          <h3 className="section-title">Users</h3>
          <p className="muted">بحث مباشر، فتح الملف الشخصي، بدء الشات، ومتابعة أو إلغاء المتابعة بسرعة من نفس الصفحة.</p>
        </div>
      </div>

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
              <span className="muted">{user.following ? 'أنت متابع الحساب ده' : 'جاهز للدردشة والمتابعة'}</span>
              <div className="profile-mini-stats">
                <span>المتابعون {Number(user.followers_count || 0)}</span>
                <span>يتابع {Number(user.following_count || 0)}</span>
              </div>
            </div>
            <div className="user-row-actions">
              <Button variant="secondary" onClick={() => navigate(`/profile/${encodeURIComponent(user.username)}`)}>الملف الشخصي</Button>
              <Button variant="secondary" onClick={() => navigate(`/chat/${encodeURIComponent(user.username)}`)}>فتح الشات</Button>
              <Button onClick={() => handleFollowToggle(user)} disabled={busyUser === user.username}>
                {busyUser === user.username ? 'جارٍ التحديث...' : user.following ? 'إلغاء المتابعة' : 'متابعة'}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </MainLayout>
  );
}
