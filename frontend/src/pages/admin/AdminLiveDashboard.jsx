import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts';
import { getAdminOverview } from '../../api/admin.js';
import { getStoredUser, clearStoredUser } from '../../utils/auth.js';
import { useToast } from '../../components/admin/ToastProvider.jsx';
import '../../styles/livestream-dashboard.css';

const COLORS = ['#7C3AED', '#3B82F6', '#10B981', '#F97316', '#EC4899', '#EF4444'];
const SIDEBAR_GROUPS = [
  { title: 'الرئيسية', items: [{ to: '/admin/dashboard', label: 'لوحة التحكم', icon: '📊', exact: true }] },
  { title: 'إدارة المحتوى', items: [
    { to: '/admin/live', label: 'إدارة البثوث', icon: '📡', badge: 'LIVE' },
    { to: '/admin/posts', label: 'إدارة المنشورات', icon: '📝' },
    { to: '/admin/chat', label: 'إدارة الشات', icon: '💬' },
    { to: '/admin/stories', label: 'إدارة الستوري', icon: '📱' },
    { to: '/admin/reels', label: 'إدارة الريلز', icon: '🎬' },
    { to: '/admin/groups', label: 'إدارة المجموعات', icon: '👫' },
  ] },
  { title: 'إدارة المستخدمين', items: [
    { to: '/admin/users', label: 'المستخدمين', icon: '👥' },
    { to: '/admin/rbac', label: 'المشرفين والصلاحيات', icon: '🛡️' },
    { to: '/admin/reports', label: 'البلاغات والمحظورين', icon: '🚫', badge: 'HOT' },
  ] },
  { title: 'النظام', items: [
    { to: '/admin/audit', label: 'سجل التدقيق', icon: '🧾' },
    { to: '/admin/notifications', label: 'الإشعارات', icon: '🔔' },
    { to: '/admin/settings', label: 'الإعدادات العامة', icon: '⚙️' },
  ] },
];

function formatNumber(value, fallback = '—') {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return fallback;
  const number = Number(value);
  if (number >= 1_000_000) return `${(number / 1_000_000).toFixed(2)}M`;
  if (number >= 1_000) return number.toLocaleString('en-US');
  return number.toString();
}

function formatCurrency(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return `$ ${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function EmptyBlock({ text = 'لا توجد بيانات متاحة حالياً.' }) {
  return <div style={{ color: '#94a3b8', textAlign: 'center', padding: '18px 12px' }}>{text}</div>;
}

export default function AdminLiveDashboard() {
  const navigate = useNavigate();
  const { pushToast } = useToast?.() || { pushToast: () => {} };
  const user = getStoredUser?.() || {};
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadOverview = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await getAdminOverview();
      setOverview(data || null);
    } catch (error) {
      setOverview(null);
      pushToast({ type: 'warning', title: 'تعذر تحميل لوحة البث', description: error?.response?.data?.detail || 'الخادم لم يرجع بيانات حالياً.' });
    } finally {
      setLoading(false);
    }
  }, [pushToast]);

  useEffect(() => { loadOverview(); }, [loadOverview]);

  const metrics = overview?.metrics || {};
  const stats = useMemo(() => ([
    { key: 'users', label: 'إجمالي المستخدمين', value: formatNumber(metrics.total_users ?? metrics.totalUsers ?? 0, '0'), iconClass: 'purple', icon: '👥', to: '/admin/users' },
    { key: 'live', label: 'البثوث المباشرة', value: formatNumber(metrics.live_rooms_active ?? metrics.activeLive ?? 0, '0'), iconClass: 'blue', icon: '📡', to: '/admin/live' },
    { key: 'views', label: 'المشاهدات الكلية', value: formatNumber(metrics.total_views ?? metrics.totalViews ?? 0, '0'), iconClass: 'green', icon: '👁️', to: '/admin/reports' },
    { key: 'revenue', label: 'الإيرادات', value: formatCurrency(metrics.revenue_total ?? metrics.revenue ?? 0), iconClass: 'orange', icon: '💰', to: '/admin/reports' },
    { key: 'posts', label: 'المنشورات', value: formatNumber(metrics.total_posts ?? metrics.totalPosts ?? 0, '0'), iconClass: 'pink', icon: '📝', to: '/admin/posts' },
    { key: 'reels', label: 'الريلز', value: formatNumber(metrics.total_reels ?? metrics.totalReels ?? 0, '0'), iconClass: 'red', icon: '🎬', to: '/admin/reels' },
  ]), [metrics]);

  const viewsHistory = useMemo(() => {
    const source = metrics.trafficHistory || metrics.viewsHistory || metrics.traffic_history || metrics.views_history;
    if (!Array.isArray(source)) return [];
    return source.map((item) => ({ date: item.label || item.date || item.name || '—', viewers: Number(item.value ?? item.viewers ?? item.views ?? 0) })).filter((item) => item.date);
  }, [metrics]);

  const pieData = useMemo(() => {
    const source = metrics.audienceMix || metrics.audience_mix || metrics.content_mix;
    if (!Array.isArray(source)) return [];
    return source.map((row) => ({ name: row.label || row.name || '—', value: Number(row.value || 0) })).filter((item) => item.value > 0);
  }, [metrics]);

  const barData = useMemo(() => {
    const source = metrics.growthHistory || metrics.growth_history || metrics.bar_data;
    if (!Array.isArray(source)) return [];
    return source.map((row) => ({ name: row.label || row.name || '—', views: Number(row.value ?? row.views ?? 0) })).filter((item) => item.views > 0);
  }, [metrics]);

  const recentActivity = useMemo(() => {
    const source = overview?.activity_stream || overview?.activities || overview?.recent_activity || [];
    if (!Array.isArray(source)) return [];
    return source.slice(0, 6).map((item, index) => ({
      id: item.id || `activity-${index}`,
      user: item.user || item.username || item.actor || 'النظام',
      action: item.action || item.description || item.title || 'تحديث جديد',
      time: item.created_at || item.timestamp ? new Date(item.created_at || item.timestamp).toLocaleString('ar-EG') : 'الآن',
    }));
  }, [overview]);

  const tableRows = useMemo(() => {
    const source = overview?.content_tables || overview?.tables || {};
    return {
      live: Array.isArray(source.live) ? source.live : [],
      posts: Array.isArray(source.posts) ? source.posts : [],
      chat: Array.isArray(source.chat) ? source.chat : [],
      stories: Array.isArray(source.stories) ? source.stories : [],
      reels: Array.isArray(source.reels) ? source.reels : [],
    };
  }, [overview]);

  const handleLogout = useCallback(() => {
    try { clearStoredUser?.(); } catch (_) {}
    pushToast({ title: 'تم تسجيل الخروج', description: 'إلى اللقاء — شكراً لاستخدامك يمشات.', type: 'info' });
    navigate('/admin/login', { replace: true });
  }, [navigate, pushToast]);

  return (
    <div className="livestream-dashboard yamshat-admin-live-dashboard" dir="rtl">
      <aside className="sidebar">
        <div className="sidebar-header"><div className="logo"><span className="logo-icon">Y</span><span className="logo-text">Yamshat Admin</span></div></div>
        <div className="user-profile"><div className="user-avatar">{(user?.username || 'A').slice(0, 1).toUpperCase()}</div><div className="user-info"><p className="user-name">{user?.full_name || user?.username || 'المدير العام'}</p><p className="user-status"><span className="status-dot" /> متصل</p></div></div>
        <nav className="sidebar-menu">{SIDEBAR_GROUPS.map((group) => <div key={group.title} className="nav-group"><div className="nav-group-title">{group.title}</div>{group.items.map((item) => <NavLink key={item.to} to={item.to} end={Boolean(item.exact)} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}><span>{item.icon}</span><span>{item.label}</span>{item.badge ? <small>{item.badge}</small> : null}</NavLink>)}</div>)}</nav>
        <button type="button" className="logout-btn" onClick={handleLogout}>تسجيل الخروج</button>
      </aside>

      <main className="main-content">
        <div className="top-header"><div><h1>لوحة البث والإدارة المباشرة</h1><p>تعرض بيانات الخادم الفعلية فقط، بدون أي Demo Data أو أرقام تجريبية.</p></div><div style={{ display: 'flex', gap: 10 }}><button type="button" className="add-btn" onClick={loadOverview}>{loading ? 'جارٍ التحديث...' : 'تحديث'}</button><Link to="/admin/dashboard" className="add-btn">لوحة التحكم</Link></div></div>

        <div className="stats-grid">{stats.map((item) => <Link key={item.key} to={item.to} className="stat-card" style={{ textDecoration: 'none' }}><div className={`stat-icon ${item.iconClass}`}>{item.icon}</div><div className="stat-label">{item.label}</div><div className="stat-value">{item.value}</div></Link>)}</div>

        <div className="charts-row">
          <div className="chart-card"><h3>📈 المشاهدات</h3>{viewsHistory.length ? <ResponsiveContainer width="100%" height={260}><AreaChart data={viewsHistory}><defs><linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#7C3AED" stopOpacity={0.55} /><stop offset="95%" stopColor="#7C3AED" stopOpacity={0.05} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis /><Tooltip /><Area type="monotone" dataKey="viewers" stroke="#7C3AED" fill="url(#viewsGradient)" /></AreaChart></ResponsiveContainer> : <EmptyBlock />}</div>
          <div className="chart-card"><h3>🧩 توزيع المحتوى</h3>{pieData.length ? <ResponsiveContainer width="100%" height={260}><PieChart><Pie data={pieData} dataKey="value" nameKey="name" outerRadius={90} innerRadius={48}>{pieData.map((item, index) => <Cell key={`${item.name}-${index}`} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer> : <EmptyBlock />}</div>
          <div className="chart-card"><h3>📊 النمو</h3>{barData.length ? <ResponsiveContainer width="100%" height={260}><BarChart data={barData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="views" fill="#3B82F6" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer> : <EmptyBlock />}</div>
        </div>

        <div className="charts-row"><div className="chart-card"><h3>🔔 النشاطات الأخيرة</h3><div className="activities-list">{recentActivity.length ? recentActivity.map((item) => <div key={item.id} className="activity-item"><div className="activity-avatar"></div><div className="activity-details"><p><strong>{item.user}</strong> {item.action}</p><span>{item.time}</span></div></div>) : <EmptyBlock text="لا يوجد نشاط حديث لعرضه." />}</div></div></div>

        <div className="tables-row">
          <div className="table-card"><div className="table-header"><h3>📡 إدارة البثوث</h3><Link to="/admin/live" className="add-btn">إدارة</Link></div><table className="data-table"><thead><tr><th>المستخدم</th><th>العنوان</th><th>المشاهدات</th></tr></thead><tbody>{tableRows.live.length ? tableRows.live.map((row, i) => <tr key={i}><td>{row.user || row.username || '—'}</td><td>{row.title || '—'}</td><td>{formatNumber(row.views ?? row.viewers ?? 0, '0')}</td></tr>) : <tr><td colSpan="3"><EmptyBlock /></td></tr>}</tbody></table></div>
          <div className="table-card"><div className="table-header"><h3>📝 إدارة المنشورات</h3><Link to="/admin/posts" className="add-btn">إدارة</Link></div><table className="data-table"><thead><tr><th>المستخدم</th><th>المحتوى</th><th>التفاعلات</th></tr></thead><tbody>{tableRows.posts.length ? tableRows.posts.map((row, i) => <tr key={i}><td>{row.user || row.username || '—'}</td><td>{row.text || row.content || '—'}</td><td>{formatNumber(row.reactions ?? row.engagement ?? 0, '0')}</td></tr>) : <tr><td colSpan="3"><EmptyBlock /></td></tr>}</tbody></table></div>
          <div className="table-card"><div className="table-header"><h3>💬 إدارة الشات</h3><Link to="/admin/chat" className="add-btn">فتح الشات</Link></div><table className="data-table chat-list"><thead><tr><th>المستخدم</th><th>آخر رسالة</th></tr></thead><tbody>{tableRows.chat.length ? tableRows.chat.map((row, i) => <tr key={i}><td>{row.user || row.username || '—'}</td><td>{row.message || row.last_message || '—'}</td></tr>) : <tr><td colSpan="2"><EmptyBlock /></td></tr>}</tbody></table></div>
        </div>

        <div className="bottom-grid">
          <div className="table-card"><div className="table-header"><h3>📱 إدارة الستوري</h3><Link to="/admin/stories" className="add-btn">إدارة</Link></div><table className="data-table"><tbody>{tableRows.stories.length ? tableRows.stories.map((row, i) => <tr key={i}><td>{row.user || row.username || '—'}</td><td>{formatNumber(row.views ?? row.viewers ?? 0, '0')} مشاهدة</td></tr>) : <tr><td colSpan="2"><EmptyBlock /></td></tr>}</tbody></table></div>
          <div className="table-card"><div className="table-header"><h3>🎬 إدارة الريلز</h3><Link to="/admin/reels" className="add-btn">إدارة</Link></div><table className="data-table"><tbody>{tableRows.reels.length ? tableRows.reels.map((row, i) => <tr key={i}><td>{row.user || row.username || '—'}</td><td>{formatNumber(row.views ?? row.viewers ?? 0, '0')} مشاهدة</td></tr>) : <tr><td colSpan="2"><EmptyBlock /></td></tr>}</tbody></table></div>
          <div className="table-card"><div className="table-header"><h3>📊 التقارير والإحصائيات</h3><Link to="/admin/reports" className="add-btn">التقارير</Link></div><div style={{ padding: '20px' }}><div style={{ display: 'grid', gap: 12 }}><div><p style={{ fontSize: '11px', color: '#94a3b8' }}>معدل التفاعل</p><p style={{ fontSize: '18px', fontWeight: '700' }}>{formatNumber(metrics.engagement_rate ?? metrics.engagementRate, '—')}</p></div><div><p style={{ fontSize: '11px', color: '#94a3b8' }}>إجمالي الإيرادات</p><p style={{ fontSize: '18px', fontWeight: '700' }}>{formatCurrency(metrics.revenue_total ?? metrics.revenue ?? 0)}</p></div></div></div></div>
        </div>
      </main>
    </div>
  );
}
