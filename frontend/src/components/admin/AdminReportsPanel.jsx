/**
 * لوحة إدارة البلاغات في لوحة الأدمن.
 *
 * تعرض:
 *  - شريط فلاتر (الحالة، الأولوية، نوع الكيان، السبب، بحث)
 *  - قائمة البلاغات مع snapshot للمحتوى
 *  - نافذة تفاصيل (تاريخ + إجراءات: إغلاق/حذف/تحذير/كتم/تعليق/حظر/تصعيد)
 *  - إحصائيات سريعة في الأعلى
 *
 * يعتمد على endpoints:
 *   GET   /api/reports/admin
 *   GET   /api/reports/admin/stats
 *   GET   /api/reports/admin/:id
 *   PATCH /api/reports/admin/:id
 *   POST  /api/reports/admin/:id/action
 */
import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { API_BASE } from '../../api/config.js';

const STATUS_LABELS = {
  all: 'الكل',
  pending: 'قيد المراجعة',
  reviewing: 'تحت المراجعة',
  resolved: 'تمت المعالجة',
  dismissed: 'مغلق',
  escalated: 'مُصعّد',
};

const PRIORITY_BADGE = {
  urgent: { label: 'عاجل', bg: '#dc2626', color: '#fff' },
  high:   { label: 'مرتفع', bg: '#ea580c', color: '#fff' },
  normal: { label: 'عادي', bg: '#0891b2', color: '#fff' },
  low:    { label: 'منخفض', bg: '#475569', color: '#fff' },
};

const TARGET_TYPE_LABELS = {
  post: 'منشور',
  reel: 'ريلز',
  story: 'ستوري',
  comment: 'تعليق',
  reel_comment: 'تعليق ريلز',
  message: 'رسالة شات',
  group_message: 'رسالة مجموعة',
  user: 'حساب',
  group: 'مجموعة',
  voice_room: 'غرفة صوتية',
};

const ACTIONS = [
  { id: 'dismiss',        label: 'إغلاق البلاغ',     icon: '✖️' },
  { id: 'remove_content', label: 'حذف المحتوى',      icon: '🗑️' },
  { id: 'warn_user',      label: 'تحذير المستخدم',   icon: '⚠️' },
  { id: 'mute_user',      label: 'كتم 24 ساعة',       icon: '🔇' },
  { id: 'suspend_user',   label: 'تعليق 7 أيام',     icon: '⏸️' },
  { id: 'ban_user',       label: 'حظر نهائي',         icon: '🚫' },
  { id: 'escalate',       label: 'تصعيد للإدارة',     icon: '⬆️' },
];

function authHeaders() {
  const token = localStorage.getItem('access_token') || localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function AdminReportsPanel() {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: 'pending',
    priority: 'all',
    target_type: 'all',
    reason: 'all',
    q: '',
  });
  const [selected, setSelected] = useState(null);
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [actionNotes, setActionNotes] = useState('');
  const [counts, setCounts] = useState({});

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v && v !== 'all') params.set(k === 'status' ? 'status' : k, v);
      });
      const { data } = await axios.get(
        `${API_BASE}/api/reports/admin?${params.toString()}`,
        { headers: authHeaders() },
      );
      setItems(data.items || []);
      setCounts(data.counts || {});
    } catch (e) {
      console.error('reports list failed', e);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const loadStats = useCallback(async () => {
    try {
      const { data } = await axios.get(
        `${API_BASE}/api/reports/admin/stats`,
        { headers: authHeaders() },
      );
      setStats(data);
    } catch (e) {
      console.error('stats failed', e);
    }
  }, []);

  useEffect(() => { loadList(); }, [loadList]);
  useEffect(() => { loadStats(); }, [loadStats]);

  const openDetails = async (report) => {
    setSelected(report);
    setSelectedEvents([]);
    setActionNotes('');
    try {
      const { data } = await axios.get(
        `${API_BASE}/api/reports/admin/${report.id}`,
        { headers: authHeaders() },
      );
      setSelected(data.report);
      setSelectedEvents(data.events || []);
    } catch (e) {
      console.error(e);
    }
  };

  const applyAction = async (actionId) => {
    if (!selected) return;
    if (!window.confirm(`تأكيد تنفيذ الإجراء: ${ACTIONS.find(a => a.id === actionId)?.label}؟`)) return;
    try {
      const { data } = await axios.post(
        `${API_BASE}/api/reports/admin/${selected.id}/action`,
        { action: actionId, notes: actionNotes || null },
        { headers: authHeaders() },
      );
      setSelected(data.report);
      await loadList();
      await loadStats();
      alert('✅ تم تنفيذ الإجراء بنجاح');
    } catch (e) {
      alert('❌ فشل تنفيذ الإجراء: ' + (e?.response?.data?.detail || e.message));
    }
  };

  return (
    <div
      dir="rtl"
      style={{
        fontFamily: '"Noto Sans Arabic","Cairo",system-ui,sans-serif',
        color: '#e7e6f3',
        padding: 16,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>
          🚨 إدارة البلاغات
        </h2>
        <span style={{ fontSize: 13, opacity: 0.6 }}>
          مركز الإشراف وحماية المجتمع
        </span>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))',
          gap: 10, marginBottom: 16,
        }}>
          <StatCard label="إجمالي البلاغات" value={stats.total} color="#7c3aed" />
          <StatCard label="قيد المراجعة" value={stats.pending} color="#ea580c" highlight />
          <StatCard label="تحت المعالجة" value={stats.reviewing} color="#0891b2" />
          <StatCard label="تمت معالجتها" value={stats.resolved} color="#16a34a" />
          <StatCard label="آخر 24 ساعة" value={stats.last_24h} color="#db2777" />
          <StatCard label="آخر 7 أيام" value={stats.last_7d} color="#0ea5e9" />
        </div>
      )}

      {/* Filters bar */}
      <div style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(124,58,237,0.25)',
        borderRadius: 14, padding: 12, marginBottom: 14,
        display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center',
      }}>
        {['all', 'pending', 'reviewing', 'resolved', 'dismissed', 'escalated'].map((s) => (
          <button
            key={s}
            onClick={() => setFilters(f => ({ ...f, status: s }))}
            style={{
              padding: '8px 14px', borderRadius: 999,
              background: filters.status === s
                ? 'linear-gradient(90deg,#7c3aed,#a855f7)'
                : 'rgba(255,255,255,0.06)',
              color: '#fff', border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
            }}
          >
            {STATUS_LABELS[s]}
            {counts[s] != null && <span style={{ opacity: 0.7, marginInlineStart: 6 }}>
              ({counts[s]})
            </span>}
          </button>
        ))}

        <select
          value={filters.priority}
          onChange={(e) => setFilters(f => ({ ...f, priority: e.target.value }))}
          style={selectStyle}
        >
          <option value="all">كل الأولويات</option>
          <option value="urgent">عاجل</option>
          <option value="high">مرتفع</option>
          <option value="normal">عادي</option>
          <option value="low">منخفض</option>
        </select>

        <select
          value={filters.target_type}
          onChange={(e) => setFilters(f => ({ ...f, target_type: e.target.value }))}
          style={selectStyle}
        >
          <option value="all">كل الأنواع</option>
          {Object.entries(TARGET_TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>

        <input
          type="text"
          value={filters.q}
          onChange={(e) => setFilters(f => ({ ...f, q: e.target.value }))}
          placeholder="بحث في التفاصيل/المعرّف..."
          style={{
            flex: 1, minWidth: 200, padding: '8px 12px',
            borderRadius: 10, background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)', color: '#fff',
            fontFamily: 'inherit', fontSize: 13,
          }}
        />

        <button onClick={loadList} style={refreshBtn}>🔄 تحديث</button>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', opacity: 0.6 }}>
          جارٍ تحميل البلاغات...
        </div>
      ) : items.length === 0 ? (
        <div style={{
          padding: 40, textAlign: 'center', opacity: 0.55,
          background: 'rgba(255,255,255,0.03)', borderRadius: 14,
        }}>
          ✨ لا توجد بلاغات تطابق هذه الفلاتر.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map((r) => (
            <ReportRow key={r.id} report={r} onOpen={() => openDetails(r)} />
          ))}
        </div>
      )}

      {/* Details Drawer */}
      {selected && (
        <DetailsDrawer
          report={selected}
          events={selectedEvents}
          onClose={() => setSelected(null)}
          actionNotes={actionNotes}
          setActionNotes={setActionNotes}
          onAction={applyAction}
        />
      )}
    </div>
  );
}

/* ========== Sub-components ========== */

function StatCard({ label, value, color, highlight }) {
  return (
    <div style={{
      background: highlight
        ? `linear-gradient(135deg, ${color}33, ${color}11)`
        : 'rgba(255,255,255,0.04)',
      border: `1px solid ${color}55`,
      borderRadius: 14, padding: 12,
    }}>
      <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color }}>{value ?? 0}</div>
    </div>
  );
}

function ReportRow({ report, onOpen }) {
  const pri = PRIORITY_BADGE[report.priority] || PRIORITY_BADGE.normal;
  const snap = report.snapshot || {};
  const preview =
    snap.content || snap.caption || snap.media_url ||
    snap.video_url || snap.name || `معرّف: ${report.target_id}`;

  return (
    <div
      onClick={onOpen}
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(124,58,237,0.25)',
        borderRadius: 14, padding: 14, cursor: 'pointer',
        transition: 'all .15s',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(168,85,247,0.6)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(124,58,237,0.25)'}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
        <span style={{
          padding: '3px 10px', borderRadius: 999,
          background: pri.bg, color: pri.color,
          fontSize: 11, fontWeight: 700,
        }}>
          {pri.label}
        </span>
        <span style={{
          padding: '3px 10px', borderRadius: 999,
          background: 'rgba(124,58,237,0.25)', fontSize: 11, fontWeight: 600,
        }}>
          {TARGET_TYPE_LABELS[report.target_type] || report.target_type}
        </span>
        <span style={{ fontSize: 13, fontWeight: 700 }}>
          {report.reason_label}
        </span>
        {report.duplicate_count > 1 && (
          <span style={{
            padding: '3px 10px', borderRadius: 999,
            background: 'rgba(239,68,68,0.25)', color: '#fca5a5',
            fontSize: 11, fontWeight: 700,
          }}>
            🔁 ×{report.duplicate_count}
          </span>
        )}
        <span style={{ marginInlineStart: 'auto', fontSize: 11, opacity: 0.6 }}>
          {report.created_at?.slice(0, 16).replace('T', ' ')}
        </span>
      </div>

      <div style={{
        fontSize: 13, opacity: 0.85, lineHeight: 1.6,
        maxHeight: 60, overflow: 'hidden',
      }}>
        {String(preview).slice(0, 200)}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8, fontSize: 12, opacity: 0.75 }}>
        <span>👤 المُبلِّغ: {report.reporter?.username || '[مجهول]'}</span>
        <span>•</span>
        <span>صاحب المحتوى: {report.target_owner?.username || '—'}</span>
        {report.details && <>
          <span>•</span>
          <span style={{ fontStyle: 'italic' }}>"{String(report.details).slice(0, 80)}"</span>
        </>}
      </div>
    </div>
  );
}

function DetailsDrawer({ report, events, onClose, actionNotes, setActionNotes, onAction }) {
  return (
    <div
      dir="rtl"
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
        display: 'flex', justifyContent: 'flex-start',
        fontFamily: '"Noto Sans Arabic","Cairo",system-ui,sans-serif',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 600,
          background: 'linear-gradient(180deg,#1e1b3a,#14122a)',
          color: '#fff', padding: 20, overflowY: 'auto',
          borderInlineEnd: '1px solid rgba(124,58,237,0.4)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
            🚨 بلاغ #{report.id}
          </h3>
          <button onClick={onClose} style={{
            marginInlineStart: 'auto', background: 'transparent',
            border: '1px solid rgba(255,255,255,0.2)', color: '#fff',
            padding: '6px 10px', borderRadius: 8, cursor: 'pointer',
          }}>✖ إغلاق</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
          <Info label="السبب" value={report.reason_label} />
          <Info label="نوع الكيان" value={TARGET_TYPE_LABELS[report.target_type] || report.target_type} />
          <Info label="الحالة" value={STATUS_LABELS[report.status] || report.status} />
          <Info label="الأولوية" value={PRIORITY_BADGE[report.priority]?.label || report.priority} />
          <Info label="المُبلِّغ" value={report.reporter?.username || '[مجهول]'} />
          <Info label="صاحب المحتوى" value={report.target_owner?.username || '—'} />
        </div>

        {report.details && (
          <div style={section}>
            <h4 style={sectionTitle}>تفاصيل المُبلِّغ</h4>
            <p style={{ margin: 0, lineHeight: 1.7, fontSize: 14 }}>{report.details}</p>
          </div>
        )}

        <div style={section}>
          <h4 style={sectionTitle}>📷 لقطة المحتوى وقت البلاغ</h4>
          <pre style={{
            margin: 0, fontSize: 12, lineHeight: 1.6,
            background: 'rgba(0,0,0,0.3)', padding: 10, borderRadius: 8,
            whiteSpace: 'pre-wrap', wordBreak: 'break-word', direction: 'ltr',
            textAlign: 'start',
          }}>
            {JSON.stringify(report.snapshot || {}, null, 2)}
          </pre>
        </div>

        {events.length > 0 && (
          <div style={section}>
            <h4 style={sectionTitle}>📜 سجل الأحداث</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {events.map((ev) => (
                <div key={ev.id} style={{
                  fontSize: 12, padding: 8, borderRadius: 8,
                  background: 'rgba(255,255,255,0.04)',
                }}>
                  <b>{ev.event_type}</b>
                  {ev.note && <> — {ev.note}</>}
                  <span style={{ opacity: 0.55, marginInlineStart: 8 }}>
                    {ev.created_at?.slice(0, 16).replace('T', ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={section}>
          <h4 style={sectionTitle}>⚡ اتخاذ إجراء</h4>
          <textarea
            value={actionNotes}
            onChange={(e) => setActionNotes(e.target.value)}
            placeholder="ملاحظات داخلية (اختياري)..."
            rows={2}
            style={{
              width: '100%', padding: 10, borderRadius: 10,
              background: 'rgba(255,255,255,0.06)', color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)',
              fontFamily: 'inherit', fontSize: 13, marginBottom: 10,
              resize: 'vertical',
            }}
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
            {ACTIONS.map((a) => (
              <button
                key={a.id}
                onClick={() => onAction(a.id)}
                style={{
                  padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                  background: 'rgba(124,58,237,0.18)',
                  border: '1px solid rgba(124,58,237,0.4)',
                  color: '#fff', fontWeight: 700, fontSize: 13,
                  fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}
              >
                <span style={{ fontSize: 16 }}>{a.icon}</span>
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)', padding: 10, borderRadius: 10,
    }}>
      <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

const section = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 12, padding: 12, marginBottom: 14,
};
const sectionTitle = { margin: '0 0 8px', fontSize: 14, fontWeight: 700, opacity: 0.9 };
const selectStyle = {
  padding: '8px 12px', borderRadius: 10,
  background: 'rgba(255,255,255,0.06)', color: '#fff',
  border: '1px solid rgba(255,255,255,0.1)',
  fontFamily: '"Noto Sans Arabic",inherit', fontSize: 13,
};
const refreshBtn = {
  padding: '8px 14px', borderRadius: 10,
  background: 'rgba(124,58,237,0.25)', color: '#fff',
  border: '1px solid rgba(124,58,237,0.5)', cursor: 'pointer',
  fontFamily: '"Noto Sans Arabic",inherit', fontSize: 13, fontWeight: 700,
};
