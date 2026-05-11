const trim = (value) => String(value || '').trim();
const trimSlash = (value) => trim(value).replace(/\/+$/, '');

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

export const MEDIA_ENDPOINTS = {
  simpleUpload: readRuntime('APP_MEDIA_UPLOAD_URL') || readEnv('VITE_MEDIA_UPLOAD_URL') || '/upload',
  resumableStart: readRuntime('APP_MEDIA_RESUMABLE_START_URL') || readEnv('VITE_MEDIA_RESUMABLE_START_URL') || '/upload/resumable/start',
  resumableStatus: readRuntime('APP_MEDIA_RESUMABLE_STATUS_URL') || readEnv('VITE_MEDIA_RESUMABLE_STATUS_URL') || '/upload/resumable',
  resumableChunk: readRuntime('APP_MEDIA_RESUMABLE_CHUNK_URL') || readEnv('VITE_MEDIA_RESUMABLE_CHUNK_URL') || '/upload/resumable',
  resumableComplete: readRuntime('APP_MEDIA_RESUMABLE_COMPLETE_URL') || readEnv('VITE_MEDIA_RESUMABLE_COMPLETE_URL') || '/upload/resumable',
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
  streamingProfiles: ['hls'],
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

export function resolveMediaUrl(candidate = '') {
  const value = trim(candidate);
  if (!value) return '';
  if (/^(blob:|data:|https?:)/i.test(value)) return value;
  if (!MEDIA_CDN_BASE) return value;
  return `${MEDIA_CDN_BASE}/${value.replace(/^\/+/, '')}`;
}

export function currentMediaProviderLabel() {
  return PROVIDER_OPTIONS[MEDIA_PROVIDER]?.label || MEDIA_PROVIDER;
}
