import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../../store/appStore.js';

export default function OfflineExperience() {
  const isOnline = useAppStore((state) => state.isOnline);
  const queuedActions = useAppStore((state) => state.queuedActions);
  const [syncMessage, setSyncMessage] = useState('جاهز');

  useEffect(() => {
    const handleSent = () => setSyncMessage('تمت مزامنة عنصر من الطابور');
    const handleFailed = () => setSyncMessage('لا يزال هناك عناصر بانتظار الإرسال');
    window.addEventListener('yamshat:queued-message-sent', handleSent);
    window.addEventListener('yamshat:queued-message-failed', handleFailed);
    return () => {
      window.removeEventListener('yamshat:queued-message-sent', handleSent);
      window.removeEventListener('yamshat:queued-message-failed', handleFailed);
    };
  }, []);

  if (isOnline && queuedActions.length === 0) return null;

  return (
    <div className="offline-experience-shell card">
      <div style={{ display: 'grid', gap: 6 }}>
        <strong>{isOnline ? 'Background sync يعمل' : 'وضع عدم الاتصال مفعّل'}</strong>
        <div className="muted">
          {isOnline
            ? `يوجد ${queuedActions.length} عنصر بانتظار المزامنة. ${syncMessage}`
            : 'يمكنك متابعة التصفح، وسنرسل الرسائل والطلبات المؤجلة عند رجوع الشبكة.'}
        </div>
      </div>
      <div className="offline-actions-row">
        <Link to="/" className="offline-quick-link">الصفحة الرئيسية</Link>
        <Link to="/notifications" className="offline-quick-link">الإشعارات</Link>
        <Link to="/inbox" className="offline-quick-link">الرسائل</Link>
      </div>

      <style>{`
        .offline-experience-shell {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          margin: 12px 16px 0;
          border: 1px solid rgba(245,158,11,0.22);
          background: linear-gradient(135deg, rgba(15,23,42,0.95), rgba(30,41,59,0.95));
        }
        .offline-actions-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .offline-quick-link {
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.08);
        }
      `}</style>
    </div>
  );
}
