import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * StreamRecordingAndFilters - مكون متقدم لتسجيل البث والفلاتر الاحترافية
 * يوفر واجهة احترافية لإدارة التسجيلات والفلاتر
 */
export default function StreamRecordingAndFilters({
  streamId,
  isHost = false,
  isRecording = false,
  recordingState = 'idle',
  recordingDuration = 0,
  recordingSize = 0,
  activeFilter = 'none',
  
  onStartRecording,
  onStopRecording,
  onApplyFilter,
  onRemoveFilter,
  onDeleteRecording,
  onDownloadRecording,
}) {
  const [showRecordingPanel, setShowRecordingPanel] = useState(false);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [recordings, setRecordings] = useState([]);
  const [recordingOptions, setRecordingOptions] = useState({
    quality: 'hd',
    format: 'mp4',
    bitrate: 'auto',
  });
  const [filterIntensity, setFilterIntensity] = useState(1.0);
  const [selectedRecording, setSelectedRecording] = useState(null);

  // خيارات الجودة المتاحة
  const QUALITY_OPTIONS = [
    { id: '4k', label: '4K Ultra HD', resolution: '2160p', bitrate: '25 Mbps', icon: '🎬' },
    { id: 'hd', label: 'Full HD', resolution: '1080p', bitrate: '8 Mbps', icon: '📺' },
    { id: 'sd', label: 'Standard HD', resolution: '720p', bitrate: '4 Mbps', icon: '📹' },
    { id: 'mobile', label: 'Mobile', resolution: '480p', bitrate: '2 Mbps', icon: '📱' },
  ];

  // صيغ التسجيل المتاحة
  const FORMAT_OPTIONS = [
    { id: 'mp4', label: 'MP4 (الأكثر توافقاً)', icon: '▶️', size: 'كبير' },
    { id: 'webm', label: 'WebM (ويب)', icon: '🌐', size: 'متوسط' },
    { id: 'mov', label: 'MOV (Apple)', icon: '🍎', size: 'كبير' },
    { id: 'mkv', label: 'MKV (عالي الجودة)', icon: '💎', size: 'كبير جداً' },
  ];

  // خيارات معدل البت
  const BITRATE_OPTIONS = [
    { id: 'auto', label: 'تكيفي تلقائي', description: 'يتعدل حسب الشبكة' },
    { id: 'high', label: 'عالي جداً', description: '20+ Mbps' },
    { id: 'high', label: 'عالي', description: '10-15 Mbps' },
    { id: 'medium', label: 'متوسط', description: '5-10 Mbps' },
    { id: 'low', label: 'منخفض', description: '1-5 Mbps' },
  ];

  // الفلاتر الاحترافية المتقدمة
  const ADVANCED_FILTERS = [
    {
      id: 'none',
      name: 'بدون فلتر',
      icon: '⭕',
      description: 'بث طبيعي بدون تأثيرات',
      category: 'أساسي',
      preview: 'normal',
    },
    {
      id: 'beauty_pro',
      name: 'تحسين البشرة الاحترافي',
      icon: '✨',
      description: 'تحسين متقدم للوجه مع الحفاظ على الطبيعية',
      category: 'تحسين',
      adjustable: true,
      settings: ['smoothness', 'brightness', 'contrast'],
    },
    {
      id: 'cool',
      name: 'بارد',
      icon: '❄️',
      description: 'تأثير أزرق بارد احترافي',
      category: 'ألوان',
    },
    {
      id: 'warm',
      name: 'دافئ',
      icon: '🔥',
      description: 'تأثير برتقالي دافئ احترافي',
      category: 'ألوان',
    },
    {
      id: 'vintage',
      name: 'عتيق كلاسيكي',
      icon: '📷',
      description: 'تأثير عتيق مع حبيبات فيلم',
      category: 'أسلوب',
    },
    {
      id: 'bw',
      name: 'أبيض وأسود احترافي',
      icon: '⚫',
      description: 'تحويل احترافي إلى أبيض وأسود',
      category: 'ألوان',
    },
    {
      id: 'blur_bg',
      name: 'ضبابية الخلفية الذكية',
      icon: '🌫️',
      description: 'تمويه الخلفية مع الحفاظ على الوضوح',
      category: 'خلفية',
      adjustable: true,
      settings: ['blur_strength', 'edge_detection'],
    },
    {
      id: 'studio',
      name: 'إضاءة الاستوديو الاحترافية',
      icon: '💡',
      description: 'إضاءة احترافية ثلاثية النقاط',
      category: 'إضاءة',
      adjustable: true,
      settings: ['key_light', 'fill_light', 'back_light'],
    },
    {
      id: 'cinematic',
      name: 'سينمائي',
      icon: '🎥',
      description: 'تأثير سينمائي احترافي مع حدود سوداء',
      category: 'أسلوب',
    },
    {
      id: 'neon',
      name: 'نيون',
      icon: '⚡',
      description: 'تأثير نيون حديث وملفت',
      category: 'أسلوب',
    },
    {
      id: 'sepia',
      name: 'سيبيا',
      icon: '🟤',
      description: 'تأثير سيبيا دافئ عتيق',
      category: 'ألوان',
    },
    {
      id: 'vivid',
      name: 'ألوان زاهية',
      icon: '🌈',
      description: 'تعزيز الألوان والتباين',
      category: 'ألوان',
    },
  ];

  // تنسيق مدة التسجيل
  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${minutes}:${String(secs).padStart(2, '0')}`;
  };

  // تنسيق حجم الملف
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // معالج بدء التسجيل
  const handleStartRecording = useCallback(async () => {
    try {
      await onStartRecording?.(recordingOptions);
    } catch (error) {
      console.error('خطأ في بدء التسجيل:', error);
    }
  }, [recordingOptions, onStartRecording]);

  // معالج إيقاف التسجيل
  const handleStopRecording = useCallback(async () => {
    try {
      await onStopRecording?.();
    } catch (error) {
      console.error('خطأ في إيقاف التسجيل:', error);
    }
  }, [onStopRecording]);

  // معالج تطبيق الفلتر
  const handleApplyFilter = useCallback((filterId) => {
    onApplyFilter?.(filterId, { intensity: filterIntensity });
  }, [filterIntensity, onApplyFilter]);

  // تجميع الفلاتر حسب الفئة
  const filtersByCategory = ADVANCED_FILTERS.reduce((acc, filter) => {
    if (!acc[filter.category]) {
      acc[filter.category] = [];
    }
    acc[filter.category].push(filter);
    return acc;
  }, {});

  return (
    <div className="stream-recording-filters" dir="rtl">
      {/* أزرار التحكم الرئيسية */}
      <div className="control-buttons">
        <button
          type="button"
          className={`control-btn recording-btn ${isRecording ? 'recording' : ''}`}
          onClick={() => setShowRecordingPanel(!showRecordingPanel)}
          title="إدارة التسجيل"
        >
          <span className="btn-icon">🎥</span>
          <span className="btn-label">تسجيل</span>
          {isRecording && (
            <span className="recording-indicator">
              <span className="pulse"></span>
              {formatDuration(recordingDuration)}
            </span>
          )}
        </button>

        <button
          type="button"
          className="control-btn filters-btn"
          onClick={() => setShowFiltersPanel(!showFiltersPanel)}
          title="الفلاتر الاحترافية"
        >
          <span className="btn-icon">🎨</span>
          <span className="btn-label">فلاتر</span>
        </button>
      </div>

      {/* لوحة التسجيل */}
      <AnimatePresence>
        {showRecordingPanel && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="recording-panel"
          >
            <div className="panel-header">
              <strong>🎥 إدارة التسجيل</strong>
              <button
                type="button"
                className="panel-close"
                onClick={() => setShowRecordingPanel(false)}
              >
                ✕
              </button>
            </div>

            {/* حالة التسجيل الحالية */}
            <div className="recording-status">
              {isRecording ? (
                <div className="recording-active">
                  <div className="status-indicator">
                    <span className="pulse-dot"></span>
                    جارٍ التسجيل
                  </div>
                  <div className="recording-info">
                    <span>المدة: {formatDuration(recordingDuration)}</span>
                    <span>الحجم: {formatFileSize(recordingSize)}</span>
                  </div>
                  <button
                    type="button"
                    className="stop-recording-btn"
                    onClick={handleStopRecording}
                  >
                    ⏹ إيقاف التسجيل
                  </button>
                </div>
              ) : (
                <div className="recording-inactive">
                  <p>التسجيل متوقف حالياً</p>
                </div>
              )}
            </div>

            {/* خيارات التسجيل */}
            <div className="recording-options">
              <div className="option-group">
                <label>جودة التسجيل</label>
                <div className="quality-grid">
                  {QUALITY_OPTIONS.map((quality) => (
                    <button
                      key={quality.id}
                      type="button"
                      className={`quality-option ${recordingOptions.quality === quality.id ? 'selected' : ''}`}
                      onClick={() => setRecordingOptions({ ...recordingOptions, quality: quality.id })}
                    >
                      <div className="quality-icon">{quality.icon}</div>
                      <div className="quality-label">{quality.label}</div>
                      <div className="quality-specs">{quality.resolution} • {quality.bitrate}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="option-group">
                <label>صيغة التسجيل</label>
                <div className="format-grid">
                  {FORMAT_OPTIONS.map((format) => (
                    <button
                      key={format.id}
                      type="button"
                      className={`format-option ${recordingOptions.format === format.id ? 'selected' : ''}`}
                      onClick={() => setRecordingOptions({ ...recordingOptions, format: format.id })}
                    >
                      <div className="format-icon">{format.icon}</div>
                      <div className="format-label">{format.label}</div>
                      <div className="format-size">{format.size}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="option-group">
                <label>معدل البت</label>
                <div className="bitrate-options">
                  {BITRATE_OPTIONS.map((bitrate) => (
                    <button
                      key={bitrate.id}
                      type="button"
                      className={`bitrate-option ${recordingOptions.bitrate === bitrate.id ? 'selected' : ''}`}
                      onClick={() => setRecordingOptions({ ...recordingOptions, bitrate: bitrate.id })}
                    >
                      <div className="bitrate-label">{bitrate.label}</div>
                      <div className="bitrate-description">{bitrate.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* زر بدء التسجيل */}
            {!isRecording && (
              <button
                type="button"
                className="start-recording-btn"
                onClick={handleStartRecording}
              >
                ⏺ بدء التسجيل
              </button>
            )}

            {/* قائمة التسجيلات السابقة */}
            {recordings.length > 0 && (
              <div className="recordings-history">
                <h4>التسجيلات السابقة</h4>
                <div className="recordings-list">
                  {recordings.map((recording) => (
                    <div key={recording.id} className="recording-item">
                      <div className="recording-details">
                        <span className="recording-name">{recording.name}</span>
                        <span className="recording-meta">
                          {formatDuration(recording.duration)} • {formatFileSize(recording.size)}
                        </span>
                      </div>
                      <div className="recording-actions">
                        <button
                          type="button"
                          className="action-btn download-btn"
                          onClick={() => onDownloadRecording?.(recording.id)}
                          title="تحميل"
                        >
                          ⬇️
                        </button>
                        <button
                          type="button"
                          className="action-btn delete-btn"
                          onClick={() => onDeleteRecording?.(recording.id)}
                          title="حذف"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* لوحة الفلاتر */}
      <AnimatePresence>
        {showFiltersPanel && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="filters-panel"
          >
            <div className="panel-header">
              <strong>🎨 الفلاتر الاحترافية</strong>
              <button
                type="button"
                className="panel-close"
                onClick={() => setShowFiltersPanel(false)}
              >
                ✕
              </button>
            </div>

            {/* عنصر تحكم الشدة */}
            <div className="intensity-control">
              <label>شدة الفلتر</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={filterIntensity}
                onChange={(e) => setFilterIntensity(parseFloat(e.target.value))}
                className="intensity-slider"
              />
              <span className="intensity-value">{Math.round(filterIntensity * 100)}%</span>
            </div>

            {/* الفلاتر مجمعة حسب الفئة */}
            <div className="filters-by-category">
              {Object.entries(filtersByCategory).map(([category, filters]) => (
                <div key={category} className="filter-category">
                  <h4 className="category-title">{category}</h4>
                  <div className="filters-grid">
                    {filters.map((filter) => (
                      <button
                        key={filter.id}
                        type="button"
                        className={`filter-item ${activeFilter === filter.id ? 'active' : ''}`}
                        onClick={() => {
                          handleApplyFilter(filter.id);
                          setShowFiltersPanel(false);
                        }}
                        title={filter.description}
                      >
                        <div className="filter-icon">{filter.icon}</div>
                        <div className="filter-name">{filter.name}</div>
                        <div className="filter-description">{filter.description}</div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .stream-recording-filters {
          display: flex;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
        }

        .control-buttons {
          display: flex;
          gap: 8px;
        }

        .control-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background: rgba(124, 58, 237, 0.1);
          border: 1px solid rgba(124, 58, 237, 0.3);
          border-radius: 6px;
          color: white;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 12px;
          font-weight: 600;
        }

        .control-btn:hover {
          background: rgba(124, 58, 237, 0.2);
          border-color: rgba(124, 58, 237, 0.5);
        }

        .control-btn.recording-btn.recording {
          background: rgba(239, 68, 68, 0.2);
          border-color: rgba(239, 68, 68, 0.5);
        }

        .btn-icon {
          font-size: 16px;
        }

        .recording-indicator {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          color: #ef4444;
          font-weight: bold;
        }

        .pulse {
          width: 6px;
          height: 6px;
          background: #ef4444;
          border-radius: 50%;
          animation: pulse 1s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .recording-panel,
        .filters-panel {
          background: rgba(7, 12, 24, 0.95);
          border: 1px solid rgba(124, 58, 237, 0.2);
          border-radius: 8px;
          padding: 16px;
          backdrop-filter: blur(10px);
          max-width: 500px;
          max-height: 600px;
          overflow-y: auto;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          color: white;
          font-weight: 600;
        }

        .panel-close {
          background: none;
          border: none;
          color: white;
          font-size: 20px;
          cursor: pointer;
          padding: 0;
        }

        .recording-status {
          margin-bottom: 16px;
          padding: 12px;
          background: rgba(124, 58, 237, 0.1);
          border-radius: 6px;
          border: 1px solid rgba(124, 58, 237, 0.2);
        }

        .recording-active {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .status-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #ef4444;
          font-weight: 600;
        }

        .pulse-dot {
          width: 8px;
          height: 8px;
          background: #ef4444;
          border-radius: 50%;
          animation: pulse 1s infinite;
        }

        .recording-info {
          display: flex;
          gap: 16px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.8);
        }

        .stop-recording-btn {
          padding: 8px 12px;
          background: rgba(239, 68, 68, 0.2);
          border: 1px solid rgba(239, 68, 68, 0.5);
          border-radius: 4px;
          color: white;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .stop-recording-btn:hover {
          background: rgba(239, 68, 68, 0.3);
        }

        .recording-options {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 16px;
        }

        .option-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .option-group label {
          color: white;
          font-size: 12px;
          font-weight: 600;
        }

        .quality-grid,
        .format-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }

        .quality-option,
        .format-option {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 10px;
          background: rgba(124, 58, 237, 0.1);
          border: 1px solid rgba(124, 58, 237, 0.2);
          border-radius: 6px;
          color: white;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .quality-option:hover,
        .format-option:hover {
          background: rgba(124, 58, 237, 0.2);
        }

        .quality-option.selected,
        .format-option.selected {
          background: rgba(16, 185, 129, 0.2);
          border-color: rgba(16, 185, 129, 0.5);
        }

        .quality-icon,
        .format-icon {
          font-size: 18px;
        }

        .quality-label,
        .format-label {
          font-size: 11px;
          font-weight: 600;
        }

        .quality-specs,
        .format-size {
          font-size: 9px;
          color: rgba(255, 255, 255, 0.6);
        }

        .bitrate-options {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .bitrate-option {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 10px;
          background: rgba(124, 58, 237, 0.1);
          border: 1px solid rgba(124, 58, 237, 0.2);
          border-radius: 4px;
          color: white;
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: right;
        }

        .bitrate-option:hover {
          background: rgba(124, 58, 237, 0.2);
        }

        .bitrate-option.selected {
          background: rgba(16, 185, 129, 0.2);
          border-color: rgba(16, 185, 129, 0.5);
        }

        .bitrate-label {
          font-size: 12px;
          font-weight: 600;
        }

        .bitrate-description {
          font-size: 10px;
          color: rgba(255, 255, 255, 0.6);
        }

        .start-recording-btn {
          width: 100%;
          padding: 10px;
          background: rgba(16, 185, 129, 0.2);
          border: 1px solid rgba(16, 185, 129, 0.5);
          border-radius: 6px;
          color: white;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
          margin-bottom: 16px;
        }

        .start-recording-btn:hover {
          background: rgba(16, 185, 129, 0.3);
        }

        .recordings-history {
          margin-top: 16px;
          border-top: 1px solid rgba(124, 58, 237, 0.2);
          padding-top: 16px;
        }

        .recordings-history h4 {
          color: white;
          font-size: 12px;
          margin: 0 0 8px 0;
        }

        .recordings-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .recording-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px;
          background: rgba(124, 58, 237, 0.1);
          border-radius: 4px;
          border: 1px solid rgba(124, 58, 237, 0.2);
        }

        .recording-details {
          display: flex;
          flex-direction: column;
          gap: 2px;
          flex: 1;
        }

        .recording-name {
          color: white;
          font-size: 11px;
          font-weight: 600;
        }

        .recording-meta {
          color: rgba(255, 255, 255, 0.6);
          font-size: 9px;
        }

        .recording-actions {
          display: flex;
          gap: 4px;
        }

        .action-btn {
          width: 24px;
          height: 24px;
          border-radius: 4px;
          border: 1px solid rgba(124, 58, 237, 0.3);
          background: rgba(124, 58, 237, 0.1);
          color: white;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .action-btn:hover {
          background: rgba(124, 58, 237, 0.2);
        }

        .download-btn:hover {
          background: rgba(16, 185, 129, 0.2);
        }

        .delete-btn:hover {
          background: rgba(239, 68, 68, 0.2);
        }

        .intensity-control {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 16px;
          padding: 12px;
          background: rgba(124, 58, 237, 0.1);
          border-radius: 6px;
        }

        .intensity-control label {
          color: white;
          font-size: 12px;
          font-weight: 600;
        }

        .intensity-slider {
          width: 100%;
          height: 4px;
          border-radius: 2px;
          background: rgba(124, 58, 237, 0.2);
          outline: none;
          -webkit-appearance: none;
          appearance: none;
        }

        .intensity-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: rgba(124, 58, 237, 0.8);
          cursor: pointer;
          border: 2px solid rgba(124, 58, 237, 1);
        }

        .intensity-slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: rgba(124, 58, 237, 0.8);
          cursor: pointer;
          border: 2px solid rgba(124, 58, 237, 1);
        }

        .intensity-value {
          color: rgba(255, 255, 255, 0.8);
          font-size: 11px;
          font-weight: 600;
        }

        .filters-by-category {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .filter-category {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .category-title {
          color: rgba(255, 255, 255, 0.8);
          font-size: 11px;
          font-weight: 600;
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .filters-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
          gap: 8px;
        }

        .filter-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 10px;
          background: rgba(124, 58, 237, 0.1);
          border: 1px solid rgba(124, 58, 237, 0.2);
          border-radius: 6px;
          color: white;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .filter-item:hover {
          background: rgba(124, 58, 237, 0.2);
          border-color: rgba(124, 58, 237, 0.5);
        }

        .filter-item.active {
          background: rgba(16, 185, 129, 0.2);
          border-color: rgba(16, 185, 129, 0.5);
          box-shadow: 0 0 12px rgba(16, 185, 129, 0.3);
        }

        .filter-icon {
          font-size: 22px;
        }

        .filter-name {
          font-size: 11px;
          font-weight: 600;
          text-align: center;
        }

        .filter-description {
          font-size: 9px;
          color: rgba(255, 255, 255, 0.6);
          text-align: center;
        }

        @media (max-width: 768px) {
          .recording-panel,
          .filters-panel {
            max-width: 100%;
          }

          .quality-grid,
          .format-grid {
            grid-template-columns: 1fr;
          }

          .filters-grid {
            grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
          }
        }
      `}</style>
    </div>
  );
}
