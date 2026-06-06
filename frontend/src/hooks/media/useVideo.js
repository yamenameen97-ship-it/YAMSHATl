import { useEffect, useRef, useState, useCallback } from 'react';
import videoService from '../../services/video/videoService.js';

/**
 * useVideo({ src, autoplay, muted, loop, onVisible }) — controls a single <video>.
 * - Attaches HLS when needed
 * - Registers with the global videoService so only one video plays at a time
 * - Provides intersection-observer driven smart play/pause for reels
 */
export default function useVideo({
  src,
  autoplay = false,
  muted: initialMuted,
  loop = false,
  smartPause = false,
  threshold = 0.6,
} = {}) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [muted, setMuted] = useState(
    typeof initialMuted === 'boolean' ? initialMuted : videoService.getSettings().muted
  );
  const [isVisible, setIsVisible] = useState(false);

  // Attach source
  useEffect(() => {
    const el = videoRef.current;
    if (!el || !src) return undefined;
    let cleanup = () => {};
    let cancelled = false;
    videoService.attach(el, src).then((c) => {
      if (cancelled) {
        try { c(); } catch { /* ignore */ }
      } else {
        cleanup = c;
      }
    });
    return () => { cancelled = true; cleanup(); };
  }, [src]);

  // Apply muted
  useEffect(() => {
    const el = videoRef.current;
    if (el) el.muted = muted;
  }, [muted]);

  // Intersection observer for smart pause
  useEffect(() => {
    if (!smartPause) return undefined;
    const node = containerRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') return undefined;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          setIsVisible(entry.isIntersecting && entry.intersectionRatio >= threshold);
        }
      },
      { threshold: [0, threshold, 1] }
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [smartPause, threshold]);

  // Smart play/pause
  useEffect(() => {
    const el = videoRef.current;
    if (!el || !smartPause) return;
    if (isVisible) {
      videoService.setActive(el);
      const p = el.play();
      if (p && p.catch) p.catch(() => {});
    } else {
      try { el.pause(); } catch { /* ignore */ }
      videoService.clearActive(el);
    }
  }, [isVisible, smartPause]);

  // Wire events
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return undefined;
    const onPlay = () => { setIsPlaying(true); videoService.setActive(el); };
    const onPause = () => { setIsPlaying(false); videoService.clearActive(el); };
    const onTime = () => {
      setProgress(el.duration ? (el.currentTime / el.duration) * 100 : 0);
      if (el.buffered && el.buffered.length > 0 && el.duration) {
        setBuffered((el.buffered.end(el.buffered.length - 1) / el.duration) * 100);
      }
    };
    const onMeta = () => setDuration(el.duration || 0);
    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);
    el.addEventListener('timeupdate', onTime);
    el.addEventListener('loadedmetadata', onMeta);
    return () => {
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
      el.removeEventListener('timeupdate', onTime);
      el.removeEventListener('loadedmetadata', onMeta);
    };
  }, []);

  const play = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    const p = el.play();
    if (p && p.catch) p.catch(() => {});
  }, []);

  const pause = useCallback(() => {
    const el = videoRef.current;
    if (el) { try { el.pause(); } catch { /* ignore */ } }
  }, []);

  const toggle = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) play(); else pause();
  }, [play, pause]);

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      videoService.updateSettings({ muted: next });
      return next;
    });
  }, []);

  const seek = useCallback((percent) => {
    const el = videoRef.current;
    if (!el || !el.duration) return;
    el.currentTime = Math.max(0, Math.min(el.duration, (percent / 100) * el.duration));
  }, []);

  // initial autoplay
  useEffect(() => {
    if (!autoplay) return;
    const el = videoRef.current;
    if (!el) return;
    const p = el.play();
    if (p && p.catch) p.catch(() => {});
  }, [autoplay]);

  return {
    videoRef,
    containerRef,
    isPlaying,
    progress,
    duration,
    buffered,
    muted,
    setMuted,
    toggleMute,
    play,
    pause,
    toggle,
    seek,
    loop,
    isVisible,
  };
}
