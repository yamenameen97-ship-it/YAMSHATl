import { BACKEND_ORIGIN } from '../api/config.js';

const trim = (value) => String(value || '').trim();
const trimSlash = (value) => trim(value).replace(/\/+$/, '');
const isAbsoluteUrl = (value = '') => /^(blob:|data:|https?:)/i.test(trim(value));

// ✅ FIX: مسارات أصول الواجهة الأمامية (تُخدَم من frontend/public)
// يجب ألا تُمرَّر عبر BACKEND_ORIGIN وإلا ستعيد 404 من الباكيند.
const FRONTEND_STATIC_PREFIXES = ['/brand/', '/icons/', '/sounds/', '/offline.html', '/manifest.webmanifest'];
const isFrontendStaticPath = (path = '') => {
  const p = `/${String(path || '').replace(/^\/+/, '').toLowerCase()}`;
  return FRONTEND_STATIC_PREFIXES.some((prefix) => p.startsWith(prefix));
};

// Liste de domaines obsolètes qui ont migré vers le backend actuel.
// Toute URL pointant vers ces hôtes est réécrite vers BACKEND_ORIGIN courant,
// ce qui évite les 404 répétés sur les anciennes images stockées en base.
const LEGACY_HOSTS = ['yamshat8.onrender.com', 'yamshat.onrender.com', 'yamshat-backend.onrender.com'];

const rewriteKnownBrokenBrandAsset = (value = '') => {
  const cleaned = trim(value);
  if (!cleaned) return cleaned;

  try {
    const pathname = isAbsoluteUrl(cleaned) ? new URL(cleaned).pathname : cleaned;
    // ✅ FIX: إعادة كتابة شعارات yamshat المكسورة في uploads أو brand إلى مسار محلي
    // يخدمه frontend مباشرة (بدون BACKEND_ORIGIN) لتجنب 404 المتكررة.
    if (/^(?:\/)?uploads\/.+yamshat-logo\.(?:png|jpe?g|webp)$/i.test(pathname.replace(/^\/+/, ''))
        || /^(?:\/)?brand\/yamshat-logo\.(?:png|jpe?g|webp)$/i.test(pathname.replace(/^\/+/, ''))) {
      return '__FRONTEND__/brand/yamshat-logo.jpg';
    }
    // ✅ FIX (2026-06): إعادة كتابة logo192.png المكسور (uploads/<hash>_logo192.png) إلى الأصل المحلي
    if (/(?:^|\/)uploads\/.+logo192\.png$/i.test(pathname)
        || /(?:^|\/)logo192\.png$/i.test(pathname)) {
      return '__FRONTEND__/logo192.png';
    }
  } catch {
    // ignore URL parsing errors and fall back to original value
  }

  return cleaned;
};

const rewriteLegacyHost = (value = '') => {
  const cleaned = trim(value);
  if (!cleaned || !isAbsoluteUrl(cleaned) || /^(blob:|data:)/i.test(cleaned)) return cleaned;
  try {
    const parsed = new URL(cleaned);
    if (LEGACY_HOSTS.includes(parsed.hostname.toLowerCase())) {
      const target = MEDIA_CDN_BASE || BACKEND_ORIGIN;
      if (target) {
        const base = new URL(trimSlash(target));
        parsed.host = base.host;
        parsed.protocol = base.protocol;
        parsed.port = base.port;
        return parsed.toString();
      }
    }
    return cleaned;
  } catch {
    return cleaned;
  }
};

const toAbsoluteMediaUrl = (value = '') => {
  const cleaned = trim(value);
  if (!cleaned) return '';
  // ✅ FIX: علامة __FRONTEND__ تعني صرفه من واجهة الفرونت محلياً (نفس الأصل)
  if (cleaned.startsWith('__FRONTEND__/')) {
    return `/${cleaned.replace(/^__FRONTEND__\/+/, '')}`;
  }
  if (isAbsoluteUrl(cleaned)) return rewriteLegacyHost(cleaned);
  const normalizedPath = `/${cleaned.replace(/^\/+/, '')}`;
  // ✅ FIX: أصول الواجهة الأمامية (شعارات، أيقونات، أصوات) تُخدَم من نفس الأصل
  if (isFrontendStaticPath(normalizedPath)) return normalizedPath;
  if (MEDIA_CDN_BASE) return `${MEDIA_CDN_BASE}${normalizedPath}`;
  if (BACKEND_ORIGIN) return `${trimSlash(BACKEND_ORIGIN)}${normalizedPath}`;
  return normalizedPath;
};

const runtime = typeof window === 'undefined' ? {} : window;
const readRuntime = (key, fallback = '') => trim(runtime?.[key] || fallback);
const readEnv = (key, fallback = '') => trim(import.meta.env[key] || fallback);

export const MEDIA_PROVIDER = (
  readRuntime('APP_MEDIA_PROVIDER') ||
  readRuntime('YAMSHAT_MEDIA_PROVIDER') ||
  readEnv('VITE_MEDIA_PROVIDER') ||
  'cloudflare-r2'
).toLowerCase();

export const MEDIA_CDN_BASE = trimSlash(
  readRuntime('APP_CDN_BASE') ||
  readRuntime('YAMSHAT_CDN_BASE') ||
  readEnv('VITE_CDN_BASE') ||
  ''
);

export const SIGNED_URL_TTL_SECONDS = Number(
  readRuntime('APP_SIGNED_URL_TTL_SECONDS') ||
  readRuntime('YAMSHAT_SIGNED_URL_TTL_SECONDS') ||
  readEnv('VITE_SIGNED_URL_TTL_SECONDS') ||
  900
);

export const MEDIA_SECURITY = {
  signedUrls: (readRuntime('APP_MEDIA_SIGNED_URLS') || readEnv('VITE_MEDIA_SIGNED_URLS') || 'false') === 'true',
  expiringLinks: (readRuntime('APP_MEDIA_EXPIRING_LINKS') || readEnv('VITE_MEDIA_EXPIRING_LINKS') || 'false') === 'true',
  encryptedUploads: (readRuntime('APP_MEDIA_ENCRYPT_UPLOADS') || readEnv('VITE_MEDIA_ENCRYPT_UPLOADS') || 'false') === 'true',
  signatureKeyId: readRuntime('APP_MEDIA_KEY_ID') || readEnv('VITE_MEDIA_KEY_ID') || '',
};

export const MEDIA_ENDPOINTS = {
  simpleUpload: readRuntime('APP_MEDIA_UPLOAD_URL') || readEnv('VITE_MEDIA_UPLOAD_URL') || '/upload',
  resumableStart: readRuntime('APP_MEDIA_RESUMABLE_START_URL') || readEnv('VITE_MEDIA_RESUMABLE_START_URL') || '/upload/resumable/start',
  resumableStatus: readRuntime('APP_MEDIA_RESUMABLE_STATUS_URL') || readEnv('VITE_MEDIA_RESUMABLE_STATUS_URL') || '/upload/resumable',
  resumableChunk: readRuntime('APP_MEDIA_RESUMABLE_CHUNK_URL') || readEnv('VITE_MEDIA_RESUMABLE_CHUNK_URL') || '/upload/resumable',
  resumableComplete: readRuntime('APP_MEDIA_RESUMABLE_COMPLETE_URL') || readEnv('VITE_MEDIA_RESUMABLE_COMPLETE_URL') || '/upload/resumable',
  signedUrl: readRuntime('APP_MEDIA_SIGNED_URL_ENDPOINT') || readEnv('VITE_MEDIA_SIGNED_URL_ENDPOINT') || '/media/sign-url',
};

export const IMAGE_PRESET = {
  format: 'image/webp',
  quality: Number(readRuntime('APP_IMAGE_QUALITY') || readEnv('VITE_IMAGE_QUALITY') || 0.82),
  maxWidthOrHeight: Number(readRuntime('APP_IMAGE_MAX_DIMENSION') || readEnv('VITE_IMAGE_MAX_DIMENSION') || 1920),
  maxSizeMB: Number(readRuntime('APP_IMAGE_MAX_SIZE_MB') || readEnv('VITE_IMAGE_MAX_SIZE_MB') || 4),
};

export const VIDEO_PRESET = {
  chunkSizeBytes: Number(readRuntime('APP_VIDEO_CHUNK_SIZE') || readEnv('VITE_VIDEO_CHUNK_SIZE') || 5 * 1024 * 1024),
  qualities: (readRuntime('APP_VIDEO_QUALITIES') || readEnv('VITE_VIDEO_QUALITIES') || '1080,720,480')
    .split(',')
    .map((item) => Number(item.trim()))
    .filter(Boolean),
  streamingProfiles: ['hls', 'mp4-fallback'],
  thumbnailCount: Number(readRuntime('APP_VIDEO_THUMBNAIL_COUNT') || readEnv('VITE_VIDEO_THUMBNAIL_COUNT') || 1),
};

export const FILE_RULES = {
  resumableThresholdBytes: Number(readRuntime('APP_MEDIA_RESUMABLE_THRESHOLD') || readEnv('VITE_MEDIA_RESUMABLE_THRESHOLD') || 5 * 1024 * 1024),
  maxFileSizeBytes: Number(readRuntime('APP_MEDIA_MAX_SIZE') || readEnv('VITE_MEDIA_MAX_SIZE') || 250 * 1024 * 1024),
  allowedMimeTypes: (readRuntime('APP_MEDIA_ALLOWED_TYPES') || readEnv('VITE_MEDIA_ALLOWED_TYPES') || '').split(',').map((item) => item.trim()).filter(Boolean),
};

export const PROVIDER_OPTIONS = {
  'cloudflare-r2': {
    label: 'Cloudflare R2',
    strengths: ['Storage', 'Signed URLs', 'S3 compatible API'],
  },
  'aws-s3': {
    label: 'AWS S3',
    strengths: ['Multipart upload', 'Lifecycle policies', 'Transcoding integrations'],
  },
  'bunny-cdn': {
    label: 'Bunny CDN',
    strengths: ['Global CDN', 'Video streaming edge delivery', 'Image optimizer'],
  },
};

export const DISAPPEARING_MESSAGE_OPTIONS = [
  { value: 0, label: 'بدون' },
  { value: 30, label: '30 ثانية' },
  { value: 300, label: '5 دقائق' },
  { value: 3600, label: 'ساعة' },
  { value: 86400, label: '24 ساعة' },
];

export function buildSignedMediaUrl(candidate = '', options = {}) {
  const value = trim(candidate);
  if (!value || /^(blob:|data:)/i.test(value)) return value;
  const absolute = toAbsoluteMediaUrl(value);

  if (!MEDIA_SECURITY.signedUrls) return absolute;

  const ttl = Number(options.expiresIn || SIGNED_URL_TTL_SECONDS);
  const expiresAt = Number(options.expiresAt || Math.floor(Date.now() / 1000) + ttl);
  const signature = encodeURIComponent(options.signature || `edge-${MEDIA_SECURITY.signatureKeyId}`);
  const separator = absolute.includes('?') ? '&' : '?';
  if (/([?&])(sig|signature|token)=/i.test(absolute)) return absolute;
  return `${absolute}${separator}expires=${expiresAt}&sig=${signature}`;
}

export function resolveMediaUrl(candidate = '', options = {}) {
  const value = trim(candidate);
  if (!value) return '';
  const repairedValue = rewriteKnownBrokenBrandAsset(value);
  const absolute = isAbsoluteUrl(repairedValue) ? rewriteLegacyHost(repairedValue) : toAbsoluteMediaUrl(repairedValue);
  return MEDIA_SECURITY.signedUrls ? buildSignedMediaUrl(absolute, options) : absolute;
}

export function createUploadSecurityManifest(file, purpose = 'chat-attachment') {
  return {
    purpose,
    signed_urls: MEDIA_SECURITY.signedUrls,
    expiring_links: MEDIA_SECURITY.expiringLinks,
    encrypted_uploads: MEDIA_SECURITY.encryptedUploads,
    expires_in_seconds: SIGNED_URL_TTL_SECONDS,
    original_name: file?.name || '',
    original_type: file?.type || 'application/octet-stream',
    original_size: Number(file?.size || 0),
  };
}

export function currentMediaProviderLabel() {
  return PROVIDER_OPTIONS[MEDIA_PROVIDER]?.label || MEDIA_PROVIDER;
}
