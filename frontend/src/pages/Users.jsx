import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import { getUsers } from '../api/users.js';
import { getCurrentUsername } from '../utils/auth.js';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const currentUser = getCurrentUsername();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const { data } = await getUsers();
        setUsers(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err?.response?.data?.message || 'تعذر تحميل المستخدمين.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <MainLayout>
      <div className="section-head">
        <div>
          <h3 className="section-title">Users</h3>
          <p className="muted">قائمة المستخدمين المتاحين لبدء محادثة خاصة مباشرة.</p>
        </div>
      </div>

      {error ? <div className="alert error">{error}</div> : null}
      {loading ? <div className="empty-state">جارٍ تحميل المستخدمين...</div> : null}

      <div className="list-grid">
        {users
          .filter((user) => user?.name && user.name !== currentUser)
          .map((user) => (
            <Card key={user.name} className="user-row">
              <div className="avatar-circle">{user.name.slice(0, 1).toUpperCase()}</div>
              <div className="user-meta">
                <strong>{user.name}</strong>
                <span className="muted">جاهز للدردشة</span>
              </div>
              <Button onClick={() => navigate(`/chat/${encodeURIComponent(user.name)}`)}>فتح الشات</Button>
            </Card>
          ))}
      </div>
    </MainLayout>
  );
}
