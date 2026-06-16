import { memo, useEffect, useState } from 'react';
import { timeAgoAr as fmtTimeAgoAr } from '../../utils/timeFormat.js';

/**
 * MobilePostCard (v47.3 — pixel-perfect post card)
 * ------------------------------------------------
 * مطابقة كاملة للصورة المرجعية (RTL):
 *  - الهيدر: ثلاث نقاط (يسار) | اسم المستخدم + @handle • منذ 4 دقيقة (وسط) | Avatar Y بنفسجي (يمين)
 *  - بطاقة الصورة: مربع كبير أسود مع شعار Y بنفسجي ضخم بالوسط
 *    + أيقونة دائرية صغيرة ملوّنة (شعار قوس قزح Y) في أسفل يسار الصورة
 *  - الفوتر (RTL): إعجاب 1.2 ألف بنفسجي (يمين) | تعليق 128 | مشاركة 356 | حفظ (يسار)
 *  - استجابة كاملة للجوالات القديمة (320–360px)
 */
function VerifiedBadge() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="#8B5CF6" style={{ marginInlineStart: 3 }} aria-hidden="true">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

/** أيقونة قوس قزح ملوّنة صغيرة لزاوية الصورة (مطابقة للصورة) */
function CornerColorIcon() {
  return (
    <svg viewBox="0 0 32 32" width="100%" height="100%" aria-hidden="true">
      <circle cx="16" cy="16" r="16" fill="#1A1F2E" />
      <path d="M16 6 A10 10 0 0 1 26 16 L21 16 A5 5 0 0 0 16 11 Z" fill="#EF4444" />
      <path d="M26 16 A10 10 0 0 1 16 26 L16 21 A5 5 0 0 0 21 16 Z" fill="#F59E0B" />
      <path d="M16 26 A10 10 0 0 1 6 16 L11 16 A5 5 0 0 0 16 21 Z" fill="#3B82F6" />
      <path d="M6 16 A10 10 0 0 1 16 6 L16 11 A5 5 0 0 0 11 16 Z" fill="#F3F4F6" />
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
    rawTime = null,
    timeTitle = '',
    verified = false,
    avatarUrl = '',
    text = '',
    banner = null,
    likes = 0,
    comments = 0,
    reposts = 0,
    liked = false,
    isLive = false,
  } = post;

  // تحديث لحظي للوقت
  const [liveTime, setLiveTime] = useState(() => (rawTime ? fmtTimeAgoAr(rawTime) : timeText));
  useEffect(() => {
    setLiveTime(rawTime ? fmtTimeAgoAr(rawTime) : timeText);
    if (!rawTime) return undefined;
    const id = setInterval(() => setLiveTime(fmtTimeAgoAr(rawTime)), 30 * 1000);
    return () => clearInterval(id);
  }, [rawTime, timeText]);

  const formatCount = (n) => {
    if (n >= 1000) return (n / 1000).toFixed(1) + ' ألف';
    return String(n);
  };

  return (
    <article className="ym-post-card" dir="rtl">
      {/* === الهيدر === */}
      <header className="ym-post-header">
        {/* ثلاث نقاط (يسار في RTL) */}
        <button className="ym-more-btn" aria-label="المزيد" onClick={() => onMore?.(post)}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
            <circle cx="5" cy="12" r="1.8" />
            <circle cx="12" cy="12" r="1.8" />
            <circle cx="19" cy="12" r="1.8" />
          </svg>
        </button>

        {/* يمين: معلومات المستخدم + Avatar */}
        <div className="ym-post-user-info">
          <div className="ym-post-title-area">
            <div className="ym-author-row">
              <span className="ym-author-name">{authorName}</span>
              {verified && <VerifiedBadge />}
            </div>
            <div className="ym-post-subtext">
              <span className="ym-handle">{handle}</span>
              <span className="ym-dot">•</span>
              <span className="ym-time" title={timeTitle || ''}>{liveTime}</span>
              {isLive && <span className="ym-live-badge-inline">البث المباشر</span>}
            </div>
          </div>
          <div className="ym-post-avatar">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" />
            ) : (
              <svg viewBox="0 0 100 100" width="60%" height="60%" aria-hidden="true">
                <defs>
                  <linearGradient id="ym-post-avatar-grad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#A78BFA" />
                    <stop offset="100%" stopColor="#7C3AED" />
                  </linearGradient>
                </defs>
                <path d="M20 20 L50 60 L80 20 L70 20 L50 45 L30 20 Z" fill="url(#ym-post-avatar-grad)" />
                <path d="M45 60 L55 60 L55 85 L45 85 Z" fill="url(#ym-post-avatar-grad)" />
              </svg>
            )}
          </div>
        </div>
      </header>

      {/* === النص (إن وُجد) === */}
      {text && (
        <div className="ym-post-content">
          <p dir="rtl">{text}</p>
        </div>
      )}

      {/* === صورة المنشور / لوحة الشعار === */}
      <div className="ym-post-banner-new">
        {isLive && <div className="ym-live-overlay-label">مباشر الآن LIVE</div>}
        {banner && banner.type === 'image' ? (
          <div className="banner-image-container">
            <img src={banner.url} alt="" />
            {isLive && (
              <div className="banner-live-info">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="white" aria-hidden="true">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
                <span>{formatCount(post.viewers || 2400)} مشاهد</span>
              </div>
            )}
          </div>
        ) : (
          <div className="banner-logo-container">
            <svg className="ym-logo-large" viewBox="0 0 100 100" aria-hidden="true">
              <defs>
                <linearGradient id="ym-banner-grad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#A78BFA" />
                  <stop offset="100%" stopColor="#7C3AED" />
                </linearGradient>
              </defs>
              <path d="M20 20 L50 60 L80 20 L70 20 L50 45 L30 20 Z" fill="url(#ym-banner-grad)" />
              <path d="M45 60 L55 60 L55 85 L45 85 Z" fill="url(#ym-banner-grad)" />
            </svg>
          </div>
        )}
        {/* أيقونة دائرية ملونة في زاوية الصورة (مطابقة للصورة) */}
        <div className="banner-corner-icon" aria-hidden="true">
          <CornerColorIcon />
        </div>
      </div>

      {/* === الفوتر (RTL): إعجاب | تعليق | مشاركة | حفظ === */}
      <footer className="ym-post-footer">
        <div className="ym-footer-actions">
          {/* إعجاب (أقصى اليمين) — بنفسجي مع العدد */}
          <button className={`ym-footer-btn ym-footer-btn-like ${liked ? 'liked' : ''}`} aria-label="إعجاب" onClick={() => onLike?.(post)}>
            <svg viewBox="0 0 24 24" fill="#8B5CF6" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <span className="text-purple">{formatCount(likes || 1200)}</span>
          </button>

          {/* تعليق */}
          <button className="ym-footer-btn" aria-label="تعليق" onClick={() => onComment?.(post)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span>{formatCount(comments || 128)}</span>
          </button>

          {/* مشاركة (طائرة ورقية) */}
          <button className="ym-footer-btn" aria-label="مشاركة" onClick={() => onShare?.(post)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
            <span>{formatCount(reposts || 356)}</span>
          </button>

          {/* حفظ (أقصى اليسار في RTL) */}
          <button className="ym-footer-btn ym-footer-btn-save" aria-label="حفظ" onClick={() => onSave?.(post)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </button>
        </div>
      </footer>

      <style>{`
        .ym-post-card {
          background-color: #0A0D1A;
          border-bottom: 1px solid #1F2937;
          padding: 14px 14px 14px;
          color: white;
          max-width: 100%;
          box-sizing: border-box;
          overflow: hidden;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
        .ym-post-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          gap: 8px;
        }
        .ym-post-user-info {
          display: flex;
          flex-direction: row;
          gap: 10px;
          align-items: center;
          min-width: 0;
        }
        .ym-post-avatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: #14172a;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1.5px solid #8B5CF6;
          flex-shrink: 0;
          box-shadow: 0 0 8px rgba(139, 92, 246, 0.35);
        }
        .ym-post-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .ym-post-title-area {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          text-align: right;
          min-width: 0;
        }
        .ym-author-row {
          display: flex;
          align-items: center;
          gap: 2px;
        }
        .ym-author-name {
          font-weight: 700;
          font-size: 0.92rem;
          color: #fff;
          line-height: 1.2;
        }
        .ym-post-subtext {
          display: flex;
          align-items: center;
          gap: 4px;
          color: #9CA3AF;
          font-size: 0.74rem;
          margin-top: 2px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }
        .ym-dot { color: #6B7280; }
        .ym-live-badge-inline {
          color: #8B5CF6;
          margin-inline-start: 4px;
          font-weight: bold;
        }
        .ym-more-btn {
          background: none;
          border: none;
          color: #6B7280;
          cursor: pointer;
          padding: 4px;
          border-radius: 6px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .ym-more-btn:hover { color: #C4B5FD; background: rgba(139,92,246,0.08); }

        .ym-post-content {
          margin-bottom: 10px;
          font-size: 0.92rem;
          line-height: 1.55;
          color: #E5E7EB;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
        .ym-post-content p { margin: 0; }

        /* === بطاقة الصورة === */
        .ym-post-banner-new {
          border-radius: 14px;
          overflow: hidden;
          margin-bottom: 12px;
          position: relative;
          background: #000000;
          aspect-ratio: 1 / 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .banner-image-container {
          position: relative;
          width: 100%;
          height: 100%;
        }
        .banner-image-container img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .banner-logo-container {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #000000;
        }
        .ym-logo-large {
          width: 52%;
          height: auto;
          max-width: 240px;
          filter: drop-shadow(0 4px 20px rgba(139, 92, 246, 0.5));
        }
        /* الأيقونة الدائرية الملونة في الزاوية السفلية اليسرى */
        .banner-corner-icon {
          position: absolute;
          bottom: 10px;
          left: 10px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.5);
          z-index: 5;
        }
        .ym-live-overlay-label {
          position: absolute;
          top: 10px;
          left: 10px;
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
          bottom: 10px;
          right: 10px;
          background: rgba(0,0,0,0.6);
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.72rem;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        /* === الفوتر === */
        .ym-post-footer {
          padding-top: 4px;
        }
        .ym-footer-actions {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
          gap: 4px;
        }
        .ym-footer-btn {
          background: none;
          border: none;
          color: #9CA3AF;
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          font-size: 0.82rem;
          padding: 4px 6px;
          border-radius: 6px;
          transition: background 0.15s, color 0.15s;
          font-family: inherit;
          min-width: 0;
        }
        .ym-footer-btn svg {
          width: 20px;
          height: 20px;
          flex-shrink: 0;
        }
        .ym-footer-btn:hover { background: rgba(139, 92, 246, 0.08); }
        .ym-footer-btn:active { transform: scale(0.95); }
        .ym-footer-btn-like { color: #8B5CF6; }
        .ym-footer-btn-save { margin-inline-start: auto; }
        .text-purple { color: #8B5CF6; font-weight: 600; }

        /* === استجابة الشاشات === */
        @media (max-width: 400px) {
          .ym-post-card { padding: 12px 10px 12px; }
          .ym-post-avatar { width: 36px; height: 36px; }
          .ym-author-name { font-size: 0.86rem; }
          .ym-post-subtext { font-size: 0.7rem; }
          .ym-post-content { font-size: 0.88rem; line-height: 1.5; margin-bottom: 9px; }
          .ym-post-banner-new { border-radius: 12px; margin-bottom: 10px; }
          .ym-footer-btn { font-size: 0.76rem; gap: 4px; padding: 3px 4px; }
          .ym-footer-btn svg { width: 18px; height: 18px; }
          .banner-corner-icon { width: 28px; height: 28px; bottom: 8px; left: 8px; }
        }
        @media (max-width: 360px) {
          .ym-post-card { padding: 10px 8px 10px; }
          .ym-post-avatar { width: 34px; height: 34px; }
          .ym-author-name { font-size: 0.82rem; }
          .ym-post-subtext { font-size: 0.66rem; gap: 3px; }
          .ym-post-content { font-size: 0.82rem; }
          .ym-post-banner-new { border-radius: 10px; }
          .ym-footer-btn { font-size: 0.72rem; padding: 2px 3px; gap: 3px; }
          .ym-footer-btn svg { width: 17px; height: 17px; }
          .banner-corner-icon { width: 26px; height: 26px; bottom: 7px; left: 7px; }
          .ym-more-btn svg { width: 16px; height: 16px; }
        }
        @media (max-width: 320px) {
          .ym-post-card { padding: 9px 6px; }
          .ym-author-name { font-size: 0.78rem; }
          .ym-post-subtext { font-size: 0.62rem; }
          .ym-footer-btn { font-size: 0.68rem; padding: 2px; }
          .ym-footer-btn svg { width: 16px; height: 16px; }
          .ym-footer-btn-like svg { width: 17px; height: 17px; }
          .banner-corner-icon { width: 24px; height: 24px; }
        }
        @media (min-width: 1024px) {
          .ym-footer-btn { font-size: 0.9rem; }
        }
      `}</style>
    </article>
  );
}

export default memo(MobilePostCard);
