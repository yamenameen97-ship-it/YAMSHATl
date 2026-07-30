import { memo, useCallback, useEffect, useRef, useState } from 'react';

/**
 * FeedVideoPlayer (v88.61 — Facebook-style feed video)
 * -----------------------------------------------------
 * السلوك المطلوب (مطابق لفيسبوك):
 *   1) عند ظهور الفيديو في مجال الرؤية (≥ 60%) يبدأ التشغيل تلقائياً بصوت مكتوم.
 *   2) عند خروج الفيديو من مجال الرؤية (< 40%) يتوقف فوراً.
 *   3) زر ميكروفون عائم فوق الفيديو → عند الضغط عليه يفتح/يقفل الصوت مع بقاء الفيديو في مكانه.
 *   4) النقر على جسم الفيديو → يفتح الوضع الكامل (Fullscreen داخلي) بصوت وصورة.
 *   5) في الوضع الكامل يظهر زر إغلاق (×) في الزاوية → يرجع للصفحة والتمرير طبيعي.
 *   6) في الوضع الكامل يعمل الصوت افتراضياً + شريط تقدم + زر تشغيل/إيقاف.
 *
 * لا يعتمد على مكتبات خارجية، ولا يكسر التمرير (touch-action: pan-y على الحاوية الأم).
 */

function MuteIcon({ muted }) {
  if (muted) {
    return (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <line x1="23" y1="9" x2="17" y2="15" />
        <line x1="17" y1="9" x2="23" y2="15" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true">
      <polygon points="6 4 20 12 6 20 6 4" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true">
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function guessMime(url) {
  const u = String(url || '').toLowerCase();
  if (u.endsWith('.webm')) return 'video/webm';
  if (u.endsWith('.mov') || u.endsWith('.m4v')) return 'video/quicktime';
  if (u.endsWith('.mkv')) return 'video/x-matroska';
  if (u.endsWith('.m3u8')) return 'application/vnd.apple.mpegurl';
  return 'video/mp4';
}

function fmtTime(t) {
  if (!t || Number.isNaN(t) || !Number.isFinite(t)) return '0:00';
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function FeedVideoPlayer({ src, poster }) {
  const inlineVideoRef = useRef(null);
  const fsVideoRef = useRef(null);
  const containerRef = useRef(null);

  const [muted, setMuted] = useState(true);
  const [inViewPlaying, setInViewPlaying] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [fsPlaying, setFsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  /* ==========================================================
     1) IntersectionObserver → تشغيل/إيقاف حسب الظهور (مثل فيسبوك)
     ========================================================== */
  useEffect(() => {
    if (fullscreen) return undefined; // لا نستمع أثناء الوضع الكامل
    const node = containerRef.current;
    const vid = inlineVideoRef.current;
    if (!node || !vid || typeof IntersectionObserver === 'undefined') return undefined;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            // ظاهر بشكل كافٍ → شغّل بصوت مكتوم
            vid.muted = muted; // احترم اختيار المستخدم إن غيّره
            const p = vid.play();
            if (p && p.catch) p.catch(() => { /* autoplay blocked */ });
            setInViewPlaying(true);
          } else if (!entry.isIntersecting || entry.intersectionRatio < 0.4) {
            // خرج من الرؤية → أوقف فوراً
            try { vid.pause(); } catch { /* ignore */ }
            setInViewPlaying(false);
          }
        }
      },
      { threshold: [0, 0.4, 0.6, 1] }
    );
    io.observe(node);
    return () => io.disconnect();
  }, [fullscreen, muted]);

  /* ==========================================================
     2) عند دخول الوضع الكامل: أوقف الـ inline وشغّل الـ fs بصوت
     ========================================================== */
  useEffect(() => {
    const inline = inlineVideoRef.current;
    const fs = fsVideoRef.current;

    if (fullscreen) {
      // خذ الوقت الحالي من inline إلى fs
      try {
        if (inline) inline.pause();
      } catch { /* ignore */ }
      if (fs) {
        try {
          fs.currentTime = inline?.currentTime || 0;
          fs.muted = false;
          const p = fs.play();
          if (p && p.catch) p.catch(() => {});
          setFsPlaying(true);
        } catch { /* ignore */ }
      }
      // منع تمرير الصفحة خلف الـ overlay
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prevOverflow; };
    }

    // عند الخروج من الوضع الكامل: أعد التزامن للـ inline
    if (inline && fs) {
      try {
        inline.currentTime = fs.currentTime || 0;
      } catch { /* ignore */ }
    }
    return undefined;
  }, [fullscreen]);

  /* ==========================================================
     3) تحديث شريط التقدم في الوضع الكامل
     ========================================================== */
  useEffect(() => {
    if (!fullscreen) return undefined;
    const fs = fsVideoRef.current;
    if (!fs) return undefined;
    const onTime = () => {
      const d = fs.duration || 0;
      setDuration(d);
      setCurrentTime(fs.currentTime || 0);
      setProgress(d ? (fs.currentTime / d) * 100 : 0);
    };
    const onMeta = () => setDuration(fs.duration || 0);
    const onPlay = () => setFsPlaying(true);
    const onPause = () => setFsPlaying(false);
    fs.addEventListener('timeupdate', onTime);
    fs.addEventListener('loadedmetadata', onMeta);
    fs.addEventListener('play', onPlay);
    fs.addEventListener('pause', onPause);
    return () => {
      fs.removeEventListener('timeupdate', onTime);
      fs.removeEventListener('loadedmetadata', onMeta);
      fs.removeEventListener('play', onPlay);
      fs.removeEventListener('pause', onPause);
    };
  }, [fullscreen]);

  /* ==========================================================
     4) زر ESC لإغلاق الوضع الكامل
     ========================================================== */
  useEffect(() => {
    if (!fullscreen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setFullscreen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fullscreen]);

  // زر الميكروفون
  const toggleMute = useCallback((e) => {
    e?.stopPropagation?.();
    e?.preventDefault?.();
    const vid = inlineVideoRef.current;
    setMuted((prev) => {
      const next = !prev;
      if (vid) {
        vid.muted = next;
        // إذا فتح الصوت وأوقف autoplay بسبب سياسة المتصفح، جرّب التشغيل مرة أخرى
        if (!next) {
          const p = vid.play();
          if (p && p.catch) p.catch(() => {});
        }
      }
      return next;
    });
  }, []);

  // فتح الوضع الكامل
  const openFullscreen = useCallback((e) => {
    e?.stopPropagation?.();
    setFullscreen(true);
  }, []);

  // إغلاق الوضع الكامل
  const closeFullscreen = useCallback((e) => {
    e?.stopPropagation?.();
    setFullscreen(false);
  }, []);

  // تشغيل/إيقاف داخل الوضع الكامل
  const toggleFsPlay = useCallback((e) => {
    e?.stopPropagation?.();
    const fs = fsVideoRef.current;
    if (!fs) return;
    if (fs.paused) {
      const p = fs.play();
      if (p && p.catch) p.catch(() => {});
    } else {
      fs.pause();
    }
  }, []);

  // Seek في الوضع الكامل
  const onSeekBar = useCallback((e) => {
    e.stopPropagation();
    const fs = fsVideoRef.current;
    if (!fs || !fs.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = ((e.clientX - rect.left) / rect.width);
    fs.currentTime = Math.max(0, Math.min(fs.duration, pct * fs.duration));
  }, []);

  const mime = guessMime(src);

  return (
    <>
      {/* ============ الفيديو داخل البطاقة (Inline) ============ */}
      <div
        ref={containerRef}
        className="ym-feed-video"
        onClick={openFullscreen}
        role="button"
        tabIndex={0}
        aria-label="فتح الفيديو"
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openFullscreen(e); } }}
      >
        <video
          ref={inlineVideoRef}
          poster={poster || undefined}
          muted={muted}
          playsInline
          webkit-playsinline="true"
          x5-playsinline="true"
          preload="metadata"
          loop
          crossOrigin="anonymous"
          onError={(e) => {
            try {
              const el = e.currentTarget;
              const parent = el.parentNode;
              el.style.display = 'none';
              if (parent && !parent.querySelector('.ym-fv-fallback')) {
                const fb = document.createElement('div');
                fb.className = 'ym-fv-fallback';
                fb.textContent = 'تعذّر تشغيل الفيديو';
                parent.appendChild(fb);
              }
            } catch { /* ignore */ }
          }}
        >
          <source src={src} type={mime} />
          متصفحك لا يدعم تشغيل الفيديو.
        </video>

        {/* زر الميكروفون العائم */}
        <button
          type="button"
          className="ym-fv-mic"
          aria-label={muted ? 'تشغيل الصوت' : 'كتم الصوت'}
          onClick={toggleMute}
        >
          <MuteIcon muted={muted} />
        </button>

        {/* شارة "قيد التشغيل" خفيفة عند التشغيل التلقائي */}
        {inViewPlaying && (
          <div className="ym-fv-live-dot" aria-hidden="true">
            <span />
          </div>
        )}
      </div>

      {/* ============ الوضع الكامل (Overlay) ============ */}
      {fullscreen && (
        <div
          className="ym-fv-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="عارض الفيديو"
          onClick={closeFullscreen}
        >
          <div className="ym-fv-overlay-inner" onClick={(e) => e.stopPropagation()}>
            <video
              ref={fsVideoRef}
              poster={poster || undefined}
              playsInline
              webkit-playsinline="true"
              x5-playsinline="true"
              preload="auto"
              loop
              autoPlay
              crossOrigin="anonymous"
              onClick={toggleFsPlay}
            >
              <source src={src} type={mime} />
              متصفحك لا يدعم تشغيل الفيديو.
            </video>

            {/* زر الإغلاق (زاوية الفيديو) */}
            <button
              type="button"
              className="ym-fv-close"
              aria-label="إغلاق"
              onClick={closeFullscreen}
            >
              <CloseIcon />
            </button>

            {/* شريط التحكم السفلي */}
            <div className="ym-fv-controls" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="ym-fv-play"
                aria-label={fsPlaying ? 'إيقاف' : 'تشغيل'}
                onClick={toggleFsPlay}
              >
                {fsPlaying ? <PauseIcon /> : <PlayIcon />}
              </button>

              <div className="ym-fv-time">{fmtTime(currentTime)}</div>

              <div className="ym-fv-progress" onClick={onSeekBar}>
                <div className="ym-fv-progress-fill" style={{ width: `${progress}%` }} />
              </div>

              <div className="ym-fv-time">{fmtTime(duration)}</div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        /* ============ الحاوية Inline ============ */
        .ym-feed-video {
          position: relative;
          width: 100%;
          background: #000;
          border-radius: 12px;
          overflow: hidden;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          /* ⚠️ مهم: نسمح بالتمرير العمودي فوق الفيديو (لا نبتلع اللمس) */
          touch-action: pan-y;
        }
        .ym-feed-video video {
          width: 100%;
          height: auto;
          max-height: min(78dvh, 720px);
          object-fit: contain;
          display: block;
          background: #000;
          /* لا تتفاعل مع اللمس بشكل يعطّل السحب */
          pointer-events: auto;
        }
        .ym-fv-fallback {
          padding: 24px;
          text-align: center;
          color: #9CA3AF;
          background: linear-gradient(135deg, #1a1f33, #0f1422);
          border-radius: 8px;
        }

        /* ============ زر الميكروفون العائم (v88.99 — الزاوية العلوية اليسرى مثل YouTube) ============ */
        .ym-fv-mic {
          position: absolute;
          top: 12px;
          inset-inline-start: 12px;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.25);
          background: rgba(0,0,0,0.55);
          color: #fff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          transition: transform 0.15s ease, background 0.15s ease;
          z-index: 3;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }
        .ym-fv-mic:hover { background: rgba(0,0,0,0.75); }
        .ym-fv-mic:active { transform: scale(0.92); }

        /* نقطة تشغيل صغيرة (v88.99 — نُقلت لأسفل-يسار لتفادي التعارض مع زر الصوت) */
        .ym-fv-live-dot {
          position: absolute;
          bottom: 12px;
          inset-inline-start: 12px;
          z-index: 2;
        }
        .ym-fv-live-dot span {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #22C55E;
          box-shadow: 0 0 6px #22C55E;
          animation: ym-fv-blink 1.4s ease-in-out infinite;
        }
        @keyframes ym-fv-blink {
          0%, 100% { opacity: 0.35; }
          50% { opacity: 1; }
        }

        /* ============ Overlay الوضع الكامل ============ */
        .ym-fv-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.96);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: ym-fv-fade 180ms ease-out;
        }
        @keyframes ym-fv-fade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .ym-fv-overlay-inner {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .ym-fv-overlay-inner video {
          width: 100%;
          height: 100%;
          max-width: 100vw;
          max-height: 100vh;
          object-fit: contain;
          background: #000;
          cursor: pointer;
        }

        /* زر الإغلاق في الزاوية */
        .ym-fv-close {
          position: absolute;
          top: max(12px, env(safe-area-inset-top));
          inset-inline-end: max(12px, env(safe-area-inset-right));
          width: 42px;
          height: 42px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.2);
          background: rgba(0,0,0,0.55);
          color: #fff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 5;
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          -webkit-tap-highlight-color: transparent;
          transition: background 0.15s ease, transform 0.15s ease;
        }
        .ym-fv-close:hover { background: rgba(0,0,0,0.85); }
        .ym-fv-close:active { transform: scale(0.92); }

        /* شريط التحكم السفلي في الوضع الكامل */
        .ym-fv-controls {
          position: absolute;
          left: 0;
          right: 0;
          bottom: max(16px, env(safe-area-inset-bottom));
          padding: 10px 16px;
          display: flex;
          align-items: center;
          gap: 10px;
          direction: ltr;
          z-index: 5;
          background: linear-gradient(to top, rgba(0,0,0,0.65), transparent);
        }
        .ym-fv-play {
          background: none;
          border: 0;
          color: #fff;
          cursor: pointer;
          padding: 6px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          -webkit-tap-highlight-color: transparent;
        }
        .ym-fv-play:active { transform: scale(0.94); }
        .ym-fv-time {
          color: #fff;
          font-size: 12px;
          font-variant-numeric: tabular-nums;
          min-width: 36px;
          text-align: center;
        }
        .ym-fv-progress {
          flex: 1;
          height: 5px;
          background: rgba(255,255,255,0.22);
          border-radius: 3px;
          cursor: pointer;
          overflow: hidden;
        }
        .ym-fv-progress-fill {
          height: 100%;
          background: #8B5CF6;
          border-radius: 3px;
          transition: width 0.15s linear;
        }

        @media (max-width: 480px) {
          .ym-fv-mic { width: 38px; height: 38px; top: 10px; }
          .ym-fv-close { width: 40px; height: 40px; }
        }
      `}</style>
    </>
  );
}

export default memo(FeedVideoPlayer);
