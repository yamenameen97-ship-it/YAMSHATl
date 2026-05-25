import { useEffect, useRef, useState } from 'react';
import Button from '../ui/Button.jsx';
import './FileUploader.css';
import mediaUploadService from '../../services/media/mediaUploadService.js';
import {
  buildFilePreview,
  compressVideoFile,
  createManagedUploadTask,
  formatBytes,
  formatEta,
  formatSpeed,
  revokeObjectUrl,
} from '../../services/upload/uploadHelpers.js';

const MAX_RETRIES = 3;

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function iconFor(file) {
  if (String(file?.type || '').startsWith('image/')) return '🖼️';
  if (String(file?.type || '').startsWith('video/')) return '🎬';
  if (String(file?.type || '').startsWith('audio/')) return '🎙️';
  return '📄';
}

function stageLabel(stage = '') {
  if (stage === 'compressing-video') return 'ضغط الفيديو';
  if (stage === 'validating') return 'فحص الملف';
  if (stage === 'optimizing') return 'تحسين الملف';
  if (stage === 'hashing') return 'بصمة الاستئناف';
  if (stage === 'preparing') return 'تجهيز المعاينة';
  if (stage === 'uploading') return 'رفع الشرائح';
  if (stage === 'retrying') return 'إعادة المحاولة';
  if (stage === 'finalizing') return 'إتمام الرفع';
  if (stage === 'done') return 'تم الرفع';
  return 'في الانتظار';
}

export default function FileUploader({ onUploadComplete, onError, maxFileSize = 100 * 1024 * 1024 }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [backgroundMode, setBackgroundMode] = useState(false);
  const fileInputRef = useRef(null);
  const tasksRef = useRef(new Map());

  useEffect(() => {
    return () => {
      tasksRef.current.forEach((task) => task?.abort?.());
      files.forEach((item) => revokeObjectUrl(item.preview?.objectUrl));
    };
  }, []);

  const patchFile = (fileId, recipe) => {
    setFiles((prev) => prev.map((item) => (item.id === fileId ? { ...item, ...(typeof recipe === 'function' ? recipe(item) : recipe) } : item)));
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    if (e.type === 'dragleave') setDragActive(false);
  };

  const processFiles = async (newFiles) => {
    const accepted = [];
    for (const file of newFiles) {
      if (file.size > maxFileSize) {
        onError?.(`الملف ${file.name} أكبر من الحد الأقصى`);
        continue;
      }
      const preview = await buildFilePreview(file);
      accepted.push({
        id: createId(),
        file,
        preparedFile: file,
        preview,
        progress: 0,
        status: 'pending',
        stage: 'idle',
        error: '',
        retryAttempt: 0,
        uploadedUrl: '',
        speedBps: 0,
        etaSeconds: 0,
        background: false,
      });
    }
    setFiles((prev) => [...prev, ...accepted]);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    await processFiles(Array.from(e.dataTransfer.files || []));
  };

  const handleFileSelect = async (e) => {
    await processFiles(Array.from(e.target.files || []));
  };

  const uploadSingle = async (fileObj) => {
    patchFile(fileObj.id, { status: 'uploading', error: '', progress: 0, retryAttempt: 0 });

    try {
      const preparedFile = String(fileObj.file.type || '').startsWith('video/')
        ? await compressVideoFile(fileObj.file, {
          enabled: true,
          preset: 'balanced',
          onProgress: (payload) => patchFile(fileObj.id, {
            stage: payload?.stage || 'compressing-video',
            progress: Math.min(99, Number(payload?.percent || 0)),
          }),
        })
        : fileObj.file;

      patchFile(fileObj.id, { preparedFile });

      const task = createManagedUploadTask(preparedFile, ({ signal, onProgress }) => mediaUploadService.uploadFile(preparedFile, {
        signal,
        onProgress,
        purpose: 'generic-upload',
        retries: MAX_RETRIES,
        chunkRetries: MAX_RETRIES,
      }), {
        onProgress: (payload) => patchFile(fileObj.id, {
          status: 'uploading',
          stage: payload?.stage || 'uploading',
          progress: Math.min(100, Number(payload?.percent || 0)),
          speedBps: Number(payload?.speedBps || 0),
          etaSeconds: Number(payload?.etaSeconds || 0),
          retryAttempt: Number(payload?.retryAttempt || 0),
        }),
      });
      tasksRef.current.set(fileObj.id, task);

      const result = await task.promise;
      patchFile(fileObj.id, {
        status: 'completed',
        stage: 'done',
        progress: 100,
        uploadedUrl: result.mediaUrl || result.url || '',
        result,
      });
      onUploadComplete?.(fileObj.id, result.mediaUrl || result.url || '', result);
    } catch (error) {
      const message = error?.name === 'AbortError' ? 'تم إلغاء الرفع' : error?.message || 'فشل الرفع';
      patchFile(fileObj.id, {
        status: error?.name === 'AbortError' ? 'cancelled' : 'error',
        error: message,
      });
      onError?.(message);
    } finally {
      tasksRef.current.delete(fileObj.id);
    }
  };

  const startUpload = async () => {
    setUploading(true);
    const pending = files.filter((item) => item.status === 'pending' || item.status === 'error' || item.status === 'cancelled');
    try {
      await Promise.all(pending.map((item) => uploadSingle(item)));
    } finally {
      setUploading(false);
    }
  };

  const cancelUpload = (fileId) => {
    tasksRef.current.get(fileId)?.abort?.();
  };

  const moveToBackground = (fileId) => {
    setBackgroundMode(true);
    patchFile(fileId, { background: true });
  };

  const removeFile = (fileId) => {
    const current = files.find((item) => item.id === fileId);
    if (current?.status === 'uploading') return;
    revokeObjectUrl(current?.preview?.objectUrl);
    setFiles((prev) => prev.filter((item) => item.id !== fileId));
  };

  return (
    <div className="file-uploader">
      <div
        className={`upload-area ${dragActive ? 'active' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="upload-content">
          <div className="upload-icon">📁</div>
          <h3>اسحب الملفات هنا أو اضغط للاختيار</h3>
          <p className="muted">Resumable + Chunk + Retry + Cancel + Preview + Background mode</p>
          <p className="muted">الحد الأقصى: {(maxFileSize / (1024 * 1024)).toFixed(0)}MB</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.zip"
        />
      </div>

      <div className="upload-main-actions">
        <Button onClick={() => fileInputRef.current?.click()} variant="secondary">اختر الملفات</Button>
        {files.some((item) => ['pending', 'error', 'cancelled'].includes(item.status)) ? (
          <Button onClick={startUpload} loading={uploading}>ابدأ الرفع</Button>
        ) : null}
      </div>

      {files.length > 0 ? (
        <div className="upload-list">
          <div className="upload-items">
            {files.map((fileObj) => (
              <div key={fileObj.id} className={`upload-item ${fileObj.status}`}>
                <div className="upload-item-icon">{iconFor(fileObj.file)}</div>

                <div className="upload-item-content">
                  <div className="flex-between gap-12 wrap">
                    <strong>{fileObj.file.name}</strong>
                    <span className="file-size">{formatBytes(fileObj.file.size)}</span>
                  </div>

                  <div className="meta-row wrap">
                    <span className="status-chip">{stageLabel(fileObj.stage)}</span>
                    {fileObj.preview?.kind === 'video' && fileObj.preview?.thumbnailUrl ? <img src={fileObj.preview.thumbnailUrl} alt="thumb" className="mini-thumb" /> : null}
                    {fileObj.preview?.kind === 'image' ? <img src={fileObj.preview.dataUrl} alt="preview" className="mini-thumb" /> : null}
                    {fileObj.uploadedUrl ? <span className="cdn-pill">CDN</span> : null}
                  </div>

                  <div className="progress-container">
                    <div className="progress-bar">
                      <div className={`progress-fill ${fileObj.status}`} style={{ width: `${fileObj.progress}%` }} />
                    </div>
                    <span className="progress-text-inline">{fileObj.progress}%</span>
                  </div>

                  <div className="stats-row wrap">
                    <span>السرعة: {formatSpeed(fileObj.speedBps)}</span>
                    <span>المتبقي: {formatEta(fileObj.etaSeconds)}</span>
                    <span>Retry: {fileObj.retryAttempt || 0}</span>
                    {fileObj.background ? <span>في الخلفية</span> : null}
                  </div>

                  {fileObj.status === 'completed' ? <p className="status-text success">✓ تم الرفع بنجاح</p> : null}
                  {fileObj.status === 'error' ? <p className="status-text error">✕ {fileObj.error}</p> : null}
                  {fileObj.status === 'cancelled' ? <p className="status-text pending">تم إلغاء الرفع</p> : null}
                </div>

                <div className="upload-item-actions">
                  {fileObj.status === 'uploading' ? (
                    <>
                      <Button variant="secondary" size="small" onClick={() => moveToBackground(fileObj.id)}>في الخلفية</Button>
                      <Button variant="ghost" size="small" onClick={() => cancelUpload(fileObj.id)}>إلغاء</Button>
                    </>
                  ) : null}
                  {fileObj.status === 'error' || fileObj.status === 'cancelled' ? (
                    <Button variant="secondary" size="small" onClick={() => uploadSingle(fileObj)}>إعادة المحاولة</Button>
                  ) : null}
                  {fileObj.status !== 'uploading' ? (
                    <Button variant="ghost" size="small" onClick={() => removeFile(fileObj.id)}>حذف</Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {backgroundMode && files.some((item) => item.background && item.status === 'uploading') ? (
        <div className="background-uploads-indicator">🚀 فيه ملفات بتترفع في الخلفية</div>
      ) : null}
    </div>
  );
}
