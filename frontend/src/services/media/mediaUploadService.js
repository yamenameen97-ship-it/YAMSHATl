import imageCompression from 'browser-image-compression';
import SparkMD5 from 'spark-md5';
import API from '../../api/axios.js';
import logger from '../../utils/logger.js';
import { defaultRetryManager } from '../retryManager.js';
import {
  FILE_RULES,
  IMAGE_PRESET,
  MEDIA_CDN_BASE,
  MEDIA_ENDPOINTS,
  MEDIA_PROVIDER,
  MEDIA_SECURITY,
  VIDEO_PRESET,
  createUploadSecurityManifest,
  resolveMediaUrl,
} from '../../config/mediaConfig.js';

const SESSION_PREFIX = 'yamshat-media-upload';
const DEFAULT_CHUNK_SIZE = VIDEO_PRESET.chunkSizeBytes || 5 * 1024 * 1024;
const DEFAULT_MAX_CHUNK_RETRIES = 3;

const stagePercent = {
  validating: 5,
  optimizing: 20,
  hashing: 30,
  preparing: 35,
  uploading: 80,
  finalizing: 95,
  done: 100,
};

/**
 * إرجاع mime type أساسي بدون معلمات (مثل codecs).
 * مثال: "audio/webm;codecs=opus" → "audio/webm"
 */
function baseMime(type = '') {
  return String(type || '').split(';')[0].trim().toLowerCase();
}

function isImage(file) {
  return baseMime(file?.type).startsWith('image/');
}

function isVideo(file) {
  return baseMime(file?.type).startsWith('video/');
}

function isAudio(file) {
  return baseMime(file?.type).startsWith('audio/');
}

function extensionFor(type = '') {
  if (type === 'image/webp') return 'webp';
  if (type === 'audio/ogg') return 'ogg';
  if (type === 'audio/webm') return 'webm';
  return '';
}

function withExtension(name = 'upload', ext = '') {
  if (!ext) return name;
  const sanitized = String(name).replace(/\.[^/.]+$/, '');
  return `${sanitized}.${ext}`;
}

function sessionKey(fingerprint = '') {
  return `${SESSION_PREFIX}:${fingerprint}`;
}

function persistSession(fingerprint, payload) {
  if (typeof window === 'undefined' || !fingerprint) return;
  window.localStorage.setItem(sessionKey(fingerprint), JSON.stringify(payload));
}

function readSession(fingerprint) {
  if (typeof window === 'undefined' || !fingerprint) return null;
  try {
    const raw = window.localStorage.getItem(sessionKey(fingerprint));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function clearSession(fingerprint) {
  if (typeof window === 'undefined' || !fingerprint) return;
  window.localStorage.removeItem(sessionKey(fingerprint));
}

function emitProgress(onProgress, payload) {
  if (typeof onProgress !== 'function') return;
  onProgress(payload);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isAbortError(error) {
  return error?.name === 'AbortError' || error?.code === 'ERR_CANCELED' || /aborted|canceled|cancelled/i.test(String(error?.message || ''));
}

function throwIfAborted(signal) {
  if (signal?.aborted) {
    const error = new Error('تم إلغاء الرفع');
    error.name = 'AbortError';
    throw error;
  }
}

async function readChunkAsArrayBuffer(blob) {
  return blob.arrayBuffer();
}

async function computeFingerprint(file, onProgress = () => {}, signal) {
  const chunkSize = 2 * 1024 * 1024;
  const chunks = Math.max(1, Math.ceil(file.size / chunkSize));
  const spark = new SparkMD5.ArrayBuffer();

  for (let index = 0; index < chunks; index += 1) {
    throwIfAborted(signal);
    const start = index * chunkSize;
    const end = Math.min(file.size, start + chunkSize);
    const buffer = await readChunkAsArrayBuffer(file.slice(start, end));
    spark.append(buffer);
    emitProgress(onProgress, {
      stage: 'hashing',
      percent: Math.min(35, 25 + Math.round(((index + 1) / chunks) * 10)),
      chunkIndex: index,
      totalChunks: chunks,
      loadedBytes: end,
      totalBytes: file.size,
    });
  }

  return spark.end();
}

async function extractVideoThumbnail(file) {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    const source = URL.createObjectURL(file);
    video.src = source;
    video.playsInline = true;

    const cleanup = () => {
      URL.revokeObjectURL(source);
    };

    video.onloadeddata = () => {
      const canvas = document.createElement('canvas');
      canvas.width = Math.min(video.videoWidth || 640, 640);
      canvas.height = Math.max(1, Math.round((canvas.width / Math.max(video.videoWidth || 1, 1)) * Math.max(video.videoHeight || 1, 1)));
      const context = canvas.getContext('2d');
      if (!context) {
        cleanup();
        resolve(null);
        return;
      }
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        cleanup();
        if (!blob) {
          resolve(null);
          return;
        }
        resolve(new File([blob], withExtension(file.name, 'jpg'), { type: 'image/jpeg' }));
      }, 'image/jpeg', 0.82);
    };

    video.onerror = () => {
      cleanup();
      resolve(null);
    };
  });
}

function validateFile(file) {
  if (!file) {
    throw new Error('الملف غير صالح.');
  }
  if (FILE_RULES.allowedMimeTypes.length) {
    const fileType = baseMime(file.type);
    const allowedBase = FILE_RULES.allowedMimeTypes.map(baseMime);
    const isAllowed = allowedBase.includes(fileType)
      // سماح تلقائي لأي صوت مسجل إذا كانت الفئة audio/* مدرجة
      || (fileType.startsWith('audio/') && allowedBase.some((item) => item === 'audio/*' || item.startsWith('audio/')));
    if (!isAllowed) {
      throw new Error(`نوع الملف ${file.type || 'غير معروف'} غير مسموح.`);
    }
  }
  if (file.size > FILE_RULES.maxFileSizeBytes) {
    throw new Error(`حجم الملف أكبر من الحد المسموح (${Math.round(FILE_RULES.maxFileSizeBytes / (1024 * 1024))}MB).`);
  }
}

async function prepareImage(file, onProgress, signal) {
  throwIfAborted(signal);
  emitProgress(onProgress, { stage: 'optimizing', percent: stagePercent.optimizing, fileName: file.name, loadedBytes: 0, totalBytes: file.size });
  const optimized = await imageCompression(file, {
    maxSizeMB: IMAGE_PRESET.maxSizeMB,
    maxWidthOrHeight: IMAGE_PRESET.maxWidthOrHeight,
    useWebWorker: false,
    fileType: IMAGE_PRESET.format,
    initialQuality: IMAGE_PRESET.quality,
    alwaysKeepResolution: false,
    onProgress: (value) => {
      emitProgress(onProgress, {
        stage: 'optimizing',
        percent: Math.min(35, 10 + Math.round(value * 0.2)),
        fileName: file.name,
        loadedBytes: Math.round((Math.min(value, 100) / 100) * file.size),
        totalBytes: file.size,
      });
    },
  });

  throwIfAborted(signal);
  const renamed = new File([optimized], withExtension(file.name, extensionFor(IMAGE_PRESET.format)), {
    type: IMAGE_PRESET.format,
    lastModified: Date.now(),
  });

  return {
    file: renamed,
    manifest: {
      category: 'image',
      provider: MEDIA_PROVIDER,
      optimize: true,
      webp: true,
      resize: IMAGE_PRESET.maxWidthOrHeight,
      cdn: Boolean(MEDIA_CDN_BASE),
      security: createUploadSecurityManifest(file, 'image-upload'),
    },
  };
}

async function prepareVideo(file, onProgress, signal) {
  throwIfAborted(signal);
  emitProgress(onProgress, { stage: 'preparing', percent: stagePercent.preparing, fileName: file.name, loadedBytes: 0, totalBytes: file.size });
  const thumbnail = await extractVideoThumbnail(file);
  throwIfAborted(signal);
  return {
    file,
    thumbnail,
    manifest: {
      category: 'video',
      provider: MEDIA_PROVIDER,
      requestedQualities: VIDEO_PRESET.qualities,
      thumbnails: VIDEO_PRESET.thumbnailCount,
      streaming: VIDEO_PRESET.streamingProfiles,
      chunkUpload: true,
      cdn: Boolean(MEDIA_CDN_BASE),
      security: createUploadSecurityManifest(file, 'video-upload'),
    },
  };
}

async function prepareAudio(file, onProgress, signal) {
  throwIfAborted(signal);
  emitProgress(onProgress, { stage: 'preparing', percent: stagePercent.preparing, fileName: file.name, loadedBytes: 0, totalBytes: file.size });
  return {
    file,
    manifest: {
      category: 'audio',
      codec: file.type || 'audio/ogg',
      streamingUpload: true,
      cdn: Boolean(MEDIA_CDN_BASE),
      security: createUploadSecurityManifest(file, 'audio-upload'),
    },
  };
}

async function prepareGenericFile(file, onProgress, signal) {
  throwIfAborted(signal);
  emitProgress(onProgress, { stage: 'preparing', percent: stagePercent.preparing, fileName: file.name, loadedBytes: 0, totalBytes: file.size });
  return {
    file,
    manifest: {
      category: 'file',
      provider: MEDIA_PROVIDER,
      resumable: file.size >= FILE_RULES.resumableThresholdBytes,
      validation: true,
      progressBar: true,
      resumeUpload: true,
      security: createUploadSecurityManifest(file, 'file-upload'),
    },
  };
}

function normalizeUploadResponse(response, extra = {}) {
  const data = response?.data?.upload || response?.data || {};
  const rawUrl = data.media_url || data.url || data.file_url || data.path || '';
  const url = resolveMediaUrl(rawUrl);
  return {
    ...data,
    ...extra,
    url,
    mediaUrl: url,
    cdnUrl: url,
    provider: MEDIA_PROVIDER,
    cdnBase: MEDIA_CDN_BASE,
    secureDelivery: {
      signed: MEDIA_SECURITY.signedUrls,
      expiring: MEDIA_SECURITY.expiringLinks,
      encryptedUpload: MEDIA_SECURITY.encryptedUploads,
    },
  };
}

async function requestWithRetry(fn, { retries = DEFAULT_MAX_CHUNK_RETRIES, onRetry = () => {}, context = {} } = {}) {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (error) {
      if (isAbortError(error)) throw error;
      const retryable = defaultRetryManager.isRetryable(error, attempt);
      if (!retryable || attempt >= retries) throw error;
      const delayMs = defaultRetryManager.calculateDelay(attempt);
      attempt += 1;
      onRetry({ attempt, delayMs, error, context });
      await sleep(delayMs);
    }
  }
}

async function uploadSimple(file, manifest, onProgress, extraFields = {}, options = {}) {
  const signal = options?.signal;
  throwIfAborted(signal);
  const formData = new FormData();
  formData.append('file', file);
  formData.append('provider', MEDIA_PROVIDER);
  formData.append('manifest', JSON.stringify(manifest));
  Object.entries(extraFields || {}).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    formData.append(key, typeof value === 'object' ? JSON.stringify(value) : value);
  });

  const response = await requestWithRetry(() => API.post(MEDIA_ENDPOINTS.simpleUpload, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    signal,
    onUploadProgress: (event) => {
      const progress = event.total ? Math.round((event.loaded / event.total) * 100) : 0;
      emitProgress(onProgress, {
        stage: 'uploading',
        percent: Math.max(stagePercent.preparing, progress),
        loadedBytes: event.loaded,
        totalBytes: event.total || file.size,
      });
    },
  }), {
    retries: options?.retries ?? 2,
    onRetry: ({ attempt, delayMs }) => {
      emitProgress(onProgress, {
        stage: 'retrying',
        percent: Math.min(98, stagePercent.preparing + attempt),
        retryAttempt: attempt,
        retryDelayMs: delayMs,
        loadedBytes: 0,
        totalBytes: file.size,
      });
    },
    context: { type: 'simple-upload', fileName: file.name },
  });

  emitProgress(onProgress, { stage: 'done', percent: stagePercent.done, loadedBytes: file.size, totalBytes: file.size });
  return normalizeUploadResponse(response, { manifest });
}

async function uploadResumable(file, fingerprint, manifest, onProgress, extraFields = {}, options = {}) {
  const signal = options?.signal;
  const chunkSize = DEFAULT_CHUNK_SIZE;
  const totalChunks = Math.max(1, Math.ceil(file.size / chunkSize));
  let cached = readSession(fingerprint);
  let sessionId = cached?.sessionId || '';
  let uploadedChunks = cached?.uploadedChunks || [];

  throwIfAborted(signal);

  if (!sessionId) {
    try {
      const response = await requestWithRetry(() => API.post(MEDIA_ENDPOINTS.resumableStart, {
        filename: file.name,
        content_type: file.type || 'application/octet-stream',
        total_size: file.size,
        total_chunks: totalChunks,
        chunk_size: chunkSize,
        file_hash: fingerprint,
        provider: MEDIA_PROVIDER,
        manifest,
        ...extraFields,
      }, { signal }), {
        retries: options?.retries ?? 2,
        onRetry: ({ attempt, delayMs }) => emitProgress(onProgress, {
          stage: 'retrying',
          percent: stagePercent.preparing,
          retryAttempt: attempt,
          retryDelayMs: delayMs,
          totalBytes: file.size,
          loadedBytes: 0,
        }),
      });
      sessionId = response?.data?.session_id;
      uploadedChunks = response?.data?.uploaded_chunks || [];
      persistSession(fingerprint, { sessionId, uploadedChunks, fileName: file.name, totalChunks, updatedAt: Date.now() });
    } catch (error) {
      logger.warn('Resumable start failed, falling back to single upload', { message: error?.message, endpoint: MEDIA_ENDPOINTS.resumableStart });
      return uploadSimple(file, manifest, onProgress, extraFields, options);
    }
  } else {
    try {
      const status = await API.get(`${MEDIA_ENDPOINTS.resumableStatus}/${sessionId}`, { signal });
      uploadedChunks = status?.data?.uploaded_chunks || uploadedChunks;
    } catch {
      // keep cached state
    }
  }

  const uploadedSet = new Set(uploadedChunks);
  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex += 1) {
    throwIfAborted(signal);
    if (uploadedSet.has(chunkIndex)) {
      emitProgress(onProgress, {
        stage: 'uploading',
        percent: Math.round(((chunkIndex + 1) / totalChunks) * 100),
        chunkIndex,
        totalChunks,
        resumed: true,
        loadedBytes: Math.min(file.size, (chunkIndex + 1) * chunkSize),
        totalBytes: file.size,
      });
      continue;
    }

    const start = chunkIndex * chunkSize;
    const end = Math.min(file.size, start + chunkSize);
    const chunk = file.slice(start, end);

    await requestWithRetry(() => API.put(`${MEDIA_ENDPOINTS.resumableChunk}/${sessionId}/chunk/${chunkIndex}`, chunk, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'X-Chunk-Start': String(start),
        'X-Chunk-End': String(end),
        'X-File-Hash': fingerprint,
      },
      signal,
    }), {
      retries: options?.chunkRetries ?? DEFAULT_MAX_CHUNK_RETRIES,
      onRetry: ({ attempt, delayMs }) => emitProgress(onProgress, {
        stage: 'retrying',
        percent: Math.round((chunkIndex / totalChunks) * 100),
        chunkIndex,
        totalChunks,
        retryAttempt: attempt,
        retryDelayMs: delayMs,
        loadedBytes: start,
        totalBytes: file.size,
      }),
      context: { type: 'resumable-chunk', chunkIndex, fileName: file.name },
    });

    uploadedSet.add(chunkIndex);
    persistSession(fingerprint, {
      sessionId,
      uploadedChunks: Array.from(uploadedSet),
      fileName: file.name,
      totalChunks,
      updatedAt: Date.now(),
    });

    emitProgress(onProgress, {
      stage: 'uploading',
      percent: Math.round(((chunkIndex + 1) / totalChunks) * 100),
      chunkIndex,
      totalChunks,
      resumed: Boolean(cached?.sessionId),
      loadedBytes: end,
      totalBytes: file.size,
    });
  }

  throwIfAborted(signal);
  emitProgress(onProgress, { stage: 'finalizing', percent: stagePercent.finalizing, loadedBytes: file.size, totalBytes: file.size });
  const response = await requestWithRetry(() => API.post(`${MEDIA_ENDPOINTS.resumableComplete}/${sessionId}/complete`, {
    file_hash: fingerprint,
    manifest,
    ...extraFields,
  }, { signal }), {
    retries: options?.retries ?? 2,
    onRetry: ({ attempt, delayMs }) => emitProgress(onProgress, {
      stage: 'retrying',
      percent: stagePercent.finalizing,
      retryAttempt: attempt,
      retryDelayMs: delayMs,
      loadedBytes: file.size,
      totalBytes: file.size,
    }),
    context: { type: 'resumable-complete', fileName: file.name },
  });

  clearSession(fingerprint);
  emitProgress(onProgress, { stage: 'done', percent: stagePercent.done, loadedBytes: file.size, totalBytes: file.size });
  return normalizeUploadResponse(response, { manifest, resumed: Boolean(cached?.sessionId) });
}

class MediaUploadService {
  async prepareFile(file, onProgress = () => {}, options = {}) {
    validateFile(file);
    emitProgress(onProgress, { stage: 'validating', percent: stagePercent.validating, fileName: file.name, loadedBytes: 0, totalBytes: file.size });

    if (isImage(file)) return prepareImage(file, onProgress, options?.signal);
    if (isVideo(file)) return prepareVideo(file, onProgress, options?.signal);
    if (isAudio(file)) return prepareAudio(file, onProgress, options?.signal);
    return prepareGenericFile(file, onProgress, options?.signal);
  }

  async uploadFile(file, options = {}) {
    const onProgress = options?.onProgress || (() => {});
    const signal = options?.signal;
    throwIfAborted(signal);

    const prepared = await this.prepareFile(file, onProgress, { signal });
    throwIfAborted(signal);

    const fingerprint = await computeFingerprint(prepared.file, onProgress, signal);
    const extraFields = {
      purpose: options?.purpose || 'chat-attachment',
      original_filename: file.name,
      original_size: file.size,
      thumbnail_count: prepared.thumbnail ? 1 : 0,
      attachment_kind: isImage(file) ? 'image' : isVideo(file) ? 'video' : isAudio(file) ? 'audio' : 'file',
      upload_security: prepared.manifest?.security || createUploadSecurityManifest(file, options?.purpose || 'chat-attachment'),
      processing_profile: options?.processingProfile || options?.compressionPreset || '',
      wants_cdn: options?.useCdn ?? true,
    };

    if (prepared.thumbnail) {
      extraFields.thumbnail_manifest = {
        name: prepared.thumbnail.name,
        type: prepared.thumbnail.type,
        size: prepared.thumbnail.size,
      };
    }

    const requiresResumable = prepared.file.size >= FILE_RULES.resumableThresholdBytes || isVideo(prepared.file);
    const upload = requiresResumable
      ? await uploadResumable(prepared.file, fingerprint, prepared.manifest, onProgress, extraFields, {
        signal,
        retries: options?.retries,
        chunkRetries: options?.chunkRetries,
      })
      : await uploadSimple(prepared.file, prepared.manifest, onProgress, extraFields, {
        signal,
        retries: options?.retries,
      });

    return {
      ...upload,
      fingerprint,
      preparedFile: prepared.file,
      thumbnailFile: prepared.thumbnail || null,
      manifest: prepared.manifest,
      optimized: prepared.file !== file,
      mediaType: extraFields.attachment_kind,
      originalName: file.name,
      originalSize: file.size,
    };
  }

  async uploadVoiceNote(blob, options = {}) {
    // تطبيع: إزالة معلمات الكودك من mime type وتوليد اسم ملف بامتداد مناسب
    const rawType = baseMime(blob?.type) || 'audio/webm';
    const extByType = rawType.includes('ogg') ? 'ogg'
      : rawType.includes('mpeg') ? 'mp3'
      : rawType.includes('mp4') || rawType.includes('m4a') ? 'm4a'
      : rawType.includes('wav') ? 'wav'
      : 'webm';
    const fileName = options?.fileName || `voice-note-${Date.now()}.${extByType}`;
    const file = blob instanceof File
      ? new File([blob], blob.name || fileName, { type: rawType, lastModified: blob.lastModified || Date.now() })
      : new File([blob], fileName, { type: rawType });

    return this.uploadFile(file, {
      ...options,
      purpose: 'voice-note',
    });
  }

  validate(file) {
    validateFile(file);
    return true;
  }
}

export const mediaUploadService = new MediaUploadService();

// تصدير دالة uploadFile بشكل مستقل لدعم التوافق مع المكونات القديمة (مثل LiveStudio.jsx)
export const uploadFile = (file, optionsOrOnProgress) => {
  // دعم كل من (file, onProgress) و (file, { onProgress, ...options })
  const options = typeof optionsOrOnProgress === 'function'
    ? { onProgress: optionsOrOnProgress }
    : optionsOrOnProgress;
  return mediaUploadService.uploadFile(file, options);
};

export default mediaUploadService;
