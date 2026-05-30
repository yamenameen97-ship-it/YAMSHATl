import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalizeItems(items, item) {
  if (Array.isArray(items) && items.length) {
    return items.map((entry, index) => ({
      id: entry.id || `${entry.url || 'media'}-${index}`,
      title: entry.title || 'الوسائط',
      type: entry.type || 'image',
      url: entry.url,
      caption: entry.caption || '',
    })).filter((entry) => Boolean(entry.url));
  }
  if (item?.url) {
    return [{
      id: item.id || item.url,
      title: item.title || 'الوسائط',
      type: item.type || 'image',
      url: item.url,
      caption: item.caption || '',
    }];
  }
  return [];
}

export default function MediaViewerModal({ item, items = [], initialIndex = 0, onClose }) {
  const mediaItems = useMemo(() => normalizeItems(items, item), [item, items]);
  const [currentIndex, setCurrentIndex] = useState(clamp(initialIndex, 0, Math.max(0, mediaItems.length - 1)));
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isEntering, setIsEntering] = useState(true);
  const [gestureState, setGestureState] = useState({ mode: 'idle', startX: 0, startY: 0, lastX: 0, lastY: 0, deltaX: 0, deltaY: 0, pinchDistance: 0, pinchZoom: 1 });
  const overlayRef = useRef(null);
  const mediaRef = useRef(null);

  const open = mediaItems.length > 0;
  const currentItem = mediaItems[currentIndex] || null;
  const hasNavigation = mediaItems.length > 1;

  const resetTransform = useCallback(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  const goNext = useCallback(() => {
    if (!hasNavigation) return;
    setCurrentIndex((prev) => (prev + 1) % mediaItems.length);
    resetTransform();
  }, [hasNavigation, mediaItems.length, resetTransform]);

  const goPrevious = useCallback(() => {
    if (!hasNavigation) return;
    setCurrentIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);
    resetTransform();
  }, [hasNavigation, mediaItems.length, resetTransform]);

  const closeViewer = useCallback(() => {
    setIsEntering(false);
    window.setTimeout(() => onClose?.(), 180);
  }, [onClose]);

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event) => {
      if (event.key === 'Escape') closeViewer();
      if (event.key === 'ArrowRight') goNext();
      if (event.key === 'ArrowLeft') goPrevious();
      if (event.key === '+') setZoom((prev) => clamp(prev + 0.2, 1, 4));
      if (event.key === '-') setZoom((prev) => clamp(prev - 0.2, 1, 4));
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [closeViewer, goNext, goPrevious, open]);

  useEffect(() => {
    setCurrentIndex(clamp(initialIndex, 0, Math.max(0, mediaItems.length - 1)));
    resetTransform();
  }, [initialIndex, mediaItems.length, resetTransform]);

  useEffect(() => {
    if (!open) return undefined;
    const timer = window.setTimeout(() => setIsEntering(false), 240);
    return () => window.clearTimeout(timer);
  }, [open, currentIndex]);

  const handleWheel = useCallback((event) => {
    if (currentItem?.type !== 'image') return;
    event.preventDefault();
    const direction = event.deltaY < 0 ? 0.2 : -0.2;
    setZoom((prev) => clamp(prev + direction, 1, 4));
  }, [currentItem?.type]);

  const handleTouchStart = useCallback((event) => {
    if (event.touches.length === 2) {
      const [first, second] = event.touches;
      const distance = Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY);
      setGestureState({
        mode: 'pinch',
        startX: 0,
        startY: 0,
        lastX: 0,
        lastY: 0,
        deltaX: 0,
        deltaY: 0,
        pinchDistance: distance,
        pinchZoom: zoom,
      });
      return;
    }
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      setGestureState({
        mode: zoom > 1 ? 'pan' : 'swipe',
        startX: touch.clientX,
        startY: touch.clientY,
        lastX: touch.clientX,
        lastY: touch.clientY,
        deltaX: 0,
        deltaY: 0,
        pinchDistance: 0,
        pinchZoom: zoom,
      });
    }
  }, [zoom]);

  const handleTouchMove = useCallback((event) => {
    if (gestureState.mode === 'pinch' && event.touches.length === 2) {
      const [first, second] = event.touches;
      const distance = Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY);
      const scale = gestureState.pinchDistance ? distance / gestureState.pinchDistance : 1;
      setZoom(clamp(gestureState.pinchZoom * scale, 1, 4));
      return;
    }

    if (event.touches.length !== 1) return;
    const touch = event.touches[0];
    const deltaX = touch.clientX - gestureState.startX;
    const deltaY = touch.clientY - gestureState.startY;

    if (gestureState.mode === 'pan') {
      event.preventDefault();
      setOffset({ x: deltaX, y: deltaY });
      return;
    }

    setGestureState((prev) => ({ ...prev, lastX: touch.clientX, lastY: touch.clientY, deltaX, deltaY }));
  }, [gestureState]);

  const handleTouchEnd = useCallback(() => {
    if (gestureState.mode === 'swipe' && Math.abs(gestureState.deltaX) > 70 && Math.abs(gestureState.deltaX) > Math.abs(gestureState.deltaY)) {
      if (gestureState.deltaX < 0) goNext();
      else goPrevious();
    }
    if (gestureState.mode === 'pan') {
      setOffset((prev) => ({ x: prev.x * 0.6, y: prev.y * 0.6 }));
    }
    setGestureState({ mode: 'idle', startX: 0, startY: 0, lastX: 0, lastY: 0, deltaX: 0, deltaY: 0, pinchDistance: 0, pinchZoom: zoom });
  }, [gestureState, goNext, goPrevious, zoom]);

  const requestFullscreen = useCallback(() => {
    const target = overlayRef.current;
    if (!target) return;
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
      return;
    }
    target.requestFullscreen?.().catch(() => {});
  }, []);

  if (!open || !currentItem) return null;

  return createPortal(
    <div
      ref={overlayRef}
      className={`yam-media-viewer ${isEntering ? 'entering' : ''}`}
      onClick={(event) => {
        if (event.target === overlayRef.current) closeViewer();
      }}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      role="dialog"
      aria-modal="true"
    >
      <div className="yam-media-topbar">
        <div className="yam-media-counter">{currentIndex + 1} / {mediaItems.length}</div>
        <div className="yam-media-actions">
          <button type="button" onClick={() => setZoom((prev) => clamp(prev - 0.2, 1, 4))}>−</button>
          <button type="button" onClick={() => setZoom((prev) => clamp(prev + 0.2, 1, 4))}>+</button>
          <button type="button" onClick={requestFullscreen}>⤢</button>
          <button type="button" onClick={closeViewer}>✕</button>
        </div>
      </div>

      <div className="yam-media-stage">
        {hasNavigation ? <button type="button" className="yam-media-nav prev" onClick={goPrevious}>←</button> : null}
        <div className="yam-media-frame" style={{ transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${zoom})` }}>
          {currentItem.type === 'video' ? (
            <video
              ref={mediaRef}
              src={currentItem.url}
              className="yam-media-asset"
              controls
              autoPlay
              playsInline
              preload="metadata"
            />
          ) : (
            <img ref={mediaRef} src={currentItem.url} alt={currentItem.title || 'media'} className="yam-media-asset" />
          )}
        </div>
        {hasNavigation ? <button type="button" className="yam-media-nav next" onClick={goNext}>→</button> : null}
      </div>

      <div className="yam-media-caption">
        <strong>{currentItem.title}</strong>
        {currentItem.caption ? <span>{currentItem.caption}</span> : <span>اسحب يمين/شمال للتنقل، pinch للزووم، ودبل كليك من الفقاعة يفتح العرض الكامل.</span>}
      </div>

      <style>{`
        .yam-media-viewer {
          position: fixed;
          inset: 0;
          z-index: 10000;
          background: rgba(1, 4, 14, 0.98);
          display: grid;
          grid-template-rows: auto 1fr auto;
          backdrop-filter: blur(18px);
          animation: yamMediaFade 180ms ease;
        }
        .yam-media-viewer.entering .yam-media-frame {
          transform: translate3d(0, 18px, 0) scale(0.98) !important;
          opacity: 0.92;
        }
        .yam-media-topbar,
        .yam-media-caption {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 18px 22px;
          color: #fff;
        }
        .yam-media-caption {
          align-items: flex-start;
          flex-direction: column;
          justify-content: flex-start;
          color: rgba(255,255,255,0.82);
          font-size: 14px;
          background: linear-gradient(180deg, transparent, rgba(0,0,0,0.38));
        }
        .yam-media-actions {
          display: inline-flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .yam-media-actions button,
        .yam-media-nav,
        .yam-media-counter {
          min-height: 44px;
          min-width: 44px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.08);
          color: #fff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 16px 32px rgba(0,0,0,0.24);
          backdrop-filter: blur(18px);
        }
        .yam-media-counter {
          padding: 0 14px;
          font-weight: 800;
        }
        .yam-media-stage {
          position: relative;
          min-height: 0;
          display: grid;
          place-items: center;
          overflow-y:auto;
          padding: 20px 72px;
        }
        .yam-media-frame {
          max-width: min(94vw, 1240px);
          max-height: calc(100vh - 180px);
          transition: transform 200ms ease, opacity 200ms ease;
          will-change: transform;
        }
        .yam-media-asset {
          display: block;
          max-width: min(94vw, 1240px);
          max-height: calc(100vh - 180px);
          object-fit: contain;
          border-radius: 28px;
          box-shadow: 0 28px 70px rgba(0,0,0,0.45);
          background: rgba(255,255,255,0.02);
        }
        .yam-media-nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 2;
          font-size: 20px;
        }
        .yam-media-nav.prev { left: 20px; }
        .yam-media-nav.next { right: 20px; }
        @keyframes yamMediaFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @media (max-width: 720px) {
          .yam-media-topbar,
          .yam-media-caption {
            padding: 14px;
          }
          .yam-media-stage {
            padding: 14px 12px 20px;
          }
          .yam-media-nav {
            bottom: 76px;
            top: auto;
            transform: none;
          }
          .yam-media-nav.prev { left: 14px; }
          .yam-media-nav.next { right: 14px; }
        }
      `}</style>
    </div>,
    document.body,
  );
}
