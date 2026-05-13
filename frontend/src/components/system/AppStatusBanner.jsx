import { useEffect, useMemo, useState } from 'react';
import { useAppStore } from '../../store/appStore.js';
import { getSessionTtlMs } from '../../utils/auth.js';

function formatRemaining(ms) {
  const minutes = Math.max(Math.ceil(ms / 60000), 1);
  return `${minutes} دقيقة`;
}

export default function AppStatusBanner() {
  const isOnline = useAppStore((state) => state.isOnline);
  const activeRequests = useAppStore((state) => state.activeRequests);
  const queuedActions = useAppStore((state) => state.queuedActions);
  const ttl = getSessionTtlMs();
  const [syncNote, setSyncNote] = useState('');

  useEffect(() => {
    const handleSent = () => setSyncNote('تمت مزامنة عنصر من الطابور بنجاح.');
    const handleFailed = () => setSyncNote('بعض العناصر ما زالت بانتظار إعادة المحاولة.');
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
          ? `أنت الآن بدون إنترنت. تم حفظ ${queuedActions.length} إجراء محلياً وسيتم إرسالها تلقائياً عند عودة الشبكة.`
          : 'أنت الآن بدون إنترنت. ستظهر لك صفحات Offline وسنستأنف التحديثات تلقائياً عند رجوع الشبكة.',
      };
    }

    if (queuedActions.length > 0) {
      return {
        type: 'info',
        text: `Background sync يعمل حالياً لمزامنة ${queuedActions.length} إجراء مؤجل.${syncNote ? ` ${syncNote}` : ''}`,
      };
    }

    if (ttl !== null && ttl > 0 && ttl <= 5 * 60 * 1000) {
      return {
        type: 'info',
        text: `تنبيه: الجلسة الحالية ستنتهي خلال ${formatRemaining(ttl)} ما لم يتم تجديدها تلقائياً.`,
      };
    }

    if (activeRequests > 0) {
      return {
        type: 'info',
        text: 'جارٍ مزامنة البيانات وتحديث الواجهة...',
      };
    }

    return null;
  }, [activeRequests, isOnline, queuedActions.length, syncNote, ttl]);

  if (!banner) return null;
  return <div className={`app-status-banner ${banner.type}`}>{banner.text}</div>;
}
