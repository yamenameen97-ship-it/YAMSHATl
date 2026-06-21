import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import { getAdminDashboardLive } from '../../api/admin.js';

/**
 * ========================================================================
 * AdminDashboard — لوحة المدير العام
 * (v60 — Single-Viewport Compact Grid · Matches Reference Mockup)
 * ------------------------------------------------------------------------
 * أهداف هذه النسخة (v60):
 *  1) جميع الصناديق تظهر في صفحة واحدة بدون تمرير عمودي طويل.
 *  2) كل البطاقات مربعة الشكل ومتقاربة (gap صغير) — تطابق الصورة المرجعية.
 *  3) شريط 6 إحصائيات علوي (إجمالي المستخدمين، البثوث، المشاهدات، الإيرادات،
 *     المنشورات، الريلز) — مدمج وقابل للنقر.
 *  4) ثلاثة صفوف رئيسية × 3 أعمدة + صفّ تقارير سفلي (full width).
 *  5) عند الضغط على أي صندوق → فتح الصفحة التفصيلية الخاصة به.
 *  6) ربط البيانات الحية بـ /api/admin/dashboard/live (بدون mock).
 *  7) dir="rtl" + Noto Sans Arabic.
 * ========================================================================
 */

// ============ Fallback (يظهر فقط أثناء التحميل أو إذا فشل الاتصال) ============
const FALLBACK_STAT_CARDS = [
  { id: 'users',    label: 'إجمالي المستخدمين', value: '—', trend: '+0.0%', icon: '👥', tone: '#8b5cf6' },
  { id: 'live',     label: 'البثوث المباشرة',   value: '—', trend: '+0.0%', icon: '📡', tone: '#ef4444' },
  { id: 'views',    label: 'المشاهدات الكلية',  value: '—', trend: '+0.0%', icon: '👁', tone: '#ef4444' },
  { id: 'revenue',  label: 'الإيرادات',         value: '—', trend: '+0.0%', icon: '$',  tone: '#10b981' },
  { id: 'posts',    label: 'المنشورات',         value: '—', trend: '+0.0%', icon: '🎁', tone: '#f59e0b' },
  { id: 'reels',    label: 'الريلز',            value: '—', trend: '+0.0%', icon: '🎵', tone: '#ec4899' },
];

const FALLBACK_VIEWS_TREND = [
  { day: '—', value: 0 }, { day: '—', value: 0 }, { day: '—', value: 0 },
  { day: '—', value: 0 }, { day: '—', value: 0 }, { day: '—', value: 0 }, { day: '—', value: 0 },
];

const FALLBACK_CONTENT_DISTRIBUTION = [
  { label: 'بثوث مباشرة', value: 40, color: '#a78bfa' },
  { label: 'منشورات',     value: 25, color: '#8b5cf6' },
  { label: 'ريلز',        value: 20, color: '#f59e0b' },
  { label: 'ستوري',       value: 10, color: '#10b981' },
  { label: 'أخرى',        value: 5,  color: '#ef4444' },
];

const FALLBACK_AUDIENCE = [
  { label: '18-24 سنة',  value: 35, color: '#a78bfa' },
  { label: '25-34 سنة',  value: 40, color: '#3b82f6' },
  { label: '35-44 سنة',  value: 15, color: '#f59e0b' },
  { label: 'أكثر من ذلك', value: 10, color: '#10b981' },
];

// ربط كل بطاقة بصفحتها التفصيلية
const STAT_TARGETS = {
  users:    '/admin/users',
  live:     '/admin/live',
  views:    '/admin/reports',
  revenue:  '/admin/reports',
  posts:    '/admin/posts',
  reels:    '/admin/reels',
  stories:  '/admin/stories',
  chat:     '/admin/chat',
  reports:  '/admin/reports',
  notifications: '/admin/notifications',
};

// رسم بياني منطقة (Area / Line) بـ SVG — مدمج
function AreaChart({ data, height = 130 }) {
  if (!data?.length) return null;
  const max = Math.max(...data.map((d) => d.value), 1) * 1.1;
  const w = 700;
  const h = height;
  const padX = 28;
  const padY = 14;
  const stepX = (w - padX * 2) / Math.max(data.length - 1, 1);
  const points = data.map((d, i) => {
    const x = padX + i * stepX;
    const y = h - padY - ((d.value / max) * (h - padY * 2));
    return { x, y, ...d };
  });
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${h - padY} L ${points[0].x} ${h - padY} Z`;
  const yTicks = [0, Math.round(max * 0.5), Math.round(max)];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="100%" preserveAspectRatio="none">
      <defs>
        <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#8b5cf6" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {yTicks.map((t, i) => {
        const y = h - padY - ((t / max) * (h - padY * 2));
        return (
          <g key={i}>
            <line x1={padX} y1={y} x2={w - padX} y2={y} stroke="rgba(148,163,184,0.12)" />
            <text x={padX - 4} y={y + 3} fill="#64748b" fontSize="9" textAnchor="end">{t}K</text>
          </g>
        );
      })}
      <path d={areaPath} fill="url(#areaFill)" />
      <path d={linePath} fill="none" stroke="#8b5cf6" strokeWidth="2" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="3" fill="#8b5cf6" stroke="#0f172a" strokeWidth="1.5" />
          <text x={p.x} y={h - 2} fill="#64748b" fontSize="9" textAnchor="middle">{p.day}</text>
        </g>
      ))}
    </svg>
  );
}

// Donut chart — مدمج
function Donut({ data, size = 110, centerLabel = 'الإجمالي', centerValue = '100%' }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = size / 2 - 10;
  const cx = size / 2;
  const cy = size / 2;
  let acc = 0;
  const arcs = data.map((d) => {
    const a0 = (acc / total) * Math.PI * 2 - Math.PI / 2;
    acc += d.value;
    const a1 = (acc / total) * Math.PI * 2 - Math.PI / 2;
    const large = a1 - a0 > Math.PI ? 1 : 0;
    const x0 = cx + r * Math.cos(a0);
    const y0 = cy + r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1);
    const y1 = cy + r * Math.sin(a1);
    return { path: `M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} Z`, color: d.color };
  });
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
      {arcs.map((a, i) => <path key={i} d={a.path} fill={a.color} />)}
      <circle cx={cx} cy={cy} r={r * 0.62} fill="#0f172a" />
      <text x={cx} y={cy - 1} fill="#94a3b8" fontSize="8" textAnchor="middle">{centerLabel}</text>
      <text x={cx} y={cy + 10} fill="#f8fafc" fontSize="11" fontWeight="800" textAnchor="middle">{centerValue}</text>
    </svg>
  );
}

// Bar chart — مدمج
function BarChart({ values, labels, height = 110, color = '#a78bfa' }) {
  if (!values?.length) return null;
  const max = Math.max(...values, 1) * 1.15;
  const w = 700;
  const padX = 22;
  const padY = 12;
  const bw = (w - padX * 2) / values.length - 6;
  const yTicks = [0, Math.round(max * 0.5), Math.round(max)];
  return (
    <svg viewBox={`0 0 ${w} ${height}`} width="100%" height="100%" preserveAspectRatio="none">
      {yTicks.map((t, i) => {
        const y = height - padY - ((t / max) * (height - padY * 2));
        return (
          <g key={i}>
            <line x1={padX} y1={y} x2={w - padX} y2={y} stroke="rgba(148,163,184,0.10)" />
            <text x={padX - 3} y={y + 3} fill="#64748b" fontSize="8" textAnchor="end">{t}K</text>
          </g>
        );
      })}
      {values.map((v, i) => {
        const h = (v / max) * (height - padY * 2);
        const x = padX + i * ((w - padX * 2) / values.length) + 3;
        const y = height - padY - h;
        return (
          <g key={i}>
            <rect x={x} y={y} width={bw} height={h} fill={color} rx="2" />
            <text x={x + bw / 2} y={height - 2} fill="#64748b" fontSize="7" textAnchor="middle">{labels[i]}</text>
          </g>
        );
      })}
    </svg>
  );
}

// مكوّن مساعد: صندوق قابل للنقر يفتح صفحة تفاصيله
function ClickableCard({ to, navigate, className = '', children, ariaLabel }) {
  const handle = (e) => {
    const tag = (e.target.tagName || '').toLowerCase();
    if (['button', 'input', 'select', 'textarea', 'a', 'option'].includes(tag)) return;
    if (e.target.closest('button, input, select, textarea, a')) return;
    navigate(to);
  };
  const onKey = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate(to);
    }
  };
  return (
    <div
      className={`ls-card ls-clickable ${className}`}
      role="link"
      tabIndex={0}
      aria-label={ariaLabel}
      onClick={handle}
      onKeyDown={onKey}
    >
      {children}
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [chartTab, setChartTab] = useState('views');
  const [reportTab, setReportTab] = useState('interactions');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__YAMSHAT_ADMIN_DASHBOARD_VERSION__ = 'unified-v60-single-viewport';
      document.querySelectorAll('[data-legacy-admin-dashboard="true"]').forEach((el) => el.remove());
    }
  }, []);

  // ============ جلب البيانات الحية ============
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await getAdminDashboardLive();
        if (active) {
          setData(res?.data || null);
          setError(null);
        }
      } catch (err) {
        if (active) {
          setError(err?.response?.data?.detail || err?.message || 'تعذّر تحميل بيانات اللوحة');
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 30_000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  // ضمان وجود 6 بطاقات إحصائية بالترتيب الصحيح (مثل الصورة المرجعية)
  const apiStatCards = data?.stat_cards || [];
  const statCards = useMemo(() => {
    // ندمج بيانات الـ API مع الـ fallback مع الحفاظ على الترتيب من FALLBACK_STAT_CARDS
    const byId = new Map();
    apiStatCards.forEach((s) => byId.set(s.id, s));
    return FALLBACK_STAT_CARDS.map((fb) => {
      const live = byId.get(fb.id);
      return live ? { ...fb, ...live } : fb;
    });
  }, [apiStatCards]);

  const viewsTrend = data?.views_trend || FALLBACK_VIEWS_TREND;
  const contentDistribution = data?.content_distribution || FALLBACK_CONTENT_DISTRIBUTION;
  const recentActivities = data?.recent_activities || [];
  const postsRows = data?.posts_table || [];
  const chatRows = data?.chat_table || [];
  const storiesRows = data?.stories_table || [];
  const reelsRows = data?.reels_table || [];
  const liveRows = data?.live_table || data?.broadcasts_table || [];
  const kpis = data?.kpis || [];
  const dailyValues = data?.daily_views_values || [];
  const dailyLabels = data?.daily_views_labels || [];
  const audience = data?.audience || FALLBACK_AUDIENCE;

  const distributionTotal = useMemo(
    () => contentDistribution.reduce((s, d) => s + d.value, 0) || 1,
    [contentDistribution]
  );

  // أعلى 4 صفوف فقط لكل قسم
  const previewPosts   = postsRows.slice(0, 4);
  const previewChat    = chatRows.slice(0, 4);
  const previewStories = storiesRows.slice(0, 4);
  const previewReels   = reelsRows.slice(0, 4);
  const previewLive    = liveRows.slice(0, 4);

  return (
    <AdminLayout>
      <div className="ls-admin" dir="rtl" data-yamshat-version="unified-v60-single-viewport">
        {loading && !data ? (
          <div className="ls-loading">جاري تحميل البيانات الحية...</div>
        ) : null}
        {error ? (
          <div className="ls-error">⚠ {error}</div>
        ) : null}

        {/* ====== Stat cards (6 بطاقات في صف واحد) ====== */}
        <div className="ls-stats-grid">
          {statCards.map((s) => {
            const target = STAT_TARGETS[s.id] || '/admin/dashboard';
            return (
              <button
                type="button"
                key={s.id}
                className="ls-stat-card ls-clickable"
                onClick={() => navigate(target)}
                aria-label={`فتح ${s.label}`}
              >
                <div className="ls-stat-top">
                  <span className="ls-stat-icon" style={{ background: `${s.tone}22`, color: s.tone }}>{s.icon}</span>
                  <span className="ls-stat-label">{s.label}</span>
                </div>
                <div className="ls-stat-value">{s.value}</div>
                <div className="ls-stat-trend">▲ {s.trend} <span className="ls-stat-muted">من الشهر الماضي</span></div>
              </button>
            );
          })}
        </div>

        {/* ====== الصف 1: المشاهدات (chart) + توزيع المحتوى (donut) + النشاطات الأخيرة ====== */}
        <div className="ls-row ls-row-3">
          <ClickableCard
            to="/admin/reports"
            navigate={navigate}
            ariaLabel="فتح التقارير والمشاهدات الكاملة"
          >
            <div className="ls-card-head">
              <h3>المشاهدات خلال آخر 7 أيام</h3>
              <div className="ls-head-actions">
                <select className="ls-select" value={chartTab} onChange={(e) => setChartTab(e.target.value)}>
                  <option value="views">المشاهدات</option>
                  <option value="interactions">التفاعلات</option>
                  <option value="users">المستخدمون</option>
                </select>
              </div>
            </div>
            <div className="ls-chart-area">
              <AreaChart data={viewsTrend} />
            </div>
          </ClickableCard>

          <ClickableCard to="/admin/reports" navigate={navigate} ariaLabel="فتح إحصائيات توزيع المحتوى">
            <div className="ls-card-head">
              <h3>توزيع المحتوى</h3>
              <span className="ls-open-hint">عرض الكل ›</span>
            </div>
            <div className="ls-donut-wrap">
              <Donut data={contentDistribution} centerLabel="الإجمالي" centerValue="100%" />
              <ul className="ls-legend">
                {contentDistribution.map((d) => (
                  <li key={d.label}>
                    <span className="ls-dot" style={{ background: d.color }} />
                    <span className="ls-legend-label">{d.label}</span>
                    <span className="ls-legend-value">{Math.round((d.value / distributionTotal) * 100)}%</span>
                  </li>
                ))}
              </ul>
            </div>
          </ClickableCard>

          <ClickableCard to="/admin/notifications" navigate={navigate} ariaLabel="فتح كل النشاطات الأخيرة">
            <div className="ls-card-head">
              <h3>النشاطات الأخيرة</h3>
              <span className="ls-open-hint">عرض الكل ›</span>
            </div>
            <ul className="ls-activity">
              {recentActivities.length === 0 ? (
                <li className="ls-empty">لا يوجد نشاط حديث</li>
              ) : recentActivities.slice(0, 5).map((a) => (
                <li key={a.id}>
                  <span className="ls-avatar">{(a.user || '?').charAt(0)}</span>
                  <div className="ls-activity-body">
                    <strong>{a.user}</strong>
                    <span>{a.text}</span>
                  </div>
                  {a.badge ? <span className="ls-live">{a.badge}</span> : null}
                </li>
              ))}
            </ul>
          </ClickableCard>
        </div>

        {/* ====== الصف 2: إدارة البثوث + إدارة المنشورات + إدارة الشات ====== */}
        <div className="ls-row ls-row-3">
          <ClickableCard to="/admin/live" navigate={navigate} ariaLabel="فتح صفحة إدارة البثوث الكاملة">
            <div className="ls-card-head">
              <h3>📡 إدارة البثوث</h3>
              <span className="ls-open-hint">عرض الكل ›</span>
            </div>
            <div className="ls-table-wrap">
              <table className="ls-table">
                <thead>
                  <tr>
                    <th>التاريخ</th>
                    <th>المستخدم</th>
                    <th>عنوان البث</th>
                    <th>المشاهدات</th>
                    <th>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {previewLive.length === 0 ? (
                    <tr><td colSpan={5} className="ls-empty-row">لا توجد بثوث بعد</td></tr>
                  ) : previewLive.map((r) => (
                    <tr key={r.id}>
                      <td>{r.date}</td>
                      <td>{r.user}</td>
                      <td className="ls-ellipsis">{r.title}</td>
                      <td>{r.views ?? r.viewers ?? '—'}</td>
                      <td><span className="ls-status ls-status-live">إنهاء</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ClickableCard>

          <ClickableCard to="/admin/posts" navigate={navigate} ariaLabel="فتح صفحة إدارة المنشورات الكاملة">
            <div className="ls-card-head">
              <h3>📨 إدارة المنشورات</h3>
              <span className="ls-open-hint">عرض الكل ›</span>
            </div>
            <div className="ls-table-wrap">
              <table className="ls-table">
                <thead>
                  <tr>
                    <th>التاريخ</th>
                    <th>المستخدم</th>
                    <th>المحتوى</th>
                    <th>التفاعلات</th>
                    <th>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {previewPosts.length === 0 ? (
                    <tr><td colSpan={5} className="ls-empty-row">لا توجد منشورات بعد</td></tr>
                  ) : previewPosts.map((r) => (
                    <tr key={r.id}>
                      <td>{r.date}</td>
                      <td>{r.user}</td>
                      <td className="ls-ellipsis">{r.content}</td>
                      <td>{r.interactions}</td>
                      <td><span className="ls-status ls-status-ok">نشط</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ClickableCard>

          <ClickableCard to="/admin/chat" navigate={navigate} ariaLabel="فتح صفحة إدارة الشات الكاملة">
            <div className="ls-card-head">
              <h3>💬 إدارة الشات</h3>
              <span className="ls-open-hint">عرض الكل ›</span>
            </div>
            <div className="ls-table-wrap">
              <table className="ls-table">
                <thead>
                  <tr>
                    <th>المستخدم</th>
                    <th>آخر رسالة</th>
                    <th>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {previewChat.length === 0 ? (
                    <tr><td colSpan={3} className="ls-empty-row">لا توجد رسائل بعد</td></tr>
                  ) : previewChat.map((r) => (
                    <tr key={r.id}>
                      <td>{r.user}</td>
                      <td className="ls-ellipsis">{r.text}</td>
                      <td><span className="ls-status ls-status-ok">نشط</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ClickableCard>
        </div>

        {/* ====== الصف 3: إدارة الستوري + إدارة الريلز + التقارير والإحصائيات ====== */}
        <div className="ls-row ls-row-3">
          <ClickableCard to="/admin/stories" navigate={navigate} ariaLabel="فتح صفحة إدارة الستوري الكاملة">
            <div className="ls-card-head">
              <h3>📷 إدارة الستوري</h3>
              <span className="ls-open-hint">عرض الكل ›</span>
            </div>
            <div className="ls-table-wrap">
              <table className="ls-table">
                <thead>
                  <tr>
                    <th>التاريخ</th>
                    <th>المستخدم</th>
                    <th>المشاهدات</th>
                    <th>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {previewStories.length === 0 ? (
                    <tr><td colSpan={4} className="ls-empty-row">لا توجد ستوريات بعد</td></tr>
                  ) : previewStories.map((r) => (
                    <tr key={r.id}>
                      <td>{r.date}</td>
                      <td>{r.user}</td>
                      <td>{r.views}</td>
                      <td><span className="ls-status ls-status-ok">نشط</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ClickableCard>

          <ClickableCard to="/admin/reels" navigate={navigate} ariaLabel="فتح صفحة إدارة الريلز الكاملة">
            <div className="ls-card-head">
              <h3>🎬 إدارة الريلز</h3>
              <span className="ls-open-hint">عرض الكل ›</span>
            </div>
            <div className="ls-table-wrap">
              <table className="ls-table">
                <thead>
                  <tr>
                    <th>التاريخ</th>
                    <th>المستخدم</th>
                    <th>العنوان</th>
                    <th>المشاهدات</th>
                    <th>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {previewReels.length === 0 ? (
                    <tr><td colSpan={5} className="ls-empty-row">لا توجد ريلز بعد</td></tr>
                  ) : previewReels.map((r) => (
                    <tr key={r.id}>
                      <td>{r.date}</td>
                      <td>{r.user}</td>
                      <td className="ls-ellipsis">{r.title}</td>
                      <td>{r.views}</td>
                      <td><span className="ls-status ls-status-ok">نشط</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ClickableCard>

          <ClickableCard
            to="/admin/reports"
            navigate={navigate}
            ariaLabel="فتح صفحة التقارير والإحصائيات الكاملة"
          >
            <div className="ls-card-head">
              <h3>📊 التقارير والإحصائيات</h3>
              <div className="ls-head-actions">
                <select
                  className="ls-select"
                  value={reportTab}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => setReportTab(e.target.value)}
                >
                  <option value="interactions">التفاعلات</option>
                  <option value="revenue">الإيرادات</option>
                  <option value="content">المحتوى</option>
                  <option value="users">المستخدمون</option>
                  <option value="overview">نظرة عامة</option>
                </select>
              </div>
            </div>

            <div className="ls-kpi-mini">
              {(kpis.length ? kpis : [
                { label: 'إجمالي الإيرادات', value: '—', trend: '+0.0%' },
                { label: 'معدل التفاعل',     value: '—', trend: '+0.0%' },
                { label: 'متوسط المشاهدة',   value: '—', trend: '+0.0%' },
                { label: 'إجمالي المشاهدات', value: '—', trend: '+0.0%' },
              ]).slice(0, 4).map((k, i) => (
                <div key={i} className="ls-kpi-cell">
                  <div className="ls-kpi-label">{k.label}</div>
                  <div className="ls-kpi-value">{k.value}</div>
                  <div className="ls-kpi-trend up">▲ {k.trend}</div>
                </div>
              ))}
            </div>

            <div className="ls-reports-mini">
              <div className="ls-reports-chart">
                <h4 className="ls-sub-title">المشاهدات اليومية</h4>
                <BarChart
                  values={dailyValues.length ? dailyValues : [0]}
                  labels={dailyLabels.length ? dailyLabels : ['—']}
                  height={70}
                />
              </div>
              <div className="ls-reports-donut">
                <h4 className="ls-sub-title">توزيع الجمهور</h4>
                <div className="ls-donut-wrap ls-donut-wrap-sm">
                  <Donut data={audience} size={72} centerLabel="الجمهور" centerValue="100%" />
                  <ul className="ls-legend ls-legend-sm">
                    {audience.map((d) => (
                      <li key={d.label}>
                        <span className="ls-dot" style={{ background: d.color }} />
                        <span className="ls-legend-label">{d.label}</span>
                        <span className="ls-legend-value">{d.value}%</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </ClickableCard>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;500;600;700;800&display=swap');

        /* ============================================================
         * v60 — Single-Viewport Compact Layout
         * كل اللوحة تظهر في صفحة واحدة بدون تمرير عمودي.
         * 6 إحصائيات + 3 صفوف × 3 صناديق متراصة، كل صندوق اختصار قابل للنقر.
         * ============================================================ */

        .ls-admin {
          font-family: 'Noto Sans Arabic', system-ui, sans-serif;
          color: #e2e8f0;
          background: transparent;
          padding: 0;
          margin: 0;
          direction: rtl;
          font-size: 11px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          width: 100%;
        }
        .ls-admin *, .ls-admin *::before, .ls-admin *::after { box-sizing: border-box; }

        /* === Loading / Error states === */
        .ls-loading {
          padding: 8px;
          text-align: center;
          color: #94a3b8;
          font-size: 11px;
        }
        .ls-error {
          padding: 5px 9px;
          background: rgba(239, 68, 68, 0.15);
          color: #fca5a5;
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 6px;
          font-size: 10.5px;
        }
        .ls-empty {
          color: #64748b;
          font-size: 10px;
          text-align: center;
          padding: 8px 0;
        }
        .ls-empty-row {
          text-align: center;
          color: #64748b;
          font-size: 10px;
          padding: 8px 0 !important;
        }

        /* === Clickable cards interaction === */
        .ls-clickable {
          cursor: pointer;
          transition: transform 0.12s ease, box-shadow 0.12s ease, border-color 0.12s ease, background 0.12s ease;
        }
        .ls-clickable:hover {
          transform: translateY(-1px);
          border-color: rgba(139, 92, 246, 0.45) !important;
          box-shadow: 0 6px 18px -8px rgba(139, 92, 246, 0.55);
        }
        .ls-clickable:focus-visible {
          outline: 2px solid #8b5cf6;
          outline-offset: 2px;
        }
        .ls-open-hint {
          color: #a78bfa;
          font-size: 9.5px;
          font-weight: 700;
          opacity: 0.85;
          white-space: nowrap;
          padding: 1px 6px;
          border-radius: 4px;
          background: rgba(139, 92, 246, 0.10);
        }

        /* === Stat cards (6 بطاقات في صف واحد) === */
        .ls-stats-grid {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 8px;
          margin: 0;
        }
        @media (max-width: 1180px) {
          .ls-stats-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }
        @media (max-width: 720px) {
          .ls-stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        .ls-stat-card {
          background: linear-gradient(180deg, #131a33, #0f152a);
          border: 1px solid rgba(148,163,184,0.10);
          border-radius: 10px;
          padding: 9px 11px;
          text-align: right;
          color: inherit;
          font-family: inherit;
          width: 100%;
          display: block;
        }
        .ls-stat-top { display: flex; align-items: center; gap: 6px; }
        .ls-stat-icon {
          width: 26px; height: 26px; border-radius: 7px;
          display: inline-flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 13px;
        }
        .ls-stat-label { color: #94a3b8; font-size: 10.5px; }
        .ls-stat-value {
          color: #f8fafc; font-size: 17px; font-weight: 800;
          margin: 4px 0 2px; letter-spacing: -0.2px;
        }
        .ls-stat-trend { color: #10b981; font-size: 9.5px; font-weight: 700; }
        .ls-stat-muted { color: #64748b; font-weight: 500; margin-right: 3px; font-size: 9.5px; }

        /* === Rows (شبكة موحّدة بنفس الحجم لجميع البطاقات) === */
        .ls-row { display: grid; gap: 8px; margin: 0; }
        .ls-row-3 { grid-template-columns: repeat(3, 1fr); }

        /* === Cards (مربعة / شبه مربعة بنفس الحجم) === */
        /* ✅ v51: تقليص ارتفاع الصناديق لتظهر جميع المحتويات في صفحة واحدة + تفعيل شريط السحب داخل كل صندوق */
        .ls-card {
          background: linear-gradient(180deg, #131a33, #0f152a);
          border: 1px solid rgba(148,163,184,0.10);
          border-radius: 12px;
          padding: 8px 10px;
          min-height: 200px;
          height: 200px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .ls-card-head {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 6px; gap: 6px;
          flex-shrink: 0;
        }
        .ls-card-head h3 {
          margin: 0; color: #f8fafc; font-size: 11.5px; font-weight: 700;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .ls-head-actions { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; }
        .ls-sub-title { color: #cbd5e1; font-size: 10px; margin: 0 0 3px; font-weight: 600; }

        /* === Inputs & selects === */
        .ls-select {
          background: rgba(15,23,42,0.7); color: #e2e8f0;
          border: 1px solid rgba(148,163,184,0.15);
          border-radius: 5px; padding: 2px 6px; font-size: 9.5px;
          font-family: inherit;
        }

        /* === Chart area === */
        .ls-chart-area {
          flex: 1; min-height: 0;
          display: flex; align-items: stretch;
        }

        /* === Donut + legend === */
        .ls-donut-wrap {
          display: flex; align-items: center; gap: 8px; flex-wrap: nowrap;
          flex: 1; min-height: 0;
        }
        .ls-donut-wrap-sm { gap: 6px; }
        .ls-legend { list-style: none; padding: 0; margin: 0; flex: 1; min-width: 0; }
        .ls-legend li {
          display: flex; align-items: center; gap: 4px;
          padding: 1.5px 0; font-size: 9.5px; color: #cbd5e1;
        }
        .ls-legend-sm li { font-size: 8.5px; padding: 1px 0; }
        .ls-legend-label { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .ls-legend-value { color: #f8fafc; font-weight: 700; }
        .ls-dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; flex-shrink: 0; }

        /* === Activity list === */
        /* ✅ v51: تفعيل شريط سحب واضح داخل كل صندوق */
        .ls-activity {
          list-style: none; padding: 0; margin: 0;
          display: flex; flex-direction: column; gap: 5px;
          flex: 1; min-height: 0; overflow-y: auto; overflow-x: hidden;
          scrollbar-width: thin;
          scrollbar-color: rgba(139,92,246,0.7) rgba(15,23,42,0.4);
          padding-inline-end: 4px;
        }
        .ls-activity::-webkit-scrollbar { width: 6px; }
        .ls-activity::-webkit-scrollbar-track {
          background: rgba(15,23,42,0.4);
          border-radius: 5px;
        }
        .ls-activity::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, rgba(139,92,246,0.75), rgba(99,102,241,0.75));
          border-radius: 5px;
        }
        .ls-activity::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, rgba(139,92,246,1), rgba(99,102,241,1));
        }
        .ls-activity li { display: flex; align-items: center; gap: 6px; }
        .ls-avatar {
          width: 22px; height: 22px; border-radius: 50%;
          background: linear-gradient(135deg, #8b5cf6, #ec4899);
          display: inline-flex; align-items: center; justify-content: center;
          color: #fff; font-weight: 800; font-size: 10px;
          flex-shrink: 0;
        }
        .ls-activity-body { display: flex; flex-direction: column; flex: 1; min-width: 0; }
        .ls-activity-body strong { color: #f8fafc; font-size: 10px; }
        .ls-activity-body span {
          color: #94a3b8; font-size: 9px; line-height: 1.25;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .ls-live {
          background: #ef4444; color: #fff;
          font-size: 8px; font-weight: 800; padding: 1px 4px; border-radius: 4px;
        }

        /* === Scrollable table areas === */
        /* ✅ v51: شريط سحب أوضح وأعرض داخل كل جدول */
        .ls-table-wrap {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          overflow-x: auto;
          scrollbar-width: thin;
          scrollbar-color: rgba(139,92,246,0.7) rgba(15,23,42,0.4);
          padding-inline-end: 2px;
        }
        .ls-table-wrap::-webkit-scrollbar { width: 6px; height: 6px; }
        .ls-table-wrap::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, rgba(139,92,246,0.75), rgba(99,102,241,0.75));
          border-radius: 5px;
        }
        .ls-table-wrap::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, rgba(139,92,246,1), rgba(99,102,241,1));
        }
        .ls-table-wrap::-webkit-scrollbar-track {
          background: rgba(15,23,42,0.4); border-radius: 5px;
        }

        /* === Tables (مدمجة) === */
        .ls-table { width: 100%; border-collapse: collapse; font-size: 9.5px; }
        .ls-table thead th {
          position: sticky; top: 0;
          background: linear-gradient(180deg, #131a33, #0f152a); z-index: 2;
        }
        .ls-table th {
          text-align: right; color: #94a3b8; font-weight: 600;
          padding: 4px 4px; border-bottom: 1px solid rgba(148,163,184,0.10);
          font-size: 8.8px; white-space: nowrap;
        }
        .ls-table td {
          padding: 4px 4px; color: #e2e8f0;
          border-bottom: 1px solid rgba(148,163,184,0.06); font-size: 9.5px;
          white-space: nowrap;
        }
        .ls-table td.ls-ellipsis {
          max-width: 120px;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .ls-status {
          display: inline-block; padding: 1px 6px; border-radius: 999px;
          font-size: 8.5px; font-weight: 700;
        }
        .ls-status-ok   { background: rgba(16,185,129,0.18); color: #34d399; }
        .ls-status-live { background: rgba(239,68,68,0.18);  color: #fca5a5; }

        /* === KPI mini (داخل بطاقة التقارير المضغوطة) === */
        .ls-kpi-mini {
          display: grid; grid-template-columns: repeat(2, 1fr);
          gap: 4px; margin-bottom: 5px;
          flex-shrink: 0;
        }
        .ls-kpi-cell {
          background: rgba(15,23,42,0.55);
          border: 1px solid rgba(148,163,184,0.10);
          border-radius: 6px; padding: 4px 6px;
        }
        .ls-kpi-label { color: #94a3b8; font-size: 8.5px; }
        .ls-kpi-value {
          color: #f8fafc; font-size: 11px; font-weight: 800;
          margin: 1px 0; letter-spacing: -0.2px;
        }
        .ls-kpi-trend.up { color: #10b981; font-size: 8.5px; font-weight: 700; }

        /* === Reports mini (chart + donut صغيرين داخل بطاقة واحدة) === */
        .ls-reports-mini {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px;
          flex: 1;
          min-height: 0;
        }
        .ls-reports-chart, .ls-reports-donut {
          display: flex; flex-direction: column;
          min-height: 0; overflow: hidden;
        }

        /* === Responsive breakpoints === */
        @media (max-width: 1280px) {
          .ls-card { height: 195px; min-height: 195px; }
        }
        @media (max-width: 1180px) {
          .ls-row-3 { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 820px) {
          .ls-row-3 { grid-template-columns: 1fr; }
          .ls-card { height: auto; min-height: 200px; max-height: 260px; }
        }

        /* === ✅ v51: إزالة الفراغ العلوي + رفع المحتوى لأعلى اللوحة بالكامل === */
        .admin-page-shell-modern {
          padding: 0 10px 6px !important;
          gap: 6px !important;
          justify-content: flex-start !important;
          align-content: flex-start !important;
        }
        .admin-page-shell-modern .breadcrumbs {
          margin: 0 !important;
          padding: 2px 0 !important;
          font-size: 10px !important;
          line-height: 1.2 !important;
        }
        .admin-topbar-modern {
          min-height: 38px !important;
          padding: 2px 12px !important;
        }
        .ls-admin {
          padding-top: 0 !important;
          margin-top: 0 !important;
        }
        .ls-admin > *:first-child {
          margin-top: 0 !important;
        }
        /* تقليص الفجوة بين الصفوف */
        .ls-admin {
          gap: 6px !important;
        }
        .ls-row {
          gap: 6px !important;
        }
        .ls-stats-grid {
          gap: 6px !important;
        }
      `}</style>
    </AdminLayout>
  );
}
