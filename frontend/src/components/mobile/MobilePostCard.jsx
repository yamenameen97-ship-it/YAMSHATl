import { memo, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { timeAgoAr as fmtTimeAgoAr } from '../../utils/timeFormat.js';

/**
 * MobilePostCard (v86.7 — إصلاح احترافي شامل للبستة على الجوال)
 * ----------------------------------------------------------------------
 * تحسينات جذرية دائمة (Root-cause fixes):
 *   • بطاقة بحواف دائرية + ظل ناعم بدل الخط السفلي فقط  → مظهر أنيق موحد.
 *   • هامش خارجي (margin) صغير موحّد لتباعد البستات بشكل منتظم.
 *   • padding داخلي موحد على كل breakpoints (لا مسافات متذبذبة).
 *   • كل الأحجام (خط/أفاتار/أزرار) موحّدة عبر متغيرات CSS + clamp
 *     ليبقى الفوتر دائماً داخل حدود الشاشة على 320px→768px بدون فيضان.
 *   • خط أصغر أنيق (Cairo/Noto Sans Arabic) بحجم متناسق.
 *   • فوتر بشبكة مقسّمة بالتساوي: الحفظ (يسار) + [مشاركة/تعليق/إعجاب] (يمين)
 *     — لن ينكسر أبداً على الشاشات الضيقة (flex + min-width:0).
 *   • overflow-x مقفول (overflow:hidden + max-width:100%) على مستوى البطاقة
 *     والحاويات الداخلية لمنع أي عنصر من تجاوز حدود الشاشة.
 *   • border-radius على صورة البانر متسق مع البطاقة.
 *
 * الترتيب البصري (RTL):
 *   الهيدر: [⋯]  ————  [الاسم + الوقت]  [الأفاتار]
 *   الجسم:  النص → الصورة
 *   الفوتر: [🔖 حفظ]  ————  [✈️ share] [💬 comments] [❤️ likes]
 */
function VerifiedBadge() {
  return (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="#8B5CF6" style={{ marginInlineStart: 3, flexShrink: 0 }} aria-hidden="true">
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
  const navigate = useNavigate();
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
    saved = false,
    isLive = false,
  } = post;

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

  const cleanUsername = (post.username || (handle || '').replace(/^@/, '') || authorName || '').trim();
  const goToProfile = (e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (!cleanUsername) return;
    navigate(`/profile/${encodeURIComponent(cleanUsername)}`);
  };
  const onKeyGoToProfile = (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goToProfile(e); }
  };

  return (
    <article className="ym-post-card" dir="rtl">
      {/* === الهيدر === */}
      <header className="ym-post-header">
        {/* أقصى اليسار: زر المزيد */}
        <button className="ym-more-btn" aria-label="المزيد" onClick={() => onMore?.(post)}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
            <circle cx="5" cy="12" r="1.8" />
            <circle cx="12" cy="12" r="1.8" />
            <circle cx="19" cy="12" r="1.8" />
          </svg>
        </button>

        {/* اليمين: مجموعة الهوية */}
        <div className="ym-identity-group">
          <div
            className="ym-post-title-area ym-clickable"
            role="link"
            tabIndex={0}
            onClick={goToProfile}
            onKeyDown={onKeyGoToProfile}
            aria-label={`فتح الملف الشخصي لـ ${authorName}`}
          >
            <div className="ym-author-row">
              <span className="ym-author-name">{authorName}</span>
              {verified && <VerifiedBadge />}
            </div>
            <div className="ym-post-subtext">
              <span className="ym-time" title={timeTitle || ''}>{liveTime}</span>
              <span className="ym-dot">•</span>
              <bdi className="ym-handle">{handle}</bdi>
              {isLive && <span className="ym-live-badge-inline">مباشر</span>}
            </div>
          </div>

          <div
            className="ym-post-avatar ym-clickable"
            role="link"
            tabIndex={0}
            onClick={goToProfile}
            onKeyDown={onKeyGoToProfile}
            aria-label={`فتح الملف الشخصي لـ ${authorName}`}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="" loading="lazy" decoding="async" />
            ) : (
              <svg viewBox="0 0 100 100" width="66%" height="66%" aria-hidden="true">
                <defs>
                  <linearGradient id="ym-post-avatar-grad" x1="0" y1="0" x2="0.5" y2="1">
                    <stop offset="0%" stopColor="#A78BFA" />
                    <stop offset="100%" stopColor="#6D28D9" />
                  </linearGradient>
                </defs>
                <line x1="22" y1="18" x2="50" y2="55" stroke="url(#ym-post-avatar-grad)" strokeWidth="12" strokeLinecap="round" />
                <line x1="78" y1="18" x2="50" y2="55" stroke="url(#ym-post-avatar-grad)" strokeWidth="12" strokeLinecap="round" />
                <line x1="50" y1="55" x2="50" y2="86" stroke="url(#ym-post-avatar-grad)" strokeWidth="12" strokeLinecap="round" />
              </svg>
            )}
          </div>
        </div>
      </header>

      {/* === النص === */}
      {text && (
        <div className="ym-post-content">
          <p dir="rtl">{text}</p>
        </div>
      )}

      {/* === وسائط المنشور (صورة / فيديو / شعار) === */}
      {/* ✅ v87.19 FIX: دعم الفيديو + معالجة خطأ ذكية.
           كان الفيديو لا يظهر إطلاقاً (buildBanner كان يرجع null)
           والصورة المكسورة كانت تعرض alt (فيظهر حرف “أ” من النص)
           قبل تنفيذ onError. الآن:
           • alt="" (فارغ) حتى لا يظهر نص قبيح داخل الإطار
           • fetchpriority="auto" و crossOrigin="anonymous" للمرونة
           • فيديو: <video> حقيقي مع controls + preload="metadata" + poster */}
      {banner && (banner.type === 'image' || banner.type === 'video' || banner.type === 'logo') && (
        <div className="ym-post-banner-new">
          {isLive && <div className="ym-live-overlay-label">مباشر الآن LIVE</div>}
          {banner.type === 'image' && (
            <div className="banner-image-container">
              <img
                src={banner.url}
                alt=""
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                onLoad={(e) => {
                  try {
                    e.currentTarget.classList.add('is-loaded');
                  } catch { /* ignore */ }
                }}
                onError={(e) => {
                  try {
                    const el = e.currentTarget;
                    const parent = el.parentNode;
                    el.style.display = 'none';
                    if (parent && !parent.querySelector('.banner-image-fallback')) {
                      const fb = document.createElement('div');
                      fb.className = 'banner-image-fallback';
                      fb.setAttribute('role', 'img');
                      fb.setAttribute('aria-label', 'تعذّر تحميل الصورة');
                      fb.innerHTML = ''
                        + '<svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
                        + '<rect x="3" y="3" width="18" height="18" rx="3"/>'
                        + '<circle cx="9" cy="9" r="1.6"/>'
                        + '<path d="M21 15l-5-5-9 9"/>'
                        + '</svg>'
                        + '<span>تعذّر تحميل الصورة</span>';
                      parent.appendChild(fb);
                    }
                  } catch { /* ignore */ }
                }}
              />
              {isLive && (
                <div className="banner-live-info">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="white" aria-hidden="true">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                  <span>{formatCount(post.viewers || 2400)} مشاهد</span>
                </div>
              )}
            </div>
          )}
          {banner.type === 'video' && (
            <div className="banner-video-container">
              <video
                src={banner.url}
                poster={banner.poster || undefined}
                controls
                playsInline
                preload="metadata"
                controlsList="nodownload noremoteplayback"
                disablePictureInPicture={false}
                onError={(e) => {
                  try {
                    const el = e.currentTarget;
                    const parent = el.parentNode;
                    el.style.display = 'none';
                    if (parent && !parent.querySelector('.banner-image-fallback')) {
                      const fb = document.createElement('div');
                      fb.className = 'banner-image-fallback';
                      fb.setAttribute('role', 'img');
                      fb.setAttribute('aria-label', 'تعذّر تشغيل الفيديو');
                      fb.innerHTML = ''
                        + '<svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
                        + '<polygon points="5 3 19 12 5 21 5 3"/>'
                        + '</svg>'
                        + '<span>تعذّر تشغيل الفيديو</span>';
                      parent.appendChild(fb);
                    }
                  } catch { /* ignore */ }
                }}
              >
                {/* fallback للمتصفحات القديمة */}
                متصفحك لا يدعم تشغيل الفيديو.
              </video>
            </div>
          )}
          {banner.type === 'logo' && (
            <div className="banner-logo-container">
              <svg className="ym-logo-large" viewBox="0 0 200 200" aria-hidden="true" preserveAspectRatio="xMidYMid meet">
                <defs>
                  <linearGradient id="ym-banner-grad" x1="0" y1="0" x2="0.5" y2="1">
                    <stop offset="0%" stopColor="#A78BFA" />
                    <stop offset="60%" stopColor="#8B5CF6" />
                    <stop offset="100%" stopColor="#6D28D9" />
                  </linearGradient>
                </defs>
                <line x1="45" y1="35" x2="100" y2="110" stroke="url(#ym-banner-grad)" strokeWidth="24" strokeLinecap="round" />
                <line x1="155" y1="35" x2="100" y2="110" stroke="url(#ym-banner-grad)" strokeWidth="24" strokeLinecap="round" />
                <line x1="100" y1="110" x2="100" y2="172" stroke="url(#ym-banner-grad)" strokeWidth="24" strokeLinecap="round" />
              </svg>
            </div>
          )}
        </div>
      )}

      {/* === الفوتر === */}
      <footer className="ym-post-footer">
        <div className="ym-footer-actions">
          {/* حفظ (أقصى اليسار) */}
          <button
            className={`ym-footer-btn ym-footer-btn-save ${saved ? 'is-saved' : ''}`}
            aria-label="حفظ"
            onClick={() => onSave?.(post)}
          >
            <svg viewBox="0 0 24 24" fill={saved ? '#8B5CF6' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </button>

          {/* مجموعة الأزرار الرئيسية (يمين): مشاركة | تعليق | إعجاب */}
          <div className="ym-footer-actions-right">
            <button className="ym-footer-btn" aria-label="مشاركة" onClick={() => onShare?.(post)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
              <span className="ym-count">{formatCount(Number(reposts) || 0)}</span>
            </button>

            <button className="ym-footer-btn" aria-label="تعليق" onClick={() => onComment?.(post)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span className="ym-count">{formatCount(Number(comments) || 0)}</span>
            </button>

            <button
              className={`ym-footer-btn ym-footer-btn-like ${liked ? 'liked' : ''}`}
              aria-label={liked ? 'إلغاء الإعجاب' : 'إعجاب'}
              aria-pressed={liked ? 'true' : 'false'}
              onClick={() => onLike?.(post)}
            >
              <svg
                viewBox="0 0 24 24"
                fill={liked ? '#8B5CF6' : 'none'}
                stroke={liked ? '#8B5CF6' : 'currentColor'}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              <span className={`ym-count ${liked ? 'text-purple' : ''}`}>{formatCount(Number(likes) || 0)}</span>
            </button>
          </div>
        </div>
      </footer>

      <style>{`
        /* ===================================================================
           v86.7 — بطاقة منشور احترافية موحّدة على الجوال
           - متغيرات CSS مركزية لضبط جميع الأحجام من مكان واحد
           - قيم clamp() تضمن ملاءمة ديناميكية لجميع الشاشات (320px → 768px)
           - overflow مقفول على كل المستويات لمنع الفيضان
           =================================================================== */
        .ym-post-card {
          /* متغيرات موحدة */
          --ym-radius: 14px;
          --ym-pad-x: clamp(10px, 3vw, 14px);
          --ym-pad-y: clamp(10px, 2.6vw, 13px);
          --ym-gap: clamp(6px, 1.8vw, 10px);
          --ym-avatar-size: clamp(34px, 9.5vw, 40px);
          --ym-name-size: clamp(0.82rem, 3.4vw, 0.94rem);
          --ym-meta-size: clamp(0.66rem, 2.6vw, 0.74rem);
          --ym-body-size: clamp(0.8rem, 3.3vw, 0.9rem);
          --ym-btn-size: clamp(0.8rem, 3.15vw, 0.9rem);
          --ym-icon-size: clamp(20px, 5.8vw, 24px);
          --ym-icon-more: clamp(16px, 4.8vw, 18px);

          background-color: #0A0D1A;
          border: 1px solid #1F2937;
          border-radius: var(--ym-radius);
          padding: var(--ym-pad-y) var(--ym-pad-x);
          margin: 8px auto;
          color: #fff;
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
          overflow: hidden;
          word-wrap: break-word;
          overflow-wrap: break-word;
          font-family: 'Noto Sans Arabic', 'Cairo', 'Tajawal', system-ui, -apple-system, sans-serif;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.28);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .ym-post-card:active {
          transform: scale(0.998);
        }

        /* =========================
           الهيدر
           ========================= */
        .ym-post-header {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--ym-gap);
          gap: var(--ym-gap);
          direction: ltr;
          min-width: 0;
          touch-action: pan-y;
          -webkit-tap-highlight-color: transparent;
        }
        .ym-identity-group {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: var(--ym-gap);
          min-width: 0;
          flex: 1 1 auto;
          justify-content: flex-end;
          overflow: hidden;
        }
        .ym-clickable {
          cursor: pointer;
          transition: opacity 0.15s ease, transform 0.15s ease;
        }
        .ym-clickable:hover { opacity: 0.85; }
        .ym-clickable:active { transform: scale(0.97); }
        .ym-clickable:focus-visible {
          outline: 2px solid #8B5CF6;
          outline-offset: 2px;
          border-radius: 8px;
        }
        .ym-post-avatar {
          width: var(--ym-avatar-size);
          height: var(--ym-avatar-size);
          border-radius: 50%;
          background: #14172a;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1.5px solid #8B5CF6;
          flex-shrink: 0;
          box-shadow: 0 0 6px rgba(139, 92, 246, 0.3);
        }
        .ym-post-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .ym-post-title-area {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          text-align: right;
          min-width: 0;
          flex: 0 1 auto;
          direction: rtl;
          overflow: hidden;
        }
        .ym-author-row {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 3px;
          direction: rtl;
          unicode-bidi: isolate;
          max-width: 100%;
        }
        .ym-author-name {
          font-weight: 700;
          font-size: var(--ym-name-size);
          color: #fff;
          line-height: 1.25;
          unicode-bidi: plaintext;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
        }
        .ym-post-subtext {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 4px;
          color: #9CA3AF;
          font-size: var(--ym-meta-size);
          margin-top: 2px;
          justify-content: flex-end;
          direction: rtl;
          unicode-bidi: isolate;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
        }
        .ym-dot { color: #6B7280; }
        .ym-handle {
          direction: ltr;
          unicode-bidi: isolate;
          display: inline-block;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
        }
        .ym-live-badge-inline {
          color: #8B5CF6;
          margin-inline-start: 4px;
          font-weight: 700;
          font-size: 0.92em;
        }
        .ym-more-btn {
          background: none;
          border: none;
          color: #6B7280;
          cursor: pointer;
          padding: 6px;
          border-radius: 8px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
          min-width: 34px;
          min-height: 34px;
          transition: background 0.15s ease, color 0.15s ease;
        }
        .ym-more-btn svg {
          width: var(--ym-icon-more);
          height: var(--ym-icon-more);
        }
        .ym-more-btn:hover { color: #C4B5FD; background: rgba(139, 92, 246, 0.08); }
        .ym-more-btn:active { background: rgba(139, 92, 246, 0.15); }

        /* =========================
           جسم النص
           ========================= */
        .ym-post-content {
          margin-bottom: var(--ym-gap);
          font-size: var(--ym-body-size);
          line-height: 1.55;
          color: #E5E7EB;
          word-wrap: break-word;
          overflow-wrap: break-word;
          direction: rtl;
          text-align: right;
          max-width: 100%;
        }
        .ym-post-content p { margin: 0; }

        /* =========================
           صورة المنشور
           ========================= */
        /* ✅ v87.21 — إصلاح الصورة المكسورة (الإطار الذي كان يقطع الصورة):
           كان ym-post-banner-new يفرض aspect-ratio: 1 / 1 قسرياً، مما
           يقطع الصورة لتكون مربعة (يقص الأجزاء الجانبية أو العلوية).
           الآن: نستخدم aspect-ratio:auto ونعتمد على object-fit:contain
           لعرض الصورة كاملة دون قص، ونحافظ على max-height حتى لا
           تملأ الشاشة لو كانت طويلة جداً. */
        .ym-post-banner-new {
          border-radius: 12px;
          overflow: hidden;
          margin-bottom: var(--ym-gap);
          position: relative;
          background: #000;
          aspect-ratio: auto;
          max-height: min(78dvh, 720px);
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          max-width: 100%;
        }
        .banner-image-container,
        .banner-video-container {
          position: relative;
          width: 100%;
          height: 100%;
          background: #000;
        }
        .banner-image-container img {
          width: 100%;
          height: auto;
          max-height: min(78dvh, 720px);
          object-fit: contain;
          display: block;
          opacity: 0;
          transition: opacity 220ms ease-out;
          background:
            linear-gradient(135deg, rgba(139,92,246,0.10) 0%, rgba(15,20,34,0.6) 100%);
        }
        .banner-image-container img.is-loaded { opacity: 1; }
        /* ✅ v87.19: فيديو حقيقي داخل البطاقة */
        .banner-video-container video {
          width: 100%;
          height: auto;
          max-height: min(78dvh, 720px);
          object-fit: contain;
          display: block;
          background: #000;
          /* controls native */
        }
        /* ✅ v87.19: إطار fallback أنيق (بدل شاشة سوداء فيها حرف) */
        .banner-image-fallback {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          background:
            linear-gradient(135deg, #1a1f33 0%, #0f1422 100%);
          color: #9CA3AF;
          font-size: 0.9rem;
          text-align: center;
          padding: 16px;
          direction: rtl;
        }
        .banner-image-fallback svg { opacity: 0.7; }
        .banner-image-fallback span { font-weight: 500; }
        .banner-logo-container {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #000;
        }
        .ym-logo-large {
          width: 58%;
          height: auto;
          max-width: 260px;
          filter: drop-shadow(0 6px 24px rgba(139, 92, 246, 0.55));
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
          font-weight: 700;
          z-index: 10;
        }
        .banner-live-info {
          position: absolute;
          bottom: 10px;
          right: 10px;
          background: rgba(0, 0, 0, 0.6);
          color: white;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 0.72rem;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        /* =========================
           الفوتر
           - شبكة موحّدة: [حفظ] | [مشاركة/تعليق/إعجاب]
           ========================= */
        .ym-post-footer {
          padding-top: 4px;
          border-top: 1px solid rgba(31, 41, 55, 0.6);
          margin-top: 2px;
        }
        .ym-footer-actions {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
          gap: 4px;
          width: 100%;
          direction: ltr;
          min-width: 0;
        }
        .ym-footer-actions-right {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: clamp(2px, 1.2vw, 6px);
          min-width: 0;
          flex: 0 1 auto;
        }
        .ym-footer-btn {
          background: none;
          border: none;
          color: #9CA3AF;
          display: inline-flex;
          flex-direction: row;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          font-size: var(--ym-btn-size);
          padding: 9px 11px;
          border-radius: 10px;
          transition: background 0.15s ease, color 0.15s ease;
          font-family: inherit;
          min-height: 44px;
          flex-shrink: 0;
          line-height: 1;
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
          -webkit-user-select: none;
          user-select: none;
        }
        .ym-footer-btn svg {
          width: var(--ym-icon-size);
          height: var(--ym-icon-size);
          flex-shrink: 0;
          display: block;
        }
        .ym-footer-btn .ym-count {
          font-family: 'Noto Sans Arabic', 'Cairo', 'Tajawal', system-ui, sans-serif;
          direction: rtl;
          font-variant-numeric: tabular-nums;
          font-weight: 600;
        }
        .ym-footer-btn:hover { background: rgba(139, 92, 246, 0.1); color: #C4B5FD; }
        .ym-footer-btn:active { transform: scale(0.94); background: rgba(139, 92, 246, 0.18); }
        .ym-footer-btn-like { color: #9CA3AF; }
        .ym-footer-btn-like.liked { color: #8B5CF6; }
        .ym-footer-btn-save { color: #9CA3AF; }
        .ym-footer-btn-save.is-saved { color: #8B5CF6; }
        .text-purple { color: #8B5CF6; font-weight: 700; }

        /* =========================
           شاشات صغيرة جداً (≤340px) — Redmi 5A, Galaxy Fold مغلق
           ========================= */
        @media (max-width: 340px) {
          .ym-post-card {
            --ym-radius: 12px;
            --ym-pad-x: 8px;
            --ym-pad-y: 9px;
            margin: 6px auto;
          }
          .ym-footer-btn { padding: 5px 5px; gap: 3px; }
          .ym-footer-actions-right { gap: 1px; }
        }

        /* =========================
           سطح المكتب / التابلت
           ========================= */
        @media (min-width: 768px) {
          .ym-post-card {
            --ym-radius: 16px;
            --ym-pad-x: 16px;
            --ym-pad-y: 14px;
            --ym-btn-size: 0.95rem;
            --ym-icon-size: 24px;
            margin: 10px auto;
          }
        }
        @media (min-width: 1024px) {
          .ym-post-card {
            --ym-btn-size: 0.92rem;
          }
        }

        /* دعم المتصفحات القديمة: نحافظ على نسبة الصورة الأصلية */
        @supports not (aspect-ratio: auto) {
          .ym-post-banner-new {
            height: auto;
            position: relative;
          }
          .banner-image-container,
          .banner-logo-container {
            position: relative;
            width: 100%;
          }
        }
      `}</style>
    </article>
  );
}

export default memo(MobilePostCard);
