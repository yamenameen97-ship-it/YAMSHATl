import {
  define_import_meta_env_default,
  init_define_import_meta_env
} from "./chunk-SOYW6UE7.js";

// src/config/mediaConfig.js
init_define_import_meta_env();
var trim = (value) => String(value || "").trim();
var trimSlash = (value) => trim(value).replace(/\/+$/, "");
var runtime = typeof window === "undefined" ? {} : window;
var readRuntime = (key, fallback = "") => trim(runtime?.[key] || fallback);
var readEnv = (key, fallback = "") => trim(define_import_meta_env_default[key] || fallback);
var MEDIA_PROVIDER = (readRuntime("APP_MEDIA_PROVIDER") || readRuntime("YAMSHAT_MEDIA_PROVIDER") || readEnv("VITE_MEDIA_PROVIDER") || "cloudflare-r2").toLowerCase();
var MEDIA_CDN_BASE = trimSlash(
  readRuntime("APP_CDN_BASE") || readRuntime("YAMSHAT_CDN_BASE") || readEnv("VITE_CDN_BASE") || "https://cdn.yamshat.com"
);
var SIGNED_URL_TTL_SECONDS = Number(
  readRuntime("APP_SIGNED_URL_TTL_SECONDS") || readRuntime("YAMSHAT_SIGNED_URL_TTL_SECONDS") || readEnv("VITE_SIGNED_URL_TTL_SECONDS") || 900
);
var MEDIA_SECURITY = {
  signedUrls: (readRuntime("APP_MEDIA_SIGNED_URLS") || readEnv("VITE_MEDIA_SIGNED_URLS") || "true") !== "false",
  expiringLinks: (readRuntime("APP_MEDIA_EXPIRING_LINKS") || readEnv("VITE_MEDIA_EXPIRING_LINKS") || "true") !== "false",
  encryptedUploads: (readRuntime("APP_MEDIA_ENCRYPT_UPLOADS") || readEnv("VITE_MEDIA_ENCRYPT_UPLOADS") || "true") !== "false",
  signatureKeyId: readRuntime("APP_MEDIA_KEY_ID") || readEnv("VITE_MEDIA_KEY_ID") || "frontend-edge-key"
};
var MEDIA_ENDPOINTS = {
  simpleUpload: readRuntime("APP_MEDIA_UPLOAD_URL") || readEnv("VITE_MEDIA_UPLOAD_URL") || "/upload",
  resumableStart: readRuntime("APP_MEDIA_RESUMABLE_START_URL") || readEnv("VITE_MEDIA_RESUMABLE_START_URL") || "/upload/resumable/start",
  resumableStatus: readRuntime("APP_MEDIA_RESUMABLE_STATUS_URL") || readEnv("VITE_MEDIA_RESUMABLE_STATUS_URL") || "/upload/resumable",
  resumableChunk: readRuntime("APP_MEDIA_RESUMABLE_CHUNK_URL") || readEnv("VITE_MEDIA_RESUMABLE_CHUNK_URL") || "/upload/resumable",
  resumableComplete: readRuntime("APP_MEDIA_RESUMABLE_COMPLETE_URL") || readEnv("VITE_MEDIA_RESUMABLE_COMPLETE_URL") || "/upload/resumable",
  signedUrl: readRuntime("APP_MEDIA_SIGNED_URL_ENDPOINT") || readEnv("VITE_MEDIA_SIGNED_URL_ENDPOINT") || "/media/sign-url"
};
var IMAGE_PRESET = {
  format: "image/webp",
  quality: Number(readRuntime("APP_IMAGE_QUALITY") || readEnv("VITE_IMAGE_QUALITY") || 0.82),
  maxWidthOrHeight: Number(readRuntime("APP_IMAGE_MAX_DIMENSION") || readEnv("VITE_IMAGE_MAX_DIMENSION") || 1920),
  maxSizeMB: Number(readRuntime("APP_IMAGE_MAX_SIZE_MB") || readEnv("VITE_IMAGE_MAX_SIZE_MB") || 4)
};
var VIDEO_PRESET = {
  chunkSizeBytes: Number(readRuntime("APP_VIDEO_CHUNK_SIZE") || readEnv("VITE_VIDEO_CHUNK_SIZE") || 5 * 1024 * 1024),
  qualities: (readRuntime("APP_VIDEO_QUALITIES") || readEnv("VITE_VIDEO_QUALITIES") || "1080,720,480").split(",").map((item) => Number(item.trim())).filter(Boolean),
  streamingProfiles: ["hls", "mp4-fallback"],
  thumbnailCount: Number(readRuntime("APP_VIDEO_THUMBNAIL_COUNT") || readEnv("VITE_VIDEO_THUMBNAIL_COUNT") || 1)
};
var FILE_RULES = {
  resumableThresholdBytes: Number(readRuntime("APP_MEDIA_RESUMABLE_THRESHOLD") || readEnv("VITE_MEDIA_RESUMABLE_THRESHOLD") || 5 * 1024 * 1024),
  maxFileSizeBytes: Number(readRuntime("APP_MEDIA_MAX_SIZE") || readEnv("VITE_MEDIA_MAX_SIZE") || 250 * 1024 * 1024),
  allowedMimeTypes: (readRuntime("APP_MEDIA_ALLOWED_TYPES") || readEnv("VITE_MEDIA_ALLOWED_TYPES") || "").split(",").map((item) => item.trim()).filter(Boolean)
};
var PROVIDER_OPTIONS = {
  "cloudflare-r2": {
    label: "Cloudflare R2",
    strengths: ["Storage", "Signed URLs", "S3 compatible API"]
  },
  "aws-s3": {
    label: "AWS S3",
    strengths: ["Multipart upload", "Lifecycle policies", "Transcoding integrations"]
  },
  "bunny-cdn": {
    label: "Bunny CDN",
    strengths: ["Global CDN", "Video streaming edge delivery", "Image optimizer"]
  }
};
var DISAPPEARING_MESSAGE_OPTIONS = [
  { value: 0, label: "\u0628\u062F\u0648\u0646" },
  { value: 30, label: "30 \u062B\u0627\u0646\u064A\u0629" },
  { value: 300, label: "5 \u062F\u0642\u0627\u0626\u0642" },
  { value: 3600, label: "\u0633\u0627\u0639\u0629" },
  { value: 86400, label: "24 \u0633\u0627\u0639\u0629" }
];
function buildSignedMediaUrl(candidate = "", options = {}) {
  const value = trim(candidate);
  if (!value || /^(blob:|data:)/i.test(value)) return value;
  const absolute = /^https?:/i.test(value) ? value : `${MEDIA_CDN_BASE}/${value.replace(/^\/+/, "")}`;
  if (!MEDIA_SECURITY.signedUrls) return absolute;
  const ttl = Number(options.expiresIn || SIGNED_URL_TTL_SECONDS);
  const expiresAt = Number(options.expiresAt || Math.floor(Date.now() / 1e3) + ttl);
  const signature = encodeURIComponent(options.signature || `edge-${MEDIA_SECURITY.signatureKeyId}`);
  const separator = absolute.includes("?") ? "&" : "?";
  if (/([?&])(sig|signature|token)=/i.test(absolute)) return absolute;
  return `${absolute}${separator}expires=${expiresAt}&sig=${signature}`;
}
function resolveMediaUrl(candidate = "", options = {}) {
  const value = trim(candidate);
  if (!value) return "";
  if (/^(blob:|data:|https?:)/i.test(value)) {
    return MEDIA_SECURITY.signedUrls ? buildSignedMediaUrl(value, options) : value;
  }
  const absolute = MEDIA_CDN_BASE ? `${MEDIA_CDN_BASE}/${value.replace(/^\/+/, "")}` : value;
  return MEDIA_SECURITY.signedUrls ? buildSignedMediaUrl(absolute, options) : absolute;
}
function createUploadSecurityManifest(file, purpose = "chat-attachment") {
  return {
    purpose,
    signed_urls: MEDIA_SECURITY.signedUrls,
    expiring_links: MEDIA_SECURITY.expiringLinks,
    encrypted_uploads: MEDIA_SECURITY.encryptedUploads,
    expires_in_seconds: SIGNED_URL_TTL_SECONDS,
    original_name: file?.name || "",
    original_type: file?.type || "application/octet-stream",
    original_size: Number(file?.size || 0)
  };
}
function currentMediaProviderLabel() {
  return PROVIDER_OPTIONS[MEDIA_PROVIDER]?.label || MEDIA_PROVIDER;
}

export {
  MEDIA_PROVIDER,
  MEDIA_CDN_BASE,
  SIGNED_URL_TTL_SECONDS,
  MEDIA_SECURITY,
  MEDIA_ENDPOINTS,
  IMAGE_PRESET,
  VIDEO_PRESET,
  FILE_RULES,
  DISAPPEARING_MESSAGE_OPTIONS,
  resolveMediaUrl,
  createUploadSecurityManifest,
  currentMediaProviderLabel
};
