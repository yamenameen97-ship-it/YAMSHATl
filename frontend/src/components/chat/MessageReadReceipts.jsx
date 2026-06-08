import { memo, useMemo } from 'react';

/**
 * MessageReadReceipts
 * ==================
 * يعرض مؤشرات حالة الرسالة:
 * - ✓ مرسلة (sent)
 * - ✓✓ تم التسليم (delivered)
 * - ✓✓ مقروءة (read)
 * 
 * يتم عرضها في أسفل الرسالة المرسلة من المستخدم الحالي
 */
function MessageReadReceipts({
  message,
  currentUser,
  className = '',
}) {
  const isMine = message?.sender === currentUser;
  
  const statusIcon = useMemo(() => {
    if (!isMine) return null;
    
    // حالة الرسالة: read > delivered > sent > pending > failed
    if (message?.read_at || message?.read_receipt) {
      return {
        icon: '✓✓',
        label: 'مقروءة',
        className: 'read-receipt read',
        timestamp: message?.read_at,
      };
    }
    
    if (message?.delivered_at || message?.delivered) {
      return {
        icon: '✓✓',
        label: 'تم التسليم',
        className: 'read-receipt delivered',
        timestamp: message?.delivered_at,
      };
    }
    
    if (message?.sent_at || message?.status === 'sent' || message?.lifecycle?.status === 'sent') {
      return {
        icon: '✓',
        label: 'مرسلة',
        className: 'read-receipt sent',
        timestamp: message?.sent_at || message?.created_at,
      };
    }
    
    if (message?.status === 'pending' || message?.lifecycle?.status === 'pending') {
      return {
        icon: '⏱',
        label: 'قيد الإرسال',
        className: 'read-receipt pending',
      };
    }
    
    if (message?.status === 'failed' || message?.lifecycle?.status === 'failed') {
      return {
        icon: '✕',
        label: 'فشل الإرسال',
        className: 'read-receipt failed',
      };
    }
    
    return {
      icon: '○',
      label: 'غير معروف',
      className: 'read-receipt unknown',
    };
  }, [isMine, message]);
  
  if (!statusIcon) return null;
  
  return (
    <span
      className={`message-status-icon ${statusIcon.className} ${className}`}
      title={statusIcon.label}
      aria-label={statusIcon.label}
    >
      {statusIcon.icon}
    </span>
  );
}

export default memo(MessageReadReceipts);

/**
 * CSS Styles for MessageReadReceipts
 * ==================================
 * 
 * أضف هذا إلى global.css أو chat-styles.css:
 * 
 * .message-status-icon {
 *   display: inline-flex;
 *   align-items: center;
 *   justify-content: center;
 *   font-size: 0.85rem;
 *   font-weight: 600;
 *   margin-left: 4px;
 *   transition: color 200ms ease, opacity 200ms ease;
 * }
 * 
 * .message-status-icon.sent {
 *   color: rgba(148, 163, 184, 0.6);
 * }
 * 
 * .message-status-icon.delivered {
 *   color: rgba(148, 163, 184, 0.8);
 * }
 * 
 * .message-status-icon.read {
 *   color: #60a5fa;
 *   font-weight: 700;
 * }
 * 
 * .message-status-icon.pending {
 *   color: rgba(251, 146, 60, 0.7);
 *   animation: pulse 1.5s ease-in-out infinite;
 * }
 * 
 * .message-status-icon.failed {
 *   color: #ef4444;
 * }
 * 
 * .message-status-icon.unknown {
 *   color: rgba(148, 163, 184, 0.4);
 * }
 * 
 * @keyframes pulse {
 *   0%, 100% { opacity: 1; }
 *   50% { opacity: 0.5; }
 * }
 */
