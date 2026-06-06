import { memo, useCallback, useState } from 'react';

/**
 * MessageRetry
 * ============
 * يعرض زر "إعادة محاولة" للرسائل الفاشلة
 * 
 * الميزات:
 * - يظهر فقط للرسائل الفاشلة
 * - يعرض رسالة الخطأ عند التمرير
 * - يدعم إعادة محاولة متعددة
 * - يعرض حالة التحميل أثناء الإرسال
 */
function MessageRetry({
  message,
  currentUser,
  onRetry,
  className = '',
}) {
  const isMine = message?.sender === currentUser;
  const isFailed = message?.status === 'failed' || message?.lifecycle?.status === 'failed';
  const [isRetrying, setIsRetrying] = useState(false);
  
  const errorMessage = message?.queue_error || message?.error || 'فشل إرسال الرسالة';
  
  const handleRetry = useCallback(async () => {
    if (!isFailed || isRetrying || !onRetry) return;
    
    setIsRetrying(true);
    try {
      await onRetry(message);
    } finally {
      setIsRetrying(false);
    }
  }, [isFailed, isRetrying, message, onRetry]);
  
  if (!isMine || !isFailed) return null;
  
  return (
    <div className={`message-retry-container ${className}`}>
      <div className="message-error-banner">
        <span className="error-icon">⚠️</span>
        <span className="error-text">{errorMessage}</span>
        <button
          type="button"
          className={`retry-button ${isRetrying ? 'retrying' : ''}`}
          onClick={handleRetry}
          disabled={isRetrying}
          aria-label="إعادة محاولة إرسال الرسالة"
        >
          {isRetrying ? (
            <>
              <span className="spinner" />
              جاري الإرسال...
            </>
          ) : (
            <>
              <span className="retry-icon">🔄</span>
              إعادة محاولة
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default memo(MessageRetry);

/**
 * CSS Styles for MessageRetry
 * ===========================
 * 
 * أضف هذا إلى global.css أو chat-styles.css:
 * 
 * .message-retry-container {
 *   margin: 8px 0;
 * }
 * 
 * .message-error-banner {
 *   display: flex;
 *   align-items: center;
 *   gap: 10px;
 *   padding: 10px 12px;
 *   border-radius: 12px;
 *   background: linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.08));
 *   border: 1px solid rgba(239, 68, 68, 0.3);
 *   font-size: 0.9rem;
 * }
 * 
 * .error-icon {
 *   flex-shrink: 0;
 *   font-size: 1rem;
 * }
 * 
 * .error-text {
 *   flex: 1;
 *   color: #fca5a5;
 *   font-size: 0.85rem;
 * }
 * 
 * .retry-button {
 *   flex-shrink: 0;
 *   display: inline-flex;
 *   align-items: center;
 *   gap: 6px;
 *   padding: 6px 12px;
 *   border-radius: 8px;
 *   border: 1px solid rgba(239, 68, 68, 0.5);
 *   background: rgba(239, 68, 68, 0.2);
 *   color: #fca5a5;
 *   font-size: 0.85rem;
 *   font-weight: 600;
 *   cursor: pointer;
 *   transition: all 200ms ease;
 * }
 * 
 * .retry-button:hover:not(:disabled) {
 *   background: rgba(239, 68, 68, 0.3);
 *   border-color: rgba(239, 68, 68, 0.7);
 * }
 * 
 * .retry-button:active:not(:disabled) {
 *   transform: scale(0.97);
 * }
 * 
 * .retry-button:disabled {
 *   opacity: 0.6;
 *   cursor: not-allowed;
 * }
 * 
 * .retry-icon {
 *   display: inline-block;
 *   animation: spin 1s linear infinite;
 * }
 * 
 * .retry-button.retrying .retry-icon {
 *   animation: spin 1s linear infinite;
 * }
 * 
 * .spinner {
 *   display: inline-block;
 *   width: 12px;
 *   height: 12px;
 *   border: 2px solid rgba(252, 165, 165, 0.3);
 *   border-top-color: #fca5a5;
 *   border-radius: 50%;
 *   animation: spin 0.8s linear infinite;
 * }
 * 
 * @keyframes spin {
 *   to { transform: rotate(360deg); }
 * }
 */
