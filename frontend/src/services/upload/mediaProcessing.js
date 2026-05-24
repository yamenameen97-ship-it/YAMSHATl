import imageCompression from 'browser-image-compression';
import {
  compressImageFile,
  generateBlurDataUrlFromImage,
  generateVideoThumbnail,
  readFileAsDataURL,
} from '../../utils/mediaToolkit.js';

const DEFAULT_IMAGE_OUTPUT_TYPE = 'image/webp';

function clamp(value, min, max) {
  return Math.min(Math.max(Number(value) || 0, min), max);
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('فشل تحميل الصورة للمعالجة'));
    image.src = source;
  });
}

function revokeObjectUrl(url) {
  if (!url || typeof url !== 'string' || !url.startsWith('blob:')) return;
  try {
    URL.revokeObjectURL(url);
  } catch {
    // ignore revoke failures
  }
}

function even(value) {
  const rounded = Math.max(2, Math.round(Number(value) || 2));
  return rounded % 2 === 0 ? rounded : rounded + 1;
}

export function isImageFile(file) {
  return Boolean(file?.type?.startsWith('image/'));
}

export function isVideoFile(file) {
  return Boolean(file?.type?.startsWith('video/'));
}

export function isAudioFile(file) {
  return Boolean(file?.type?.startsWith('audio/'));
}

export function stageLabel(stage = '') {
  const labels = {
    queued: 'في الانتظار',
    validating: 'جارٍ التحقق',
    preview: 'تجهيز المعاينة',
    editing: 'تطبيق التعديلات',
    optimizing: 'تحسين الملف',
    compressing: 'ضغط الوسائط',
    hashing: 'حساب البصمة',
    preparing: 'تجهيز الرفع',
    starting: 'بدء الجلسة',
    uploading: 'جارٍ الرفع',
    finalizing: 'إنهاء الرفع',
    done: 'اكتمل',
    error: 'فشل',
    cancelled: 'تم الإلغاء',
  };
  return labels[stage] || 'جارٍ التنفيذ';
}

export async function applyImageEdits(file, edits = {}) {
  if (!isImageFile(file)) return { file, edited: false, outputDataUrl: '' };

  const source = await readFileAsDataURL(file);
  const image = await loadImage(source);
  const naturalWidth = Math.max(1, Number(image.naturalWidth || image.width || 1));
  const naturalHeight = Math.max(1, Number(image.naturalHeight || image.height || 1));

  const aspectRatio = Number(edits.aspectRatio) > 0 ? Number(edits.aspectRatio) : naturalWidth / naturalHeight;
  const zoom = clamp(edits.zoom ?? 1, 1, 4);
  const offsetX = clamp(edits.offsetX ?? 0, -1, 1);
  const offsetY = clamp(edits.offsetY ?? 0, -1, 1);
  const brightness = clamp(edits.brightness ?? 100, 40, 180);
  const contrast = clamp(edits.contrast ?? 100, 40, 180);
  const saturation = clamp(edits.saturation ?? 100, 40, 200);
  const outputType = edits.outputType || (file.type === 'image/png' ? 'image/png' : DEFAULT_IMAGE_OUTPUT_TYPE);
  const quality = clamp(edits.quality ?? 0.9, 0.4, 1);
  const maxWidth = clamp(edits.maxWidth ?? 1920, 320, 4096);

  let cropWidth = naturalWidth;
  let cropHeight = cropWidth / aspectRatio;
  if (cropHeight > naturalHeight) {
    cropHeight = naturalHeight;
    cropWidth = cropHeight * aspectRatio;
  }

  cropWidth = cropWidth / zoom;
  cropHeight = cropHeight / zoom;

  const maxX = Math.max(0, naturalWidth - cropWidth);
  const maxY = Math.max(0, naturalHeight - cropHeight);
  const sourceX = clamp((maxX / 2) + (offsetX * maxX * 0.5), 0, maxX);
  const sourceY = clamp((maxY / 2) + (offsetY * maxY * 0.5), 0, maxY);

  const canvasWidth = even(Math.min(maxWidth, cropWidth));
  const canvasHeight = even(Math.round(canvasWidth / aspectRatio));
  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('المتصفح لا يدعم تعديل الصور عبر Canvas');
  }

  context.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
  context.drawImage(image, sourceX, sourceY, cropWidth, cropHeight, 0, 0, canvasWidth, canvasHeight);

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((nextBlob) => {
      if (nextBlob) {
        resolve(nextBlob);
        return;
      }
      reject(new Error('فشل إنشاء الصورة المعدلة'));
    }, outputType, quality);
  });

  const safeBaseName = String(file.name || 'image').replace(/\.[^.]+$/, '');
  const extension = outputType === 'image/png' ? 'png' : 'webp';
  const editedFile = new File([blob], `${safeBaseName}-edited.${extension}`, {
    type: outputType,
    lastModified: Date.now(),
  });

  return {
    file: editedFile,
    edited: true,
    outputDataUrl: canvas.toDataURL(outputType, quality),
    crop: {
      aspectRatio,
      zoom,
      offsetX,
      offsetY,
      brightness,
      contrast,
      saturation,
    },
  };
}

export async function createImagePreviewBundle(file, options = {}) {
  const previewUrl = options.preferObjectUrl ? URL.createObjectURL(file) : await readFileAsDataURL(file);
  const blurDataUrl = await generateBlurDataUrlFromImage(previewUrl, { size: 24 });
  return {
    previewUrl,
    blurDataUrl,
  };
}

export async function createVideoPreviewBundle(file) {
  const previewUrl = URL.createObjectURL(file);
  const thumbnail = await generateVideoThumbnail(file, { seekTo: 0.35, maxWidth: 640, quality: 0.84 });
  return {
    previewUrl,
    thumbnailDataUrl: thumbnail.thumbnailDataUrl,
    width: thumbnail.width,
    height: thumbnail.height,
    duration: thumbnail.duration,
  };
}

export async function createUploadPreview(file) {
  if (isImageFile(file)) {
    return {
      kind: 'image',
      ...(await createImagePreviewBundle(file)),
    };
  }

  if (isVideoFile(file)) {
    return {
      kind: 'video',
      ...(await createVideoPreviewBundle(file)),
    };
  }

  if (isAudioFile(file)) {
    return {
      kind: 'audio',
      previewUrl: URL.createObjectURL(file),
    };
  }

  return {
    kind: 'file',
    previewUrl: '',
  };
}

function readVideoMetadata(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    video.src = url;

    const cleanup = () => revokeObjectUrl(url);

    video.onloadedmetadata = () => {
      resolve({
        duration: Number(video.duration || 0),
        width: Number(video.videoWidth || 0),
        height: Number(video.videoHeight || 0),
        cleanup,
      });
    };

    video.onerror = () => {
      cleanup();
      reject(new Error('فشل قراءة بيانات الفيديو'));
    };
  });
}

function pickRecorderMimeType() {
  if (typeof MediaRecorder === 'undefined') return '';
  const candidates = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
  ];
  return candidates.find((candidate) => MediaRecorder.isTypeSupported(candidate)) || '';
}

export function canBrowserCompressVideo() {
  if (typeof window === 'undefined') return false;
  if (typeof MediaRecorder === 'undefined') return false;
  const canvas = document.createElement('canvas');
  const hasCanvasCapture = typeof canvas.captureStream === 'function';
  const probe = document.createElement('video');
  const hasVideoCapture = typeof probe.captureStream === 'function' || typeof probe.mozCaptureStream === 'function';
  return hasCanvasCapture && hasVideoCapture && Boolean(pickRecorderMimeType());
}

export async function compressVideoFile(file, options = {}, onProgress = () => {}, signal) {
  if (!isVideoFile(file)) {
    return {
      file,
      compressed: false,
      originalSize: Number(file?.size || 0),
      compressedSize: Number(file?.size || 0),
      savedBytes: 0,
      reason: 'not-video',
    };
  }

  const minSizeBytes = Number(options.minSizeBytes || 12 * 1024 * 1024);
  if (file.size < minSizeBytes) {
    return {
      file,
      compressed: false,
      originalSize: file.size,
      compressedSize: file.size,
      savedBytes: 0,
      reason: 'below-threshold',
    };
  }

  if (!canBrowserCompressVideo()) {
    return {
      file,
      compressed: false,
      originalSize: file.size,
      compressedSize: file.size,
      savedBytes: 0,
      reason: 'browser-unsupported',
    };
  }

  if (signal?.aborted) {
    throw new DOMException('تم إلغاء ضغط الفيديو', 'AbortError');
  }

  const metadata = await readVideoMetadata(file);
  const mimeType = pickRecorderMimeType();
  const sourceUrl = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.preload = 'auto';
  video.muted = true;
  video.playsInline = true;
  video.src = sourceUrl;

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) {
    revokeObjectUrl(sourceUrl);
    metadata.cleanup?.();
    throw new Error('المتصفح لا يدعم ضغط الفيديو في الواجهة');
  }

  const maxWidth = Number(options.maxWidth || 1280);
  const fps = Number(options.fps || 24);
  const scale = Math.min(1, maxWidth / Math.max(metadata.width || 1, 1));
  canvas.width = even((metadata.width || 1280) * scale);
  canvas.height = even((metadata.height || 720) * scale);

  const sourceStream = (typeof video.captureStream === 'function' ? video.captureStream() : video.mozCaptureStream?.()) || null;
  const canvasStream = canvas.captureStream(Math.max(12, Math.min(fps, 30)));
  const mergedStream = new MediaStream([
    ...canvasStream.getVideoTracks(),
    ...(sourceStream?.getAudioTracks?.() || []),
  ]);

  const estimatedDuration = Math.max(1, metadata.duration || 1);
  const targetBitrate = Number(
    options.videoBitsPerSecond || Math.min(2_400_000, Math.max(650_000, Math.round(((file.size * 8) / estimatedDuration) * 0.55))),
  );

  const recorder = new MediaRecorder(mergedStream, {
    mimeType,
    videoBitsPerSecond: targetBitrate,
  });

  const chunks = [];
  let rafId = 0;
  let intervalId = 0;

  const cleanup = () => {
    if (rafId) cancelAnimationFrame(rafId);
    if (intervalId) window.clearInterval(intervalId);
    try {
      recorder.stream?.getTracks?.().forEach((track) => track.stop());
    } catch {
      // ignore
    }
    try {
      sourceStream?.getTracks?.().forEach((track) => track.stop());
    } catch {
      // ignore
    }
    metadata.cleanup?.();
    revokeObjectUrl(sourceUrl);
  };

  const renderFrame = () => {
    if (video.paused || video.ended) return;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    rafId = requestAnimationFrame(renderFrame);
  };

  return new Promise((resolve, reject) => {
    const abortHandler = () => {
      try {
        if (recorder.state !== 'inactive') recorder.stop();
      } catch {
        // ignore stop failures on abort
      }
      cleanup();
      reject(new DOMException('تم إلغاء ضغط الفيديو', 'AbortError'));
    };

    if (signal) signal.addEventListener('abort', abortHandler, { once: true });

    recorder.ondataavailable = (event) => {
      if (event.data?.size) chunks.push(event.data);
    };

    recorder.onerror = () => {
      if (signal) signal.removeEventListener('abort', abortHandler);
      cleanup();
      reject(new Error('فشل ضغط الفيديو داخل المتصفح'));
    };

    recorder.onstop = async () => {
      if (signal) signal.removeEventListener('abort', abortHandler);
      cleanup();
      const blob = new Blob(chunks, { type: mimeType || 'video/webm' });
      if (!blob.size || blob.size >= file.size * 0.96) {
        resolve({
          file,
          compressed: false,
          originalSize: file.size,
          compressedSize: file.size,
          savedBytes: 0,
          reason: 'not-smaller',
        });
        return;
      }

      const normalized = new File([blob], `${String(file.name || 'video').replace(/\.[^.]+$/, '')}-compressed.webm`, {
        type: blob.type || 'video/webm',
        lastModified: Date.now(),
      });

      resolve({
        file: normalized,
        compressed: true,
        originalSize: file.size,
        compressedSize: normalized.size,
        savedBytes: Math.max(file.size - normalized.size, 0),
        reason: 'compressed',
      });
    };

    video.onended = () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.setTimeout(() => {
        if (recorder.state !== 'inactive') recorder.stop();
      }, 120);
    };

    video.onerror = () => {
      if (signal) signal.removeEventListener('abort', abortHandler);
      cleanup();
      reject(new Error('فشل تشغيل الفيديو للضغط'));
    };

    video.onloadeddata = async () => {
      try {
        recorder.start(1000);
        intervalId = window.setInterval(() => {
          const percent = Math.min(88, 10 + Math.round((video.currentTime / estimatedDuration) * 78));
          onProgress({ stage: 'compressing', percent, currentTime: video.currentTime, duration: estimatedDuration });
        }, 300);
        await video.play();
        renderFrame();
      } catch (error) {
        if (signal) signal.removeEventListener('abort', abortHandler);
        cleanup();
        reject(error instanceof Error ? error : new Error('فشل بدء ضغط الفيديو'));
      }
    };
  });
}

export async function prepareImageForUpload(file, options = {}) {
  let workingFile = file;
  let editResult = null;

  if (options.imageEdits && options.imageEdits.enabled !== false) {
    editResult = await applyImageEdits(workingFile, options.imageEdits);
    workingFile = editResult.file;
  }

  const compressed = await compressImageFile(workingFile, {
    maxSizeMB: options.maxSizeMB ?? (workingFile.size > 4 * 1024 * 1024 ? 1.5 : 1.1),
    maxWidthOrHeight: options.maxWidthOrHeight ?? 1920,
    initialQuality: options.initialQuality ?? 0.84,
    useWebWorker: true,
  });

  const preview = await createImagePreviewBundle(compressed.file, { preferObjectUrl: false });

  return {
    file: compressed.file,
    preview,
    edited: Boolean(editResult?.edited),
    editResult,
    compression: compressed,
  };
}

export async function prepareVideoForUpload(file, options = {}, onProgress = () => {}, signal) {
  const preview = await createVideoPreviewBundle(file);
  let processed = {
    file,
    compressed: false,
    originalSize: file.size,
    compressedSize: file.size,
    savedBytes: 0,
    reason: 'skipped',
  };

  if (options.enableCompression !== false) {
    processed = await compressVideoFile(file, options.compressionOptions || {}, onProgress, signal);
  }

  return {
    file: processed.file,
    preview,
    compression: processed,
  };
}

export { revokeObjectUrl };
