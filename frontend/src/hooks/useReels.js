import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

/**
 * useReels — hook محسّن لإدارة الريلز
 * ✓ Prefetch ذكي للريلز التالية (3 ريلز قدّام)
 * ✓ Cleanup للروابط القديمة عشان مياكلش الميموري
 * ✓ Retry logic مع exponential backoff
 * ✓ تتبع الـ active index بدقة
 * ✓ Lazy unload للريلز البعيدة (memory management)
 * ✓ priority hints + connection-aware prefetch (يقلل البريفتش على 3G/2G)
 */
export function useReels(initialReels = []) {
  const [reels, setReels] = useState(initialReels);
  const [activeIndex, setActiveIndex] = useState(0);
  const [retryCount, setRetryCount] = useState({});
  const prefetchQueue = useRef(new Map()); // url -> linkElement
  const PREFETCH_WINDOW = 3;     // كام ريل قدّام نعمله prefetch
  const KEEP_WINDOW = 5;          // أبعد مسافة نسيب فيها الـ link قبل ما نمسحه
  const MAX_RETRIES = 3;

  // sync external reels
  useEffect(() => {
    if (Array.isArray(initialReels) && initialReels.length !== reels.length) {
      setReels(initialReels);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialReels]);

  // connection-aware prefetch (محافظة على البيانات على 2G/3G/save-data)
  const shouldPrefetch = useMemo(() => {
    if (typeof navigator === 'undefined') return true;
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!conn) return true;
    if (conn.saveData) return false;
    const slow = ['slow-2g', '2g', '3g'];
    return !slow.includes(conn.effectiveType);
  }, []);

  /* -------- Prefetch / Cleanup -------- */
  useEffect(() => {
    if (!Array.isArray(reels) || reels.length === 0) return;

    // (1) prefetch الـ window الجاي
    if (shouldPrefetch) {
      const window_ = reels.slice(activeIndex + 1, activeIndex + 1 + PREFETCH_WINDOW);
      window_.forEach((reel, i) => {
        const url = reel?.videoUrl || reel?.url;
        if (!url || prefetchQueue.current.has(url)) return;
        try {
          const link = document.createElement('link');
          link.rel = 'prefetch';
          link.href = url;
          // priority hint: الأقرب الأعلى أولوية
          if (i === 0) link.setAttribute('fetchpriority', 'high');
          link.crossOrigin = 'anonymous';
          document.head.appendChild(link);
          prefetchQueue.current.set(url, link);
        } catch {
          // ignore
        }
      });
    }

    // (2) cleanup الروابط البعيدة (خارج KEEP_WINDOW)
    const activeUrls = new Set(
      reels
        .slice(Math.max(0, activeIndex - KEEP_WINDOW), activeIndex + KEEP_WINDOW + 1)
        .map((r) => r?.videoUrl || r?.url)
        .filter(Boolean)
    );
    prefetchQueue.current.forEach((link, url) => {
      if (!activeUrls.has(url)) {
        try { link.parentNode?.removeChild(link); } catch {}
        prefetchQueue.current.delete(url);
      }
    });
  }, [activeIndex, reels, shouldPrefetch]);

  // cleanup كل الـ links لما الكومبوننت يتفصل
  useEffect(() => {
    return () => {
      prefetchQueue.current.forEach((link) => {
        try { link.parentNode?.removeChild(link); } catch {}
      });
      prefetchQueue.current.clear();
    };
  }, []);

  /* -------- Retry Logic مع exponential backoff -------- */
  const handleVideoError = useCallback((reelId) => {
    setRetryCount((prev) => {
      const current = prev[reelId] || 0;
      if (current >= MAX_RETRIES) return prev;
      const delay = Math.min(2000 * 2 ** current, 10000); // 2s, 4s, 8s
      setTimeout(() => {
        setRetryCount((p) => ({ ...p, [reelId]: (p[reelId] || 0) + 1 }));
      }, delay);
      return prev;
    });
  }, []);

  /* -------- حالة كل ريل (active / preload / unloaded) -------- */
  const getReelStatus = useCallback((index) => {
    const distance = Math.abs(index - activeIndex);
    if (distance === 0) return 'active';
    if (distance <= PREFETCH_WINDOW) return 'preload';
    if (distance <= KEEP_WINDOW) return 'idle';
    return 'unloaded';
  }, [activeIndex]);

  /* -------- Navigation helpers -------- */
  const next = useCallback(() => {
    setActiveIndex((i) => Math.min(i + 1, reels.length - 1));
  }, [reels.length]);

  const prev = useCallback(() => {
    setActiveIndex((i) => Math.max(i - 1, 0));
  }, []);

  return {
    reels,
    setReels,
    activeIndex,
    setActiveIndex,
    handleVideoError,
    getReelStatus,
    retryCount,
    next,
    prev,
  };
}

export default useReels;
