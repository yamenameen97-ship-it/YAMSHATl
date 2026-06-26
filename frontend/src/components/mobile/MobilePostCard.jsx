import { memo, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { timeAgoAr as fmtTimeAgoAr } from '../../utils/timeFormat.js';

/**
 * MobilePostCard (v47.9 — إصلاح الاسم المعكوس في صفحة الجوال)
 * ----------------------------------------------------------------------
 * الترتيب البصري الصحيح كما في الصورة المرجعية الثانية
 * (من اليسار→اليمين على الشاشة):
 *
 * الهيدر:
 *   | ⋯       yamenameen97       Y(avatar) |
 *   |       منذ 4 دقيقة • @yamenameen97          |
 *   (أقصى اليسار: ⋯)   (وسط: النص)   (أقصى اليمين: شعار Y)
 *
 * أي: اسم المستخدم يظهر بين زر ⋯ وبين شعار Y الدائري.
 * الاتجاه للنص: RTL طبيعي بمحاذاة اليمين (نحو الشعار).
 * ✅ إصلاح: عكس ترتيب الوقت و@handle ليصبح "منذ 4 دقيقة • @yamenameen97"
 * بدلاً من "@yamenameen97 • منذ 4 دقيقة" وفقاً للصورة المرجعية الثانية.
 *
 * الصورة: مربع أسود بنسبة 1:1 مع شعار Y بنفسجي ضخم في الوسط،
 *         وأيقونة دائرية ملونة في الزاوية السفلية اليسرى.
 *
 * الفوتر (من اليسار→اليمين على الشاشة):
 *   🏷️ حفظ   ✈️ 356   💬 128   ❤️ 1.2 ألف
 *   (يسار)                            (يمين)
 */
function VerifiedBadge() {
  return (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="#8B5CF6" style={{ marginInlineStart: 3, flexShrink: 0 }} aria-hidden="true">
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

  /* ✅ v48 — استخراج اسم المستخدم النقي (بدون @) للتوجيه لصفحة البروفايل */
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
      {/* === الهيدر (v48 — الاسم ملتصق بالأفاتار على اليمين، ⋯ على اليسار) === */}
      <header className="ym-post-header" dir="ltr">
        {/* أقصى اليسار: ثلاث نقاط ⋯ */}
        <button className="ym-more-btn" aria-label="المزيد" onClick={() => onMore?.(post)}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
            <circle cx="5" cy="12" r="1.8" />
            <circle cx="12" cy="12" r="1.8" />
            <circle cx="19" cy="12" r="1.8" />
          </svg>
        </button>

        {/* مجموعة هوية المستخدم على اليمين: [الاسم + الوقت] ثم [الأفاتار] مباشرة بجانبها */}
        <div className="ym-identity-group" dir="ltr">
          {/* النص (الاسم + الوقت/المعرّف) — قابل للنقر للذهاب للبروفايل */}
          <div
            className="ym-post-title-area ym-clickable"
            dir="rtl"
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
            {/* ✅ ترتيب: الوقت • @handle (مطابق للصورة المرجعية) */}
            <div className="ym-post-subtext" dir="rtl">
              <span className="ym-time" title={timeTitle || ''}>{liveTime}</span>
              <span className="ym-dot">•</span>
              <bdi className="ym-handle">{handle}</bdi>
              {isLive && <span className="ym-live-badge-inline">البث المباشر</span>}
            </div>
          </div>

          {/* أقصى اليمين: Avatar (الشعار الدائري) — قابل للنقر أيضاً */}
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
            {/* v59.13.19 UX FIX: alt وصفي للوصولية + معالجة خطأ تحميل
                الصورة بدل إظهار أيقونة "صورة مكسورة" للمستخدم */}
            <img
              src={banner.url}
              alt={(text && String(text).trim().slice(0, 140)) || `صورة منشور من ${authorName}`}
              loading="lazy"
              decoding="async"
              draggable={false}
              onContextMenu={(e) => e.preventDefault()}
              onError={(e) => {
                try {
                  const el = e.currentTarget;
                  el.style.display = 'none';
                  if (el.parentNode && !el.parentNode.querySelector('.banner-image-fallback')) {
                    const fb = document.createElement('div');
                    fb.className = 'banner-image-fallback';
                    fb.setAttribute('role', 'img');
                    fb.setAttribute('aria-label', 'تعذّر تحميل الصورة');
                    fb.innerText = '🖼️ تعذّر تحميل الصورة';
                    el.parentNode.appendChild(fb);
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
        ) : (
          <div className="banner-logo-container">
            {/* شعار Y كبير بسيط بخطوط سميكة — مطابق تماماً للصورة المرجعية */}
            <svg className="ym-logo-large" viewBox="0 0 200 200" aria-hidden="true" preserveAspectRatio="xMidYMid meet">
              <defs>
                <linearGradient id="ym-banner-grad" x1="0" y1="0" x2="0.5" y2="1">
                  <stop offset="0%" stopColor="#A78BFA" />
                  <stop offset="60%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#6D28D9" />
                </linearGradient>
              </defs>
              {/* الفرع الأيسر */}
              <line
                x1="45" y1="35" x2="100" y2="110"
                stroke="url(#ym-banner-grad)"
                strokeWidth="24"
                strokeLinecap="round"
              />
              {/* الفرع الأيمن */}
              <line
                x1="155" y1="35" x2="100" y2="110"
                stroke="url(#ym-banner-grad)"
                strokeWidth="24"
                strokeLinecap="round"
              />
              {/* الساق العمودية */}
              <line
                x1="100" y1="110" x2="100" y2="172"
                stroke="url(#ym-banner-grad)"
                strokeWidth="24"
                strokeLinecap="round"
              />
            </svg>
          </div>
        )}
        <div className="banner-corner-icon" aria-hidden="true">
          <CornerColorIcon />
        </div>
      </div>

      {/* === الفوتر — الترتيب على الشاشة من اليسار→اليمين:
            🏷️ حفظ | ✈️ مشاركة | 💬 تعليق | ❤️ إعجاب === */}
      <footer className="ym-post-footer">
        <div className="ym-footer-actions" dir="ltr">
          {/* زر الحفظ (أقصى اليسار على الشاشة) */}
          <button
            className={`ym-footer-btn ym-footer-btn-save ${saved ? 'is-saved' : ''}`}
            aria-label="حفظ"
            onClick={() => onSave?.(post)}
          >
            <svg viewBox="0 0 24 24" fill={saved ? '#8B5CF6' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </button>

          {/* مشاركة (طائرة ورقية) */}
          <button className="ym-footer-btn" aria-label="مشاركة" onClick={() => onShare?.(post)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
            <span className="ym-count">{formatCount(Number(reposts) || 0)}</span>
          </button>

          {/* تعليق */}
          <button className="ym-footer-btn" aria-label="تعليق" onClick={() => onComment?.(post)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span className="ym-count">{formatCount(Number(comments) || 0)}</span>
          </button>

          {/* إعجاب (أقصى اليمين على الشاشة) — v59.13.19 UX FIX:
             القلب يعكس حالة liked فعلياً (ممتلئ بنفسجي عند الإعجاب،
             مفرَّغ رمادي بدون إعجاب)، والعدد كذلك. */}
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
      </footer>

      <style>{`
        .ym-post-card {
          background-color: #0A0D1A;
          border-bottom: 1px solid #1F2937;
          padding: 12px 12px;
          color: white;
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
          overflow: hidden;
          word-wrap: break-word;
          overflow-wrap: break-word;
          font-family: 'Noto Sans Arabic', 'Tajawal', system-ui, sans-serif;
        }
        .ym-post-header {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
          gap: 8px;
          direction: ltr;
          /* v59.13.21: pan-y بدل manipulation لإتاحة Pull-to-Refresh من أي مكان */
          touch-action: pan-y;
          -webkit-tap-highlight-color: transparent;
        }
        /* ✅ v48: مجموعة الاسم + الأفاتار ملتصقتان كوحدة واحدة على اليمين */
        .ym-identity-group {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 8px;
          min-width: 0;
          flex: 0 1 auto;
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
          flex: 0 1 auto;
          padding-inline-end: 0;
          direction: rtl;
        }
        .ym-author-row {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 2px;
          direction: rtl;
          unicode-bidi: isolate;
        }
        .ym-author-name {
          font-weight: 700;
          font-size: 0.9rem;
          color: #fff;
          line-height: 1.2;
          unicode-bidi: plaintext;
        }
        .ym-post-subtext {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 4px;
          color: #9CA3AF;
          font-size: 0.72rem;
          margin-top: 2px;
          flex-wrap: wrap;
          justify-content: flex-end;
          direction: rtl;
          unicode-bidi: isolate;
        }
        .ym-dot { color: #6B7280; }
        .ym-handle {
          /* عزل اتجاه @handle حتى لا ينعكس داخل الحاوية RTL */
          direction: ltr;
          unicode-bidi: isolate;
          display: inline-block;
        }
        .ym-author-name {
          unicode-bidi: plaintext;
        }
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
          padding: 8px;
          border-radius: 6px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          /* تحسين الاستجابة على الجوال */
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
          min-width: 36px;
          min-height: 36px;
        }
        .ym-more-btn:hover { color: #C4B5FD; background: rgba(139,92,246,0.08); }

        .ym-post-content {
          margin-bottom: 9px;
          font-size: 0.88rem;
          line-height: 1.5;
          color: #E5E7EB;
          word-wrap: break-word;
          overflow-wrap: break-word;
          direction: rtl;
          text-align: right;
        }
        .ym-post-content p { margin: 0; }

        /* === بطاقة الصورة === */
        .ym-post-banner-new {
          border-radius: 14px;
          overflow: hidden;
          margin-bottom: 10px;
          position: relative;
          background: #000000;
          aspect-ratio: 1 / 1;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          max-width: 100%;
        }
        .banner-image-container {
          position: relative;
          width: 100%;
          height: 100%;
          /* v59.13.28: منع متصفح Chrome/Android من إظهار
             أيقونة Google Lens (دائرة ملوّنة) فوق الصور */
          -webkit-touch-callout: none;
          user-select: none;
        }
        .banner-image-container img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          /* v59.13.28: إخفاء أيقونة Google Lens / Chrome image actions */
          -webkit-touch-callout: none;
          -webkit-user-drag: none;
          user-select: none;
          pointer-events: none;
        }
        /* v59.13.28: طبقة تفاعل شفافة تمنع قائمة الصورة
           وأيقونة Google Lens عند الضغط المطوّل */
        .banner-image-container::after {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: auto;
          background: transparent;
          -webkit-touch-callout: none;
          -webkit-user-drag: none;
          user-select: none;
        }
        /* v59.13.19 UX FIX: بديل احتياطي عند فشل تحميل صورة المنشور */
        .banner-image-fallback {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #1a1f33 0%, #0f1422 100%);
          color: #9CA3AF;
          font-size: 0.85rem;
          font-family: 'Noto Sans Arabic', 'Cairo', system-ui, sans-serif;
          text-align: center;
          padding: 12px;
          direction: rtl;
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
          width: 58%;
          height: auto;
          max-width: 260px;
          filter: drop-shadow(0 6px 24px rgba(139, 92, 246, 0.55));
        }
        @media (max-width: 360px) {
          .ym-logo-large { width: 62%; }
        }
        @media (max-width: 320px) {
          .ym-logo-large { width: 66%; }
        }
        .banner-corner-icon {
          position: absolute;
          bottom: 10px;
          left: 10px;
          width: 30px;
          height: 30px;
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
          width: 100%;
          direction: ltr;
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
          font-size: 0.8rem;
          padding: 8px 10px;
          border-radius: 6px;
          transition: background 0.15s, color 0.15s;
          font-family: inherit;
          min-width: 44px;
          min-height: 36px;
          flex-shrink: 0;
          line-height: 1;
          /* استجابة لمس فورية على PWA/Chrome Mobile */
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
          -webkit-user-select: none;
          user-select: none;
        }
        .ym-footer-btn svg {
          width: 21px;
          height: 21px;
          flex-shrink: 0;
          display: block;
        }
        .ym-footer-btn .ym-count {
          font-family: 'Noto Sans Arabic', 'Tajawal', system-ui, sans-serif;
          direction: rtl;
        }
        .ym-footer-btn:hover { background: rgba(139, 92, 246, 0.08); }
        .ym-footer-btn:active { transform: scale(0.95); }
        .ym-footer-btn-like { color: #8B5CF6; }
        .ym-footer-btn-save { color: #9CA3AF; flex-shrink: 0; }
        .ym-footer-btn-save.is-saved { color: #8B5CF6; }
        .text-purple { color: #8B5CF6; font-weight: 600; }

        @media (max-width: 400px) {
          .ym-post-card { padding: 11px 10px; }
          .ym-post-avatar { width: 36px; height: 36px; }
          .ym-author-name { font-size: 0.86rem; }
          .ym-post-subtext { font-size: 0.68rem; }
          .ym-post-content { font-size: 0.84rem; line-height: 1.5; margin-bottom: 8px; }
          .ym-post-banner-new { border-radius: 12px; margin-bottom: 9px; }
          .ym-footer-btn { font-size: 0.76rem; gap: 5px; padding: 3px 5px; }
          .ym-footer-btn svg { width: 20px; height: 20px; }
          .banner-corner-icon { width: 28px; height: 28px; bottom: 8px; left: 8px; }
        }
        @media (max-width: 360px) {
          .ym-post-card { padding: 9px 7px; }
          .ym-post-avatar { width: 34px; height: 34px; }
          .ym-author-name { font-size: 0.8rem; }
          .ym-post-subtext { font-size: 0.64rem; gap: 3px; }
          .ym-post-content { font-size: 0.78rem; }
          .ym-post-banner-new { border-radius: 10px; }
          .ym-footer-btn { font-size: 0.7rem; padding: 2px 4px; gap: 4px; }
          .ym-footer-btn svg { width: 18px; height: 18px; }
          .banner-corner-icon { width: 26px; height: 26px; bottom: 7px; left: 7px; }
          .ym-more-btn svg { width: 16px; height: 16px; }
        }
        @media (max-width: 320px) {
          .ym-post-card { padding: 7px 5px; }
          .ym-post-avatar { width: 30px; height: 30px; }
          .ym-author-name { font-size: 0.74rem; }
          .ym-post-subtext { font-size: 0.58rem; gap: 2px; }
          .ym-post-content { font-size: 0.74rem; line-height: 1.45; }
          .ym-post-banner-new { border-radius: 9px; margin-bottom: 7px; }
          .ym-footer-btn { font-size: 0.62rem; padding: 2px 3px; gap: 3px; }
          .ym-footer-btn svg { width: 16px; height: 16px; }
          .ym-footer-btn-like svg { width: 18px; height: 18px; }
          .banner-corner-icon { width: 22px; height: 22px; bottom: 6px; left: 6px; }
          .ym-more-btn svg { width: 15px; height: 15px; }
          .ym-more-btn { padding: 2px; }
        }
        /* دعم Redmi Note 8 (393px) والأجهزة المشابهة */
        @media (max-width: 393px) and (min-width: 361px) {
          .ym-post-card { padding: 11px 9px; }
          .ym-post-avatar { width: 37px; height: 37px; }
          .ym-author-name { font-size: 0.88rem; }
          .ym-post-subtext { font-size: 0.7rem; }
          .ym-footer-btn { font-size: 0.78rem; }
          .ym-footer-btn svg { width: 20px; height: 20px; }
        }
        /* دعم المتصفحات القديمة التي لا تدعم aspect-ratio */
        @supports not (aspect-ratio: 1 / 1) {
          .ym-post-banner-new {
            height: 0;
            padding-bottom: 100%;
            position: relative;
          }
          .banner-image-container,
          .banner-logo-container {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
          }
        }
        @media (min-width: 1024px) {
          .ym-footer-btn { font-size: 0.92rem; }
        }
      `}</style>
    </article>
  );
}

export default memo(MobilePostCard);
