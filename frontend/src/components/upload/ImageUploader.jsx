import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Button from '../ui/Button.jsx';
import { formatBytes } from '../../utils/mediaToolkit.js';
import {
  createUploadController,
  generatePreview,
  getUploadStageLabel,
  isAbortError,
  prepareImageForUpload,
  uploadManagedFile,
} from '../../services/upload/index.js';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const aspectOptions = [
  { label: 'حر', value: 0 },
  { label: '1:1', value: 1 },
  { label: '4:5', value: 4 / 5 },
  { label: '16:9', value: 16 / 9 },
];

const initialEdits = {
  aspectRatio: 1,
  zoom: 1,
  offsetX: 0,
  offsetY: 0,
  brightness: 100,
  contrast: 100,
  saturation: 100,
};

export default function ImageUploader({ onUploadComplete, onError, label = 'رفع صورة' }) {
  const [sourceFile, setSourceFile] = useState(null);
  const [processedFile, setProcessedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [blurPreview, setBlurPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [editorBusy, setEditorBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stageLabel, setStageLabel] = useState('جاهز');
  const [stats, setStats] = useState(null);
  const [result, setResult] = useState(null);
  const [edits, setEdits] = useState(initialEdits);
  const fileInputRef = useRef(null);
  const controllerRef = useRef(null);

  const currentFile = processedFile || sourceFile;
  const hasSelection = Boolean(sourceFile);

  const releasePreview = useCallback((value) => {
    if (!value || typeof value !== 'string' || !value.startsWith('blob:')) return;
    try {
      URL.revokeObjectURL(value);
    } catch {
      // ignore revoke failures
    }
  }, []);

  const resetUploader = useCallback(() => {
    if (controllerRef.current) controllerRef.current.abort();
    releasePreview(previewUrl);
    setSourceFile(null);
    setProcessedFile(null);
    setPreviewUrl('');
    setBlurPreview('');
    setUploading(false);
    setEditorBusy(false);
    setProgress(0);
    setStageLabel('جاهز');
    setStats(null);
    setResult(null);
    setEdits(initialEdits);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [previewUrl, releasePreview]);

  useEffect(() => () => {
    if (controllerRef.current) controllerRef.current.abort();
    releasePreview(previewUrl);
  }, [previewUrl, releasePreview]);

  const handleFileSelect = useCallback(async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      onError?.('نوع الصورة غير مدعوم. استخدم JPEG أو PNG أو WebP أو GIF');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      onError?.(`حجم الصورة كبير جداً. الحد الأقصى ${MAX_IMAGE_SIZE / (1024 * 1024)}MB`);
      return;
    }

    if (controllerRef.current) controllerRef.current.abort();
    releasePreview(previewUrl);
    setSourceFile(file);
    setProcessedFile(null);
    setStats(null);
    setResult(null);
    setProgress(12);
    setStageLabel('تجهيز المعاينة');

    try {
      const preview = await generatePreview(file);
      setPreviewUrl(preview.previewUrl || '');
      setBlurPreview(preview.blurDataUrl || '');
      setProgress(20);
      setStageLabel('جاهز للتعديل');
    } catch (error) {
      onError?.(error?.message || 'فشل تجهيز المعاينة');
    }
  }, [onError, previewUrl, releasePreview]);

  const applyEdits = useCallback(async () => {
    if (!sourceFile) return;
    setEditorBusy(true);
    setStageLabel('تطبيق القص والتحسين');
    setProgress(28);

    try {
      const prepared = await prepareImageForUpload(sourceFile, {
        imageEdits: { ...edits, enabled: true },
      });

      releasePreview(previewUrl);
      setProcessedFile(prepared.file || sourceFile);
      setPreviewUrl(prepared.preview?.previewUrl || '');
      setBlurPreview(prepared.preview?.blurDataUrl || '');
      setStats({
        originalSize: prepared.compression?.originalSize || sourceFile.size,
        compressedSize: prepared.file?.size || sourceFile.size,
        savedBytes: Math.max((prepared.compression?.originalSize || sourceFile.size) - (prepared.file?.size || sourceFile.size), 0),
      });
      setProgress(68);
      setStageLabel('تم تحديث الصورة');
    } catch (error) {
      onError?.(error?.message || 'فشل تطبيق التعديلات');
    } finally {
      setEditorBusy(false);
    }
  }, [edits, onError, previewUrl, releasePreview, sourceFile]);

  const startUpload = useCallback(async () => {
    const targetFile = currentFile || sourceFile;
    if (!targetFile || uploading) return;

    if (controllerRef.current) controllerRef.current.abort();
    const controller = createUploadController();
    controllerRef.current = controller;

    setUploading(true);
    setResult(null);

    try {
      const upload = await uploadManagedFile(targetFile, {
        signal: controller.signal,
        retryCount: 3,
        purpose: 'image-uploader',
        imageEdits: processedFile ? null : { ...edits, enabled: true },
        onProgress: (payload) => {
          setProgress(Math.min(100, Math.max(0, Number(payload?.percent || 0))));
          setStageLabel(payload?.stageLabel || getUploadStageLabel(payload?.stage));
        },
      });

      setProcessedFile(upload.preparedFile || targetFile);
      if (upload.preview?.previewUrl) {
        releasePreview(previewUrl);
        setPreviewUrl(upload.preview.previewUrl);
      }
      setBlurPreview(upload.preview?.blurDataUrl || blurPreview);
      setProgress(100);
      setStageLabel('اكتمل الرفع');
      setResult(upload);
      setStats({
        originalSize: upload.originalSize || sourceFile?.size || targetFile.size,
        compressedSize: upload.preparedFile?.size || targetFile.size,
        savedBytes: Math.max((upload.originalSize || sourceFile?.size || targetFile.size) - (upload.preparedFile?.size || targetFile.size), 0),
      });

      onUploadComplete?.({
        file: targetFile,
        uploadedFile: upload.preparedFile || targetFile,
        previewUrl: upload.preview?.previewUrl || previewUrl,
        blurDataUrl: upload.preview?.blurDataUrl || blurPreview,
        url: upload.mediaUrl || upload.url,
        cdnUrl: upload.cdnUrl || upload.mediaUrl || upload.url,
        payload: upload,
      });
    } catch (error) {
      if (isAbortError(error)) {
        setStageLabel('تم إلغاء الرفع');
        setProgress(0);
        return;
      }
      onError?.(error?.response?.data?.detail || error?.message || 'فشل رفع الصورة');
      setStageLabel('فشل الرفع');
    } finally {
      setUploading(false);
      controllerRef.current = null;
    }
  }, [blurPreview, currentFile, edits, onError, onUploadComplete, previewUrl, processedFile, releasePreview, sourceFile, uploading]);

  const statsView = useMemo(() => {
    if (!stats) return null;
    return {
      before: formatBytes(stats.originalSize || 0),
      after: formatBytes(stats.compressedSize || 0),
      saved: formatBytes(stats.savedBytes || 0),
      ratio: stats.originalSize ? Math.max(0, Math.round(((stats.savedBytes || 0) / stats.originalSize) * 100)) : 0,
    };
  }, [stats]);

  return (
    <div className="image-uploader-shell">
      {hasSelection ? (
        <div className="image-preview-card">
          <div className="image-preview-stage">
            {blurPreview ? <img src={blurPreview} alt="blur placeholder" className="image-preview-blur" aria-hidden /> : null}
            {previewUrl ? <img src={previewUrl} alt="معاينة الصورة" className="image-preview-main" /> : null}
          </div>

          <div className="editor-grid">
            <div className="editor-group">
              <span>نسبة القص</span>
              <div className="chip-row">
                {aspectOptions.map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    className={`chip ${Number(edits.aspectRatio) === Number(option.value) ? 'active' : ''}`}
                    onClick={() => setEdits((prev) => ({ ...prev, aspectRatio: option.value }))}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <label className="editor-control">
              <span>Zoom</span>
              <input type="range" min="1" max="3" step="0.05" value={edits.zoom} onChange={(e) => setEdits((prev) => ({ ...prev, zoom: Number(e.target.value) }))} />
            </label>
            <label className="editor-control">
              <span>إزاحة أفقية</span>
              <input type="range" min="-1" max="1" step="0.05" value={edits.offsetX} onChange={(e) => setEdits((prev) => ({ ...prev, offsetX: Number(e.target.value) }))} />
            </label>
            <label className="editor-control">
              <span>إزاحة رأسية</span>
              <input type="range" min="-1" max="1" step="0.05" value={edits.offsetY} onChange={(e) => setEdits((prev) => ({ ...prev, offsetY: Number(e.target.value) }))} />
            </label>
            <label className="editor-control">
              <span>Brightness</span>
              <input type="range" min="60" max="160" step="1" value={edits.brightness} onChange={(e) => setEdits((prev) => ({ ...prev, brightness: Number(e.target.value) }))} />
            </label>
            <label className="editor-control">
              <span>Contrast</span>
              <input type="range" min="60" max="160" step="1" value={edits.contrast} onChange={(e) => setEdits((prev) => ({ ...prev, contrast: Number(e.target.value) }))} />
            </label>
            <label className="editor-control">
              <span>Saturation</span>
              <input type="range" min="60" max="180" step="1" value={edits.saturation} onChange={(e) => setEdits((prev) => ({ ...prev, saturation: Number(e.target.value) }))} />
            </label>
          </div>

          {statsView ? (
            <div className="image-stats-grid">
              <div><span className="label">قبل</span><strong>{statsView.before}</strong></div>
              <div><span className="label">بعد</span><strong>{statsView.after}</strong></div>
              <div><span className="label">الوفر</span><strong>{statsView.saved}</strong></div>
              <div><span className="label">النسبة</span><strong>{statsView.ratio}%</strong></div>
            </div>
          ) : null}

          <div className="upload-progress">
            <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
            <p>{progress}% — {stageLabel}</p>
          </div>

          {result?.cdnUrl ? <a href={result.cdnUrl} target="_blank" rel="noreferrer" className="cdn-link">فتح رابط CDN</a> : null}

          <div className="preview-actions">
            <Button variant="secondary" size="small" onClick={applyEdits} disabled={editorBusy || uploading} preventRepeat={false}>تطبيق التعديل</Button>
            <Button size="small" onClick={startUpload} loading={uploading} preventRepeat={false}>رفع الصورة</Button>
            {uploading ? <Button variant="danger" size="small" onClick={() => controllerRef.current?.abort()} preventRepeat={false}>إلغاء</Button> : null}
            <Button variant="secondary" size="small" onClick={() => fileInputRef.current?.click()} disabled={uploading} preventRepeat={false}>تغيير</Button>
            <Button variant="secondary" size="small" onClick={resetUploader} disabled={uploading} preventRepeat={false}>إزالة</Button>
          </div>
        </div>
      ) : (
        <div className="image-upload-area">
          <div className="upload-icon">🖼️</div>
          <p className="upload-title">{label}</p>
          <p className="muted">قص وتعديل فعلي + ضغط تلقائي + Blur preview + رفع يدعم الاستئناف والإلغاء</p>
          <p className="muted">JPEG, PNG, WebP أو GIF</p>
          <Button variant="secondary" onClick={() => fileInputRef.current?.click()} preventRepeat={false}>اختر صورة</Button>
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
          position: relative; overflow: hidden; border-radius: 20px; min-height: 260px; background: #020617;
          border: 1px solid rgba(255,255,255,0.06);
        }
        .image-preview-blur,
        .image-preview-main { width: 100%; display: block; object-fit: cover; }
        .image-preview-blur {
          position: absolute; inset: 0; filter: blur(18px) saturate(1.1); transform: scale(1.08); opacity: 0.88;
        }
        .image-preview-main { position: relative; z-index: 1; }
        .editor-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
        .editor-group,
        .editor-control {
          display: grid; gap: 8px; padding: 12px; border-radius: 16px; background: rgba(255,255,255,0.04); color: #fff;
        }
        .editor-control span,
        .editor-group span { font-size: 12px; color: #cbd5e1; }
        .chip-row { display: flex; gap: 8px; flex-wrap: wrap; }
        .chip {
          border: 1px solid rgba(255,255,255,0.12); background: transparent; color: #cbd5e1; border-radius: 999px; padding: 6px 10px; cursor: pointer;
        }
        .chip.active { background: linear-gradient(90deg, #8b5cf6, #3b82f6); color: white; border-color: transparent; }
        .image-stats-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
        .image-stats-grid > div {
          padding: 12px; border-radius: 14px; background: rgba(255,255,255,0.04); color: white; display: grid; gap: 4px;
        }
        .image-stats-grid .label { font-size: 12px; color: #94a3b8; }
        .preview-actions { display: flex; gap: 10px; flex-wrap: wrap; }
        .upload-progress { display: grid; gap: 8px; color: #cbd5e1; font-size: 13px; }
        .progress-bar { height: 10px; border-radius: 999px; background: rgba(148,163,184,0.18); overflow: hidden; }
        .progress-fill { height: 100%; background: linear-gradient(90deg, #8b5cf6, #3b82f6); }
        .cdn-link { color: #93c5fd; font-size: 13px; text-decoration: none; }
        @media (max-width: 768px) {
          .editor-grid,
          .image-stats-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
