import imageCompression from 'browser-image-compression';

export function formatBytes(bytes = 0) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const level = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / (1024 ** level);
  return `${value.toFixed(value >= 100 || level === 0 ? 0 : value >= 10 ? 1 : 2)} ${units[level]}`;
}

export function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('فشل قراءة الملف'));
    reader.readAsDataURL(file);
  });
}

export async function compressImageFile(file, options = {}) {
  const compressed = await imageCompression(file, {
    maxSizeMB: options.maxSizeMB ?? 1.25,
    maxWidthOrHeight: options.maxWidthOrHeight ?? 1920,
    initialQuality: options.initialQuality ?? 0.82,
    useWebWorker: options.useWebWorker ?? true,
    fileType: file.type === 'image/png' ? 'image/png' : 'image/webp',
    preserveExif: false,
  });

  const safeName = file.name.replace(/\.(png|jpg|jpeg|webp|gif)$/i, '');
  const extension = compressed.type === 'image/png' ? 'png' : 'webp';
  const normalizedFile = new File([compressed], `${safeName}.${extension}`, {
    type: compressed.type,
    lastModified: Date.now(),
  });

  const originalSize = Number(file.size || 0);
  const compressedSize = Number(normalizedFile.size || compressed.size || 0);

  return {
    file: normalizedFile,
    originalSize,
    compressedSize,
    savedBytes: Math.max(originalSize - compressedSize, 0),
    compressionRatio: originalSize ? Number((compressedSize / originalSize).toFixed(4)) : 1,
  };
}

export async function generateBlurDataUrlFromImage(source, options = {}) {
  const size = Number(options.size || 24);
  const dataUrl = typeof source === 'string' ? source : await readFileAsDataURL(source);

  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('المتصفح لا يدعم Canvas'));
        return;
      }
      const width = Math.max(8, size);
      const height = Math.max(8, Math.round((image.height / Math.max(image.width, 1)) * width) || size);
      canvas.width = width;
      canvas.height = height;
      ctx.filter = 'blur(1px) saturate(1.15)';
      ctx.drawImage(image, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.55));
    };
    image.onerror = () => reject(new Error('فشل تجهيز placeholder'));
    image.src = dataUrl;
  });
}

export async function generateVideoThumbnail(file, options = {}) {
  const seekTo = Number(options.seekTo ?? 0.35);
  const quality = Number(options.quality ?? 0.82);
  const maxWidth = Number(options.maxWidth ?? 640);

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    video.src = url;

    const cleanup = () => {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // ignore
      }
    };

    video.onloadedmetadata = () => {
      const targetTime = Math.max(0, Math.min(video.duration || 0, seekTo * (video.duration || 1)));
      if (!Number.isFinite(targetTime)) {
        cleanup();
        reject(new Error('تعذر قراءة مدة الفيديو'));
        return;
      }
      video.currentTime = targetTime;
    };

    video.onseeked = () => {
      const ratio = (video.videoHeight || 9) / Math.max(video.videoWidth || 16, 1);
      const canvas = document.createElement('canvas');
      canvas.width = Math.min(video.videoWidth || maxWidth, maxWidth);
      canvas.height = Math.round(canvas.width * ratio);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        cleanup();
        reject(new Error('المتصفح لا يدعم Canvas'));
        return;
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const thumbnailDataUrl = canvas.toDataURL('image/jpeg', quality);
      cleanup();
      resolve({
        thumbnailDataUrl,
        width: canvas.width,
        height: canvas.height,
        duration: Number(video.duration || 0),
      });
    };

    video.onerror = () => {
      cleanup();
      reject(new Error('فشل استخراج صورة مصغرة للفيديو'));
    };
  });
}
