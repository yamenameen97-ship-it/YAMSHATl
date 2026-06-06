import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LiveStreamCard from '../live/LiveStreamCard.jsx';
import { getLiveStreamDetails, sendLiveComment, sendLiveGift, sendLiveHeart } from '../../services/api/liveStreamApi.js';
import { resolveMediaUrl } from '../../config/mediaConfig.js';
import { getCurrentUsername } from '../../utils/auth.js';

/**
 * FeedLiveStreamWidget - عنصر واجهة لعرض البث المباشر في صفحة المنشورات
 * يعرض بطاقة صغيرة للبث المباشر مع خيار فتح الواجهة الكاملة
 * 
 * تحسينات:
 * - معالجة الحقول الناقصة بشكل آمن
 * - استخدام resolveMediaUrl لتصحيح مسارات الصور
 * - دعم الحقول الجديدة من الباكيند
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
  const currentUser = getCurrentUsername();

  // تحميل تفاصيل البث المباشر
  useEffect(() => {
    if (!liveStream?.id || isExpanded) return;

    const loadStreamData = async () => {
      try {
        setIsLoading(true);
        const response = await getLiveStreamDetails(liveStream.id);
        const data = response?.data || {};
        
        // دمج البيانات الجديدة مع البيانات الموجودة
        setStreamData(prev => ({
          ...prev,
          ...data,
          // التأكد من أن جميع الحقول المطلوبة موجودة
          host_name: data.host_name || data.host || prev?.host_name || 'مستخدم',
          host_avatar: data.host_avatar || prev?.host_avatar || '',
          thumbnail_url: data.thumbnail_url || prev?.thumbnail_url || '',
          hearts_count: data.hearts_count ?? prev?.hearts_count ?? 0,
          comments_count: data.comments_count ?? prev?.comments_count ?? 0,
        }));
      } catch (error) {
        console.error('Error loading stream data:', error);
        // الاحتفاظ بالبيانات السابقة في حالة الخطأ
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
  
  // معالجة آمنة للحقول
  const hostName = streamData.host_name || streamData.host || 'مستخدم';
  const hostAvatar = resolveMediaUrl(streamData.host_avatar || '');
  const thumbnail = resolveMediaUrl(streamData.thumbnail_url || '');
  const viewerCount = streamData.viewer_count || 0;
  const heartsCount = streamData.hearts_count || 0;
  const commentsCount = streamData.comments_count || 0;
  const title = streamData.title || 'بث مباشر';

  return (
    <>
      {/* بطاقة البث المباشر الصغيرة (في صفحة المنشورات) */}
      {!isExpanded && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="yam-feed-live-widget"
          onClick={() => setIsExpanded(true)}
        >
          <div className="yam-feed-live-widget-container">
            {/* خلفية البث */}
            <div className="yam-feed-live-widget-background">
              {thumbnail && (
                <img 
                  src={thumbnail} 
                  alt={title}
                  className="yam-feed-live-widget-thumbnail"
                  loading="lazy"
                  onError={(e) => {
                    // إذا فشل تحميل الصورة، إخفاء العنصر
                    e.target.style.display = 'none';
                  }}
                />
              )}
              <div className="yam-feed-live-widget-overlay" />
            </div>

            {/* محتوى البطاقة */}
            <div className="yam-feed-live-widget-content">
              {/* شارة البث المباشر */}
              <div className="yam-feed-live-badge">
                <span className="yam-feed-live-badge-dot">🔴</span>
                <span className="yam-feed-live-badge-text">مباشر</span>
              </div>

              {/* معلومات المضيف */}
              <div className="yam-feed-live-widget-host">
                <div className="yam-feed-live-widget-avatar">
                  {hostAvatar ? (
                    <img 
                      src={hostAvatar} 
                      alt={hostName}
                      loading="lazy"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : null}
                  {!hostAvatar && (
                    <div className="yam-feed-live-widget-avatar-placeholder">
                      {hostName?.charAt(0).toUpperCase() || 'م'}
                    </div>
                  )}
                </div>
                <div className="yam-feed-live-widget-info">
                  <h3>{hostName}</h3>
                  <p>{title}</p>
                </div>
              </div>

              {/* إحصائيات البث */}
              <div className="yam-feed-live-widget-stats">
                <span className="yam-feed-live-widget-stat">
                  👁 {viewerCount}
                </span>
                <span className="yam-feed-live-widget-stat">
                  💜 {heartsCount}
                </span>
                {commentsCount > 0 && (
                  <span className="yam-feed-live-widget-stat">
                    💬 {commentsCount}
                  </span>
                )}
              </div>

              {/* زر الدخول */}
              <button type="button" className="yam-feed-live-widget-cta">
                دخول البث
              </button>
            </div>
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
        .yam-feed-live-widget {
          cursor: pointer;
          width: 100%;
          margin: 12px 0;
        }

        .yam-feed-live-widget-container {
          position: relative;
          width: 100%;
          aspect-ratio: 16 / 9;
          border-radius: 16px;
          overflow: hidden;
          background: linear-gradient(135deg, #0a0e27 0%, #1a0f3f 100%);
          border: 1px solid rgba(124, 58, 237, 0.2);
          transition: all 0.3s ease;
        }

        .yam-feed-live-widget-container:hover {
          border-color: rgba(124, 58, 237, 0.5);
          box-shadow: 0 8px 24px rgba(124, 58, 237, 0.2);
          transform: translateY(-4px);
        }

        .yam-feed-live-widget-background {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          overflow: hidden;
          background: linear-gradient(135deg, #0a0e27 0%, #1a0f3f 100%);
        }

        .yam-feed-live-widget-thumbnail {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .yam-feed-live-widget-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            180deg,
            rgba(0, 0, 0, 0.3) 0%,
            rgba(0, 0, 0, 0.5) 50%,
            rgba(0, 0, 0, 0.8) 100%
          );
        }

        .yam-feed-live-widget-content {
          position: relative;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 12px;
          z-index: 2;
        }

        /* شارة البث المباشر */
        .yam-feed-live-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          width: fit-content;
          padding: 6px 12px;
          background: linear-gradient(135deg, #ef4444, #f97316);
          border-radius: 20px;
          color: white;
          font-size: 12px;
          font-weight: 700;
          animation: pulse 2s ease-in-out infinite;
        }

        .yam-feed-live-badge-dot {
          font-size: 8px;
          animation: blink 1s ease-in-out infinite;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }

        /* معلومات المضيف */
        .yam-feed-live-widget-host {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .yam-feed-live-widget-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          overflow: hidden;
          border: 2px solid rgba(255, 255, 255, 0.3);
          flex-shrink: 0;
          background: linear-gradient(135deg, #7c3aed, #3b82f6);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .yam-feed-live-widget-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .yam-feed-live-widget-avatar-placeholder {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #7c3aed, #3b82f6);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 16px;
        }

        .yam-feed-live-widget-info {
          flex: 1;
          color: white;
          min-width: 0;
        }

        .yam-feed-live-widget-info h3 {
          margin: 0;
          font-size: 14px;
          font-weight: 700;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .yam-feed-live-widget-info p {
          margin: 2px 0 0;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.8);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* إحصائيات البث */
        .yam-feed-live-widget-stats {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .yam-feed-live-widget-stat {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          background: rgba(0, 0, 0, 0.4);
          border-radius: 12px;
          color: white;
          font-size: 11px;
          font-weight: 600;
          backdrop-filter: blur(10px);
        }

        /* زر الدخول */
        .yam-feed-live-widget-cta {
          align-self: flex-start;
          padding: 8px 16px;
          background: linear-gradient(135deg, #7c3aed, #3b82f6);
          border: none;
          border-radius: 8px;
          color: white;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(124, 58, 237, 0.4);
        }

        .yam-feed-live-widget-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(124, 58, 237, 0.6);
        }

        .yam-feed-live-widget-cta:active {
          transform: translateY(0);
        }

        /* استجابة الجوال */
        @media (max-width: 768px) {
          .yam-feed-live-widget-container {
            aspect-ratio: 9 / 16;
            border-radius: 12px;
          }

          .yam-feed-live-widget-content {
            padding: 10px;
          }

          .yam-feed-live-widget-avatar {
            width: 36px;
            height: 36px;
          }

          .yam-feed-live-widget-info h3 {
            font-size: 13px;
          }

          .yam-feed-live-widget-info p {
            font-size: 11px;
          }

          .yam-feed-live-widget-cta {
            padding: 6px 12px;
            font-size: 11px;
          }
        }
      `}</style>
    </>
  );
}
