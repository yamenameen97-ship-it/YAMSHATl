import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const ToastContext = createContext({ pushToast: () => {} });
const MAX_TOASTS = 4;

function normalizeToast(toast = {}) {
  const title = toast.title || toast.message || toast.label || (toast.type === 'error' ? 'حدث خطأ' : toast.type === 'success' ? 'تم بنجاح' : 'تنبيه');
  const description = toast.description || (toast.title && toast.message && toast.title !== toast.message ? toast.message : '') || '';
  return {
    id: toast.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: toast.type || 'info',
    title,
    description,
    duration: Number(toast.duration || 4200),
    actionLabel: toast.actionLabel || '',
    onAction: typeof toast.onAction === 'function' ? toast.onAction : null,
  };
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((toastId) => {
    setToasts((prev) => prev.filter((item) => item.id !== toastId));
  }, []);

  const pushToast = useCallback((toast) => {
    const nextToast = normalizeToast(toast);
    setToasts((prev) => [...prev.filter((item) => item.title !== nextToast.title || item.description !== nextToast.description), nextToast].slice(-MAX_TOASTS));
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== nextToast.id));
    }, nextToast.duration);
  }, []);

  useEffect(() => {
    const handleToast = (event) => pushToast(event.detail || {});
    window.addEventListener('yamshat:toast', handleToast);
    return () => window.removeEventListener('yamshat:toast', handleToast);
  }, [pushToast]);

  const value = useMemo(() => ({ pushToast, dismissToast }), [dismissToast, pushToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <div className="toast-head-row">
              <strong>{toast.title}</strong>
              <button type="button" className="toast-close-btn" onClick={() => dismissToast(toast.id)} aria-label="إغلاق الإشعار">×</button>
            </div>
            {toast.description ? <span>{toast.description}</span> : null}
            {toast.actionLabel ? (
              <button
                type="button"
                className="toast-action-btn"
                onClick={() => {
                  toast.onAction?.();
                  dismissToast(toast.id);
                }}
              >
                {toast.actionLabel}
              </button>
            ) : null}
            <div className="toast-progress" style={{ animationDuration: `${toast.duration}ms` }} />
          </div>
        ))}
      </div>

      <style>{`
        .toast-head-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }
        .toast-close-btn,
        .toast-action-btn {
          border: none;
          cursor: pointer;
          font: inherit;
        }
        .toast-close-btn {
          width: 28px;
          height: 28px;
          border-radius: 999px;
          background: rgba(255,255,255,0.08);
          color: inherit;
        }
        .toast-action-btn {
          justify-self: start;
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(59,130,246,0.14);
          color: #bfdbfe;
          font-weight: 700;
        }
        .toast {
          overflow: hidden;
          position: relative;
        }
        .toast-progress {
          position: absolute;
          inset-inline-start: 0;
          bottom: 0;
          height: 3px;
          width: 100%;
          transform-origin: left;
          background: linear-gradient(90deg, #8b5cf6, #22d3ee);
          animation-name: toast-progress-shrink;
          animation-timing-function: linear;
          animation-fill-mode: forwards;
        }
        @keyframes toast-progress-shrink {
          from { transform: scaleX(1); }
          to { transform: scaleX(0); }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
