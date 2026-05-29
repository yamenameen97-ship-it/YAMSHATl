import { useCallback, useEffect, useState } from 'react';
import useVideo from '../../hooks/media/useVideo.js';

/**
 * UniversalPlayer — single source of truth for video playback in Yamshat.
 *
 * Supports:
 *   variant = "post"  → play/pause, seek bar, volume, fullscreen, PiP, speed
 *   variant = "reel"  → vertical, autoplay-on-visible, tap-to-pause, double-tap like, mute toggle, progress
 *   variant = "live"  → live badge, latency display, reconnect indicator, quality selector
 *
 * Props:
 *   src           : string (mp4 or .m3u8 — HLS auto-handled via videoService)
 *   poster        : string
 *   variant       : 'post' | 'reel' | 'live'   (default 'post')
 *   autoplay      : boolean
 *   loop          : boolean
 *   muted         : boolean
 *   isActive      : boolean (reels)
 *   onDoubleTapLike : () => void
 *   qualities     : [{ label, url }]
 *   onError       : (err) => void
 *   className     : string
 */
export default function UniversalPlayer({
  src,
  poster,
  variant = 'post',
  autoplay,
  loop,
  muted,
  isActive,
  onDoubleTapLike,
  qualities = [],
  className = '',
  onError,
}) {
  const smartPause = variant === 'reel';
  const computedAutoplay = autoplay ?? (variant === 'reel' || variant === 'live');
  const computedLoop = loop ?? (variant === 'reel');
  const computedMuted = muted ?? (variant === 'reel');

  const {
    videoRef,
    containerRef,
    isPlaying,
    progress,
    duration,
    buffered,
    muted: isMuted,
    toggleMute,
    play,
    pause,
    toggle,
    seek,
  } = useVideo({
    src,
    autoplay: computedAutoplay,
    muted: computedMuted,
    smartPause,
    threshold: 0.6,
  });

  const [showControls, setShowControls] = useState(variant !== 'reel');
  const [showHeart, setShowHeart] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [currentSrc, setCurrentSrc] = useState(src);
  const [fullscreen, setFullscreen] = useState(false);

  // For reels: drive play based on isActive prop
  useEffect(() => {
    if (variant !== 'reel') return;
    const el = videoRef.current;
    if (!el) return;
    if (isActive) {
      const p = el.play();
      if (p && p.catch) p.catch(() => {});
    } else {
      try { el.pause(); el.currentTime = 0; } catch { /* ignore */ }
    }
  }, [isActive, variant, videoRef]);

  // double-tap like (reels)
  const lastTapRef = useState({ ts: 0 })[0];
  const handleTap = useCallback(() => {
    if (variant !== 'reel') { toggle(); return; }
    const now = Date.now();
    if (now - lastTapRef.ts < 280) {
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 700);
      if (typeof onDoubleTapLike === 'function') onDoubleTapLike();
      lastTapRef.ts = 0;
      return;
    }
    lastTapRef.ts = now;
    setTimeout(() => {
      if (lastTapRef.ts !== 0 && Date.now() - lastTapRef.ts >= 280) {
        toggle();
        lastTapRef.ts = 0;
      }
    }, 300);
  }, [variant, toggle, onDoubleTapLike, lastTapRef]);

  // fullscreen
  const handleFullscreen = useCallback(() => {
    const node = containerRef.current;
    if (!node) return;
    if (!document.fullscreenElement) {
      try { node.requestFullscreen?.(); setFullscreen(true); } catch { /* ignore */ }
    } else {
      try { document.exitFullscreen?.(); setFullscreen(false); } catch { /* ignore */ }
    }
  }, [containerRef]);

  // PiP
  const handlePiP = useCallback(async () => {
    const el = videoRef.current;
    if (!el) return;
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else await el.requestPictureInPicture?.();
    } catch { /* ignore */ }
  }, [videoRef]);

  const handleSpeed = useCallback((v) => {
    const el = videoRef.current;
    if (!el) return;
    el.playbackRate = v;
    setSpeed(v);
  }, [videoRef]);

  const handleQuality = useCallback((url) => {
    setCurrentSrc(url);
  }, []);

  const containerStyle = {
    position: 'relative',
    width: '100%',
    height: variant === 'reel' ? '100%' : 'auto',
    aspectRatio: variant === 'reel' ? '9 / 16' : (variant === 'live' ? '16 / 9' : undefined),
    background: '#000',
    borderRadius: variant === 'reel' ? 0 : 12,
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
  };

  const fmt = (s) => {
    if (!s || Number.isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  return (
    <div
      ref={containerRef}
      className={`yamshat-universal-player yamshat-up-${variant} ${className}`}
      style={containerStyle}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => variant !== 'reel' && isPlaying && setShowControls(false)}
      onClick={variant === 'reel' ? handleTap : undefined}
    >
      <video
        ref={videoRef}
        src={currentSrc !== src ? currentSrc : undefined}
        poster={poster}
        playsInline
        loop={computedLoop}
        muted={isMuted}
        preload="metadata"
        onError={onError}
        style={{
          width: '100%',
          height: '100%',
          objectFit: variant === 'reel' ? 'cover' : 'contain',
        }}
      />

      {/* Heart overlay for reel double-tap */}
      {variant === 'reel' && showHeart && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%) scale(1.4)',
            fontSize: 96,
            color: '#ff3366',
            textShadow: '0 4px 24px rgba(0,0,0,0.4)',
            pointerEvents: 'none',
            animation: 'yamshat-heart-pop 700ms ease-out',
          }}
        >❤️</div>
      )}

      {/* LIVE badge */}
      {variant === 'live' && (
        <div style={{
          position: 'absolute', top: 12, insetInlineStart: 12,
          background: '#ff3b30', color: 'white', padding: '4px 10px',
          borderRadius: 6, fontSize: 12, fontWeight: 700, letterSpacing: 0.5,
        }}>● LIVE</div>
      )}

      {/* Mute button for reels */}
      {variant === 'reel' && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); toggleMute(); }}
          style={{
            position: 'absolute', bottom: 80, insetInlineEnd: 16,
            background: 'rgba(0,0,0,0.5)', color: 'white', border: 0,
            width: 40, height: 40, borderRadius: 20, cursor: 'pointer',
            fontSize: 18,
          }}
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? '🔇' : '🔊'}
        </button>
      )}

      {/* Progress (always for reels & live, conditional for post) */}
      {(variant === 'reel' || showControls) && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            const rect = e.currentTarget.getBoundingClientRect();
            const pct = ((e.clientX - rect.left) / rect.width) * 100;
            seek(pct);
          }}
          style={{
            position: 'absolute',
            bottom: variant === 'reel' ? 0 : 44,
            left: 0, right: 0,
            height: variant === 'reel' ? 3 : 5,
            background: 'rgba(255,255,255,0.18)',
            cursor: variant !== 'reel' ? 'pointer' : 'default',
          }}
        >
          <div style={{ width: `${buffered}%`, height: '100%', background: 'rgba(255,255,255,0.35)' }} />
          <div style={{
            width: `${progress}%`, height: '100%', background: '#ff3366',
            marginTop: variant === 'reel' ? -3 : -5,
          }} />
        </div>
      )}

      {/* Full control bar for post/live */}
      {variant !== 'reel' && showControls && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '10px 12px',
          background: 'linear-gradient(to top, rgba(0,0,0,0.75), transparent)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <button type="button" onClick={(e) => { e.stopPropagation(); toggle(); }}
            style={btnStyle} aria-label={isPlaying ? 'Pause' : 'Play'}>
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button type="button" onClick={(e) => { e.stopPropagation(); toggleMute(); }}
            style={btnStyle} aria-label={isMuted ? 'Unmute' : 'Mute'}>
            {isMuted ? '🔇' : '🔊'}
          </button>
          <div style={{ fontSize: 12, color: '#fff' }}>
            {fmt((progress / 100) * duration)} / {fmt(duration)}
          </div>
          <div style={{ flex: 1 }} />
          {variant === 'post' && (
            <select
              value={speed}
              onChange={(e) => { e.stopPropagation(); handleSpeed(parseFloat(e.target.value)); }}
              style={selectStyle}
            >
              {[0.5, 1, 1.25, 1.5, 2].map((v) => (
                <option key={v} value={v}>{v}x</option>
              ))}
            </select>
          )}
          {qualities.length > 0 && (
            <select
              value={currentSrc}
              onChange={(e) => { e.stopPropagation(); handleQuality(e.target.value); }}
              style={selectStyle}
            >
              {qualities.map((q) => (
                <option key={q.url} value={q.url}>{q.label}</option>
              ))}
            </select>
          )}
          <button type="button" onClick={(e) => { e.stopPropagation(); handlePiP(); }}
            style={btnStyle} aria-label="Picture in picture">📺</button>
          <button type="button" onClick={(e) => { e.stopPropagation(); handleFullscreen(); }}
            style={btnStyle} aria-label="Fullscreen">{fullscreen ? '⛶' : '⛶'}</button>
        </div>
      )}

      <style>{`
        @keyframes yamshat-heart-pop {
          0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
          30%  { opacity: 1; transform: translate(-50%, -50%) scale(1.6); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(1.2); }
        }
      `}</style>
    </div>
  );
}

const btnStyle = {
  background: 'none', border: 0, color: 'white', cursor: 'pointer',
  fontSize: 18, padding: '4px 6px',
};

const selectStyle = {
  background: 'rgba(255,255,255,0.12)', color: 'white',
  border: '1px solid rgba(255,255,255,0.3)', borderRadius: 6,
  padding: '3px 6px', fontSize: 12,
};
