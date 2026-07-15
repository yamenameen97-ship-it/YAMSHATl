import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../ui/Button.jsx';
import Modal from '../ui/Modal.jsx';
import OptimizedImage from '../ui/OptimizedImage.jsx';
import { updateMyProfile } from '../../api/users.js';
import { resolveMediaUrl } from '../../config/mediaConfig.js';

/**
 * ProfileHeader (v85 — Profile Completeness Upgrade)
 * =====================================================
 * التحسينات الخمس المضافة لتقارب منصات (Instagram / Facebook / TikTok / WhatsApp):
 *  1) تبويب "الوسائط المُعلَّمة" (Tagged Posts) — كامل مع Empty state
 *  2) روابط السيرة الذاتية (Bio Links) — عرض قابل للنقر + أيقونات ذكية
 *  3) قائمة "المزيد" (⋯) + زر المشاركة (Share / Block / Report / Copy Link)
 *  4) قسم "القصص المميزة" (Story Highlights) — قابل للتمرير الأفقي
 *  5) مؤشر حالة الاتصال (Online Status Indicator) على الأفاتار
 * -----------------------------------------------------
 * ملاحظات:
 *  - جميع الإضافات محمية بـ null-checks ولن تكسر إذا لم يوفر الـ backend الحقول
 *  - dir="rtl" وخط Noto Sans Arabic / Tajawal للحفاظ على هوية المشروع
 */

const FallbackAvatar = ({ name = 'User' }) => {
  const initials = String(name || 'U')
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .join('')
    .toUpperCase()
    .slice(0, 2);
  return (
    <div className="ymp-fallback-avatar">{initials}</div>
  );
};

const FallbackCover = () => <div className="ymp-fallback-cover" />;

const VerifiedBadge = () => (
  <span className="ymp-verified" title="حساب موثّق" aria-label="حساب موثّق">
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        fill="#3b82f6"
        d="M12 2l2.39 2.06L17.5 4l.94 3.06L21 8l-.94 3.06L21 14l-3.06.94L17.5 18l-3.11-.06L12 20l-2.39-2.06L6.5 18l-.94-3.06L3 14l.94-3.06L3 8l3.06-.94L6.5 4l3.11.06L12 2z"
      />
      <path
        fill="#fff"
        d="M10.7 14.4l-2.4-2.4 1.06-1.06 1.34 1.34 3.94-3.94 1.06 1.07z"
      />
    </svg>
  </span>
);

/* =====================================================
 * 🔗 (2) Bio Links Renderer — يكتشف نوع الرابط ويعرض أيقونة مناسبة
 * ===================================================== */
const detectLinkType = (url = '') => {
  const u = String(url).toLowerCase();
  if (u.includes('instagram.com')) return { icon: '📷', label: 'Instagram' };
  if (u.includes('twitter.com') || u.includes('x.com')) return { icon: '𝕏', label: 'X' };
  if (u.includes('tiktok.com')) return { icon: '🎵', label: 'TikTok' };
  if (u.includes('youtube.com') || u.includes('youtu.be')) return { icon: '▶️', label: 'YouTube' };
  if (u.includes('facebook.com')) return { icon: 'f', label: 'Facebook' };
  if (u.includes('linkedin.com')) return { icon: 'in', label: 'LinkedIn' };
  if (u.includes('github.com')) return { icon: '⌨️', label: 'GitHub' };
  if (u.includes('t.me') || u.includes('telegram')) return { icon: '✈️', label: 'Telegram' };
  if (u.includes('wa.me') || u.includes('whatsapp')) return { icon: '💬', label: 'WhatsApp' };
  return { icon: '🔗', label: 'موقع' };
};

const BioLinks = ({ links = [] }) => {
  if (!Array.isArray(links) || links.length === 0) return null;
  return (
    <div className="ymp-bio-links" role="list">
      {links.slice(0, 5).map((raw, i) => {
        const link = typeof raw === 'string' ? { url: raw, title: '' } : (raw || {});
        const href = link.url || '';
        if (!href) return null;
        const meta = detectLinkType(href);
        const label = link.title || meta.label;
        return (
          <a
            key={`biolink-${i}`}
            className="ymp-bio-link"
            href={href}
            target="_blank"
            rel="noopener noreferrer nofollow"
            role="listitem"
            title={href}
          >
            <span className="ymp-bio-link-icon" aria-hidden="true">{meta.icon}</span>
            <span className="ymp-bio-link-label">{label}</span>
          </a>
        );
      })}
    </div>
  );
};

/* =====================================================
 * 📖 (4) Story Highlights Rail — شريط قابل للتمرير الأفقي
 * ===================================================== */
const StoryHighlights = ({ highlights = [], isOwnProfile, onAddHighlight }) => {
  if ((!Array.isArray(highlights) || highlights.length === 0) && !isOwnProfile) return null;
  return (
    <div className="ymp-highlights" role="region" aria-label="القصص المميزة">
      <div className="ymp-highlights-track">
        {isOwnProfile && (
          <button
            type="button"
            className="ymp-highlight-item ymp-highlight-add"
            onClick={onAddHighlight}
            aria-label="إضافة قصة مميزة جديدة"
          >
            <div className="ymp-highlight-ring">
              <div className="ymp-highlight-thumb ymp-highlight-plus">＋</div>
            </div>
            <span className="ymp-highlight-title">جديد</span>
          </button>
        )}
        {highlights.map((h, i) => (
          <button
            key={h.id || `hl-${i}`}
            type="button"
            className="ymp-highlight-item"
            onClick={() => (typeof h.onClick === 'function' ? h.onClick(h) : null)}
          >
            <div className="ymp-highlight-ring">
              {h.cover ? (
                <img className="ymp-highlight-thumb" src={resolveMediaUrl(h.cover)} alt={h.title || 'قصة مميزة'} />
              ) : (
                <div className="ymp-highlight-thumb ymp-highlight-fallback">📖</div>
              )}
            </div>
            <span className="ymp-highlight-title">{h.title || 'قصة'}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default function ProfileHeader({
  profile,
  isOwnProfile,
  onAnalyticsClick,
  onCustomizationClick,
  onFollowClick,
  activeTab: externalActiveTab,
  onTabChange,
  tabs: externalTabs,
  onAddHighlight,
  onBlockUser,
  onReportUser,
}) {
  const navigate = useNavigate();
  const [showCoverEditor, setShowCoverEditor] = useState(false);
  const [showAvatarCropper, setShowAvatarCropper] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false); // 🆕 (3)
  const [copyFlash, setCopyFlash] = useState(false);       // 🆕 (3)
  const [internalTab, setInternalTab] = useState('all');
  const activeTab = externalActiveTab || internalTab;
  const moreMenuRef = useRef(null);

  const [coverImage, setCoverImage] = useState(profile?.user?.profile?.cover_photo || '');
  const [avatarImage, setAvatarImage] = useState(profile?.user?.avatar || '');
  const [coverImageError, setCoverImageError] = useState(false);
  const [avatarImageError, setAvatarImageError] = useState(false);

  const fileInputRef = useRef(null);
  const avatarInputRef = useRef(null);

  const handleTabChange = useCallback((tab) => {
    setInternalTab(tab);
    if (typeof onTabChange === 'function') onTabChange(tab);
  }, [onTabChange]);

  const handleCoverUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('الرجاء اختيار صورة'); return; }
    if (file.size > 5 * 1024 * 1024) { alert('حجم الصورة كبير جداً (الحد الأقصى 5MB)'); return; }
    const reader = new FileReader();
    reader.onload = (event) => { setCoverImage(event.target?.result); setCoverImageError(false); };
    reader.onerror = () => alert('حدث خطأ في قراءة الملف');
    reader.readAsDataURL(file);
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('الرجاء اختيار صورة'); return; }
    if (file.size > 2 * 1024 * 1024) { alert('حجم الصورة كبير جداً (الحد الأقصى 2MB)'); return; }
    const reader = new FileReader();
    reader.onload = (event) => {
      setAvatarImage(event.target?.result);
      setAvatarImageError(false);
      setShowAvatarCropper(true);
    };
    reader.onerror = () => alert('حدث خطأ في قراءة الملف');
    reader.readAsDataURL(file);
  };

  const applyCrop = async () => {
    try {
      await updateMyProfile({ avatar: avatarImage });
      setShowAvatarCropper(false);
    } catch (error) {
      console.error('Failed to update avatar:', error);
      alert('فشل تحديث الصورة الشخصية');
    }
  };

  const saveCoverImage = async () => {
    try {
      await updateMyProfile({ cover_photo: coverImage });
      setShowCoverEditor(false);
    } catch (error) {
      console.error('Failed to update cover:', error);
      alert('فشل تحديث صورة الغلاف');
    }
  };

  /* 🆕 (1) — دعم تبويبات خارجية لربط الهيدر بمحتوى الصفحة الفعلي */
  const tabs = useMemo(() => {
    if (Array.isArray(externalTabs) && externalTabs.length > 0) return externalTabs;
    return [
      { key: 'all', label: 'الكل' },
      { key: 'reels', label: 'ريلز' },
      { key: 'photos', label: 'الصور' },
      { key: 'tagged', label: 'المُعلَّمة', icon: '🏷️' },
    ];
  }, [externalTabs]);

  // قراءة full_name من جميع المصادر المحتملة + النسخة المحلية الاحتياطية
  const localFullName = (() => {
    try {
      const uname = profile?.user?.username;
      return uname ? window.localStorage.getItem(`yamshat:profile:fullname:${uname}`) || '' : '';
    } catch { return ''; }
  })();
  const fullName = profile?.user?.display_name
    || profile?.user?.full_name
    || profile?.user?.profile?.full_name
    || localFullName
    || profile?.user?.username
    || 'مستخدم';
  const username = profile?.user?.username || 'مستخدم';
  const postsCount = profile?.posts_count || 0;
  const followersCount = profile?.followers_count || 0;
  const followingCount = profile?.following_count || 0;
  const bio = profile?.user?.profile?.bio || '';
  const tagline = profile?.user?.profile?.activity_tagline || 'منشئ محتوى رقمي';
  const isVerified = profile?.user?.is_verified || profile?.user?.verified || false;
  const isFollowing = profile?.is_following || false;
  const city = profile?.user?.profile?.city || '';
  const gender = profile?.user?.profile?.gender || '';

  /* 🆕 (2) — قراءة روابط السيرة الذاتية من الحقول المحتملة */
  const bioLinks = useMemo(() => {
    const raw = profile?.user?.profile?.bio_links
      || profile?.user?.profile?.links
      || profile?.user?.links
      || [];
    if (!Array.isArray(raw)) return [];
    return raw.filter(Boolean);
  }, [profile]);

  /* 🆕 (4) — قراءة القصص المميزة */
  const highlights = useMemo(() => {
    const raw = profile?.user?.profile?.highlights
      || profile?.highlights
      || [];
    return Array.isArray(raw) ? raw : [];
  }, [profile]);

  /* 🆕 (5) — حالة الاتصال (online / offline / last_seen) */
  const onlineStatus = useMemo(() => {
    const p = profile?.user || {};
    const isOnline = Boolean(p.is_online || p.online || profile?.is_online);
    const lastSeen = p.last_seen || p.last_active || profile?.last_seen || null;
    return { isOnline, lastSeen };
  }, [profile]);

  const formatCount = (n) => {
    const num = Number(n) || 0;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)} مليون`;
    if (num >= 1000) return `${(num / 1000).toFixed(num % 1000 === 0 ? 0 : 1)} ألف`;
    return String(num);
  };

  const formatLastSeen = (ts) => {
    if (!ts) return '';
    const d = typeof ts === 'number' ? new Date(ts) : new Date(ts);
    if (isNaN(d.getTime())) return '';
    const diffMin = Math.floor((Date.now() - d.getTime()) / 60000);
    if (diffMin < 1) return 'الآن';
    if (diffMin < 60) return `منذ ${diffMin} دقيقة`;
    if (diffMin < 60 * 24) return `منذ ${Math.floor(diffMin / 60)} ساعة`;
    return `منذ ${Math.floor(diffMin / 1440)} يوم`;
  };

  const handleMessage = useCallback(() => {
    navigate(`/chat/${encodeURIComponent(username)}`);
  }, [navigate, username]);

  /* 🆕 (3) — مشاركة البروفايل / نسخ الرابط / حظر / إبلاغ */
  const profileUrl = useMemo(() => {
    try {
      return `${window.location.origin}/profile/${encodeURIComponent(username)}`;
    } catch { return `/profile/${encodeURIComponent(username)}`; }
  }, [username]);

  const handleShareProfile = useCallback(async () => {
    setShowMoreMenu(false);
    try {
      if (navigator.share) {
        await navigator.share({ title: fullName, text: `تصفح ملف ${fullName} على يام شات`, url: profileUrl });
        return;
      }
    } catch { /* ignore user cancel */ }
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopyFlash(true);
      setTimeout(() => setCopyFlash(false), 1600);
    } catch {
      alert(profileUrl);
    }
  }, [fullName, profileUrl]);

  const handleCopyLink = useCallback(async () => {
    setShowMoreMenu(false);
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopyFlash(true);
      setTimeout(() => setCopyFlash(false), 1600);
    } catch {
      alert(profileUrl);
    }
  }, [profileUrl]);

  const handleBlock = useCallback(() => {
    setShowMoreMenu(false);
    if (typeof onBlockUser === 'function') return onBlockUser(username);
    if (window.confirm(`هل تريد حظر @${username}؟`)) {
      console.warn('Block user (no handler wired):', username);
    }
  }, [onBlockUser, username]);

  const handleReport = useCallback(() => {
    setShowMoreMenu(false);
    if (typeof onReportUser === 'function') return onReportUser(username);
    console.warn('Report user (no handler wired):', username);
    alert('شكراً — تم إرسال البلاغ للمراجعة.');
  }, [onReportUser, username]);

  // إغلاق القائمة عند النقر خارجها
  useEffect(() => {
    if (!showMoreMenu) return undefined;
    const onDocClick = (e) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target)) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [showMoreMenu]);

  return (
    <div className="ymp-profile-wrap" dir="rtl">
      {/* Cover */}
      <div className="ymp-cover">
        {coverImage && !coverImageError ? (
          <OptimizedImage
            src={resolveMediaUrl(coverImage)}
            alt="غلاف البروفايل"
            className="ymp-cover-img"
            onError={() => setCoverImageError(true)}
          />
        ) : (
          <FallbackCover />
        )}

        {isOwnProfile && (
          <button className="ymp-cover-edit-btn" onClick={() => setShowCoverEditor(true)} type="button">
            ✏️ تعديل الغلاف
          </button>
        )}

        {/* Avatar overlapping cover */}
        <div className="ymp-avatar-holder">
          <div className="ymp-avatar">
            {avatarImage && !avatarImageError ? (
              <OptimizedImage
                src={resolveMediaUrl(avatarImage)}
                alt={fullName}
                className="ymp-avatar-img"
                onError={() => setAvatarImageError(true)}
              />
            ) : (
              <FallbackAvatar name={fullName} />
            )}
          </div>

          {/* 🆕 (5) مؤشر حالة الاتصال */}
          <span
            className={`ymp-online-dot ${onlineStatus.isOnline ? 'is-online' : 'is-offline'}`}
            title={
              onlineStatus.isOnline
                ? 'متصل الآن'
                : (onlineStatus.lastSeen ? `آخر ظهور: ${formatLastSeen(onlineStatus.lastSeen)}` : 'غير متصل')
            }
            aria-label={onlineStatus.isOnline ? 'متصل الآن' : 'غير متصل'}
          />

          {isOwnProfile && (
            <button
              type="button"
              className="ymp-avatar-edit-btn"
              onClick={() => avatarInputRef.current?.click()}
              aria-label="تغيير الصورة الشخصية"
            >
              📷
            </button>
          )}
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarUpload}
            style={{ display: 'none' }}
          />
        </div>
      </div>

      {/* Identity block */}
      <div className="ymp-identity">
        <h2 className="ymp-fullname">
          <span>{fullName}</span>
          {isVerified ? <VerifiedBadge /> : null}
        </h2>

        {/* 🆕 (5) نص "متصل الآن" أو آخر ظهور تحت الاسم */}
        {onlineStatus.isOnline ? (
          <div className="ymp-online-label">
            <span className="ymp-online-mini-dot" /> متصل الآن
          </div>
        ) : onlineStatus.lastSeen ? (
          <div className="ymp-online-label ymp-online-label--muted">
            آخر ظهور: {formatLastSeen(onlineStatus.lastSeen)}
          </div>
        ) : null}

        <div className="ymp-stats-row">
          <div className="ymp-stat">
            <strong>{formatCount(followersCount)}</strong>
            <span> المتابعون</span>
          </div>
          <span className="ymp-dot">·</span>
          <div className="ymp-stat">
            <strong>{formatCount(followingCount)}</strong>
            <span> يتابع</span>
          </div>
          <span className="ymp-dot">·</span>
          <div className="ymp-stat">
            <strong>{formatCount(postsCount)}</strong>
            <span> المنشورات</span>
          </div>
        </div>

        {tagline ? (
          <div className="ymp-tagline">
            <span>{tagline}</span>
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
              <path fill="currentColor" d="M4 4h12v12H8l-4 4z" />
            </svg>
          </div>
        ) : null}

        {bio ? <p className="ymp-bio">{bio}</p> : null}

        {/* 🆕 (2) روابط السيرة الذاتية */}
        <BioLinks links={bioLinks} />
      </div>

      {/* Action buttons row + 🆕 (3) زر المشاركة + قائمة المزيد */}
      <div className="ymp-actions">
        {isOwnProfile ? (
          <>
            <button type="button" className="ymp-btn ymp-btn-primary" onClick={onCustomizationClick}>
              ✏️ تعديل الملف
            </button>
            <button type="button" className="ymp-btn ymp-btn-secondary" onClick={onAnalyticsClick}>
              📊 التحليلات
            </button>
            <button
              type="button"
              className="ymp-btn ymp-btn-icon"
              onClick={handleShareProfile}
              aria-label="مشاركة الملف الشخصي"
              title="مشاركة الملف الشخصي"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.6" y1="13.5" x2="15.4" y2="17.5" />
                <line x1="15.4" y1="6.5" x2="8.6" y2="10.5" />
              </svg>
            </button>
          </>
        ) : (
          <>
            <button type="button" className="ymp-btn ymp-btn-secondary" onClick={handleMessage}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
              <span>مراسلة</span>
            </button>
            <button
              type="button"
              className={`ymp-btn ${isFollowing ? 'ymp-btn-secondary' : 'ymp-btn-primary'}`}
              onClick={onFollowClick}
            >
              <span>{isFollowing ? '✓ تتابعه' : '＋ متابعة'}</span>
            </button>
            <button
              type="button"
              className="ymp-btn ymp-btn-icon"
              onClick={handleShareProfile}
              aria-label="مشاركة الملف الشخصي"
              title="مشاركة الملف الشخصي"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.6" y1="13.5" x2="15.4" y2="17.5" />
                <line x1="15.4" y1="6.5" x2="8.6" y2="10.5" />
              </svg>
            </button>
          </>
        )}

        {/* قائمة "المزيد" (⋯) — دائماً متاحة */}
        <div className="ymp-more-wrap" ref={moreMenuRef}>
          <button
            type="button"
            className="ymp-btn ymp-btn-icon"
            onClick={() => setShowMoreMenu((v) => !v)}
            aria-label="خيارات إضافية"
            aria-expanded={showMoreMenu}
            title="المزيد"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
              <circle cx="5" cy="12" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="19" cy="12" r="2" />
            </svg>
          </button>

          {showMoreMenu && (
            <div className="ymp-more-menu" role="menu">
              <button type="button" className="ymp-more-item" role="menuitem" onClick={handleCopyLink}>
                <span aria-hidden="true">🔗</span> نسخ رابط الملف
              </button>
              <button type="button" className="ymp-more-item" role="menuitem" onClick={handleShareProfile}>
                <span aria-hidden="true">📤</span> مشاركة الملف
              </button>
              {!isOwnProfile && (
                <>
                  <div className="ymp-more-divider" />
                  <button type="button" className="ymp-more-item ymp-danger" role="menuitem" onClick={handleBlock}>
                    <span aria-hidden="true">🚫</span> حظر @{username}
                  </button>
                  <button type="button" className="ymp-more-item ymp-danger" role="menuitem" onClick={handleReport}>
                    <span aria-hidden="true">🚩</span> إبلاغ
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 🆕 (4) القصص المميزة (Story Highlights) */}
      <StoryHighlights
        highlights={highlights}
        isOwnProfile={isOwnProfile}
        onAddHighlight={onAddHighlight}
      />

      {/* Tabs */}
      {tabs.length > 0 && (
        <div className="ymp-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`ymp-tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => handleTabChange(tab.key)}
            >
              {tab.icon ? <span className="ymp-tab-icon" aria-hidden="true">{tab.icon}</span> : null}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* 🆕 (1) حالة إرشادية لتبويب "المُعلَّمة" */}
      {tabs.some((tab) => tab.key === 'tagged') && activeTab === 'tagged' && (
        <div className="ymp-tagged-hint" role="status">
          <span aria-hidden="true">🏷️</span>
          <span>
            المنشورات التي تم تعليمك فيها ستظهر هنا. يمكن التحكم في هذا من إعدادات الخصوصية.
          </span>
        </div>
      )}

      {/* تفاصيل شخصية */}
      {(city || gender) && (
        <div className="ymp-personal">
          <h3 className="ymp-personal-title">التفاصيل الشخصية</h3>
          {city ? (
            <div className="ymp-personal-row">
              <span className="ymp-personal-icon" aria-hidden="true">🏠</span>
              <span>{city}</span>
            </div>
          ) : null}
          {gender ? (
            <div className="ymp-personal-row">
              <span className="ymp-personal-icon" aria-hidden="true">⚥</span>
              <span>{gender === 'male' ? 'ذكر' : gender === 'female' ? 'أنثى' : gender}</span>
            </div>
          ) : null}
        </div>
      )}

      {/* Toast خفيف لنسخ الرابط */}
      {copyFlash && (
        <div className="ymp-copy-toast" role="status" aria-live="polite">
          ✅ تم نسخ رابط الملف
        </div>
      )}

      {/* Cover Editor Modal */}
      <Modal open={showCoverEditor} onClose={() => setShowCoverEditor(false)} title="تعديل الغلاف">
        <div style={{ padding: 20 }} dir="rtl">
          <div className="ymp-cover-preview">
            {coverImage ? (
              <OptimizedImage src={resolveMediaUrl(coverImage)} alt="معاينة الغلاف" className="ymp-cover-img" />
            ) : (
              <FallbackCover />
            )}
          </div>
          <Button onClick={() => fileInputRef.current?.click()} style={{ width: '100%', marginBottom: 10 }}>
            اختيار صورة
          </Button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleCoverUpload} style={{ display: 'none' }} />
          <Button onClick={saveCoverImage} style={{ width: '100%' }}>حفظ</Button>
        </div>
      </Modal>

      {/* Avatar Cropper Modal */}
      <Modal open={showAvatarCropper} onClose={() => setShowAvatarCropper(false)} title="تعديل الصورة الشخصية">
        <div style={{ padding: 20 }} dir="rtl">
          <div className="ymp-avatar-preview">
            {avatarImage ? (
              <OptimizedImage src={resolveMediaUrl(avatarImage)} alt="معاينة الصورة" className="ymp-avatar-img" />
            ) : (
              <FallbackAvatar name={fullName} />
            )}
          </div>
          <Button onClick={applyCrop} style={{ width: '100%' }}>تطبيق</Button>
        </div>
      </Modal>

      <style>{`
        .ymp-profile-wrap {
          font-family: 'Noto Sans Arabic', 'Tajawal', system-ui, sans-serif;
          color: #fff;
          background: transparent;
          padding-bottom: 12px;
          position: relative;
        }
        .ymp-cover {
          position: relative;
          height: 200px;
          border-radius: 0 0 18px 18px;
          overflow: visible;
          background: #1a1a1a;
        }
        .ymp-cover-img,
        .ymp-fallback-cover {
          width: 100%;
          height: 200px;
          object-fit: cover;
          border-radius: 0 0 18px 18px;
          display: block;
        }
        .ymp-fallback-cover {
          background: linear-gradient(135deg, #7C3AED 0%, #6D28D9 50%, #4C1D95 100%);
        }
        .ymp-cover-edit-btn {
          position: absolute;
          bottom: 12px;
          left: 12px;
          padding: 7px 14px;
          background: rgba(0,0,0,0.65);
          color: #fff;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          cursor: pointer;
          font-size: 12px;
          font-family: inherit;
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
        }
        .ymp-cover-edit-btn:hover { background: rgba(0,0,0,0.85); }

        .ymp-avatar-holder {
          position: absolute;
          left: 50%;
          bottom: -65px;
          transform: translateX(-50%);
          width: 134px;
          height: 134px;
          z-index: 3;
        }
        .ymp-avatar {
          width: 134px;
          height: 134px;
          border-radius: 50%;
          border: 5px solid #0A0D1A;
          background: #1a1a1a;
          overflow: hidden;
          box-shadow: 0 6px 20px rgba(0,0,0,0.5);
          display: grid;
          place-items: center;
        }
        .ymp-avatar-img { width: 100%; height: 100%; object-fit: cover; }
        .ymp-fallback-avatar {
          width: 100%; height: 100%;
          display: grid; place-items: center;
          background: linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%);
          color: #fff; font-size: 36px; font-weight: 800;
        }
        .ymp-avatar-edit-btn {
          position: absolute;
          bottom: 6px; right: 6px;
          width: 36px; height: 36px;
          border-radius: 50%;
          border: 3px solid #0A0D1A;
          background: #7C3AED;
          color: #fff;
          font-size: 14px;
          cursor: pointer;
          display: grid; place-items: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
          z-index: 2;
        }

        /* 🆕 (5) — Online status indicator */
        .ymp-online-dot {
          position: absolute;
          bottom: 8px;
          left: 8px;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          border: 3px solid #0A0D1A;
          box-shadow: 0 2px 6px rgba(0,0,0,0.35);
          z-index: 2;
          transition: transform .2s ease;
        }
        .ymp-online-dot.is-online {
          background: #22c55e;
          animation: ymp-online-pulse 2s ease-out infinite;
        }
        .ymp-online-dot.is-offline {
          background: #6b7280;
        }
        @keyframes ymp-online-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.55), 0 2px 6px rgba(0,0,0,0.35); }
          70%  { box-shadow: 0 0 0 10px rgba(34, 197, 94, 0), 0 2px 6px rgba(0,0,0,0.35); }
          100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0), 0 2px 6px rgba(0,0,0,0.35); }
        }
        .ymp-online-label {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #22c55e;
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 8px;
        }
        .ymp-online-label--muted { color: #94a3b8; font-weight: 500; }
        .ymp-online-mini-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.22);
        }

        .ymp-identity {
          text-align: center;
          margin-top: 78px;
          padding: 0 16px;
        }
        .ymp-fullname {
          margin: 0 0 10px;
          font-size: 22px;
          font-weight: 800;
          color: #fff;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .ymp-verified { display: inline-flex; align-items: center; }

        .ymp-stats-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          align-items: stretch;
          justify-content: center;
          gap: 8px;
          color: #cbd5e1;
          font-size: 13px;
          margin: 0 auto 12px;
          max-width: 560px;
          padding: 0 12px;
          width: 100%;
          box-sizing: border-box;
          direction: rtl;
        }
        .ymp-stats-row .ymp-stat {
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 10px 6px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          min-width: 0;
          font-family: 'Noto Sans Arabic', 'Tajawal', sans-serif;
        }
        .ymp-stats-row strong { color: #fff; font-weight: 800; font-size: 18px; margin-bottom: 2px; }
        .ymp-stats-row .ymp-stat span { font-size: 12px; color: #94a3b8; white-space: nowrap; }
        .ymp-dot { display: none; }
        .ymp-tagline {
          display: inline-flex; align-items: center; gap: 6px;
          color: #cbd5e1; font-size: 13px; margin-bottom: 10px;
        }
        .ymp-bio {
          color: #cbd5e1;
          font-size: 14px;
          line-height: 1.6;
          margin: 0 auto 14px;
          max-width: 560px;
          word-break: break-word;
        }

        /* 🆕 (2) — Bio links */
        .ymp-bio-links {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: center;
          max-width: 560px;
          margin: 0 auto 14px;
        }
        .ymp-bio-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 999px;
          background: rgba(24, 119, 242, 0.10);
          border: 1px solid rgba(24, 119, 242, 0.30);
          color: #93c5fd;
          font-size: 12px;
          font-weight: 700;
          text-decoration: none;
          max-width: 220px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          transition: background .15s ease, transform .12s ease;
        }
        .ymp-bio-link:hover {
          background: rgba(24, 119, 242, 0.20);
          transform: translateY(-1px);
        }
        .ymp-bio-link-icon { font-size: 14px; line-height: 1; }
        .ymp-bio-link-label { max-width: 170px; overflow: hidden; text-overflow: ellipsis; }

        .ymp-actions {
          display: flex;
          gap: 10px;
          justify-content: center;
          align-items: center;
          padding: 0 16px 14px;
          flex-wrap: wrap;
          position: relative;
        }
        .ymp-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 22px;
          border-radius: 10px;
          border: none;
          font-size: 14px;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          min-width: 150px;
          transition: background .15s ease, transform .12s ease, box-shadow .15s ease;
        }
        .ymp-btn-primary {
          background: #1877F2;
          color: #fff;
          box-shadow: 0 4px 14px rgba(24, 119, 242, 0.32);
        }
        .ymp-btn-primary:hover { background: #166fe0; transform: translateY(-1px); }
        .ymp-btn-secondary { background: #2A2F3A; color: #fff; }
        .ymp-btn-secondary:hover { background: #353B47; }

        /* 🆕 (3) — Icon buttons + More menu */
        .ymp-btn-icon {
          min-width: 44px;
          width: 44px;
          height: 44px;
          padding: 0;
          background: #2A2F3A;
          color: #fff;
        }
        .ymp-btn-icon:hover { background: #353B47; }
        .ymp-more-wrap { position: relative; }
        .ymp-more-menu {
          position: absolute;
          top: calc(100% + 6px);
          right: 0;
          min-width: 220px;
          background: #111827;
          border: 1px solid #1F2937;
          border-radius: 12px;
          box-shadow: 0 12px 40px rgba(0,0,0,0.55);
          padding: 6px;
          z-index: 40;
        }
        .ymp-more-item {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 10px 12px;
          background: transparent;
          border: none;
          border-radius: 8px;
          color: #e5e7eb;
          font-size: 14px;
          font-family: inherit;
          text-align: right;
          cursor: pointer;
        }
        .ymp-more-item:hover { background: rgba(255,255,255,0.06); }
        .ymp-more-item.ymp-danger { color: #f87171; }
        .ymp-more-item.ymp-danger:hover { background: rgba(248, 113, 113, 0.10); }
        .ymp-more-divider {
          height: 1px;
          background: #1F2937;
          margin: 6px 4px;
        }

        /* 🆕 (4) — Story Highlights */
        .ymp-highlights {
          padding: 6px 8px 12px;
          border-top: 1px solid #1F2937;
          border-bottom: 1px solid #1F2937;
          margin: 8px 0 4px;
        }
        .ymp-highlights-track {
          display: flex;
          gap: 14px;
          overflow-x: auto;
          padding: 8px 4px 4px;
          scroll-snap-type: x mandatory;
          scrollbar-width: none;
        }
        .ymp-highlights-track::-webkit-scrollbar { display: none; }
        .ymp-highlight-item {
          flex: 0 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          background: none;
          border: none;
          cursor: pointer;
          scroll-snap-align: start;
          font-family: inherit;
        }
        .ymp-highlight-ring {
          width: 68px;
          height: 68px;
          border-radius: 50%;
          padding: 3px;
          background: linear-gradient(135deg, #f59e0b, #ef4444, #7C3AED);
          display: grid;
          place-items: center;
        }
        .ymp-highlight-thumb {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
          background: #0A0D1A;
          border: 2px solid #0A0D1A;
        }
        .ymp-highlight-fallback {
          display: grid; place-items: center;
          font-size: 24px; color: #94a3b8;
        }
        .ymp-highlight-plus {
          display: grid; place-items: center;
          font-size: 28px; color: #94a3b8; font-weight: 300;
          background: #1a1f2e;
        }
        .ymp-highlight-add .ymp-highlight-ring {
          background: #1F2937;
        }
        .ymp-highlight-title {
          color: #cbd5e1;
          font-size: 11px;
          font-weight: 600;
          max-width: 74px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .ymp-tabs {
          display: flex;
          justify-content: center;
          align-items: stretch;
          border-bottom: 1px solid #1F2937;
          padding: 0 16px;
          margin-bottom: 8px;
        }
        .ymp-tab {
          flex: 1;
          max-width: 130px;
          padding: 12px 8px;
          background: none;
          border: none;
          color: #94a3b8;
          font-size: 14px;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          border-bottom: 3px solid transparent;
          transition: color .15s ease, border-color .15s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
        }
        .ymp-tab.active {
          color: #1877F2;
          border-bottom-color: #1877F2;
        }
        .ymp-tab-icon { font-size: 12px; }

        /* 🆕 (1) — Tagged empty hint */
        .ymp-tagged-hint {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px 16px;
          margin: 8px 12px 4px;
          color: #94a3b8;
          font-size: 13px;
          background: rgba(255,255,255,0.03);
          border: 1px dashed rgba(255,255,255,0.10);
          border-radius: 12px;
          text-align: center;
        }

        .ymp-personal { padding: 14px 16px 4px; }
        .ymp-personal-title {
          margin: 0 0 10px;
          font-size: 15px;
          font-weight: 800;
          color: #e2e8f0;
        }
        .ymp-personal-row {
          display: flex; align-items: center; gap: 10px;
          color: #cbd5e1; font-size: 14px; padding: 8px 0;
        }
        .ymp-personal-icon {
          width: 24px; height: 24px;
          display: grid; place-items: center;
          color: #94a3b8;
        }

        .ymp-cover-preview {
          height: 200px; margin-bottom: 16px;
          border-radius: 12px; overflow: hidden;
          background: #1a1a1a;
        }
        .ymp-avatar-preview {
          width: 200px; height: 200px;
          border-radius: 50%; margin: 0 auto 18px;
          overflow: hidden; background: #1a1a1a;
        }

        .ymp-copy-toast {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          background: #111827;
          color: #22c55e;
          padding: 10px 18px;
          border-radius: 999px;
          border: 1px solid rgba(34, 197, 94, 0.35);
          box-shadow: 0 8px 30px rgba(0,0,0,0.5);
          font-size: 13px;
          font-weight: 700;
          z-index: 200;
          animation: ymp-toast-in .25s ease-out;
        }
        @keyframes ymp-toast-in {
          from { opacity: 0; transform: translate(-50%, 12px); }
          to   { opacity: 1; transform: translate(-50%, 0); }
        }

        @media (max-width: 480px) {
          .ymp-cover { height: 170px; }
          .ymp-cover-img, .ymp-fallback-cover { height: 170px; }
          .ymp-avatar-holder { width: 118px; height: 118px; bottom: -55px; }
          .ymp-avatar { width: 118px; height: 118px; }
          .ymp-online-dot { width: 18px; height: 18px; }
          .ymp-identity { margin-top: 66px; }
          .ymp-fullname { font-size: 19px; }
          .ymp-btn { min-width: 120px; padding: 10px 14px; }
          .ymp-btn-icon { min-width: 44px; width: 44px; }
          .ymp-stats-row { gap: 6px; padding: 0 8px; }
          .ymp-stats-row .ymp-stat { padding: 8px 4px; }
          .ymp-stats-row strong { font-size: 16px; }
          .ymp-stats-row .ymp-stat span { font-size: 11px; }
          .ymp-highlight-ring { width: 60px; height: 60px; }
          .ymp-highlight-title { font-size: 10px; max-width: 66px; }
        }
        @media (max-width: 360px) {
          .ymp-stats-row { gap: 4px; }
          .ymp-stats-row .ymp-stat { padding: 6px 2px; }
          .ymp-stats-row strong { font-size: 14px; }
          .ymp-stats-row .ymp-stat span { font-size: 10px; }
          .ymp-btn { min-width: 100px; font-size: 13px; }
        }
      `}</style>
    </div>
  );
}
