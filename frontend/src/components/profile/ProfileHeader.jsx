import React, { useState, useRef, useCallback, useMemo } from 'react';
import Button from '../ui/Button.jsx';
import Modal from '../ui/Modal.jsx';
import OptimizedImage from '../ui/OptimizedImage.jsx';
import { updateMyProfile } from '../../api/users.js';

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
  
  const [coverImage, setCoverImage] = useState(profile?.user?.profile?.cover_url || '');
  const [avatarImage, setAvatarImage] = useState(profile?.user?.profile?.avatar_url || '');
  
  const fileInputRef = useRef(null);
  const avatarInputRef = useRef(null);

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
  }, []);

  const handleCoverUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setCoverImage(event.target?.result);
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatarImage(event.target?.result);
        setShowAvatarCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const applyCrop = async () => {
    try {
      await updateMyProfile({ avatar_url: avatarImage });
      setShowAvatarCropper(false);
    } catch (error) {
      console.error('Failed to update avatar:', error);
    }
  };

  const saveCoverImage = async () => {
    try {
      await updateMyProfile({ cover_url: coverImage });
      setShowCoverEditor(false);
    } catch (error) {
      console.error('Failed to update cover:', error);
    }
  };

  const tabs = useMemo(() => [
    { key: 'posts', label: 'المنشورات' },
    { key: 'media', label: 'الوسائط' },
    { key: 'likes', label: 'الإعجابات' }
  ], []);

  return (
    <>
      {/* Cover Image with Optimization */}
      <div style={{ position: 'relative', height: 200, marginBottom: 30 }}>
        <OptimizedImage 
          src={coverImage} 
          alt="Cover" 
          style={{ borderRadius: 12, height: '100%' }} 
        />
        {isOwnProfile && (
          <button
            onClick={() => setShowCoverEditor(true)}
            style={{
              position: 'absolute',
              bottom: 10,
              right: 10,
              padding: '8px 16px',
              background: 'rgba(0, 0, 0, 0.6)',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 12,
              zIndex: 2
            }}
          >
            ✏️ تعديل الغلاف
          </button>
        )}
      </div>

      {/* Profile Info */}
      <div style={{ display: 'flex', gap: 30, alignItems: 'flex-start', marginBottom: 30 }}>
        <div style={{ position: 'relative' }}>
          <div style={{ width: 120, height: 120, borderRadius: '50%', overflow: 'hidden', border: '4px solid var(--bg)' }}>
            <OptimizedImage src={avatarImage} alt="Avatar" />
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
                zIndex: 2
              }}
            >
              📷
            </button>
          )}
          <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
        </div>

        <div style={{ flex: 1 }}>
          <h2 style={{ margin: '0 0 15px 0', fontSize: 24, fontWeight: 'bold', color: 'white' }}>
            {profile?.user?.username}
            {profile?.user?.is_verified && <span style={{ color: '#3b82f6', marginLeft: 8 }}>✓</span>}
          </h2>

          <div style={{ display: 'flex', gap: 30, marginBottom: 15, fontSize: 14, color: 'white' }}>
            <div><strong>{profile?.posts_count || 0}</strong> <span style={{ color: '#888' }}>منشور</span></div>
            <div><strong>{profile?.followers_count || 0}</strong> <span style={{ color: '#888' }}>متابع</span></div>
            <div><strong>{profile?.following_count || 0}</strong> <span style={{ color: '#888' }}>يتابع</span></div>
          </div>

          <p style={{ margin: '0 0 15px 0', color: '#ccc', fontSize: 14 }}>
            {profile?.user?.profile?.bio || 'لا يوجد نبذة شخصية'}
          </p>

          <div style={{ display: 'flex', gap: 10 }}>
            {isOwnProfile ? (
              <Button variant="secondary" size="small" onClick={onCustomizationClick}>⚙️ الإعدادات</Button>
            ) : (
              <Button size="small" onClick={onFollowClick}>متابعة</Button>
            )}
          </div>
        </div>
      </div>

      {/* Optimized Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #222', marginBottom: 20 }}>
        {tabs.map(tab => (
          <ProfileTab 
            key={tab.key}
            label={tab.label}
            active={activeTab === tab.key}
            onClick={() => handleTabChange(tab.key)}
          />
        ))}
      </div>

      {/* Modals */}
      <Modal open={showCoverEditor} onClose={() => setShowCoverEditor(false)} title="تعديل الغلاف">
        <div style={{ padding: 20 }}>
          <div style={{ height: 200, marginBottom: 20 }}><OptimizedImage src={coverImage} /></div>
          <Button onClick={() => fileInputRef.current?.click()} style={{ width: '100%' }}>اختيار صورة</Button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleCoverUpload} style={{ display: 'none' }} />
          <Button onClick={saveCoverImage} style={{ width: '100%', marginTop: 10 }}>حفظ</Button>
        </div>
      </Modal>

      <Modal open={showAvatarCropper} onClose={() => setShowAvatarCropper(false)} title="تعديل الصورة">
        <div style={{ padding: 20 }}>
          <div style={{ width: 200, height: 200, borderRadius: '50%', overflow: 'hidden', margin: '0 auto 20px' }}><OptimizedImage src={avatarImage} /></div>
          <Button onClick={applyCrop} style={{ width: '100%' }}>تطبيق</Button>
        </div>
      </Modal>
    </>
  );
}
