import { useMemo } from 'react';
import { useAppStore } from '../../store/appStore.js';
import { getSessionTtlMs } from '../../utils/auth.js';

function formatRemaining(ms) {
  const minutes = Math.max(Math.ceil(ms / 60000), 1);
  return `${minutes} دقيقة`;
}

export default function AppStatusBanner() {
  const isOnline = useAppStore((state) => state.isOnline);
  const activeRequests = useAppStore((state) => state.activeRequests);
  const ttl = getSessionTtlMs();

  const banner = useMemo(() => {
    if (!isOnline) {
      return {
        type: 'warning',
        text: 'أنت الآن بدون إنترنت. سيتم استئناف التحديثات والاتصال اللحظي تلقائياً عند رجوع الشبكة.',
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
  }, [activeRequests, isOnline, ttl]);

  if (!banner) return null;
  return <div className={`app-status-banner ${banner.type}`}>{banner.text}</div>;
}
