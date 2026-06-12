import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout.jsx';

/**
 * ========================================================================
 * AdminDashboard — لوحة المدير العام (نسخة موحّدة بدون تراكب صفحات)
 * ------------------------------------------------------------------------
 * - إزالة كاملة لأي شاشة "Live dashboards / Real API fusion" القديمة
 *   التي كانت تظهر فوق التصميم الرئيسي وتُحدث تراكباً بصرياً.
 * - واجهة واحدة فقط مطابقة لتصميم LiveStream الداكن البنفسجي.
 * - حُذف قسم "إدارة البثوث" بناءً على طلب المالك (نظام البث ملغى).
 * - dir="rtl" + Noto Sans Arabic لضمان عرض عربي سليم.
 * ========================================================================
 */

const STAT_CARDS = [
  { id: 'users',    label: 'إجمالي المستخدمين', value: '128,560',     trend: '+12.5%', icon: '👥', tone: '#8b5cf6' },
  { id: 'views',    label: 'المشاهدات الكلية',  value: '2.45M',       trend: '+15.3%', icon: '👁',  tone: '#ef4444' },
  { id: 'revenue',  label: 'الإيرادات',         value: '$ 45,231.89', trend: '+21.4%', icon: '$',  tone: '#10b981' },
  { id: 'posts',    label: 'المنشورات',         value: '15,890',      trend: '+17.2%', icon: '🎁', tone: '#f59e0b' },
  { id: 'reels',    label: 'الريلز',            value: '8,456',       trend: '+11.3%', icon: '🎵', tone: '#ec4899' },
];

const VIEWS_TREND = [
  { day: 'مايو 12', value: 220 },
  { day: 'مايو 13', value: 260 },
  { day: 'مايو 14', value: 240 },
  { day: 'مايو 15', value: 340 },
  { day: 'مايو 16', value: 300 },
  { day: 'مايو 17', value: 420 },
  { day: 'مايو 18', value: 470 },
];

const CONTENT_DISTRIBUTION = [
  { label: 'منشورات', value: 25, color: '#a78bfa' },
  { label: 'ريلز',     value: 20, color: '#f59e0b' },
  { label: 'ستوري',   value: 10, color: '#10b981' },
  { label: 'أخرى',     value: 5,  color: '#ef4444' },
];

const RECENT_ACTIVITIES = [
  { id: 1, user: 'PlayerOne',   text: 'بحدث من المستخدم منذ 5 دقائق',          badge: 'LIVE' },
  { id: 2, user: 'KhaledGamer', text: 'تم نشر جديد من المستخدم منذ 15 دقيقة',  badge: null },
  { id: 3, user: 'ShadowGirl',  text: 'تعليق جديد على البث المستخدم',           badge: null },
  { id: 4, user: 'MoxX',        text: 'تم نشر ستوري جديد من المستخدم',          badge: null },
  { id: 5, user: 'ProHunter',   text: 'تم نشر ريلز جديد من المستخدم',           badge: null },
];

const POSTS_ROWS = [
  { id: 1, date: '18 مايو 10:30 PM', user: 'KhaledGamer', content: 'لحظات من البث الأخير',         interactions: '2.5K' },
  { id: 2, date: '18 مايو 09:45 PM', user: 'ShadowGirl',  content: 'شكراً على الدعم 💜',           interactions: '1.8K' },
  { id: 3, date: '18 مايو 08:30 PM', user: 'MoxX',        content: 'أخبروني عن رأيكم في هذا التحديث؟', interactions: '965' },
  { id: 4, date: '18 مايو 07:15 PM', user: 'ProHunter',   content: 'استعدادات البطولة غداً 🔥',    interactions: '1.2K' },
  { id: 5, date: '18 مايو 06:40 PM', user: 'PlayerOne',   content: 'مناظر اللعبة الجديدة!',         interactions: '884' },
];

const CHAT_ROWS = [
  { id: 1, user: 'ahmed_king',  text: 'شكراً على البث الرائع!', date: '18 مايو 10:30 PM' },
  { id: 2, user: 'lina_music',  text: 'متى البث القادم؟',        date: '18 مايو 09:45 PM' },
  { id: 3, user: 'game_master', text: 'رائع جداً استمر',          date: '18 مايو 08:30 PM' },
  { id: 4, user: 'nour_88',     text: 'احتاج مساعدة',             date: '18 مايو 07:15 PM' },
  { id: 5, user: 'sami_pro',    text: 'أحب محتواك',               date: '18 مايو 06:40 PM' },
];

const STORIES_ROWS = [
  { id: 1, user: 'MoxX',        views: '1.2K', date: '10:30 PM' },
  { id: 2, user: 'ShadowGirl',  views: '980',  date: '09:45 PM' },
  { id: 3, user: 'KhaledGamer', views: 'نص',   date: '08:30 PM' },
  { id: 4, user: 'PlayerOne',   views: 'صورة', date: '07:15 PM' },
  { id: 5, user: 'ProHunter',   views: '620',  date: '06:40 PM' },
];

const REELS_ROWS = [
  { id: 1, user: 'ProHunter',   title: 'لحظات سريعة من اللعبة',     views: '2.5K', date: '10:30 PM' },
  { id: 2, user: 'KhaledGamer', title: 'أفضل اللقطات هذا الأسبوع',  views: '1.8K', date: '09:20 PM' },
  { id: 3, user: 'ShadowGirl',  title: 'أقوى تحدي في اللعبة!',       views: '1.5K', date: '08:15 PM' },
  { id: 4, user: 'MoxX',        title: 'لحظات مضحكة',                 views: '1.2K', date: '07:10 PM' },
  { id: 5, user: 'PlayerOne',   title: 'نصائح احترافية للمبتدئين',    views: '980',  date: '06:05 PM' },
];

const VIEWERS_DAILY = [180, 240, 220, 280, 320, 380, 350, 410, 460, 420, 470, 500];
const DAILY_LABELS = ['19 أبريل','22 أبريل','25 أبريل','28 أبريل','29 أبريل','2 مايو','4 مايو','9 مايو','12 مايو','14 مايو','16 مايو','18 مايو'];

const AUDIENCE = [
  { label: '18-24 سنة',   value: 35, color: '#a78bfa' },
  { label: '25-34 سنة',   value: 40, color: '#3b82f6' },
  { label: '35-44 سنة',   value: 15, color: '#f59e0b' },
  { label: 'أكثر من ذلك', value: 10, color: '#10b981' },
];

// رسم بياني منطقة (Area / Line) بسيط بـ SVG
function AreaChart({ data, height = 220 }) {
  const max = Math.max(...data.map((d) => d.value)) * 1.1;
  const w = 700;
  const h = height;
  const padX = 36;
  const padY = 20;
  const stepX = (w - padX * 2) / (data.length - 1);
  const points = data.map((d, i) => {
    const x = padX + i * stepX;
    const y = h - padY - ((d.value / max) * (h - padY * 2));
    return { x, y, ...d };
  });
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${h - padY} L ${points[0].x} ${h - padY} Z`;
  const yTicks = [0, 100, 200, 300, 400, 500];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#8b5cf6" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {yTicks.map((t, i) => {
        const y = h - padY - ((t / 500) * (h - padY * 2));
        return (
          <g key={i}>
            <line x1={padX} y1={y} x2={w - padX} y2={y} stroke="rgba(148,163,184,0.12)" />
            <text x={padX - 8} y={y + 4} fill="#64748b" fontSize="11" textAnchor="end">{t}K</text>
          </g>
        );
      })}
      <path d={areaPath} fill="url(#areaFill)" />
      <path d={linePath} fill="none" stroke="#8b5cf6" strokeWidth="2.5" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4" fill="#8b5cf6" stroke="#0f172a" strokeWidth="2" />
          <text x={p.x} y={h - 4} fill="#64748b" fontSize="11" textAnchor="middle">{p.day}</text>
        </g>
      ))}
    </svg>
  );
}

// Donut chart للتوزيع
function Donut({ data, size = 200, centerLabel = 'الإجمالي', centerValue = '100%' }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = size / 2 - 18;
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
    return { path: `M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} Z`, color: d.color, label: d.label, value: d.value };
  });
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
      {arcs.map((a, i) => <path key={i} d={a.path} fill={a.color} />)}
      <circle cx={cx} cy={cy} r={r * 0.62} fill="#0f172a" />
      <text x={cx} y={cy - 4} fill="#94a3b8" fontSize="12" textAnchor="middle">{centerLabel}</text>
      <text x={cx} y={cy + 16} fill="#f8fafc" fontSize="18" fontWeight="800" textAnchor="middle">{centerValue}</text>
    </svg>
  );
}

// Bar chart
function BarChart({ values, labels, height = 200, color = '#a78bfa' }) {
  const max = Math.max(...values) * 1.15;
  const w = 700;
  const padX = 30;
  const padY = 18;
  const bw = (w - padX * 2) / values.length - 8;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} width="100%" height={height} preserveAspectRatio="xMidYMid meet">
      {[100, 200, 300, 400, 500].map((t, i) => {
        const y = height - padY - ((t / 500) * (height - padY * 2));
        return (
          <g key={i}>
            <line x1={padX} y1={y} x2={w - padX} y2={y} stroke="rgba(148,163,184,0.10)" />
            <text x={padX - 6} y={y + 4} fill="#64748b" fontSize="10" textAnchor="end">{t}K</text>
          </g>
        );
      })}
      {values.map((v, i) => {
        const h = (v / max) * (height - padY * 2);
        const x = padX + i * ((w - padX * 2) / values.length) + 4;
        const y = height - padY - h;
        return (
          <g key={i}>
            <rect x={x} y={y} width={bw} height={h} fill={color} rx="3" />
            <text x={x + bw / 2} y={height - 4} fill="#64748b" fontSize="10" textAnchor="middle">{labels[i]}</text>
          </g>
        );
      })}
    </svg>
  );
}

export default function AdminDashboard() {
  const [chartTab, setChartTab] = useState('views');
  const [reportTab, setReportTab] = useState('interactions');

  // مؤشر بسيط على أن النسخة الجديدة الموحّدة هي التي حُمّلت (يساعد في كشف تراكب أي صفحة قديمة)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__YAMSHAT_ADMIN_DASHBOARD_VERSION__ = 'unified-v20-no-live';
      // إزالة أي عقد قديمة محتملة في الـ DOM (مخلفات legacy)
      document.querySelectorAll('[data-legacy-admin-dashboard="true"]').forEach((el) => el.remove());
    }
  }, []);

  const distributionTotal = useMemo(() => CONTENT_DISTRIBUTION.reduce((s, d) => s + d.value, 0), []);

  return (
    <AdminLayout>
      <div className="ls-admin" dir="rtl" data-yamshat-version="unified-v20-no-live">
        {/* ====== Header ====== */}
        <div className="ls-head">
          <div>
            <h1 className="ls-title">لوحة التحكم</h1>
            <p className="ls-sub">مرحباً بك، إليك نظرة عامة على المنصة</p>
          </div>
        </div>

        {/* ====== Stat cards ====== */}
        <div className="ls-stats-grid">
          {STAT_CARDS.map((s) => (
            <div key={s.id} className="ls-stat-card">
              <div className="ls-stat-top">
                <span className="ls-stat-icon" style={{ background: `${s.tone}22`, color: s.tone }}>{s.icon}</span>
                <span className="ls-stat-label">{s.label}</span>
              </div>
              <div className="ls-stat-value">{s.value}</div>
              <div className="ls-stat-trend">▲ {s.trend} <span className="ls-stat-muted">من الشهر الماضي</span></div>
            </div>
          ))}
        </div>

        {/* ====== Row: Views chart + Distribution donut + Recent activities ====== */}
        <div className="ls-row ls-row-3">
          <div className="ls-card ls-col-2">
            <div className="ls-card-head">
              <h3>المشاهدات خلال آخر 7 أيام</h3>
              <select className="ls-select" value={chartTab} onChange={(e) => setChartTab(e.target.value)}>
                <option value="views">المشاهدات</option>
                <option value="interactions">التفاعلات</option>
                <option value="users">المستخدمون</option>
              </select>
            </div>
            <AreaChart data={VIEWS_TREND} />
          </div>

          <div className="ls-card">
            <div className="ls-card-head"><h3>توزيع المحتوى</h3></div>
            <div className="ls-donut-wrap">
              <Donut data={CONTENT_DISTRIBUTION} centerLabel="الإجمالي" centerValue="100%" />
              <ul className="ls-legend">
                {CONTENT_DISTRIBUTION.map((d) => (
                  <li key={d.label}>
                    <span className="ls-dot" style={{ background: d.color }} />
                    <span className="ls-legend-label">{d.label}</span>
                    <span className="ls-legend-value">{Math.round((d.value / distributionTotal) * 100)}%</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="ls-card">
            <div className="ls-card-head"><h3>النشاطات الأخيرة</h3></div>
            <ul className="ls-activity">
              {RECENT_ACTIVITIES.map((a) => (
                <li key={a.id}>
                  <span className="ls-avatar">{a.user.charAt(0)}</span>
                  <div className="ls-activity-body">
                    <strong>{a.user}</strong>
                    <span>{a.text}</span>
                  </div>
                  {a.badge ? <span className="ls-live">{a.badge}</span> : null}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ====== Row: Posts + Chat ====== */}
        <div className="ls-row ls-row-2">
          <div className="ls-card">
            <div className="ls-card-head">
              <h3>📨 إدارة المنشورات</h3>
              <button className="ls-btn ls-btn-primary">+ منشور جديد</button>
            </div>
            <input className="ls-search" placeholder="ابحث عن منشور..." />
            <table className="ls-table">
              <thead>
                <tr>
                  <th>التاريخ</th>
                  <th>المستخدم</th>
                  <th>محتوى المنشور</th>
                  <th>التفاعلات</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {POSTS_ROWS.map((r) => (
                  <tr key={r.id}>
                    <td>{r.date}</td>
                    <td>{r.user}</td>
                    <td>{r.content}</td>
                    <td>{r.interactions}</td>
                    <td><span className="ls-status ls-status-ok">نشط</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="ls-card">
            <div className="ls-card-head">
              <h3>💬 إدارة الشات</h3>
            </div>
            <table className="ls-table">
              <thead>
                <tr>
                  <th>المستخدم</th>
                  <th>آخر رسالة</th>
                  <th>الحالة</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {CHAT_ROWS.map((r) => (
                  <tr key={r.id}>
                    <td>{r.user}</td>
                    <td>{r.text}</td>
                    <td><span className="ls-status ls-status-ok">نشط</span></td>
                    <td><button className="ls-btn ls-btn-ghost">عرض</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ====== Row: Stories + Reels ====== */}
        <div className="ls-row ls-row-2">
          <div className="ls-card">
            <div className="ls-card-head">
              <h3>📷 إدارة الستوري</h3>
              <button className="ls-btn ls-btn-primary">+ ستوري جديد</button>
            </div>
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
                {STORIES_ROWS.map((r) => (
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

          <div className="ls-card">
            <div className="ls-card-head">
              <h3>🎬 إدارة الريلز</h3>
              <button className="ls-btn ls-btn-primary">+ ريلز جديد</button>
            </div>
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
                {REELS_ROWS.map((r) => (
                  <tr key={r.id}>
                    <td>{r.date}</td>
                    <td>{r.user}</td>
                    <td>{r.title}</td>
                    <td>{r.views}</td>
                    <td><span className="ls-status ls-status-ok">نشط</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ====== Row: Reports & Analytics ====== */}
        <div className="ls-card">
          <div className="ls-card-head">
            <h3>📊 التقارير والإحصائيات</h3>
            <div className="ls-tabs">
              {[
                ['interactions', 'التفاعلات'],
                ['revenue',      'الإيرادات'],
                ['content',      'المحتوى'],
                ['users',        'المستخدمون'],
                ['overview',     'نظرة عامة'],
              ].map(([k, l]) => (
                <button key={k} className={`ls-tab ${reportTab === k ? 'active' : ''}`} onClick={() => setReportTab(k)}>{l}</button>
              ))}
            </div>
          </div>

          <div className="ls-kpi-row">
            <div className="ls-kpi"><div className="ls-kpi-label">إجمالي الإيرادات</div><div className="ls-kpi-value">$ 45,231.89</div><div className="ls-kpi-trend up">▲ 11.2%</div></div>
            <div className="ls-kpi"><div className="ls-kpi-label">معدل التفاعل</div><div className="ls-kpi-value">5.23%</div><div className="ls-kpi-trend up">▲ 12.7%</div></div>
            <div className="ls-kpi"><div className="ls-kpi-label">متوسط المشاهدة</div><div className="ls-kpi-value">15:42</div><div className="ls-kpi-trend up">▲ 8.6%</div></div>
            <div className="ls-kpi"><div className="ls-kpi-label">إجمالي المشاهدات</div><div className="ls-kpi-value">2.45M</div><div className="ls-kpi-trend up">▲ 15.3%</div></div>
          </div>

          <div className="ls-row ls-row-2">
            <div>
              <h4 className="ls-sub-title">المشاهدات اليومية</h4>
              <BarChart values={VIEWERS_DAILY} labels={DAILY_LABELS} />
            </div>
            <div>
              <h4 className="ls-sub-title">توزيع الجمهور</h4>
              <div className="ls-donut-wrap">
                <Donut data={AUDIENCE} centerLabel="الجمهور" centerValue="100%" />
                <ul className="ls-legend">
                  {AUDIENCE.map((d) => (
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
        </div>

      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;500;600;700;800&display=swap');

        .ls-admin {
          font-family: 'Noto Sans Arabic', system-ui, sans-serif;
          color: #e2e8f0;
          background: #0b1020;
          padding: 22px;
          min-height: 100vh;
          direction: rtl;
        }
        .ls-admin *, .ls-admin *::before, .ls-admin *::after { box-sizing: border-box; }

        .ls-head { margin-bottom: 18px; }
        .ls-title { margin: 0; color: #f8fafc; font-size: 24px; font-weight: 800; }
        .ls-sub   { margin: 4px 0 0; color: #94a3b8; font-size: 13px; }

        .ls-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 14px;
          margin-bottom: 18px;
        }
        .ls-stat-card {
          background: linear-gradient(180deg, #131a33, #0f152a);
          border: 1px solid rgba(148,163,184,0.10);
          border-radius: 14px;
          padding: 16px;
        }
        .ls-stat-top { display: flex; align-items: center; gap: 10px; }
        .ls-stat-icon {
          width: 34px; height: 34px; border-radius: 10px;
          display: inline-flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 16px;
        }
        .ls-stat-label { color: #94a3b8; font-size: 13px; }
        .ls-stat-value { color: #f8fafc; font-size: 26px; font-weight: 800; margin: 10px 0 6px; }
        .ls-stat-trend { color: #10b981; font-size: 12px; font-weight: 700; }
        .ls-stat-muted { color: #64748b; font-weight: 500; margin-right: 6px; }

        .ls-row { display: grid; gap: 16px; margin-bottom: 16px; }
        .ls-row-2 { grid-template-columns: 1fr 1fr; }
        .ls-row-3 { grid-template-columns: 2fr 1fr 1fr; }
        .ls-col-2 { grid-column: span 1; }

        .ls-card {
          background: linear-gradient(180deg, #131a33, #0f152a);
          border: 1px solid rgba(148,163,184,0.10);
          border-radius: 16px;
          padding: 16px;
        }
        .ls-card-head {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 12px; flex-wrap: wrap; gap: 10px;
        }
        .ls-card-head h3 { margin: 0; color: #f8fafc; font-size: 15px; font-weight: 700; }
        .ls-sub-title { color: #cbd5e1; font-size: 14px; margin: 0 0 10px; font-weight: 600; }

        .ls-select, .ls-search, .ls-btn {
          background: rgba(15,23,42,0.7); color: #e2e8f0;
          border: 1px solid rgba(148,163,184,0.15);
          border-radius: 10px; padding: 8px 12px; font-size: 13px;
          font-family: inherit;
        }
        .ls-search { width: 100%; margin-bottom: 10px; }
        .ls-btn { cursor: pointer; }
        .ls-btn-primary { background: linear-gradient(135deg, #8b5cf6, #6d28d9); border: 0; color: #fff; font-weight: 700; }
        .ls-btn-ghost   { background: rgba(139,92,246,0.15); color: #c4b5fd; border-color: rgba(139,92,246,0.25); }

        .ls-donut-wrap { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
        .ls-legend { list-style: none; padding: 0; margin: 0; flex: 1; min-width: 140px; }
        .ls-legend li { display: flex; align-items: center; gap: 8px; padding: 4px 0; font-size: 13px; color: #cbd5e1; }
        .ls-legend-label { flex: 1; }
        .ls-legend-value { color: #f8fafc; font-weight: 700; }
        .ls-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }

        .ls-activity { list-style: none; padding: 0; margin: 0; display: grid; gap: 10px; }
        .ls-activity li { display: flex; align-items: center; gap: 10px; }
        .ls-avatar {
          width: 32px; height: 32px; border-radius: 50%;
          background: linear-gradient(135deg, #8b5cf6, #ec4899);
          display: inline-flex; align-items: center; justify-content: center;
          color: #fff; font-weight: 800; font-size: 13px;
        }
        .ls-activity-body { display: flex; flex-direction: column; flex: 1; }
        .ls-activity-body strong { color: #f8fafc; font-size: 13px; }
        .ls-activity-body span { color: #94a3b8; font-size: 12px; }
        .ls-live {
          background: #ef4444; color: #fff;
          font-size: 10px; font-weight: 800; padding: 3px 6px; border-radius: 6px;
        }

        .ls-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .ls-table th { text-align: right; color: #94a3b8; font-weight: 600; padding: 8px; border-bottom: 1px solid rgba(148,163,184,0.10); }
        .ls-table td { padding: 10px 8px; color: #e2e8f0; border-bottom: 1px solid rgba(148,163,184,0.06); }
        .ls-status {
          display: inline-block; padding: 3px 10px; border-radius: 999px;
          font-size: 11px; font-weight: 700;
        }
        .ls-status-ok { background: rgba(16,185,129,0.18); color: #34d399; }

        .ls-tabs { display: flex; gap: 6px; flex-wrap: wrap; }
        .ls-tab {
          background: transparent; border: 0;
          color: #94a3b8; padding: 6px 12px; border-radius: 8px;
          font-size: 12px; cursor: pointer; font-family: inherit;
        }
        .ls-tab.active { background: rgba(139,92,246,0.18); color: #c4b5fd; }

        .ls-kpi-row {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 12px; margin-bottom: 18px;
        }
        .ls-kpi {
          background: rgba(15,23,42,0.65);
          border: 1px solid rgba(148,163,184,0.10);
          border-radius: 12px; padding: 14px;
        }
        .ls-kpi-label { color: #94a3b8; font-size: 12px; }
        .ls-kpi-value { color: #f8fafc; font-size: 22px; font-weight: 800; margin: 6px 0 4px; }
        .ls-kpi-trend.up { color: #10b981; font-size: 12px; font-weight: 700; }

        @media (max-width: 1180px) {
          .ls-row-3 { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 820px) {
          .ls-row-2, .ls-row-3 { grid-template-columns: 1fr; }
        }
      `}</style>
    </AdminLayout>
  );
}
