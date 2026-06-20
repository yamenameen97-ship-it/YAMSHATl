import React, { useState, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../ui/Button.jsx';
import Modal from '../ui/Modal.jsx';
import OptimizedImage from '../ui/OptimizedImage.jsx';
import { updateMyProfile } from '../../api/users.js';
import { resolveMediaUrl } from '../../config/mediaConfig.js';

/**
 * ProfileHeader (v31) — صفحة بروفايل موحّدة بنفس ستايل المشروع
 * - تطابق تصميم الصورة المرجعية (غلاف + أفاتار + اسم + شارة توثيق + إحصائيات + أزرار)
 * - أزرار «متابعة» + «مراسلة» تظهر للزائر بنفس ترتيب الصورة
 * - تبويبات: الكل / ريلز / الصور
 * - معلومات شخصية أسفل التبويبات (الموقع، الجنس...)
 * - dir="rtl" وخط Noto Sans Arabic / Tajawal ليطابق الستايل العام
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

export default function ProfileHeader({
  profile,
  isOwnProfile,
  onAnalyticsClick,
  onCustomizationClick,
  onFollowClick,
  activeTab: externalActiveTab,
  onTabChange,
}) {
  const navigate = useNavigate();
  const [showCoverEditor, setShowCoverEditor] = useState(false);
  const [showAvatarCropper, setShowAvatarCropper] = useState(false);
  const [internalTab, setInternalTab] = useState('all');
  const activeTab = externalActiveTab || internalTab;

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

  const tabs = useMemo(() => [
    { key: 'all', label: 'الكل' },
    { key: 'reels', label: 'ريلز' },
    { key: 'photos', label: 'الصور' },
  ], []);

  // ✅ FIX v45 (الاسم لا يُحفظ): قراءة full_name من جميع المصادر المحتملة + النسخة المحلية الاحتياطية
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

  const formatCount = (n) => {
    const num = Number(n) || 0;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)} مليون`;
    if (num >= 1000) return `${(num / 1000).toFixed(num % 1000 === 0 ? 0 : 1)} ألف`;
    return String(num);
  };

  const handleMessage = useCallback(() => {
    navigate(`/chat/${encodeURIComponent(username)}`);
  }, [navigate, username]);

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

      {/* Identity block (name, badge, stats) */}
      <div className="ymp-identity">
        <h2 className="ymp-fullname">
          <span>{fullName}</span>
          {isVerified ? <VerifiedBadge /> : null}
        </h2>

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
      </div>

      {/* Action buttons row (مراسلة + متابعة) — مطابقة للصورة المرجعية */}
      <div className="ymp-actions">
        {isOwnProfile ? (
          <>
            <button type="button" className="ymp-btn ymp-btn-primary" onClick={onCustomizationClick}>
              ✏️ تعديل الملف
            </button>
            <button type="button" className="ymp-btn ymp-btn-secondary" onClick={onAnalyticsClick}>
              📊 التحليلات
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
          </>
        )}
      </div>

      {/* Tabs (الكل / ريلز / الصور) */}
      <div className="ymp-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`ymp-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => handleTabChange(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* تفاصيل شخصية (الموقع، الجنس) — مطابق للصورة */}
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
        .ymp-avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .ymp-fallback-avatar {
          width: 100%;
          height: 100%;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%);
          color: #fff;
          font-size: 36px;
          font-weight: 800;
        }
        .ymp-avatar-edit-btn {
          position: absolute;
          bottom: 6px;
          right: 6px;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 3px solid #0A0D1A;
          background: #7C3AED;
          color: #fff;
          font-size: 14px;
          cursor: pointer;
          display: grid;
          place-items: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
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
        .ymp-verified {
          display: inline-flex;
          align-items: center;
        }
        /* v46: تقسيم الإحصائيات في صف واحد بدل التمدد */
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
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
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
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #cbd5e1;
          font-size: 13px;
          margin-bottom: 10px;
        }
        .ymp-bio {
          color: #cbd5e1;
          font-size: 14px;
          line-height: 1.6;
          margin: 0 auto 14px;
          max-width: 560px;
          word-break: break-word;
        }

        .ymp-actions {
          display: flex;
          gap: 10px;
          justify-content: center;
          padding: 0 16px 14px;
          flex-wrap: wrap;
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
        .ymp-btn-secondary {
          background: #2A2F3A;
          color: #fff;
        }
        .ymp-btn-secondary:hover { background: #353B47; }

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
        }
        .ymp-tab.active {
          color: #1877F2;
          border-bottom-color: #1877F2;
        }

        .ymp-personal {
          padding: 14px 16px 4px;
        }
        .ymp-personal-title {
          margin: 0 0 10px;
          font-size: 15px;
          font-weight: 800;
          color: #e2e8f0;
        }
        .ymp-personal-row {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #cbd5e1;
          font-size: 14px;
          padding: 8px 0;
        }
        .ymp-personal-icon {
          width: 24px;
          height: 24px;
          display: grid;
          place-items: center;
          color: #94a3b8;
        }

        .ymp-cover-preview {
          height: 200px;
          margin-bottom: 16px;
          border-radius: 12px;
          overflow: hidden;
          background: #1a1a1a;
        }
        .ymp-avatar-preview {
          width: 200px;
          height: 200px;
          border-radius: 50%;
          margin: 0 auto 18px;
          overflow: hidden;
          background: #1a1a1a;
        }

        @media (max-width: 480px) {
          .ymp-cover { height: 170px; }
          .ymp-cover-img, .ymp-fallback-cover { height: 170px; }
          .ymp-avatar-holder { width: 118px; height: 118px; bottom: -55px; }
          .ymp-avatar { width: 118px; height: 118px; }
          .ymp-identity { margin-top: 66px; }
          .ymp-fullname { font-size: 19px; }
          .ymp-btn { min-width: 130px; padding: 10px 16px; }
          .ymp-stats-row { gap: 6px; padding: 0 8px; }
          .ymp-stats-row .ymp-stat { padding: 8px 4px; }
          .ymp-stats-row strong { font-size: 16px; }
          .ymp-stats-row .ymp-stat span { font-size: 11px; }
        }
        @media (max-width: 360px) {
          .ymp-stats-row { gap: 4px; }
          .ymp-stats-row .ymp-stat { padding: 6px 2px; }
          .ymp-stats-row strong { font-size: 14px; }
          .ymp-stats-row .ymp-stat span { font-size: 10px; }
        }
      `}</style>
    </div>
  );
}
