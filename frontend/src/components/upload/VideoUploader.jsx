import { useEffect, useMemo, useRef, useState } from 'react';
import Button from '../ui/Button.jsx';
import mediaUploadService from '../../services/media/mediaUploadService.js';
import {
  AUDIO_MODE_OPTIONS,
  VIDEO_FILTER_PRESETS,
  buildVideoFilterStyle,
  buildVideoPreview,
  createManagedUploadTask,
  formatBytes,
  formatEta,
  formatSpeed,
  processVideoFile,
  revokeObjectUrl,
} from '../../services/upload/uploadHelpers.js';

const MAX_VIDEO_SIZE = 500 * 1024 * 1024;
// ✅ v47.1: أصل الأنواع المدعومة (العرض في UI فقط)
const ALLOWED_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
// ✅ v47.1: امتدادات الفيديو المقبولة (على ويب الجوال، بعض المتصفحات ترجع file.type فارغًا أو غير قياسي)
const ALLOWED_EXTENSIONS = ['mp4', 'webm', 'mov', 'm4v', 'mkv', '3gp', 'hevc'];
// ✅ v47.1: فحص مرن للتحقق من أن الملف فيديو على جميع المتصفحات (خصوصاً ويب الجوال)
function isAcceptableVideoFile(file) {
  if (!file) return false;
  const type = String(file.type || '').toLowerCase();
  const name = String(file.name || '').toLowerCase();
  const ext = name.includes('.') ? name.split('.').pop() : '';
  // 1) MIME يبدأ بـ video/  → مقبول
  if (type.startsWith('video/')) return true;
  // 2) بعض متصفحات الجوال (وخاصة عند التقاط فيديو من الكاميرا) ترجع type فارغًا أو application/octet-stream
  if (!type || type === 'application/octet-stream') {
    return ALLOWED_EXTENSIONS.includes(ext);
  }
  // 3) حالات أخرى: تحقق من الامتداد كاحتياط
  return ALLOWED_EXTENSIONS.includes(ext);
}
const DEFAULT_ADJUSTMENTS = {
  brightness: 100,
  contrast: 100,
  saturation: 110,
  blur: 0,
};

function formatDuration(seconds = 0) {
  const total = Math.max(0, Math.round(Number(seconds || 0)));
  const minutes = Math.floor(total / 60);
  const remain = total % 60;
  return `${minutes}:${String(remain).padStart(2, '0')}`;
}

function stageLabel(stage = '') {
  if (stage === 'processing-video') return 'تحسين الفيديو والصوت';
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

function SliderControl({ label, value, min, max, step = 1, suffix = '', disabled, onChange }) {
  return (
    <label className="studio-slider">
      <div className="studio-slider-head">
        <span>{label}</span>
        <strong>{value}{suffix}</strong>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
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
  const [enhancementEnabled, setEnhancementEnabled] = useState(true);
  const [videoFilter, setVideoFilter] = useState('enhance');
  const [audioMode, setAudioMode] = useState('original');
  const [audioVolume, setAudioVolume] = useState(100);
  const [adjustments, setAdjustments] = useState(DEFAULT_ADJUSTMENTS);
  const [errorMessage, setErrorMessage] = useState('');
  const [lastPayload, setLastPayload] = useState(null);
  const fileInputRef = useRef(null);
  const taskRef = useRef(null);

  useEffect(() => () => {
    if (taskRef.current?.abort) taskRef.current.abort();
    revokeObjectUrl(preview?.objectUrl);
  }, [preview?.objectUrl]);

  const acceptedText = useMemo(() => 'MP4, WebM أو MOV', []);
  const previewFilter = useMemo(() => buildVideoFilterStyle({
    enhancementEnabled,
    videoFilter,
    adjustments,
  }), [adjustments, enhancementEnabled, videoFilter]);

  const studioSummary = useMemo(() => {
    const selectedFilter = VIDEO_FILTER_PRESETS.find((item) => item.value === videoFilter)?.label || videoFilter;
    const selectedAudio = AUDIO_MODE_OPTIONS.find((item) => item.value === audioMode)?.label || audioMode;
    return [
      compressionEnabled ? `ضغط ${compressionPreset}` : 'بدون ضغط إضافي',
      enhancementEnabled ? `فلتر ${selectedFilter}` : 'تحسين بصري متوقف',
      `الصوت: ${selectedAudio}`,
      audioMode === 'mute' ? 'كتم قبل الرفع' : `مستوى الصوت ${audioVolume}%`,
    ];
  }, [audioMode, audioVolume, compressionEnabled, compressionPreset, enhancementEnabled, videoFilter]);

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

  const propagateUploadProgress = (payload = {}) => {
    setProgress(Math.min(100, Number(payload?.percent || 0)));
    setProgressMeta((prev) => ({
      ...prev,
      ...payload,
      stage: payload?.stage || prev.stage,
    }));
  };

  const startUpload = async (sourceFile, currentPreview = null) => {
    if (!sourceFile) return;
    setUploading(true);
    setErrorMessage('');
    setProgress(0);
    setLastPayload(null);

    try {
      const fileForUpload = await processVideoFile(sourceFile, {
        enhancementEnabled,
        compressionEnabled,
        compressionPreset,
        videoFilter,
        audioMode,
        volume: audioVolume,
        adjustments,
        onProgress: propagateUploadProgress,
      });
      setPreparedFile(fileForUpload);

      const task = createManagedUploadTask(fileForUpload, ({ signal, onProgress }) => mediaUploadService.uploadFile(fileForUpload, {
        signal,
        onProgress,
        purpose: 'reel-upload',
        compressionPreset,
        chunkRetries: 4,
        retries: 3,
        processingProfile: `${videoFilter}:${audioMode}`,
      }), {
        onProgress: propagateUploadProgress,
      });
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
        enhancementPreset: videoFilter,
        audioMode,
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

    // ✅ v47.1: فحص مرن توافقاً مع متصفحات الجوال التي قد لا تعيد MIME type دقيقًا (خاصة على iOS Safari / Android Chrome)
    if (!isAcceptableVideoFile(file)) {
      const message = 'نوع الملف غير مدعوم. استخدم فيديو MP4 أو WebM أو MOV';
      setErrorMessage(message);
      onError?.(message);
      // ✅ إعادة ضبط قيمة input حتى يستطيع المستخدم إعادة تجربة نفس الملف إن أراد
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.size > MAX_VIDEO_SIZE) {
      const message = `حجم الملف كبير جداً. الحد الأقصى: ${MAX_VIDEO_SIZE / (1024 * 1024)}MB`;
      setErrorMessage(message);
      onError?.(message);
      return;
    }

    revokeObjectUrl(preview?.objectUrl);
    const nextPreview = await buildVideoPreview(file);
    setVideoFile(file);
    setPreparedFile(file);
    setPreview(nextPreview);
    setLastPayload(null);
    setErrorMessage('');
    await startUpload(file, nextPreview);
  };

  const retryUpload = async () => {
    if (!videoFile) return;
    await startUpload(videoFile, preview);
  };

  const updateAdjustment = (key, value) => {
    setAdjustments((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="video-uploader-shell">
      <div className="upload-settings-card">
        <div className="settings-head">
          <div>
            <strong>استوديو تحسين الفيديو قبل الرفع</strong>
            <p className="muted">فلترة الصورة، تحسين الإضاءة، ومعالجة الصوت أو كتمه قبل نشر الريل.</p>
          </div>
          <div className="settings-badges">
            {studioSummary.map((item) => <span key={item} className="studio-badge">{item}</span>)}
          </div>
        </div>

        <div className="settings-grid two-cols">
          <label className="settings-toggle cardish">
            <input type="checkbox" checked={compressionEnabled} onChange={(event) => setCompressionEnabled(event.target.checked)} disabled={uploading} />
            <div>
              <span>ضغط فيديو فعلي قبل الرفع</span>
              <small>يقلل الحجم مع الحفاظ على وضوح مناسب للريلز.</small>
            </div>
          </label>

          <label className="settings-select cardish">
            <span>قوة الضغط</span>
            <select value={compressionPreset} onChange={(event) => setCompressionPreset(event.target.value)} disabled={uploading} className="quality-select">
              <option value="light">Light</option>
              <option value="balanced">Balanced</option>
              <option value="strong">Strong</option>
            </select>
          </label>

          <label className="settings-toggle cardish">
            <input type="checkbox" checked={enhancementEnabled} onChange={(event) => setEnhancementEnabled(event.target.checked)} disabled={uploading} />
            <div>
              <span>تحسين بصري قبل الرفع</span>
              <small>تطبيق فلتر وإضاءة وتباين على الفيديو النهائي.</small>
            </div>
          </label>

          <label className="settings-select cardish">
            <span>فلتر الفيديو</span>
            <select value={videoFilter} onChange={(event) => setVideoFilter(event.target.value)} disabled={uploading || !enhancementEnabled} className="quality-select">
              {VIDEO_FILTER_PRESETS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>

          <label className="settings-select cardish">
            <span>وضع الصوت</span>
            <select value={audioMode} onChange={(event) => setAudioMode(event.target.value)} disabled={uploading} className="quality-select">
              {AUDIO_MODE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>

          <SliderControl
            label="مستوى الصوت"
            value={audioVolume}
            min={0}
            max={200}
            suffix="%"
            disabled={uploading || audioMode === 'mute'}
            onChange={(value) => setAudioVolume(value)}
          />
        </div>

        <div className="studio-sliders-grid">
          <SliderControl label="السطوع" value={adjustments.brightness} min={60} max={140} suffix="%" disabled={uploading || !enhancementEnabled} onChange={(value) => updateAdjustment('brightness', value)} />
          <SliderControl label="التباين" value={adjustments.contrast} min={60} max={160} suffix="%" disabled={uploading || !enhancementEnabled} onChange={(value) => updateAdjustment('contrast', value)} />
          <SliderControl label="التشبع" value={adjustments.saturation} min={0} max={180} suffix="%" disabled={uploading || !enhancementEnabled} onChange={(value) => updateAdjustment('saturation', value)} />
          <SliderControl label="تمويه خفيف" value={adjustments.blur} min={0} max={8} step={0.5} suffix="px" disabled={uploading || !enhancementEnabled} onChange={(value) => updateAdjustment('blur', value)} />
        </div>

        <p className="muted">الرفع يدعم الاستئناف + chunk upload + retry + معاينة Thumbnail حقيقية، ومعالجة الفيديو والصوت قبل النشر داخل نفس الصندوق.</p>
      </div>

      {videoFile ? (
        <div className="video-upload-status">
          <div className="video-preview-card">
            <div className="preview-ribbon">{enhancementEnabled ? 'معاينة بالفلتر الحالي' : 'معاينة أصلية'}</div>
            <video
              src={preview?.objectUrl || ''}
              controls
              playsInline
              muted={audioMode === 'mute'}
              className="video-preview-player"
              style={{ filter: previewFilter || 'none' }}
            />
          </div>

          <div className="video-info-row">
            <div>
              <strong>{videoFile.name}</strong>
              <p className="muted">الأصلي: {formatBytes(videoFile.size)}{preparedFile && preparedFile !== videoFile ? ` • بعد المعالجة: ${formatBytes(preparedFile.size)}` : ''}</p>
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
                <p className="muted">تم توليد thumbnail محلي قبل الرفع، ويمكن استخدامه عند نشر الريل.</p>
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

      {/* ✅ v47.1: على ويب الجوال نستخدم accept="video/*" لتوسيع دائرة التوافق (بعض المتصفحات تتجاهل الاختيار إذا استخدمنا أنواعاً محددة). */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*,video/mp4,video/webm,video/quicktime,video/x-m4v,video/x-matroska,.mp4,.webm,.mov,.m4v,.mkv,.3gp"
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
        .settings-head {
          display: grid;
          gap: 8px;
        }
        .settings-head strong {
          color: #fff;
          font-size: 15px;
        }
        .settings-badges {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .studio-badge {
          padding: 7px 10px;
          border-radius: 999px;
          background: rgba(59,130,246,0.14);
          color: #dbeafe;
          font-size: 12px;
          border: 1px solid rgba(147,197,253,0.16);
        }
        .settings-grid.two-cols {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }
        .cardish {
          border-radius: 16px;
          padding: 12px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
        }
        .settings-toggle {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          color: #fff;
        }
        .settings-toggle small {
          display: block;
          margin-top: 4px;
          color: #94a3b8;
          font-size: 12px;
        }
        .settings-select {
          display: grid;
          gap: 8px;
          color: #fff;
        }
        .studio-sliders-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }
        .studio-slider {
          display: grid;
          gap: 8px;
          padding: 12px;
          border-radius: 16px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
        }
        .studio-slider-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          color: #fff;
          font-size: 13px;
        }
        .studio-slider input[type="range"] {
          width: 100%;
          accent-color: #8b5cf6;
        }
        .upload-actions,
        .progress-info,
        .video-info-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
        }
        .video-upload-area { text-align: center; justify-items: center; padding: 20px 16px; }
        .upload-icon {
          width: 58px; height: 58px; border-radius: 18px; display: grid; place-items: center;
          background: linear-gradient(135deg, rgba(124,58,237,0.28), rgba(59,130,246,0.16)); font-size: 28px;
        }
        .upload-title { font-weight: 800; color: #fff; margin: 0; }
        .video-preview-card { position: relative; border-radius: 18px; overflow: hidden; background: #020617; border: 1px solid rgba(255,255,255,0.08); }
        .preview-ribbon {
          position: absolute;
          top: 10px;
          left: 10px;
          z-index: 2;
          padding: 6px 10px;
          border-radius: 999px;
          background: rgba(15,23,42,0.72);
          color: #fff;
          font-size: 12px;
          border: 1px solid rgba(255,255,255,0.08);
        }
        .video-preview-player { width: 100%; max-height: 320px; display: block; background: #000; }
        .upload-state-pill { padding: 8px 12px; border-radius: 999px; font-size: 12px; font-weight: 800; background: rgba(34,197,94,0.16); color: #86efac; }
        .upload-state-pill.busy { background: rgba(59,130,246,0.16); color: #93c5fd; }
        .upload-state-pill.error { background: rgba(239,68,68,0.16); color: #fca5a5; }
        .muted { margin: 0; color: #94a3b8; font-size: 13px; }
        .upload-progress { display: grid; gap: 8px; }
        .progress-bar { height: 10px; border-radius: 999px; background: rgba(148,163,184,0.18); overflow: hidden; }
        .progress-fill { height: 100%; border-radius: inherit; background: linear-gradient(90deg, #8b5cf6, #3b82f6); transition: width 160ms ease; }
        .progress-stats-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; font-size: 12px; color: #cbd5e1; }
        .thumbnail-row { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 16px; background: rgba(255,255,255,0.04); }
        .video-thumb { width: 120px; height: 68px; object-fit: cover; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08); }
        .quality-select {
          border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; padding: 10px 12px;
          background: rgba(15,23,42,0.82); color: #fff;
        }
        .error-banner { border-radius: 14px; padding: 10px 12px; background: rgba(127,29,29,0.25); border: 1px solid rgba(248,113,113,0.26); color: #fecaca; }
        @media (max-width: 720px) {
          .settings-grid.two-cols,
          .studio-sliders-grid,
          .progress-stats-grid {
            grid-template-columns: minmax(0, 1fr);
          }
        }
      `}</style>
    </div>
  );
}
