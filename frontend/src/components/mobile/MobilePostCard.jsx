import { memo } from 'react';

/**
 * MobilePostCard - بطاقة منشور محدثة بناءً على الصورة
 * تصميم داكن، أيقونات ملونة، توثيق بنفسجي، وتنسيق أرقام
 */
function VerifiedBadge() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="#8B5CF6" style={{ marginInlineStart: 4 }}>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function MobilePostCard({
  post = {},
  onLike,
  onComment,
  onShare,
  onSave,
  onMore,
}) {
  const {
    authorName = 'مستخدم',
    handle = '@user',
    timeText = 'منذ قليل',
    verified = true,
    avatarUrl = '',
    text = '',
    banner = null,
    likes = 0,
    comments = 0,
    reposts = 0,
    liked = false,
    isLive = false,
  } = post;

  const formatCount = (n) => {
    if (n >= 1000) return (n / 1000).toFixed(1) + ' ألف';
    return n;
  };

  return (
    <article className="ym-post-card">
      <header className="ym-post-header">
        <div className="ym-post-user-info">
          <div className="ym-post-avatar">
             {avatarUrl ? <img src={avatarUrl} alt="" /> : <div className="avatar-placeholder">Y</div>}
          </div>
          <div className="ym-post-title-area">
            <div className="ym-author-row">
              <span className="ym-author-name">{authorName}</span>
              {verified && <VerifiedBadge />}
            </div>
            <div className="ym-post-subtext">
              <span className="ym-handle">{handle}</span>
              <span className="ym-dot">•</span>
              <span className="ym-time">{timeText}</span>
              {isLive && <span className="ym-live-badge-inline">البث المباشر</span>}
            </div>
          </div>
        </div>
        <button className="ym-more-btn" onClick={() => onMore?.(post)}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <circle cx="5" cy="12" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="19" cy="12" r="2" />
          </svg>
        </button>
      </header>

      <div className="ym-post-content">
        <p dir="rtl">{text}</p>
      </div>

      {banner && (
        <div className="ym-post-banner-new">
          {isLive && <div className="ym-live-overlay-label">مباشر الآن LIVE</div>}
          {banner.type === 'image' ? (
            <div className="banner-image-container">
               <img src={banner.url} alt="" />
               {isLive && (
                 <div className="banner-live-info">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="white"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                    <span>{formatCount(post.viewers || 2400)} مشاهد</span>
                 </div>
               )}
            </div>
          ) : (
            <div className="banner-logo-container">
               <svg className="ym-logo-large" viewBox="0 0 100 100">
                  <path d="M20 20 L50 60 L80 20 L70 20 L50 45 L30 20 Z" fill="#8B5CF6" />
                  <path d="M45 60 L55 60 L55 85 L45 85 Z" fill="#8B5CF6" />
               </svg>
               <h3 className="banner-brand-name">YAMSHAT</h3>
               <p className="banner-slogan">تواصل، تفاعل، اربح</p>
            </div>
          )}
        </div>
      )}

      <footer className="ym-post-footer">
        <div className="ym-footer-actions">
          <button className="ym-footer-btn" onClick={() => onComment?.(post)}>
             <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
             <span>{formatCount(comments)}</span>
          </button>
          <button className="ym-footer-btn" onClick={() => onShare?.(post)}>
             <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
             <span>{formatCount(reposts)}</span>
          </button>
          <button className={`ym-footer-btn ${liked ? 'liked' : ''}`} onClick={() => onLike?.(post)}>
             <svg viewBox="0 0 24 24" width="20" height="20" fill={liked ? "#8B5CF6" : "none"} stroke={liked ? "#8B5CF6" : "currentColor"} strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
             <span className={liked ? 'text-purple' : ''}>{formatCount(likes)}</span>
          </button>
          <button className="ym-footer-btn" onClick={() => onSave?.(post)}>
             <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
          </button>
        </div>
      </footer>

      <style>{`
        .ym-post-card {
          background-color: #0A0D1A;
          border-bottom: 1px solid #1F2937;
          padding: 16px;
          color: white;
        }
        .ym-post-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }
        .ym-post-user-info {
          display: flex;
          gap: 12px;
        }
        .ym-post-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #1F2937;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #8B5CF6;
        }
        .ym-post-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .avatar-placeholder {
          color: #8B5CF6;
          font-weight: bold;
          font-size: 1.2rem;
        }
        .ym-author-name {
          font-weight: bold;
          font-size: 1rem;
        }
        .ym-post-subtext {
          display: flex;
          align-items: center;
          gap: 4px;
          color: #9CA3AF;
          font-size: 0.8rem;
        }
        .ym-live-badge-inline {
          color: #8B5CF6;
          margin-inline-start: 4px;
          font-weight: bold;
        }
        .ym-post-content {
          margin-bottom: 12px;
          font-size: 0.95rem;
          line-height: 1.5;
        }
        .ym-post-banner-new {
          border-radius: 12px;
          overflow: hidden;
          margin-bottom: 12px;
          position: relative;
          background: linear-gradient(135deg, #0A0D1A 0%, #1E1B4B 100%);
          border: 1px solid #1F2937;
        }
        .banner-image-container {
          position: relative;
          width: 100%;
          aspect-ratio: 16/9;
        }
        .banner-image-container img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .ym-live-overlay-label {
          position: absolute;
          top: 12px;
          left: 12px;
          background-color: #EF4444;
          color: white;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 0.7rem;
          font-weight: bold;
          z-index: 10;
        }
        .banner-live-info {
          position: absolute;
          bottom: 12px;
          right: 12px;
          background: rgba(0,0,0,0.6);
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.75rem;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .banner-logo-container {
          padding: 40px 20px;
          text-align: center;
          background: linear-gradient(to bottom, #1E1B4B, #0A0D1A);
        }
        .ym-logo-large {
          width: 80px;
          height: 80px;
          margin-bottom: 12px;
        }
        .banner-brand-name {
          letter-spacing: 4px;
          font-weight: bold;
          margin-bottom: 4px;
        }
        .banner-slogan {
          color: #9CA3AF;
          font-size: 0.85rem;
        }
        .ym-post-footer {
          border-top: 1px solid #1F2937;
          padding-top: 12px;
        }
        .ym-footer-actions {
          display: flex;
          justify-content: space-between;
        }
        .ym-footer-btn {
          background: none;
          border: none;
          color: #9CA3AF;
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          font-size: 0.85rem;
        }
        .ym-footer-btn.liked {
          color: #8B5CF6;
        }
        .text-purple {
          color: #8B5CF6;
        }
        .ym-more-btn {
          background: none;
          border: none;
          color: #4B5563;
          cursor: pointer;
        }
      `}</style>
    </article>
  );
}

export default memo(MobilePostCard);
