import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LiveStreamCard from '../live/LiveStreamCard.jsx';
import { getLiveStreamDetails, sendLiveComment, sendLiveGift, sendLiveHeart } from '../../services/api/liveStreamApi.js';
import { getCurrentUsername } from '../../utils/auth.js';

/**
 * FeedLiveStreamWidget - بطاقة بث مباشر احترافية للخلاصة
 * تعرض بطاقة جذابة مع صورة مصغرة وتفتح صفحة بث متكاملة عند النقر
 */
export default function FeedLiveStreamWidget({ 
  post,
  liveStream,
  onStreamEnd,
  onStreamUpdate,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [streamData, setStreamData] = useState(liveStream);
  const [isLoading, setIsLoading] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const currentUser = getCurrentUsername();

  // تحميل تفاصيل البث المباشر
  useEffect(() => {
    if (!liveStream?.id || isExpanded) return;

    const loadStreamData = async () => {
      try {
        setIsLoading(true);
        const response = await getLiveStreamDetails(liveStream.id);
        setStreamData(response.data);
      } catch (error) {
        console.error('Error loading stream data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // تحديث البيانات كل 5 ثوان
    const interval = setInterval(loadStreamData, 5000);
    loadStreamData();

    return () => clearInterval(interval);
  }, [liveStream?.id, isExpanded]);

  const handleSendComment = useCallback(async (streamId, text) => {
    try {
      await sendLiveComment(streamId, { text });
      onStreamUpdate?.();
    } catch (error) {
      console.error('Error sending comment:', error);
    }
  }, [onStreamUpdate]);

  const handleSendGift = useCallback(async (streamId, gift) => {
    try {
      await sendLiveGift(streamId, { gift_id: gift.id, amount: 1 });
      onStreamUpdate?.();
    } catch (error) {
      console.error('Error sending gift:', error);
    }
  }, [onStreamUpdate]);

  const handleSendHeart = useCallback(async (streamId) => {
    try {
      await sendLiveHeart(streamId);
      onStreamUpdate?.();
    } catch (error) {
      console.error('Error sending heart:', error);
    }
  }, [onStreamUpdate]);

  const handleCloseStream = useCallback(() => {
    setIsExpanded(false);
    onStreamEnd?.();
  }, [onStreamEnd]);

  if (!streamData) return null;

  const isHost = streamData.host === currentUser;

  return (
    <>
      {/* بطاقة البث المباشر الاحترافية (في صفحة المنشورات) */}
      {!isExpanded && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="enhanced-live-feed-widget"
          onClick={() => setIsExpanded(true)}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          <div className="enhanced-live-card-container">
            {/* الخلفية مع الصورة المصغرة */}
            <div className="enhanced-live-card-background">
              {streamData.thumbnail_url && (
                <motion.img 
                  src={streamData.thumbnail_url} 
                  alt={streamData.title}
                  className="enhanced-live-card-thumbnail"
                  animate={{ scale: isHovering ? 1.05 : 1 }}
                  transition={{ duration: 0.3 }}
                />
              )}
              {/* طبقة التدرج العلوية */}
              <div className="enhanced-live-card-gradient-top" />
              {/* طبقة التدرج السفلية */}
              <div className="enhanced-live-card-gradient-bottom" />
              {/* طبقة الظل الإضافية */}
              <div className="enhanced-live-card-overlay" />
            </div>

            {/* محتوى البطاقة */}
            <div className="enhanced-live-card-content">
              {/* الرأس - شارة البث والإحصائيات */}
              <div className="enhanced-live-card-header">
                <div className="enhanced-live-badge-group">
                  {/* شارة البث المباشر */}
                  <motion.div 
                    className="enhanced-live-badge-live"
                    animate={{ opacity: [1, 0.6, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <span className="enhanced-live-badge-dot">●</span>
                    <span className="enhanced-live-badge-text">مباشر</span>
                  </motion.div>
                </div>

                {/* الإحصائيات العلوية */}
                <div className="enhanced-live-stats-top">
                  <div className="enhanced-live-stat-item">
                    <span className="enhanced-live-stat-icon">👁</span>
                    <span className="enhanced-live-stat-value">{streamData.viewer_count || 0}</span>
                  </div>
                </div>
              </div>

              {/* منطقة المعلومات الوسطى */}
              <div className="enhanced-live-card-middle">
                {/* معلومات المضيف */}
                <div className="enhanced-live-host-section">
                  <div className="enhanced-live-host-avatar">
                    {streamData.host_avatar ? (
                      <img src={streamData.host_avatar} alt={streamData.host_name} />
                    ) : (
                      <div className="enhanced-live-host-avatar-placeholder">
                        {streamData.host_name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {/* شارة التحقق */}
                    <div className="enhanced-live-verified-badge">✓</div>
                  </div>
                  <div className="enhanced-live-host-info">
                    <h3 className="enhanced-live-host-name">{streamData.host_name}</h3>
                    <p className="enhanced-live-host-username">@{streamData.host_username}</p>
                  </div>
                </div>
              </div>

              {/* منطقة العنوان والوصف */}
              <div className="enhanced-live-card-description">
                <h2 className="enhanced-live-stream-title">{streamData.title}</h2>
                {streamData.description && (
                  <p className="enhanced-live-stream-desc">{streamData.description}</p>
                )}
              </div>

              {/* الإحصائيات السفلية والزر */}
              <div className="enhanced-live-card-footer">
                <div className="enhanced-live-stats-bottom">
                  <div className="enhanced-live-stat-badge">
                    <span>💜</span>
                    <span>{streamData.hearts_count || 0}</span>
                  </div>
                  <div className="enhanced-live-stat-badge">
                    <span>💬</span>
                    <span>{streamData.comments_count || 0}</span>
                  </div>
                </div>

                {/* زر الدخول */}
                <motion.button 
                  type="button" 
                  className="enhanced-live-cta-button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span>مشاهدة البث</span>
                  <span className="enhanced-live-cta-icon">→</span>
                </motion.button>
              </div>
            </div>

            {/* تأثير الضوء عند التمرير */}
            {isHovering && (
              <div className="enhanced-live-card-light-effect" />
            )}
          </div>
        </motion.div>
      )}

      {/* الواجهة الكاملة للبث المباشر */}
      <AnimatePresence>
        {isExpanded && (
          <LiveStreamCard
            stream={streamData}
            onClose={handleCloseStream}
            onSendComment={handleSendComment}
            onSendGift={handleSendGift}
            onSendHeart={handleSendHeart}
            currentUser={currentUser}
            isViewer={!isHost}
          />
        )}
      </AnimatePresence>

      <style>{`
        /* الحاوية الرئيسية للبطاقة */
        .enhanced-live-feed-widget {
          cursor: pointer;
          width: 100%;
          margin: 16px 0;
          direction: rtl;
        }

        .enhanced-live-card-container {
          position: relative;
          width: 100%;
          aspect-ratio: 16 / 9;
          border-radius: 20px;
          overflow: hidden;
          background: #0a0e27;
          border: 1px solid rgba(124, 58, 237, 0.3);
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }

        .enhanced-live-card-container:hover {
          border-color: rgba(124, 58, 237, 0.6);
          box-shadow: 0 16px 48px rgba(124, 58, 237, 0.25);
          transform: translateY(-6px);
        }

        /* الخلفية والصورة المصغرة */
        .enhanced-live-card-background {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          overflow: hidden;
        }

        .enhanced-live-card-thumbnail {
          width: 100%;
          height: 100%;
          object-fit: cover;
          filter: brightness(0.7) saturate(1.1);
        }

        /* التدرجات */
        .enhanced-live-card-gradient-top {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 40%;
          background: linear-gradient(
            180deg,
            rgba(0, 0, 0, 0.5) 0%,
            rgba(0, 0, 0, 0.2) 100%
          );
          z-index: 2;
        }

        .enhanced-live-card-gradient-bottom {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 60%;
          background: linear-gradient(
            180deg,
            rgba(0, 0, 0, 0) 0%,
            rgba(0, 0, 0, 0.3) 40%,
            rgba(0, 0, 0, 0.8) 100%
          );
          z-index: 2;
        }

        .enhanced-live-card-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(
            ellipse at center,
            transparent 0%,
            rgba(0, 0, 0, 0.4) 100%
          );
          z-index: 1;
        }

        /* محتوى البطاقة */
        .enhanced-live-card-content {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 16px;
          z-index: 3;
        }

        /* الرأس */
        .enhanced-live-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .enhanced-live-badge-group {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        /* شارة البث المباشر */
        .enhanced-live-badge-live {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          background: linear-gradient(135deg, #ef4444, #f97316);
          border-radius: 24px;
          color: white;
          font-size: 12px;
          font-weight: 700;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 4px 16px rgba(239, 68, 68, 0.4);
        }

        .enhanced-live-badge-dot {
          display: inline-block;
          font-size: 8px;
        }

        .enhanced-live-badge-text {
          font-weight: 700;
        }

        /* الإحصائيات العلوية */
        .enhanced-live-stats-top {
          display: flex;
          gap: 8px;
        }

        .enhanced-live-stat-item {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 6px 12px;
          background: rgba(0, 0, 0, 0.5);
          border-radius: 16px;
          color: white;
          font-size: 12px;
          font-weight: 600;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .enhanced-live-stat-icon {
          font-size: 14px;
        }

        /* المنطقة الوسطى */
        .enhanced-live-card-middle {
          display: flex;
          align-items: center;
          justify-content: flex-start;
        }

        /* قسم المضيف */
        .enhanced-live-host-section {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .enhanced-live-host-avatar {
          position: relative;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          overflow: hidden;
          border: 2px solid rgba(255, 255, 255, 0.3);
          flex-shrink: 0;
          background: linear-gradient(135deg, #7c3aed, #3b82f6);
        }

        .enhanced-live-host-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .enhanced-live-host-avatar-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 20px;
        }

        /* شارة التحقق */
        .enhanced-live-verified-badge {
          position: absolute;
          bottom: -2px;
          right: -2px;
          width: 20px;
          height: 20px;
          background: linear-gradient(135deg, #7c3aed, #3b82f6);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 12px;
          font-weight: bold;
          border: 2px solid #0a0e27;
        }

        .enhanced-live-host-info {
          color: white;
        }

        .enhanced-live-host-name {
          margin: 0;
          font-size: 15px;
          font-weight: 700;
          line-height: 1.2;
        }

        .enhanced-live-host-username {
          margin: 2px 0 0;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.2;
        }

        /* وصف البث */
        .enhanced-live-card-description {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .enhanced-live-stream-title {
          margin: 0;
          font-size: 16px;
          font-weight: 700;
          color: white;
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .enhanced-live-stream-desc {
          margin: 0;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* التذييل */
        .enhanced-live-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }

        .enhanced-live-stats-bottom {
          display: flex;
          gap: 10px;
        }

        .enhanced-live-stat-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 6px 12px;
          background: rgba(0, 0, 0, 0.4);
          border-radius: 16px;
          color: white;
          font-size: 12px;
          font-weight: 600;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        /* زر الدخول */
        .enhanced-live-cta-button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          background: linear-gradient(135deg, #7c3aed, #3b82f6);
          border: none;
          border-radius: 12px;
          color: white;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 16px rgba(124, 58, 237, 0.4);
          white-space: nowrap;
          flex-shrink: 0;
        }

        .enhanced-live-cta-button:hover {
          box-shadow: 0 6px 24px rgba(124, 58, 237, 0.6);
        }

        .enhanced-live-cta-button:active {
          transform: scale(0.95);
        }

        .enhanced-live-cta-icon {
          font-size: 14px;
        }

        /* تأثير الضوء */
        .enhanced-live-card-light-effect {
          position: absolute;
          top: -50%;
          right: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(
            circle,
            rgba(124, 58, 237, 0.15) 0%,
            transparent 70%
          );
          pointer-events: none;
          animation: light-move 3s ease-in-out infinite;
          z-index: 0;
        }

        @keyframes light-move {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(20px, 20px); }
        }

        /* استجابة الجوال */
        @media (max-width: 768px) {
          .enhanced-live-card-container {
            aspect-ratio: 9 / 16;
            border-radius: 16px;
          }

          .enhanced-live-card-content {
            padding: 12px;
          }

          .enhanced-live-host-avatar {
            width: 40px;
            height: 40px;
          }

          .enhanced-live-host-name {
            font-size: 13px;
          }

          .enhanced-live-host-username {
            font-size: 11px;
          }

          .enhanced-live-stream-title {
            font-size: 14px;
          }

          .enhanced-live-cta-button {
            padding: 8px 14px;
            font-size: 12px;
          }

          .enhanced-live-badge-live {
            padding: 6px 12px;
            font-size: 11px;
          }
        }

        /* استجابة الشاشات الكبيرة */
        @media (min-width: 1200px) {
          .enhanced-live-card-container {
            aspect-ratio: 20 / 9;
          }

          .enhanced-live-stream-title {
            font-size: 18px;
          }

          .enhanced-live-host-name {
            font-size: 16px;
          }
        }
      `}</style>
    </>
  );
}
