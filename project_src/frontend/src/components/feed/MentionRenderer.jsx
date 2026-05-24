import { useState, useCallback, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import OptimizedImage from '../media/OptimizedImage.jsx';
import { useToast } from '../admin/ToastProvider.jsx';

/**
 * MentionRenderer Component
 * 
 * مكون متخصص لعرض ومعالجة الإشارات مع:
 * - تحديد الإشارات تلقائياً في النصوص
 * - معاينة ملف المستخدم
 * - رابط لملف المستخدم
 * - دعم الإشارات المتعددة
 * - تنبيهات للمستخدمين المشار إليهم
 */

// مكون الإشارة الفردية
const MentionBadge = memo(function MentionBadge({ 
  username, 
  avatar,
  onClick,
  isVerified = false,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mention-badge"
      title={`عرض ملف @${username}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        borderRadius: 16,
        border: 'none',
        background: 'rgba(var(--accent-rgb), 0.1)',
        color: 'var(--accent)',
        cursor: 'pointer',
        fontSize: 13,
        fontWeight: '500',
        transition: 'all 0.2s ease',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(var(--accent-rgb), 0.2)';
        e.currentTarget.style.transform = 'scale(1.05)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(var(--accent-rgb), 0.1)';
        e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      {avatar && (
        <div style={{
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: 'var(--bg-soft)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          border: '1px solid var(--line)',
          flexShrink: 0,
        }}>
          <OptimizedImage
            src={avatar}
            alt={username}
            width={20}
            height={20}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      )}
      <span>@{username}</span>
      {isVerified && <span title="حساب موثق">✅</span>}
    </button>
  );
});

MentionBadge.displayName = 'MentionBadge';

// مكون معاينة الملف الشخصي
const UserPreview = memo(function UserPreview({ 
  username,
  avatar,
  displayName,
  bio,
  followers = 0,
  isVerified = false,
  onNavigate,
  onFollow,
  isFollowing = false,
}) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: '100%',
        left: 0,
        background: 'var(--bg-card)',
        border: '1px solid var(--line)',
        borderRadius: 12,
        padding: 16,
        minWidth: 280,
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
        zIndex: 100,
        animation: 'popIn 0.2s ease-out',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: 'var(--bg-soft)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          border: '2px solid var(--line)',
        }}>
          {avatar ? (
            <OptimizedImage
              src={avatar}
              alt={username}
              width={48}
              height={48}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <strong>{username?.[0]?.toUpperCase()}</strong>
          )}
        </div>
        <button
          type="button"
          onClick={onFollow}
          style={{
            padding: '6px 12px',
            background: isFollowing ? 'transparent' : 'var(--primary)',
            color: isFollowing ? 'var(--primary)' : 'white',
            border: isFollowing ? '1px solid var(--primary)' : 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: '500',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            if (!isFollowing) {
              e.currentTarget.style.opacity = '0.9';
            }
          }}
          onMouseLeave={(e) => {
            if (!isFollowing) {
              e.currentTarget.style.opacity = '1';
            }
          }}
        >
          {isFollowing ? 'متابع' : 'متابعة'}
        </button>
      </div>

      {/* Name and Username */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: 4 }}>
          {displayName || username}
          {isVerified && <span title="حساب موثق">✅</span>}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>@{username}</div>
      </div>

      {/* Bio */}
      {bio && (
        <div style={{ fontSize: 13, color: 'var(--text)', marginBottom: 12, lineHeight: 1.4 }}>
          {bio}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 12, fontSize: 12 }}>
        <div>
          <strong>{followers}</strong>
          <div style={{ color: 'var(--text-secondary)' }}>متابع</div>
        </div>
      </div>

      {/* View Profile Button */}
      <button
        type="button"
        onClick={onNavigate}
        style={{
          width: '100%',
          padding: '8px 12px',
          background: 'var(--bg-soft)',
          border: '1px solid var(--line)',
          borderRadius: 6,
          cursor: 'pointer',
          fontSize: 12,
          fontWeight: '500',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--primary)';
          e.currentTarget.style.color = 'white';
          e.currentTarget.style.borderColor = 'var(--primary)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'var(--bg-soft)';
          e.currentTarget.style.color = 'var(--text)';
          e.currentTarget.style.borderColor = 'var(--line)';
        }}
      >
        عرض الملف الشخصي
      </button>
    </div>
  );
});

UserPreview.displayName = 'UserPreview';

/**
 * Main MentionRenderer Component
 */
const MentionRenderer = memo(function MentionRenderer({
  text = '',
  mentions = [],
  onMentionClick,
  userProfiles = {}, // { username: { avatar, displayName, bio, followers, isVerified } }
  showAvatars = true,
  inline = false,
}) {
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const [hoveredUser, setHoveredUser] = useState(null);

  // استخراج الإشارات من النص
  const extractedMentions = useMemo(() => {
    if (!text) return mentions;
    
    const mentionRegex = /@[\w\u0600-\u06FF]+/g;
    const matches = text.match(mentionRegex) || [];
    const users = matches.map(mention => mention.substring(1)); // إزالة @
    
    return [...new Set([...users, ...mentions])]; // دمج مع الإشارات المعطاة وإزالة التكرار
  }, [text, mentions]);

  // معالجة النقر على الإشارة
  const handleMentionClick = useCallback((username) => {
    if (onMentionClick) {
      onMentionClick(username);
    } else {
      navigate(`/profile/${username}`);
      pushToast({ type: 'info', title: `عرض ملف @${username}` });
    }
  }, [navigate, onMentionClick, pushToast]);

  // معالجة المتابعة
  const handleFollow = useCallback((username) => {
    pushToast({ type: 'success', title: `تم متابعة @${username}` });
  }, [pushToast]);

  // إذا كان inline، عرض الإشارات بشكل مضمن في النص
  if (inline && text) {
    const parts = text.split(/(\s+|@[\w\u0600-\u06FF]+)/);
    return (
      <div style={{ lineHeight: 1.6 }}>
        {parts.map((part, idx) => {
          if (part.startsWith('@')) {
            const username = part.substring(1);
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleMentionClick(username)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent)',
                  cursor: 'pointer',
                  fontWeight: '500',
                  textDecoration: 'underline',
                  padding: 0,
                  fontSize: 'inherit',
                  transition: 'color 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--accent)';
                }}
              >
                {part}
              </button>
            );
          }
          return <span key={idx}>{part}</span>;
        })}
      </div>
    );
  }

  // عرض الإشارات كشارات (badges)
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 8,
      }}
    >
      {extractedMentions.map((username, idx) => {
        const profile = userProfiles[username] || {};
        return (
          <div
            key={idx}
            style={{ position: 'relative' }}
            onMouseEnter={() => setHoveredUser(username)}
            onMouseLeave={() => setHoveredUser(null)}
          >
            <MentionBadge
              username={username}
              avatar={showAvatars ? profile.avatar : null}
              onClick={() => handleMentionClick(username)}
              isVerified={profile.isVerified || false}
            />
            {hoveredUser === username && (
              <UserPreview
                username={username}
                avatar={profile.avatar}
                displayName={profile.displayName}
                bio={profile.bio}
                followers={profile.followers || 0}
                isVerified={profile.isVerified || false}
                onNavigate={() => handleMentionClick(username)}
                onFollow={() => handleFollow(username)}
                isFollowing={profile.isFollowing || false}
              />
            )}
          </div>
        );
      })}
    </div>
  );
});

MentionRenderer.displayName = 'MentionRenderer';

export default MentionRenderer;
export { MentionBadge, UserPreview };
