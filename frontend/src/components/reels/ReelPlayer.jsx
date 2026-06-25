import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { REEL_FILTERS, getSavedFilter, saveFilter, getFilterById } from './ReelFilters.js';

/**
 * ReelPlayer — Stage 6 Premium Polish (مُحسّن + فلاتر ريلز v33+1)
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

  // ✅ v59.13.5 FIX #3: تتبّع كل مؤقّتات setTimeout داخل المكوّن
  // لإلغائها عند unmount — لمنع الوصول لـ videoRef بعد تفريغه + setState على mount-less
  const pendingTimersRef = useRef(new Set());
  const trackTimer = useCallback((id) => {
    pendingTimersRef.current.add(id);
    return id;
  }, []);
  const isMountedRef = useRef(true);

  const [progress, setProgress] = useState(0);
  const [buffering, setBuffering] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const [showPauseIcon, setShowPauseIcon] = useState(false);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(true);
  const [immersive, setImmersive] = useState(false);
  const [hasError, setHasError] = useState(false);
  /* ✅ v33+1: فلاتر الريلز — حالة الفلتر الحالي + لوحة الاختيار */
  const [filterId, setFilterId] = useState(() => getSavedFilter());
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const currentFilter = useMemo(() => getFilterById(filterId), [filterId]);
  const videoFilterStyle = useMemo(() => ({
    filter: currentFilter?.filter && currentFilter.filter !== 'none' ? currentFilter.filter : 'none',
    WebkitFilter: currentFilter?.filter && currentFilter.filter !== 'none' ? currentFilter.filter : 'none',
    transition: 'filter 220ms ease',
  }), [currentFilter]);

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
      const id = window.setTimeout(() => {
        pendingTimersRef.current.delete(id);
        // تحقّق أن المكوّن لا يزال mounted والفيديو موجود
        if (!isMountedRef.current) return;
        const cur = videoRef.current;
        if (!cur) return;
        try {
          const src = cur.src;
          cur.src = '';
          cur.src = src;
          cur.load();
          if (isActive) cur.play().catch(() => {});
        } catch {}
      }, 1500 * retryCountRef.current);
      trackTimer(id);
    } else {
      setHasError(true);
      onError?.(reel);
    }
  }, [isActive, onError, reel, trackTimer]);

  const handleStalled = useCallback(() => {
    const v = videoRef.current;
    if (!v || !isActive) return;
    // ممكن الشبكة وقعت — جرّب نكمل بعد ثانية
    const id = window.setTimeout(() => {
      pendingTimersRef.current.delete(id);
      if (!isMountedRef.current) return;
      const cur = videoRef.current;
      if (cur && cur.paused === false && cur.readyState < 3) {
        try { cur.load(); } catch {}
      }
    }, 1500);
    trackTimer(id);
  }, [isActive, trackTimer]);

  /* ---------- 3) Tap handling (single = pause/play, double = like) ---------- */
  // ✅ v59.13.12 FIX #3: double-tap يعمل LIKE فقط (لا yet unlike)
  // سابقاً: لو الريل مُعجَب به → double-tap ثانية كان يلغي الإعجاب.
  const triggerHeart = useCallback(() => {
    setShowHeart(true);
    if (!reel?.isLiked) {
      onLike?.(reel);
    }
    const id = window.setTimeout(() => {
      pendingTimersRef.current.delete(id);
      if (isMountedRef.current) setShowHeart(false);
    }, 900);
    trackTimer(id);
  }, [onLike, reel, trackTimer]);

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
    const id = window.setTimeout(() => {
      pendingTimersRef.current.delete(id);
      if (isMountedRef.current) setShowPauseIcon(false);
    }, 700);
    trackTimer(id);
  }, [trackTimer]);

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
    // احترام RTL: لو البروجرس يتحرّك من اليمين، اعكس الحساب
    const isRTL = (typeof document !== 'undefined') && document.documentElement.getAttribute('dir') === 'rtl';
    const raw = (pageX - rect.left) / rect.width;
    const ratio = Math.max(0, Math.min(1, isRTL ? 1 - raw : raw));
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

  // ✅ v59.13.16 تصحيح ترتيب hooks: نقل wakeImmersion قبل onProgressKey لتجنّب TDZ
  const wakeImmersion = useCallback(() => {
    lastImmersionRef.current = Date.now();
    setImmersive(false);
  }, []);

  // ✅ v59.13.15 FIX #4: دعم لوحة المفاتيح لشريط التقدّم (role="slider" WAI-ARIA)
  const onProgressKey = useCallback((event) => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    let next = v.currentTime;
    const step = Math.max(1, v.duration * 0.05); // 5% أو 1 ثانية حد أدنى
    const bigStep = Math.max(5, v.duration * 0.1); // 10% لـ PageUp/PageDown
    const isRTL = (typeof document !== 'undefined') && document.documentElement.getAttribute('dir') === 'rtl';
    const fwd = isRTL ? 'ArrowLeft' : 'ArrowRight';
    const back = isRTL ? 'ArrowRight' : 'ArrowLeft';
    switch (event.key) {
      case fwd: case 'ArrowUp': next = Math.min(v.duration, v.currentTime + step); break;
      case back: case 'ArrowDown': next = Math.max(0, v.currentTime - step); break;
      case 'PageUp': next = Math.min(v.duration, v.currentTime + bigStep); break;
      case 'PageDown': next = Math.max(0, v.currentTime - bigStep); break;
      case 'Home': next = 0; break;
      case 'End': next = v.duration; break;
      default: return;
    }
    event.preventDefault();
    event.stopPropagation();
    try {
      v.currentTime = next;
      setProgress((next / v.duration) * 100);
      wakeImmersion();
    } catch { /* ignore */ }
  }, [wakeImmersion]);

  /* ---------- 6) Cleanup on unmount ---------- */
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
      // ✅ v59.13.5 FIX #3: إلغاء كل المؤقّتات المعلّقة لمنع الوصول لـ video مفرغ
      pendingTimersRef.current.forEach((id) => window.clearTimeout(id));
      pendingTimersRef.current.clear();
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
        style={videoFilterStyle}
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

      {/* ✅ v33+1: زر فلاتر الريل + لوحة الاختيار */}
      <button
        type="button"
        className="reel-filter-btn"
        onClick={(e) => { e.stopPropagation(); setShowFilterPanel((s) => !s); wakeImmersion(); }}
        aria-label="فلاتر الفيديو"
        aria-expanded={showFilterPanel}
        title="فلاتر وتحسينات"
      >
        <span aria-hidden="true">✨</span>
        <span>{currentFilter?.label || 'فلاتر'}</span>
      </button>

      {showFilterPanel ? (
        <div
          className="reel-filter-panel"
          dir="rtl"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-label="اختيار فلتر الفيديو"
        >
          <div className="reel-filter-panel-head">
            <strong>فلاتر وتحسينات</strong>
            <button
              type="button"
              className="reel-filter-close"
              onClick={() => setShowFilterPanel(false)}
              aria-label="إغلاق"
            >✕</button>
          </div>
          <div className="reel-filter-grid">
            {REEL_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                className={`reel-filter-chip ${filterId === f.id ? 'active' : ''}`}
                onClick={() => {
                  setFilterId(f.id);
                  saveFilter(f.id);
                }}
              >
                <span
                  className="reel-filter-thumb"
                  style={{
                    filter: f.filter !== 'none' ? f.filter : 'none',
                    WebkitFilter: f.filter !== 'none' ? f.filter : 'none',
                    backgroundImage: reel?.poster ? `url(${reel.poster})` : undefined,
                  }}
                  aria-hidden="true"
                />
                <span className="reel-filter-label">{f.label}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

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

      {/* Progress bar (mouse + touch + keyboard) */}
      {/* ✅ v59.13.15 FIX #4: إضافة tabIndex + onKeyDown + aria-valuetext لدعم لوحة المفاتيح وقارئات الشاشة */}
      <div
        className="reel-progress"
        onClick={onProgressTap}
        onTouchEnd={onProgressTap}
        onKeyDown={onProgressKey}
        role="slider"
        tabIndex={isActive ? 0 : -1}
        aria-label="مؤشر تقدّم الريل — استخدم الأسهم للتقدّم والرجوع"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
        aria-valuetext={`${Math.round(progress)} بالمئة`}
          aria-orientation="horizontal"
      >
        <div className="reel-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {immersive && (
        <div className="reel-hint" aria-hidden="true">اضغط للتفاعل ↑</div>
      )}
    </article>
  );
}
