import { memo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { resolveMediaUrl } from '../../config/mediaConfig.js';

/**
 * MobileLiveStreamCard - بطاقة البث المباشر للجوال
 * عرض منشور البث المباشر في صفحة المنشورات على الجوال
 */
function MobileLiveStreamCard({ post, liveStream, onStreamEnd }) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const {
    id = '',
    host_username = 'مستخدم',
    host_name = 'مستخدم',
    title = 'بث مباشر',
    viewer_count = 0,
    hearts_count = 0,
    comments_count = 0,
    thumbnail_url = '',
    host_avatar = '',
  } = liveStream || {};

  // معالجة صور الغلاف والأفاتار
  const thumbnailUrl = resolveMediaUrl(thumbnail_url);
  const avatarUrl = resolveMediaUrl(host_avatar);

  const handleOpenStream = () => {
    if (!id) return;
    setIsLoading(true);
    navigate(`/live/view/${id}`);
  };

  return (
    <article className="ym-live-stream-card" aria-label={`بث مباشر من ${host_name}`}>
      {/* خلفية البث مع الصورة المصغرة */}
      <div className="ym-live-stream-background">
        {thumbnailUrl ? (
          <img 
            src={thumbnailUrl} 
            alt={title}
            className="ym-live-stream-thumbnail"
            loading="lazy"
            onError={(e) => {
              // إذا فشل تحميل الصورة، استخدم لون خلفية بدلاً منها
              e.target.style.display = 'none';
            }}
          />
        ) : null}
        <div className="ym-live-stream-overlay" />
      </div>

      {/* محتوى البطاقة */}
      <div className="ym-live-stream-content">
        {/* شارة البث المباشر */}
        <div className="ym-live-badge">
          <span className="ym-live-badge-dot">🔴</span>
          <span className="ym-live-badge-text">مباشر</span>
        </div>

        {/* معلومات المضيف */}
        <div className="ym-live-host-info">
          <div className="ym-live-host-avatar">
            {avatarUrl ? (
              <img src={avatarUrl} alt={host_name} loading="lazy" />
            ) : (
              <div className="ym-live-host-avatar-placeholder">
                {host_name?.charAt(0).toUpperCase() || 'م'}
              </div>
            )}
          </div>
          <div className="ym-live-host-details">
            <h3 className="ym-live-host-name">{host_name}</h3>
            <p className="ym-live-stream-title">{title}</p>
          </div>
        </div>

        {/* إحصائيات البث */}
        <div className="ym-live-stats">
          <span className="ym-live-stat">
            👁 {viewer_count || 0}
          </span>
          <span className="ym-live-stat">
            💜 {hearts_count || 0}
          </span>
          <span className="ym-live-stat">
            💬 {comments_count || 0}
          </span>
        </div>

        {/* زر الدخول */}
        <button 
          type="button" 
          className="ym-live-enter-btn"
          onClick={handleOpenStream}
          disabled={isLoading}
          aria-label="دخول البث المباشر"
        >
          {isLoading ? 'جاري الفتح...' : 'دخول البث'}
        </button>
      </div>

      <style>{`
        .ym-live-stream-card {
          width: 100%;
          margin: 12px 0;
          border-radius: 12px;
          overflow: hidden;
          background: linear-gradient(135deg, #0a0e27 0%, #1a0f3f 100%);
          border: 1px solid rgba(124, 58, 237, 0.2);
          display: flex;
          flex-direction: column;
          transition: all 0.3s ease;
        }

        .ym-live-stream-card:active {
          transform: scale(0.98);
        }

        .ym-live-stream-background {
          position: relative;
          width: 100%;
          aspect-ratio: 16 / 9;
          overflow: hidden;
          background: linear-gradient(135deg, #0a0e27 0%, #1a0f3f 100%);
        }

        .ym-live-stream-thumbnail {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .ym-live-stream-overlay {
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
          pointer-events: none;
        }

        .ym-live-stream-content {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 12px;
          z-index: 2;
        }

        /* شارة البث المباشر */
        .ym-live-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          width: fit-content;
          padding: 4px 10px;
          background: linear-gradient(135deg, #ef4444, #f97316);
          border-radius: 16px;
          color: white;
          font-size: 11px;
          font-weight: 700;
          animation: pulse 2s ease-in-out infinite;
        }

        .ym-live-badge-dot {
          font-size: 6px;
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
        .ym-live-host-info {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .ym-live-host-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          overflow: hidden;
          border: 2px solid rgba(255, 255, 255, 0.3);
          flex-shrink: 0;
          background: linear-gradient(135deg, #7c3aed, #3b82f6);
        }

        .ym-live-host-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .ym-live-host-avatar-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 14px;
          background: linear-gradient(135deg, #7c3aed, #3b82f6);
        }

        .ym-live-host-details {
          flex: 1;
          color: white;
          min-width: 0;
        }

        .ym-live-host-name {
          margin: 0;
          font-size: 13px;
          font-weight: 700;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .ym-live-stream-title {
          margin: 2px 0 0;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.8);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* إحصائيات البث */
        .ym-live-stats {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .ym-live-stat {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          padding: 3px 8px;
          background: rgba(0, 0, 0, 0.4);
          border-radius: 10px;
          color: white;
          font-size: 10px;
          font-weight: 600;
          backdrop-filter: blur(10px);
        }

        /* زر الدخول */
        .ym-live-enter-btn {
          align-self: flex-start;
          padding: 6px 14px;
          background: linear-gradient(135deg, #7c3aed, #3b82f6);
          border: none;
          border-radius: 6px;
          color: white;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(124, 58, 237, 0.4);
        }

        .ym-live-enter-btn:active {
          transform: scale(0.95);
        }

        .ym-live-enter-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </article>
  );
}

export default memo(MobileLiveStreamCard);
