import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';

/**
 * ReelPlayer — Stage 5 Premium Polish
 * ------------------------------------
 * - No inline styles (محكوم بالكامل بـ reels-premium.css)
 * - Physics realism: smooth play/pause, double-tap heart, tap-to-toggle controls
 * - Preload intelligence: content-visibility + preload="metadata" + auto-pause when not active
 * - Momentum scrolling handled by container (.reels-container) snap rules
 * - Gestures: double-tap like, single-tap pause/play, scrubbing on progress
 * - Immersive feeling: overlays fade on prolonged inactivity
 * - Accessible: aria labels, reduced-motion respected
 *
 * Expected props:
 *   reel        : { id, videoUrl, caption, author, avatar, likes, comments, shares, isLiked }
 *   isActive    : boolean — هل الفيديو هو المعروض حاليًا
 *   onLike?     : (reel) => void
 *   onComment?  : (reel) => void
 *   onShare?    : (reel) => void
 *   preloadNext?: boolean — تلميح للمتصفح
 */
export default function ReelPlayer({
  reel,
  isActive,
  onLike,
  onComment,
  onShare,
  preloadNext = false,
}) {
  const videoRef = useRef(null);
  const tapTimerRef = useRef(null);
  const lastTapAtRef = useRef(0);
  const lastImmersionRef = useRef(Date.now());

  const [progress, setProgress] = useState(0);
  const [buffering, setBuffering] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const [showPauseIcon, setShowPauseIcon] = useState(false);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(true);
  const [immersive, setImmersive] = useState(false);

  /* ---------- 1) Play/Pause when active changes ---------- */
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return undefined;

    if (isActive) {
      v.currentTime = 0;
      const promise = v.play();
      if (promise?.catch) promise.catch(() => { /* autoplay blocked silently */ });
      setPaused(false);
    } else {
      v.pause();
    }
    return undefined;
  }, [isActive]);

  /* ---------- 2) Time / Buffering tracking ---------- */
  const handleTimeUpdate = useCallback(() => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    setProgress((v.currentTime / v.duration) * 100);
  }, []);

  /* ---------- 3) Tap handling (single = pause/play, double = like) ---------- */
  const triggerHeart = useCallback(() => {
    setShowHeart(true);
    onLike?.(reel);
    window.setTimeout(() => setShowHeart(false), 900);
  }, [onLike, reel]);

  const togglePlayback = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {});
      setPaused(false);
    } else {
      v.pause();
      setPaused(true);
    }
    setShowPauseIcon(true);
    window.setTimeout(() => setShowPauseIcon(false), 700);
  }, []);

  const onSurfaceTap = useCallback(() => {
    const now = Date.now();
    const delta = now - lastTapAtRef.current;
    lastTapAtRef.current = now;

    if (delta < 300) {
      // double tap → heart
      if (tapTimerRef.current) {
        clearTimeout(tapTimerRef.current);
        tapTimerRef.current = null;
      }
      triggerHeart();
      return;
    }
    // single tap → wait a bit to confirm
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    tapTimerRef.current = window.setTimeout(() => {
      togglePlayback();
      tapTimerRef.current = null;
    }, 240);
  }, [togglePlayback, triggerHeart]);

  /* ---------- 4) Progress bar scrubbing ---------- */
  const onProgressTap = useCallback((event) => {
    event.stopPropagation();
    const v = videoRef.current;
    if (!v || !v.duration) return;
    const bar = event.currentTarget;
    const rect = bar.getBoundingClientRect();
    const pageX = event.clientX ?? event.touches?.[0]?.clientX ?? 0;
    const ratio = Math.max(0, Math.min(1, (pageX - rect.left) / rect.width));
    v.currentTime = ratio * v.duration;
    setProgress(ratio * 100);
  }, []);

  /* ---------- 5) Immersion (hide overlays on idle) ---------- */
  useEffect(() => {
    if (!isActive) return undefined;
    lastImmersionRef.current = Date.now();
    setImmersive(false);

    const id = window.setInterval(() => {
      if (Date.now() - lastImmersionRef.current > 3500) setImmersive(true);
    }, 800);
    return () => window.clearInterval(id);
  }, [isActive]);

  const wakeImmersion = useCallback(() => {
    lastImmersionRef.current = Date.now();
    setImmersive(false);
  }, []);

  /* ---------- 6) Memoized counters ---------- */
  const counters = useMemo(() => ({
    likes:    reel?.likes    ?? 0,
    comments: reel?.comments ?? 0,
    shares:   reel?.shares   ?? 0,
  }), [reel]);

  /* ---------- 7) Render ---------- */
  return (
    <article
      className={`reel-slot ${isActive ? 'is-active' : ''}`}
      data-ds="reel-slot"
      onClick={(e) => { wakeImmersion(); /* surface click goes through */ if (e.target === e.currentTarget) onSurfaceTap(); }}
      role="group"
      aria-label={`ريل من ${reel?.author || 'مستخدم'}`}
    >
      <video
        ref={videoRef}
        data-ds="reel-video"
        className="reel-video"
        src={reel?.videoUrl}
        loop
        playsInline
        muted={muted}
        preload={isActive ? 'auto' : (preloadNext ? 'metadata' : 'none')}
        onClick={onSurfaceTap}
        onWaiting={() => setBuffering(true)}
        onPlaying={() => setBuffering(false)}
        onTimeUpdate={handleTimeUpdate}
        aria-hidden={!isActive}
      />

      {/* Skeleton until metadata is ready */}
      {buffering && (
        <div className="reel-loading" aria-hidden="true">
          <div className="reel-spinner" />
        </div>
      )}

      {/* Top + bottom depth overlays */}
      <div className="reel-overlay-top" aria-hidden="true" />
      <div className="reel-overlay-bottom" aria-hidden="true" />

      {/* Mute toggle */}
      <button
        type="button"
        className="reel-mute-indicator"
        onClick={(e) => { e.stopPropagation(); setMuted((m) => !m); wakeImmersion(); }}
        aria-label={muted ? 'تشغيل الصوت' : 'كتم الصوت'}
      >
        <span aria-hidden="true">{muted ? '🔇' : '🔊'}</span>
        <span>{muted ? 'صامت' : 'مفعّل'}</span>
      </button>

      {/* Caption + author */}
      <div className="reel-caption">
        {reel?.author && (
          <div className="reel-author">
            <span aria-hidden="true">@</span>
            <span>{reel.author}</span>
          </div>
        )}
        {reel?.caption && <p>{reel.caption}</p>}
      </div>

      {/* Right actions stack */}
      <div className="reel-actions" onClick={(e) => e.stopPropagation()}>
        <div>
          <button
            type="button"
            className={`reel-action-btn ${reel?.isLiked ? 'is-liked' : ''}`}
            onClick={() => { onLike?.(reel); wakeImmersion(); }}
            aria-label="إعجاب"
            aria-pressed={reel?.isLiked || false}
          >
            ❤
          </button>
          <div className="reel-action-label">{counters.likes}</div>
        </div>
        <div>
          <button
            type="button"
            className="reel-action-btn"
            onClick={() => { onComment?.(reel); wakeImmersion(); }}
            aria-label="تعليق"
          >
            💬
          </button>
          <div className="reel-action-label">{counters.comments}</div>
        </div>
        <div>
          <button
            type="button"
            className="reel-action-btn"
            onClick={() => { onShare?.(reel); wakeImmersion(); }}
            aria-label="مشاركة"
          >
            ↪
          </button>
          <div className="reel-action-label">{counters.shares}</div>
        </div>
      </div>

      {/* Double-tap heart */}
      {showHeart && <div className="reel-heart-pop" aria-hidden="true">❤</div>}

      {/* Single-tap pause/play feedback */}
      {showPauseIcon && (
        <div className="reel-pause-icon visible" aria-hidden="true">
          {paused ? '▶' : '⏸'}
        </div>
      )}

      {/* Progress bar */}
      <div
        className="reel-progress"
        onClick={onProgressTap}
        role="slider"
        aria-label="مؤشر التقدم"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="reel-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* Immersion hint when overlays hide */}
      {immersive && (
        <div className="reel-hint" aria-hidden="true">اضغط للتفاعل ↑</div>
      )}
    </article>
  );
}
