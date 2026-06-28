export function initialsFromName(value = '') {
  const clean = String(value || '').trim();
  if (!clean) return 'Y';
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
}

export function avatarGradient(seed = '') {
  const palette = [
    'linear-gradient(135deg, #8b5cf6, #6d28d9)',
    'linear-gradient(135deg, #ec4899, #8b5cf6)',
    'linear-gradient(135deg, #06b6d4, #3b82f6)',
    'linear-gradient(135deg, #22c55e, #14b8a6)',
    'linear-gradient(135deg, #f97316, #ef4444)',
    'linear-gradient(135deg, #f59e0b, #eab308)',
  ];
  const text = String(seed || 'yamshat');
  let total = 0;
  for (const char of text) total += char.charCodeAt(0);
  return palette[total % palette.length];
}

export function formatCompactNumber(value = 0) {
  const number = Number(value || 0);
  if (number >= 1_000_000) return `${(number / 1_000_000).toFixed(number >= 10_000_000 ? 0 : 1)}M`;
  if (number >= 1_000) return `${(number / 1_000).toFixed(number >= 10_000 ? 0 : 1)}K`;
  return `${number}`;
}

export function formatClock(value) {
  if (!value) return '--:--';
  try {
    return new Date(value).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '--:--';
  }
}

export function formatTimeAgo(value) {
  if (!value) return 'الآن';
  try {
    const diffMs = Date.now() - new Date(value).getTime();
    const diffMin = Math.max(1, Math.floor(diffMs / 60000));
    if (diffMin < 60) return `منذ ${diffMin} دقيقة`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    const diffDays = Math.floor(diffHours / 24);
    return `منذ ${diffDays} يوم`;
  } catch {
    return 'الآن';
  }
}

export function formatLastSeen(value, isOnline = false) {
  if (isOnline) return 'نشط الآن';
  if (!value) return 'آخر ظهور غير متاح';
  try {
    const date = new Date(value);
    return `آخر ظهور ${date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}`;
  } catch {
    return 'آخر ظهور غير متاح';
  }
}

export function normalizeArray(value, fallback = []) {
  return Array.isArray(value) ? value : fallback;
}

export function statusTicks(status = 'sent') {
  if (status === 'seen') return '✓✓';
  if (status === 'delivered') return '✓✓';
  if (status === 'sending') return '◌';
  return '✓';
}

export function statusColor(status = 'sent') {
  if (status === 'seen') return '#60a5fa';
  if (status === 'delivered') return 'rgba(255,255,255,0.82)';
  if (status === 'sending') return 'rgba(255,255,255,0.5)';
  return 'rgba(255,255,255,0.68)';
}
