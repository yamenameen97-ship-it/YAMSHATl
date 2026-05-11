import { useRef, useState } from 'react';
import Button from '../ui/Button.jsx';
import { uploadMediaWithResume } from '../../api/chat.js';

const MAX_VIDEO_SIZE = 500 * 1024 * 1024;
const ALLOWED_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

export default function VideoUploader({ onUploadComplete, onError, label = 'رفع فيديو' }) {
  const [videoFile, setVideoFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);

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

    setVideoFile(file);
    setUploading(true);
    setProgress(0);

    try {
      const response = await uploadMediaWithResume(file, (nextProgress) => setProgress(nextProgress));
      const payload = response?.data || {};
      onUploadComplete?.({
        file,
        url: payload.media_url || payload.url || payload.file_url,
        payload,
      });
    } catch (error) {
      onError?.(error?.response?.data?.detail || error?.message || 'فشل رفع الفيديو');
      setVideoFile(null);
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveVideo = () => {
    setVideoFile(null);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
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
              <span className="muted">رفع واستئناف حقيقي</span>
            </div>
          </div>

          {!uploading ? (
            <div className="upload-actions">
              <Button variant="secondary" onClick={handleRemoveVideo}>إزالة</Button>
              <Button onClick={() => fileInputRef.current?.click()}>رفع فيديو آخر</Button>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="video-upload-area">
          <div className="upload-icon">🎬</div>
          <p>{label}</p>
          <p className="muted">MP4, WebM أو MOV</p>
          <p className="muted">الحد الأقصى: {MAX_VIDEO_SIZE / (1024 * 1024)}MB</p>
          <Button variant="secondary" onClick={() => fileInputRef.current?.click()} loading={uploading}>اختر فيديو</Button>
        </div>
      )}

      <input ref={fileInputRef} type="file" accept={ALLOWED_TYPES.join(',')} onChange={handleFileSelect} style={{ display: 'none' }} />
    </div>
  );
}
