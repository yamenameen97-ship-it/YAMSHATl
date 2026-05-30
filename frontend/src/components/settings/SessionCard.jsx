import { useState } from 'react';

export default function SessionCard({ session, onLogout }) {
  const [ended, setEnded] = useState(false);

  const handleLogout = () => {
    onLogout?.(session);
    setEnded(true);
    window.dispatchEvent(new CustomEvent('yamshat:toast', {
      detail: {
        type: 'info',
        title: ended ? 'تم إنهاء الجلسة مسبقًا' : 'تم إنهاء الجلسة',
        description: session?.device || session?.ip || 'تم تسجيل خروج الجهاز المحدد.',
      },
    }));
  };

  return (
    <div className="session-card">
      <h3>{session?.device || 'جلسة نشطة'}</h3>
      <p>{session?.ip || 'IP غير متوفر'}</p>
      <p>{session?.lastActivity || 'آخر نشاط غير متوفر'}</p>
      <button type="button" onClick={handleLogout} disabled={ended}>
        {ended ? 'تم إنهاء الجلسة' : 'Logout'}
      </button>
    </div>
  );
}
