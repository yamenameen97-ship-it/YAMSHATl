import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import MainLayout from '../components/layout/MainLayout.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import EmptyState from '../components/feedback/EmptyState.jsx';
import ErrorState from '../components/feedback/ErrorState.jsx';
import { ListSkeleton } from '../components/feedback/Skeleton.jsx';
import { getUsers } from '../api/users.js';
import { getCurrentUsername } from '../utils/auth.js';
import useDebouncedValue from '../hooks/useDebouncedValue.js';

async function fetchUsers() {
  const { data } = await getUsers();
  return Array.isArray(data) ? data : [];
}

export default function Users() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const currentUser = getCurrentUsername();
  const debouncedQuery = useDebouncedValue(query, 250);
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });

  const users = useMemo(() => {
    const list = (data || [])
      .filter((user) => (user?.username || user?.name) && (user.username || user.name) !== currentUser)
      .map((user) => ({ ...user, username: user.username || user.name }));

    if (!debouncedQuery) return list;
    return list.filter((user) => user.username.toLowerCase().includes(debouncedQuery.toLowerCase()));
  }, [currentUser, data, debouncedQuery]);

  const suggestions = useMemo(() => users.slice(0, 5).map((user) => user.username), [users]);

  return (
    <MainLayout>
      <div className="section-head">
        <div>
          <h3 className="section-title">Users</h3>
          <p className="muted">بحث مباشر مع Debounce وسجل اقتراحات سريع لبدء محادثة خاصة مباشرة.</p>
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

      {isLoading ? <ListSkeleton count={8} /> : null}
      {isError ? (
        <ErrorState title="تعذر تحميل المستخدمين" description={error?.response?.data?.message || error?.message} onRetry={refetch} />
      ) : null}
      {!isLoading && !isError && users.length === 0 ? (
        <EmptyState icon="🧑‍🤝‍🧑" title="لا يوجد مستخدمون مطابقون" description="جرّب كلمة بحث مختلفة أو أعد التحديث." actionLabel="تحديث" onAction={refetch} />
      ) : null}

      <div className="list-grid">
        {users.map((user) => (
          <Card key={user.username} className="user-row responsive-user-row">
            <div className="avatar-circle">{user.username.slice(0, 1).toUpperCase()}</div>
            <div className="user-meta">
              <strong>{user.username}</strong>
              <span className="muted">جاهز للدردشة</span>
            </div>
            <Button onClick={() => navigate(`/chat/${encodeURIComponent(user.username)}`)}>فتح الشات</Button>
          </Card>
        ))}
      </div>
    </MainLayout>
  );
}
