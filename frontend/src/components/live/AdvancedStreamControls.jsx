import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * AdvancedStreamControls - لوحة تحكم متقدمة للبث المباشر
 * تتضمن: إنهاء البث، كتم المشترك، حظر المتابع، إغلاق الكاميرا، كتم الصوت
 * مع فلاتر احترافية وتسجيل البث
 */
export default function AdvancedStreamControls({
  isHost = false,
  isRecording = false,
  recordingState = 'idle',
  cameraEnabled = true,
  microphoneEnabled = true,
  healthScore = 92,
  viewerCount = 0,
  heartsCount = 0,
  latencyMs = 1250,
  moderationQueueCount = 0,
  
  // callbacks
  onEndStream,
  onToggleCamera,
  onToggleMic,
  onMuteComment,
  onBanViewer,
  onStartRecording,
  onStopRecording,
  onModerate,
  onApplyFilter,
  onOpenAnalytics,
  
  // حالة البث
  activeViewers = [],
  commentQueue = [],
}) {
  const [showModerationPanel, setShowModerationPanel] = useState(false);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [showRecordingPanel, setShowRecordingPanel] = useState(false);
  const [selectedViewer, setSelectedViewer] = useState(null);
  const [selectedComment, setSelectedComment] = useState(null);
  const [activeFilter, setActiveFilter] = useState('none');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // قائمة الفلاتر الاحترافية
  const PROFESSIONAL_FILTERS = [
    { 
      id: 'none', 
      name: 'بدون فلتر', 
      icon: '⭕',
      description: 'بث بدون تأثيرات'
    },
    { 
      id: 'beauty', 
      name: 'تحسين البشرة', 
      icon: '✨',
      description: 'تحسين طبيعي للوجه'
    },
    { 
      id: 'cool', 
      name: 'بارد', 
      icon: '❄️',
      description: 'تأثير أزرق بارد'
    },
    { 
      id: 'warm', 
      name: 'دافئ', 
      icon: '🔥',
      description: 'تأثير برتقالي دافئ'
    },
    { 
      id: 'vintage', 
      name: 'عتيق', 
      icon: '📷',
      description: 'تأثير عتيق كلاسيكي'
    },
    { 
      id: 'bw', 
      name: 'أبيض وأسود', 
      icon: '⚫',
      description: 'تأثير أبيض وأسود'
    },
    { 
      id: 'blur_bg', 
      name: 'ضبابية الخلفية', 
      icon: '🌫️',
      description: 'تمويه الخلفية الذكي'
    },
    { 
      id: 'studio', 
      name: 'إضاءة الاستوديو', 
      icon: '💡',
      description: 'إضاءة احترافية'
    },
  ];

  // معالج إنهاء البث
  const handleEndStream = useCallback(async () => {
    if (window.confirm('هل أنت متأكد من رغبتك في إنهاء البث؟')) {
      try {
        await onEndStream?.();
      } catch (error) {
        console.error('خطأ في إنهاء البث:', error);
      }
    }
  }, [onEndStream]);

  // معالج كتم المشترك من التعليق
  const handleMuteComment = useCallback(async (commentId, userId) => {
    try {
      await onMuteComment?.({ commentId, userId });
      setSelectedComment(null);
    } catch (error) {
      console.error('خطأ في كتم المشترك:', error);
    }
  }, [onMuteComment]);

  // معالج حظر المتابع
  const handleBanViewer = useCallback(async (userId, username) => {
    if (window.confirm(`هل تريد حظر المستخدم ${username}؟`)) {
      try {
        await onBanViewer?.({ userId, username });
        setSelectedViewer(null);
      } catch (error) {
        console.error('خطأ في حظر المستخدم:', error);
      }
    }
  }, [onBanViewer]);

  // معالج تطبيق الفلتر
  const handleApplyFilter = useCallback((filterId) => {
    setActiveFilter(filterId);
    onApplyFilter?.(filterId);
  }, [onApplyFilter]);

  // معالج بدء/إيقاف التسجيل
  const handleToggleRecording = useCallback(() => {
    if (recordingState === 'recording') {
      onStopRecording?.();
    } else {
      onStartRecording?.();
    }
  }, [recordingState, onStartRecording, onStopRecording]);

  // حساب حالة الصحة
  const healthStatus = useMemo(() => {
    if (healthScore >= 90) return { text: 'ممتاز', color: '#10b981', icon: '✅' };
    if (healthScore >= 75) return { text: 'جيد', color: '#3b82f6', icon: '👍' };
    if (healthScore >= 60) return { text: 'متوسط', color: '#f59e0b', icon: '⚠️' };
    return { text: 'ضعيف', color: '#ef4444', icon: '❌' };
  }, [healthScore]);

  return (
    <div className="advanced-stream-controls" dir="rtl">
      {/* شريط التحكم الرئيسي */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="stream-control-bar"
      >
        {/* القسم الأيسر - الإحصائيات */}
        <div className="control-section left-section">
          <div className="stats-group">
            <div className="stat-item">
              <span className="stat-icon">👁</span>
              <span className="stat-value">{viewerCount}</span>
              <span className="stat-label">مشاهد</span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">💜</span>
              <span className="stat-value">{heartsCount}</span>
              <span className="stat-label">قلب</span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">⚡</span>
              <span className="stat-value">{latencyMs}ms</span>
              <span className="stat-label">تأخير</span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">{healthStatus.icon}</span>
              <span className="stat-value" style={{ color: healthStatus.color }}>
                {healthStatus.text}
              </span>
              <span className="stat-label">الصحة</span>
            </div>
          </div>
        </div>

        {/* القسم الأوسط - أزرار التحكم الأساسية */}
        {isHost && (
          <div className="control-section center-section">
            <button
              type="button"
              className={`control-btn camera-btn ${cameraEnabled ? 'active' : 'inactive'}`}
              onClick={onToggleCamera}
              title={cameraEnabled ? 'إغلاق الكاميرا' : 'فتح الكاميرا'}
            >
              {cameraEnabled ? '📷' : '📷‍🚫'}
            </button>

            <button
              type="button"
              className={`control-btn mic-btn ${microphoneEnabled ? 'active' : 'inactive'}`}
              onClick={onToggleMic}
              title={microphoneEnabled ? 'كتم الصوت' : 'فتح الصوت'}
            >
              {microphoneEnabled ? '🎤' : '🔇'}
            </button>

            <button
              type="button"
              className={`control-btn record-btn ${isRecording ? 'recording' : ''}`}
              onClick={handleToggleRecording}
              title={recordingState === 'recording' ? 'إيقاف التسجيل' : 'بدء التسجيل'}
            >
              {recordingState === 'recording' ? '⏹' : '⏺'}
            </button>

            <button
              type="button"
              className="control-btn end-stream-btn"
              onClick={handleEndStream}
              title="إنهاء البث"
            >
              🛑
            </button>
          </div>
        )}

        {/* القسم الأيمن - أزرار الإجراءات */}
        <div className="control-section right-section">
          <button
            type="button"
            className={`control-btn filters-btn ${showFiltersPanel ? 'active' : ''}`}
            onClick={() => setShowFiltersPanel(!showFiltersPanel)}
            title="الفلاتر الاحترافية"
          >
            🎨
          </button>

          <button
            type="button"
            className={`control-btn moderation-btn ${showModerationPanel ? 'active' : ''} ${moderationQueueCount > 0 ? 'has-alerts' : ''}`}
            onClick={() => setShowModerationPanel(!showModerationPanel)}
            title="أدوات الإشراف"
          >
            🛡️
            {moderationQueueCount > 0 && (
              <span className="alert-badge">{moderationQueueCount}</span>
            )}
          </button>

          <button
            type="button"
            className="control-btn analytics-btn"
            onClick={onOpenAnalytics}
            title="التحليلات"
          >
            📊
          </button>

          <button
            type="button"
            className={`control-btn menu-btn ${isMobileMenuOpen ? 'active' : ''}`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            title="المزيد"
          >
            ⋮
          </button>
        </div>
      </motion.div>

      {/* لوحة الفلاتر الاحترافية */}
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

            <div className="filters-grid">
              {PROFESSIONAL_FILTERS.map((filter) => (
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* لوحة أدوات الإشراف والتحكم */}
      <AnimatePresence>
        {showModerationPanel && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="moderation-panel"
          >
            <div className="panel-header">
              <strong>🛡️ أدوات الإشراف</strong>
              <button
                type="button"
                className="panel-close"
                onClick={() => setShowModerationPanel(false)}
              >
                ✕
              </button>
            </div>

            <div className="moderation-tabs">
              {/* تبويب المتابعين */}
              <div className="tab-section">
                <h3>المتابعين النشطين ({activeViewers.length})</h3>
                <div className="viewers-list">
                  {activeViewers.length > 0 ? (
                    activeViewers.map((viewer) => (
                      <div
                        key={viewer.id}
                        className={`viewer-item ${selectedViewer?.id === viewer.id ? 'selected' : ''}`}
                        onClick={() => setSelectedViewer(viewer)}
                      >
                        <div className="viewer-info">
                          <span className="viewer-name">{viewer.username || viewer.name}</span>
                          <span className="viewer-status">
                            {viewer.is_muted ? '🔇 مكتوم' : '🎤 نشط'}
                          </span>
                        </div>
                        <div className="viewer-actions">
                          <button
                            type="button"
                            className="action-btn mute-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              onMuteComment?.({ userId: viewer.id });
                            }}
                            title="كتم الصوت"
                          >
                            🔇
                          </button>
                          <button
                            type="button"
                            className="action-btn ban-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBanViewer(viewer.id, viewer.username || viewer.name);
                            }}
                            title="حظر المستخدم"
                          >
                            🚫
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="empty-state">لا توجد متابعين نشطين</p>
                  )}
                </div>
              </div>

              {/* تبويب التعليقات */}
              <div className="tab-section">
                <h3>التعليقات المعلقة ({commentQueue.length})</h3>
                <div className="comments-list">
                  {commentQueue.length > 0 ? (
                    commentQueue.map((comment) => (
                      <div
                        key={comment.id}
                        className={`comment-item ${selectedComment?.id === comment.id ? 'selected' : ''}`}
                        onClick={() => setSelectedComment(comment)}
                      >
                        <div className="comment-info">
                          <span className="comment-author">{comment.author || comment.sender}</span>
                          <span className="comment-text">{comment.text || comment.content}</span>
                        </div>
                        <div className="comment-actions">
                          <button
                            type="button"
                            className="action-btn approve-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              onModerate?.({ action: 'approve', commentId: comment.id });
                            }}
                            title="الموافقة"
                          >
                            ✅
                          </button>
                          <button
                            type="button"
                            className="action-btn reject-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              onModerate?.({ action: 'reject', commentId: comment.id });
                            }}
                            title="الرفض"
                          >
                            ❌
                          </button>
                          <button
                            type="button"
                            className="action-btn mute-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMuteComment(comment.id, comment.user_id);
                            }}
                            title="كتم المشترك"
                          >
                            🔇
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="empty-state">لا توجد تعليقات معلقة</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* القائمة الإضافية للجوال */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mobile-menu"
          >
            <button
              type="button"
              className="menu-item"
              onClick={() => {
                setShowFiltersPanel(!showFiltersPanel);
                setIsMobileMenuOpen(false);
              }}
            >
              🎨 الفلاتر
            </button>
            <button
              type="button"
              className="menu-item"
              onClick={() => {
                setShowModerationPanel(!showModerationPanel);
                setIsMobileMenuOpen(false);
              }}
            >
              🛡️ الإشراف
            </button>
            <button
              type="button"
              className="menu-item"
              onClick={() => {
                onOpenAnalytics?.();
                setIsMobileMenuOpen(false);
              }}
            >
              📊 التحليلات
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .advanced-stream-controls {
          width: 100%;
          background: linear-gradient(180deg, rgba(7, 12, 24, 0.95) 0%, rgba(7, 12, 24, 0.85) 100%);
          border-bottom: 1px solid rgba(124, 58, 237, 0.2);
          backdrop-filter: blur(10px);
          z-index: 100;
          position: relative;
        }

        .stream-control-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          gap: 12px;
          flex-wrap: wrap;
        }

        .control-section {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .stats-group {
          display: flex;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          padding: 6px 12px;
          background: rgba(124, 58, 237, 0.1);
          border-radius: 8px;
          border: 1px solid rgba(124, 58, 237, 0.2);
          color: white;
          font-size: 12px;
        }

        .stat-icon {
          font-size: 16px;
        }

        .stat-value {
          font-weight: 700;
          font-size: 14px;
        }

        .stat-label {
          color: rgba(255, 255, 255, 0.6);
          font-size: 10px;
        }

        .control-btn {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          border: 1px solid rgba(124, 58, 237, 0.3);
          background: rgba(124, 58, 237, 0.1);
          color: white;
          font-size: 18px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .control-btn:hover {
          background: rgba(124, 58, 237, 0.2);
          border-color: rgba(124, 58, 237, 0.5);
        }

        .control-btn.active {
          background: rgba(16, 185, 129, 0.2);
          border-color: rgba(16, 185, 129, 0.5);
        }

        .control-btn.inactive {
          background: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.3);
        }

        .end-stream-btn {
          background: rgba(239, 68, 68, 0.2);
          border-color: rgba(239, 68, 68, 0.5);
        }

        .end-stream-btn:hover {
          background: rgba(239, 68, 68, 0.3);
        }

        .alert-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          background: #ef4444;
          color: white;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: bold;
        }

        .filters-panel,
        .moderation-panel {
          background: rgba(7, 12, 24, 0.95);
          border-top: 1px solid rgba(124, 58, 237, 0.2);
          border-bottom: 1px solid rgba(124, 58, 237, 0.2);
          padding: 16px;
          backdrop-filter: blur(10px);
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

        .filters-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 12px;
          max-height: 300px;
          overflow-y: auto;
        }

        .filter-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 12px;
          background: rgba(124, 58, 237, 0.1);
          border: 1px solid rgba(124, 58, 237, 0.2);
          border-radius: 8px;
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
          font-size: 24px;
        }

        .filter-name {
          font-weight: 600;
          font-size: 12px;
        }

        .filter-description {
          font-size: 10px;
          color: rgba(255, 255, 255, 0.6);
          text-align: center;
        }

        .moderation-tabs {
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-height: 400px;
          overflow-y: auto;
        }

        .tab-section {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .tab-section h3 {
          color: white;
          font-size: 14px;
          margin: 0;
          margin-bottom: 8px;
        }

        .viewers-list,
        .comments-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 200px;
          overflow-y: auto;
        }

        .viewer-item,
        .comment-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px;
          background: rgba(124, 58, 237, 0.1);
          border: 1px solid rgba(124, 58, 237, 0.2);
          border-radius: 6px;
          color: white;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .viewer-item:hover,
        .comment-item:hover {
          background: rgba(124, 58, 237, 0.2);
        }

        .viewer-item.selected,
        .comment-item.selected {
          background: rgba(16, 185, 129, 0.2);
          border-color: rgba(16, 185, 129, 0.5);
        }

        .viewer-info,
        .comment-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
        }

        .viewer-name,
        .comment-author {
          font-weight: 600;
          font-size: 12px;
        }

        .viewer-status,
        .comment-text {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.7);
        }

        .viewer-actions,
        .comment-actions {
          display: flex;
          gap: 6px;
        }

        .action-btn {
          width: 28px;
          height: 28px;
          border-radius: 4px;
          border: 1px solid rgba(124, 58, 237, 0.3);
          background: rgba(124, 58, 237, 0.1);
          color: white;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .action-btn:hover {
          background: rgba(124, 58, 237, 0.2);
        }

        .mute-btn:hover {
          background: rgba(249, 115, 22, 0.2);
          border-color: rgba(249, 115, 22, 0.5);
        }

        .ban-btn:hover {
          background: rgba(239, 68, 68, 0.2);
          border-color: rgba(239, 68, 68, 0.5);
        }

        .approve-btn:hover {
          background: rgba(16, 185, 129, 0.2);
          border-color: rgba(16, 185, 129, 0.5);
        }

        .reject-btn:hover {
          background: rgba(239, 68, 68, 0.2);
          border-color: rgba(239, 68, 68, 0.5);
        }

        .empty-state {
          color: rgba(255, 255, 255, 0.5);
          font-size: 12px;
          text-align: center;
          padding: 20px 10px;
          margin: 0;
        }

        .mobile-menu {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 8px 16px;
          background: rgba(7, 12, 24, 0.95);
          border-top: 1px solid rgba(124, 58, 237, 0.2);
        }

        .menu-item {
          padding: 10px 12px;
          background: rgba(124, 58, 237, 0.1);
          border: 1px solid rgba(124, 58, 237, 0.2);
          border-radius: 6px;
          color: white;
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: right;
          font-size: 14px;
        }

        .menu-item:hover {
          background: rgba(124, 58, 237, 0.2);
          border-color: rgba(124, 58, 237, 0.5);
        }

        @media (max-width: 768px) {
          .stream-control-bar {
            padding: 10px 12px;
            gap: 8px;
          }

          .control-btn {
            width: 36px;
            height: 36px;
            font-size: 16px;
          }

          .stat-item {
            padding: 4px 8px;
            font-size: 10px;
          }

          .filters-grid {
            grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
          }
        }
      `}</style>
    </div>
  );
}
