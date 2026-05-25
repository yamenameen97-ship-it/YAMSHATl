import { useEffect, useRef, useState } from 'react';
import Button from '../ui/Button.jsx';
import mediaUploadService from '../../services/media/mediaUploadService.js';
import {
  buildImagePreview,
  cropImageFile,
  createManagedUploadTask,
  defaultCropState,
  formatBytes,
  formatEta,
  formatSpeed,
} from '../../services/upload/uploadHelpers.js';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

function stageLabel(stage = '') {
  if (stage === 'validating') return 'فحص الصورة';
  if (stage === 'optimizing') return 'ضغط الصورة';
  if (stage === 'hashing') return 'تجهيز الاستئناف';
  if (stage === 'uploading') return 'رفع الصورة';
  if (stage === 'retrying') return 'إعادة المحاولة';
  if (stage === 'done') return 'تم الرفع';
  return 'جاهز';
}

export default function ImageUploader({ onUploadComplete, onError, label = 'رفع صورة' }) {
  const [sourceFile, setSourceFile] = useState(null);
  const [finalFile, setFinalFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [cropState, setCropState] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMeta, setProgressMeta] = useState({ stage: 'idle', speedBps: 0, etaSeconds: 0, retryAttempt: 0 });
  const [errorMessage, setErrorMessage] = useState('');
  const [resultPayload, setResultPayload] = useState(null);
  const fileInputRef = useRef(null);
  const taskRef = useRef(null);

  useEffect(() => () => {
    if (taskRef.current?.abort) taskRef.current.abort();
  }, []);

  const loadFile = async (file) => {
    const imagePreview = await buildImagePreview(file);
    setSourceFile(file);
    setFinalFile(file);
    setPreview(imagePreview);
    setCropState(defaultCropState(imagePreview));
    setUploading(false);
    setProgress(0);
    setProgressMeta({ stage: 'idle', speedBps: 0, etaSeconds: 0, retryAttempt: 0 });
    setErrorMessage('');
    setResultPayload(null);
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      onError?.('نوع الملف غير مدعوم. استخدم JPEG أو PNG أو WebP أو GIF');
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      onError?.(`حجم الملف كبير جداً. الحد الأقصى: ${MAX_IMAGE_SIZE / (1024 * 1024)}MB`);
      return;
    }

    await loadFile(file);
  };

  const applyCrop = async () => {
    if (!sourceFile || !cropState) return;
    try {
      const cropped = await cropImageFile(sourceFile, cropState, { outputWidth: 1080, quality: 0.92 });
      setFinalFile(cropped);
      const nextPreview = await buildImagePreview(cropped);
      setPreview(nextPreview);
      setErrorMessage('');
    } catch (error) {
      const message = error?.message || 'فشل قص الصورة';
      setErrorMessage(message);
      onError?.(message);
    }
  };

  const uploadImage = async () => {
    if (!finalFile) return;
    setUploading(true);
    setProgress(0);
    setErrorMessage('');
    try {
      const task = createManagedUploadTask(finalFile, ({ signal, onProgress }) => mediaUploadService.uploadFile(finalFile, {
        signal,
        onProgress,
        purpose: 'image-upload',
        retries: 3,
        chunkRetries: 3,
      }), {
        onProgress: (payload) => {
          setProgress(Math.min(100, Number(payload?.percent || 0)));
          setProgressMeta(payload);
        },
      });
      taskRef.current = task;
      const upload = await task.promise;
      setProgress(100);
      setProgressMeta({ stage: 'done', speedBps: 0, etaSeconds: 0, retryAttempt: 0 });
      setResultPayload(upload);
      onUploadComplete?.({
        file: finalFile,
        originalFile: sourceFile,
        previewUrl: preview?.dataUrl || '',
        url: upload.mediaUrl || upload.url || '',
        payload: upload,
        cropped: finalFile !== sourceFile,
      });
    } catch (error) {
      const message = error?.name === 'AbortError' ? 'تم إلغاء الرفع' : error?.message || 'فشل رفع الصورة';
      setErrorMessage(message);
      onError?.(message);
    } finally {
      setUploading(false);
      taskRef.current = null;
    }
  };

  const handleRemoveImage = () => {
    if (taskRef.current?.abort) taskRef.current.abort();
    setSourceFile(null);
    setFinalFile(null);
    setPreview(null);
    setCropState(null);
    setUploading(false);
    setProgress(0);
    setProgressMeta({ stage: 'idle', speedBps: 0, etaSeconds: 0, retryAttempt: 0 });
    setErrorMessage('');
    setResultPayload(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="image-uploader-shell">
      {preview?.dataUrl ? (
        <div className="image-preview-card">
          <div className="image-preview-media">
            <img src={preview.dataUrl} alt="معاينة" />
          </div>

          <div className="image-meta-row">
            <div>
              <strong>{finalFile?.name || sourceFile?.name}</strong>
              <p className="muted">الأصلي: {formatBytes(sourceFile?.size || 0)}{finalFile && sourceFile && finalFile !== sourceFile ? ` • بعد القص: ${formatBytes(finalFile.size)}` : ''}</p>
              <p className="muted">{preview.width}×{preview.height}</p>
            </div>
            <span className="stage-pill">{stageLabel(progressMeta.stage)}</span>
          </div>

          <div className="crop-controls-grid">
            <div className="aspect-row">
              {['1:1', '4:5', '16:9'].map((aspect) => (
                <button key={aspect} type="button" className={`chip-btn ${cropState?.aspect === aspect ? 'active' : ''}`} onClick={() => setCropState((prev) => ({ ...(prev || defaultCropState(preview)), aspect }))} disabled={uploading}>
                  {aspect}
                </button>
              ))}
            </div>

            <label className="slider-field">
              <span>Zoom</span>
              <input type="range" min="1" max="3" step="0.05" value={cropState?.zoom || 1} onChange={(event) => setCropState((prev) => ({ ...(prev || defaultCropState(preview)), zoom: Number(event.target.value) }))} disabled={uploading} />
            </label>
            <label className="slider-field">
              <span>تحريك أفقي</span>
              <input type="range" min="-1" max="1" step="0.02" value={cropState?.offsetX || 0} onChange={(event) => setCropState((prev) => ({ ...(prev || defaultCropState(preview)), offsetX: Number(event.target.value) }))} disabled={uploading} />
            </label>
            <label className="slider-field">
              <span>تحريك رأسي</span>
              <input type="range" min="-1" max="1" step="0.02" value={cropState?.offsetY || 0} onChange={(event) => setCropState((prev) => ({ ...(prev || defaultCropState(preview)), offsetY: Number(event.target.value) }))} disabled={uploading} />
            </label>
          </div>

          <div className="preview-actions">
            <Button variant="secondary" size="small" onClick={applyCrop} disabled={uploading}>تطبيق القص</Button>
            <Button size="small" onClick={uploadImage} loading={uploading}>رفع الصورة</Button>
            {uploading ? <Button variant="ghost" size="small" onClick={() => taskRef.current?.abort?.()}>إلغاء</Button> : null}
            {!uploading && errorMessage ? <Button variant="secondary" size="small" onClick={uploadImage}>إعادة المحاولة</Button> : null}
            <Button variant="ghost" size="small" onClick={() => fileInputRef.current?.click()} disabled={uploading}>تغيير</Button>
            <Button variant="ghost" size="small" onClick={handleRemoveImage} disabled={uploading}>إزالة</Button>
          </div>

          <div className="upload-progress">
            <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
            <div className="progress-stats-grid">
              <span>{progress}%</span>
              <span>{stageLabel(progressMeta.stage)}</span>
              <span>السرعة: {formatSpeed(progressMeta.speedBps)}</span>
              <span>المتبقي: {formatEta(progressMeta.etaSeconds)}</span>
              <span>Retry: {progressMeta.retryAttempt || 0}</span>
              <span>{resultPayload?.cdnUrl ? 'CDN جاهز' : 'لم يكتمل بعد'}</span>
            </div>
          </div>

          {errorMessage ? <div className="error-banner">{errorMessage}</div> : null}
        </div>
      ) : (
        <div className="image-upload-area">
          <div className="upload-icon">🖼️</div>
          <p>{label}</p>
          <p className="muted">PNG, JPEG, WebP أو GIF</p>
          <p className="muted">فيه Crop/Edit حقيقي قبل الرفع + resumable upload.</p>
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
        .image-preview-card,
        .image-upload-area {
          display: grid; gap: 12px; padding: 16px; border-radius: 18px;
          border: 1px solid rgba(255,255,255,0.08); background: rgba(15,23,42,0.66);
        }
        .image-upload-area { justify-items: center; text-align: center; }
        .image-preview-media { border-radius: 18px; overflow: hidden; background: #020617; }
        .image-preview-media img { display: block; width: 100%; max-height: 340px; object-fit: contain; background: #020617; }
        .image-meta-row, .preview-actions, .aspect-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
        .crop-controls-grid { display: grid; gap: 10px; }
        .slider-field { display: grid; gap: 6px; color: #cbd5e1; font-size: 13px; }
        .slider-field input { width: 100%; }
        .chip-btn {
          border: 1px solid rgba(255,255,255,0.12); background: rgba(15,23,42,0.8); color: #fff;
          border-radius: 999px; padding: 8px 12px; cursor: pointer;
        }
        .chip-btn.active { background: rgba(59,130,246,0.2); border-color: rgba(147,197,253,0.4); }
        .stage-pill { padding: 8px 12px; border-radius: 999px; background: rgba(59,130,246,0.14); color: #93c5fd; font-size: 12px; font-weight: 700; }
        .muted { margin: 0; color: #94a3b8; font-size: 13px; }
        .progress-bar { height: 10px; border-radius: 999px; background: rgba(148,163,184,0.18); overflow: hidden; }
        .progress-fill { height: 100%; background: linear-gradient(90deg, #8b5cf6, #3b82f6); transition: width 160ms ease; }
        .progress-stats-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; font-size: 12px; color: #cbd5e1; }
        .upload-icon {
          width: 58px; height: 58px; border-radius: 18px; display: grid; place-items: center;
          background: linear-gradient(135deg, rgba(124,58,237,0.28), rgba(59,130,246,0.16)); font-size: 28px;
        }
        .error-banner { border-radius: 14px; padding: 10px 12px; background: rgba(127,29,29,0.25); border: 1px solid rgba(248,113,113,0.26); color: #fecaca; }
      `}</style>
    </div>
  );
}
