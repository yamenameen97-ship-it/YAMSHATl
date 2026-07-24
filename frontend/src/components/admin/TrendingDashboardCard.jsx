// ======================================================================
// Yamshat — TrendingDashboardCard (v88.52)
// ----------------------------------------------------------------------
// صندوق تريند لحظي داخل AdminDashboard — يستبدل صندوق "إدارة البثوث".
// يُظهر أعلى 5 عناصر تريند + إشارة LIVE + رابط سريع لصفحة التريندات
// + مؤشر حارس السلامة (عدد محجوب/تحت مراجعة)
// ======================================================================
import { useEffect, useState, useCallback } from 'react';
import { getTrendingOverview } from '../../api/trending.js';
import { getSafetySnapshot } from '../../api/trendingSafety.js';
import socket from '../../api/socket.js';

export default function TrendingDashboardCard({ onOpen }) {
  const [data, setData] = useState({ global: [], by_country: {} });
  const [safety, setSafety] = useState({ stats: {} });
  const [pulse, setPulse] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [ov, sf] = await Promise.all([
        getTrendingOverview(),
        getSafetySnapshot().catch(() => ({ data: { stats: {} } })),
      ]);
      setData(ov.data || { global: [], by_country: {} });
      setSafety(sf.data || { stats: {} });
    } catch {
      setData({ global: [], by_country: {} });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, [load]);

  // نبض عند وصول إشارة trending:new
  useEffect(() => {
    const onNew = () => {
      setPulse(true);
      setTimeout(() => setPulse(false), 3000);
      load();
    };
    socket.on('trending:new', onNew);
    return () => socket.off('trending:new', onNew);
  }, [load]);

  const countries = Object.keys(data.by_country || {});

  return (
    <div
      className={`trending-dash-card ${pulse ? 'pulse' : ''}`}
      onClick={onOpen}
      role="button"
      tabIndex={0}
      aria-label="فتح صفحة إدارة التريندات"
    >
      <div className="tdc-head">
        <h3>🔥 التريندات الآن</h3>
        <span className="tdc-live">
          <span className="tdc-dot" /> LIVE
        </span>
      </div>

      {loading ? (
        <div className="tdc-empty">جارٍ التحميل…</div>
      ) : data.global.length === 0 ? (
        <div className="tdc-empty">لا توجد عناصر تريند حالياً</div>
      ) : (
        <>
          <div className="tdc-section-title">🌍 الأعلى عالمياً</div>
          <ul className="tdc-list">
            {data.global.slice(0, 5).map((item, idx) => (
              <li key={item.key} className="tdc-item">
                <span className="tdc-rank">#{idx + 1}</span>
                <span className="tdc-title" title={item.title}>
                  {item.kind === 'hashtag' ? '#' : '📝'} {item.title}
                </span>
                <span className={`tdc-score ${item.is_new ? 'new' : ''}`}>
                  {item.is_new ? '🚨' : ''} {Math.round(item.score).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>

          {countries.length > 0 && (
            <>
              <div className="tdc-section-title">🏳️ بارز في الدول</div>
              <div className="tdc-country-chips">
                {countries.slice(0, 6).map((code) => (
                  <span key={code} className="tdc-country-chip">
                    {code} · {data.by_country[code]?.[0]?.title?.slice(0, 20) || '—'}
                  </span>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* v88.52 — مؤشر حارس السلامة */}
      <div className="tdc-safety">
        <span className="tdc-safety-chip block">🚫 {safety?.stats?.auto_blocked ?? 0} محجوب آلياً</span>
        <span className="tdc-safety-chip review">⚠️ {safety?.stats?.flagged_review ?? 0} مراجعة</span>
        <span className="tdc-safety-chip manual">🔒 {safety?.stats?.manually_blocked ?? 0} يدوي</span>
      </div>

      <div className="tdc-footer">
        <span>عرض إدارة التريندات ›</span>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .trending-dash-card {
          background: linear-gradient(160deg,#fff7ed 0%, #fef3c7 40%, #fee2e2 100%);
          border: 1px solid #fecaca;
          border-radius: 14px;
          padding: 16px;
          cursor: pointer;
          transition: transform .2s, box-shadow .2s;
          display: flex; flex-direction: column; gap: 8px;
          direction: rtl; font-family: 'Noto Sans Arabic', sans-serif;
          position: relative; overflow: hidden;
        }
        .trending-dash-card:hover { transform: translateY(-2px); box-shadow: 0 12px 28px rgba(239,68,68,0.18); }
        .trending-dash-card.pulse { animation: cardPulse .8s ease-out 2; }
        @keyframes cardPulse { 0%{box-shadow: 0 0 0 0 rgba(239,68,68,0.6);} 100%{box-shadow: 0 0 0 24px rgba(239,68,68,0);} }
        .tdc-head { display:flex; justify-content:space-between; align-items:center; }
        .tdc-head h3 { margin:0; font-size:16px; font-weight:800; color:#7c2d12; }
        .tdc-live { display:inline-flex; align-items:center; gap:6px; background:#dc2626; color:#fff; font-size:11px; padding:3px 10px; border-radius:20px; font-weight:700; }
        .tdc-dot { width:6px; height:6px; border-radius:50%; background:#fff; animation: liveDot 1.2s infinite; }
        @keyframes liveDot { 0%,100%{opacity:1;} 50%{opacity:.3;} }
        .tdc-section-title { font-size:11px; font-weight:700; color:#9a3412; margin-top:6px; }
        .tdc-list { list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:4px; }
        .tdc-item { display:flex; align-items:center; gap:8px; padding:6px 8px; background:rgba(255,255,255,0.55); border-radius:8px; font-size:12px; }
        .tdc-rank { color:#c2410c; font-weight:800; min-width:26px; }
        .tdc-title { flex:1; color:#1e293b; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .tdc-score { font-weight:700; color:#7c2d12; font-size:11px; }
        .tdc-score.new { color:#dc2626; animation: newBlink 1s infinite; }
        @keyframes newBlink { 50%{opacity:.4;} }
        .tdc-country-chips { display:flex; flex-wrap:wrap; gap:4px; }
        .tdc-country-chip { background:#fff; border:1px solid #fed7aa; color:#9a3412; font-size:10px; padding:3px 8px; border-radius:20px; }
        .tdc-empty { text-align:center; color:#9a3412; padding:24px 8px; font-size:13px; }
        .tdc-safety { display:flex; gap:6px; flex-wrap:wrap; margin-top:6px; }
        .tdc-safety-chip { font-size:10px; padding:3px 8px; border-radius:20px; font-weight:700; }
        .tdc-safety-chip.block { background:#dc2626; color:#fff; }
        .tdc-safety-chip.review { background:#f59e0b; color:#fff; }
        .tdc-safety-chip.manual { background:#4338ca; color:#fff; }
        .tdc-footer { margin-top:auto; padding-top:8px; border-top:1px dashed #fecaca; color:#c2410c; font-size:12px; font-weight:600; text-align:end; }
      `}} />
    </div>
  );
}
