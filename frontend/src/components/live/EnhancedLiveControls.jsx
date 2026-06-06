import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import LiveControls from './LiveControls.jsx';

/**
 * EnhancedLiveControls - تحسينات على لوحة تحكم البث المباشر
 * مع دعم كامل للجوال والاستجابة
 */
export default function EnhancedLiveControls({
  isHost = false,
  isRecording = false,
  recordingState = 'idle',
  healthScore = 92,
  viewerCount = 0,
  heartsCount = 0,
  latencyMs = 1250,
  coHostCount = 0,
  pendingGuestsCount = 0,
  streamMode = 'auto',
  moderationQueueCount = 0,
  onStartRecording,
  onStopRecording,
  onToggleCamera,
  onToggleMic,
  onModerate,
  onCoHostAdd,
  onSendGift,
  onOpenAnalytics,
  cameraEnabled = true,
  microphoneEnabled = true,
}) {
  const [showModerationPanel, setShowModerationPanel] = useState(false);
  const [showGiftPanel, setShowGiftPanel] = useState(false);
  const [showQualityPanel, setShowQualityPanel] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const QUALITIES = [
    { id: 'auto', label: '🔄 تكيفي (موصى به)', description: 'تعديل تلقائي حسب الشبكة' },
    { id: 'hd', label: '📺 HD (1080p)', description: '6 Mbps - جودة عالية' },
    { id: 'sd', label: '📹 SD (720p)', description: '3 Mbps - جودة متوسطة' },
    { id: 'low', label: '📱 منخفضة (480p)', description: '1 Mbps - توفير البيانات' },
  ];

  const GIFTS = [
    { id: 1, name: 'وردة', emoji: '🌹', coins: 10 },
    { id: 2, name: 'قهوة', emoji: '☕', coins: 50 },
    { id: 3, name: 'قلب كبير', emoji: '💜', coins: 100 },
    { id: 4, name: 'نجمة', emoji: '⭐', coins: 250 },
    { id: 5, name: 'تاج', emoji: '👑', coins: 1000 },
  ];

  const healthLabel = useCallback(() => {
    if (healthScore >= 90) return { text: 'ممتاز', color: '#10b981' };
    if (healthScore >= 75) return { text: 'جيد', color: '#3b82f6' };
    if (healthScore >= 60) return { text: 'متوسط', color: '#f59e0b' };
    return { text: 'ضعيف', color: '#ef4444' };
  }, [healthScore])();

  const toggleRecording = useCallback(() => {
    if (recordingState === 'recording') {
      onStopRecording?.();
    } else {
      onStartRecording?.();
    }
  }, [recordingState, onStartRecording, onStopRecording]);

  const handleQualityChange = useCallback((qualityId) => {
    // سيتم تمريره إلى الخدمة الخلفية
    console.log('Changing quality to:', qualityId);
  }, []);

  return (
    <div className="yam-enhanced-live-controls">
      {/* شريط التحكم الرئيسي */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="yam-live-control-bar"
      >
        {/* القسم الأيسر - المعلومات والإحصائيات */}
        <div className="yam-live-control-left">
          <div className="yam-live-stats-group">
            <div className="yam-live-stat-item">
              <span className="yam-live-stat-icon">👁</span>
              <span className="yam-live-stat-value">{viewerCount}</span>
              <span className="yam-live-stat-label">مشاهد</span>
            </div>
            <div className="yam-live-stat-item">
              <span className="yam-live-stat-icon">💜</span>
              <span className="yam-live-stat-value">{heartsCount}</span>
              <span className="yam-live-stat-label">قلب</span>
            </div>
            <div className="yam-live-stat-item">
              <span className="yam-live-stat-icon">⚡</span>
              <span className="yam-live-stat-value">{latencyMs}ms</span>
              <span className="yam-live-stat-label">تأخير</span>
            </div>
          </div>
        </div>

        {/* القسم الأوسط - أزرار التحكم الرئيسية */}
        <div className="yam-live-control-center">
          {isHost && (
            <>
              <button
                type="button"
                className={`yam-live-control-btn yam-live-control-camera ${cameraEnabled ? 'active' : 'inactive'}`}
                onClick={onToggleCamera}
                title={cameraEnabled ? 'إغلاق الكاميرا' : 'فتح الكاميرا'}
              >
                {cameraEnabled ? '📷' : '📷‍🚫'}
              </button>
              <button
                type="button"
                className={`yam-live-control-btn yam-live-control-mic ${microphoneEnabled ? 'active' : 'inactive'}`}
                onClick={onToggleMic}
                title={microphoneEnabled ? 'كتم الصوت' : 'فتح الصوت'}
              >
                {microphoneEnabled ? '🎤' : '🔇'}
              </button>
              <button
                type="button"
                className={`yam-live-control-btn yam-live-control-record ${isRecording ? 'recording' : ''}`}
                onClick={toggleRecording}
                title={recordingState === 'recording' ? 'إيقاف التسجيل' : 'بدء التسجيل'}
              >
                {recordingState === 'recording' ? '⏹' : '⏺'}
              </button>
            </>
          )}
        </div>

        {/* القسم الأيمن - أزرار الإجراءات */}
        <div className="yam-live-control-right">
          <button
            type="button"
            className="yam-live-control-btn yam-live-control-analytics"
            onClick={onOpenAnalytics}
            title="التحليلات المباشرة"
          >
            📊
          </button>
          <button
            type="button"
            className={`yam-live-control-btn yam-live-control-quality ${showQualityPanel ? 'active' : ''}`}
            onClick={() => setShowQualityPanel(!showQualityPanel)}
            title="جودة البث"
          >
            🎬
          </button>
          <button
            type="button"
            className={`yam-live-control-btn yam-live-control-moderation ${showModerationPanel ? 'active' : ''} ${moderationQueueCount > 0 ? 'has-alerts' : ''}`}
            onClick={() => setShowModerationPanel(!showModerationPanel)}
            title="أدوات الإشراف"
          >
            🛡️
            {moderationQueueCount > 0 && <span className="yam-live-alert-badge">{moderationQueueCount}</span>}
          </button>
          <button
            type="button"
            className={`yam-live-control-btn yam-live-control-menu ${isMobileMenuOpen ? 'active' : ''}`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            title="المزيد من الخيارات"
          >
            ⋮
          </button>
        </div>
      </motion.div>

      {/* لوحة جودة البث */}
      {showQualityPanel && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="yam-live-quality-panel"
        >
          <div className="yam-live-panel-header">
            <strong>جودة البث التكيفية</strong>
            <button
              type="button"
              className="yam-live-panel-close"
              onClick={() => setShowQualityPanel(false)}
            >
              ✕
            </button>
          </div>
          <div className="yam-live-quality-grid">
            {QUALITIES.map((quality) => (
              <button
                key={quality.id}
                type="button"
                className={`yam-live-quality-item ${quality.id === streamMode ? 'active' : ''}`}
                onClick={() => {
                  handleQualityChange(quality.id);
                  setShowQualityPanel(false);
                }}
              >
                <div className="yam-live-quality-label">{quality.label}</div>
                <div className="yam-live-quality-description">{quality.description}</div>
              </button>
            ))}
          </div>
          <div className="yam-live-panel-info">
            💡 الجودة التكيفية تعدّل تلقائياً حسب سرعة الاتصال لضمان بث سلس بدون انقطاعات.
          </div>
        </motion.div>
      )}

      {/* لوحة أدوات الإشراف */}
      {showModerationPanel && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="yam-live-moderation-panel"
        >
          <div className="yam-live-panel-header">
            <strong>أدوات الإشراف</strong>
            <span className="yam-live-moderation-queue">
              الانتظار: {moderationQueueCount}
            </span>
            <button
              type="button"
              className="yam-live-panel-close"
              onClick={() => setShowModerationPanel(false)}
            >
              ✕
            </button>
          </div>
          <div className="yam-live-moderation-grid">
            <button
              type="button"
              className="yam-live-moderation-btn yam-live-moderation-mute"
              onClick={() => onModerate?.('mute')}
            >
              🔇 كتم المشارك
            </button>
            <button
              type="button"
              className="yam-live-moderation-btn yam-live-moderation-kick"
              onClick={() => onModerate?.('kick')}
            >
              👋 إخراج المشارك
            </button>
            <button
              type="button"
              className="yam-live-moderation-btn yam-live-moderation-ban"
              onClick={() => onModerate?.('ban')}
            >
              🚫 حظر المستخدم
            </button>
            <button
              type="button"
              className="yam-live-moderation-btn yam-live-moderation-slow"
              onClick={() => onModerate?.('slow_mode')}
            >
              🐢 Slow Mode
            </button>
            <button
              type="button"
              className="yam-live-moderation-btn yam-live-moderation-cohost"
              onClick={() => onCoHostAdd?.()}
            >
              👥 ترقية إلى Co-host
            </button>
          </div>
        </motion.div>
      )}

      {/* قائمة الخيارات الإضافية (للجوال) */}
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="yam-live-mobile-menu"
        >
          <button
            type="button"
            className="yam-live-menu-item"
            onClick={() => {
              setShowGiftPanel(!showGiftPanel);
              setIsMobileMenuOpen(false);
            }}
          >
            🎁 إرسال هدية
          </button>
          <button
            type="button"
            className="yam-live-menu-item"
            onClick={() => {
              setShowQualityPanel(!showQualityPanel);
              setIsMobileMenuOpen(false);
            }}
          >
            🎬 جودة البث
          </button>
          <button
            type="button"
            className="yam-live-menu-item"
            onClick={() => {
              setShowModerationPanel(!showModerationPanel);
              setIsMobileMenuOpen(false);
            }}
          >
            🛡️ أدوات الإشراف
          </button>
        </motion.div>
      )}

      {/* لوحة الهدايا */}
      {showGiftPanel && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="yam-live-gift-panel"
        >
          <div className="yam-live-panel-header">
            <strong>اختر هدية</strong>
            <button
              type="button"
              className="yam-live-panel-close"
              onClick={() => setShowGiftPanel(false)}
            >
              ✕
            </button>
          </div>
          <div className="yam-live-gift-grid">
            {GIFTS.map((gift) => (
              <button
                key={gift.id}
                type="button"
                className="yam-live-gift-item"
                onClick={() => {
                  onSendGift?.(gift);
                  setShowGiftPanel(false);
                }}
              >
                <div className="yam-live-gift-emoji">{gift.emoji}</div>
                <div className="yam-live-gift-name">{gift.name}</div>
                <div className="yam-live-gift-price">{gift.coins} عملة</div>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      <style>{`
        .yam-enhanced-live-controls {
          position: relative;
          width: 100%;
          background: linear-gradient(180deg, rgba(7, 12, 24, 0.95) 0%, rgba(7, 12, 24, 0.85) 100%);
          border-bottom: 1px solid rgba(124, 58, 237, 0.2);
          backdrop-filter: blur(10px);
          z-index: 100;
        }

        /* شريط التحكم الرئيسي */
        .yam-live-control-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          gap: 12px;
          direction: rtl;
          flex-wrap: wrap;
        }

        /* القسم الأيسر */
        .yam-live-control-left,
        .yam-live-control-center,
        .yam-live-control-right {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        /* مجموعة الإحصائيات */
        .yam-live-stats-group {
          display: flex;
          gap: 16px;
          align-items: center;
        }

        .yam-live-stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          padding: 6px 12px;
          background: rgba(124, 58, 237, 0.1);
          border-radius: 8px;
          border: 1px solid rgba(124, 58, 237, 0.2);
        }

        .yam-live-stat-icon {
          font-size: 16px;
        }

        .yam-live-stat-value {
          color: white;
          font-weight: 700;
          font-size: 14px;
        }

        .yam-live-stat-label {
          color: rgba(255, 255, 255, 0.6);
          font-size: 10px;
        }

        /* أزرار التحكم */
        .yam-live-control-btn {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(124, 58, 237, 0.2);
          color: white;
          font-size: 18px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          position: relative;
        }

        .yam-live-control-btn:hover {
          background: rgba(124, 58, 237, 0.2);
          border-color: rgba(124, 58, 237, 0.5);
          transform: translateY(-2px);
        }

        .yam-live-control-btn.active {
          background: linear-gradient(135deg, #7c3aed, #3b82f6);
          border-color: rgba(124, 58, 237, 0.8);
        }

        .yam-live-control-btn.inactive {
          background: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.3);
        }

        .yam-live-control-record.recording {
          background: linear-gradient(135deg, #ef4444, #f97316);
          animation: pulse 1s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        .yam-live-alert-badge {
          position: absolute;
          top: -6px;
          right: -6px;
          background: #ef4444;
          color: white;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 700;
        }

        /* اللوحات المنبثقة */
        .yam-live-quality-panel,
        .yam-live-moderation-panel,
        .yam-live-gift-panel,
        .yam-live-mobile-menu {
          position: absolute;
          top: 100%;
          right: 16px;
          background: rgba(15, 23, 42, 0.95);
          border: 1px solid rgba(124, 58, 237, 0.3);
          border-radius: 12px;
          padding: 12px;
          margin-top: 8px;
          backdrop-filter: blur(10px);
          z-index: 1000;
          min-width: 280px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
        }

        .yam-live-panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          color: white;
          font-size: 14px;
          font-weight: 600;
        }

        .yam-live-panel-close {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.6);
          cursor: pointer;
          font-size: 16px;
          transition: color 0.2s ease;
        }

        .yam-live-panel-close:hover {
          color: white;
        }

        .yam-live-moderation-queue {
          background: rgba(239, 68, 68, 0.2);
          color: #fca5a5;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
        }

        /* شبكة الجودة */
        .yam-live-quality-grid {
          display: grid;
          gap: 8px;
          margin-bottom: 12px;
        }

        .yam-live-quality-item {
          padding: 10px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(124, 58, 237, 0.2);
          border-radius: 8px;
          color: white;
          cursor: pointer;
          text-align: right;
          transition: all 0.2s ease;
        }

        .yam-live-quality-item:hover {
          background: rgba(124, 58, 237, 0.15);
          border-color: rgba(124, 58, 237, 0.5);
        }

        .yam-live-quality-item.active {
          background: linear-gradient(135deg, rgba(124, 58, 237, 0.3), rgba(59, 130, 246, 0.2));
          border-color: rgba(124, 58, 237, 0.6);
        }

        .yam-live-quality-label {
          font-weight: 600;
          font-size: 13px;
        }

        .yam-live-quality-description {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.6);
          margin-top: 2px;
        }

        .yam-live-panel-info {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.6);
          padding: 8px;
          background: rgba(124, 58, 237, 0.1);
          border-radius: 6px;
          line-height: 1.4;
        }

        /* شبكة الإشراف */
        .yam-live-moderation-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .yam-live-moderation-btn {
          padding: 10px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(124, 58, 237, 0.2);
          border-radius: 8px;
          color: white;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          transition: all 0.2s ease;
        }

        .yam-live-moderation-btn:hover {
          background: rgba(124, 58, 237, 0.15);
          border-color: rgba(124, 58, 237, 0.5);
          transform: translateY(-2px);
        }

        .yam-live-moderation-ban {
          background: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.3);
        }

        .yam-live-moderation-ban:hover {
          background: rgba(239, 68, 68, 0.2);
          border-color: rgba(239, 68, 68, 0.6);
        }

        /* شبكة الهدايا */
        .yam-live-gift-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-bottom: 0;
        }

        .yam-live-gift-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 8px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(124, 58, 237, 0.2);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          color: white;
        }

        .yam-live-gift-item:hover {
          background: rgba(124, 58, 237, 0.2);
          border-color: rgba(124, 58, 237, 0.5);
          transform: translateY(-2px);
        }

        .yam-live-gift-emoji {
          font-size: 24px;
        }

        .yam-live-gift-name {
          font-size: 11px;
          font-weight: 600;
        }

        .yam-live-gift-price {
          font-size: 10px;
          color: #fbbf24;
        }

        /* قائمة الجوال */
        .yam-live-mobile-menu {
          min-width: 200px;
        }

        .yam-live-menu-item {
          display: block;
          width: 100%;
          padding: 10px 12px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(124, 58, 237, 0.2);
          border-radius: 8px;
          color: white;
          cursor: pointer;
          font-size: 13px;
          text-align: right;
          margin-bottom: 6px;
          transition: all 0.2s ease;
        }

        .yam-live-menu-item:last-child {
          margin-bottom: 0;
        }

        .yam-live-menu-item:hover {
          background: rgba(124, 58, 237, 0.15);
          border-color: rgba(124, 58, 237, 0.5);
        }

        /* استجابة الجوال */
        @media (max-width: 768px) {
          .yam-live-control-bar {
            padding: 8px 12px;
            gap: 8px;
          }

          .yam-live-stats-group {
            gap: 8px;
          }

          .yam-live-stat-item {
            padding: 4px 8px;
            font-size: 11px;
          }

          .yam-live-control-btn {
            width: 36px;
            height: 36px;
            font-size: 16px;
          }

          .yam-live-quality-panel,
          .yam-live-moderation-panel,
          .yam-live-gift-panel,
          .yam-live-mobile-menu {
            min-width: 240px;
            right: 8px;
          }

          .yam-live-moderation-grid {
            grid-template-columns: 1fr;
          }

          .yam-live-gift-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 480px) {
          .yam-live-control-left {
            display: none;
          }

          .yam-live-control-bar {
            justify-content: space-around;
          }

          .yam-live-quality-panel,
          .yam-live-moderation-panel,
          .yam-live-gift-panel,
          .yam-live-mobile-menu {
            min-width: 90vw;
            right: 5vw;
          }
        }
      `}</style>
    </div>
  );
}
