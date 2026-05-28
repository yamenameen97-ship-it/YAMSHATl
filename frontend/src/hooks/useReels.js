import { useState, useEffect, useCallback, useRef } from 'react';

export function useReels(initialReels = []) {
  const [reels, setReels] = useState(initialReels);
  const [activeIndex, setActiveIndex] = useState(0);
  const [retryCount, setRetryCount] = useState({});
  const prefetchQueue = useRef(new Set());

  // Prefetch strategy
  useEffect(() => {
    const nextReels = reels.slice(activeIndex + 1, activeIndex + 4);
    nextReels.forEach(reel => {
      if (!prefetchQueue.current.has(reel.videoUrl)) {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.as = 'video';
        link.href = reel.videoUrl;
        document.head.appendChild(link);
        prefetchQueue.current.add(reel.videoUrl);
      }
    });
  }, [activeIndex, reels]);

  // Retry video loading logic
  const handleVideoError = useCallback((reelId) => {
    const currentRetries = retryCount[reelId] || 0;
    if (currentRetries < 3) {
      setTimeout(() => {
        setRetryCount(prev => ({ ...prev, [reelId]: currentRetries + 1 }));
        // Force refresh URL or trigger re-render
      }, 2000);
    }
  }, [retryCount]);

  // Visibility optimization & Lazy unload
  const getReelStatus = (index) => {
    const distance = Math.abs(index - activeIndex);
    if (distance === 0) return 'active';
    if (distance <= 2) return 'preload';
    return 'unloaded'; // Lazy unload for memory management
  };

  return {
    reels,
    activeIndex,
    setActiveIndex,
    handleVideoError,
    getReelStatus
  };
}
