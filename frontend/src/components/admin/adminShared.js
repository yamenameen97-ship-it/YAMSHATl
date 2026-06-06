export function toArray(value) {
  return Array.isArray(value) ? value : [];
}

export function formatCompactNumber(value, options = {}) {
  const number = Number(value || 0);
  if (!Number.isFinite(number)) return '0';
  if (options.currency) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: options.currencyCode || 'USD',
      maximumFractionDigits: 2,
    }).format(number);
  }
  return new Intl.NumberFormat('en-US', {
    notation: Math.abs(number) >= 1000 ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(number);
}

export function formatFullNumber(value) {
  const number = Number(value || 0);
  if (!Number.isFinite(number)) return '0';
  return new Intl.NumberFormat('en-US').format(number);
}

export function formatDateTime(value) {
  if (!value) return 'الآن';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'الآن';
  return date.toLocaleString('ar-EG', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTimeOnly(value) {
  if (!value) return 'الآن';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'الآن';
  return date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
}

export function sampleLineData() {
  return [];
}

export function sampleBarData() {
  return [];
}

export function sampleActivity() {
  return [];
}

export function getStatusTone(status) {
  const value = String(status || '').toLowerCase();
  if (['active', 'featured', 'live', 'healthy', 'linked', 'seen'].includes(value)) return 'success';
  if (['warning', 'pending', 'review', 'archived', 'draft'].includes(value)) return 'warning';
  if (['danger', 'critical', 'ended', 'ended_live', 'offline', 'banned'].includes(value)) return 'danger';
  return 'neutral';
}

export function statusLabel(status) {
  const value = String(status || '').toLowerCase();
  if (value === 'active') return 'نشط';
  if (value === 'featured') return 'مميز';
  if (value === 'live') return 'مباشر';
  if (value === 'healthy' || value === 'linked') return 'سليم';
  if (value === 'warning' || value === 'review') return 'مراجعة';
  if (value === 'pending') return 'قيد الانتظار';
  if (value === 'draft') return 'مسودة';
  if (value === 'archived') return 'مؤرشف';
  if (value === 'offline') return 'غير متصل';
  if (value === 'ended' || value === 'ended_live') return 'منتهي';
  if (value === 'danger' || value === 'critical') return 'خطر';
  if (value === 'banned') return 'محظور';
  if (value === 'seen') return 'مقروء';
  return status || '—';
}

export function buildDistribution(items) {
  return items.filter((item) => Number(item?.value || 0) > 0);
}
