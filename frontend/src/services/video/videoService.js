/**
 * videoService.js — Yamshat Centralized Video Engine
 * ---------------------------------------------------
 * - Manages currently-active <video> across the app (only one plays at a time)
 * - HLS.js loader (dynamic import; gracefully falls back to native HLS on Safari)
 * - Visibility / scroll-based smart pause
 * - Preloads next reel for instant playback
 * - Persists mute + quality preferences
 */

const STORAGE_KEY = 'yamshat_video_settings_v1';

const DEFAULTS = {
  muted: true,              // start muted to satisfy autoplay policies
  defaultVolume: 1.0,
  preferredQuality: 'auto', // 'auto' | 'low' | 'medium' | 'high'
  autoplay: true,
  preloadStrategy: 'metadata', // 'none' | 'metadata' | 'auto'
};

function readSettings() {
  if (typeof window === 'undefined') return { ...DEFAULTS };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}

function writeSettings(settings) {
  if (typeof window === 'undefined') return;
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch { /* ignore */ }
}

let hlsModulePromise = null;
async function loadHls() {
  if (typeof window === 'undefined') return null;
  if (window.Hls) return window.Hls;
  if (hlsModulePromise) return hlsModulePromise;
  // try to import hls.js if available (optional dependency)
  hlsModulePromise = import(/* @vite-ignore */ 'hls.js')
    .then((m) => m?.default || m?.Hls || null)
    .catch(() => null);
  return hlsModulePromise;
}

function isHlsSource(src = '') {
  return /\.m3u8($|\?)/i.test(String(src || ''));
}

class VideoEngine {
  constructor() {
    this.settings = readSettings();
    this.activeVideo = null;
    this.hlsInstances = new WeakMap();   // <video> -> Hls instance
    this.listeners = new Set();
    this.preloadCache = new Map();        // src -> { audio?, video? } placeholder
  }

  getSettings() { return { ...this.settings }; }

  updateSettings(patch = {}) {
    this.settings = { ...this.settings, ...patch };
    writeSettings(this.settings);
    this._notify();
  }

  subscribe(fn) {
    if (typeof fn !== 'function') return () => {};
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  _notify() {
    for (const fn of this.listeners) {
      try { fn(this.getSettings()); } catch { /* ignore */ }
    }
  }

  /**
   * Attach a <video> element to a source (HLS or progressive).
   * Returns a cleanup function.
   */
  async attach(videoEl, src) {
    if (!videoEl || !src) return () => {};
    // teardown any previous HLS
    this.detach(videoEl);

    if (isHlsSource(src)) {
      const Hls = await loadHls();
      if (Hls && Hls.isSupported && Hls.isSupported()) {
        const hls = new Hls({
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
          lowLatencyMode: false,
          enableWorker: true,
        });
        hls.loadSource(src);
        hls.attachMedia(videoEl);
        this.hlsInstances.set(videoEl, hls);
      } else if (videoEl.canPlayType && videoEl.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari native HLS
        videoEl.src = src;
      } else {
        // last resort
        videoEl.src = src;
      }
    } else {
      videoEl.src = src;
    }
    return () => this.detach(videoEl);
  }

  detach(videoEl) {
    if (!videoEl) return;
    const hls = this.hlsInstances.get(videoEl);
    if (hls) {
      try { hls.destroy(); } catch { /* ignore */ }
      this.hlsInstances.delete(videoEl);
    }
  }

  /**
   * Only one video can be "active" at a time — pauses everyone else.
   */
  setActive(videoEl) {
    if (this.activeVideo && this.activeVideo !== videoEl) {
      try { this.activeVideo.pause(); } catch { /* ignore */ }
    }
    this.activeVideo = videoEl;
  }

  clearActive(videoEl) {
    if (this.activeVideo === videoEl) this.activeVideo = null;
  }

  pauseAll() {
    if (this.activeVideo) {
      try { this.activeVideo.pause(); } catch { /* ignore */ }
    }
    this.activeVideo = null;
  }

  /**
   * Preload metadata for an upcoming source (used by reels).
   */
  preload(src) {
    if (!src || this.preloadCache.has(src)) return;
    try {
      const v = document.createElement('video');
      v.preload = 'metadata';
      v.muted = true;
      v.src = src;
      // store ref briefly; GC after 30s
      this.preloadCache.set(src, v);
      setTimeout(() => {
        try { v.removeAttribute('src'); v.load(); } catch { /* ignore */ }
        this.preloadCache.delete(src);
      }, 30000);
    } catch { /* ignore */ }
  }
}

const videoService = new VideoEngine();
export default videoService;
