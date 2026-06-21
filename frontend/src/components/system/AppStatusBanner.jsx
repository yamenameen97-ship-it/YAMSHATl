import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppStore } from '../../store/appStore.js';
import { getSessionTtlMs } from '../../utils/auth.js';

function formatRemaining(ms) {
  const minutes = Math.max(Math.ceil(ms / 60000), 1);
  return `${minutes} دقيقة`;
}

export default function AppStatusBanner() {
  const location = useLocation();
  const isOnline = useAppStore((state) => state.isOnline);
  const queuedActions = useAppStore((state) => state.queuedActions);
  const ttl = getSessionTtlMs();
  const [syncNote, setSyncNote] = useState('');

  // ✅ v55: إخفاء البانر العلوي داخل صفحات الأدمن لأنها أصبحت
  // تملك صندوق "حالة السيرفر" الخاص بها داخل التوب-بار،
  // والبانر الممتد كان يسبب فراغاً فوق اللوحة ويضغط بطاقات الإحصائيات.
  const isAdminRoute = /^\/admin(\/|$)/.test(location.pathname || '');

  useEffect(() => {
    const handleSent = () => setSyncNote('تمت مزامنة عنصر مؤجل بنجاح.');
    const handleFailed = () => setSyncNote('بعض العناصر ما زالت بانتظار المحاولة.');
    window.addEventListener('yamshat:queued-message-sent', handleSent);
    window.addEventListener('yamshat:queued-message-failed', handleFailed);
    return () => {
      window.removeEventListener('yamshat:queued-message-sent', handleSent);
      window.removeEventListener('yamshat:queued-message-failed', handleFailed);
    };
  }, []);

  const banner = useMemo(() => {
    if (!isOnline) {
      return {
        type: 'warning',
        text: queuedActions.length
          ? `أنت بدون إنترنت حالياً. لدينا ${queuedActions.length} إجراء محفوظ وسيتم إرساله تلقائياً عند عودة الشبكة.`
          : 'أنت بدون إنترنت حالياً. سيتم استكمال المزامنة تلقائياً بعد رجوع الشبكة.',
      };
    }

    if (queuedActions.length > 0) {
      return {
        type: 'info',
        text: `تجري مزامنة ${queuedActions.length} إجراء مؤجل الآن.${syncNote ? ` ${syncNote}` : ''}`,
      };
    }

    if (ttl !== null && ttl > 0 && ttl <= 5 * 60 * 1000) {
      return {
        type: 'info',
        text: `تنبيه الجلسة: ستنتهي خلال ${formatRemaining(ttl)} ما لم يتم التجديد تلقائياً.`,
      };
    }

    return null;
  }, [isOnline, queuedActions.length, syncNote, ttl]);

  if (isAdminRoute) return null;
  if (!banner) return null;

  return (
    <div className={`app-status-banner slim ${banner.type}`} dir="rtl">
      {banner.text}
      <style>{`
        .app-status-banner.slim {
          position: sticky;
          top: 0;
          z-index: 45;
          min-height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 6px 12px;
          font-size: 12px;
          font-weight: 700;
          text-align: center;
          backdrop-filter: blur(14px);
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        .app-status-banner.slim.info {
          background: rgba(15, 23, 42, 0.88);
          color: #cbd5e1;
        }

        .app-status-banner.slim.warning {
          background: rgba(120, 53, 15, 0.88);
          color: #ffedd5;
        }
      `}</style>
    </div>
  );
}
