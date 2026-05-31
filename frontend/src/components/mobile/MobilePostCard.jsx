import { memo } from 'react';

/**
 * MobilePostCard
 * بطاقة منشور بتصميم مطابق للنموذج المرجعي:
 * - رأس: صورة شخصية + اسم + توثيق + توقيت + قائمة (...)
 * - نص + هاشتاجات بنفسجية
 * - بنر اختياري للترويج (يدعم صور أيضاً)
 * - شريط تفاعل: تعليق / إعادة نشر / إعجاب / مشاركة
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
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path d="M5 3 L12 13 L19 3 L16 3 L12 8 L8 3 Z M10 13 L14 13 L14 21 L10 21 Z" fill="#fff" />
    </svg>
  );
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
  onRepost,
  onShare,
  onMore,
}) {
  const {
    authorName = 'مستخدم',
    handle = '@user',
    timeText = 'منذ قليل',
    verified = false,
    avatarUrl = '',
    text = '',
    banner = null, // { type: 'image'|'logo', url?, title?, slogan? }
    likes = 0,
    comments = 0,
    reposts = 0,
    liked = false,
    reposted = false,
  } = post;

  return (
    <article className="ym-post" aria-label={`منشور من ${authorName}`}>
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
        <button type="button" className="ym-post-more" aria-label="المزيد" onClick={onMore}>
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <circle cx="5" cy="12" r="1.6" fill="currentColor" />
            <circle cx="12" cy="12" r="1.6" fill="currentColor" />
            <circle cx="19" cy="12" r="1.6" fill="currentColor" />
          </svg>
        </button>
      </header>

      {text ? (
        <div className="ym-post-body">{renderTextWithHashtags(text)}</div>
      ) : null}

      {banner ? (
        <div className="ym-post-banner">
          {banner.type === 'image' && banner.url ? (
            <img src={banner.url} alt={banner.title || ''} loading="lazy" />
          ) : (
            <div className="ym-post-banner-overlay">
              <span className="brand-logo">
                <svg viewBox="0 0 64 64" width="56" height="56">
                  <defs>
                    <linearGradient id="ym-banner-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#C4B5FD" />
                      <stop offset="100%" stopColor="#7C3AED" />
                    </linearGradient>
                  </defs>
                  <path d="M14 8 L32 36 L50 8 L42 8 L32 22 L22 8 Z M28 36 L36 36 L36 58 L28 58 Z" fill="url(#ym-banner-grad)" />
                </svg>
              </span>
              <span className="brand-name">{banner.title || 'YAMSHAT'}</span>
              {banner.slogan ? <span className="brand-slogan">{banner.slogan}</span> : null}
            </div>
          )}
        </div>
      ) : null}

      <div className="ym-post-actions" role="group" aria-label="إجراءات المنشور">
        <button type="button" className="ym-action" onClick={onComment} aria-label="تعليق">
          <svg viewBox="0 0 24 24"><path d="M21 12a8 8 0 1 1-3.6-6.7L21 4l-1.3 4.6A7.97 7.97 0 0 1 21 12Z" strokeLinejoin="round"/></svg>
          <span className="count">{formatCount(comments)}</span>
        </button>
        <button type="button"
                className={`ym-action repost ${reposted ? 'is-active' : ''}`}
                onClick={onRepost} aria-label="إعادة نشر">
          <svg viewBox="0 0 24 24">
            <path d="M7 7h11l-2-2 M17 17H6l2 2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M18 7v6 M6 17v-6" strokeLinecap="round" />
          </svg>
          <span className="count">{formatCount(reposts)}</span>
        </button>
        <button type="button"
                className={`ym-action like ${liked ? 'is-active' : ''}`}
                onClick={onLike} aria-label="إعجاب">
          <svg viewBox="0 0 24 24"><path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9Z" strokeLinejoin="round"/></svg>
          <span className="count">{formatCount(likes)}</span>
        </button>
        <button type="button" className="ym-action" onClick={onShare} aria-label="مشاركة">
          <svg viewBox="0 0 24 24"><path d="M12 16V4 M7 9l5-5 5 5 M5 20h14" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>
    </article>
  );
}

export default memo(MobilePostCard);
