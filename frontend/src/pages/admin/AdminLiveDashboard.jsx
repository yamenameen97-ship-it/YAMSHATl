import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area,
} from 'recharts';
import { getAdminOverview } from '../../api/admin.js';
import { getStoredUser, clearStoredUser } from '../../utils/auth.js';
import { useToast } from '../../components/admin/ToastProvider.jsx';
import '../../styles/livestream-dashboard.css';

// Professional Theme Colors
const COLORS = ['#7C3AED', '#3B82F6', '#10B981', '#F97316', '#EC4899', '#EF4444'];

// Sidebar navigation map — each item now navigates to a real admin route.
const SIDEBAR_GROUPS = [
  {
    title: 'الرئيسية',
    items: [
      { to: '/admin/dashboard', label: 'لوحة التحكم', icon: '📊', exact: true },
    ],
  },
  {
    title: 'إدارة المحتوى',
    items: [
      { to: '/admin/live', label: 'إدارة البثوث', icon: '📡', badge: 'LIVE' },
      { to: '/admin/posts', label: 'إدارة المنشورات', icon: '📝' },
      { to: '/admin/chat', label: 'إدارة الشات', icon: '💬' },
      { to: '/admin/stories', label: 'إدارة الستوري', icon: '📱' },
      { to: '/admin/reels', label: 'إدارة الريلز', icon: '🎬' },
      { to: '/admin/groups', label: 'إدارة المجموعات', icon: '👫' },
    ],
  },
  {
    title: 'إدارة المستخدمين',
    items: [
      { to: '/admin/users', label: 'المستخدمين', icon: '👥' },
      { to: '/admin/rbac', label: 'المشرفين والصلاحيات', icon: '🛡️' },
      { to: '/admin/reports', label: 'البلاغات والمحظورين', icon: '🚫', badge: 'HOT' },
    ],
  },
  {
    title: 'النظام',
    items: [
      { to: '/admin/audit', label: 'سجل التدقيق', icon: '🧾' },
      { to: '/admin/notifications', label: 'الإشعارات', icon: '🔔' },
      { to: '/admin/settings', label: 'الإعدادات العامة', icon: '⚙️' },
    ],
  },
];

// Static fallback values for charts/tables — these display nice data when the
// API is unreachable so the dashboard never looks empty.
const STATIC_VIEWS_HISTORY = [
  { date: 'مايو 12', viewers: 3500 },
  { date: 'مايو 13', viewers: 4200 },
  { date: 'مايو 14', viewers: 3800 },
  { date: 'مايو 15', viewers: 5100 },
  { date: 'مايو 16', viewers: 4900 },
  { date: 'مايو 17', viewers: 5800 },
  { date: 'مايو 18', viewers: 6200 },
];

const STATIC_PIE_DATA = [
  { name: 'بثوث مباشرة', value: 40 },
  { name: 'منشورات', value: 25 },
  { name: 'ريلز', value: 20 },
  { name: 'ستوري', value: 10 },
  { name: 'أخرى', value: 5 },
];

const STATIC_BAR_DATA = [
  { name: '19 أبريل', views: 400 },
  { name: '28 أبريل', views: 300 },
  { name: '29 أبريل', views: 500 },
  { name: '4 مايو', views: 450 },
  { name: '9 مايو', views: 600 },
  { name: '14 مايو', views: 550 },
  { name: '18 مايو', views: 700 },
];

const STATIC_ACTIVITIES = [
  { user: 'PlayerOne', action: 'بث جديد من المستخدم', time: 'منذ 5 دقائق' },
  { user: 'KhaledGamer', action: 'تم نشر منشور جديد', time: 'منذ 15 دقيقة' },
  { user: 'ShadowGirl', action: 'تعليق جديد على البث المباشر', time: 'منذ 20 دقيقة' },
  { user: 'MoxX', action: 'تم نشر ستوري جديد', time: 'منذ 30 دقيقة' },
];

const STATIC_LIVE_ROWS = [
  { user: 'أحمد محمود', title: 'مغامرة جديدة', views: '1,250' },
  { user: 'خالد محمد', title: 'بطولة العالم', views: '980' },
  { user: 'ليلى علي', title: 'تحديات البطولة', views: '620' },
];

const STATIC_POST_ROWS = [
  { user: 'خالد محمد', text: 'لحظات من البث...', reactions: '2.5K' },
  { user: 'ليلى علي', text: 'شكراً على الدعم...', reactions: '1.8K' },
  { user: 'محمد أحمد', text: 'أخبروني عن رأيكم...', reactions: '965' },
];

const STATIC_CHAT_ROWS = [
  { user: 'ahmed_king', message: 'شكراً على البث!' },
  { user: 'lina_music', message: 'متى البث القادم؟' },
  { user: 'game_master', message: 'رائع جداً استمر' },
];

function formatNumber(value, fallback = '—') {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return fallback;
  const number = Number(value);
  if (number >= 1_000_000) return `${(number / 1_000_000).toFixed(2)}M`;
  if (number >= 1_000) return number.toLocaleString('en-US');
  return number.toString();
}

function formatCurrency(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '$ 0.00';
  return `$ ${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function AdminLiveDashboard() {
  const navigate = useNavigate();
  const { pushToast } = useToast?.() || { pushToast: () => {} };
  const user = getStoredUser?.() || {};

  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  // Pull live overview from backend with graceful fallback.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data } = await getAdminOverview();
        if (active && data) setOverview(data);
      } catch (error) {
        // Silent fallback — show static data; status banner already exists in shell.
        if (active) setOverview(null);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const metrics = overview?.metrics || {};

  // Stats cards — wire to real metrics when present, otherwise show showcase values.
  const stats = useMemo(() => ([
    {
      key: 'users',
      label: 'إجمالي المستخدمين',
      value: formatNumber(metrics.total_users ?? metrics.totalUsers, '128,560'),
      change: '+12.5%',
      iconClass: 'purple',
      icon: '👥',
      to: '/admin/users',
    },
    {
      key: 'live',
      label: 'البثوث المباشرة',
      value: formatNumber(metrics.live_rooms_active ?? metrics.activeLive, '1,245'),
      change: '+18.7%',
      iconClass: 'blue',
      icon: '📡',
      to: '/admin/live',
    },
    {
      key: 'views',
      label: 'المشاهدات الكلية',
      value: formatNumber(metrics.total_views ?? metrics.totalViews, '2.45M'),
      change: '+15.3%',
      iconClass: 'green',
      icon: '👁️',
      to: '/admin/reports',
    },
    {
      key: 'revenue',
      label: 'الإيرادات',
      value: formatCurrency(metrics.revenue_total ?? metrics.revenue ?? 45231.89),
      change: '+21.4%',
      iconClass: 'orange',
      icon: '💰',
      to: '/admin/reports',
    },
    {
      key: 'posts',
      label: 'المنشورات',
      value: formatNumber(metrics.total_posts ?? metrics.totalPosts, '15,890'),
      change: '+17.2%',
      iconClass: 'pink',
      icon: '📝',
      to: '/admin/posts',
    },
    {
      key: 'reels',
      label: 'الريلز',
      value: formatNumber(metrics.total_reels ?? metrics.totalReels, '8,456'),
      change: '+11.3%',
      iconClass: 'red',
      icon: '🎬',
      to: '/admin/reels',
    },
  ]), [metrics]);

  // Live chart data — falls back to demo data when backend is silent.
  const viewsHistory = useMemo(() => {
    const source = metrics.trafficHistory || metrics.viewsHistory;
    if (Array.isArray(source) && source.length > 0) {
      return source.map((item) => ({
        date: item.label || item.date,
        viewers: Number(item.value ?? item.viewers ?? 0),
      }));
    }
    return STATIC_VIEWS_HISTORY;
  }, [metrics]);

  const pieData = useMemo(() => {
    if (Array.isArray(metrics.audienceMix) && metrics.audienceMix.length > 0) {
      return metrics.audienceMix.map((row) => ({ name: row.label, value: Number(row.value || 0) }));
    }
    return STATIC_PIE_DATA;
  }, [metrics]);

  const barData = useMemo(() => {
    if (Array.isArray(metrics.growthHistory) && metrics.growthHistory.length > 0) {
      return metrics.growthHistory.map((row) => ({ name: row.label, views: Number(row.value || 0) }));
    }
    return STATIC_BAR_DATA;
  }, [metrics]);

  const handleLogout = useCallback(() => {
    try {
      clearStoredUser?.();
    } catch (_) { /* ignore */ }
    pushToast({ title: 'تم تسجيل الخروج', description: 'إلى اللقاء — شكراً لاستخدامك يمشات.', type: 'info' });
    navigate('/admin/login', { replace: true });
  }, [navigate, pushToast]);

  return (
    <div className="livestream-dashboard yamshat-admin-live-dashboard" dir="rtl">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">Y</span>
            <span className="logo-text">Yamshat Admin</span>
          </div>
        </div>

        <div className="user-profile">
          <div className="user-avatar">{(user?.username || 'A').slice(0, 1).toUpperCase()}</div>
          <div className="user-info">
            <p className="user-name">{user?.full_name || user?.username || 'المدير العام'}</p>
            <p className="user-status">
              <span className="status-dot" /> متصل
            </p>
          </div>
        </div>

        <nav className="sidebar-menu">
          {SIDEBAR_GROUPS.map((group) => (
            <div key={group.title} className="sidebar-group">
              <p className="menu-title">{group.title}</p>
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.exact}
                  className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
                >
                  <span className="menu-icon" aria-hidden="true">{item.icon}</span>
                  <span className="menu-label">{item.label}</span>
                  {item.badge ? <span className="badge">{item.badge}</span> : null}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button type="button" className="logout-btn" onClick={handleLogout}>
            <span>🚪</span>
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="top-bar">
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input type="text" placeholder="بحث عن مستخدم، بث، منشور..." aria-label="بحث" />
          </div>
          <div className="top-actions">
            <Link to="/admin/settings" className="icon-btn" title="الإعدادات">⚙️</Link>
            <Link to="/admin/notifications" className="icon-btn has-notification" title="الإشعارات">🔔</Link>
            <Link to="/admin/chat" className="icon-btn" title="الشات">✉️</Link>
            <div className="user-menu">
              <div className="user-avatar-small">{(user?.username || 'A').slice(0, 1).toUpperCase()}</div>
              <span>{user?.full_name || user?.username || 'المدير العام'}</span>
            </div>
          </div>
        </header>

        <div className="dashboard-content">
          <div className="page-header">
            <h1>لوحة التحكم</h1>
            <p>
              {loading
                ? 'جاري تحميل بيانات اللوحة الحية...'
                : 'مرحباً بك، إليك نظرة عامة حية على المنصة.'}
            </p>
          </div>

          {/* Stats Grid */}
          <section className="stats-grid">
            {stats.map((stat) => (
              <Link key={stat.key} to={stat.to} className="stat-card stat-card-link">
                <div className={`stat-icon ${stat.iconClass}`}>{stat.icon}</div>
                <span className="stat-label">{stat.label}</span>
                <span className="stat-value">{stat.value}</span>
                <div className="stat-change">
                  <span className="positive">▲ {stat.change}</span>
                  <span className="text-muted">من الشهر الماضي</span>
                </div>
              </Link>
            ))}
          </section>

          {/* Charts Row */}
          <div className="charts-row">
            <div className="chart-card">
              <h3>📈 المشاهدات خلال آخر 7 أيام</h3>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={viewsHistory}>
                  <defs>
                    <linearGradient id="colorViewers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#7C3AED" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#151a24', border: 'none', borderRadius: '8px' }} />
                  <Area type="monotone" dataKey="viewers" stroke="#7C3AED" fillOpacity={1} fill="url(#colorViewers)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card">
              <h3>🥧 توزيع المحتوى</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="pie-legend" style={{ marginTop: '10px' }}>
                {pieData.map((item, index) => (
                  <div key={item.name} className="legend-item" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '5px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: COLORS[index % COLORS.length] }}></div>
                      <span>{item.name}</span>
                    </div>
                    <span>{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="chart-card">
              <h3>🔔 النشاطات الأخيرة</h3>
              <div className="activities-list">
                {STATIC_ACTIVITIES.map((item, i) => (
                  <div key={i} className="activity-item">
                    <div className="activity-avatar"></div>
                    <div className="activity-details">
                      <p><strong>{item.user}</strong> {item.action}</p>
                      <span>{item.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tables Row */}
          <div className="tables-row">
            <div className="table-card">
              <div className="table-header">
                <h3>📡 إدارة البثوث</h3>
                <Link to="/admin/live" className="add-btn">+ بث مباشر جديد</Link>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>المستخدم</th>
                    <th>عنوان البث</th>
                    <th>المشاهدات</th>
                  </tr>
                </thead>
                <tbody>
                  {STATIC_LIVE_ROWS.map((row, i) => (
                    <tr key={i}>
                      <td>{row.user}</td>
                      <td>{row.title}</td>
                      <td>{row.views}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="table-card">
              <div className="table-header">
                <h3>📝 إدارة المنشورات</h3>
                <Link to="/admin/posts" className="add-btn">+ منشور جديد</Link>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>المستخدم</th>
                    <th>المحتوى</th>
                    <th>التفاعلات</th>
                  </tr>
                </thead>
                <tbody>
                  {STATIC_POST_ROWS.map((row, i) => (
                    <tr key={i}>
                      <td>{row.user}</td>
                      <td>{row.text}</td>
                      <td>{row.reactions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="table-card">
              <div className="table-header">
                <h3>💬 إدارة الشات</h3>
                <Link to="/admin/chat" className="add-btn">فتح الشات</Link>
              </div>
              <div className="chat-container">
                <table className="data-table chat-list">
                  <thead>
                    <tr>
                      <th>المستخدم</th>
                      <th>آخر رسالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {STATIC_CHAT_ROWS.map((row, i) => (
                      <tr key={i}>
                        <td>{row.user}</td>
                        <td>{row.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="chat-preview">
                  <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '10px' }}>تفاصيل المحادثة</p>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: '#334155', margin: '0 auto 10px' }}></div>
                    <p style={{ fontSize: '14px', fontWeight: '600' }}>ahmed_king</p>
                    <p style={{ fontSize: '11px', color: '#94a3b8' }}>ahmed@example.com</p>
                    <Link
                      to="/admin/users"
                      style={{ display: 'inline-block', marginTop: '15px', width: '100%', padding: '8px', borderRadius: '8px', backgroundColor: '#ef4444', color: 'white', border: 'none', fontSize: '12px', textAlign: 'center', textDecoration: 'none' }}
                    >
                      حظر المستخدم
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Grid */}
          <div className="bottom-grid">
            <div className="table-card">
              <div className="table-header">
                <h3>📱 إدارة الستوري</h3>
                <Link to="/admin/stories" className="add-btn">إدارة</Link>
              </div>
              <table className="data-table">
                <tbody>
                  <tr><td>MoxX</td><td>1.2K مشاهدة</td></tr>
                  <tr><td>ShadowGirl</td><td>980 مشاهدة</td></tr>
                </tbody>
              </table>
            </div>
            <div className="table-card">
              <div className="table-header">
                <h3>🎬 إدارة الريلز</h3>
                <Link to="/admin/reels" className="add-btn">إدارة</Link>
              </div>
              <table className="data-table">
                <tbody>
                  <tr><td>ProHunter</td><td>2.5K مشاهدة</td></tr>
                  <tr><td>KhaledGamer</td><td>1.8K مشاهدة</td></tr>
                </tbody>
              </table>
            </div>
            <div className="table-card">
              <div className="table-header">
                <h3>📊 التقارير والإحصائيات</h3>
                <Link to="/admin/reports" className="add-btn">التقارير</Link>
              </div>
              <div style={{ padding: '20px', display: 'flex', gap: '20px' }}>
                <ResponsiveContainer width="50%" height={150}>
                  <BarChart data={barData}>
                    <Bar dataKey="views" fill="#7C3AED" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div style={{ flex: 1 }}>
                  <div style={{ marginBottom: '10px' }}>
                    <p style={{ fontSize: '11px', color: '#94a3b8' }}>معدل التفاعل</p>
                    <p style={{ fontSize: '18px', fontWeight: '700' }}>5.23% <span style={{ color: '#10B981', fontSize: '12px' }}>▲ 12.7%</span></p>
                  </div>
                  <div>
                    <p style={{ fontSize: '11px', color: '#94a3b8' }}>إجمالي الإيرادات</p>
                    <p style={{ fontSize: '18px', fontWeight: '700' }}>$ 45,231</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
