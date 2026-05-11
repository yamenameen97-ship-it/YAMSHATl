import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const ToastContext = createContext({ pushToast: () => {} });

function normalizeToast(toast = {}) {
  const title = toast.title || toast.message || toast.label || (toast.type === 'error' ? 'حدث خطأ' : toast.type === 'success' ? 'تم بنجاح' : 'تنبيه');
  const description = toast.description || (toast.title && toast.message && toast.title !== toast.message ? toast.message : '') || '';
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: toast.type || 'info',
    title,
    description,
    duration: Number(toast.duration || 3200),
  };
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const pushToast = useCallback((toast) => {
    const nextToast = normalizeToast(toast);
    setToasts((prev) => [...prev, nextToast]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== nextToast.id));
    }, nextToast.duration);
  }, []);

  useEffect(() => {
    const handleToast = (event) => pushToast(event.detail || {});
    window.addEventListener('yamshat:toast', handleToast);
    return () => window.removeEventListener('yamshat:toast', handleToast);
  }, [pushToast]);

  const value = useMemo(() => ({ pushToast }), [pushToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <strong>{toast.title}</strong>
            {toast.description ? <span>{toast.description}</span> : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
