import { useState } from 'react';
import Card from '../ui/Card.jsx';
import Button from '../ui/Button.jsx';
import Modal from '../ui/Modal.jsx';
import API from '../../api/axios.js';

// v88.54 — بطاقة إشعار "ادارة النظام"
// =====================================================
// تعرض هذه البطاقة عند وصول إشعار من نوع ADMIN_ALERT (تنبيه من الإدارة).
//
// السلوك المطلوب:
//   1) العنوان يظهر دائماً باسم "ادارة النظام" — لا يظهر اسم الأدمن أو حسابه.
//   2) يوجد زر "الرد" — عند الضغط تفتح فقاعة (Modal) بها textarea + زر "ارسال".
//   3) بعد إرسال الرد يختفي الإشعار من عند المشترك تلقائياً.
//   4) إذا لم يرد المشترك يبقى الإشعار مقيداً لديه حتى يحذفه هو بنفسه (زر الحذف).
//
// endpoint الرد:
//   POST /api/admin/notifications/{notification_id}/admin-alert-reply { message }

export function isAdminAlertNotification(notification) {
  const t = String(notification?.type || '').toUpperCase();
  if (t === 'ADMIN_ALERT') return true;
  const payload = notification?.payload || notification?.data || {};
  return Boolean(payload?.admin_alert);
}

export default function AdminAlertNotificationCard({ notification, onHide, onRead }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const isSeen = Boolean(notification?.seen ?? notification?.is_read);

  const handleOpen = () => {
    if (!isSeen && typeof onRead === 'function') {
      try { onRead(notification.id); } catch { /* noop */ }
    }
    setOpen(true);
  };

  const handleSend = async () => {
    const trimmed = message.trim();
    if (!trimmed) {
      setError('اكتب نص الرد قبل الإرسال.');
      return;
    }
    setSending(true);
    setError('');
    try {
      // نستدعي الـ endpoint مباشرة (المستخدم مصادَق عليه فعلياً — التوكن موجود)
      await API.post(
        `/admin/notifications/${encodeURIComponent(notification.id)}/admin-alert-reply`,
        { message: trimmed },
      );
      setOpen(false);
      // اختفاء فوري من واجهة المستخدم بعد الرد
      if (typeof onHide === 'function') onHide(notification.id);
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || 'تعذّر إرسال الرد — حاول مرة أخرى.');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = () => {
    if (typeof onHide === 'function') onHide(notification.id);
  };

  const tone = '#8b5cf6';

  return (
    <>
      <Card
        style={{
          padding: 16,
          display: 'flex',
          gap: 14,
          alignItems: 'flex-start',
          border: isSeen ? '1px solid var(--line)' : `1px solid ${tone}55`,
          background: isSeen ? 'var(--bg-card)' : `${tone}12`,
        }}
      >
        <div style={{
          width: 46,
          height: 46,
          borderRadius: 16,
          background: `linear-gradient(135deg, ${tone}, #0ea5e9)`,
          display: 'grid',
          placeItems: 'center',
          color: 'white',
          fontSize: 22,
          flexShrink: 0,
        }}>
          🛡️
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
            {/* العنوان ثابت — لا يظهر اسم الأدمن نهائياً */}
            <strong style={{ fontSize: 15 }}>ادارة النظام</strong>
            <span style={{
              padding: '2px 8px',
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 800,
              background: `${tone}22`,
              color: tone,
            }}>
              تنبيه رسمي
            </span>
            {!isSeen ? (
              <span style={{
                padding: '2px 8px',
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 800,
                background: 'rgba(59,130,246,0.16)',
                color: '#93c5fd',
              }}>
                جديد
              </span>
            ) : null}
          </div>

          <div
            onClick={handleOpen}
            role="button"
            tabIndex={0}
            style={{
              lineHeight: 1.7,
              color: 'var(--text, #e2e8f0)',
              fontSize: 14,
              wordBreak: 'break-word',
              cursor: 'pointer',
            }}
          >
            {notification.body}
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="muted" style={{ fontSize: 12 }}>
              {new Date(notification.created_at || Date.now()).toLocaleString('ar-EG')}
            </span>

            <div style={{ marginInlineStart: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Button
                size="sm"
                onClick={handleOpen}
                style={{
                  background: `linear-gradient(135deg, ${tone}, #2563eb)`,
                  color: 'white',
                  fontWeight: 700,
                }}
              >
                الرد
              </Button>
              <Button variant="secondary" size="sm" onClick={handleDelete}>
                حذف
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Modal open={open} onClose={() => (sending ? null : setOpen(false))} title="ادارة النظام">
        <div style={{ display: 'grid', gap: 12 }} dir="rtl">
          {/* نص التنبيه الأصلي */}
          <div style={{
            padding: 12,
            borderRadius: 12,
            background: 'rgba(139,92,246,0.08)',
            border: '1px solid rgba(139,92,246,0.28)',
            fontSize: 14,
            lineHeight: 1.7,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}>
            {notification.body}
          </div>

          <div className="muted" style={{ fontSize: 13, lineHeight: 1.7 }}>
            اكتب ردّك في الأسفل ثم اضغط "ارسال". سيصل الرد إلى الإدارة وسيختفي
            هذا الإشعار من عندك بعد الإرسال.
          </div>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="اكتب ردّك هنا..."
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
            <Button onClick={handleSend} disabled={sending || !message.trim()}>
              {sending ? 'جارٍ الإرسال...' : 'ارسال'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
