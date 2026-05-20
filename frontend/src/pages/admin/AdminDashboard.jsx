import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import { BarChart, DonutChart, LineChart } from '../../components/admin/Charts.jsx';
import {
  formatCompactNumber,
  formatFullNumber,
  formatDateTime,
  formatTimeOnly,
  getStatusTone,
  statusLabel,
  sampleActivity,
  sampleBarData,
  sampleLineData,
} from '../../components/admin/adminShared.js';
import {
  getAdminLiveOverview,
  getAdminNotifications,
  getAdminOverview,
  getAdminPosts,
  getAdminReportsSummary,
} from '../../api/admin.js';
import { getChatThreads } from '../../api/chat.js';

const REFRESH_OPTIONS = [7000, 15000, 30000, 60000];

const KPI_SEED = [
  { key: 'users', label: 'إجمالي المستخدمين', value: 128560, change: '+12.5%', hint: 'من الشهر الماضي', icon: '👥', tone: 'tone-violet' },
  { key: 'live', label: 'البثوث المباشرة', value: 1245, change: '+18.7%', hint: 'من الشهر الماضي', icon: '📡', tone: 'tone-blue' },
  { key: 'views', label: 'المشاهدات الكلية', value: 2450000, change: '+15.3%', hint: 'من الشهر الماضي', icon: '👁️', tone: 'tone-rose' },
  { key: 'revenue', label: 'الإيرادات', value: 45231.89, change: '+21.4%', hint: 'من الشهر الماضي', icon: '💵', tone: 'tone-green', currency: true },
  { key: 'posts', label: 'المنشورات', value: 15890, change: '+17.2%', hint: 'من الشهر الماضي', icon: '🎁', tone: 'tone-purple' },
  { key: 'reels', label: 'الريلز', value: 8456, change: '+11.3%', hint: 'من الشهر الماضي', icon: '🎞️', tone: 'tone-amber' },
];

function seedLiveRows() {
  return [
    { id: 'L-1', user: 'PlayerOne', title: 'مغامرات الصحراء بث أسطوري', viewers: 1250, status: 'ended', time: '10:30 PM' },
    { id: 'L-2', user: 'KhaledGamer', title: 'بطولة اليوم الحاسمة', viewers: 980, status: 'active', time: '10:25 PM' },
    { id: 'L-3', user: 'ShadowGirl', title: 'تحديات البطولة مع المتابعين', viewers: 620, status: 'ended', time: '10:20 PM' },
    { id: 'L-4', user: 'MoxX', title: 'تجربة لعبة جديدة', viewers: 430, status: 'active', time: '10:15 PM' },
    { id: 'L-5', user: 'ProHunter', title: 'بث مباشر رد على الأسئلة', viewers: 320, status: 'ended', time: '10:10 PM' },
  ];
}

function seedPostRows() {
  return [
    { id: 'P-1', user: 'KhaledGamer', content: 'لحظات حماسية من آخر النصر', reactions: '2.5K', status: 'active', time: '10:30 PM' },
    { id: 'P-2', user: 'ShadowGirl', content: 'شكراً لكم على الدعم ❤️', reactions: '1.8K', status: 'active', time: '10:15 PM' },
    { id: 'P-3', user: 'MoxX', content: 'أكثر لقطة ضحكتني اليوم 😂', reactions: '965', status: 'active', time: '09:50 PM' },
    { id: 'P-4', user: 'ProHunter', content: 'استعدادات البطولة غداً 🔥', reactions: '1.2K', status: 'active', time: '07:55 PM' },
    { id: 'P-5', user: 'PlayerOne', content: 'مفاجأة من اللعبة الجديدة', reactions: '884', status: 'active', time: '06:40 PM' },
  ];
}

function seedChatRows() {
  return [
    { id: 'C-1', user: 'ahmed_king', status: 'active', latest: 'شكراً على البث الرائع', detail: 'من المستخدم', meta: 'ahmed@example.com' },
    { id: 'C-2', user: 'lina_music', status: 'active', latest: 'هل البث القادم غداً؟', detail: 'من البث', meta: 'lina@example.com' },
    { id: 'C-3', user: 'game_master', status: 'warning', latest: 'رابط جديد انشره', detail: 'تمت المراجعة 2024-01-15', meta: 'محتوى يحتاج متابعة' },
    { id: 'C-4', user: 'nour_88', status: 'active', latest: 'أحتاج مساعدة', detail: 'تقارير 245', meta: 'متوسط الخطورة' },
    { id: 'C-5', user: 'sami_pro', status: 'banned', latest: 'أحب محتواك', detail: 'إنذاران 2', meta: 'أرشيف إداري' },
  ];
}

function seedStoryRows() {
  return [
    { id: 'S-1', user: 'MoxX', media: '1.2K', kind: 'فيديو', status: 'active', time: '10:30 PM' },
    { id: 'S-2', user: 'ShadowGirl', media: '980', kind: 'نص', status: 'active', time: '09:45 PM' },
    { id: 'S-3', user: 'KhaledGamer', media: '760', kind: 'صورة', status: 'active', time: '08:30 PM' },
    { id: 'S-4', user: 'PlayerOne', media: '620', kind: 'صورة', status: 'active', time: '07:15 PM' },
    { id: 'S-5', user: 'ProHunter', media: '620', kind: 'نص', status: 'active', time: '06:40 PM' },
  ];
}

function seedReelRows() {
  return [
    { id: 'R-1', user: 'ProHunter', title: 'لقطات سريعة من اللعبة 🔥', views: '2.5K', status: 'active', time: '10:30 PM' },
    { id: 'R-2', user: 'KhaledGamer', title: 'أفضل اللقطات هذا الأسبوع', views: '1.8K', status: 'active', time: '09:20 PM' },
    { id: 'R-3', user: 'ShadowGirl', title: 'أقوى تحدي في اللعبة!', views: '1.5K', status: 'active', time: '08:15 PM' },
    { id: 'R-4', user: 'MoxX', title: 'لحظات مضحكة 😂', views: '1.2K', status: 'active', time: '07:10 PM' },
    { id: 'R-5', user: 'PlayerOne', title: 'نصائح احترافية للمبتدئين', views: '980', status: 'active', time: '06:05 PM' },
  ];
}

function seedRecentActivity() {
  return [
    { id: 'A-1', title: 'PlayerOne بدأ بثاً جديداً منذ دقائق', description: 'تم تشغيل غرفة مباشرة جديدة ومتابعتها تلقائياً.', time: new Date().toISOString(), tone: 'danger', badge: 'LIVE' },
    { id: 'A-2', title: 'KhaledGamer نشر منشوراً جديداً', description: 'ارتفاع جيد في التفاعل خلال آخر 15 دقيقة.', time: new Date(Date.now() - 1000 * 60 * 9).toISOString(), tone: 'success', badge: 'NEW' },
    { id: 'A-3', title: 'ShadowGirl تلقت تعليقاً جديداً على البث', description: 'تم رصد تفاعل مرتفع على الشات.', time: new Date(Date.now() - 1000 * 60 * 18).toISOString(), tone: 'warning', badge: 'CHAT' },
    { id: 'A-4', title: 'MoxX نشر ستوري جديد', description: 'الستوري حقق وصولاً جيداً خلال الساعة الأخيرة.', time: new Date(Date.now() - 1000 * 60 * 31).toISOString(), tone: 'success', badge: 'STORY' },
    { id: 'A-5', title: 'ProHunter نشر ريل جديد', description: 'تمت إضافته إلى قائمة المراجعة السريعة.', time: new Date(Date.now() - 1000 * 60 * 45).toISOString(), tone: 'warning', badge: 'REEL' },
  ];
}

function seedDashboard() {
  return {
    kpis: KPI_SEED,
    trafficHistory: sampleLineData(),
    contentDistribution: [
      { label: 'بثوث مباشرة', value: 40 },
      { label: 'منشورات', value: 25 },
      { label: 'ريلز', value: 20 },
      { label: 'ستوري', value: 10 },
      { label: 'أخرى', value: 5 },
    ],
    audienceDistribution: [
      { label: '18-24 سنة', value: 35 },
      { label: '24-34 سنة', value: 40 },
      { label: '35-44 سنة', value: 15 },
      { label: 'أكثر من 35', value: 10 },
    ],
    recentActivity: seedRecentActivity(),
    liveRows: seedLiveRows(),
    postRows: seedPostRows(),
    chatRows: seedChatRows(),
    storyRows: seedStoryRows(),
    reelRows: seedReelRows(),
    reportCards: [
      { label: 'إجمالي المشاهدات', value: '2.45M', delta: '+15.3%' },
      { label: 'متوسط المشاهدة', value: '15:42', delta: '+8.6%' },
      { label: 'معدل التفاعل', value: '5.23%', delta: '+12.7%' },
      { label: 'إجمالي الإيرادات', value: '$45,231.89', delta: '+11.3%' },
    ],
    reportBars: [
      { label: '19 أبريل', value: 320000 },
      { label: '22 أبريل', value: 410000 },
      { label: '28 أبريل', value: 290000 },
      { label: '4 مايو', value: 360000 },
      { label: '9 مايو', value: 275000 },
      { label: '14 مايو', value: 420000 },
      { label: '18 مايو', value: 240000 },
    ],
  };
}

function normalizeReports(payload) {
  const items = Array.isArray(payload?.items)
    ? payload.items
    : Array.isArray(payload?.reports)
      ? payload.reports
      : Array.isArray(payload)
        ? payload
        : [];

  return items.map((item, index) => ({
    id: String(item.id ?? `REP-${index + 1}`),
    score: Number(item.score ?? item.risk_score ?? item.confidence ?? 60),
    status: item.status || 'pending',
    queue: item.queue || item.category || 'general',
    severity: item.severity || (Number(item.score || 0) > 85 ? 'critical' : Number(item.score || 0) > 70 ? 'high' : 'medium'),
  }));
}

function buildDashboardData({ overview, live, posts, reports, notifications, threads }) {
  const dashboard = seedDashboard();
  const metrics = overview?.metrics || {};
  const reportItems = normalizeReports(reports);
  const liveRooms = Array.isArray(live?.rooms) ? live.rooms : [];
  const postItems = Array.isArray(posts?.items) ? posts.items : [];
  const notificationItems = Array.isArray(notifications?.items) ? notifications.items : [];
  const threadItems = Array.isArray(threads) ? threads : [];

  dashboard.kpis = [
    {
      ...KPI_SEED[0],
      value: Number(metrics.total_users ?? metrics.active_users ?? KPI_SEED[0].value),
      change: Number(metrics.growth_rate || 12.5) > 0 ? `+${Number(metrics.growth_rate || 12.5).toFixed(1)}%` : KPI_SEED[0].change,
    },
    {
      ...KPI_SEED[1],
      value: Number(live?.stats?.active_rooms ?? liveRooms.length ?? KPI_SEED[1].value),
    },
    {
      ...KPI_SEED[2],
      value: Number(metrics.total_views ?? metrics.total_impressions ?? metrics.traffic_per_minute * 1908 ?? KPI_SEED[2].value),
    },
    {
      ...KPI_SEED[3],
      value: Number(metrics.revenue_total ?? metrics.total_revenue ?? KPI_SEED[3].value),
    },
    {
      ...KPI_SEED[4],
      value: Number((metrics.total_posts ?? postItems.length) || KPI_SEED[4].value),
    },
    {
      ...KPI_SEED[5],
      value: Number(metrics.total_reels ?? metrics.reels_count ?? KPI_SEED[5].value),
    },
  ];

  dashboard.trafficHistory = Array.isArray(metrics.traffic_history) && metrics.traffic_history.length
    ? metrics.traffic_history.map((item, index) => ({
        label: item.label || item.day || item.date || sampleLineData()[index % sampleLineData().length].label,
        value: Number(item.value ?? item.views ?? item.count ?? 0),
      }))
    : dashboard.trafficHistory;

  dashboard.contentDistribution = (() => {
    const liveShare = Number(metrics.live_count ?? liveRooms.length ?? 40);
    const postsShare = Number(metrics.posts_count ?? postItems.length ?? 25);
    const reelsShare = Number(metrics.reels_count ?? 20);
    const storiesShare = Number(metrics.stories_count ?? 10);
    const otherShare = Math.max(5, Number(metrics.other_count ?? 5));
    const total = liveShare + postsShare + reelsShare + storiesShare + otherShare;
    return [
      { label: 'بثوث مباشرة', value: Math.round((liveShare / total) * 100) },
      { label: 'منشورات', value: Math.round((postsShare / total) * 100) },
      { label: 'ريلز', value: Math.round((reelsShare / total) * 100) },
      { label: 'ستوري', value: Math.round((storiesShare / total) * 100) },
      { label: 'أخرى', value: Math.max(1, 100 - (Math.round((liveShare / total) * 100) + Math.round((postsShare / total) * 100) + Math.round((reelsShare / total) * 100) + Math.round((storiesShare / total) * 100))) },
    ];
  })();

  dashboard.recentActivity = notificationItems.length
    ? notificationItems.slice(0, 5).map((item, index) => ({
        id: item.id || `notice-${index}`,
        title: item.title || 'تحديث جديد',
        description: item.body || item.message || 'تم استلام إشعار جديد من النظام.',
        time: item.created_at || item.timestamp || new Date(Date.now() - index * 1000 * 60 * 8).toISOString(),
        tone: index === 0 ? 'danger' : index % 2 ? 'success' : 'warning',
        badge: index === 0 ? 'LIVE' : index % 2 ? 'NEW' : 'INFO',
      }))
    : dashboard.recentActivity;

  dashboard.liveRows = liveRooms.length
    ? liveRooms.slice(0, 5).map((room, index) => ({
        id: room.id || `L-${index + 1}`,
        user: room.username || room.host || `user_${index + 1}`,
        title: room.title || room.name || 'بث مباشر جديد',
        viewers: Number(room.viewer_count ?? room.viewers ?? room.metrics?.viewers ?? 0),
        status: room.is_live === false || room.status === 'ended' ? 'ended' : 'active',
        time: formatTimeOnly(room.started_at || room.created_at || new Date(Date.now() - index * 1000 * 60 * 6).toISOString()),
      }))
    : dashboard.liveRows;

  dashboard.postRows = postItems.length
    ? postItems.slice(0, 5).map((post, index) => ({
        id: post.id || `P-${index + 1}`,
        user: post.username || post.author || `user_${index + 1}`,
        content: post.content || post.caption || 'منشور جديد يحتاج مراجعة.',
        reactions: formatCompactNumber(post.engagement ?? post.reactions_count ?? post.likes_count ?? 0),
        status: post.status || (post.ai_flagged ? 'warning' : 'active'),
        time: formatTimeOnly(post.created_at || post.timestamp || new Date(Date.now() - index * 1000 * 60 * 11).toISOString()),
      }))
    : dashboard.postRows;

  dashboard.chatRows = threadItems.length
    ? threadItems.slice(0, 5).map((thread, index) => ({
        id: thread.id || `C-${index + 1}`,
        user: thread.username || thread.title || `thread_${index + 1}`,
        status: thread.flagged || Number(thread.abuse_score || 0) > 60 ? 'warning' : 'active',
        latest: thread.last_message || 'لا توجد رسالة حديثة',
        detail: Number(thread.abuse_score || 0) > 60 ? `مستوى إساءة ${thread.abuse_score}%` : 'محادثة مستقرة',
        meta: thread.peer_username || thread.type || 'غرفة محادثة',
      }))
    : dashboard.chatRows;

  dashboard.storyRows = dashboard.postRows.map((post, index) => ({
    id: `S-${index + 1}`,
    user: post.user,
    media: formatCompactNumber(1200 - index * 145),
    kind: ['فيديو', 'نص', 'صورة', 'صورة', 'نص'][index % 5],
    status: 'active',
    time: post.time,
  }));

  dashboard.reelRows = dashboard.postRows.map((post, index) => ({
    id: `R-${index + 1}`,
    user: post.user,
    title: post.content,
    views: formatCompactNumber(2500 - index * 380),
    status: index === 0 ? 'active' : 'active',
    time: post.time,
  }));

  const totalReports = Math.max(reportItems.length, 1);
  const pendingReports = reportItems.filter((item) => item.status === 'pending').length;
  const avgScore = Math.round(reportItems.reduce((sum, item) => sum + Number(item.score || 0), 0) / totalReports);
  const engagement = Number(metrics.engagement_rate ?? metrics.engagement ?? 5.23);
  const revenue = Number(metrics.revenue_total ?? metrics.total_revenue ?? KPI_SEED[3].value);
  const totalViews = Number(metrics.total_views ?? metrics.total_impressions ?? dashboard.kpis[2].value);

  dashboard.reportCards = [
    { label: 'إجمالي المشاهدات', value: formatCompactNumber(totalViews), delta: dashboard.kpis[2].change },
    { label: 'متوسط المشاهدة', value: '15:42', delta: '+8.6%' },
    { label: 'معدل التفاعل', value: `${engagement.toFixed(2)}%`, delta: '+12.7%' },
    { label: 'إجمالي الإيرادات', value: formatCompactNumber(revenue, { currency: true, currencyCode: 'USD' }), delta: '+11.3%' },
  ];

  dashboard.reportBars = reportItems.length
    ? reportItems.slice(0, 7).map((item) => ({
        label: item.id,
        value: Number(item.score || 0) * 4200,
      }))
    : dashboard.reportBars;

  dashboard.audienceDistribution = reportItems.length
    ? [
        { label: '18-24 سنة', value: Math.round(Math.min(45, 25 + pendingReports)) },
        { label: '24-34 سنة', value: Math.round(Math.min(50, 32 + Math.max(avgScore - 55, 0) / 8)) },
        { label: '35-44 سنة', value: 15 },
        { label: 'أكثر من 35', value: 10 },
      ]
    : dashboard.audienceDistribution;

  return dashboard;
}

function toneClassFromActivity(tone) {
  if (tone === 'danger') return 'tone-danger';
  if (tone === 'warning') return 'tone-warning';
  if (tone === 'success') return 'tone-success';
  return 'tone-neutral';
}

function statusPillClass(status) {
  const tone = getStatusTone(status);
  return `status-pill ${tone}`;
}

function avatarGlyph(name = '') {
  const clean = String(name || '').trim();
  return clean ? clean.slice(0, 1).toUpperCase() : 'A';
}

function MetricCard({ item }) {
  return (
    <Card className={`admin-metric-card ${item.tone}`} style={{ padding: 18 }}>
      <div className="admin-metric-icon" aria-hidden="true">{item.icon}</div>
      <div className="admin-metric-copy">
        <span>{item.label}</span>
        <strong>{item.currency ? formatCompactNumber(item.value, { currency: true, currencyCode: 'USD' }) : formatCompactNumber(item.value)}</strong>
        <div className="admin-showcase-kpi-foot">
          <em>{item.change}</em>
          <small>{item.hint}</small>
        </div>
      </div>
    </Card>
  );
}

function SectionHeader({ title, subtitle, actionLabel, onAction }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
      <div>
        <h3 className="section-title" style={{ margin: 0 }}>{title}</h3>
        {subtitle ? <p style={{ margin: '6px 0 0', color: '#94a3b8', fontSize: 13 }}>{subtitle}</p> : null}
      </div>
      {actionLabel ? (
        <Button
          variant="secondary"
          className="btn-compact"
          style={{ background: 'rgba(255,255,255,0.06)', color: '#f8fafc', border: '1px solid rgba(255,255,255,0.08)' }}
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}

function ModuleListCard({ title, subtitle, actionLabel, onAction, rows, valueKey, titleKey, statusKey = 'status', metaRenderer }) {
  return (
    <Card className="admin-module-card" style={{ padding: 18 }}>
      <SectionHeader title={title} subtitle={subtitle} actionLabel={actionLabel} onAction={onAction} />
      <div className="admin-module-list">
        {rows.map((row) => (
          <div key={row.id} className="admin-module-row">
            <div className="admin-module-avatar">{avatarGlyph(row.user)}</div>
            <div className="admin-module-copy">
              <strong>{row.user}</strong>
              <span>{row[titleKey]}</span>
            </div>
            <div className="admin-module-meta">
              <span className={statusPillClass(row[statusKey])}>{statusLabel(row[statusKey])}</span>
              <strong>{row[valueKey]}</strong>
              {metaRenderer ? metaRenderer(row) : <small>{row.time}</small>}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(() => seedDashboard());
  const [loading, setLoading] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(15000);
  const [lastUpdated, setLastUpdated] = useState(() => new Date().toISOString());

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const [overviewRes, liveRes, postsRes, reportsRes, notificationsRes, threadsRes] = await Promise.allSettled([
        getAdminOverview(),
        getAdminLiveOverview(),
        getAdminPosts({ page: 1, page_size: 5, sort_by: 'created_at', sort_direction: 'desc' }),
        getAdminReportsSummary(),
        getAdminNotifications(5),
        getChatThreads(),
      ]);

      const next = buildDashboardData({
        overview: overviewRes.status === 'fulfilled' ? overviewRes.value?.data : null,
        live: liveRes.status === 'fulfilled' ? liveRes.value?.data : null,
        posts: postsRes.status === 'fulfilled' ? postsRes.value?.data : null,
        reports: reportsRes.status === 'fulfilled' ? reportsRes.value?.data : null,
        notifications: notificationsRes.status === 'fulfilled' ? notificationsRes.value?.data : null,
        threads: threadsRes.status === 'fulfilled' ? threadsRes.value?.data : null,
      });

      setDashboard(next);
      setLastUpdated(new Date().toISOString());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      loadDashboard();
    }, refreshInterval);
    return () => window.clearInterval(timer);
  }, [loadDashboard, refreshInterval]);

  const liveSummary = useMemo(() => {
    const total = dashboard.liveRows.reduce((sum, item) => sum + Number(item.viewers || 0), 0);
    return {
      viewers: formatFullNumber(total),
      active: dashboard.liveRows.filter((item) => item.status === 'active').length,
    };
  }, [dashboard.liveRows]);

  const reportSummary = useMemo(() => {
    const items = dashboard.reportBars;
    const peak = items.reduce((max, item) => (item.value > max.value ? item : max), items[0] || { label: '—', value: 0 });
    return {
      peakLabel: peak.label,
      peakValue: formatCompactNumber(peak.value),
    };
  }, [dashboard.reportBars]);

  return (
    <AdminLayout>
      <section style={{ display: 'grid', gap: 18 }}>
        <Card className="admin-showcase-hero" style={{ padding: 22, background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.22), rgba(15, 23, 42, 0.82) 55%, rgba(8, 145, 178, 0.12))', border: '1px solid rgba(167, 139, 250, 0.18)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ maxWidth: 840 }}>
              <div style={{ color: '#22d3ee', fontSize: 13, marginBottom: 10 }}>LiveStream Admin • One page command center</div>
              <h2 style={{ margin: 0, color: '#f8fafc', fontSize: 'clamp(24px, 3vw, 38px)' }}>لوحة الأدمن الموحّدة</h2>
              <p style={{ margin: '12px 0 0', color: '#cbd5e1', lineHeight: 1.8 }}>
                تم تجميع البث والمنشورات والشات والستوري والريلز والتقارير داخل صفحة واحدة بتصميم داكن احترافي قريب من المرجع المرئي، مع بطاقات KPI ورسوم بيانية وأقسام إدارة جاهزة للمراجعة السريعة.
              </p>
            </div>
            <div style={{ display: 'grid', gap: 12, minWidth: 260 }}>
              <label className="field select-field" style={{ minWidth: 220 }}>
                <span className="field-label">التحديث التلقائي</span>
                <select className="input" value={refreshInterval} onChange={(event) => setRefreshInterval(Number(event.target.value))}>
                  {REFRESH_OPTIONS.map((value) => (
                    <option key={value} value={value}>كل {Math.round(value / 1000)} ثانية</option>
                  ))}
                </select>
              </label>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Button onClick={loadDashboard} loading={loading}>تحديث الآن</Button>
                <Button
                  variant="secondary"
                  style={{ background: 'rgba(255,255,255,0.06)', color: '#f8fafc', border: '1px solid rgba(255,255,255,0.08)' }}
                  onClick={() => navigate('/admin/reports')}
                >
                  مركز البلاغات
                </Button>
              </div>
              <small style={{ color: '#94a3b8' }}>آخر تحديث: {formatDateTime(lastUpdated)}</small>
            </div>
          </div>
        </Card>

        <section className="admin-metric-grid">
          {dashboard.kpis.map((item) => <MetricCard key={item.key} item={item} />)}
        </section>

        <section className="admin-dashboard-focus-grid">
          <Card className="admin-chart-card admin-large-chart-card" style={{ padding: 18 }}>
            <SectionHeader title="المشاهدات خلال آخر 7 أيام" subtitle={`إجمالي البث المباشر النشط الآن ${liveSummary.active} • مجموع المشاهدين ${liveSummary.viewers}`} actionLabel="إدارة البث" onAction={() => navigate('/admin/live')} />
            <LineChart data={dashboard.trafficHistory} />
          </Card>

          <Card className="admin-chart-card" style={{ padding: 18 }}>
            <SectionHeader title="توزيع المحتوى" subtitle="تقسيم سريع للمحتوى داخل المنصة" />
            <DonutChart data={dashboard.contentDistribution} />
          </Card>

          <Card className="admin-chart-card" style={{ padding: 18 }}>
            <SectionHeader title="النشاطات الأخيرة" subtitle="أحدث التحديثات والإشعارات الحية" />
            <div className="admin-activity-list compact-activity-list">
              {dashboard.recentActivity.map((activity) => (
                <div key={activity.id} className="admin-activity-item compact">
                  <span className={`admin-activity-dot ${toneClassFromActivity(activity.tone)}`} />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between', flexWrap: 'wrap' }}>
                      <strong style={{ color: '#f8fafc' }}>{activity.title}</strong>
                      <span className={`status-pill ${activity.badge === 'LIVE' ? 'danger' : activity.badge === 'NEW' ? 'success' : 'warning'}`}>{activity.badge}</span>
                    </div>
                    <p>{activity.description}</p>
                    <small>{formatDateTime(activity.time)}</small>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </section>

        <section className="admin-module-grid">
          <ModuleListCard
            title="إدارة البثوث"
            subtitle="أحدث الجلسات وقيم المشاهدة الآن"
            actionLabel="عرض الكل"
            onAction={() => navigate('/admin/live')}
            rows={dashboard.liveRows}
            valueKey="viewers"
            titleKey="title"
            metaRenderer={(row) => (
              <>
                <span className={statusPillClass(row.status)}>{statusLabel(row.status)}</span>
                <strong>{formatFullNumber(row.viewers)}</strong>
                <small>{row.time}</small>
              </>
            )}
          />

          <ModuleListCard
            title="إدارة المنشورات"
            subtitle="محتوى جديد يحتاج متابعة سريعة"
            actionLabel="المنشورات"
            onAction={() => navigate('/admin/posts')}
            rows={dashboard.postRows}
            valueKey="reactions"
            titleKey="content"
            metaRenderer={(row) => (
              <>
                <span className={statusPillClass(row.status)}>{statusLabel(row.status)}</span>
                <strong>{row.reactions}</strong>
                <small>{row.time}</small>
              </>
            )}
          />

          <ModuleListCard
            title="إدارة الشات"
            subtitle="آخر المحادثات والتنبيهات السريعة"
            actionLabel="الشات"
            onAction={() => navigate('/admin/chat')}
            rows={dashboard.chatRows}
            valueKey="meta"
            titleKey="latest"
            metaRenderer={(row) => (
              <>
                <span className={statusPillClass(row.status)}>{statusLabel(row.status)}</span>
                <strong style={{ fontSize: 12 }}>{row.detail}</strong>
                <small>{row.meta}</small>
              </>
            )}
          />
        </section>

        <section className="admin-module-grid">
          <ModuleListCard
            title="إدارة الستوري"
            subtitle="مراجعة سريعة للستوري المنشور"
            actionLabel="الستوري"
            onAction={() => navigate('/admin/stories')}
            rows={dashboard.storyRows}
            valueKey="media"
            titleKey="kind"
          />

          <ModuleListCard
            title="إدارة الريلز"
            subtitle="أفضل المقاطع النشطة الآن"
            actionLabel="الريلز"
            onAction={() => navigate('/admin/reels')}
            rows={dashboard.reelRows}
            valueKey="views"
            titleKey="title"
          />

          <Card className="admin-module-card" style={{ padding: 18 }}>
            <SectionHeader title="التقارير والإحصائيات" subtitle={`أعلى ذروة حالياً: ${reportSummary.peakLabel} • ${reportSummary.peakValue}`} actionLabel="التقارير" onAction={() => navigate('/admin/reports')} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12, marginBottom: 16 }}>
              {dashboard.reportCards.map((item) => (
                <div key={item.label} style={{ padding: 14, borderRadius: 18, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ display: 'block', color: '#94a3b8', fontSize: 12, marginBottom: 8 }}>{item.label}</span>
                  <strong style={{ display: 'block', color: '#f8fafc', fontSize: 20 }}>{item.value}</strong>
                  <small style={{ color: '#86efac' }}>{item.delta}</small>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gap: 18 }}>
              <BarChart data={dashboard.reportBars} />
              <DonutChart data={dashboard.audienceDistribution} />
            </div>
          </Card>
        </section>
      </section>
    </AdminLayout>
  );
}
