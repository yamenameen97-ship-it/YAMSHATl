import { memo } from 'react';
import BrandLogo from '../ui/BrandLogo.jsx';

/**
 * MobilePostCard
 * بطاقة منشور بتصميم مطابق للنموذج المرجعي:
 * - رأس: صورة شخصية + اسم + توثيق + توقيت + قائمة (...)
 * - نص + هاشتاجات بنفسجية
 * - بنر اختياري للترويج (يدعم صور أيضاً)
 * - شريط تفاعل: تعليق / إعادة نشر / إعجاب / حفظ / مشاركة
 *
 * كل الأزرار مُربطة عبر props بـ handlers من الأب (FeedMobile)
 * التي تستدعي backend API الحقيقية.
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
  onRepost,
  onShare,
  onSave,
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
    saved = false,
  } = post;

  const handleClick = (handler) => (e) => {
    e?.stopPropagation?.();
    handler?.(post);
  };

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
        <button type="button" className="ym-post-more" aria-label="المزيد" onClick={handleClick(onMore)}>
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
                <BrandLogo size={56} alt="Yamshat" shadow={false} className="ym-banner-brand" />
              </span>
              <span className="brand-name">{banner.title || 'YAMSHAT'}</span>
              {banner.slogan ? <span className="brand-slogan">{banner.slogan}</span> : null}
            </div>
          )}
        </div>
      ) : null}

      <div className="ym-post-actions" role="group" aria-label="إجراءات المنشور">
        <button type="button" className="ym-action" onClick={handleClick(onComment)} aria-label="تعليق">
          <svg viewBox="0 0 24 24"><path d="M21 12a8 8 0 1 1-3.6-6.7L21 4l-1.3 4.6A7.97 7.97 0 0 1 21 12Z" strokeLinejoin="round"/></svg>
          <span className="count">{formatCount(comments)}</span>
        </button>
        <button type="button"
                className={`ym-action repost ${reposted ? 'is-active' : ''}`}
                onClick={handleClick(onRepost)} aria-label="إعادة نشر">
          <svg viewBox="0 0 24 24">
            <path d="M7 7h11l-2-2 M17 17H6l2 2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M18 7v6 M6 17v-6" strokeLinecap="round" />
          </svg>
          <span className="count">{formatCount(reposts)}</span>
        </button>
        <button type="button"
                className={`ym-action like ${liked ? 'is-active' : ''}`}
                onClick={handleClick(onLike)} aria-label="إعجاب"
                aria-pressed={liked}>
          <svg viewBox="0 0 24 24"><path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9Z" strokeLinejoin="round"/></svg>
          <span className="count">{formatCount(likes)}</span>
        </button>
        <button type="button"
                className={`ym-action save ${saved ? 'is-active' : ''}`}
                onClick={handleClick(onSave)} aria-label="حفظ"
                aria-pressed={saved}>
          <svg viewBox="0 0 24 24">
            <path d="M6 4 H18 V21 L12 16 L6 21 Z"
                  strokeLinejoin="round"
                  fill={saved ? 'currentColor' : 'none'} />
          </svg>
        </button>
        <button type="button" className="ym-action" onClick={handleClick(onShare)} aria-label="مشاركة">
          <svg viewBox="0 0 24 24"><path d="M12 16V4 M7 9l5-5 5 5 M5 20h14" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>
    </article>
  );
}

export default memo(MobilePostCard);
