import { CDN_BASE } from '../api/config.js';

function normalize(url) {
  return String(url || '').trim();
}

function canUseUrl(value) {
  return /^https?:\/\//i.test(value);
}

function toAbsolute(url) {
  const value = normalize(url);
  if (!value) return '';
  if (canUseUrl(value) || value.startsWith('data:') || value.startsWith('blob:')) return value;
  if (typeof window === 'undefined') return value;
  try {
    return new URL(value, window.location.origin).toString();
  } catch {
    return value;
  }
}

function withParams(baseUrl, params) {
  try {
    const target = new URL(baseUrl);
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      target.searchParams.set(key, String(value));
    });
    return target.toString();
  } catch {
    return baseUrl;
  }
}

export function withCdnBase(url) {
  const absolute = toAbsolute(url);
  if (!absolute || !CDN_BASE || !absolute.startsWith('http')) return absolute;
  try {
    const parsed = new URL(absolute);
    return `${CDN_BASE.replace(/\/+$/, '')}${parsed.pathname}${parsed.search}`;
  } catch {
    return absolute;
  }
}

export function optimizeImageUrl(url, options = {}) {
  const absolute = withCdnBase(url);
  if (!absolute || absolute.startsWith('data:') || absolute.startsWith('blob:')) return absolute;
  if (/imagekit\.io/i.test(absolute)) {
    const width = options.width || 1280;
    const quality = options.quality || 80;
    return withParams(absolute, { tr: `w-${width},q-${quality},f-auto` });
  }
  if (/res\.cloudinary\.com/i.test(absolute)) {
    return absolute.replace('/upload/', `/upload/f_auto,q_auto${options.width ? `,w_${options.width}` : ''}/`);
  }
  return absolute;
}

export function optimizeVideoUrl(url, options = {}) {
  const absolute = withCdnBase(url);
  if (!absolute || absolute.startsWith('data:') || absolute.startsWith('blob:')) return absolute;
  if (/imagekit\.io/i.test(absolute)) {
    const quality = options.quality || 80;
    return withParams(absolute, { tr: `q-${quality}` });
  }
  if (/res\.cloudinary\.com/i.test(absolute)) {
    return absolute.replace('/upload/', `/upload/q_auto${options.width ? `,w_${options.width}` : ''}/`);
  }
  return absolute;
}
