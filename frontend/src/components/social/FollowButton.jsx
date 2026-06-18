import React, { useCallback } from 'react';
import useFollow from '../../hooks/useFollow.js';

/**
 * FollowButton - ุฒุฑ ู…ุชุงุจุนุฉ ู…ูˆุญุฏ ู„ุฌู…ูŠุน ุฃู†ุญุงุก ุงู„ุชุทุจูŠู‚
 * - ูŠุฏุนู… ุงู„ุชู„ู‚ุงุฆูŠุฉ (optimistic update)
 * - ูŠุฑุจุท ู…ุน Backend ู…ุจุงุดุฑุฉ ุนุจุฑ useFollow
 * - ู…ู„ุชุฒู… ุจู€ Design System ู„ู„ู…ู‚ุงุณุงุช ูˆุงู„ุฃู„ูˆุงู†
 */
export default function FollowButton({
  username,
  initialIsFollowing = false,
  initialFollowersCount = 0,
  size = 'medium',           // small | medium | large
  variant = 'primary',        // primary | secondary | minimal
  fullWidth = false,
  showCount = false,
  onChange,                   // (isFollowing) => void
  className = '',
  style = {},
}) {
  const { isFollowing, followersCount, loading, toggleFollow } = useFollow(username, {
    initialIsFollowing,
    initialFollowersCount,
  });

  const handleClick = useCallback(async (e) => {
    e?.stopPropagation?.();
    e?.preventDefault?.();
    if (loading || !username) return;
    try {
      await toggleFollow();
      onChange?.(!isFollowing);
    } catch (_) {
      // ุงู„ุฎุทุฃ ู…ุนุงู„ูŽุฌ ุฏุงุฎู„ ุงู„ู‡ูˆูƒ
    }
  }, [toggleFollow, isFollowing, loading, username, onChange]);

  const sizeStyles = {
    small:  { height: 32, padding: '0 14px', fontSize: 13, minWidth: 92 },
    medium: { height: 40, padding: '0 18px', fontSize: 14, minWidth: 110 },
    large:  { height: 48, padding: '0 22px', fontSize: 15, minWidth: 130 },
  }[size] || {};

  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 999,
    border: '1px solid transparent',
    fontWeight: 600,
    cursor: loading ? 'wait' : 'pointer',
    transition: 'all 0.2s ease',
    width: fullWidth ? '100%' : 'auto',
    opacity: loading ? 0.7 : 1,
    fontFamily: 'inherit',
    ...sizeStyles,
    ...style,
  };

  const themeStyle = isFollowing
    ? {
        background: 'transparent',
        color: '#E5E7EB',
        border: '1px solid #374151',
      }
    : variant === 'secondary'
      ? { background: '#1F2937', color: '#FFFFFF', border: '1px solid #374151' }
      : variant === 'minimal'
        ? { background: 'transparent', color: '#8B5CF6', border: '1px solid #8B5CF6' }
        : { background: '#8B5CF6', color: '#FFFFFF', border: '1px solid #8B5CF6' };

  return (
    <button
      type="button"
      className={`ym-follow-btn ${isFollowing ? 'is-following' : ''} ${className}`}
      onClick={handleClick}
      disabled={loading || !username}
      aria-pressed={isFollowing}
      aria-busy={loading}
      style={{ ...baseStyle, ...themeStyle }}
    >
      {loading ? (
        <span style={{ opacity: 0.8 }}>โ€ฆ</span>
      ) : isFollowing ? (
        <>โœ“ <span>ู…ุชุงุจูŽุน</span></>
      ) : (
        <span>ู…ุชุงุจุนุฉ</span>
      )}
      {showCount && Number.isFinite(followersCount) ? (
        <span style={{ opacity: 0.75, fontWeight: 400 }}>ยท {followersCount}</span>
      ) : null}
    </button>
  );
}
