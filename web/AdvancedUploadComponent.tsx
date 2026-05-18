import React, { useState, useRef, useCallback, useEffect } from 'react';
import axios, { AxiosProgressEvent } from 'axios';

/**
 * مكون رفع الملفات المتقدم - Advanced Upload Component
 * يوفر:
 * - Drag & Drop
 * - أشرطة تقدم احترافية
 * - إعادة محاولة الرفع
 * - إلغاء الرفع
 * - رفع الملفات بالشرائح
 */

interface UploadProgress {
  uploadId: string;
  filename: string;
  totalSize: number;
  uploadedSize: number;
  totalChunks: number;
  uploadedChunks: number;
  failedChunks: number;
  progressPercent: number;
  speedBps: number;
  etaSeconds: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled' | 'paused';
}

interface UploadSession {
  uploadId: string;
  filename: string;
  fileSize: number;
  fileType: string;
  chunkSize: number;
  totalChunks: number;
  expiresAt: string;
}

const CHUNK_SIZE = 5 * 1024 * 1024; // 5 MB
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8003';

export const AdvancedUploadComponent: React.FC = () => {
  const [uploads, setUploads] = useState<Map<string, UploadProgress>>(new Map());
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadControllers = useRef<Map<string, AbortController>>(new Map());

  /**
   * بدء جلسة رفع جديدة
   */
  const initiateUpload = async (
    file: File,
    userId: string
  ): Promise<UploadSession | null> => {
    try {
      const response = await axios.post<UploadSession>(`${API_BASE_URL}/upload/initiate`, {
        user_id: userId,
        filename: file.name,
        file_size: file.size,
        file_type: file.type.startsWith('video') ? 'video' : 'image'
      });

      return response.data;
    } catch (error) {
      console.error('Error initiating upload:', error);
      return null;
    }
  };

  /**
   * حساب بصمة الشريحة
   */
  const calculateChunkHash = async (chunk: Blob): Promise<string> => {
    const buffer = await chunk.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  /**
   * رفع شريحة واحدة
   */
  const uploadChunk = async (
    uploadId: string,
    chunkIndex: number,
    chunk: Blob,
    chunkHash: string,
    onProgress: (progress: number) => void
  ): Promise<boolean> => {
    try {
      const formData = new FormData();
      formData.append('file', chunk);

      const controller = new AbortController();
      uploadControllers.current.set(`${uploadId}-${chunkIndex}`, controller);

      const response = await axios.post(
        `${API_BASE_URL}/upload/${uploadId}/chunk/${chunkIndex}`,
        formData,
        {
          headers: {
            'Content-Type': 'application/octet-stream'
          },
          onUploadProgress: (event: AxiosProgressEvent) => {
            if (event.total) {
              onProgress((event.loaded / event.total) * 100);
            }
          },
          signal: controller.signal
        }
      );

      return response.data.success;
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Chunk upload cancelled');
      } else {
        console.error('Error uploading chunk:', error);
      }
      return false;
    }
  };

  /**
   * رفع ملف كامل بالشرائح
   */
  const uploadFileInChunks = async (
    file: File,
    session: UploadSession,
    userId: string
  ): Promise<void> => {
    const uploadId = session.uploadId;
    const totalChunks = session.totalChunks;
    const startTime = Date.now();
    let uploadedChunks = 0;
    let failedChunks: number[] = [];

    // تحديث الحالة الأولية
    setUploads(prev => new Map(prev).set(uploadId, {
      uploadId,
      filename: file.name,
      totalSize: file.size,
      uploadedSize: 0,
      totalChunks,
      uploadedChunks: 0,
      failedChunks: 0,
      progressPercent: 0,
      speedBps: 0,
      etaSeconds: 0,
      status: 'in_progress'
    }));

    // رفع الشرائح
    for (let i = 0; i < totalChunks; i++) {
      const start = i * session.chunkSize;
      const end = Math.min(start + session.chunkSize, file.size);
      const chunk = file.slice(start, end);
      const chunkHash = await calculateChunkHash(chunk);

      const success = await uploadChunk(uploadId, i, chunk, chunkHash, (progress) => {
        // تحديث التقدم
        const uploadedSize = uploadedChunks * session.chunkSize + (progress / 100) * chunk.size;
        const elapsedSeconds = (Date.now() - startTime) / 1000;
        const speedBps = uploadedSize / elapsedSeconds;
        const remainingSize = file.size - uploadedSize;
        const etaSeconds = Math.ceil(remainingSize / speedBps);

        setUploads(prev => {
          const updated = new Map(prev);
          const current = updated.get(uploadId)!;
          current.uploadedSize = uploadedSize;
          current.progressPercent = (uploadedSize / file.size) * 100;
          current.speedBps = speedBps;
          current.etaSeconds = etaSeconds;
          updated.set(uploadId, current);
          return updated;
        });
      });

      if (success) {
        uploadedChunks++;
        setUploads(prev => {
          const updated = new Map(prev);
          const current = updated.get(uploadId)!;
          current.uploadedChunks = uploadedChunks;
          updated.set(uploadId, current);
          return updated;
        });
      } else {
        failedChunks.push(i);
      }
    }

    // التعامل مع الشرائح الفاشلة
    if (failedChunks.length > 0) {
      setUploads(prev => {
        const updated = new Map(prev);
        const current = updated.get(uploadId)!;
        current.failedChunks = failedChunks.length;
        current.status = 'failed';
        updated.set(uploadId, current);
        return updated;
      });
      return;
    }

    // إنهاء الرفع
    try {
      const response = await axios.post(`${API_BASE_URL}/upload/${uploadId}/finalize`);

      if (response.data.success) {
        setUploads(prev => {
          const updated = new Map(prev);
          const current = updated.get(uploadId)!;
          current.status = 'completed';
          current.progressPercent = 100;
          updated.set(uploadId, current);
          return updated;
        });
      }
    } catch (error) {
      console.error('Error finalizing upload:', error);
      setUploads(prev => {
        const updated = new Map(prev);
        const current = updated.get(uploadId)!;
        current.status = 'failed';
        updated.set(uploadId, current);
        return updated;
      });
    }
  };

  /**
   * معالجة اختيار الملفات
   */
  const handleFileSelect = async (files: FileList | null, userId: string = 'user123') => {
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // بدء جلسة رفع
      const session = await initiateUpload(file, userId);
      if (!session) continue;

      // رفع الملف بالشرائح
      await uploadFileInChunks(file, session, userId);
    }
  };

  /**
   * معالجة Drag & Drop
   */
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    handleFileSelect(files);
  };

  /**
   * إلغاء الرفع
   */
  const cancelUpload = async (uploadId: string) => {
    try {
      await axios.post(`${API_BASE_URL}/upload/${uploadId}/cancel`);

      // إلغاء جميع الطلبات المعلقة
      for (let i = 0; i < 100; i++) {
        const controller = uploadControllers.current.get(`${uploadId}-${i}`);
        if (controller) {
          controller.abort();
        }
      }

      setUploads(prev => {
        const updated = new Map(prev);
        const current = updated.get(uploadId);
        if (current) {
          current.status = 'cancelled';
          updated.set(uploadId, current);
        }
        return updated;
      });
    } catch (error) {
      console.error('Error cancelling upload:', error);
    }
  };

  /**
   * إيقاف الرفع مؤقتاً
   */
  const pauseUpload = async (uploadId: string) => {
    try {
      await axios.post(`${API_BASE_URL}/upload/${uploadId}/pause`);

      setUploads(prev => {
        const updated = new Map(prev);
        const current = updated.get(uploadId);
        if (current) {
          current.status = 'paused';
          updated.set(uploadId, current);
        }
        return updated;
      });
    } catch (error) {
      console.error('Error pausing upload:', error);
    }
  };

  /**
   * استئناف الرفع
   */
  const resumeUpload = async (uploadId: string) => {
    try {
      await axios.post(`${API_BASE_URL}/upload/${uploadId}/resume`);

      setUploads(prev => {
        const updated = new Map(prev);
        const current = updated.get(uploadId);
        if (current) {
          current.status = 'in_progress';
          updated.set(uploadId, current);
        }
        return updated;
      });
    } catch (error) {
      console.error('Error resuming upload:', error);
    }
  };

  /**
   * إعادة محاولة الشرائح الفاشلة
   */
  const retryFailedChunks = async (uploadId: string) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/upload/${uploadId}/retry`);

      if (response.data.success) {
        setUploads(prev => {
          const updated = new Map(prev);
          const current = updated.get(uploadId);
          if (current) {
            current.status = 'in_progress';
            current.failedChunks = 0;
            updated.set(uploadId, current);
          }
          return updated;
        });
      }
    } catch (error) {
      console.error('Error retrying failed chunks:', error);
    }
  };

  /**
   * تنسيق السرعة
   */
  const formatSpeed = (bps: number): string => {
    if (bps < 1024) return `${bps.toFixed(0)} B/s`;
    if (bps < 1024 * 1024) return `${(bps / 1024).toFixed(2)} KB/s`;
    return `${(bps / (1024 * 1024)).toFixed(2)} MB/s`;
  };

  /**
   * تنسيق الحجم
   */
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  /**
   * تنسيق الوقت
   */
  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${Math.ceil(seconds)}s`;
    if (seconds < 3600) return `${Math.ceil(seconds / 60)}m`;
    return `${Math.ceil(seconds / 3600)}h`;
  };

  return (
    <div className="advanced-upload-container" style={styles.container}>
      {/* منطقة Drag & Drop */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          ...styles.dropZone,
          ...(isDragging ? styles.dropZoneActive : {})
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={(e) => handleFileSelect(e.target.files)}
          style={styles.fileInput}
        />

        <div style={styles.dropZoneContent}>
          <p style={styles.dropZoneText}>
            {isDragging ? '📁 اسحب الملفات هنا' : '📁 اسحب الملفات هنا أو انقر للاختيار'}
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            style={styles.selectButton}
          >
            اختر الملفات
          </button>
        </div>
      </div>

      {/* قائمة الرفعات */}
      <div style={styles.uploadsList}>
        {Array.from(uploads.values()).map((upload) => (
          <div key={upload.uploadId} style={styles.uploadItem}>
            <div style={styles.uploadHeader}>
              <span style={styles.uploadName}>{upload.filename}</span>
              <span style={styles.uploadSize}>
                {formatSize(upload.uploadedSize)} / {formatSize(upload.totalSize)}
              </span>
            </div>

            {/* شريط التقدم */}
            <div style={styles.progressBar}>
              <div
                style={{
                  ...styles.progressFill,
                  width: `${upload.progressPercent}%`,
                  backgroundColor: getProgressColor(upload.status)
                }}
              />
            </div>

            {/* معلومات التقدم */}
            <div style={styles.uploadInfo}>
              <span>{upload.progressPercent.toFixed(1)}%</span>
              <span>{formatSpeed(upload.speedBps)}</span>
              {upload.status === 'in_progress' && (
                <span>ETA: {formatTime(upload.etaSeconds)}</span>
              )}
              {upload.failedChunks > 0 && (
                <span style={styles.failedChunks}>
                  ❌ {upload.failedChunks} شرائح فاشلة
                </span>
              )}
            </div>

            {/* أزرار التحكم */}
            <div style={styles.uploadControls}>
              {upload.status === 'in_progress' && (
                <>
                  <button
                    onClick={() => pauseUpload(upload.uploadId)}
                    style={styles.controlButton}
                  >
                    ⏸️ إيقاف
                  </button>
                  <button
                    onClick={() => cancelUpload(upload.uploadId)}
                    style={styles.controlButton}
                  >
                    ❌ إلغاء
                  </button>
                </>
              )}

              {upload.status === 'paused' && (
                <button
                  onClick={() => resumeUpload(upload.uploadId)}
                  style={styles.controlButton}
                >
                  ▶️ استئناف
                </button>
              )}

              {upload.status === 'failed' && upload.failedChunks > 0 && (
                <button
                  onClick={() => retryFailedChunks(upload.uploadId)}
                  style={styles.controlButton}
                >
                  🔄 إعادة محاولة
                </button>
              )}

              {upload.status === 'completed' && (
                <span style={styles.completedBadge}>✅ مكتمل</span>
              )}

              {upload.status === 'cancelled' && (
                <span style={styles.cancelledBadge}>⛔ ملغى</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * الألوان حسب الحالة
 */
function getProgressColor(status: string): string {
  switch (status) {
    case 'completed':
      return '#4CAF50';
    case 'failed':
      return '#f44336';
    case 'paused':
      return '#FF9800';
    default:
      return '#2196F3';
  }
}

/**
 * الأنماط
 */
const styles = {
  container: {
    padding: '20px',
    maxWidth: '800px',
    margin: '0 auto',
    fontFamily: 'Arial, sans-serif'
  },
  dropZone: {
    border: '2px dashed #2196F3',
    borderRadius: '8px',
    padding: '40px',
    textAlign: 'center' as const,
    cursor: 'pointer',
    backgroundColor: '#f5f5f5',
    transition: 'all 0.3s ease',
    marginBottom: '20px'
  },
  dropZoneActive: {
    backgroundColor: '#e3f2fd',
    borderColor: '#1976D2',
    transform: 'scale(1.02)'
  },
  dropZoneContent: {
    pointerEvents: 'none' as const
  },
  dropZoneText: {
    fontSize: '18px',
    color: '#666',
    marginBottom: '10px'
  },
  fileInput: {
    display: 'none'
  },
  selectButton: {
    padding: '10px 20px',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px'
  },
  uploadsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '15px'
  },
  uploadItem: {
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '15px',
    backgroundColor: '#fff'
  },
  uploadHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '10px'
  },
  uploadName: {
    fontWeight: 'bold',
    fontSize: '16px'
  },
  uploadSize: {
    color: '#666',
    fontSize: '14px'
  },
  progressBar: {
    width: '100%',
    height: '8px',
    backgroundColor: '#e0e0e0',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '10px'
  },
  progressFill: {
    height: '100%',
    transition: 'width 0.3s ease'
  },
  uploadInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    color: '#666',
    marginBottom: '10px'
  },
  failedChunks: {
    color: '#f44336'
  },
  uploadControls: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end'
  },
  controlButton: {
    padding: '6px 12px',
    backgroundColor: '#f5f5f5',
    border: '1px solid #ddd',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  completedBadge: {
    color: '#4CAF50',
    fontWeight: 'bold'
  },
  cancelledBadge: {
    color: '#f44336',
    fontWeight: 'bold'
  }
};

export default AdvancedUploadComponent;
