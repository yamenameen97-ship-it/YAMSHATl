import { memo } from 'react';
import BrandLogo from '../ui/BrandLogo.jsx';
import { useNavigate } from 'react-router-dom';

/**
 * MobilePostCard
 * بطاقة منشور بتصميم مطابق للنموذج المرجعي:
 * - رأس: صورة شخصية + اسم + توثيق + توقيت + قائمة (...)
 * - نص + هاشتاجات بنفسجية
 * - بنر اختياري للترويج (يدعم صور أيضاً)
 * - دعم خاص للبث المباشر (LIVE) والبث المسجل (RECORDED_STREAM)
 * - شريط تفاعل مبسط: إعجاب / تعليق / مشاركة / حفظ
 */

function VerifiedBadge() {
  return (
    <span className="ym-verified" aria-label="حساب موثّق">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 12.5 L11 14.5 L15.5 10" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

function YamshatY({ size = 22 }) {
  return <BrandLogo size={size} alt="Yamshat" shadow={false} className="ym-inline-brand" />;
}

function formatCount(n) {
  if (n == null || Number.isNaN(Number(n))) return '0';
  const num = Number(n);
  if (num >= 1000000) return `${(num / 1000000).toFixed(1).replace(/\.0$/, '')} مليون`;
  if (num >= 1000) return `${(num / 1000).toFixed(1).replace(/\.0$/, '')} ألف`;
  return String(num);
}

function renderTextWithHashtags(text = '') {
  const parts = String(text).split(/(\s+)/);
  return parts.map((part, i) => {
    if (/^#[\w\u0600-\u06FF_]+/.test(part)) {
      return <span key={i} className="hashtag">{part}</span>;
    }
    return <span key={i}>{part}</span>;
  });
}

function MobilePostCard({
  post = {},
  onLike,
  onComment,
  onShare,
  onSave,
  onMore,
}) {
  const navigate = useNavigate();
  const {
    authorName = 'مستخدم',
    handle = '@user',
    timeText = 'منذ قليل',
    verified = false,
    avatarUrl = '',
    text = '',
    banner = null,
    liked = false,
    saved = false,
    type = 'POST', // POST, LIVE, RECORDED_STREAM
    is_live = false,
    live_stream_id = null,
    viewers = 0,
    thumbnail = '',
    duration = '',
  } = post;

  const handleClick = (handler) => (e) => {
    e?.stopPropagation?.();
    handler?.(post);
  };

  const handlePostClick = () => {
    if (type === 'LIVE' && live_stream_id) {
      navigate(`/live/view/${live_stream_id}`);
    }
  };

  return (
    <article 
      className={`ym-post ${type === 'LIVE' ? 'is-live' : ''}`} 
      aria-label={`منشور من ${authorName}`}
      onClick={handlePostClick}
      style={{ cursor: type === 'LIVE' ? 'pointer' : 'default' }}
    >
      <header className="ym-post-head">
        <span className="ym-post-avatar">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" loading="lazy" />
          ) : (
            <YamshatY />
          )}
        </span>
        <div className="ym-post-meta">
          <div className="ym-post-author">
            <span className="name">{authorName}</span>
            {verified ? <VerifiedBadge /> : null}
            <span className="ym-post-sub" style={{ marginInlineStart: 4 }}>
              {handle}
              <span className="dot" />
              {timeText}
            </span>
          </div>
        </div>
        {type === 'LIVE' && (
          <div className="ym-live-badge-container">
            <span className="ym-live-badge">مباشر</span>
            <span className="ym-viewers-count">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
              </svg>
              {formatCount(viewers)}
            </span>
          </div>
        )}
        <button type="button" className="ym-post-more" aria-label="المزيد" onClick={handleClick(onMore)}>
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <circle cx="5" cy="12" r="1.6" fill="currentColor" />
            <circle cx="12" cy="12" r="1.6" fill="currentColor" />
            <circle cx="19" cy="12" r="1.6" fill="currentColor" />
          </svg>
        </button>
      </header>

      {text ? (
        <div className="ym-post-body">
          {type === 'LIVE' ? (
            <div className="ym-live-status-text">🔴 {authorName} يبث الآن</div>
          ) : type === 'RECORDED_STREAM' ? (
            <div className="ym-live-status-text">📹 انتهى البث</div>
          ) : null}
          {renderTextWithHashtags(text)}
        </div>
      ) : null}

      {(banner || thumbnail) ? (
        <div className="ym-post-banner">
          {type === 'LIVE' || type === 'RECORDED_STREAM' ? (
            <div className="ym-live-thumbnail-container">
              <img src={thumbnail || banner?.url} alt={authorName} loading="lazy" />
              <div className="ym-play-button-overlay">
                <svg viewBox="0 0 24 24" width="48" height="48" fill="white">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
              {type === 'RECORDED_STREAM' && duration && (
                <span className="ym-duration-badge">{duration}</span>
              )}
            </div>
          ) : banner.type === 'image' && banner.url ? (
            <img src={banner.url} alt={banner.title || ''} loading="lazy" />
          ) : (
            <div className="ym-post-banner-overlay">
              <span className="brand-logo">
                <BrandLogo size={56} alt="Yamshat" shadow={false} className="ym-banner-brand" />
              </span>
              <span className="brand-name">{banner.title || 'YAMSHAT'}</span>
              {banner.slogan ? <span className="brand-slogan">{banner.slogan}</span> : null}
            </div>
          )}
        </div>
      ) : null}

      {type === 'RECORDED_STREAM' && (
        <div className="ym-recorded-info">
          <p>مدة البث: {duration}</p>
          <button className="ym-watch-recorded-btn">مشاهدة التسجيل</button>
        </div>
      )}

      <div className="ym-post-actions" role="group" aria-label="إجراءات المنشور">
        <button type="button" className={`ym-action like ${liked ? 'is-active' : ''}`} onClick={handleClick(onLike)} aria-label="إعجاب" aria-pressed={liked}>
          <svg viewBox="0 0 24 24"><path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9Z" strokeLinejoin="round"/></svg>
          <span className="label">أعجبني</span>
        </button>
        <button type="button" className="ym-action" onClick={handleClick(onComment)} aria-label="تعليق">
          <svg viewBox="0 0 24 24"><path d="M21 12a8 8 0 1 1-3.6-6.7L21 4l-1.3 4.6A7.97 7.97 0 0 1 21 12Z" strokeLinejoin="round"/></svg>
          <span className="label">تعليق</span>
        </button>
        <button type="button" className="ym-action" onClick={handleClick(onShare)} aria-label="مشاركة">
          <svg viewBox="0 0 24 24"><path d="M12 16V4 M7 9l5-5 5 5 M5 20h14" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span className="label">مشاركة</span>
        </button>
        <button type="button" className={`ym-action save ${saved ? 'is-active' : ''}`} onClick={handleClick(onSave)} aria-label="حفظ" aria-pressed={saved}>
          <svg viewBox="0 0 24 24">
            <path d="M6 4 H18 V21 L12 16 L6 21 Z" strokeLinejoin="round" fill={saved ? 'currentColor' : 'none'} />
          </svg>
          <span className="label">حفظ</span>
        </button>
      </div>
    </article>
  );
}

export default memo(MobilePostCard);
