import React from 'react';

/**
 * 🟢 LastActivityIndicator — مؤشر آخر نشاط لكل عضو
 * يعرض حالة المستخدم (متصل/غائب/مشغول/غير متصل) + آخر ظهور.
 *
 * Props:
 *  - status: 'online' | 'away' | 'busy' | 'offline'
 *  - lastSeen: Date | number | ISO string — آخر نشاط
 *  - showLabel: boolean — إظهار النص النصي بجانب النقطة
 *  - size: 'sm' | 'md' | 'lg'
 */
export default function LastActivityIndicator({
  status = 'offline',
  lastSeen = null,
  showLabel = true,
  size = 'md',
  className = '',
}) {
  const sizeMap = { sm: 8, md: 10, lg: 14 };
  const dotSize = sizeMap[size] || 10;

  const labelFor = (s, last) => {
    if (s === 'online') return 'متصل الآن';
    if (s === 'away')   return 'بعيد';
    if (s === 'busy')   return 'مشغول';
    if (last) return formatLastSeen(last);
    return 'غير متصل';
  };

  const isRecent = (last) => {
    if (!last) return false;
    const t = typeof last === 'number' ? last : new Date(last).getTime();
    return Date.now() - t < 5 * 60 * 1000; // last 5 minutes
  };

  return (
    <span
      className={`last-seen ${isRecent(lastSeen) || status === 'online' ? 'recent' : ''} ${className}`}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
    >
      <span
        className={`status-dot ${status}`}
        style={{ width: dotSize, height: dotSize }}
        aria-label={status}
      />
      {showLabel && <span>{labelFor(status, lastSeen)}</span>}
    </span>
  );
}

function formatLastSeen(value) {
  const t = typeof value === 'number' ? value : new Date(value).getTime();
  const diffMs = Date.now() - t;
  const sec = Math.floor(diffMs / 1000);
  const min = Math.floor(sec / 60);
  const hr  = Math.floor(min / 60);
  const day = Math.floor(hr / 24);

  if (sec < 60)  return 'منذ ثوانٍ';
  if (min < 60)  return `قبل ${min} دقيقة`;
  if (hr  < 24)  return `قبل ${hr} ساعة`;
  if (day < 7)   return `قبل ${day} يوم`;
  try {
    return new Date(value).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' });
  } catch {
    return 'منذ فترة';
  }
}
