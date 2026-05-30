import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import UniversalPlayer from './UniversalPlayer.jsx';
import videoService from '../../services/video/videoService.js';

/**
 * ReelsPlayer — vertical scroll reels container.
 *
 * Props:
 *   reels           : [{ id, videoUrl, poster, ...meta }]
 *   onLike          : (reel) => void
 *   onComment       : (reel) => void
 *   onShare         : (reel) => void
 *   onVisible       : (reel, index) => void (e.g. for view counting)
 *   renderOverlay   : (reel, index) => ReactNode (avatar/caption/actions)
 *   className       : string
 *
 * Behaviors:
 *   - vertical scroll-snap
 *   - preload next reel video metadata
 *   - only the visible reel plays (via UniversalPlayer smartPause)
 *   - infinite-scroll friendly (parent controls reels array)
 */
export default function ReelsPlayer({
  reels = [],
  onLike,
  onComment,
  onShare,
  onVisible,
  renderOverlay,
  className = '',
}) {
  const containerRef = useRef(null);
  const itemRefs = useRef(new Map());
  const [activeIndex, setActiveIndex] = useState(0);

  // Track which reel is on-screen
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
        if (bestRatio >= 0.6 && bestIdx !== activeIndex) {
          setActiveIndex(bestIdx);
          if (typeof onVisible === 'function' && reels[bestIdx]) {
            onVisible(reels[bestIdx], bestIdx);
          }
        }
      },
      { root: node, threshold: [0, 0.6, 1] }
    );
    itemRefs.current.forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, [reels, activeIndex, onVisible]);

  // Preload next reel
  useEffect(() => {
    const next = reels[activeIndex + 1];
    if (next?.videoUrl) videoService.preload(next.videoUrl);
  }, [activeIndex, reels]);

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

  return (
    <div
      ref={containerRef}
      className={`yamshat-reels-container ${className}`}
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
      }}
    >
      {reels.map((reel, idx) => (
        <div
          key={reel.id || idx}
          ref={setItemRef(idx)}
          data-idx={idx}
          style={itemStyle}
        >
          <UniversalPlayer
            variant="reel"
            src={reel.videoUrl || reel.url}
            poster={reel.poster}
            isActive={idx === activeIndex}
            onDoubleTapLike={() => typeof onLike === 'function' && onLike(reel)}
          />
          {/* Overlay (avatar, caption, actions) */}
          {typeof renderOverlay === 'function' && (
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
            }}>
              <div style={{ pointerEvents: 'auto' }}>
                {renderOverlay(reel, idx, { onLike, onComment, onShare })}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
