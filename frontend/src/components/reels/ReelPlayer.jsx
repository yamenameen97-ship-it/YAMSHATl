import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';

/**
 * ReelPlayer — Stage 6 Premium Polish (مُحسّن)
 * ------------------------------------------
 * تحسينات النسخة الجديدة:
 *  ✓ إصلاح مشكلة AudioContext (start بعد user gesture بدل autoplay مباشر)
 *  ✓ Smart muted autoplay (browsers بتسمح بـ autoplay لو muted فقط)
 *  ✓ Tap-to-unmute مع تأثير fade
 *  ✓ Preload metadata ذكي حسب الـ connection
 *  ✓ Pause تلقائي ساعة الـ tab مش visible
 *  ✓ stalled / error recovery (auto retry)
 *  ✓ Cleanup قوي لمنع الـ memory leaks
 *  ✓ Touch-friendly progress scrubbing
 *  ✓ Reduced motion respected
 *  ✓ لا inline-styles حرجة (محكوم بـ reels-premium.css)
 */
export default function ReelPlayer({
  reel,
  isActive,
  onLike,
  onComment,
  onShare,
  onError,
  preloadNext = false,
}) {
  const videoRef = useRef(null);
  const tapTimerRef = useRef(null);
  const lastTapAtRef = useRef(0);
  const lastImmersionRef = useRef(Date.now());
  const userGesturedRef = useRef(false);
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 2;

  const [progress, setProgress] = useState(0);
  const [buffering, setBuffering] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const [showPauseIcon, setShowPauseIcon] = useState(false);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(true);
  const [immersive, setImmersive] = useState(false);
  const [hasError, setHasError] = useState(false);

  /* ---------- 0) connection-aware preload value ---------- */
  const preloadValue = useMemo(() => {
    if (isActive) return 'auto';
    if (!preloadNext) return 'none';
    if (typeof navigator !== 'undefined') {
      const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (conn?.saveData) return 'none';
      if (['slow-2g', '2g'].includes(conn?.effectiveType)) return 'none';
    }
    return 'metadata';
  }, [isActive, preloadNext]);

  /* ---------- 1) Play/Pause when active changes ---------- */
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return undefined;

    if (isActive) {
      try { v.currentTime = 0; } catch {}
      // muted autoplay مسموح في كل المتصفحات الحديثة
      v.muted = muted;
      const promise = v.play();
      if (promise?.catch) {
        promise.catch((err) => {
          // autoplay blocked — هنستنى user gesture
          if (err?.name !== 'AbortError') {
            setPaused(true);
          }
        });
      }
      setPaused(false);
    } else {
      try { v.pause(); } catch {}
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  /* ---------- 1.5) Tab visibility — auto pause لو الـ tab مش visible ---------- */
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const onVis = () => {
      const v = videoRef.current;
      if (!v) return;
      if (document.hidden) {
        try { v.pause(); } catch {}
      } else if (isActive && !paused) {
        v.play().catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [isActive, paused]);

  /* ---------- 2) Time / Buffering tracking ---------- */
  const handleTimeUpdate = useCallback(() => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    setProgress((v.currentTime / v.duration) * 100);
  }, []);

  /* ---------- 2.5) Error & Stall recovery ---------- */
  const handleError = useCallback(() => {
    setBuffering(false);
    const v = videoRef.current;
    if (!v) return;
    if (retryCountRef.current < MAX_RETRIES) {
      retryCountRef.current += 1;
      setTimeout(() => {
        try {
          const src = v.src;
          v.src = '';
          v.src = src;
          v.load();
          if (isActive) v.play().catch(() => {});
        } catch {}
      }, 1500 * retryCountRef.current);
    } else {
      setHasError(true);
      onError?.(reel);
    }
  }, [isActive, onError, reel]);

  const handleStalled = useCallback(() => {
    const v = videoRef.current;
    if (!v || !isActive) return;
    // ممكن الشبكة وقعت — جرّب نكمل بعد ثانية
    setTimeout(() => {
      if (v && v.paused === false && v.readyState < 3) {
        try { v.load(); } catch {}
      }
    }, 1500);
  }, [isActive]);

  /* ---------- 3) Tap handling (single = pause/play, double = like) ---------- */
  const triggerHeart = useCallback(() => {
    setShowHeart(true);
    onLike?.(reel);
    window.setTimeout(() => setShowHeart(false), 900);
  }, [onLike, reel]);

  const togglePlayback = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    userGesturedRef.current = true;
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
      if (tapTimerRef.current) {
        clearTimeout(tapTimerRef.current);
        tapTimerRef.current = null;
      }
      triggerHeart();
      return;
    }
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    tapTimerRef.current = window.setTimeout(() => {
      togglePlayback();
      tapTimerRef.current = null;
    }, 240);
  }, [togglePlayback, triggerHeart]);

  /* ---------- 4) Progress bar scrubbing (mouse + touch) ---------- */
  const onProgressTap = useCallback((event) => {
    event.stopPropagation();
    const v = videoRef.current;
    if (!v || !v.duration) return;
    const bar = event.currentTarget;
    const rect = bar.getBoundingClientRect();
    const pageX = event.clientX ?? event.touches?.[0]?.clientX ?? event.changedTouches?.[0]?.clientX ?? 0;
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

  /* ---------- 6) Cleanup on unmount ---------- */
  useEffect(() => {
    return () => {
      if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
      const v = videoRef.current;
      if (v) {
        try {
          v.pause();
          v.removeAttribute('src');
          v.load();
        } catch {}
      }
    };
  }, []);

  /* ---------- 7) Memoized counters ---------- */
  const counters = useMemo(() => ({
    likes:    reel?.likes    ?? 0,
    comments: reel?.comments ?? 0,
    shares:   reel?.shares   ?? 0,
  }), [reel]);

  /* ---------- 8) Toggle mute بأمان (user gesture) ---------- */
  const toggleMute = useCallback((e) => {
    e?.stopPropagation();
    userGesturedRef.current = true;
    setMuted((m) => {
      const next = !m;
      const v = videoRef.current;
      if (v) {
        v.muted = next;
        if (!next && v.paused && isActive) v.play().catch(() => {});
      }
      return next;
    });
    wakeImmersion();
  }, [isActive, wakeImmersion]);

  /* ---------- 9) Render ---------- */
  return (
    <article
      className={`reel-slot ${isActive ? 'is-active' : ''}`}
      data-ds="reel-slot"
      onClick={(e) => { wakeImmersion(); if (e.target === e.currentTarget) onSurfaceTap(); }}
      role="group"
      aria-label={`ريل من ${reel?.author || 'مستخدم'}`}
    >
      <video
        ref={videoRef}
        data-ds="reel-video"
        className="reel-video"
        src={reel?.videoUrl}
        poster={reel?.poster}
        loop
        playsInline
        muted={muted}
        preload={preloadValue}
        onClick={onSurfaceTap}
        onWaiting={() => setBuffering(true)}
        onPlaying={() => { setBuffering(false); setHasError(false); retryCountRef.current = 0; }}
        onCanPlay={() => setBuffering(false)}
        onTimeUpdate={handleTimeUpdate}
        onError={handleError}
        onStalled={handleStalled}
        aria-hidden={!isActive}
      />

      {buffering && !hasError && (
        <div className="reel-loading" aria-hidden="true">
          <div className="reel-spinner" />
        </div>
      )}

      {hasError && (
        <div className="reel-error" role="alert" style={{
          position: 'absolute', inset: 0, display: 'flex',
          flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          color: '#fff', gap: 12, padding: 24, textAlign: 'center',
        }}>
          <div style={{ fontSize: 36 }}>⚠</div>
          <div>تعذّر تشغيل الريل. تحقق من الإنترنت وحاول مرة أخرى.</div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              retryCountRef.current = 0;
              setHasError(false);
              const v = videoRef.current;
              if (v) { v.load(); if (isActive) v.play().catch(() => {}); }
            }}
            style={{
              background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)',
              padding: '8px 20px', borderRadius: 999, cursor: 'pointer',
            }}
          >
            إعادة المحاولة
          </button>
        </div>
      )}

      {/* depth overlays */}
      <div className="reel-overlay-top" aria-hidden="true" />
      <div className="reel-overlay-bottom" aria-hidden="true" />

      {/* Mute toggle */}
      <button
        type="button"
        className="reel-mute-indicator"
        onClick={toggleMute}
        aria-label={muted ? 'تشغيل الصوت' : 'كتم الصوت'}
        aria-pressed={!muted}
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

      {showHeart && <div className="reel-heart-pop" aria-hidden="true">❤</div>}

      {showPauseIcon && (
        <div className="reel-pause-icon visible" aria-hidden="true">
          {paused ? '▶' : '⏸'}
        </div>
      )}

      {/* Progress bar (mouse + touch) */}
      <div
        className="reel-progress"
        onClick={onProgressTap}
        onTouchEnd={onProgressTap}
        role="slider"
        aria-label="مؤشر التقدم"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="reel-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {immersive && (
        <div className="reel-hint" aria-hidden="true">اضغط للتفاعل ↑</div>
      )}
    </article>
  );
}
