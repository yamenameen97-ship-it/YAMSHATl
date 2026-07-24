import { useState, useMemo } from 'react';
import Card from '../ui/Card.jsx';
import Button from '../ui/Button.jsx';
import Modal from '../ui/Modal.jsx';
import { submitRestrictionAppeal } from '../../api/restrictions.js';

// v88.53 — بطاقة إشعار قيد إداري
// =====================================================
// تُعرض هذه البطاقة داخل صفحة الإشعارات عند وصول إشعار من نوع
//   RESTRICTION_COMMENT_MUTE / RESTRICTION_POST_BAN / RESTRICTION_REELS_BAN /
//   RESTRICTION_GROUPS_JOIN_BAN / RESTRICTION_STORY_BAN /
//   RESTRICTION_DM_STRANGERS_BAN
//
// السلوك:
//   1) تعرض نص الإشعار الرسمي كما جاء من الخادم.
//   2) تظهر زر "طلب مراجعه" — عند الضغط يُعرض Modal يحوي textarea
//      لكتابة نص الطلب ثم زر "ارسال".
//   3) بعد الإرسال يختفي الإشعار من عند المشترك (يُخفى محلياً) وتُرسل
//      رسالة إلى الإدارة داخل الخادم. إذا لم يُرسِل المستخدم الطلب يبقى
//      الإشعار كما هو حتى يقوم هو بإخفائه أو تركه.

const RESTRICTION_META = {
  comment_mute:      { icon: '🔇', tone: '#f59e0b', label: 'كتم التعليق' },
  post_ban:          { icon: '🛑', tone: '#ef4444', label: 'حظر النشر' },
  reels_ban:         { icon: '🎬', tone: '#a855f7', label: 'حظر الريلز' },
  groups_join_ban:   { icon: '👥', tone: '#0ea5e9', label: 'حظر المجموعات' },
  story_ban:         { icon: '📖', tone: '#ec4899', label: 'حظر الستوري' },
  dm_strangers_ban:  { icon: '💬', tone: '#64748b', label: 'حظر المراسلة' },
};

function formatRemaining(expiresAt) {
  if (!expiresAt) return 'حتى تنظر الإدارة';
  try {
    const ms = new Date(expiresAt).getTime() - Date.now();
    if (ms <= 0) return 'انتهت';
    const hours = Math.floor(ms / 3_600_000);
    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      return `${days} يوم متبقي`;
    }
    return `${hours} ساعة متبقية`;
  } catch {
    return '';
  }
}

export default function RestrictionNotificationCard({ notification, onHide }) {
  const payload = notification?.payload || notification?.data || {};
  const restrictionType = String(payload.restriction_type || '').trim();
  const restrictionId = payload.restriction_id;
  const appealStatus = String(payload.appeal_status || 'none');

  const meta = useMemo(
    () => RESTRICTION_META[restrictionType] || { icon: '⚠️', tone: '#3b82f6', label: 'تنبيه إداري' },
    [restrictionType],
  );

  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(appealStatus === 'pending');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    const trimmed = message.trim();
    if (!trimmed) {
      setError('اكتب نص طلب المراجعة قبل الإرسال.');
      return;
    }
    setSending(true);
    setError('');
    try {
      await submitRestrictionAppeal(restrictionId, trimmed);
      setSent(true);
      setOpen(false);
      // يختفي الإشعار من عند المشترك بعد إرسال الطلب
      if (typeof onHide === 'function') onHide(notification.id);
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || 'تعذّر إرسال الطلب — حاول مرة أخرى.');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Card
        style={{
          padding: 16,
          display: 'flex',
          gap: 14,
          alignItems: 'flex-start',
          border: `1px solid ${meta.tone}55`,
          background: `${meta.tone}12`,
        }}
      >
        <div style={{
          width: 46,
          height: 46,
          borderRadius: 16,
          background: `linear-gradient(135deg, ${meta.tone}, #0ea5e9)`,
          display: 'grid',
          placeItems: 'center',
          color: 'white',
          fontSize: 22,
          flexShrink: 0,
        }}>
          {meta.icon}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
            <strong style={{ fontSize: 15 }}>{notification.title || meta.label}</strong>
            <span style={{
              padding: '2px 8px',
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 800,
              background: `${meta.tone}22`,
              color: meta.tone,
            }}>
              {meta.label}
            </span>
            <span className="muted" style={{ fontSize: 12, marginInlineStart: 'auto' }}>
              {formatRemaining(payload.expires_at)}
            </span>
          </div>

          <div style={{ lineHeight: 1.7, color: 'var(--text, #e2e8f0)', fontSize: 14, wordBreak: 'break-word' }}>
            {notification.body}
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="muted" style={{ fontSize: 12 }}>
              {new Date(notification.created_at || Date.now()).toLocaleString('ar-EG')}
            </span>

            <div style={{ marginInlineStart: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {sent ? (
                <span style={{
                  padding: '6px 12px',
                  borderRadius: 999,
                  background: 'rgba(34,197,94,0.16)',
                  color: '#86efac',
                  fontSize: 13,
                  fontWeight: 700,
                }}>
                  تم إرسال طلب المراجعة ✓
                </span>
              ) : (
                <Button
                  size="sm"
                  onClick={() => setOpen(true)}
                  style={{
                    background: `linear-gradient(135deg, ${meta.tone}, #2563eb)`,
                    color: 'white',
                    fontWeight: 700,
                  }}
                >
                  طلب مراجعه
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      <Modal open={open} onClose={() => (sending ? null : setOpen(false))} title="طلب مراجعة القيد">
        <div style={{ display: 'grid', gap: 12 }} dir="rtl">
          <div className="muted" style={{ fontSize: 13, lineHeight: 1.7 }}>
            اكتب نص طلب المراجعة أدناه، سيصل إلى الإدارة كرسالة، وسيختفي هذا
            الإشعار من عندك بعد الإرسال. سنُخطرك بالرد.
          </div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="اشرح موقفك وسبب طلب المراجعة..."
            rows={5}
            maxLength={2000}
            style={{
              width: '100%',
              padding: 12,
              borderRadius: 12,
              border: '1px solid var(--line, #334155)',
              background: 'rgba(15,23,42,0.4)',
              color: 'inherit',
              fontSize: 14,
              resize: 'vertical',
              fontFamily: 'inherit',
            }}
          />
          {error ? (
            <div style={{ color: '#fca5a5', fontSize: 13 }}>{error}</div>
          ) : null}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={sending}>
              إلغاء
            </Button>
            <Button onClick={handleSubmit} disabled={sending || !message.trim()}>
              {sending ? 'جارٍ الإرسال...' : 'ارسال'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

// دالة مساعدة لاكتشاف ما إذا كان الإشعار من نوع قيد إداري
export function isRestrictionNotification(notification) {
  const t = String(notification?.type || '').toUpperCase();
  return t.startsWith('RESTRICTION_') && t !== 'RESTRICTION_APPEAL_RESOLVED';
}
