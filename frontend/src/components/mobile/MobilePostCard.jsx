import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import BrandLogo from '../ui/BrandLogo.jsx';

/**
 * MobilePostCard
 * بطاقة منشور بتصميم مطابق للنموذج المرجعي مع دعم البث المباشر
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
    likes = 0,
    comments = 0,
    reposts = 0,
    is_live = false,
    live_stream_id = null,
    viewers = 0,
    thumbnail = null,
    media = [],
  } = post;

  const liveThumbnail = thumbnail || (media && media[0]?.url) || '';

  const handleClick = (handler) => (e) => {
    e?.stopPropagation?.();
    handler?.(post);
  };

  const handleJoinLive = (e) => {
    e?.stopPropagation();
    if (live_stream_id) {
      navigate(`/live/view/${live_stream_id}`);
    }
  };
  
  const handleLiveCardClick = (e) => {
    e?.stopPropagation();
    if (live_stream_id) {
      navigate(`/live/view/${live_stream_id}`);
    }
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

      {is_live ? (
        <div className="ym-post-live-banner" onClick={handleLiveCardClick} style={{
          position: 'relative',
          borderRadius: '16px',
          overflow: 'hidden',
          cursor: 'pointer',
          aspectRatio: '16/9',
          background: '#000',
          margin: '8px 0'
        }}>
          <img src={liveThumbnail || 'https://via.placeholder.com/800x450?text=Live+Stream'} alt="Live" style={{width:'100%', height:'100%', objectFit:'cover'}} />
          
          {/* طبقة التدرج */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.8) 100%)',
            zIndex: 1
          }} />
          
          {/* شارة البث المباشر */}
          <div style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            background: 'linear-gradient(135deg, #ef4444, #f97316)',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            animation: 'pulse 2s ease-in-out infinite',
            zIndex: 2
          }}>
            <span style={{width:8, height:8, background:'white', borderRadius:'50%', animation: 'blink 1s ease-in-out infinite'}}></span> مباشر
          </div>
          
          {/* عدد المشاهدين */}
          <div style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'rgba(0,0,0,0.4)',
            color: 'white',
            padding: '4px 10px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '600',
            backdropFilter: 'blur(10px)',
            zIndex: 2
          }}>
            👁 {formatCount(viewers)}
          </div>
          
          {/* معلومات المضيف والزر */}
          <div style={{
            position: 'absolute',
            bottom: '0',
            left: '0',
            right: '0',
            background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
            padding: '20px 12px 12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: 2
          }}>
            <span style={{color:'white', fontWeight:'bold', fontSize: '14px'}}>انضم للبث المباشر الآن</span>
            <button onClick={handleLiveCardClick} style={{
              background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '12px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(124, 58, 237, 0.4)',
              transition: 'all 0.2s ease'
            }}>انضم الآن</button>
          </div>
          
          <style>{`
            @keyframes blink {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.5; }
            }
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.8; }
            }
          `}</style>
        </div>
      ) : banner ? (
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

      {(likes > 0 || comments > 0 || reposts > 0) ? (
        <div className="ym-post-stats" style={{
          display: 'flex',
          gap: '12px',
          padding: '8px 0',
          fontSize: '13px',
          color: 'var(--text-muted, #65676b)',
          borderBottom: '1px solid var(--line, #e5e5ea)',
          marginBottom: '8px',
        }}>
          {likes > 0 && <span>{formatCount(likes)} إعجاب</span>}
          {comments > 0 && <span>{formatCount(comments)} تعليق</span>}
          {reposts > 0 && <span>{formatCount(reposts)} مشاركة</span>}
        </div>
      ) : null}

      {!is_live ? (
        <div className="ym-post-actions" role="group" aria-label="إجراءات المنشور">
        <button type="button" className={`ym-action like ${liked ? 'is-active' : ''}`} onClick={handleClick(onLike)} aria-label="إعجاب" aria-pressed={liked}>
          <svg viewBox="0 0 24 24"><path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9Z" strokeLinejoin="round"/></svg>
          <span className="label">أعجبني {likes > 0 ? `(${formatCount(likes)})` : ''}</span>
        </button>
        <button type="button" className="ym-action" onClick={handleClick(onComment)} aria-label="تعليق">
          <svg viewBox="0 0 24 24"><path d="M21 12a8 8 0 1 1-3.6-6.7L21 4l-1.3 4.6A7.97 7.97 0 0 1 21 12Z" strokeLinejoin="round"/></svg>
          <span className="label">تعليق {comments > 0 ? `(${formatCount(comments)})` : ''}</span>
        </button>
        <button type="button" className="ym-action" onClick={handleClick(onShare)} aria-label="مشاركة">
          <svg viewBox="0 0 24 24"><path d="M12 16V4 M7 9l5-5 5 5 M5 20h14" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span className="label">مشاركة {reposts > 0 ? `(${formatCount(reposts)})` : ''}</span>
        </button>
        <button type="button" className={`ym-action save ${saved ? 'is-active' : ''}`} onClick={handleClick(onSave)} aria-label="حفظ" aria-pressed={saved}>
          <svg viewBox="0 0 24 24">
            <path d="M6 4 H18 V21 L12 16 L6 21 Z" strokeLinejoin="round" fill={saved ? 'currentColor' : 'none'} />
          </svg>
          <span className="label">حفظ</span>
        </button>
        </div>
      ) : null}
    </article>
  );
}

export default memo(MobilePostCard);
