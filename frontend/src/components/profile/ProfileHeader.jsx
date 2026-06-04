import React, { useState, useRef, useCallback, useMemo } from 'react';
import Button from '../ui/Button.jsx';
import Modal from '../ui/Modal.jsx';
import OptimizedImage from '../ui/OptimizedImage.jsx';
import { updateMyProfile } from '../../api/users.js';
import { resolveMediaUrl } from '../../config/mediaConfig.js';

// Memoized Tab Component to prevent unnecessary rerenders
const ProfileTab = React.memo(({ label, active, onClick }) => {
  console.log(`Rendering Tab: ${label}`);
  return (
    <button
      onClick={onClick}
      style={{
        padding: '10px 20px',
        background: 'none',
        border: 'none',
        borderBottom: active ? '2px solid var(--primary)' : '2px solid transparent',
        color: active ? 'var(--primary)' : '#888',
        cursor: 'pointer',
        fontWeight: active ? 'bold' : 'normal',
        transition: '0.2s'
      }}
    >
      {label}
    </button>
  );
});

// Fallback Avatar Component
const FallbackAvatar = ({ name = 'User' }) => {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
        color: 'white',
        fontSize: '24px',
        fontWeight: 'bold',
        borderRadius: '50%'
      }}
    >
      {initials}
    </div>
  );
};

// Fallback Cover Component
const FallbackCover = () => {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 50%, #4C1D95 100%)',
        borderRadius: '12px'
      }}
    />
  );
};

export default function ProfileHeader({
  profile,
  isOwnProfile,
  onAnalyticsClick,
  onCustomizationClick,
  onFollowClick,
}) {
  const [showCoverEditor, setShowCoverEditor] = useState(false);
  const [showAvatarCropper, setShowAvatarCropper] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');
  
  const [coverImage, setCoverImage] = useState(profile?.user?.profile?.cover_photo || '');
  const [avatarImage, setAvatarImage] = useState(profile?.user?.avatar || '');
  const [coverImageError, setCoverImageError] = useState(false);
  const [avatarImageError, setAvatarImageError] = useState(false);
  
  const fileInputRef = useRef(null);
  const avatarInputRef = useRef(null);

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
  }, []);

  const handleCoverUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // التحقق من نوع الملف
      if (!file.type.startsWith('image/')) {
        alert('الرجاء اختيار صورة');
        return;
      }

      // التحقق من حجم الملف (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert('حجم الصورة كبير جداً (الحد الأقصى 5MB)');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        setCoverImage(event.target?.result);
        setCoverImageError(false);
      };
      reader.onerror = () => {
        alert('حدث خطأ في قراءة الملف');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // التحقق من نوع الملف
      if (!file.type.startsWith('image/')) {
        alert('الرجاء اختيار صورة');
        return;
      }

      // التحقق من حجم الملف (2MB max)
      if (file.size > 2 * 1024 * 1024) {
        alert('حجم الصورة كبير جداً (الحد الأقصى 2MB)');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatarImage(event.target?.result);
        setAvatarImageError(false);
        setShowAvatarCropper(true);
      };
      reader.onerror = () => {
        alert('حدث خطأ في قراءة الملف');
      };
      reader.readAsDataURL(file);
    }
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
    { key: 'posts', label: 'المنشورات' },
    { key: 'media', label: 'الوسائط' },
    { key: 'likes', label: 'الإعجابات' }
  ], []);

  const username = profile?.user?.username || 'مستخدم';
  const postsCount = profile?.posts_count || 0;
  const followersCount = profile?.followers_count || 0;
  const followingCount = profile?.following_count || 0;
  const bio = profile?.user?.profile?.bio || 'لا يوجد نبذة شخصية';
  const isVerified = profile?.user?.is_verified || false;

  return (
    <>
      {/* Cover Image with Optimization and Fallback */}
      <div
        style={{
          position: 'relative',
          height: 200,
          marginBottom: 30,
          borderRadius: 12,
          overflow: 'hidden',
          backgroundColor: '#1a1a1a'
        }}
      >
        {coverImage && !coverImageError ? (
          <OptimizedImage
            src={resolveMediaUrl(coverImage)}
            alt="غلاف البروفايل"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
            onError={() => setCoverImageError(true)}
          />
        ) : (
          <FallbackCover />
        )}

        {isOwnProfile && (
          <button
            onClick={() => setShowCoverEditor(true)}
            style={{
              position: 'absolute',
              bottom: 10,
              right: 10,
              padding: '8px 16px',
              background: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 12,
              zIndex: 2,
              transition: 'background 0.2s',
              backdropFilter: 'blur(4px)'
            }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(0, 0, 0, 0.9)'}
            onMouseLeave={(e) => e.target.style.background = 'rgba(0, 0, 0, 0.7)'}
          >
            ✏️ تعديل الغلاف
          </button>
        )}
      </div>

      {/* Profile Info */}
      <div
        style={{
          display: 'flex',
          gap: 30,
          alignItems: 'flex-start',
          marginBottom: 30,
          flexWrap: 'wrap'
        }}
      >
        {/* Avatar */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              overflow: 'hidden',
              border: '4px solid var(--bg)',
              backgroundColor: '#1a1a1a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {avatarImage && !avatarImageError ? (
              <OptimizedImage
                src={resolveMediaUrl(avatarImage)}
                alt={username}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
                onError={() => setAvatarImageError(true)}
              />
            ) : (
              <FallbackAvatar name={username} />
            )}
          </div>

          {isOwnProfile && (
            <button
              onClick={() => avatarInputRef.current?.click()}
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'var(--primary)',
                border: '2px solid var(--bg)',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                zIndex: 2,
                transition: 'transform 0.2s',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
              }}
              onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
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

        {/* User Info */}
        <div style={{ flex: 1, minWidth: 200 }}>
          <h2
            style={{
              margin: '0 0 15px 0',
              fontSize: 24,
              fontWeight: 'bold',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            {username}
            {isVerified && (
              <span
                style={{
                  color: '#3b82f6',
                  fontSize: 20,
                  title: 'حساب موثّق'
                }}
              >
                ✓
              </span>
            )}
          </h2>

          {/* Stats */}
          <div
            style={{
              display: 'flex',
              gap: 30,
              marginBottom: 15,
              fontSize: 14,
              color: 'white',
              flexWrap: 'wrap'
            }}
          >
            <div>
              <strong style={{ fontSize: 16 }}>{postsCount}</strong>
              <span style={{ color: '#888', marginLeft: 8 }}>منشور</span>
            </div>
            <div>
              <strong style={{ fontSize: 16 }}>{followersCount}</strong>
              <span style={{ color: '#888', marginLeft: 8 }}>متابع</span>
            </div>
            <div>
              <strong style={{ fontSize: 16 }}>{followingCount}</strong>
              <span style={{ color: '#888', marginLeft: 8 }}>يتابع</span>
            </div>
          </div>

          {/* Bio */}
          <p
            style={{
              margin: '0 0 15px 0',
              color: '#ccc',
              fontSize: 14,
              lineHeight: 1.5,
              wordBreak: 'break-word'
            }}
          >
            {bio}
          </p>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {isOwnProfile ? (
              <Button
                variant="secondary"
                size="small"
                onClick={onCustomizationClick}
              >
                ⚙️ الإعدادات
              </Button>
            ) : (
              <Button size="small" onClick={onFollowClick}>
                متابعة
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid #222',
          marginBottom: 20,
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {tabs.map(tab => (
          <ProfileTab
            key={tab.key}
            label={tab.label}
            active={activeTab === tab.key}
            onClick={() => handleTabChange(tab.key)}
          />
        ))}
      </div>

      {/* Cover Editor Modal */}
      <Modal
        open={showCoverEditor}
        onClose={() => setShowCoverEditor(false)}
        title="تعديل الغلاف"
      >
        <div style={{ padding: 20 }}>
          <div
            style={{
              height: 200,
              marginBottom: 20,
              borderRadius: 8,
              overflow: 'hidden',
              backgroundColor: '#1a1a1a'
            }}
          >
            {coverImage ? (
              <OptimizedImage
                src={resolveMediaUrl(coverImage)}
                alt="معاينة الغلاف"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            ) : (
              <FallbackCover />
            )}
          </div>
          <Button
            onClick={() => fileInputRef.current?.click()}
            style={{ width: '100%', marginBottom: 10 }}
          >
            اختيار صورة
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleCoverUpload}
            style={{ display: 'none' }}
          />
          <Button
            onClick={saveCoverImage}
            style={{ width: '100%' }}
          >
            حفظ
          </Button>
        </div>
      </Modal>

      {/* Avatar Cropper Modal */}
      <Modal
        open={showAvatarCropper}
        onClose={() => setShowAvatarCropper(false)}
        title="تعديل الصورة الشخصية"
      >
        <div style={{ padding: 20 }}>
          <div
            style={{
              width: 200,
              height: 200,
              borderRadius: '50%',
              overflow: 'hidden',
              margin: '0 auto 20px',
              backgroundColor: '#1a1a1a'
            }}
          >
            {avatarImage ? (
              <OptimizedImage
                src={resolveMediaUrl(avatarImage)}
                alt="معاينة الصورة الشخصية"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            ) : (
              <FallbackAvatar name={username} />
            )}
          </div>
          <Button onClick={applyCrop} style={{ width: '100%' }}>
            تطبيق
          </Button>
        </div>
      </Modal>
    </>
  );
}
