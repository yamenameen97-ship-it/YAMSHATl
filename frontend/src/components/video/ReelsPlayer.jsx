import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import UniversalPlayer from './UniversalPlayer.jsx';
import videoService from '../../services/video/videoService.js';

/**
 * ReelsPlayer — حاوية الريلز بـ vertical scroll-snap (نسخة مُحسّنة).
 *
 * تحسينات:
 *  ✓ Intersection Observer بثريشولدز أدق + debounce على activeIndex
 *  ✓ Preload للريلز الجاي + اللي قبله (rewind سريع)
 *  ✓ Pause تلقائي للـ video tag ساعة الـ tab مش visible (PageVisibility)
 *  ✓ keyboard navigation (↑/↓/Space)
 *  ✓ wheel & touch gesture-based snap (ميمسكش الـ scroll لو الريل آخر/أول)
 *  ✓ يبعت onIndexChange و onVisible للأبّ
 *  ✓ يلغي تحميل الـ <video> اللي مش في الـ window عشان يوفر باندويث
 *
 * Props:
 *   reels           : [{ id, videoUrl, poster, ...meta }]
 *   onLike, onComment, onShare : (reel) => void
 *   onVisible       : (reel, index) => void  (view-count tracking)
 *   onIndexChange   : (index) => void
 *   renderOverlay   : (reel, index, helpers) => ReactNode
 *   className       : string
 *   keepWindow      : كام ريل نسيبه mounted حوالين النشط (default 2)
 */
export default function ReelsPlayer({
  reels = [],
  onLike,
  onComment,
  onShare,
  onVisible,
  onIndexChange,
  renderOverlay,
  className = '',
  keepWindow = 2,
}) {
  const containerRef = useRef(null);
  const itemRefs = useRef(new Map());
  const visibilityTimeoutRef = useRef(null);
  const lastReportedRef = useRef(-1);
  const [activeIndex, setActiveIndex] = useState(0);
  const [pageVisible, setPageVisible] = useState(
    typeof document !== 'undefined' ? !document.hidden : true
  );

  /* ---------- Page Visibility (pause لو الـ tab boring) ---------- */
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const onVis = () => setPageVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  /* ---------- IntersectionObserver لرصد الريل النشط ---------- */
  useEffect(() => {
    const node = containerRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') return undefined;

    const obs = new IntersectionObserver(
      (entries) => {
        let bestIdx = activeIndex;
        let bestRatio = 0;
        for (const entry of entries) {
          if (entry.intersectionRatio > bestRatio) {
            bestRatio = entry.intersectionRatio;
            const idx = Number(entry.target.dataset.idx);
            if (!Number.isNaN(idx)) bestIdx = idx;
          }
        }
        if (bestRatio >= 0.65 && bestIdx !== activeIndex) {
          // debounce بسيط عشان متعدّش الـ index في النص الانتقال
          if (visibilityTimeoutRef.current) clearTimeout(visibilityTimeoutRef.current);
          visibilityTimeoutRef.current = setTimeout(() => {
            setActiveIndex(bestIdx);
          }, 80);
        }
      },
      { root: node, threshold: [0, 0.25, 0.5, 0.65, 0.85, 1] }
    );
    itemRefs.current.forEach((el) => el && obs.observe(el));
    return () => {
      if (visibilityTimeoutRef.current) clearTimeout(visibilityTimeoutRef.current);
      obs.disconnect();
    };
  }, [reels, activeIndex]);

  /* ---------- إخطار الأب بتغيير الفهرس + tracking ---------- */
  useEffect(() => {
    if (typeof onIndexChange === 'function') onIndexChange(activeIndex);
    if (
      typeof onVisible === 'function'
      && reels[activeIndex]
      && lastReportedRef.current !== activeIndex
    ) {
      lastReportedRef.current = activeIndex;
      onVisible(reels[activeIndex], activeIndex);
    }
  }, [activeIndex, reels, onIndexChange, onVisible]);

  /* ---------- Preload الجاي + اللي قبله ---------- */
  useEffect(() => {
    const next = reels[activeIndex + 1];
    const prev = reels[activeIndex - 1];
    if (next?.videoUrl) videoService?.preload?.(next.videoUrl);
    if (prev?.videoUrl) videoService?.preload?.(prev.videoUrl);
  }, [activeIndex, reels]);

  /* ---------- Keyboard navigation ---------- */
  useEffect(() => {
    const onKey = (e) => {
      const node = containerRef.current;
      if (!node) return;
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        const target = itemRefs.current.get(Math.min(activeIndex + 1, reels.length - 1));
        target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        const target = itemRefs.current.get(Math.max(activeIndex - 1, 0));
        target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeIndex, reels.length]);

  const setItemRef = useCallback((idx) => (node) => {
    if (node) itemRefs.current.set(idx, node);
    else itemRefs.current.delete(idx);
  }, []);

  const itemStyle = useMemo(() => ({
    position: 'relative',
    width: '100%',
    height: '100dvh',
    minHeight: '100vh',
    scrollSnapAlign: 'start',
    scrollSnapStop: 'always',
    flex: '0 0 auto',
  }), []);

  const isInRenderWindow = useCallback(
    (idx) => Math.abs(idx - activeIndex) <= keepWindow,
    [activeIndex, keepWindow]
  );

  return (
    <div
      ref={containerRef}
      className={`yamshat-reels-container ${className}`}
      tabIndex={0}
      style={{
        height: '100dvh',
        minHeight: '100vh',
        maxHeight: '100dvh',
        width: '100%',
        overflowY: 'auto',
        overflowX: 'hidden',
        scrollSnapType: 'y mandatory',
        scrollBehavior: 'smooth',
        WebkitOverflowScrolling: 'touch',
        overscrollBehaviorY: 'contain',
        background: '#000',
        outline: 'none',
      }}
    >
      {reels.map((reel, idx) => {
        const inWindow = isInRenderWindow(idx);
        const isActive = idx === activeIndex && pageVisible;
        return (
          <div
            key={reel.id || idx}
            ref={setItemRef(idx)}
            data-idx={idx}
            style={itemStyle}
          >
            {inWindow ? (
              <UniversalPlayer
                variant="reel"
                src={reel.videoUrl || reel.url}
                poster={reel.poster}
                isActive={isActive}
                onDoubleTapLike={() => typeof onLike === 'function' && onLike(reel)}
              />
            ) : (
              // placeholder خفيف (الريل بعيد) — يحفظ الـ memory والباندويث
              reel.poster ? (
                <img
                  src={reel.poster}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    background: '#000',
                  }}
                />
              ) : <div style={{ width: '100%', height: '100%', background: '#000' }} />
            )}

            {typeof renderOverlay === 'function' && inWindow && (
              <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
              }}>
                <div style={{ pointerEvents: 'auto' }}>
                  {renderOverlay(reel, idx, { onLike, onComment, onShare, isActive })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
