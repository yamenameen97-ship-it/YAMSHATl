import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Button from '../ui/Button.jsx';
import { formatBytes } from '../../utils/mediaToolkit.js';
import {
  createUploadController,
  generatePreview,
  getUploadStageLabel,
  isAbortError,
  uploadManagedFile,
} from '../../services/upload/index.js';

const MAX_VIDEO_SIZE = 500 * 1024 * 1024;
const ALLOWED_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

export default function VideoUploader({ onUploadComplete, onError, label = 'رفع فيديو الريل' }) {
  const [videoFile, setVideoFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stageLabel, setStageLabel] = useState('جاهز');
  const [previewUrl, setPreviewUrl] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [videoMeta, setVideoMeta] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [compressionMeta, setCompressionMeta] = useState(null);
  const [lastError, setLastError] = useState('');
  const fileInputRef = useRef(null);
  const controllerRef = useRef(null);

  const acceptedText = useMemo(() => 'MP4, WebM أو MOV', []);

  const revokeObjectUrl = useCallback((value) => {
    if (!value || !String(value).startsWith('blob:')) return;
    try {
      URL.revokeObjectURL(value);
    } catch {
      // ignore revoke failures
    }
  }, []);

  const resetLocalState = useCallback(() => {
    controllerRef.current?.abort();
    revokeObjectUrl(previewUrl);
    setVideoFile(null);
    setUploading(false);
    setProgress(0);
    setStageLabel('جاهز');
    setPreviewUrl('');
    setThumbnail('');
    setVideoMeta(null);
    setUploadResult(null);
    setCompressionMeta(null);
    setLastError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [previewUrl, revokeObjectUrl]);

  useEffect(() => () => {
    controllerRef.current?.abort();
    revokeObjectUrl(previewUrl);
  }, [previewUrl, revokeObjectUrl]);

  const startUpload = useCallback(async (file, cachedPreview = null) => {
    if (!file) return;
    controllerRef.current?.abort();
    const controller = createUploadController();
    controllerRef.current = controller;

    setUploading(true);
    setLastError('');
    setStageLabel('بدء الرفع');
    setProgress(Math.max(18, progress || 18));

    try {
      const result = await uploadManagedFile(file, {
        signal: controller.signal,
        retryCount: 3,
        purpose: 'reel-upload',
        enableVideoCompression: true,
        onProgress: (payload) => {
          setProgress(Math.min(100, Math.max(0, Number(payload?.percent || 0))));
          setStageLabel(payload?.stageLabel || getUploadStageLabel(payload?.stage));
        },
      });

      setCompressionMeta(result?.compression || null);
      setUploadResult(result);
      setProgress(100);
      setStageLabel('تم رفع الفيديو');

      onUploadComplete?.({
        file,
        uploadedFile: result?.preparedFile || file,
        previewUrl: cachedPreview?.previewUrl || result?.preview?.previewUrl || previewUrl,
        thumbnailDataUrl: cachedPreview?.thumbnailDataUrl || result?.preview?.thumbnailDataUrl || thumbnail,
        thumbnailWidth: cachedPreview?.width || result?.preview?.width || 0,
        thumbnailHeight: cachedPreview?.height || result?.preview?.height || 0,
        duration: cachedPreview?.duration || result?.preview?.duration || 0,
        url: result?.mediaUrl || result?.url || '',
        cdnUrl: result?.cdnUrl || result?.mediaUrl || result?.url || '',
        payload: result,
      });
    } catch (error) {
      if (isAbortError(error)) {
        setStageLabel('تم إلغاء الرفع');
        setProgress(0);
        return;
      }
      const message = error?.response?.data?.detail || error?.message || 'فشل رفع الفيديو';
      setLastError(message);
      setStageLabel('فشل الرفع');
      onError?.(message);
    } finally {
      setUploading(false);
      controllerRef.current = null;
    }
  }, [onError, onUploadComplete, previewUrl, progress, thumbnail]);

  const handleFileSelect = useCallback(async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      onError?.('نوع الملف غير مدعوم. استخدم MP4 أو WebM أو MOV');
      return;
    }
    if (file.size > MAX_VIDEO_SIZE) {
      onError?.(`حجم الملف كبير جداً. الحد الأقصى ${MAX_VIDEO_SIZE / (1024 * 1024)}MB`);
      return;
    }

    revokeObjectUrl(previewUrl);
    setVideoFile(file);
    setProgress(6);
    setStageLabel('تجهيز المعاينة');
    setUploadResult(null);
    setCompressionMeta(null);
    setLastError('');

    try {
      const preview = await generatePreview(file);
      setPreviewUrl(preview.previewUrl || '');
      setThumbnail(preview.thumbnailDataUrl || '');
      setVideoMeta({
        width: preview.width,
        height: preview.height,
        duration: preview.duration,
      });
      setProgress(18);
      setStageLabel('المعاينة جاهزة');
      await startUpload(file, preview);
    } catch (error) {
      onError?.(error?.message || 'فشل تجهيز الفيديو');
    }
  }, [onError, previewUrl, revokeObjectUrl, startUpload]);

  const retryUpload = useCallback(async () => {
    if (!videoFile) return;
    await startUpload(videoFile, videoMeta ? { ...videoMeta, previewUrl, thumbnailDataUrl: thumbnail } : null);
  }, [previewUrl, startUpload, thumbnail, videoFile, videoMeta]);

  return (
    <div className="video-uploader-shell">
      {videoFile ? (
        <div className="video-upload-status">
          {thumbnail ? (
            <div className="video-thumbnail-card">
              <img src={thumbnail} alt="video thumbnail" className="video-thumbnail-image" loading="lazy" decoding="async" />
              <div className="thumbnail-badge">Preview</div>
            </div>
          ) : null}

          <div className="video-preview-card">
            <video src={previewUrl} poster={thumbnail || undefined} controls playsInline preload="metadata" className="video-preview-player" />
          </div>

          <div className="video-info-row">
            <div>
              <strong>{videoFile.name}</strong>
              <p className="muted">{formatBytes(videoFile.size)}</p>
              {videoMeta ? <p className="muted">{Math.round(videoMeta.duration || 0)} ثانية • {videoMeta.width}×{videoMeta.height}</p> : null}
              {compressionMeta ? (
                <p className="muted">
                  {compressionMeta.compressed
                    ? `تم ضغط الفيديو وتوفير ${formatBytes(compressionMeta.savedBytes || 0)}`
                    : 'سيتم الرفع دون ضغط إضافي إذا لم ينتج ملف أصغر'}
                </p>
              ) : null}
            </div>
            <span className={`upload-state-pill ${uploading ? 'busy' : uploadResult ? 'done' : 'idle'}`}>
              {uploading ? stageLabel : uploadResult ? 'تم رفع الفيديو' : 'جاهز للرفع'}
            </span>
          </div>

          <div className="upload-progress">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${Math.min(progress, 100)}%` }} />
            </div>
            <div className="progress-info">
              <span>{Math.min(progress, 100)}%</span>
              <span className="muted">{stageLabel}</span>
            </div>
          </div>

          {uploadResult?.cdnUrl ? <a href={uploadResult.cdnUrl} target="_blank" rel="noreferrer" className="video-cdn-link">فتح ملف CDN</a> : null}
          {lastError ? <p className="video-error-text">✕ {lastError}</p> : null}

          <div className="upload-actions">
            <Button variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={uploading} preventRepeat={false}>استبدال الفيديو</Button>
            {uploading ? <Button variant="danger" onClick={() => controllerRef.current?.abort()} preventRepeat={false}>إلغاء الرفع</Button> : null}
            {!uploading && lastError ? <Button variant="secondary" onClick={retryUpload} preventRepeat={false}>إعادة المحاولة</Button> : null}
            <Button variant="secondary" onClick={resetLocalState} disabled={uploading} preventRepeat={false}>إزالة</Button>
          </div>
        </div>
      ) : (
        <div className="video-upload-area">
          <div className="upload-icon">🎬</div>
          <p className="upload-title">{label}</p>
          <p className="muted">Preview generation + resumable chunk upload + retry + cancel + CDN URL</p>
          <p className="muted">ضغط فيديو فعلي داخل المتصفح عند دعم المتصفح وكان الناتج أصغر</p>
          <p className="muted">{acceptedText}</p>
          <p className="muted">الحد الأقصى: {MAX_VIDEO_SIZE / (1024 * 1024)}MB</p>
          <Button variant="secondary" onClick={() => fileInputRef.current?.click()} preventRepeat={false}>اختيار فيديو الريل</Button>
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
        .video-uploader-shell { display: grid; gap: 12px; }
        .video-upload-status,
        .video-upload-area {
          display: grid;
          gap: 12px;
          padding: 14px;
          border-radius: 18px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(15,23,42,0.66);
        }
        .video-upload-area { text-align: center; justify-items: center; padding: 20px 16px; }
        .upload-icon {
          width: 58px; height: 58px; border-radius: 18px; display: grid; place-items: center;
          background: linear-gradient(135deg, rgba(124,58,237,0.28), rgba(59,130,246,0.16)); font-size: 28px;
        }
        .upload-title { font-weight: 800; color: #fff; margin: 0; }
        .video-thumbnail-card {
          position: relative; border-radius: 18px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08); background: #020617;
        }
        .video-thumbnail-image { width: 100%; display: block; max-height: 240px; object-fit: cover; }
        .thumbnail-badge {
          position: absolute; inset-inline-end: 12px; bottom: 12px; padding: 6px 10px; border-radius: 999px;
          background: rgba(15,23,42,0.86); color: #fff; font-size: 12px; font-weight: 700;
        }
        .video-preview-card {
          border-radius: 18px; overflow: hidden; background: #020617; border: 1px solid rgba(255,255,255,0.08);
        }
        .video-preview-player { width: 100%; max-height: 320px; display: block; background: #000; }
        .video-info-row {
          display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; color: #fff;
        }
        .upload-state-pill {
          padding: 8px 12px; border-radius: 999px; font-size: 12px; font-weight: 800; background: rgba(148,163,184,0.16); color: #cbd5e1;
        }
        .upload-state-pill.busy { background: rgba(59,130,246,0.16); color: #93c5fd; }
        .upload-state-pill.done { background: rgba(34,197,94,0.16); color: #86efac; }
        .muted { margin: 0; color: #94a3b8; font-size: 13px; }
        .upload-progress { display: grid; gap: 8px; }
        .progress-bar { height: 10px; border-radius: 999px; background: rgba(148,163,184,0.18); overflow: hidden; }
        .progress-fill { height: 100%; border-radius: inherit; background: linear-gradient(90deg, #8b5cf6, #3b82f6); transition: width 160ms ease; }
        .progress-info,
        .upload-actions { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
        .video-cdn-link { color: #93c5fd; font-size: 13px; text-decoration: none; }
        .video-error-text { margin: 0; color: #fca5a5; font-size: 13px; }
      `}</style>
    </div>
  );
}
