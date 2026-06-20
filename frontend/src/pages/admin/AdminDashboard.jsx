import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import { getAdminDashboardLive } from '../../api/admin.js';

/**
 * ========================================================================
 * AdminDashboard — لوحة المدير العام (v31 — Live Data + Full-Screen Layout)
 * ------------------------------------------------------------------------
 * - الأرقام مربوطة بـ /api/admin/dashboard/live (بيانات حقيقية من DB).
 * - تم رفع البطاقات للأعلى وملء كامل الشاشة (إزالة الفراغات).
 * - الإبقاء على الهوية البصرية (LiveStream Dark / Purple).
 * - dir="rtl" + Noto Sans Arabic.
 * ========================================================================
 */

// ============ Fallback (يظهر فقط أثناء التحميل أو إذا فشل الاتصال) ============
const FALLBACK_STAT_CARDS = [
  { id: 'users',   label: 'إجمالي المستخدمين', value: '—', trend: '+0.0%', icon: '👥', tone: '#8b5cf6' },
  { id: 'views',   label: 'المشاهدات الكلية',  value: '—', trend: '+0.0%', icon: '👁', tone: '#ef4444' },
  { id: 'revenue', label: 'الإيرادات',         value: '—', trend: '+0.0%', icon: '$',  tone: '#10b981' },
  { id: 'posts',   label: 'المنشورات',         value: '—', trend: '+0.0%', icon: '🎁', tone: '#f59e0b' },
  { id: 'reels',   label: 'الريلز',            value: '—', trend: '+0.0%', icon: '🎵', tone: '#ec4899' },
];

const FALLBACK_VIEWS_TREND = [
  { day: '—', value: 0 }, { day: '—', value: 0 }, { day: '—', value: 0 },
  { day: '—', value: 0 }, { day: '—', value: 0 }, { day: '—', value: 0 }, { day: '—', value: 0 },
];

const FALLBACK_CONTENT_DISTRIBUTION = [
  { label: 'منشورات', value: 25, color: '#a78bfa' },
  { label: 'ريلز',    value: 20, color: '#f59e0b' },
  { label: 'ستوري',   value: 10, color: '#10b981' },
  { label: 'أخرى',    value: 5,  color: '#ef4444' },
];

const FALLBACK_AUDIENCE = [
  { label: '18-24 سنة',  value: 35, color: '#a78bfa' },
  { label: '25-34 سنة',  value: 40, color: '#3b82f6' },
  { label: '35-44 سنة',  value: 15, color: '#f59e0b' },
  { label: 'أكثر من ذلك', value: 10, color: '#10b981' },
];

// رسم بياني منطقة (Area / Line) بسيط بـ SVG — مضغوط
function AreaChart({ data, height = 150 }) {
  if (!data?.length) return null;
  const max = Math.max(...data.map((d) => d.value), 1) * 1.1;
  const w = 700;
  const h = height;
  const padX = 30;
  const padY = 16;
  const stepX = (w - padX * 2) / Math.max(data.length - 1, 1);
  const points = data.map((d, i) => {
    const x = padX + i * stepX;
    const y = h - padY - ((d.value / max) * (h - padY * 2));
    return { x, y, ...d };
  });
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${h - padY} L ${points[0].x} ${h - padY} Z`;
  const yTicks = [0, Math.round(max * 0.25), Math.round(max * 0.5), Math.round(max * 0.75), Math.round(max)];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="xMidYMid meet">
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
            <text x={padX - 6} y={y + 3} fill="#64748b" fontSize="9" textAnchor="end">{t}K</text>
          </g>
        );
      })}
      <path d={areaPath} fill="url(#areaFill)" />
      <path d={linePath} fill="none" stroke="#8b5cf6" strokeWidth="2" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="3" fill="#8b5cf6" stroke="#0f172a" strokeWidth="2" />
          <text x={p.x} y={h - 3} fill="#64748b" fontSize="9" textAnchor="middle">{p.day}</text>
        </g>
      ))}
    </svg>
  );
}

// Donut chart للتوزيع — مضغوط
function Donut({ data, size = 130, centerLabel = 'الإجمالي', centerValue = '100%' }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = size / 2 - 12;
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
      <text x={cx} y={cy - 2} fill="#94a3b8" fontSize="9" textAnchor="middle">{centerLabel}</text>
      <text x={cx} y={cy + 12} fill="#f8fafc" fontSize="14" fontWeight="800" textAnchor="middle">{centerValue}</text>
    </svg>
  );
}

// Bar chart — مضغوط
function BarChart({ values, labels, height = 130, color = '#a78bfa' }) {
  if (!values?.length) return null;
  const max = Math.max(...values, 1) * 1.15;
  const w = 700;
  const padX = 26;
  const padY = 14;
  const bw = (w - padX * 2) / values.length - 8;
  const yTicks = [0, Math.round(max * 0.25), Math.round(max * 0.5), Math.round(max * 0.75), Math.round(max)];
  return (
    <svg viewBox={`0 0 ${w} ${height}`} width="100%" height={height} preserveAspectRatio="xMidYMid meet">
      {yTicks.map((t, i) => {
        const y = height - padY - ((t / max) * (height - padY * 2));
        return (
          <g key={i}>
            <line x1={padX} y1={y} x2={w - padX} y2={y} stroke="rgba(148,163,184,0.10)" />
            <text x={padX - 4} y={y + 3} fill="#64748b" fontSize="9" textAnchor="end">{t}K</text>
          </g>
        );
      })}
      {values.map((v, i) => {
        const h = (v / max) * (height - padY * 2);
        const x = padX + i * ((w - padX * 2) / values.length) + 4;
        const y = height - padY - h;
        return (
          <g key={i}>
            <rect x={x} y={y} width={bw} height={h} fill={color} rx="2.5" />
            <text x={x + bw / 2} y={height - 3} fill="#64748b" fontSize="8" textAnchor="middle">{labels[i]}</text>
          </g>
        );
      })}
    </svg>
  );
}

export default function AdminDashboard() {
  const [chartTab, setChartTab] = useState('views');
  const [reportTab, setReportTab] = useState('interactions');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // مؤشر بسيط على أن النسخة الجديدة الموحّدة هي التي حُمّلت
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__YAMSHAT_ADMIN_DASHBOARD_VERSION__ = 'unified-v31-live-data';
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
    // تحديث تلقائي كل 30 ثانية
    const interval = setInterval(load, 30_000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const statCards = data?.stat_cards || FALLBACK_STAT_CARDS;
  const viewsTrend = data?.views_trend || FALLBACK_VIEWS_TREND;
  const contentDistribution = data?.content_distribution || FALLBACK_CONTENT_DISTRIBUTION;
  const recentActivities = data?.recent_activities || [];
  const postsRows = data?.posts_table || [];
  const chatRows = data?.chat_table || [];
  const storiesRows = data?.stories_table || [];
  const reelsRows = data?.reels_table || [];
  const kpis = data?.kpis || [];
  const dailyValues = data?.daily_views_values || [];
  const dailyLabels = data?.daily_views_labels || [];
  const audience = data?.audience || FALLBACK_AUDIENCE;

  const distributionTotal = useMemo(
    () => contentDistribution.reduce((s, d) => s + d.value, 0) || 1,
    [contentDistribution]
  );

  return (
    <AdminLayout>
      <div className="ls-admin" dir="rtl" data-yamshat-version="unified-v31-live-data">
        {loading && !data ? (
          <div className="ls-loading">جاري تحميل البيانات الحية...</div>
        ) : null}
        {error ? (
          <div className="ls-error">⚠ {error}</div>
        ) : null}

        {/* ====== Stat cards ====== */}
        <div className="ls-stats-grid">
          {statCards.map((s) => (
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
            <AreaChart data={viewsTrend} />
          </div>

          <div className="ls-card">
            <div className="ls-card-head"><h3>توزيع المحتوى</h3></div>
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
          </div>

          <div className="ls-card">
            <div className="ls-card-head"><h3>النشاطات الأخيرة</h3></div>
            <ul className="ls-activity">
              {recentActivities.length === 0 ? (
                <li className="ls-empty">لا يوجد نشاط حديث</li>
              ) : recentActivities.map((a) => (
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
            <div className="ls-table-wrap">
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
                {postsRows.length === 0 ? (
                  <tr><td colSpan={5} className="ls-empty-row">لا توجد منشورات بعد</td></tr>
                ) : postsRows.map((r) => (
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
          </div>

          <div className="ls-card">
            <div className="ls-card-head">
              <h3>💬 إدارة الشات</h3>
            </div>
            <div className="ls-table-wrap">
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
                {chatRows.length === 0 ? (
                  <tr><td colSpan={4} className="ls-empty-row">لا توجد رسائل بعد</td></tr>
                ) : chatRows.map((r) => (
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
        </div>

        {/* ====== Row: Stories + Reels ====== */}
        <div className="ls-row ls-row-2">
          <div className="ls-card">
            <div className="ls-card-head">
              <h3>📷 إدارة الستوري</h3>
              <button className="ls-btn ls-btn-primary">+ ستوري جديد</button>
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
                {storiesRows.length === 0 ? (
                  <tr><td colSpan={4} className="ls-empty-row">لا توجد ستوريات بعد</td></tr>
                ) : storiesRows.map((r) => (
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
          </div>

          <div className="ls-card">
            <div className="ls-card-head">
              <h3>🎬 إدارة الريلز</h3>
              <button className="ls-btn ls-btn-primary">+ ريلز جديد</button>
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
                {reelsRows.length === 0 ? (
                  <tr><td colSpan={5} className="ls-empty-row">لا توجد ريلز بعد</td></tr>
                ) : reelsRows.map((r) => (
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
        </div>

        {/* ====== Row: Reports & Analytics ====== */}
        <div className="ls-card ls-card-full">
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
            {(kpis.length ? kpis : [
              { label: 'إجمالي الإيرادات', value: '—', trend: '+0.0%' },
              { label: 'معدل التفاعل',     value: '—', trend: '+0.0%' },
              { label: 'متوسط المشاهدة',   value: '—', trend: '+0.0%' },
              { label: 'إجمالي المشاهدات', value: '—', trend: '+0.0%' },
            ]).map((k, i) => (
              <div key={i} className="ls-kpi">
                <div className="ls-kpi-label">{k.label}</div>
                <div className="ls-kpi-value">{k.value}</div>
                <div className="ls-kpi-trend up">▲ {k.trend}</div>
              </div>
            ))}
          </div>

          <div className="ls-row ls-row-2">
            <div>
              <h4 className="ls-sub-title">المشاهدات اليومية</h4>
              <BarChart values={dailyValues.length ? dailyValues : [0]} labels={dailyLabels.length ? dailyLabels : ['—']} />
            </div>
            <div>
              <h4 className="ls-sub-title">توزيع الجمهور</h4>
              <div className="ls-donut-wrap">
                <Donut data={audience} centerLabel="الجمهور" centerValue="100%" />
                <ul className="ls-legend">
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
        </div>

      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;500;600;700;800&display=swap');

        /* ============================================================
         * v31 — تصميم Full-Screen (إزالة الفراغات + رفع البطاقات للأعلى)
         * البطاقات تملأ كامل الشاشة بدون مساحات فارغة
         * ============================================================ */

        .ls-admin {
          font-family: 'Noto Sans Arabic', system-ui, sans-serif;
          color: #e2e8f0;
          background: #0b1020;
          padding: 0;
          margin: 0;
          min-height: 100%;
          direction: rtl;
          font-size: 11px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .ls-admin *, .ls-admin *::before, .ls-admin *::after { box-sizing: border-box; }

        /* === Loading / Error states === */
        .ls-loading {
          padding: 10px;
          text-align: center;
          color: #94a3b8;
          font-size: 11px;
        }
        .ls-error {
          padding: 6px 10px;
          background: rgba(239, 68, 68, 0.15);
          color: #fca5a5;
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 8px;
          font-size: 10.5px;
        }
        .ls-empty {
          color: #64748b;
          font-size: 10px;
          text-align: center;
          padding: 10px 0;
        }
        .ls-empty-row {
          text-align: center;
          color: #64748b;
          font-size: 10px;
          padding: 10px 0 !important;
        }

        /* Legacy in-page header (مخفي) */
        .ls-head { display: none; }
        .ls-title { margin: 0; color: #f8fafc; font-size: 15px; font-weight: 800; }
        .ls-sub   { margin: 1px 0 0; color: #94a3b8; font-size: 10px; }

        /* === Stat cards (الإحصائيات العلوية) — تكبير ليلائم ملء الشاشة === */
        .ls-stats-grid {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 8px;
          margin: 0;
        }
        @media (max-width: 1400px) {
          .ls-stats-grid { grid-template-columns: repeat(5, minmax(0, 1fr)); }
        }
        @media (max-width: 720px) {
          .ls-stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        .ls-stat-card {
          background: linear-gradient(180deg, #131a33, #0f152a);
          border: 1px solid rgba(148,163,184,0.10);
          border-radius: 10px;
          padding: 9px 11px;
        }
        .ls-stat-top { display: flex; align-items: center; gap: 6px; }
        .ls-stat-icon {
          width: 24px; height: 24px; border-radius: 7px;
          display: inline-flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 12px;
        }
        .ls-stat-label { color: #94a3b8; font-size: 10px; }
        .ls-stat-value { color: #f8fafc; font-size: 16px; font-weight: 800; margin: 4px 0 2px; letter-spacing: -0.2px; }
        .ls-stat-trend { color: #10b981; font-size: 9.5px; font-weight: 700; }
        .ls-stat-muted { color: #64748b; font-weight: 500; margin-right: 3px; font-size: 9.5px; }

        /* === Rows === */
        .ls-row { display: grid; gap: 8px; margin: 0; }
        .ls-row-2 { grid-template-columns: 1fr 1fr; }
        .ls-row-3 { grid-template-columns: 2fr 1fr 1fr; }
        .ls-col-2 { grid-column: span 1; }

        /* === Cards — تكبير ليملأ المساحة === */
        .ls-card {
          background: linear-gradient(180deg, #131a33, #0f152a);
          border: 1px solid rgba(148,163,184,0.10);
          border-radius: 10px;
          padding: 8px 10px;
          max-height: 210px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .ls-card-head {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 5px; flex-wrap: wrap; gap: 5px;
          flex-shrink: 0;
        }
        .ls-card-head h3 { margin: 0; color: #f8fafc; font-size: 11.5px; font-weight: 700; }
        .ls-sub-title { color: #cbd5e1; font-size: 10.5px; margin: 0 0 4px; font-weight: 600; }

        /* === Inputs & buttons === */
        .ls-select, .ls-search, .ls-btn {
          background: rgba(15,23,42,0.7); color: #e2e8f0;
          border: 1px solid rgba(148,163,184,0.15);
          border-radius: 6px; padding: 4px 8px; font-size: 10px;
          font-family: inherit;
        }
        .ls-search { width: 100%; margin-bottom: 5px; flex-shrink: 0; }
        .ls-btn { cursor: pointer; }
        .ls-btn-primary { background: linear-gradient(135deg, #8b5cf6, #6d28d9); border: 0; color: #fff; font-weight: 700; }
        .ls-btn-ghost   { background: rgba(139,92,246,0.15); color: #c4b5fd; border-color: rgba(139,92,246,0.25); }

        /* === Donut + legend === */
        .ls-donut-wrap { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .ls-legend { list-style: none; padding: 0; margin: 0; flex: 1; min-width: 110px; }
        .ls-legend li { display: flex; align-items: center; gap: 5px; padding: 2px 0; font-size: 10.5px; color: #cbd5e1; }
        .ls-legend-label { flex: 1; }
        .ls-legend-value { color: #f8fafc; font-weight: 700; }
        .ls-dot { width: 7px; height: 7px; border-radius: 50%; display: inline-block; }

        /* === Activity list === */
        .ls-activity { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 5px; }
        .ls-activity li { display: flex; align-items: center; gap: 6px; }
        .ls-avatar {
          width: 24px; height: 24px; border-radius: 50%;
          background: linear-gradient(135deg, #8b5cf6, #ec4899);
          display: inline-flex; align-items: center; justify-content: center;
          color: #fff; font-weight: 800; font-size: 10.5px;
          flex-shrink: 0;
        }
        .ls-activity-body { display: flex; flex-direction: column; flex: 1; min-width: 0; }
        .ls-activity-body strong { color: #f8fafc; font-size: 10.5px; }
        .ls-activity-body span { color: #94a3b8; font-size: 9.5px; line-height: 1.3; }
        .ls-live {
          background: #ef4444; color: #fff;
          font-size: 8.5px; font-weight: 800; padding: 2px 5px; border-radius: 4px;
        }

        /* === Scrollable inner areas === */
        .ls-table-wrap {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          overflow-x: auto;
          scrollbar-width: thin;
          scrollbar-color: rgba(139,92,246,0.55) rgba(15,23,42,0.4);
        }
        .ls-table-wrap::-webkit-scrollbar { width: 6px; height: 6px; }
        .ls-table-wrap::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, rgba(139,92,246,0.65), rgba(99,102,241,0.65));
          border-radius: 6px;
        }
        .ls-table-wrap::-webkit-scrollbar-track {
          background: rgba(15,23,42,0.4); border-radius: 6px;
        }
        .ls-activity {
          flex: 1; min-height: 0; overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: rgba(139,92,246,0.55) transparent;
          padding-inline-end: 3px;
        }
        .ls-activity::-webkit-scrollbar { width: 5px; }
        .ls-activity::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, rgba(139,92,246,0.65), rgba(99,102,241,0.65));
          border-radius: 5px;
        }

        /* === Tables === */
        .ls-table { width: 100%; border-collapse: collapse; font-size: 10px; }
        .ls-table thead th { position: sticky; top: 0; background: linear-gradient(180deg, #131a33, #0f152a); z-index: 2; }
        .ls-table th { text-align: right; color: #94a3b8; font-weight: 600; padding: 4px 4px; border-bottom: 1px solid rgba(148,163,184,0.10); font-size: 9px; }
        .ls-table td { padding: 4px 4px; color: #e2e8f0; border-bottom: 1px solid rgba(148,163,184,0.06); font-size: 10px; }
        .ls-status {
          display: inline-block; padding: 1px 6px; border-radius: 999px;
          font-size: 9px; font-weight: 700;
        }
        .ls-status-ok { background: rgba(16,185,129,0.18); color: #34d399; }

        /* === Tabs === */
        .ls-tabs { display: flex; gap: 4px; flex-wrap: wrap; }
        .ls-tab {
          background: transparent; border: 0;
          color: #94a3b8; padding: 4px 9px; border-radius: 6px;
          font-size: 10.5px; cursor: pointer; font-family: inherit;
        }
        .ls-tab.active { background: rgba(139,92,246,0.18); color: #c4b5fd; }

        /* === KPI row === */
        .ls-kpi-row {
          display: grid; grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 6px; margin-bottom: 6px;
        }
        @media (max-width: 900px) {
          .ls-kpi-row { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        .ls-kpi {
          background: rgba(15,23,42,0.65);
          border: 1px solid rgba(148,163,184,0.10);
          border-radius: 8px; padding: 6px 8px;
        }
        .ls-kpi-label { color: #94a3b8; font-size: 9.5px; }
        .ls-kpi-value { color: #f8fafc; font-size: 13px; font-weight: 800; margin: 2px 0 1px; letter-spacing: -0.2px; }
        .ls-kpi-trend.up { color: #10b981; font-size: 9.5px; font-weight: 700; }

        /* === Reports card === */
        .ls-card.ls-card-full {
          max-height: none;
          overflow: visible;
          display: block;
          padding: 10px 12px;
        }

        /* === Responsive breakpoints === */
        @media (max-width: 1180px) {
          .ls-row-3 { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 820px) {
          .ls-row-2, .ls-row-3 { grid-template-columns: 1fr; }
          .ls-card { max-height: 280px; }
        }

        /* === رفع البطاقات للأعلى وإزالة الفراغات (Override للـ AdminLayout) === */
        .admin-page-shell-modern {
          padding: 6px 10px 8px !important;
          gap: 6px !important;
        }
        .admin-page-shell-modern .breadcrumbs {
          margin-bottom: 2px !important;
          font-size: 11px !important;
        }
        /* تصغير الـ topbar قليلاً لتوفير مساحة عمودية */
        .admin-topbar-modern {
          min-height: 42px !important;
          padding: 3px 12px !important;
        }
      `}</style>
    </AdminLayout>
  );
}
