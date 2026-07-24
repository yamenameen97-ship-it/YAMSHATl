// ======================================================================
// Yamshat — AdminTrending Page (v88.51)
// ----------------------------------------------------------------------
// صفحة إدارة التريندات الكاملة.
// تحل محل صفحة "إدارة البثوث" المُلغاة.
// - تبويبات: عالمي / دولة / إشارات لحظية
// - إشعار toast فوري عند وصول trending:new من Socket.IO
// - إجراءات: تثبيت / إخفاء / فتح المنشور
// ======================================================================
import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import socket from '../../api/socket.js';
import {
  getGlobalTrending,
  getCountryTrending,
  getTrendingSignals,
  refreshTrending,
  pinTrending,
  hideTrending,
  unpinTrending,
  unhideTrending,
} from '../../api/trending.js';
// v88.52 — لوحة حارس السلامة
import AdminTrendingSafety from './AdminTrendingSafety.jsx';
import { manualBlockKey } from '../../api/trendingSafety.js';

const COUNTRIES = [
  { code: 'SA', name: 'السعودية', flag: '🇸🇦' },
  { code: 'EG', name: 'مصر',       flag: '🇪🇬' },
  { code: 'AE', name: 'الإمارات',  flag: '🇦🇪' },
  { code: 'MA', name: 'المغرب',    flag: '🇲🇦' },
  { code: 'DZ', name: 'الجزائر',   flag: '🇩🇿' },
  { code: 'IQ', name: 'العراق',    flag: '🇮🇶' },
  { code: 'JO', name: 'الأردن',    flag: '🇯🇴' },
  { code: 'KW', name: 'الكويت',    flag: '🇰🇼' },
  { code: 'QA', name: 'قطر',       flag: '🇶🇦' },
  { code: 'TN', name: 'تونس',      flag: '🇹🇳' },
];

const TABS = [
  { id: 'global',   label: '🌍 التريند العالمي' },
  { id: 'country',  label: '🏳️ تريند الدول' },
  { id: 'signals',  label: '⚡ الإشارات اللحظية' },
  { id: 'safety',   label: '🛡️ حارس السلامة' },
];

function TrendBadge({ item }) {
  const strong = item.score >= (item.threshold || 500) * 2;
  return (
    <span className={`trend-badge ${strong ? 'trend-badge-hot' : ''} ${item.is_new ? 'trend-badge-new' : ''}`}>
      {item.is_new ? '🚨 جديد' : strong ? '🔥 ساخن' : '📈 تريند'}
    </span>
  );
}

function TrendCard({ item, onPin, onHide, onOpen, onSafetyBlock }) {
  // v88.52 — إبراز حالة السلامة على كل بطاقة تريند
  const safetyAction = item.safety_action || 'allow';
  const risky = safetyAction === 'block' || safetyAction === 'review';
  const extreme = (item.safety_risk || 0) >= 90;
  return (
    <div className={`trend-card ${risky ? 'trend-card-risky' : ''} ${extreme ? 'trend-card-extreme' : ''}`}>
      <div className="trend-card-head">
        <div className="trend-title">
          {item.kind === 'hashtag' ? '#' : '📝'} <b>{item.title}</b>
        </div>
        <TrendBadge item={item} />
      </div>

      {/* v88.52 — ملصقات السلامة */}
      {(item.safety_labels && item.safety_labels.length > 0) && (
        <div className="trend-safety-labels">
          {item.safety_labels.map((l) => (
            <span key={l} className="trend-safety-label">{l}</span>
          ))}
          <span className="trend-safety-risk">خطر: {item.safety_risk}/100</span>
        </div>
      )}

      <div className="trend-meta">
        {item.author && <span>👤 {item.author}</span>}
        {item.country && <span>🌐 {item.country}</span>}
        <span>❤ {(item.likes || 0).toLocaleString()}</span>
        <span>💬 {(item.comments || 0).toLocaleString()}</span>
        <span>🔁 {(item.shares || 0).toLocaleString()}</span>
      </div>

      <div className="trend-score-row">
        <div className="score-bar">
          <div
            className="score-fill"
            style={{ width: `${Math.min(100, (item.score / ((item.threshold || 500) * 3)) * 100)}%` }}
          />
        </div>
        <div className="score-value">{item.score.toLocaleString()} نقطة</div>
      </div>

      <div className="trend-actions">
        {item.post_id && (
          <button className="trend-btn open" onClick={() => onOpen(item)}>فتح المنشور</button>
        )}
        <button className="trend-btn pin" onClick={() => onPin(item.key)}>📌 تثبيت</button>
        <button className="trend-btn hide" onClick={() => onHide(item.key)}>🚫 إخفاء</button>
        {onSafetyBlock && (
          <button className="trend-btn stop-rise" onClick={() => onSafetyBlock(item)} title="منع الصعود نهائياً">
            🛑 إيقاف الصعود
          </button>
        )}
      </div>
    </div>
  );
}

export default function AdminTrending() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('global');
  const [country, setCountry] = useState('SA');
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [signals, setSignals] = useState([]);
  const [meta, setMeta] = useState({ threshold: 500, window_hours: 6 });
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState(null);

  // ── تحميل حسب التبويب ──────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === 'global') {
        const { data } = await getGlobalTrending(30);
        setItems(data?.items || []);
        setMeta({ threshold: data?.threshold, window_hours: data?.window_hours });
      } else if (tab === 'country') {
        const { data } = await getCountryTrending(country, 30);
        setItems(data?.items || []);
        setMeta({ threshold: data?.threshold, window_hours: data?.window_hours });
      } else if (tab === 'signals') {
        const { data } = await getTrendingSignals(30);
        setSignals(data?.items || []);
      }
    } catch (err) {
      console.error('trending load error', err);
    } finally {
      setLoading(false);
    }
  }, [tab, country]);

  useEffect(() => { load(); }, [load]);

  // ── إعادة تحميل دورية كل 30 ثانية ─────────────────────────────────
  useEffect(() => {
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, [load]);

  // ── الاستماع لحدث trending:new من Socket.IO ───────────────────────
  useEffect(() => {
    const onTrendingNew = (payload) => {
      setToast({
        title: payload.scope === 'global'
          ? '🚨 تريند عالمي جديد!'
          : `🚨 تريند جديد في ${payload.country}`,
        body: payload.title,
        score: payload.score,
      });
      // إخفاء تلقائي بعد 6 ثواني
      setTimeout(() => setToast(null), 6000);
      // إعادة تحميل الإشارات
      load();
    };

    socket.on('trending:new', onTrendingNew);
    if (!socket.connected) socket.connect();
    socket.emit('join_room', { room: 'admin_dashboard' });

    return () => {
      socket.off('trending:new', onTrendingNew);
    };
  }, [load]);

  // ── الإجراءات ─────────────────────────────────────────────────────
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshTrending(tab === 'country' ? 'country' : 'global', tab === 'country' ? country : null);
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  const handlePin  = async (key) => { await pinTrending(key);  await load(); };
  const handleHide = async (key) => { await hideTrending(key); await load(); };
  const handleOpen = (item) => {
    if (item.post_id) navigate(`/admin/posts?focus=${item.post_id}`);
  };

  // v88.52 — إيقاف صعود محتوى نهائياً من داخل بطاقة التريند
  const handleSafetyBlock = async (item) => {
    const ok = window.confirm(
      `هل تريد إيقاف صعود هذا المحتوى نهائياً؟\n\n“${item.title}”\n\nسيُحجب من التريند مهما تجمّع من تفاعلات.`
    );
    if (!ok) return;
    const reason = window.prompt('سبب الحجب (اختياري):') || '';
    await manualBlockKey(item.key, reason);
    await load();
  };

  const list = tab === 'signals' ? signals : items;
  const totalNew = useMemo(() => list.filter((i) => i.is_new).length, [list]);

  return (
    <AdminLayout>
      <div className="admin-trending" dir="rtl">
        {/* شريط علوي */}
        <header className="tr-header">
          <div>
            <h1>🔥 إدارة التريندات</h1>
            <p className="tr-sub">
              حسّاس لحظي لكل خبر يبلغ عتبة التريند — عالمياً وحسب الدولة.
              النافذة الزمنية: <b>{meta.window_hours || 6}</b> ساعات • العتبة:
              <b> {meta.threshold?.toLocaleString?.() || '—'} </b>
              نقطة.
            </p>
          </div>
          <div className="tr-header-actions">
            <span className="tr-live-dot" /> يتم التحديث كل 30 ث
            <button className="tr-refresh" onClick={handleRefresh} disabled={refreshing}>
              {refreshing ? 'جارٍ الحساب…' : '🔄 إعادة الحساب الآن'}
            </button>
          </div>
        </header>

        {/* شرح الخوارزمية */}
        <details className="tr-algo">
          <summary>ℹ️ كيف يُحدد الخبر أنه تريند وكيف يُقاس؟</summary>
          <div className="tr-algo-body">
            <p>يُحسب لكل منشور <b>درجة الترند</b> في نافذة {meta.window_hours || 6} ساعات:</p>
            <code>
              score = 0.35·L + 0.25·C + 0.20·S + 0.15·V + 0.05·Sv<br/>
              velocity = (تفاعلات الساعة الأخيرة + 1) / (تفاعلات النافذة + 1)<br/>
              <b>درجة_الترند = الدرجة × (1 + السرعة)</b>
            </code>
            <ul>
              <li>عتبة التريند العالمي: <b>500 نقطة</b></li>
              <li>عتبة تريند الدولة: <b>120 نقطة</b></li>
              <li>عند اجتياز العتبة أول مرة ← إشارة فورية عبر الاتصال المباشر + إشعار للمدير + إشعار لصاحب المنشور 🔥.</li>
            </ul>
          </div>
        </details>

        {/* التبويبات */}
        <nav className="tr-tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`tr-tab ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
              {t.id === 'signals' && totalNew > 0 && <em className="tr-count-badge">{totalNew}</em>}
            </button>
          ))}
        </nav>

        {/* منتقي الدولة */}
        {tab === 'country' && (
          <div className="tr-countries">
            {COUNTRIES.map((c) => (
              <button
                key={c.code}
                className={`tr-country ${country === c.code ? 'active' : ''}`}
                onClick={() => setCountry(c.code)}
              >
                <span className="tr-flag">{c.flag}</span> {c.name}
              </button>
            ))}
          </div>
        )}

        {/* v88.52 — لوحة حارس السلامة */}
        {tab === 'safety' ? (
          <AdminTrendingSafety />
        ) : (
          <section className="tr-grid">
            {loading ? (
              <div className="tr-empty">جارٍ تحميل التريندات…</div>
            ) : list.length === 0 ? (
              <div className="tr-empty">لا توجد عناصر تريند حالياً — لم يتجاوز أي محتوى العتبة.</div>
            ) : (
              list.map((item) => (
                <TrendCard
                  key={item.key}
                  item={item}
                  onPin={handlePin}
                  onHide={handleHide}
                  onOpen={handleOpen}
                  onSafetyBlock={handleSafetyBlock}
                />
              ))
            )}
          </section>
        )}

        {/* Toast لإشارة trending:new */}
        {toast && (
          <div className="tr-toast" role="alert">
            <div className="tr-toast-title">{toast.title}</div>
            <div className="tr-toast-body">{toast.body}</div>
            <div className="tr-toast-score">{toast.score?.toLocaleString?.()} نقطة</div>
          </div>
        )}

        <style dangerouslySetInnerHTML={{ __html: `
          .admin-trending { padding: 24px; background: #f8fafc; min-height: 100vh; font-family: 'Noto Sans Arabic', sans-serif; }
          .tr-header { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; }
          .tr-header h1 { font-size: 26px; font-weight: 800; color: #0f172a; margin: 0; }
          .tr-sub { color: #64748b; margin-top: 6px; font-size: 13px; }
          .tr-header-actions { display: flex; align-items: center; gap: 12px; color: #64748b; font-size: 13px; }
          .tr-live-dot { width: 10px; height: 10px; border-radius: 50%; background: #ef4444; display: inline-block; box-shadow: 0 0 0 4px rgba(239,68,68,0.18); animation: livePulse 1.6s infinite; }
          @keyframes livePulse { 0% { box-shadow: 0 0 0 0 rgba(239,68,68,0.6);} 70% { box-shadow: 0 0 0 10px rgba(239,68,68,0);} 100%{box-shadow: 0 0 0 0 rgba(239,68,68,0);} }
          .tr-refresh { padding: 8px 14px; background: linear-gradient(135deg,#8b5cf6,#ec4899); color: #fff; border: none; border-radius: 10px; cursor: pointer; font-weight: 700; }
          .tr-refresh:disabled { opacity: .6; cursor: default; }

          .tr-algo { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 10px 16px; margin-bottom: 16px; }
          .tr-algo summary { cursor: pointer; font-weight: 700; color: #7c3aed; }
          .tr-algo-body { margin-top: 10px; color: #334155; font-size: 13px; line-height: 1.9; }
          .tr-algo-body code { display: block; background: #0f172a; color: #a5f3fc; padding: 12px; border-radius: 8px; margin: 8px 0; font-family: 'JetBrains Mono', monospace; direction: ltr; text-align: left; }

          .tr-tabs { display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
          .tr-tab { padding: 10px 16px; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; cursor: pointer; font-weight: 600; color: #64748b; position: relative; }
          .tr-tab.active { background: #0f172a; color: #fff; border-color: #0f172a; }
          .tr-count-badge { position: absolute; top: -6px; left: -6px; background: #ef4444; color: #fff; font-style: normal; font-size: 10px; padding: 2px 6px; border-radius: 20px; }

          .tr-countries { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 16px; }
          .tr-country { padding: 6px 12px; background: #fff; border: 1px solid #e2e8f0; border-radius: 20px; cursor: pointer; font-size: 12px; }
          .tr-country.active { background: #8b5cf6; color: #fff; border-color: #8b5cf6; }
          .tr-flag { font-size: 14px; margin-inline-end: 4px; }

          .tr-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 14px; }
          .tr-empty { grid-column: 1/-1; text-align: center; padding: 60px 20px; color: #94a3b8; background: #fff; border: 1px dashed #cbd5e1; border-radius: 12px; }

          .trend-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px; display: flex; flex-direction: column; gap: 10px; transition: box-shadow .2s, transform .2s; }
          .trend-card:hover { box-shadow: 0 8px 24px rgba(15,23,42,0.08); transform: translateY(-2px); }
          .trend-card-risky { border-color:#fca5a5; background:linear-gradient(180deg,#fef2f2,#fff); }
          .trend-card-extreme { border-color:#7f1d1d; background:linear-gradient(180deg,#450a0a,#1e293b); color:#fee2e2; }
          .trend-card-extreme .trend-title, .trend-card-extreme .score-value, .trend-card-extreme .trend-meta { color:#fee2e2; }
          .trend-safety-labels { display:flex; flex-wrap:wrap; gap:6px; align-items:center; }
          .trend-safety-label { background:#fee2e2; color:#991b1b; font-size:11px; padding:3px 10px; border-radius:20px; font-weight:700; }
          .trend-card-extreme .trend-safety-label { background:#7f1d1d; color:#fff; }
          .trend-safety-risk { margin-inline-start:auto; font-size:11px; color:#dc2626; font-weight:800; }
          .trend-card-extreme .trend-safety-risk { color:#fca5a5; }
          .trend-btn.stop-rise { background:#dc2626; color:#fff; border-color:#dc2626; font-weight:700; }
          .trend-card-head { display: flex; justify-content: space-between; align-items: center; }
          .trend-title { font-size: 14px; color: #0f172a; max-width: 70%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
          .trend-badge { font-size: 11px; padding: 4px 10px; border-radius: 20px; background: #ede9fe; color: #7c3aed; font-weight: 700; }
          .trend-badge-hot { background: #fee2e2; color: #dc2626; }
          .trend-badge-new { background: linear-gradient(135deg,#f59e0b,#ef4444); color: #fff; animation: newPulse 1.6s infinite; }
          @keyframes newPulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.06); } }

          .trend-meta { display: flex; flex-wrap: wrap; gap: 10px; font-size: 12px; color: #64748b; }
          .trend-score-row { display: flex; align-items: center; gap: 10px; }
          .score-bar { flex: 1; height: 6px; background: #e2e8f0; border-radius: 4px; overflow: hidden; }
          .score-fill { height: 100%; background: linear-gradient(90deg,#8b5cf6,#ec4899,#ef4444); transition: width .5s; }
          .score-value { font-size: 12px; color: #7c3aed; font-weight: 700; }

          .trend-actions { display: flex; gap: 6px; flex-wrap: wrap; }
          .trend-btn { padding: 6px 12px; font-size: 12px; border: 1px solid #e2e8f0; border-radius: 8px; cursor: pointer; background: #f8fafc; color: #334155; }
          .trend-btn.open { background: #0f172a; color: #fff; border-color: #0f172a; }
          .trend-btn.pin  { background: #fef3c7; color: #92400e; border-color: #fde68a; }
          .trend-btn.hide { background: #fee2e2; color: #991b1b; border-color: #fecaca; }

          .tr-toast { position: fixed; bottom: 24px; inset-inline-start: 24px; background: linear-gradient(135deg,#ef4444,#f59e0b); color: #fff; padding: 14px 20px; border-radius: 14px; box-shadow: 0 20px 40px rgba(239,68,68,0.35); z-index: 9999; min-width: 280px; animation: toastIn .35s ease-out; }
          .tr-toast-title { font-weight: 800; font-size: 14px; }
          .tr-toast-body { font-size: 13px; opacity: .95; margin-top: 4px; }
          .tr-toast-score { font-size: 12px; margin-top: 6px; opacity: .85; }
          @keyframes toastIn { from { transform: translateY(20px); opacity: 0; } to { transform: none; opacity: 1; } }
        `}} />
      </div>
    </AdminLayout>
  );
}
