import { useCallback, useEffect, useRef, useState } from 'react';
import Button from '../ui/Button.jsx';
import './FileUploader.css';
import { formatBytes } from '../../utils/mediaToolkit.js';
import {
  createUploadController,
  generatePreview,
  getUploadStageLabel,
  isAbortError,
  uploadManagedFile,
} from '../../services/upload/index.js';

const DEFAULT_CONCURRENCY = 2;

function createLocalId() {
  return `upload-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function fileKindLabel(file) {
  if (file?.type?.startsWith('image/')) return 'صورة';
  if (file?.type?.startsWith('video/')) return 'فيديو';
  if (file?.type?.startsWith('audio/')) return 'صوت';
  return 'ملف';
}

function iconForFile(file) {
  if (file?.type?.startsWith('image/')) return '🖼️';
  if (file?.type?.startsWith('video/')) return '🎬';
  if (file?.type?.startsWith('audio/')) return '🎧';
  return '📄';
}

async function runWithConcurrency(items, limit, worker) {
  const queue = [...items];
  const runners = Array.from({ length: Math.max(1, Math.min(limit, items.length || 1)) }, async () => {
    while (queue.length) {
      const next = queue.shift();
      if (!next) return;
      await worker(next);
    }
  });
  await Promise.all(runners);
}

export default function FileUploader({
  onUploadComplete,
  onError,
  maxFileSize = 100 * 1024 * 1024,
  concurrency = DEFAULT_CONCURRENCY,
}) {
  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const controllersRef = useRef(new Map());

  const updateFileItem = useCallback((fileId, patch) => {
    setFiles((prev) => prev.map((item) => (item.id === fileId ? { ...item, ...patch } : item)));
  }, []);

  const processFiles = useCallback(async (incomingFiles) => {
    const nextFiles = [];

    for (const file of incomingFiles) {
      if (!file) continue;
      if (file.size > maxFileSize) {
        onError?.(`الملف ${file.name} يتجاوز الحد الأقصى ${formatBytes(maxFileSize)}`);
        continue;
      }

      const id = createLocalId();
      const baseItem = {
        id,
        file,
        kind: fileKindLabel(file),
        icon: iconForFile(file),
        status: 'pending',
        stage: 'queued',
        stageLabel: getUploadStageLabel('queued'),
        progress: 0,
        loadedBytes: 0,
        totalBytes: file.size,
        totalChunks: Math.max(1, Math.ceil(file.size / (5 * 1024 * 1024))),
        chunkIndex: -1,
        retries: 0,
        error: '',
        previewUrl: '',
        blurDataUrl: '',
        thumbnailDataUrl: '',
        cdnUrl: '',
        mediaUrl: '',
        result: null,
      };
      nextFiles.push(baseItem);
    }

    if (!nextFiles.length) return;
    setFiles((prev) => [...prev, ...nextFiles]);

    await Promise.allSettled(nextFiles.map(async (item) => {
      try {
        const preview = await generatePreview(item.file);
        updateFileItem(item.id, {
          previewUrl: preview.previewUrl || '',
          blurDataUrl: preview.blurDataUrl || '',
          thumbnailDataUrl: preview.thumbnailDataUrl || '',
        });
      } catch {
        // preview is optional
      }
    }));
  }, [maxFileSize, onError, updateFileItem]);

  const handleDrag = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.type === 'dragenter' || event.type === 'dragover') {
      setDragActive(true);
    } else if (event.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    const droppedFiles = Array.from(event.dataTransfer?.files || []);
    processFiles(droppedFiles);
  }, [processFiles]);

  const handleFileSelect = useCallback((event) => {
    const selectedFiles = Array.from(event.target.files || []);
    processFiles(selectedFiles);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [processFiles]);

  const cancelUpload = useCallback((fileId) => {
    const controller = controllersRef.current.get(fileId);
    if (controller) controller.abort();
  }, []);

  const startSingleUpload = useCallback(async (item) => {
    const controller = createUploadController();
    controllersRef.current.set(item.id, controller);

    updateFileItem(item.id, {
      status: 'uploading',
      error: '',
      progress: Math.max(1, item.progress || 0),
      stage: 'starting',
      stageLabel: getUploadStageLabel('starting'),
      retries: Number(item.retries || 0) + 1,
    });

    try {
      const result = await uploadManagedFile(item.file, {
        signal: controller.signal,
        retryCount: 3,
        purpose: 'frontend-file-upload',
        onProgress: (payload) => {
          updateFileItem(item.id, {
            status: payload?.stage === 'done' ? 'completed' : 'uploading',
            progress: Math.min(100, Math.max(0, Number(payload?.percent || 0))),
            stage: payload?.stage || 'uploading',
            stageLabel: payload?.stageLabel || getUploadStageLabel(payload?.stage),
            loadedBytes: Number(payload?.loadedBytes || 0),
            totalBytes: Number(payload?.totalBytes || item.file.size),
            totalChunks: Number(payload?.totalChunks || item.totalChunks || 1),
            chunkIndex: Number.isFinite(payload?.chunkIndex) ? Number(payload.chunkIndex) : -1,
          });
        },
      });

      updateFileItem(item.id, {
        status: 'completed',
        progress: 100,
        stage: 'done',
        stageLabel: getUploadStageLabel('done'),
        loadedBytes: result?.preparedFile?.size || item.file.size,
        totalBytes: result?.preparedFile?.size || item.file.size,
        mediaUrl: result?.mediaUrl || result?.url || '',
        cdnUrl: result?.cdnUrl || result?.mediaUrl || result?.url || '',
        result,
        previewUrl: result?.preview?.previewUrl || item.previewUrl,
        blurDataUrl: result?.preview?.blurDataUrl || item.blurDataUrl,
        thumbnailDataUrl: result?.preview?.thumbnailDataUrl || item.thumbnailDataUrl,
      });

      onUploadComplete?.(item.id, result?.cdnUrl || result?.mediaUrl || result?.url || '', result);
    } catch (error) {
      if (isAbortError(error)) {
        updateFileItem(item.id, {
          status: 'cancelled',
          stage: 'cancelled',
          stageLabel: getUploadStageLabel('cancelled'),
          error: 'تم إلغاء الرفع',
        });
        return;
      }

      updateFileItem(item.id, {
        status: 'error',
        stage: 'error',
        stageLabel: getUploadStageLabel('error'),
        error: error?.response?.data?.detail || error?.message || 'فشل رفع الملف',
      });
      onError?.(error?.response?.data?.detail || error?.message || 'فشل رفع الملف');
    } finally {
      controllersRef.current.delete(item.id);
    }
  }, [onError, onUploadComplete, updateFileItem]);

  const startUpload = useCallback(async () => {
    const pending = files.filter((item) => ['pending', 'error', 'cancelled'].includes(item.status));
    if (!pending.length) return;

    setUploading(true);
    try {
      await runWithConcurrency(pending, concurrency, startSingleUpload);
    } finally {
      setUploading(false);
    }
  }, [concurrency, files, startSingleUpload]);

  const retryUpload = useCallback(async (fileId) => {
    const item = files.find((entry) => entry.id === fileId);
    if (!item) return;
    await startSingleUpload(item);
  }, [files, startSingleUpload]);

  const removeFile = useCallback((fileId) => {
    const controller = controllersRef.current.get(fileId);
    if (controller) controller.abort();
    setFiles((prev) => prev.filter((item) => item.id !== fileId));
  }, []);

  useEffect(() => () => {
    controllersRef.current.forEach((controller) => controller.abort());
    controllersRef.current.clear();
  }, []);

  const summary = {
    total: files.length,
    completed: files.filter((item) => item.status === 'completed').length,
    active: files.filter((item) => item.status === 'uploading').length,
    failed: files.filter((item) => item.status === 'error').length,
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
        role="button"
        tabIndex={0}
      >
        <div className="upload-content">
          <div className="upload-icon">📁</div>
          <h3>رفع ملفات جاهز للإنتاج</h3>
          <p className="muted">استئناف تلقائي • Chunk Upload • إلغاء • إعادة محاولة • تتبع تفصيلي • CDN جاهز</p>
          <p className="muted">الحد الأقصى لكل ملف: {formatBytes(maxFileSize)}</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.zip,.rar,.txt"
        />
      </div>

      <div className="upload-toolbar">
        <div className="upload-summary-card">
          <strong>{summary.total}</strong>
          <span>إجمالي الملفات</span>
        </div>
        <div className="upload-summary-card success">
          <strong>{summary.completed}</strong>
          <span>مكتمل</span>
        </div>
        <div className="upload-summary-card warning">
          <strong>{summary.active}</strong>
          <span>قيد الرفع</span>
        </div>
        <div className="upload-summary-card danger">
          <strong>{summary.failed}</strong>
          <span>بحاجة لإعادة</span>
        </div>
      </div>

      <div className="upload-main-actions">
        <Button variant="secondary" onClick={() => fileInputRef.current?.click()} preventRepeat={false}>
          اختيار ملفات
        </Button>
        <Button onClick={startUpload} loading={uploading} disabled={!files.some((item) => ['pending', 'error', 'cancelled'].includes(item.status))} preventRepeat={false}>
          بدء الرفع
        </Button>
      </div>

      {files.length ? (
        <div className="upload-list">
          <div className="upload-items">
            {files.map((item) => {
              const chunkText = item.totalChunks > 1 && item.chunkIndex >= 0
                ? `Chunk ${Math.min(item.chunkIndex + 1, item.totalChunks)}/${item.totalChunks}`
                : item.totalChunks > 1
                  ? `${item.totalChunks} أجزاء`
                  : 'رفع مباشر';

              return (
                <div key={item.id} className={`upload-item ${item.status}`}>
                  <div className="upload-item-media">
                    {item.thumbnailDataUrl ? <img src={item.thumbnailDataUrl} alt={item.file.name} className="upload-thumb" /> : null}
                    {!item.thumbnailDataUrl && item.previewUrl && item.file.type.startsWith('image/') ? <img src={item.previewUrl} alt={item.file.name} className="upload-thumb" /> : null}
                    {!item.thumbnailDataUrl && !(item.previewUrl && item.file.type.startsWith('image/')) ? <div className="upload-item-icon">{item.icon}</div> : null}
                  </div>

                  <div className="upload-item-content">
                    <div className="flex-between upload-item-head">
                      <div>
                        <strong title={item.file.name}>{item.file.name}</strong>
                        <div className="upload-meta-line">
                          <span>{item.kind}</span>
                          <span>{formatBytes(item.file.size)}</span>
                          <span>{chunkText}</span>
                        </div>
                      </div>
                      <span className={`status-badge ${item.status}`}>{item.stageLabel}</span>
                    </div>

                    <div className="progress-panel">
                      <div className="progress-bar large">
                        <div className={`progress-fill ${item.status}`} style={{ width: `${item.progress}%` }} />
                      </div>
                      <div className="progress-stats">
                        <span>{item.progress}%</span>
                        <span>{formatBytes(item.loadedBytes || 0)} / {formatBytes(item.totalBytes || item.file.size)}</span>
                        <span>المحاولة {Math.max(1, item.retries || 0)}</span>
                      </div>
                    </div>

                    {item.status === 'completed' ? (
                      <div className="upload-link-grid">
                        <span className="status-text success">✓ تم الرفع بنجاح عبر {item.result?.provider || 'CDN'}</span>
                        {item.cdnUrl ? <a href={item.cdnUrl} target="_blank" rel="noreferrer">رابط CDN</a> : null}
                      </div>
                    ) : null}

                    {item.error ? <p className="status-text error">✕ {item.error}</p> : null}
                  </div>

                  <div className="upload-item-actions vertical">
                    {item.status === 'uploading' ? (
                      <Button variant="danger" size="small" onClick={() => cancelUpload(item.id)} preventRepeat={false}>
                        إلغاء
                      </Button>
                    ) : null}
                    {['error', 'cancelled'].includes(item.status) ? (
                      <Button variant="secondary" size="small" onClick={() => retryUpload(item.id)} preventRepeat={false}>
                        إعادة المحاولة
                      </Button>
                    ) : null}
                    {item.status !== 'uploading' ? (
                      <Button variant="secondary" size="small" onClick={() => removeFile(item.id)} preventRepeat={false}>
                        حذف
                      </Button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
