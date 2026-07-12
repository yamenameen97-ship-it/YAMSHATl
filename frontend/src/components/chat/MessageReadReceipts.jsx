import { memo, useMemo } from 'react';

/**
 * MessageReadReceipts (v87.10)
 * ============================
 * يعرض مؤشرات حالة الرسالة داخل فقاعة MessageBubble:
 * - ⏱  قيد الإرسال (pending)
 * - ✓   مرسلة (sent)
 * - ✓✓  تم التسليم (delivered) — رمادي
 * - ✓✓  مقروءة (read) — أزرق
 * - ✕   فشل الإرسال (failed)
 *
 * v87.10 changes:
 * - يقبل `isMe` مباشرة (fallback إلى مقارنة sender/currentUser للتوافق العكسي)
 * - يقرأ read_at / delivered_at / read_by_count (من WS chat/read_receipt)
 * - يظهر أيضاً للرسائل الفاشلة (لعرض ✕) ولم يعد يعتمد فقط على sender===currentUser
 */
function MessageReadReceipts({
  message,
  currentUser,
  isMe: isMeProp,
  className = '',
}) {
  const isMine = useMemo(() => {
    if (typeof isMeProp === 'boolean') return isMeProp;
    if (message?.isMe === true) return true;
    const me = String(currentUser || '').trim().toLowerCase().replace(/^@/, '');
    const sender = String(
      message?.sender_username || message?.sender || message?.author || message?.from || ''
    ).trim().toLowerCase().replace(/^@/, '');
    return Boolean(me) && Boolean(sender) && me === sender;
  }, [isMeProp, currentUser, message]);

  const statusIcon = useMemo(() => {
    if (!isMine) return null;
    const lifecycle = message?.lifecycle?.status || message?.status;

    // فشل الإرسال → أولوية عالية حتى لا يُخفى بواسطة sent_at
    if (lifecycle === 'failed' || message?.failed) {
      return { icon: '✕', label: 'فشل الإرسال', kind: 'failed' };
    }

    // قيد الإرسال
    if (lifecycle === 'pending' || lifecycle === 'sending' || message?.pending) {
      return { icon: '⏱', label: 'قيد الإرسال', kind: 'pending' };
    }

    // مقروءة (read) — أعلى من delivered
    if (message?.read_at || message?.read_receipt || (message?.read_by_count > 0)) {
      return { icon: '✓✓', label: 'مقروءة', kind: 'read', timestamp: message?.read_at };
    }

    // تم التسليم
    if (message?.delivered_at || message?.delivered) {
      return { icon: '✓✓', label: 'تم التسليم', kind: 'delivered', timestamp: message?.delivered_at };
    }

    // مُرسلة (افتراضي بعد الرد من الخادم)
    if (message?.sent_at || lifecycle === 'sent' || message?.id) {
      return { icon: '✓', label: 'مرسلة', kind: 'sent', timestamp: message?.sent_at || message?.created_at };
    }

    return { icon: '⏱', label: 'قيد الإرسال', kind: 'pending' };
  }, [isMine, message]);

  if (!isMine || !statusIcon) return null;

  return (
    <span
      className={`message-read-receipts is-${statusIcon.kind} ${className}`}
      data-status={statusIcon.kind}
      title={statusIcon.label}
      aria-label={statusIcon.label}
    >
      {statusIcon.icon}
    </span>
  );
}

export default memo(MessageReadReceipts);
