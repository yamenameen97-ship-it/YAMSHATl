import { useCallback, useEffect, useRef, useState } from 'react';
import Button from '../ui/Button.jsx';
import './FileUploader.css';

const CHUNK_SIZE = 1024 * 1024; // 1MB chunks
const MAX_RETRIES = 3;
const COMPRESSION_QUALITY = 0.8;
const CDN_URL = 'https://cdn.yamshat.com/uploads/'; // Mock CDN

export default function FileUploader({ onUploadComplete, onError, maxFileSize = 100 * 1024 * 1024 }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const [backgroundUploads, setBackgroundUploads] = useState([]);

  // Handle drag and drop
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    processFiles(droppedFiles);
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    processFiles(selectedFiles);
  };

  const processFiles = (newFiles) => {
    const validFiles = newFiles.filter((file) => {
      if (file.size > maxFileSize) {
        onError?.(`الملف ${file.name} كبير جداً`);
        return false;
      }
      return true;
    });

    const fileObjects = validFiles.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      progress: 0,
      status: 'pending',
      error: null,
      chunks: Math.ceil(file.size / CHUNK_SIZE),
      uploadedChunks: 0,
      retries: 0,
      cdnUrl: null
    }));

    setFiles((prev) => [...prev, ...fileObjects]);
  };

  const compressImage = async (file) => {
    if (!file.type.startsWith('image/')) return file;

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          canvas.toBlob(
            (blob) => {
              resolve(new File([blob], file.name, { type: file.type }));
            },
            file.type,
            COMPRESSION_QUALITY
          );
        };
      };
    });
  };

  const uploadChunk = async (fileId, chunkIndex, chunk, retryCount = 0) => {
    try {
      const formData = new FormData();
      formData.append('chunk', chunk);
      formData.append('chunkIndex', chunkIndex);
      const fileObj = files.find((f) => f.id === fileId);
      formData.append('totalChunks', fileObj.chunks);
      formData.append('fileId', fileId);

      // Advanced Retry Logic with Exponential Backoff
      await new Promise((resolve, reject) => {
        const delay = retryCount > 0 ? Math.pow(2, retryCount) * 1000 : 0;
        setTimeout(async () => {
          try {
            // Mock API call
            if (Math.random() < 0.05) throw new Error('Network Error');
            resolve();
          } catch (e) {
            reject(e);
          }
        }, delay);
      });

      updateFileProgress(fileId, chunkIndex + 1);
      return true;
    } catch (error) {
      if (retryCount < MAX_RETRIES) {
        return uploadChunk(fileId, chunkIndex, chunk, retryCount + 1);
      }
      throw error;
    }
  };

  const updateFileProgress = (fileId, uploadedChunks) => {
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id === fileId) {
          const progress = Math.round((uploadedChunks / f.chunks) * 100);
          return { ...f, uploadedChunks, progress, status: progress === 100 ? 'completed' : 'uploading' };
        }
        return f;
      })
    );
  };

  const uploadFile = async (fileObj) => {
    try {
      setFiles((prev) =>
        prev.map((f) => (f.id === fileObj.id ? { ...f, status: 'uploading', error: null } : f))
      );

      let fileToUpload = fileObj.file;

      // Image Optimization before upload
      if (fileToUpload.type.startsWith('image/')) {
        fileToUpload = await compressImage(fileToUpload);
      }

      // Chunked Upload Loop
      const totalChunks = Math.ceil(fileToUpload.size / CHUNK_SIZE);
      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, fileToUpload.size);
        const chunk = fileToUpload.slice(start, end);

        await uploadChunk(fileObj.id, i, chunk);
      }

      // CDN Optimization (Simulated URL generation)
      const cdnPath = `${CDN_URL}${fileObj.id}_${fileToUpload.name}`;
      
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileObj.id
            ? { ...f, status: 'completed', progress: 100, cdnUrl: cdnPath }
            : f
        )
      );

      onUploadComplete?.(fileObj.id, cdnPath);
    } catch (error) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileObj.id
            ? { ...f, status: 'error', error: 'فشل الرفع بعد محاولات متعددة' }
            : f
        )
      );
      onError?.(error.message);
    }
  };

  const startUpload = async () => {
    setUploading(true);
    const pendingFiles = files.filter((f) => f.status === 'pending' || f.status === 'error');

    // Parallel upload limited by browser/server capacity
    await Promise.all(pendingFiles.map(f => uploadFile(f)));

    setUploading(false);
  };

  const moveToBackground = (fileId) => {
    const fileObj = files.find((f) => f.id === fileId);
    if (fileObj && fileObj.status === 'uploading') {
      setBackgroundUploads((prev) => [...prev, fileObj]);
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
      // The upload process continues because it's already running in the background (async)
    }
  };

  const removeFile = (fileId) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  return (
    <div className="file-uploader">
      <div
        className={`upload-area ${dragActive ? 'active' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="upload-content">
          <div className="upload-icon">📁</div>
          <h3>اسحب الملفات هنا أو انقر للاختيار</h3>
          <p className="muted">نظام الرفع المتقدم: Chunked Uploads | CDN | Background</p>
          <p className="muted">الحد الأقصى: {(maxFileSize / (1024 * 1024)).toFixed(0)}MB</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          accept="image/*,video/*,.pdf,.doc,.docx"
        />
      </div>

      <div className="upload-main-actions">
        <Button
          onClick={() => fileInputRef.current?.click()}
          variant="secondary"
          style={{ marginTop: '10px' }}
        >
          اختر الملفات
        </Button>
        
        {files.some(f => f.status === 'pending' || f.status === 'error') && (
          <Button
            onClick={startUpload}
            loading={uploading}
            style={{ marginTop: '10px', marginRight: '10px' }}
          >
            بدء الرفع
          </Button>
        )}
      </div>

      {files.length > 0 && (
        <div className="upload-list">
          <div className="upload-items">
            {files.map((fileObj) => (
              <div key={fileObj.id} className={`upload-item ${fileObj.status}`}>
                <div className="upload-item-icon">
                  {fileObj.file.type.startsWith('image/') ? '🖼️' : '📄'}
                </div>

                <div className="upload-item-content">
                  <div className="flex-between">
                    <strong>{fileObj.file.name}</strong>
                    <span className="file-size">{(fileObj.file.size / 1024).toFixed(2)} KB</span>
                  </div>

                  {(fileObj.status === 'uploading' || fileObj.status === 'completed') && (
                    <div className="progress-container">
                      <div className="progress-bar">
                        <div className={`progress-fill ${fileObj.status}`} style={{ width: `${fileObj.progress}%` }} />
                      </div>
                      <span className="progress-text">{fileObj.progress}%</span>
                    </div>
                  )}

                  {fileObj.status === 'completed' && (
                    <p className="status-text success">✓ تم الرفع بنجاح (CDN Optimized)</p>
                  )}

                  {fileObj.status === 'error' && (
                    <p className="status-text error">✕ {fileObj.error}</p>
                  )}
                </div>

                <div className="upload-item-actions">
                  {fileObj.status === 'uploading' && (
                    <Button variant="secondary" size="small" onClick={() => moveToBackground(fileObj.id)}>
                      في الخلفية
                    </Button>
                  )}
                  {fileObj.status === 'error' && (
                    <Button variant="secondary" size="small" onClick={() => uploadFile(fileObj)}>
                      إعادة المحاولة
                    </Button>
                  )}
                  {fileObj.status !== 'uploading' && (
                    <Button variant="secondary" size="small" onClick={() => removeFile(fileObj.id)}>
                      حذف
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {backgroundUploads.length > 0 && (
        <div className="background-uploads-indicator animate-pulse">
          <p>🚀 جاري رفع {backgroundUploads.length} ملف في الخلفية...</p>
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{ __html: `
        .flex-between { display: flex; justify-content: space-between; align-items: center; }
        .progress-container { display: flex; align-items: center; gap: 10px; margin-top: 5px; }
        .progress-bar { flex: 1; height: 6px; background: #e5e7eb; border-radius: 3px; overflow: hidden; }
        .progress-fill { height: 100%; background: #3b82f6; transition: width 0.3s; }
        .progress-fill.completed { background: #10b981; }
        .background-uploads-indicator { 
          position: fixed; bottom: 20px; right: 20px; background: #1f2937; color: white; 
          padding: 12px 24px; border-radius: 50px; box-shadow: 0 10px 25px rgba(0,0,0,0.3); z-index: 9999;
        }
        .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .7; } }
      `}} />
    </div>
  );
}
