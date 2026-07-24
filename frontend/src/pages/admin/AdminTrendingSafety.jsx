// ======================================================================
// Yamshat — AdminTrendingSafety Panel (v88.52)
// ----------------------------------------------------------------------
// لوحة حارس السلامة داخل صفحة إدارة التريندات:
//   - إحصائيات لحظية (محجوب آلياً / تحت المراجعة / محجوب يدوياً / معتمد يدوياً)
//   - قائمة المحتوى المحجوب من الصعود (سبب + كلمات مطابقة)
//   - قائمة انتظار المراجعة (يقرر المدير: حجب / سماح)
//   - إدارة قائمة الكلمات المخصصة (blocklist)
//   - أداة فحص نص يدوي (تجريب مباشر للمصنّف)
// ======================================================================
import { useCallback, useEffect, useState } from 'react';
import {
  getSafetySnapshot,
  getBlockedFromTrending,
  getReviewQueue,
  addBlocklistWord,
  removeBlocklistWord,
  manualBlockKey,
  manualAllowKey,
  resetManualDecision,
  classifyText,
} from '../../api/trendingSafety.js';

const RISK_COLORS = {
  low:    { bg: '#dcfce7', color: '#166534', label: '🟢 آمن' },
  medium: { bg: '#fef9c3', color: '#854d0e', label: '🟡 مراجعة' },
  high:   { bg: '#fee2e2', color: '#991b1b', label: '🔴 خطر' },
  extreme:{ bg: '#000',    color: '#fef2f2', label: '⚫ إرهابي/تحريضي' },
};

function riskLevel(score) {
  if (score >= 90) return 'extreme';
  if (score >= 75) return 'high';
  if (score >= 45) return 'medium';
  return 'low';
}

export default function AdminTrendingSafety() {
  const [snapshot, setSnapshot] = useState(null);
  const [blocked, setBlocked] = useState([]);
  const [review, setReview] = useState([]);
  const [newWord, setNewWord] = useState('');
  const [testText, setTestText] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('blocked');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, b, r] = await Promise.all([
        getSafetySnapshot(),
        getBlockedFromTrending(100),
        getReviewQueue(100),
      ]);
      setSnapshot(s.data || null);
      setBlocked(b.data?.items || []);
      setReview(r.data?.items || []);
    } catch (e) {
      console.error('safety load error', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 20_000);
    return () => clearInterval(t);
  }, [load]);

  const handleAddWord = async () => {
    if (!newWord.trim()) return;
    await addBlocklistWord(newWord.trim());
    setNewWord('');
    await load();
  };

  const handleRemoveWord = async (word) => {
    await removeBlocklistWord(word);
    await load();
  };

  const handleBlock = async (key) => {
    const reason = prompt('سبب الحجب (اختياري):') || '';
    await manualBlockKey(key, reason);
    await load();
  };

  const handleAllow = async (key) => {
    const reason = prompt('سبب السماح (اختياري):') || '';
    await manualAllowKey(key, reason);
    await load();
  };

  const handleReset = async (key) => {
    await resetManualDecision(key);
    await load();
  };

  const handleClassify = async () => {
    if (!testText.trim()) return;
    const { data } = await classifyText(testText.trim());
    setTestResult(data);
  };

  const stats = snapshot?.stats || {};

  return (
    <div className="safety-panel" dir="rtl">
      <header className="sp-head">
        <div>
          <h2>🛡️ حارس سلامة التريندات</h2>
          <p className="sp-sub">
            يمنع تلقائياً صعود المحتوى المحرِّض على العنف/الكراهية/العداء/التعصب/الطائفية/التوجه السياسي أو الديني أو الإرهاب —
            ويعرض للمدير العام كل قرار للاعتماد أو المراجعة.
          </p>
        </div>
        <button className="sp-refresh" onClick={load} disabled={loading}>
          {loading ? '⏳' : '🔄'} تحديث الآن
        </button>
      </header>

      {/* بطاقات الإحصائيات */}
      <section className="sp-stats">
        <div className="sp-stat sp-stat-block">
          <span className="sp-num">{stats.auto_blocked ?? 0}</span>
          <span className="sp-lbl">🚫 حُجب آلياً من الصعود</span>
        </div>
        <div className="sp-stat sp-stat-review">
          <span className="sp-num">{stats.flagged_review ?? 0}</span>
          <span className="sp-lbl">⚠️ تحت مراجعة الأدمن</span>
        </div>
        <div className="sp-stat sp-stat-manual">
          <span className="sp-num">{stats.manually_blocked ?? 0}</span>
          <span className="sp-lbl">🔒 حجب يدوي</span>
        </div>
        <div className="sp-stat sp-stat-allow">
          <span className="sp-num">{stats.manually_allowed ?? 0}</span>
          <span className="sp-lbl">✅ اعتماد يدوي</span>
        </div>
      </section>

      {/* تبويبات */}
      <nav className="sp-tabs">
        {[
          { id: 'blocked', label: `🚫 المحتوى المحجوب (${blocked.length})` },
          { id: 'review',  label: `⚠️ قائمة المراجعة (${review.length})` },
          { id: 'blocklist', label: '🔑 كلمات ممنوعة مخصصة' },
          { id: 'categories', label: '📋 الفئات المصنّفة' },
          { id: 'test',    label: '🧪 اختبار نص' },
        ].map((t) => (
          <button
            key={t.id}
            className={`sp-tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* المحتوى حسب التبويب */}
      {tab === 'blocked' && (
        <section className="sp-list">
          {blocked.length === 0 ? (
            <div className="sp-empty">✅ لا يوجد محتوى محجوب حالياً</div>
          ) : blocked.map((e, i) => (
            <SafetyRow key={`${e.key}-${i}`} entry={e} onAllow={handleAllow} onReset={handleReset} />
          ))}
        </section>
      )}

      {tab === 'review' && (
        <section className="sp-list">
          {review.length === 0 ? (
            <div className="sp-empty">✨ لا يوجد محتوى بانتظار المراجعة</div>
          ) : review.map((e, i) => (
            <SafetyRow
              key={`${e.key}-${i}`}
              entry={e}
              showBlock
              onBlock={handleBlock}
              onAllow={handleAllow}
            />
          ))}
        </section>
      )}

      {tab === 'blocklist' && (
        <section className="sp-blocklist">
          <div className="sp-add-row">
            <input
              type="text"
              value={newWord}
              placeholder="أضف كلمة مفتاحية (أي تريند يحتوي عليها سيُمنع من الصعود)"
              onChange={(e) => setNewWord(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddWord()}
            />
            <button onClick={handleAddWord}>➕ إضافة</button>
          </div>
          <div className="sp-chips">
            {(snapshot?.custom_blocklist || []).length === 0 ? (
              <div className="sp-empty">لا توجد كلمات مخصصة بعد</div>
            ) : (snapshot?.custom_blocklist || []).map((w) => (
              <span key={w} className="sp-chip">
                {w}
                <button onClick={() => handleRemoveWord(w)} title="إزالة">✖</button>
              </span>
            ))}
          </div>
        </section>
      )}

      {tab === 'categories' && (
        <section className="sp-categories">
          {(snapshot?.categories || []).map((c) => (
            <div key={c.key} className="sp-cat">
              <div className="sp-cat-label">{c.label}</div>
              <div className="sp-cat-meta">
                <span>وزن الخطر: <b>{c.weight}</b></span>
                <span>كلمات مفتاحية: <b>{c.count_words}</b></span>
              </div>
            </div>
          ))}
          <div className="sp-thresholds">
            <div>عتبة الحجب الآلي: <b>{snapshot?.thresholds?.auto_block ?? 75}</b></div>
            <div>عتبة المراجعة: <b>{snapshot?.thresholds?.review ?? 45}</b></div>
          </div>
        </section>
      )}

      {tab === 'test' && (
        <section className="sp-test">
          <textarea
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            placeholder="ألصق نص تريند أو منشور هنا لتصنيفه فوراً…"
            rows={4}
          />
          <button className="sp-btn-primary" onClick={handleClassify}>🔍 صنّف النص</button>
          {testResult && (
            <div className={`sp-test-result risk-${riskLevel(testResult.risk_score)}`}>
              <div className="sp-tr-head">
                <b>القرار: {testResult.action === 'block' ? '🚫 حجب' : testResult.action === 'review' ? '⚠️ مراجعة' : '✅ سماح'}</b>
                <span>درجة الخطر: <b>{testResult.risk_score}/100</b></span>
              </div>
              {testResult.labels?.length > 0 && (
                <div className="sp-tr-labels">
                  {testResult.labels.map((l) => <span key={l} className="sp-tr-label">{l}</span>)}
                </div>
              )}
              {testResult.matched_words?.length > 0 && (
                <div className="sp-tr-words">
                  كلمات مطابقة: {testResult.matched_words.join(' · ')}
                </div>
              )}
            </div>
          )}
        </section>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .safety-panel { background:#fff; border:1px solid #e2e8f0; border-radius:14px; padding:20px; margin-top:20px; font-family:'Noto Sans Arabic',sans-serif; }
        .sp-head { display:flex; justify-content:space-between; align-items:flex-start; gap:16px; margin-bottom:16px; flex-wrap:wrap; }
        .sp-head h2 { margin:0; font-size:20px; color:#0f172a; font-weight:800; }
        .sp-sub { color:#64748b; font-size:13px; margin-top:6px; max-width:720px; line-height:1.7; }
        .sp-refresh { background:linear-gradient(135deg,#0ea5e9,#6366f1); color:#fff; border:none; border-radius:10px; padding:8px 14px; font-weight:700; cursor:pointer; }

        .sp-stats { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:12px; margin-bottom:16px; }
        .sp-stat { background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:14px; display:flex; flex-direction:column; gap:4px; }
        .sp-num { font-size:28px; font-weight:900; color:#0f172a; }
        .sp-lbl { font-size:12px; color:#64748b; }
        .sp-stat-block  { border-color:#fecaca; background:linear-gradient(180deg,#fef2f2,#fff); }
        .sp-stat-block  .sp-num { color:#dc2626; }
        .sp-stat-review { border-color:#fde68a; background:linear-gradient(180deg,#fefce8,#fff); }
        .sp-stat-review .sp-num { color:#d97706; }
        .sp-stat-manual { border-color:#c7d2fe; background:linear-gradient(180deg,#eef2ff,#fff); }
        .sp-stat-manual .sp-num { color:#4338ca; }
        .sp-stat-allow  { border-color:#bbf7d0; background:linear-gradient(180deg,#f0fdf4,#fff); }
        .sp-stat-allow  .sp-num { color:#16a34a; }

        .sp-tabs { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:14px; }
        .sp-tab { padding:8px 14px; background:#f1f5f9; border:1px solid #e2e8f0; border-radius:10px; cursor:pointer; font-size:13px; color:#475569; font-weight:600; }
        .sp-tab.active { background:#0f172a; color:#fff; border-color:#0f172a; }

        .sp-list { display:flex; flex-direction:column; gap:10px; }
        .sp-empty { padding:40px; text-align:center; color:#94a3b8; background:#f8fafc; border:1px dashed #cbd5e1; border-radius:12px; }

        .sp-row { background:#fff; border:1px solid #e2e8f0; border-radius:12px; padding:14px; display:grid; gap:8px; }
        .sp-row.risk-high    { border-color:#fca5a5; background:linear-gradient(180deg,#fef2f2,#fff); }
        .sp-row.risk-extreme { border-color:#0f172a; background:linear-gradient(180deg,#1e293b,#0f172a); color:#fee2e2; }
        .sp-row.risk-medium  { border-color:#fde68a; background:linear-gradient(180deg,#fefce8,#fff); }
        .sp-row-head { display:flex; justify-content:space-between; gap:10px; flex-wrap:wrap; align-items:center; }
        .sp-row-title { font-weight:700; font-size:14px; max-width:70%; }
        .sp-row-score { background:#fee2e2; color:#991b1b; padding:4px 10px; border-radius:20px; font-size:12px; font-weight:700; }
        .sp-row.risk-extreme .sp-row-score { background:#7f1d1d; color:#fff; }
        .sp-row-labels { display:flex; flex-wrap:wrap; gap:6px; }
        .sp-lbl-chip { background:#fee2e2; color:#991b1b; font-size:11px; padding:3px 10px; border-radius:20px; font-weight:600; }
        .sp-row.risk-extreme .sp-lbl-chip { background:#7f1d1d; color:#fff; }
        .sp-row-meta { font-size:12px; color:#64748b; display:flex; gap:12px; flex-wrap:wrap; }
        .sp-row.risk-extreme .sp-row-meta { color:#fecaca; }
        .sp-row-words { font-size:12px; color:#7c2d12; background:#fef3c7; padding:6px 10px; border-radius:8px; direction:ltr; text-align:left; }
        .sp-row.risk-extreme .sp-row-words { background:#450a0a; color:#fecaca; }
        .sp-row-actions { display:flex; gap:6px; flex-wrap:wrap; }
        .sp-btn { padding:6px 12px; font-size:12px; border-radius:8px; cursor:pointer; border:1px solid transparent; font-weight:600; }
        .sp-btn-block { background:#dc2626; color:#fff; }
        .sp-btn-allow { background:#16a34a; color:#fff; }
        .sp-btn-reset { background:#f1f5f9; color:#475569; border-color:#cbd5e1; }

        .sp-blocklist { display:flex; flex-direction:column; gap:14px; }
        .sp-add-row { display:flex; gap:8px; }
        .sp-add-row input { flex:1; padding:10px 12px; border:1px solid #cbd5e1; border-radius:10px; font-size:13px; }
        .sp-add-row button { padding:10px 16px; background:#0f172a; color:#fff; border:none; border-radius:10px; cursor:pointer; font-weight:700; }
        .sp-chips { display:flex; flex-wrap:wrap; gap:6px; }
        .sp-chip { background:#fee2e2; color:#991b1b; padding:6px 12px; border-radius:20px; font-size:12px; display:inline-flex; align-items:center; gap:6px; }
        .sp-chip button { background:transparent; border:none; color:#7f1d1d; cursor:pointer; font-weight:800; }

        .sp-categories { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:10px; }
        .sp-cat { background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:12px; }
        .sp-cat-label { font-weight:700; color:#0f172a; font-size:14px; margin-bottom:6px; }
        .sp-cat-meta { display:flex; gap:12px; font-size:12px; color:#64748b; flex-wrap:wrap; }
        .sp-thresholds { grid-column:1/-1; display:flex; gap:20px; padding:12px 16px; background:#eef2ff; border:1px solid #c7d2fe; border-radius:10px; color:#3730a3; font-size:13px; }

        .sp-test { display:flex; flex-direction:column; gap:10px; }
        .sp-test textarea { width:100%; padding:12px; border:1px solid #cbd5e1; border-radius:10px; font-family:inherit; font-size:14px; resize:vertical; }
        .sp-btn-primary { align-self:flex-start; background:linear-gradient(135deg,#8b5cf6,#ec4899); color:#fff; border:none; border-radius:10px; padding:10px 18px; font-weight:700; cursor:pointer; }
        .sp-test-result { padding:14px; border-radius:12px; }
        .sp-test-result.risk-low     { background:#dcfce7; border:1px solid #86efac; color:#166534; }
        .sp-test-result.risk-medium  { background:#fef9c3; border:1px solid #fde68a; color:#854d0e; }
        .sp-test-result.risk-high    { background:#fee2e2; border:1px solid #fca5a5; color:#991b1b; }
        .sp-test-result.risk-extreme { background:#0f172a; border:1px solid #7f1d1d; color:#fee2e2; }
        .sp-tr-head { display:flex; justify-content:space-between; margin-bottom:8px; }
        .sp-tr-labels { display:flex; gap:6px; flex-wrap:wrap; margin:6px 0; }
        .sp-tr-label { background:rgba(255,255,255,0.6); padding:3px 10px; border-radius:20px; font-size:12px; font-weight:600; }
        .sp-tr-words { font-size:12px; opacity:.9; direction:ltr; text-align:left; }
      `}} />
    </div>
  );
}

function SafetyRow({ entry, showBlock, onBlock, onAllow, onReset }) {
  const level = riskLevel(entry.risk_score || 0);
  return (
    <div className={`sp-row risk-${level}`}>
      <div className="sp-row-head">
        <div className="sp-row-title">📝 {entry.title || entry.key}</div>
        <div className="sp-row-score">درجة الخطر: {entry.risk_score}/100</div>
      </div>
      {entry.labels?.length > 0 && (
        <div className="sp-row-labels">
          {entry.labels.map((l) => <span key={l} className="sp-lbl-chip">{l}</span>)}
        </div>
      )}
      <div className="sp-row-meta">
        <span>🔑 {entry.key}</span>
        <span>👮 القرار: {entry.outcome}</span>
        <span>🕒 {entry.timestamp?.slice(0, 19).replace('T', ' ')}</span>
        {entry.actor && <span>⚙ {entry.actor}</span>}
      </div>
      {entry.matched_words?.length > 0 && (
        <div className="sp-row-words">كلمات مطابقة: {entry.matched_words.join(' · ')}</div>
      )}
      <div className="sp-row-actions">
        {showBlock && onBlock && (
          <button className="sp-btn sp-btn-block" onClick={() => onBlock(entry.key)}>🚫 حجب من الصعود</button>
        )}
        {onAllow && (
          <button className="sp-btn sp-btn-allow" onClick={() => onAllow(entry.key)}>✅ سماح استثنائي</button>
        )}
        {onReset && (
          <button className="sp-btn sp-btn-reset" onClick={() => onReset(entry.key)}>↺ إعادة تعيين</button>
        )}
      </div>
    </div>
  );
}
