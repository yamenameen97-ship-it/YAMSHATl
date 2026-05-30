import { useEffect, useMemo, useRef, useState } from 'react';
import Button from '../ui/Button.jsx';
import mediaUploadService from '../../services/media/mediaUploadService.js';
import {
  buildVideoPreview,
  compressVideoFile,
  createManagedUploadTask,
  formatBytes,
  formatEta,
  formatSpeed,
  revokeObjectUrl,
} from '../../services/upload/uploadHelpers.js';

const MAX_VIDEO_SIZE = 500 * 1024 * 1024;
const ALLOWED_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

function formatDuration(seconds = 0) {
  const total = Math.max(0, Math.round(Number(seconds || 0)));
  const minutes = Math.floor(total / 60);
  const remain = total % 60;
  return `${minutes}:${String(remain).padStart(2, '0')}`;
}

function stageLabel(stage = '') {
  if (stage === 'compressing-video') return 'جاري ضغط الفيديو فعلياً';
  if (stage === 'validating') return 'فحص الملف';
  if (stage === 'hashing') return 'تجهيز الاستئناف';
  if (stage === 'preparing') return 'تجهيز المعاينة';
  if (stage === 'uploading') return 'رفع الشرائح';
  if (stage === 'retrying') return 'إعادة المحاولة';
  if (stage === 'finalizing') return 'إغلاق جلسة الرفع';
  if (stage === 'done') return 'تم الرفع';
  return 'جاهز';
}

export default function VideoUploader({ onUploadComplete, onError, label = 'رفع فيديو الريل' }) {
  const [videoFile, setVideoFile] = useState(null);
  const [preparedFile, setPreparedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMeta, setProgressMeta] = useState({ stage: 'idle', speedBps: 0, etaSeconds: 0, retryAttempt: 0 });
  const [preview, setPreview] = useState(null);
  const [compressionEnabled, setCompressionEnabled] = useState(true);
  const [compressionPreset, setCompressionPreset] = useState('balanced');
  const [errorMessage, setErrorMessage] = useState('');
  const [lastPayload, setLastPayload] = useState(null);
  const fileInputRef = useRef(null);
  const taskRef = useRef(null);

  useEffect(() => () => {
    if (taskRef.current?.abort) taskRef.current.abort();
    revokeObjectUrl(preview?.objectUrl);
  }, [preview?.objectUrl]);

  const acceptedText = useMemo(() => 'MP4, WebM أو MOV', []);

  const resetLocalState = () => {
    if (taskRef.current?.abort) taskRef.current.abort();
    revokeObjectUrl(preview?.objectUrl);
    setVideoFile(null);
    setPreparedFile(null);
    setUploading(false);
    setProgress(0);
    setPreview(null);
    setErrorMessage('');
    setLastPayload(null);
    setProgressMeta({ stage: 'idle', speedBps: 0, etaSeconds: 0, retryAttempt: 0 });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const startUpload = async (sourceFile, currentPreview = null) => {
    if (!sourceFile) return;
    setUploading(true);
    setErrorMessage('');
    setProgress(0);

    try {
      const fileForUpload = await compressVideoFile(sourceFile, {
        enabled: compressionEnabled,
        preset: compressionPreset,
        onProgress: (payload) => {
          setProgress(Math.min(99, Number(payload?.percent || 0)));
          setProgressMeta((prev) => ({ ...prev, stage: payload?.stage || 'compressing-video' }));
        },
      });
      setPreparedFile(fileForUpload);

      const task = createManagedUploadTask(fileForUpload, ({ signal, onProgress }) => mediaUploadService.uploadFile(fileForUpload, {
        signal,
        onProgress,
        purpose: 'reel-upload',
        compressionPreset,
        chunkRetries: 4,
        retries: 3,
      }));
      taskRef.current = task;

      const upload = await task.promise;
      setProgress(100);
      setProgressMeta({ stage: 'done', speedBps: 0, etaSeconds: 0, retryAttempt: 0 });
      setLastPayload(upload);
      onUploadComplete?.({
        file: fileForUpload,
        originalFile: sourceFile,
        previewUrl: currentPreview?.objectUrl || '',
        thumbnailUrl: currentPreview?.thumbnailUrl || '',
        url: upload.mediaUrl || upload.url || '',
        payload: upload,
        compressed: fileForUpload !== sourceFile,
      });
    } catch (error) {
      const message = error?.name === 'AbortError'
        ? 'تم إلغاء الرفع'
        : error?.response?.data?.detail || error?.message || 'فشل رفع الفيديو';
      setErrorMessage(message);
      onError?.(message);
    } finally {
      setUploading(false);
      taskRef.current = null;
    }
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      onError?.('نوع الملف غير مدعوم. استخدم MP4 أو WebM أو MOV');
      return;
    }

    if (file.size > MAX_VIDEO_SIZE) {
      onError?.(`حجم الملف كبير جداً. الحد الأقصى: ${MAX_VIDEO_SIZE / (1024 * 1024)}MB`);
      return;
    }

    revokeObjectUrl(preview?.objectUrl);
    const nextPreview = await buildVideoPreview(file);
    setVideoFile(file);
    setPreparedFile(file);
    setPreview(nextPreview);
    setLastPayload(null);
    await startUpload(file, nextPreview);
  };

  const retryUpload = async () => {
    if (!videoFile) return;
    await startUpload(videoFile, preview);
  };

  return (
    <div className="video-uploader-shell">
      <div className="upload-settings-card">
        <div className="settings-row">
          <label className="settings-toggle">
            <input type="checkbox" checked={compressionEnabled} onChange={(event) => setCompressionEnabled(event.target.checked)} disabled={uploading} />
            <span>ضغط فيديو فعلي قبل الرفع</span>
          </label>
          <select value={compressionPreset} onChange={(event) => setCompressionPreset(event.target.value)} disabled={uploading} className="quality-select">
            <option value="light">Light</option>
            <option value="balanced">Balanced</option>
            <option value="strong">Strong</option>
          </select>
        </div>
        <p className="muted">الرفع يدعم الاستئناف + chunk upload + إلغاء + retry + معاينة Thumbnail حقيقية.</p>
      </div>

      {videoFile ? (
        <div className="video-upload-status">
          <div className="video-preview-card">
            <video src={preview?.objectUrl || ''} controls playsInline className="video-preview-player" />
          </div>

          <div className="video-info-row">
            <div>
              <strong>{videoFile.name}</strong>
              <p className="muted">الأصلي: {formatBytes(videoFile.size)}{preparedFile && preparedFile !== videoFile ? ` • بعد الضغط: ${formatBytes(preparedFile.size)}` : ''}</p>
              <p className="muted">{preview?.duration ? `المدة ${formatDuration(preview.duration)}` : 'بدون مدة'}{preview?.width ? ` • ${preview.width}×${preview.height}` : ''}</p>
            </div>
            <span className={`upload-state-pill ${uploading ? 'busy' : errorMessage ? 'error' : 'done'}`}>
              {errorMessage ? 'فيه مشكلة' : uploading ? stageLabel(progressMeta.stage) : 'تم تجهيز الفيديو'}
            </span>
          </div>

          {preview?.thumbnailUrl ? (
            <div className="thumbnail-row">
              <img src={preview.thumbnailUrl} alt="معاينة الفيديو" className="video-thumb" />
              <div>
                <strong>Preview جاهز</strong>
                <p className="muted">تم توليد thumbnail محلي قبل الرفع.</p>
              </div>
            </div>
          ) : null}

          <div className="upload-progress">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${Math.min(progress, 100)}%` }} />
            </div>
            <div className="progress-info">
              <span>{Math.min(progress, 100)}%</span>
              <span className="muted">{stageLabel(progressMeta.stage)}</span>
            </div>
            <div className="progress-stats-grid">
              <span>السرعة: {formatSpeed(progressMeta.speedBps)}</span>
              <span>الوقت المتبقي: {formatEta(progressMeta.etaSeconds)}</span>
              <span>المحاولات: {progressMeta.retryAttempt || 0}</span>
              <span>الرابط: {lastPayload?.cdnUrl ? 'CDN جاهز' : 'بعد الاكتمال'}</span>
            </div>
          </div>

          {errorMessage ? <div className="error-banner">{errorMessage}</div> : null}

          <div className="upload-actions">
            <Button variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={uploading}>استبدال الفيديو</Button>
            {uploading ? <Button variant="ghost" onClick={() => taskRef.current?.abort?.()}>إلغاء الرفع</Button> : null}
            {!uploading && errorMessage ? <Button onClick={retryUpload}>إعادة المحاولة</Button> : null}
            <Button variant="ghost" onClick={resetLocalState} disabled={uploading}>إزالة</Button>
          </div>
        </div>
      ) : (
        <div className="video-upload-area">
          <div className="upload-icon">🎬</div>
          <p className="upload-title">{label}</p>
          <p className="muted">اسحب الفيديو هنا أو اختره من الجهاز</p>
          <p className="muted">{acceptedText}</p>
          <p className="muted">الحد الأقصى: {MAX_VIDEO_SIZE / (1024 * 1024)}MB</p>
          <Button variant="secondary" onClick={() => fileInputRef.current?.click()} loading={uploading}>اختيار فيديو الريل</Button>
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
        .upload-settings-card,
        .video-upload-status,
        .video-upload-area {
          display: grid;
          gap: 12px;
          padding: 14px;
          border-radius: 18px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(15,23,42,0.66);
        }
        .settings-row,
        .upload-actions,
        .progress-info,
        .video-info-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
        }
        .settings-toggle { display: flex; align-items: center; gap: 8px; color: #fff; }
        .video-upload-area { text-align: center; justify-items: center; padding: 20px 16px; }
        .upload-icon {
          width: 58px; height: 58px; border-radius: 18px; display: grid; place-items: center;
          background: linear-gradient(135deg, rgba(124,58,237,0.28), rgba(59,130,246,0.16)); font-size: 28px;
        }
        .upload-title { font-weight: 800; color: #fff; margin: 0; }
        .video-preview-card { border-radius: 18px; overflow-y:auto; background: #020617; border: 1px solid rgba(255,255,255,0.08); }
        .video-preview-player { width: 100%; max-height: 320px; display: block; background: #000; }
        .upload-state-pill { padding: 8px 12px; border-radius: 999px; font-size: 12px; font-weight: 800; background: rgba(34,197,94,0.16); color: #86efac; }
        .upload-state-pill.busy { background: rgba(59,130,246,0.16); color: #93c5fd; }
        .upload-state-pill.error { background: rgba(239,68,68,0.16); color: #fca5a5; }
        .muted { margin: 0; color: #94a3b8; font-size: 13px; }
        .upload-progress { display: grid; gap: 8px; }
        .progress-bar { height: 10px; border-radius: 999px; background: rgba(148,163,184,0.18); overflow-y:auto; }
        .progress-fill { height: 100%; border-radius: inherit; background: linear-gradient(90deg, #8b5cf6, #3b82f6); transition: width 160ms ease; }
        .progress-stats-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; font-size: 12px; color: #cbd5e1; }
        .thumbnail-row { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 16px; background: rgba(255,255,255,0.04); }
        .video-thumb { width: 120px; height: 68px; object-fit: cover; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08); }
        .quality-select {
          border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; padding: 10px 12px;
          background: rgba(15,23,42,0.82); color: #fff;
        }
        .error-banner { border-radius: 14px; padding: 10px 12px; background: rgba(127,29,29,0.25); border: 1px solid rgba(248,113,113,0.26); color: #fecaca; }
      `}</style>
    </div>
  );
}
