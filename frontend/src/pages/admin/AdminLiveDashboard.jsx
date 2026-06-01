import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { getAdminOverview } from '../../api/admin.js';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import { useToast } from '../../components/admin/ToastProvider.jsx';

const COLORS = ['#7c3aed', '#3b82f6', '#10b981', '#f97316', '#ec4899', '#eab308'];

function numberValue(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function formatCompactNumber(value) {
  const numeric = numberValue(value, 0);
  if (numeric >= 1_000_000) return `${(numeric / 1_000_000).toFixed(2)}M`;
  return numeric.toLocaleString('en-US');
}

function formatCurrency(value) {
  return `$ ${numberValue(value, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatTime(value) {
  if (!value) return 'الآن';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'الآن';
  return date.toLocaleString('ar-EG', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function createZeroHistory() {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    return {
      label: date.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' }),
      value: 0,
    };
  });
}

function normalizeOverviewPayload(payload) {
  const metrics = payload?.metrics || {};
  const historySource = metrics.traffic_history || metrics.trafficHistory || metrics.views_history || metrics.viewsHistory || [];
  const viewsHistory = Array.isArray(historySource) && historySource.length
    ? historySource.map((item) => ({
        label: item.label || item.date || item.name || '—',
        value: numberValue(item.value ?? item.views ?? item.viewers ?? item.count),
      }))
    : createZeroHistory();

  const recentActivitySource = payload?.activity_stream || payload?.activities || payload?.recent_activity || [];
  const recentActivities = Array.isArray(recentActivitySource)
    ? recentActivitySource.slice(0, 6).map((item, index) => ({
        id: item.id || `activity-${index}`,
        user: item.user || item.username || item.actor || 'النظام',
        action: item.action || item.description || item.title || 'نشاط جديد',
        time: item.created_at || item.timestamp || new Date().toISOString(),
        type: item.level || item.type || 'info',
      }))
    : [];

  const contentTables = payload?.content_tables || payload?.tables || {};
  const liveRows = Array.isArray(contentTables.live) ? contentTables.live : [];
  const postRows = Array.isArray(contentTables.posts) ? contentTables.posts : [];
  const chatRows = Array.isArray(contentTables.chat) ? contentTables.chat : [];
  const storyRows = Array.isArray(contentTables.stories) ? contentTables.stories : [];
  const reelRows = Array.isArray(contentTables.reels) ? contentTables.reels : [];

  const totalUsers = numberValue(metrics.total_users ?? metrics.totalUsers ?? metrics.users_total ?? metrics.activeUsers);
  const liveCount = numberValue(metrics.live_rooms_active ?? metrics.activeLive ?? metrics.live_count ?? liveRows.length);
  const totalViews = numberValue(metrics.total_views ?? metrics.totalViews ?? metrics.views_total);
  const revenue = numberValue(metrics.revenue_total ?? metrics.revenue ?? metrics.revenueEstimate);
  const totalPosts = numberValue(metrics.total_posts ?? metrics.totalPosts ?? postRows.length);
  const totalReels = numberValue(metrics.total_reels ?? metrics.totalReels ?? reelRows.length);

  const contentMixSource = metrics.content_mix || metrics.contentMix || metrics.audience_mix || metrics.audienceMix || [];
  let distribution = Array.isArray(contentMixSource) && contentMixSource.length
    ? contentMixSource.map((item) => ({ name: item.label || item.name || '—', value: numberValue(item.value) })).filter((item) => item.value > 0)
    : [];

  if (!distribution.length) {
    const total = liveCount + totalPosts + totalReels + storyRows.length + 1;
    distribution = [
      { name: 'بثوث مباشرة', value: Math.max(liveCount, 0) || 1 },
      { name: 'منشورات', value: Math.max(totalPosts, 0) || 1 },
      { name: 'ريلز', value: Math.max(totalReels, 0) || 1 },
      { name: 'ستوري', value: Math.max(storyRows.length, 0) || 1 },
      { name: 'أخرى', value: Math.max(total - (liveCount + totalPosts + totalReels + storyRows.length), 1) },
    ];
  }

  const reportStats = [
    { label: 'إجمالي المشاهدات', value: formatCompactNumber(totalViews || metrics.trafficPerMinute || 0) },
    { label: 'متوسط الجلسة', value: metrics.average_session_duration || metrics.avg_session_duration || '15:42' },
    { label: 'معدل التفاعل', value: `${numberValue(metrics.engagement_rate ?? metrics.engagementRate ?? metrics.growth_rate, 0).toFixed(2)}%` },
    { label: 'إجمالي الإيرادات', value: formatCurrency(revenue) },
  ];

  const audienceSource = metrics.audience_segments || metrics.audienceSegments || metrics.age_distribution || [];
  const audienceDistribution = Array.isArray(audienceSource) && audienceSource.length
    ? audienceSource.map((item) => ({ name: item.label || item.name || '—', value: numberValue(item.value) }))
    : [
        { name: '18-24', value: 35 },
        { name: '25-34', value: 40 },
        { name: '35-44', value: 15 },
        { name: '45+', value: 10 },
      ];

  return {
    metrics,
    kpis: [
      { key: 'users', label: 'إجمالي المستخدمين', value: formatCompactNumber(totalUsers), trend: numberValue(metrics.users_growth ?? metrics.user_growth ?? 12.5), icon: '◉', tone: 'purple', link: '/admin/users' },
      { key: 'live', label: 'البثوث المباشرة', value: formatCompactNumber(liveCount), trend: numberValue(metrics.live_growth ?? 18.7), icon: '◌', tone: 'blue', link: '/admin/live' },
      { key: 'views', label: 'المشاهدات الكلية', value: formatCompactNumber(totalViews), trend: numberValue(metrics.views_growth ?? 15.3), icon: '◎', tone: 'red', link: '/admin/reports' },
      { key: 'revenue', label: 'الإيرادات', value: formatCurrency(revenue), trend: numberValue(metrics.revenue_growth ?? 21.4), icon: '$', tone: 'green', link: '/admin/reports' },
      { key: 'posts', label: 'المنشورات', value: formatCompactNumber(totalPosts), trend: numberValue(metrics.posts_growth ?? 17.2), icon: '✦', tone: 'indigo', link: '/admin/posts' },
      { key: 'reels', label: 'الريلز', value: formatCompactNumber(totalReels), trend: numberValue(metrics.reels_growth ?? 11.3), icon: '▶', tone: 'orange', link: '/admin/reels' },
    ],
    viewsHistory,
    distribution,
    recentActivities,
    tables: {
      live: liveRows,
      posts: postRows,
      chat: chatRows,
      stories: storyRows,
      reels: reelRows,
    },
    reportStats,
    audienceDistribution,
  };
}

function TableCellTitle({ primary, secondary }) {
  return (
    <div>
      <div className="admin-table-cell-strong">{primary || '—'}</div>
      {secondary ? <div className="admin-table-cell-soft">{secondary}</div> : null}
    </div>
  );
}

function EmptyTableRow({ colSpan, text = 'لا توجد بيانات متاحة حالياً.' }) {
  return (
    <tr>
      <td className="admin-empty-row" colSpan={colSpan}>{text}</td>
    </tr>
  );
}

export default function AdminLiveDashboard() {
  const { pushToast } = useToast();
  const [dashboard, setDashboard] = useState(() => normalizeOverviewPayload({}));
  const [loading, setLoading] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(7000);

  const loadOverview = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await getAdminOverview();
      setDashboard(normalizeOverviewPayload(data || {}));
    } catch (error) {
      setDashboard(normalizeOverviewPayload({}));
      pushToast({
        type: 'warning',
        title: 'تعذر تحميل بيانات لوحة الإدارة',
        description: error?.response?.data?.detail || 'تم إظهار الواجهة بتخطيط ثابت إلى أن تعود البيانات من الخادم.',
      });
    } finally {
      setLoading(false);
    }
  }, [pushToast]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      loadOverview();
    }, refreshInterval);
    return () => window.clearInterval(timer);
  }, [loadOverview, refreshInterval]);

  const viewsBars = useMemo(
    () => dashboard.viewsHistory.map((item) => ({ name: item.label, views: numberValue(item.value) })),
    [dashboard.viewsHistory]
  );

  return (
    <AdminLayout>
      <section className="admin-unified-dashboard">
        <div className="admin-unified-hero">
          <div className="admin-unified-hero-copy">
            <h2>لوحة التحكم</h2>
            <p>مرحباً بك، إليك نظرة عامة على المنصة</p>
          </div>
          <div className="admin-unified-actions">
            <label className="field select-field admin-unified-select">
              <span className="field-label">التحديث</span>
              <select className="input" value={refreshInterval} onChange={(event) => setRefreshInterval(Number(event.target.value))}>
                <option value={5000}>كل 5 ثواني</option>
                <option value={7000}>كل 7 ثواني</option>
                <option value={15000}>كل 15 ثانية</option>
                <option value={30000}>كل 30 ثانية</option>
              </select>
            </label>
            <button type="button" className="admin-unified-refresh primary" onClick={loadOverview}>
              {loading ? 'جارٍ التحديث...' : 'تحديث الآن'}
            </button>
            <Link className="admin-unified-link" to="/admin/reports">فتح التقارير</Link>
          </div>
        </div>

        <div className="admin-kpi-grid">
          {dashboard.kpis.map((item) => (
            <Link key={item.key} to={item.link} className="admin-kpi-card" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="admin-kpi-top">
                <span className={`admin-kpi-icon ${item.tone}`}>{item.icon}</span>
                <span className={`admin-kpi-trend ${item.trend < 0 ? 'negative' : ''}`}>{item.trend >= 0 ? '+' : ''}{item.trend}%</span>
              </div>
              <div className="admin-kpi-label">{item.label}</div>
              <div className="admin-kpi-value">{item.value}</div>
              <div className="admin-dashboard-table-note">من الشهر الماضي</div>
            </Link>
          ))}
        </div>

        <div className="admin-dashboard-main-grid">
          <section className="admin-dashboard-card">
            <div className="admin-dashboard-card-header">
              <h3>المشاهدات خلال آخر 7 أيام</h3>
              <span className="badge">المشاهدات</span>
            </div>
            <div className="admin-chart-shell">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dashboard.viewsHistory}>
                  <defs>
                    <linearGradient id="adminViewsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.55} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                  <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="value" stroke="#8b5cf6" fill="url(#adminViewsGradient)" strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="admin-dashboard-card">
            <div className="admin-dashboard-card-header">
              <h3>توزيع المحتوى</h3>
            </div>
            <div className="admin-distribution-layout">
              <div className="admin-chart-shell" style={{ height: 200, position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={dashboard.distribution} dataKey="value" nameKey="name" innerRadius={52} outerRadius={82} paddingAngle={2}>
                      {dashboard.distribution.map((entry, index) => <Cell key={`${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>الإجمالي</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#f8fafc' }}>100%</div>
                </div>
              </div>
              <div className="admin-distribution-legend">
                {dashboard.distribution.map((item, index) => {
                  const total = dashboard.distribution.reduce((sum, entry) => sum + numberValue(entry.value), 0) || 1;
                  const percentage = Math.round((numberValue(item.value) / total) * 100);
                  return (
                    <div key={`${item.name}-${index}`} className="admin-distribution-item">
                      <span className="admin-distribution-label">
                        <span className="admin-color-dot" style={{ background: COLORS[index % COLORS.length] }} />
                        <strong>{item.name}</strong>
                      </span>
                      <span>{percentage}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="admin-dashboard-card">
            <div className="admin-dashboard-card-header">
              <h3>النشاطات الأخيرة</h3>
              <Link className="admin-action-link" to="/admin/audit">عرض الكل</Link>
            </div>
            <div className="admin-activity-list">
              {dashboard.recentActivities.length ? dashboard.recentActivities.map((item) => (
                <div key={item.id} className="admin-activity-item-modern">
                  <div className="admin-activity-avatar">{(item.user || 'ن').slice(0, 1).toUpperCase()}</div>
                  <div className="admin-activity-copy">
                    <strong>{item.user}</strong>
                    <p>{item.action}</p>
                  </div>
                  <span className={item.type === 'critical' ? 'admin-live-badge' : 'admin-dashboard-table-note'}>{item.type === 'critical' ? 'LIVE' : formatTime(item.time)}</span>
                </div>
              )) : <div className="admin-dashboard-empty">لا توجد نشاطات حديثة حالياً.</div>}
            </div>
          </section>
        </div>

        <div className="admin-dashboard-table-grid">
          <section className="admin-dashboard-card">
            <div className="admin-dashboard-card-header">
              <h3>إدارة البثوث</h3>
              <Link className="admin-action-link" to="/admin/live">فتح القسم</Link>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-dashboard-table">
                <thead>
                  <tr>
                    <th>المستخدم</th>
                    <th>العنوان</th>
                    <th>المشاهدات</th>
                    <th>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.tables.live.length ? dashboard.tables.live.slice(0, 5).map((row, index) => (
                    <tr key={row.id || `live-${index}`}>
                      <td><TableCellTitle primary={row.user || row.username} secondary={formatTime(row.created_at || row.time)} /></td>
                      <td>{row.title || row.stream_title || 'بث بدون عنوان'}</td>
                      <td>{formatCompactNumber(row.views ?? row.viewers ?? 0)}</td>
                      <td><span className="admin-table-status">نشط</span></td>
                    </tr>
                  )) : <EmptyTableRow colSpan={4} text="لا توجد بثوث مباشرة لعرضها الآن." />}
                </tbody>
              </table>
            </div>
          </section>

          <section className="admin-dashboard-card">
            <div className="admin-dashboard-card-header">
              <h3>إدارة المنشورات</h3>
              <Link className="admin-action-link" to="/admin/posts">فتح القسم</Link>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-dashboard-table">
                <thead>
                  <tr>
                    <th>المستخدم</th>
                    <th>المحتوى</th>
                    <th>التفاعل</th>
                    <th>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.tables.posts.length ? dashboard.tables.posts.slice(0, 5).map((row, index) => (
                    <tr key={row.id || `post-${index}`}>
                      <td><TableCellTitle primary={row.user || row.username} secondary={formatTime(row.created_at || row.time)} /></td>
                      <td>{(row.text || row.content || 'منشور جديد').toString().slice(0, 42)}</td>
                      <td>{formatCompactNumber(row.reactions ?? row.engagement ?? row.likes_count ?? 0)}</td>
                      <td><span className="admin-table-status">نشط</span></td>
                    </tr>
                  )) : <EmptyTableRow colSpan={4} text="لا توجد منشورات لعرضها حالياً." />}
                </tbody>
              </table>
            </div>
          </section>

          <section className="admin-dashboard-card">
            <div className="admin-dashboard-card-header">
              <h3>إدارة الشات</h3>
              <Link className="admin-action-link" to="/admin/chat">فتح القسم</Link>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-dashboard-table">
                <thead>
                  <tr>
                    <th>المستخدم</th>
                    <th>آخر رسالة</th>
                    <th>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.tables.chat.length ? dashboard.tables.chat.slice(0, 5).map((row, index) => (
                    <tr key={row.id || `chat-${index}`}>
                      <td><TableCellTitle primary={row.user || row.username} secondary={row.email || row.room_name || 'محادثة'} /></td>
                      <td>{(row.message || row.last_message || 'لا توجد رسالة أخيرة').toString().slice(0, 40)}</td>
                      <td><span className={`admin-table-status ${row.flagged ? 'warn' : ''}`}>{row.flagged ? 'مراجعة' : 'نشط'}</span></td>
                    </tr>
                  )) : <EmptyTableRow colSpan={3} text="لا توجد محادثات بحاجة لعرض الآن." />}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div className="admin-dashboard-bottom-grid">
          <section className="admin-dashboard-card">
            <div className="admin-dashboard-card-header">
              <h3>إدارة الستوري</h3>
              <Link className="admin-action-link" to="/admin/stories">فتح القسم</Link>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-dashboard-table">
                <thead>
                  <tr>
                    <th>المستخدم</th>
                    <th>المشاهدات</th>
                    <th>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.tables.stories.length ? dashboard.tables.stories.slice(0, 5).map((row, index) => (
                    <tr key={row.id || `story-${index}`}>
                      <td><TableCellTitle primary={row.user || row.username} secondary={formatTime(row.created_at || row.time)} /></td>
                      <td>{formatCompactNumber(row.views ?? row.viewers ?? 0)}</td>
                      <td><span className="admin-table-status">نشط</span></td>
                    </tr>
                  )) : <EmptyTableRow colSpan={3} text="لا توجد عناصر ستوري معروضة حالياً." />}
                </tbody>
              </table>
            </div>
          </section>

          <section className="admin-dashboard-card">
            <div className="admin-dashboard-card-header">
              <h3>إدارة الريلز</h3>
              <Link className="admin-action-link" to="/admin/reels">فتح القسم</Link>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-dashboard-table">
                <thead>
                  <tr>
                    <th>المستخدم</th>
                    <th>المشاهدات</th>
                    <th>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.tables.reels.length ? dashboard.tables.reels.slice(0, 5).map((row, index) => (
                    <tr key={row.id || `reel-${index}`}>
                      <td><TableCellTitle primary={row.user || row.username} secondary={row.title || 'ريل جديد'} /></td>
                      <td>{formatCompactNumber(row.views ?? row.viewers ?? 0)}</td>
                      <td><span className="admin-table-status">نشط</span></td>
                    </tr>
                  )) : <EmptyTableRow colSpan={3} text="لا توجد ريلز حديثة للعرض حالياً." />}
                </tbody>
              </table>
            </div>
          </section>

          <section className="admin-dashboard-card">
            <div className="admin-dashboard-card-header">
              <h3>التقارير والإحصائيات</h3>
              <Link className="admin-action-link" to="/admin/reports">فتح القسم</Link>
            </div>
            <div className="admin-report-grid">
              {dashboard.reportStats.map((item) => (
                <div key={item.label} className="admin-report-stat">
                  <small>{item.label}</small>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
            <div className="admin-report-chart-grid">
              <div className="admin-mini-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={viewsBars}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                    <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Bar dataKey="views" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="admin-mini-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={dashboard.audienceDistribution} dataKey="value" nameKey="name" innerRadius={36} outerRadius={62} paddingAngle={2}>
                      {dashboard.audienceDistribution.map((entry, index) => <Cell key={`${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>
        </div>
      </section>
    </AdminLayout>
  );
}
