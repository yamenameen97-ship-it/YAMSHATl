import { useEffect, useRef } from 'react';

export default function useInfiniteScroll({
  enabled = true,
  hasMore = true,
  isLoading = false,
  onLoadMore,
  root = null,
  rootMargin = '500px 0px',
  threshold = 0.01,
} = {}) {
  const targetRef = useRef(null);
  const onLoadMoreRef = useRef(onLoadMore);
  const lockedRef = useRef(false);

  useEffect(() => {
    onLoadMoreRef.current = onLoadMore;
  }, [onLoadMore]);

  useEffect(() => {
    if (!enabled || !hasMore) return undefined;
    const node = targetRef.current;
    if (!node) return undefined;

    const releaseLock = () => {
      window.setTimeout(() => {
        lockedRef.current = false;
      }, 220);
    };

    const triggerLoad = () => {
      if (lockedRef.current || isLoading) return;
      lockedRef.current = true;
      Promise.resolve(onLoadMoreRef.current?.()).finally(releaseLock);
    };

    if (typeof window !== 'undefined' && typeof window.IntersectionObserver === 'function') {
      const observer = new IntersectionObserver((entries) => {
        const firstEntry = entries[0];
        if (firstEntry?.isIntersecting) triggerLoad();
      }, {
        root,
        rootMargin,
        threshold,
      });

      observer.observe(node);
      return () => observer.disconnect();
    }

    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        const rect = node.getBoundingClientRect();
        if (rect.top <= window.innerHeight + 320) triggerLoad();
        ticking = false;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [enabled, hasMore, isLoading, root, rootMargin, threshold]);

  return targetRef;
}
