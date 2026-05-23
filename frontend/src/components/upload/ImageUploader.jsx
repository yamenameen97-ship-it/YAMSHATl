import { useRef, useState } from 'react';
import Button from '../ui/Button.jsx';
import {
  compressImageFile,
  formatBytes,
  generateBlurDataUrlFromImage,
  readFileAsDataURL,
} from '../../utils/mediaToolkit.js';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export default function ImageUploader({ onUploadComplete, onError, label = 'رفع صورة' }) {
  const [preview, setPreview] = useState('');
  const [blurPreview, setBlurPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState(null);
  const fileInputRef = useRef(null);

  const resetUploader = () => {
    setPreview('');
    setBlurPreview('');
    setStats(null);
    setUploading(false);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      onError?.('نوع الملف غير مدعوم. استخدم JPEG أو PNG أو WebP أو GIF');
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      onError?.(`حجم الملف كبير جداً. الحد الأقصى: ${MAX_IMAGE_SIZE / (1024 * 1024)}MB`);
      return;
    }

    try {
      setUploading(true);
      setProgress(8);
      const rawPreview = await readFileAsDataURL(file);
      setPreview(rawPreview);

      const compressed = await compressImageFile(file, {
        maxSizeMB: file.size > 4 * 1024 * 1024 ? 1.4 : 1,
        maxWidthOrHeight: 1920,
        initialQuality: 0.8,
      });
      setProgress(52);

      const compressedPreview = await readFileAsDataURL(compressed.file);
      const placeholder = await generateBlurDataUrlFromImage(compressedPreview, { size: 20 });
      setBlurPreview(placeholder);
      setPreview(compressedPreview);
      setProgress(88);

      const nextStats = {
        originalSize: compressed.originalSize,
        compressedSize: compressed.compressedSize,
        savedBytes: compressed.savedBytes,
        compressionRatio: compressed.compressionRatio,
      };
      setStats(nextStats);
      setProgress(100);

      onUploadComplete?.(compressed.file, compressedPreview, {
        blurDataUrl: placeholder,
        ...nextStats,
      });
    } catch (error) {
      onError?.(error?.message || 'فشل تجهيز الصورة');
      resetUploader();
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="image-uploader-shell">
      {preview ? (
        <div className="image-preview-card">
          <div className="image-preview-stage">
            {blurPreview ? <img src={blurPreview} alt="blur placeholder" className="image-preview-blur" aria-hidden /> : null}
            <img src={preview} alt="معاينة" className="image-preview-main" loading="lazy" decoding="async" />
          </div>

          {stats ? (
            <div className="image-stats-grid">
              <div>
                <span className="label">قبل الضغط</span>
                <strong>{formatBytes(stats.originalSize)}</strong>
              </div>
              <div>
                <span className="label">بعد الضغط</span>
                <strong>{formatBytes(stats.compressedSize)}</strong>
              </div>
              <div>
                <span className="label">الموفر</span>
                <strong>{formatBytes(stats.savedBytes)}</strong>
              </div>
              <div>
                <span className="label">النسبة</span>
                <strong>{Math.round((1 - Math.min(stats.compressionRatio, 1)) * 100)}%</strong>
              </div>
            </div>
          ) : null}

          <div className="preview-actions">
            <Button variant="secondary" size="small" onClick={() => fileInputRef.current?.click()} disabled={uploading}>تغيير</Button>
            <Button size="small" onClick={resetUploader} disabled={uploading}>إزالة</Button>
          </div>

          {uploading ? (
            <div className="upload-progress">
              <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
              <p>{progress}% — ضغط + تجهيز placeholder</p>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="image-upload-area">
          <div className="upload-icon">🖼️</div>
          <p className="upload-title">{label}</p>
          <p className="muted">ضغط تلقائي + Blur placeholder + Lazy ready</p>
          <p className="muted">PNG, JPEG, WebP أو GIF</p>
          <Button variant="secondary" onClick={() => fileInputRef.current?.click()} loading={uploading}>اختر صورة</Button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      <style>{`
        .image-uploader-shell { display: grid; gap: 12px; }
        .image-upload-area,
        .image-preview-card {
          display: grid;
          gap: 12px;
          padding: 16px;
          border-radius: 20px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(15,23,42,0.66);
        }
        .image-upload-area { justify-items: center; text-align: center; }
        .upload-icon {
          width: 58px; height: 58px; border-radius: 18px; display: grid; place-items: center;
          background: linear-gradient(135deg, rgba(124,58,237,0.28), rgba(59,130,246,0.16)); font-size: 28px;
        }
        .upload-title { margin: 0; font-weight: 800; color: #fff; }
        .muted { margin: 0; color: #94a3b8; font-size: 13px; }
        .image-preview-stage {
          position: relative; overflow: hidden; border-radius: 20px; min-height: 220px; background: #020617;
          border: 1px solid rgba(255,255,255,0.06);
        }
        .image-preview-blur,
        .image-preview-main {
          width: 100%; display: block; object-fit: cover;
        }
        .image-preview-blur {
          position: absolute; inset: 0; filter: blur(16px) saturate(1.15); transform: scale(1.05); opacity: 0.88;
        }
        .image-preview-main { position: relative; z-index: 1; }
        .image-stats-grid {
          display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px;
        }
        .image-stats-grid > div {
          padding: 12px; border-radius: 14px; background: rgba(255,255,255,0.04); color: white; display: grid; gap: 4px;
        }
        .image-stats-grid .label { font-size: 12px; color: #94a3b8; }
        .preview-actions { display: flex; gap: 10px; flex-wrap: wrap; }
        .upload-progress { display: grid; gap: 8px; color: #cbd5e1; font-size: 13px; }
        .progress-bar { height: 10px; border-radius: 999px; background: rgba(148,163,184,0.18); overflow: hidden; }
        .progress-fill { height: 100%; background: linear-gradient(90deg, #8b5cf6, #3b82f6); }
      `}</style>
    </div>
  );
}
