import logger from '../../utils/logger.js';

const IMAGE_PREVIEW_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const VIDEO_PREVIEW_TYPES = new Set(['video/mp4', 'video/webm', 'video/quicktime', 'video/ogg']);

export function formatBytes(bytes = 0) {
  const value = Number(bytes || 0);
  if (!value) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  return `${(value / (1024 ** index)).toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
}

export function formatSpeed(bytesPerSecond = 0) {
  if (!bytesPerSecond || bytesPerSecond <= 0) return '—';
  return `${formatBytes(bytesPerSecond)}/ث`;
}

export function formatEta(seconds = 0) {
  const value = Math.max(0, Math.round(Number(seconds || 0)));
  if (!value) return 'ثوانٍ';
  if (value < 60) return `${value} ث`;
  const minutes = Math.floor(value / 60);
  const remain = value % 60;
  if (minutes < 60) return remain ? `${minutes} د ${remain} ث` : `${minutes} د`;
  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;
  return restMinutes ? `${hours} س ${restMinutes} د` : `${hours} س`;
}

export function revokeObjectUrl(url = '') {
  if (!url || typeof URL === 'undefined' || !String(url).startsWith('blob:')) return;
  try {
    URL.revokeObjectURL(url);
  } catch {
    // ignore revoke failures
  }
}

function readImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(String(event?.target?.result || ''));
    reader.onerror = () => reject(new Error('تعذر قراءة الصورة'));
    reader.readAsDataURL(file);
  });
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('تعذر تحميل الصورة للمعالجة'));
    image.src = source;
  });
}

export async function buildImagePreview(file) {
  if (!IMAGE_PREVIEW_TYPES.has(file?.type)) return null;
  const dataUrl = await readImage(file);
  const image = await loadImage(dataUrl);
  return {
    kind: 'image',
    dataUrl,
    width: image.width,
    height: image.height,
    aspectRatio: image.width / Math.max(image.height, 1),
  };
}

export async function buildVideoPreview(file) {
  if (!VIDEO_PREVIEW_TYPES.has(file?.type)) return null;
  const objectUrl = URL.createObjectURL(file);
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.playsInline = true;
    video.muted = true;
    video.src = objectUrl;

    const cleanup = () => {
      video.pause?.();
    };

    video.onloadeddata = () => {
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.min(video.videoWidth || 720, 720));
      canvas.height = Math.max(1, Math.round((canvas.width / Math.max(video.videoWidth || 1, 1)) * Math.max(video.videoHeight || 1, 1)));
      const context = canvas.getContext('2d');
      if (!context) {
        cleanup();
        resolve({ kind: 'video', objectUrl, duration: Number(video.duration || 0), width: video.videoWidth || 0, height: video.videoHeight || 0, thumbnailUrl: '' });
        return;
      }
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.82);
      cleanup();
      resolve({
        kind: 'video',
        objectUrl,
        thumbnailUrl,
        duration: Number(video.duration || 0),
        width: video.videoWidth || 0,
        height: video.videoHeight || 0,
      });
    };

    video.onerror = () => {
      cleanup();
      resolve({ kind: 'video', objectUrl, duration: 0, width: 0, height: 0, thumbnailUrl: '' });
    };
  });
}

export async function buildFilePreview(file) {
  if (!file) return null;
  if (String(file.type || '').startsWith('image/')) return buildImagePreview(file);
  if (String(file.type || '').startsWith('video/')) return buildVideoPreview(file);
  return {
    kind: 'file',
    extension: file.name?.split('.').pop()?.toLowerCase() || '',
  };
}

export function defaultCropState(preview = null) {
  const ratio = Number(preview?.aspectRatio || 1);
  return {
    zoom: 1,
    offsetX: 0,
    offsetY: 0,
    aspect: ratio > 1.4 ? '16:9' : ratio < 0.9 ? '4:5' : '1:1',
  };
}

function cropAspectValue(aspect = '1:1') {
  if (aspect === '16:9') return 16 / 9;
  if (aspect === '4:5') return 4 / 5;
  if (aspect === '9:16') return 9 / 16;
  return 1;
}

export async function cropImageFile(file, crop = {}, options = {}) {
  const preview = await buildImagePreview(file);
  if (!preview?.dataUrl) return file;
  const image = await loadImage(preview.dataUrl);
  const zoom = Math.min(Math.max(Number(crop.zoom || 1), 1), 3);
  const aspectRatio = cropAspectValue(crop.aspect || '1:1');
  const baseWidth = image.width / zoom;
  const baseHeight = baseWidth / aspectRatio;
  const finalHeight = Math.min(baseHeight, image.height / zoom);
  const finalWidth = finalHeight * aspectRatio;
  const maxOffsetX = Math.max(0, (image.width - finalWidth) / 2);
  const maxOffsetY = Math.max(0, (image.height - finalHeight) / 2);
  const offsetX = Math.max(-1, Math.min(1, Number(crop.offsetX || 0))) * maxOffsetX;
  const offsetY = Math.max(-1, Math.min(1, Number(crop.offsetY || 0))) * maxOffsetY;
  const sx = Math.max(0, (image.width - finalWidth) / 2 + offsetX);
  const sy = Math.max(0, (image.height - finalHeight) / 2 + offsetY);

  const outputWidth = Number(options.outputWidth || 1080);
  const outputHeight = Math.max(1, Math.round(outputWidth / aspectRatio));
  const canvas = document.createElement('canvas');
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const context = canvas.getContext('2d');
  if (!context) return file;
  context.drawImage(image, sx, sy, finalWidth, finalHeight, 0, 0, outputWidth, outputHeight);

  const mimeType = options.mimeType || (file.type === 'image/png' ? 'image/png' : 'image/jpeg');
  const quality = Number(options.quality || 0.9);

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((nextBlob) => {
      if (!nextBlob) {
        reject(new Error('فشل إنشاء الصورة المقصوصة'));
        return;
      }
      resolve(nextBlob);
    }, mimeType, quality);
  });

  const extension = mimeType === 'image/png' ? 'png' : 'jpg';
  const croppedName = `${String(file.name || 'image').replace(/\.[^.]+$/, '')}-cropped.${extension}`;
  return new File([blob], croppedName, { type: mimeType, lastModified: Date.now() });
}

function getSupportedRecorderMimeType() {
  if (typeof MediaRecorder === 'undefined') return '';
  const candidates = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
  return candidates.find((type) => MediaRecorder.isTypeSupported?.(type)) || '';
}

function compressionPresetToBps(preset = 'balanced') {
  if (preset === 'light') return 2_800_000;
  if (preset === 'strong') return 1_200_000;
  return 1_900_000;
}

export async function compressVideoFile(file, options = {}) {
  const { enabled = true, preset = 'balanced', onProgress = () => {} } = options;
  if (!enabled || !String(file?.type || '').startsWith('video/')) return file;
  if (typeof document === 'undefined' || typeof MediaRecorder === 'undefined') return file;

  const recorderMimeType = getSupportedRecorderMimeType();
  if (!recorderMimeType) return file;

  const sourceUrl = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.src = sourceUrl;
  video.playsInline = true;
  video.crossOrigin = 'anonymous';
  video.muted = false;
  video.preload = 'auto';

  try {
    await new Promise((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error('تعذر تحميل الفيديو قبل الضغط'));
    });

    const captureStream = video.captureStream?.bind(video) || video.mozCaptureStream?.bind(video);
    if (!captureStream) return file;
    const stream = captureStream();
    const chunks = [];

    const recorder = new MediaRecorder(stream, {
      mimeType: recorderMimeType,
      videoBitsPerSecond: compressionPresetToBps(preset),
      audioBitsPerSecond: 96_000,
    });

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) chunks.push(event.data);
    };

    const completed = new Promise((resolve, reject) => {
      recorder.onstop = () => resolve();
      recorder.onerror = () => reject(new Error('فشل ضغط الفيديو أثناء التسجيل'));
    });

    video.ontimeupdate = () => {
      const duration = Math.max(Number(video.duration || 0), 1);
      const percent = Math.min(99, Math.round((video.currentTime / duration) * 100));
      onProgress({ stage: 'compressing-video', percent, currentTime: video.currentTime, duration });
    };

    recorder.start(1000);
    await video.play();
    await new Promise((resolve) => {
      video.onended = () => resolve();
    });
    if (recorder.state !== 'inactive') recorder.stop();
    await completed;

    const blob = new Blob(chunks, { type: recorderMimeType.split(';')[0] || 'video/webm' });
    if (!blob.size || blob.size >= file.size * 0.98) return file;

    onProgress({ stage: 'compressing-video', percent: 100 });
    const outputName = `${String(file.name || 'video').replace(/\.[^.]+$/, '')}.webm`;
    return new File([blob], outputName, { type: 'video/webm', lastModified: Date.now() });
  } catch (error) {
    logger.warn('Video compression fallback to original file', { message: error?.message, fileName: file?.name });
    return file;
  } finally {
    revokeObjectUrl(sourceUrl);
    try {
      video.pause?.();
    } catch {
      // ignore
    }
  }
}

export function createProgressTracker(initialTotalBytes = 0) {
  let startedAt = 0;
  let lastLoadedBytes = 0;
  let lastTimestamp = 0;

  return function withMetrics(payload = {}) {
    const totalBytes = Number(payload.totalBytes || payload.total || initialTotalBytes || 0);
    const loadedBytes = Number(payload.loadedBytes || payload.loaded || 0);
    const now = Date.now();

    if (!startedAt) startedAt = now;
    if (!lastTimestamp) {
      lastTimestamp = now;
      lastLoadedBytes = loadedBytes;
    }

    const deltaBytes = Math.max(0, loadedBytes - lastLoadedBytes);
    const deltaTime = Math.max(1, now - lastTimestamp);
    const speedBps = deltaBytes > 0 ? (deltaBytes / deltaTime) * 1000 : Number(payload.speedBps || 0);
    const remainingBytes = Math.max(0, totalBytes - loadedBytes);
    const etaSeconds = speedBps > 0 ? Math.round(remainingBytes / speedBps) : Number(payload.etaSeconds || 0);

    lastLoadedBytes = loadedBytes;
    lastTimestamp = now;

    return {
      ...payload,
      totalBytes,
      loadedBytes,
      speedBps,
      etaSeconds,
      elapsedMs: now - startedAt,
    };
  };
}

export function createManagedUploadTask(file, uploadFn, options = {}) {
  const controller = new AbortController();
  const toMetrics = createProgressTracker(file?.size || 0);
  const promise = uploadFn({
    signal: controller.signal,
    onProgress: (payload) => {
      options.onProgress?.(toMetrics(payload));
    },
  });

  return {
    controller,
    abort: () => controller.abort('user-cancelled'),
    promise,
  };
}
