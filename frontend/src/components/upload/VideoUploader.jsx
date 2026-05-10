import { useRef, useState } from 'react';
import Button from '../ui/Button.jsx';

const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB
const ALLOWED_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks

export default function VideoUploader({ onUploadComplete, onError, label = 'رفع فيديو' }) {
  const [videoFile, setVideoFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedChunks, setUploadedChunks] = useState(0);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      onError?.('نوع الملف غير مدعوم. استخدم MP4 أو WebM أو MOV');
      return;
    }

    // Validate file size
    if (file.size > MAX_VIDEO_SIZE) {
      onError?.(`حجم الملف كبير جداً. الحد الأقصى: ${MAX_VIDEO_SIZE / (1024 * 1024)}MB`);
      return;
    }

    setVideoFile(file);
    await uploadVideo(file);
  };

  const uploadVideo = async (file) => {
    try {
      setUploading(true);
      setProgress(0);
      setUploadedChunks(0);

      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        const formData = new FormData();
        formData.append('chunk', chunk);
        formData.append('chunkIndex', i);
        formData.append('totalChunks', totalChunks);
        formData.append('fileId', file.name + file.size);

        // Mock chunk upload
        await new Promise((resolve) => setTimeout(resolve, 300));

        const newProgress = Math.round(((i + 1) / totalChunks) * 100);
        setProgress(newProgress);
        setUploadedChunks(i + 1);
      }

      onUploadComplete?.(file);
    } catch (error) {
      onError?.(error.message);
      setVideoFile(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveVideo = () => {
    setVideoFile(null);
    setProgress(0);
    setUploadedChunks(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="video-uploader">
      {videoFile ? (
        <div className="video-upload-status">
          <div className="video-info">
            <div className="video-icon">🎬</div>
            <div>
              <strong>{videoFile.name}</strong>
              <p className="muted">{(videoFile.size / (1024 * 1024)).toFixed(2)}MB</p>
            </div>
          </div>

          <div className="upload-progress">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <div className="progress-info">
              <span>{progress}%</span>
              <span className="muted">{uploadedChunks} من {Math.ceil(videoFile.size / CHUNK_SIZE)} chunks</span>
            </div>
          </div>

          {!uploading && (
            <div className="upload-actions">
              <Button
                variant="secondary"
                onClick={handleRemoveVideo}
              >
                إزالة
              </Button>
              <Button
                onClick={() => fileInputRef.current?.click()}
              >
                رفع فيديو آخر
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="video-upload-area">
          <div className="upload-icon">🎬</div>
          <p>{label}</p>
          <p className="muted">MP4, WebM أو MOV</p>
          <p className="muted">الحد الأقصى: {MAX_VIDEO_SIZE / (1024 * 1024)}MB</p>
          <Button
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            loading={uploading}
          >
            اختر فيديو
          </Button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
    </div>
  );
}
