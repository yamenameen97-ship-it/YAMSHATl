import SparkMD5 from 'spark-md5';
import API from '../../api/axios.js';
import logger from '../../utils/logger.js';
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
import {
  createUploadPreview,
  isAudioFile,
  isImageFile,
  isVideoFile,
  prepareImageForUpload,
  prepareVideoForUpload,
  stageLabel,
} from './mediaProcessing.js';

const SESSION_PREFIX = 'yamshat-media-upload-v2';
const DEFAULT_RETRY_COUNT = 3;
const HASH_CHUNK_SIZE = 2 * 1024 * 1024;
const DEFAULT_CHUNK_SIZE = VIDEO_PRESET.chunkSizeBytes || 5 * 1024 * 1024;

const stagePercent = {
  validating: 4,
  preview: 10,
  editing: 16,
  optimizing: 24,
  compressing: 34,
  hashing: 40,
  preparing: 48,
  starting: 54,
  uploading: 88,
  finalizing: 96,
  done: 100,
};

function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function createAbortError(message = 'تم إلغاء العملية') {
  return new DOMException(message, 'AbortError');
}

function isAbortError(error) {
  return error?.name === 'AbortError' || error?.code === 'ERR_CANCELED' || /aborted|canceled|cancelled/i.test(String(error?.message || ''));
}

function shouldRetry(error) {
  if (isAbortError(error)) return false;
  const status = Number(error?.response?.status || 0);
  if (!status) return true;
  return [408, 409, 423, 425, 429, 500, 502, 503, 504].includes(status);
}

function readChunk(blob) {
  return blob.arrayBuffer();
}

function emitProgress(onProgress, payload = {}) {
  if (typeof onProgress !== 'function') return;
  const normalized = {
    ...payload,
    stageLabel: payload.stageLabel || stageLabel(payload.stage),
  };
  onProgress(normalized);
}

function sessionKey(fingerprint = '') {
  return `${SESSION_PREFIX}:${fingerprint}`;
}

function persistSession(fingerprint, payload) {
  if (typeof window === 'undefined' || !fingerprint) return;
  try {
    window.localStorage.setItem(sessionKey(fingerprint), JSON.stringify(payload));
  } catch {
    // ignore storage failures
  }
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
  try {
    window.localStorage.removeItem(sessionKey(fingerprint));
  } catch {
    // ignore cleanup failures
  }
}

function withUploadMetadata(base, extra = {}) {
  return {
    ...base,
    provider: MEDIA_PROVIDER,
    cdnBase: MEDIA_CDN_BASE,
    secureDelivery: {
      signed: MEDIA_SECURITY.signedUrls,
      expiring: MEDIA_SECURITY.expiringLinks,
      encryptedUpload: MEDIA_SECURITY.encryptedUploads,
    },
    ...extra,
  };
}

function normalizeUploadResponse(response, extra = {}) {
  const data = response?.data?.upload || response?.data || {};
  const rawUrl = data.media_url || data.url || data.file_url || data.path || '';
  const rawCdnUrl = data.cdn_url || data.cdnUrl || rawUrl;
  const mediaUrl = resolveMediaUrl(rawUrl);
  const cdnUrl = resolveMediaUrl(rawCdnUrl || rawUrl);
  return withUploadMetadata(
    {
      ...data,
      url: mediaUrl,
      mediaUrl,
      cdnUrl,
      manifest: extra.manifest || data.manifest,
    },
    extra,
  );
}

async function computeFingerprint(file, options = {}) {
  const { onProgress = () => {}, signal } = options;
  const totalChunks = Math.max(1, Math.ceil(file.size / HASH_CHUNK_SIZE));
  const spark = new SparkMD5.ArrayBuffer();

  for (let index = 0; index < totalChunks; index += 1) {
    if (signal?.aborted) throw createAbortError('تم إلغاء حساب البصمة');
    const start = index * HASH_CHUNK_SIZE;
    const end = Math.min(file.size, start + HASH_CHUNK_SIZE);
    const buffer = await readChunk(file.slice(start, end));
    spark.append(buffer);
    emitProgress(onProgress, {
      stage: 'hashing',
      percent: Math.min(stagePercent.preparing, stagePercent.hashing + Math.round(((index + 1) / totalChunks) * 8)),
      chunkIndex: index,
      totalChunks,
      loadedBytes: end,
      totalBytes: file.size,
    });
  }

  return spark.end();
}

async function requestWithRetry(executor, options = {}) {
  const retries = Number(options.retries ?? DEFAULT_RETRY_COUNT);
  let attempt = 0;
  let lastError = null;

  while (attempt <= retries) {
    try {
      return await executor(attempt);
    } catch (error) {
      lastError = error;
      if (!shouldRetry(error) || attempt >= retries) {
        throw error;
      }
      const delay = Math.min(6000, (2 ** attempt) * 400) + Math.floor(Math.random() * 200);
      emitProgress(options.onProgress, {
        stage: options.stage || 'uploading',
        percent: options.percent,
        retryAttempt: attempt + 1,
        retrying: true,
        message: `إعادة المحاولة خلال ${Math.round(delay / 100) / 10} ثانية`,
      });
      await sleep(delay);
      attempt += 1;
    }
  }

  throw lastError;
}

function buildManifest(file, category, purpose) {
  const baseSecurity = createUploadSecurityManifest(file, purpose);
  if (category === 'image') {
    return {
      category,
      provider: MEDIA_PROVIDER,
      optimize: true,
      webp: true,
      resize: IMAGE_PRESET.maxWidthOrHeight,
      resumable: file.size >= FILE_RULES.resumableThresholdBytes,
      cdn: Boolean(MEDIA_CDN_BASE),
      security: baseSecurity,
    };
  }
  if (category === 'video') {
    return {
      category,
      provider: MEDIA_PROVIDER,
      streaming: VIDEO_PRESET.streamingProfiles,
      requestedQualities: VIDEO_PRESET.qualities,
      thumbnails: VIDEO_PRESET.thumbnailCount,
      chunkUpload: true,
      resumable: true,
      cdn: Boolean(MEDIA_CDN_BASE),
      security: baseSecurity,
    };
  }
  if (category === 'audio') {
    return {
      category,
      provider: MEDIA_PROVIDER,
      streamingUpload: true,
      resumable: file.size >= FILE_RULES.resumableThresholdBytes,
      cdn: Boolean(MEDIA_CDN_BASE),
      security: baseSecurity,
    };
  }
  return {
    category: 'file',
    provider: MEDIA_PROVIDER,
    resumable: file.size >= FILE_RULES.resumableThresholdBytes,
    progressBar: true,
    resumeUpload: true,
    cdn: Boolean(MEDIA_CDN_BASE),
    security: baseSecurity,
  };
}

async function prepareUpload(file, options = {}) {
  const onProgress = options.onProgress || (() => {});
  const signal = options.signal;
  const purpose = options.purpose || 'media-upload';

  emitProgress(onProgress, { stage: 'validating', percent: stagePercent.validating, fileName: file.name });

  if (!file) throw new Error('الملف غير صالح');
  if (FILE_RULES.allowedMimeTypes.length && !FILE_RULES.allowedMimeTypes.includes(file.type)) {
    throw new Error(`نوع الملف ${file.type || 'غير معروف'} غير مدعوم`);
  }
  if (file.size > FILE_RULES.maxFileSizeBytes) {
    throw new Error(`حجم الملف يتجاوز الحد الأقصى ${Math.round(FILE_RULES.maxFileSizeBytes / (1024 * 1024))}MB`);
  }
  if (signal?.aborted) throw createAbortError();

  emitProgress(onProgress, { stage: 'preview', percent: stagePercent.preview, fileName: file.name });

  if (isImageFile(file)) {
    emitProgress(onProgress, { stage: options.imageEdits ? 'editing' : 'optimizing', percent: options.imageEdits ? stagePercent.editing : stagePercent.optimizing, fileName: file.name });
    const prepared = await prepareImageForUpload(file, {
      imageEdits: options.imageEdits,
      maxWidthOrHeight: options.maxWidthOrHeight,
      initialQuality: options.initialQuality,
      maxSizeMB: options.maxSizeMB,
    });
    return {
      file: prepared.file,
      preview: prepared.preview,
      manifest: buildManifest(prepared.file, 'image', purpose),
      mediaType: 'image',
      optimized: prepared.file !== file,
      editing: prepared.editResult || null,
      compression: prepared.compression,
    };
  }

  if (isVideoFile(file)) {
    emitProgress(onProgress, { stage: 'compressing', percent: stagePercent.compressing, fileName: file.name });
    const prepared = await prepareVideoForUpload(file, {
      enableCompression: options.enableVideoCompression !== false,
      compressionOptions: options.videoCompressionOptions,
    }, onProgress, signal);
    return {
      file: prepared.file,
      preview: prepared.preview,
      manifest: buildManifest(prepared.file, 'video', purpose),
      mediaType: 'video',
      optimized: prepared.compression?.compressed || false,
      compression: prepared.compression,
    };
  }

  if (isAudioFile(file)) {
    const preview = await createUploadPreview(file);
    return {
      file,
      preview,
      manifest: buildManifest(file, 'audio', purpose),
      mediaType: 'audio',
      optimized: false,
      compression: null,
    };
  }

  const preview = await createUploadPreview(file);
  return {
    file,
    preview,
    manifest: buildManifest(file, 'file', purpose),
    mediaType: 'file',
    optimized: false,
    compression: null,
  };
}

async function uploadSimple(file, manifest, options = {}) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('provider', MEDIA_PROVIDER);
  formData.append('manifest', JSON.stringify(manifest));
  Object.entries(options.extraFields || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    formData.append(key, typeof value === 'object' ? JSON.stringify(value) : value);
  });

  const response = await requestWithRetry(
    () => API.post(MEDIA_ENDPOINTS.simpleUpload, formData, {
      signal: options.signal,
      retryOnNetworkError: true,
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (event) => {
        const loaded = Number(event?.loaded || 0);
        const total = Number(event?.total || file.size || 0);
        const localPercent = total > 0 ? loaded / total : 0;
        const percent = Math.min(stagePercent.finalizing - 2, stagePercent.starting + Math.round(localPercent * (stagePercent.finalizing - stagePercent.starting - 2)));
        emitProgress(options.onProgress, {
          stage: 'uploading',
          percent,
          loadedBytes: loaded,
          totalBytes: total || file.size,
        });
      },
    }),
    {
      retries: options.retryCount,
      onProgress: options.onProgress,
      stage: 'uploading',
      percent: stagePercent.uploading,
    },
  );

  return normalizeUploadResponse(response, { manifest });
}

async function uploadResumable(file, fingerprint, manifest, options = {}) {
  const onProgress = options.onProgress || (() => {});
  const signal = options.signal;
  const chunkSize = Number(options.chunkSize || DEFAULT_CHUNK_SIZE);
  const totalChunks = Math.max(1, Math.ceil(file.size / chunkSize));
  let cached = readSession(fingerprint);
  let sessionId = cached?.sessionId || '';
  let uploadedChunks = Array.isArray(cached?.uploadedChunks) ? cached.uploadedChunks : [];

  emitProgress(onProgress, {
    stage: 'starting',
    percent: stagePercent.starting,
    resumed: Boolean(sessionId),
    totalChunks,
    loadedBytes: uploadedChunks.length * chunkSize,
    totalBytes: file.size,
  });

  if (!sessionId) {
    const startResponse = await requestWithRetry(
      () => API.post(MEDIA_ENDPOINTS.resumableStart, {
        filename: file.name,
        content_type: file.type || 'application/octet-stream',
        total_size: file.size,
        total_chunks: totalChunks,
        chunk_size: chunkSize,
        file_hash: fingerprint,
        provider: MEDIA_PROVIDER,
        manifest,
        ...(options.extraFields || {}),
      }, {
        signal,
        retryOnNetworkError: true,
      }),
      {
        retries: options.retryCount,
        onProgress,
        stage: 'starting',
        percent: stagePercent.starting,
      },
    );

    sessionId = startResponse?.data?.session_id || '';
    uploadedChunks = startResponse?.data?.uploaded_chunks || [];
    persistSession(fingerprint, {
      sessionId,
      fileName: file.name,
      totalChunks,
      uploadedChunks,
      manifest,
      updatedAt: Date.now(),
    });
  } else {
    try {
      const statusResponse = await API.get(`${MEDIA_ENDPOINTS.resumableStatus}/${sessionId}`, {
        signal,
        retryOnNetworkError: true,
      });
      uploadedChunks = statusResponse?.data?.uploaded_chunks || uploadedChunks;
    } catch (error) {
      logger.warn('Failed to restore resumable status, using cached chunks', {
        message: error?.message,
        sessionId,
      });
    }
  }

  const uploadedSet = new Set(uploadedChunks.map(Number));

  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex += 1) {
    if (signal?.aborted) throw createAbortError();
    if (uploadedSet.has(chunkIndex)) {
      const loadedBytes = Math.min(file.size, (chunkIndex + 1) * chunkSize);
      emitProgress(onProgress, {
        stage: 'uploading',
        percent: Math.min(stagePercent.finalizing - 2, stagePercent.starting + Math.round(((uploadedSet.size / totalChunks) * (stagePercent.finalizing - stagePercent.starting - 2)))),
        chunkIndex,
        totalChunks,
        resumed: true,
        loadedBytes,
        totalBytes: file.size,
      });
      continue;
    }

    const start = chunkIndex * chunkSize;
    const end = Math.min(file.size, start + chunkSize);
    const chunk = file.slice(start, end);

    await requestWithRetry(
      () => API.put(`${MEDIA_ENDPOINTS.resumableChunk}/${sessionId}/chunk/${chunkIndex}`, chunk, {
        signal,
        retryOnNetworkError: true,
        headers: {
          'Content-Type': 'application/octet-stream',
          'X-Chunk-Start': String(start),
          'X-Chunk-End': String(end),
          'X-File-Hash': fingerprint,
          'X-Chunk-Index': String(chunkIndex),
          'X-Total-Chunks': String(totalChunks),
        },
        onUploadProgress: (event) => {
          const eventLoaded = Number(event?.loaded || 0);
          const loadedBytes = Math.min(file.size, start + eventLoaded);
          const percentRatio = loadedBytes / Math.max(file.size, 1);
          emitProgress(onProgress, {
            stage: 'uploading',
            percent: Math.min(stagePercent.finalizing - 2, stagePercent.starting + Math.round(percentRatio * (stagePercent.finalizing - stagePercent.starting - 2))),
            chunkIndex,
            totalChunks,
            loadedBytes,
            totalBytes: file.size,
          });
        },
      }),
      {
        retries: options.retryCount,
        onProgress,
        stage: 'uploading',
      },
    );

    uploadedSet.add(chunkIndex);
    persistSession(fingerprint, {
      sessionId,
      fileName: file.name,
      totalChunks,
      uploadedChunks: Array.from(uploadedSet),
      manifest,
      updatedAt: Date.now(),
    });

    emitProgress(onProgress, {
      stage: 'uploading',
      percent: Math.min(stagePercent.finalizing - 2, stagePercent.starting + Math.round((uploadedSet.size / totalChunks) * (stagePercent.finalizing - stagePercent.starting - 2))),
      chunkIndex,
      totalChunks,
      loadedBytes: Math.min(file.size, end),
      totalBytes: file.size,
    });
  }

  emitProgress(onProgress, { stage: 'finalizing', percent: stagePercent.finalizing, loadedBytes: file.size, totalBytes: file.size, totalChunks });

  const response = await requestWithRetry(
    () => API.post(`${MEDIA_ENDPOINTS.resumableComplete}/${sessionId}/complete`, {
      file_hash: fingerprint,
      manifest,
      ...(options.extraFields || {}),
    }, {
      signal,
      retryOnNetworkError: true,
    }),
    {
      retries: options.retryCount,
      onProgress,
      stage: 'finalizing',
      percent: stagePercent.finalizing,
    },
  );

  clearSession(fingerprint);
  return normalizeUploadResponse(response, {
    manifest,
    resumed: Boolean(cached?.sessionId),
  });
}

export async function uploadManagedFile(file, options = {}) {
  const onProgress = options.onProgress || (() => {});
  const signal = options.signal;

  if (!file) {
    throw new Error('الملف غير موجود');
  }
  if (signal?.aborted) throw createAbortError();

  const prepared = await prepareUpload(file, {
    ...options,
    onProgress,
    signal,
  });

  if (signal?.aborted) throw createAbortError();

  emitProgress(onProgress, {
    stage: 'preparing',
    percent: stagePercent.preparing,
    fileName: prepared.file.name,
    totalBytes: prepared.file.size,
  });

  const fingerprint = await computeFingerprint(prepared.file, { onProgress, signal });

  const extraFields = {
    purpose: options.purpose || 'media-upload',
    original_filename: file.name,
    original_size: file.size,
    attachment_kind: prepared.mediaType,
    upload_security: prepared.manifest?.security || createUploadSecurityManifest(file, options.purpose || 'media-upload'),
  };

  if (prepared.preview?.thumbnailDataUrl) {
    extraFields.preview_thumbnail_ready = true;
  }

  const needsResumable = Boolean(options.forceResumable) || prepared.file.size >= FILE_RULES.resumableThresholdBytes || isVideoFile(prepared.file);
  const upload = needsResumable
    ? await uploadResumable(prepared.file, fingerprint, prepared.manifest, {
        onProgress,
        signal,
        retryCount: options.retryCount,
        extraFields,
        chunkSize: options.chunkSize,
      })
    : await uploadSimple(prepared.file, prepared.manifest, {
        onProgress,
        signal,
        retryCount: options.retryCount,
        extraFields,
      });

  emitProgress(onProgress, {
    stage: 'done',
    percent: stagePercent.done,
    fileName: prepared.file.name,
    loadedBytes: prepared.file.size,
    totalBytes: prepared.file.size,
  });

  return withUploadMetadata({
    ...upload,
    fingerprint,
    preparedFile: prepared.file,
    preview: prepared.preview,
    manifest: prepared.manifest,
    optimized: prepared.optimized,
    compression: prepared.compression,
    editing: prepared.editing,
    mediaType: prepared.mediaType,
    originalName: file.name,
    originalSize: file.size,
  });
}

export async function generatePreview(file) {
  return createUploadPreview(file);
}

export function clearResumableUpload(fingerprint) {
  clearSession(fingerprint);
}

export function getUploadStageLabel(stage) {
  return stageLabel(stage);
}

export function createUploadController() {
  return new AbortController();
}

export { isAbortError, createAbortError };
