import { useMemo, useRef, useState } from 'react';
import Button from '../ui/Button.jsx';
import { uploadMediaWithResume } from '../../api/chat.js';

const MAX_VIDEO_SIZE = 500 * 1024 * 1024;
const ALLOWED_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

function formatSize(size = 0) {
  return `${(size / (1024 * 1024)).toFixed(2)}MB`;
}

export default function VideoUploader({ onUploadComplete, onError, label = 'رفع فيديو الريل' }) {
  const [videoFile, setVideoFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState('');
  const fileInputRef = useRef(null);

  const acceptedText = useMemo(() => 'MP4, WebM أو MOV', []);

  const resetLocalState = () => {
    if (previewUrl) {
      try {
        URL.revokeObjectURL(previewUrl);
      } catch {
        // ignore revoke failures
      }
    }
    setVideoFile(null);
    setUploading(false);
    setProgress(0);
    setPreviewUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
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

    if (previewUrl) {
      try {
        URL.revokeObjectURL(previewUrl);
      } catch {
        // ignore revoke failures
      }
    }

    const nextPreviewUrl = URL.createObjectURL(file);
    setVideoFile(file);
    setPreviewUrl(nextPreviewUrl);
    setUploading(true);
    setProgress(0);

    try {
      const response = await uploadMediaWithResume(file, (nextProgress) => setProgress(Number(nextProgress || 0)));
      const payload = response?.data || {};
      onUploadComplete?.({
        file,
        previewUrl: nextPreviewUrl,
        url: payload.media_url || payload.url || payload.file_url,
        payload,
      });
    } catch (error) {
      onError?.(error?.response?.data?.detail || error?.message || 'فشل رفع الفيديو');
      resetLocalState();
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="video-uploader-shell">
      {videoFile ? (
        <div className="video-upload-status">
          <div className="video-preview-card">
            <video src={previewUrl} controls playsInline className="video-preview-player" />
          </div>

          <div className="video-info-row">
            <div>
              <strong>{videoFile.name}</strong>
              <p className="muted">{formatSize(videoFile.size)}</p>
            </div>
            <span className={`upload-state-pill ${uploading ? 'busy' : 'done'}`}>
              {uploading ? 'جارٍ رفع الفيديو...' : 'تم رفع الفيديو'}
            </span>
          </div>

          <div className="upload-progress">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${Math.min(progress, 100)}%` }} />
            </div>
            <div className="progress-info">
              <span>{Math.min(progress, 100)}%</span>
              <span className="muted">رفع حقيقي مع استئناف</span>
            </div>
          </div>

          <div className="upload-actions">
            <Button variant="secondary" onClick={() => fileInputRef.current?.click()} loading={uploading}>استبدال الفيديو</Button>
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
        .video-uploader-shell {
          display: grid;
          gap: 12px;
        }
        .video-upload-status,
        .video-upload-area {
          display: grid;
          gap: 12px;
          padding: 14px;
          border-radius: 18px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(15,23,42,0.66);
        }
        .video-upload-area {
          text-align: center;
          justify-items: center;
          padding: 20px 16px;
        }
        .upload-icon {
          width: 58px;
          height: 58px;
          border-radius: 18px;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, rgba(124,58,237,0.28), rgba(59,130,246,0.16));
          font-size: 28px;
        }
        .upload-title {
          font-weight: 800;
          color: #fff;
          margin: 0;
        }
        .video-preview-card {
          border-radius: 18px;
          overflow: hidden;
          background: #020617;
          border: 1px solid rgba(255,255,255,0.08);
        }
        .video-preview-player {
          width: 100%;
          max-height: 320px;
          display: block;
          background: #000;
        }
        .video-info-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
          color: #fff;
        }
        .upload-state-pill {
          padding: 8px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 800;
          background: rgba(34,197,94,0.16);
          color: #86efac;
        }
        .upload-state-pill.busy {
          background: rgba(59,130,246,0.16);
          color: #93c5fd;
        }
        .muted {
          margin: 0;
          color: #94a3b8;
          font-size: 13px;
        }
        .upload-progress {
          display: grid;
          gap: 8px;
        }
        .progress-bar {
          height: 10px;
          border-radius: 999px;
          background: rgba(148,163,184,0.18);
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #8b5cf6, #3b82f6);
          transition: width 160ms ease;
        }
        .progress-info,
        .upload-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
        }
      `}</style>
    </div>
  );
}
