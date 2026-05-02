import { useEffect, useMemo, useState } from 'react';
import MainLayout from '../components/layout/MainLayout.jsx';
import Card from '../components/ui/Card.jsx';
import { getUsers } from '../api/users.js';
import { getChatThreads, updateOnline } from '../api/chat.js';
import { getStoredUser } from '../utils/auth.js';

export default function Dashboard() {
  const [usersCount, setUsersCount] = useState(0);
  const [threadsCount, setThreadsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const user = getStoredUser();

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        const [usersRes, threadsRes] = await Promise.all([getUsers(), getChatThreads(), updateOnline(true)]);
        if (!mounted) return;
        setUsersCount(Array.isArray(usersRes.data) ? usersRes.data.length : 0);
        setThreadsCount(Array.isArray(threadsRes.data) ? threadsRes.data.length : 0);
      } catch (err) {
        if (!mounted) return;
        setError(err?.response?.data?.message || 'تعذر تحميل بيانات اللوحة.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const stats = useMemo(
    () => [
      { title: 'عدد المستخدمين', value: loading ? '...' : usersCount, meta: 'مأخوذ من API المستخدمين' },
      { title: 'عدد المحادثات', value: loading ? '...' : threadsCount, meta: 'محادثاتك الحالية' },
      { title: 'الحساب الحالي', value: user?.user || '—', meta: user?.role || 'member' },
    ],
    [loading, threadsCount, user, usersCount]
  );

  return (
    <MainLayout>
      <section className="hero-grid">
        <Card className="hero-card">
          <div className="hero-copy">
            <span className="badge">لوحة احترافية</span>
            <h3>YAMSHAT React Frontend</h3>
            <p>
              تم استبدال الواجهة القديمة بواجهة React حديثة فيها Login محمي وUsers وInbox وPrivate Chat.
            </p>
          </div>
        </Card>

        <Card>
          <h3 className="section-title">نظرة سريعة</h3>
          <p className="muted">الشكل الجديد مبني على تصميم داكن ومرتب وقابل للتوسّع لاحقاً.</p>
        </Card>
      </section>

      {error ? <div className="alert error">{error}</div> : null}

      <section className="stats-grid">
        {stats.map((item) => (
          <Card key={item.title}>
            <div className="stat-title">{item.title}</div>
            <div className="stat-value">{item.value}</div>
            <div className="muted">{item.meta}</div>
          </Card>
        ))}
      </section>
    </MainLayout>
  );
}
