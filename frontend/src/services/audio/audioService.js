/**
 * audioService.js — Yamshat Centralized Audio Engine
 * ---------------------------------------------------
 * Features:
 *  - Preload + cache of all UI sound assets
 *  - Per-event playback with debounce and queue management
 *  - User-controlled volume, mute, per-category toggles
 *  - User-interaction unlock (bypass autoplay restrictions)
 *  - Vibration fallback for silent mode
 *  - Night-mode auto-attenuation
 *  - Persists settings to localStorage
 */

const STORAGE_KEY = 'yamshat_audio_settings_v1';
const UNLOCK_EVENTS = ['pointerdown', 'touchstart', 'keydown'];
const DEFAULT_DEBOUNCE_MS = 60;

// ---------------- Sound catalog ----------------
export const SOUND_CATALOG = Object.freeze({
  // Messages
  msg_received:       { src: '/sounds/messages/received.mp3',          category: 'messages',      debounce: 200 },
  msg_sent:           { src: '/sounds/messages/sent.mp3',              category: 'messages',      debounce: 120 },
  msg_seen:           { src: '/sounds/messages/seen.mp3',              category: 'messages',      debounce: 250 },
  msg_failed:         { src: '/sounds/messages/failed.mp3',            category: 'messages',      debounce: 400 },

  // Notifications
  notif_like:         { src: '/sounds/notifications/like.mp3',         category: 'notifications', debounce: 300 },
  notif_comment:      { src: '/sounds/notifications/comment.mp3',      category: 'notifications', debounce: 300 },
  notif_follow:       { src: '/sounds/notifications/follow.mp3',       category: 'notifications', debounce: 400 },
  notif_mention:      { src: '/sounds/notifications/mention.mp3',      category: 'notifications', debounce: 400 },
  notif_friend_req:   { src: '/sounds/notifications/friend_request.mp3', category: 'notifications', debounce: 500 },
  notif_generic:      { src: '/sounds/notifications/generic.mp3',      category: 'notifications', debounce: 300 },
  notif_viewer_join:  { src: '/sounds/notifications/viewer_join.mp3',  category: 'notifications', debounce: 150 },
  notif_gift:         { src: '/sounds/notifications/gift.mp3',         category: 'notifications', debounce: 200 },

  // Calls / Live (ringtones loop, handled specially)
  ring_voice:         { src: '/sounds/calls/voice_ring.mp3',           category: 'calls',         loop: true  },
  ring_video:         { src: '/sounds/calls/video_ring.mp3',           category: 'calls',         loop: true  },
  call_waiting:       { src: '/sounds/calls/waiting.mp3',              category: 'calls',         loop: true  },
  call_end:           { src: '/sounds/calls/end.mp3',                  category: 'calls',         debounce: 300 },
  live_start:         { src: '/sounds/calls/live_start.mp3',           category: 'calls',         debounce: 500 },
  live_end:           { src: '/sounds/calls/live_end.mp3',             category: 'calls',         debounce: 500 },

  // Typing
  typing_click:       { src: '/sounds/typing/click.mp3',               category: 'typing',        debounce: 30  },

  // System
  sys_open:           { src: '/sounds/system/open.mp3',                category: 'system',        debounce: 100 },
  sys_back:           { src: '/sounds/system/back.mp3',                category: 'system',        debounce: 100 },
  sys_refresh:        { src: '/sounds/system/refresh.mp3',             category: 'system',        debounce: 200 },
  sys_success:        { src: '/sounds/system/success.mp3',             category: 'system',        debounce: 250 },
  sys_error:          { src: '/sounds/system/error.mp3',               category: 'system',        debounce: 250 },
});

const DEFAULT_SETTINGS = {
  enabled: true,                  // master switch
  volume: 0.7,                    // 0..1
  vibrate: true,                  // vibration on supported devices
  nightMode: false,               // auto-dim during 22:00-07:00
  nightVolumeMultiplier: 0.4,
  ringtone: 'ring_voice',         // currently selected ringtone key
  videoRingtone: 'ring_video',
  categories: {
    messages: true,
    notifications: true,
    calls: true,
    typing: false,                // off by default (subtle)
    system: true,
  },
};

function safeReadSettings() {
  if (typeof window === 'undefined') return { ...DEFAULT_SETTINGS };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      categories: { ...DEFAULT_SETTINGS.categories, ...(parsed?.categories || {}) },
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function safeWriteSettings(settings) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

class AudioEngine {
  constructor() {
    this.audioCtx = null;
    this.unlocked = false;
    this.buffers = new Map();              // key -> AudioBuffer
    this.htmlPool = new Map();             // key -> HTMLAudioElement[] (fallback)
    this.activeLoops = new Map();          // key -> { source, gainNode, audioEl }
    this.lastPlayedAt = new Map();         // key -> timestamp ms
    this.queue = [];
    this.settings = safeReadSettings();
    this.listeners = new Set();
    this.preloadStarted = false;
    this._unlockHandler = () => {
      this._tryUnlock().then((ok) => {
        if (ok) this._flushQueue();
      });
    };
    this._bindUnlock();
  }

  // ---------- Settings API ----------
  getSettings() {
    return JSON.parse(JSON.stringify(this.settings));
  }

  updateSettings(patch = {}) {
    this.settings = {
      ...this.settings,
      ...patch,
      categories: { ...this.settings.categories, ...(patch?.categories || {}) },
    };
    safeWriteSettings(this.settings);
    this._notify();
  }

  setVolume(v) {
    const clamped = Math.max(0, Math.min(1, Number(v) || 0));
    this.updateSettings({ volume: clamped });
  }

  setEnabled(flag) {
    this.updateSettings({ enabled: Boolean(flag) });
    if (!flag) this.stopAllLoops();
  }

  setCategory(category, enabled) {
    this.updateSettings({
      categories: { ...this.settings.categories, [category]: Boolean(enabled) },
    });
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

  // ---------- Unlock (autoplay bypass) ----------
  _bindUnlock() {
    if (typeof window === 'undefined') return;
    UNLOCK_EVENTS.forEach((ev) => window.addEventListener(ev, this._unlockHandler, { passive: true }));
  }

  async _tryUnlock() {
    if (this.unlocked) return true;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) {
        this.audioCtx = this.audioCtx || new Ctx();
        if (this.audioCtx.state === 'suspended') await this.audioCtx.resume();
      }
      // also touch a silent HTMLAudio to unlock iOS
      const a = new Audio();
      a.muted = true;
      a.play().catch(() => {});
      this.unlocked = true;
      UNLOCK_EVENTS.forEach((ev) => window.removeEventListener(ev, this._unlockHandler));
      this.preload(); // safe to preload now
      this._notify();
      return true;
    } catch {
      return false;
    }
  }

  isUnlocked() {
    return this.unlocked;
  }

  // ---------- Preload ----------
  preload() {
    if (this.preloadStarted) return;
    this.preloadStarted = true;
    Object.entries(SOUND_CATALOG).forEach(([key, def]) => {
      this._preloadOne(key, def.src).catch(() => {/* swallow */});
    });
  }

  async _preloadOne(key, src) {
    // Try WebAudio buffer first (lower latency)
    if (this.audioCtx && typeof fetch === 'function') {
      try {
        const res = await fetch(src, { cache: 'force-cache' });
        if (res.ok) {
          const arr = await res.arrayBuffer();
          const buf = await this.audioCtx.decodeAudioData(arr.slice(0));
          this.buffers.set(key, buf);
          return;
        }
      } catch {
        // fall back to HTMLAudio
      }
    }
    // HTMLAudio fallback pool (3 instances for rapid overlap)
    const pool = [];
    for (let i = 0; i < 3; i += 1) {
      const a = new Audio(src);
      a.preload = 'auto';
      a.volume = 0;
      // best-effort prefetch
      try { a.load(); } catch { /* ignore */ }
      pool.push(a);
    }
    this.htmlPool.set(key, pool);
  }

  // ---------- Internal helpers ----------
  _shouldPlay(key, def) {
    if (!this.settings.enabled) return false;
    if (!def) return false;
    if (this.settings.categories[def.category] === false) return false;
    return true;
  }

  _resolveVolume() {
    let v = this.settings.volume;
    if (this.settings.nightMode) {
      const hr = new Date().getHours();
      if (hr >= 22 || hr < 7) v *= this.settings.nightVolumeMultiplier;
    }
    return Math.max(0, Math.min(1, v));
  }

  _checkDebounce(key, def) {
    const now = Date.now();
    const last = this.lastPlayedAt.get(key) || 0;
    const minGap = def.debounce ?? DEFAULT_DEBOUNCE_MS;
    if (now - last < minGap) return false;
    this.lastPlayedAt.set(key, now);
    return true;
  }

  _vibrate(pattern) {
    if (!this.settings.vibrate) return;
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try { navigator.vibrate(pattern); } catch { /* ignore */ }
    }
  }

  // ---------- Public play API ----------
  /**
   * Play a sound by catalog key.
   * @param {string} key
   * @param {{ volume?: number, force?: boolean, vibratePattern?: number|number[] }} [opts]
   */
  play(key, opts = {}) {
    const def = SOUND_CATALOG[key];
    if (!def) return false;
    if (!opts.force && !this._shouldPlay(key, def)) return false;
    if (!opts.force && !this._checkDebounce(key, def)) return false;
    if (!this.unlocked) {
      // queue gently — most browsers will allow once unlocked
      this.queue.push({ key, opts });
      if (this.queue.length > 16) this.queue.shift();
      this._tryUnlock().then((ok) => {
        if (ok) this._flushQueue();
      });
      return false;
    }
    const baseVol = typeof opts.volume === 'number' ? opts.volume : 1;
    const vol = baseVol * this._resolveVolume();

    if (opts.vibratePattern) this._vibrate(opts.vibratePattern);

    if (def.loop) return this._startLoop(key, def, vol);
    return this._playOnce(key, def, vol);
  }

  _playOnce(key, def, vol) {
    // WebAudio path
    const buf = this.buffers.get(key);
    if (buf && this.audioCtx) {
      try {
        const src = this.audioCtx.createBufferSource();
        src.buffer = buf;
        const g = this.audioCtx.createGain();
        g.gain.value = vol;
        src.connect(g).connect(this.audioCtx.destination);
        src.start(0);
        return true;
      } catch { /* fall through */ }
    }
    // HTMLAudio path
    const pool = this.htmlPool.get(key);
    if (pool && pool.length) {
      const audio = pool.find((a) => a.paused || a.ended) || pool[0];
      try {
        audio.currentTime = 0;
        audio.volume = vol;
        audio.loop = false;
        audio.muted = false;
        const p = audio.play();
        if (p && typeof p.catch === 'function') p.catch(() => {});
        return true;
      } catch { /* ignore */ }
    }
    return false;
  }

  _startLoop(key, def, vol) {
    if (this.activeLoops.has(key)) return true; // already looping
    // Prefer HTMLAudio for loops (simpler control)
    const pool = this.htmlPool.get(key);
    if (pool && pool.length) {
      const audio = pool[0];
      try {
        audio.loop = true;
        audio.volume = vol;
        audio.currentTime = 0;
        audio.muted = false;
        const p = audio.play();
        if (p && typeof p.catch === 'function') p.catch(() => {});
        this.activeLoops.set(key, { audioEl: audio });
        return true;
      } catch { /* fall through */ }
    }
    // WebAudio loop fallback
    const buf = this.buffers.get(key);
    if (buf && this.audioCtx) {
      try {
        const src = this.audioCtx.createBufferSource();
        src.buffer = buf;
        src.loop = true;
        const g = this.audioCtx.createGain();
        g.gain.value = vol;
        src.connect(g).connect(this.audioCtx.destination);
        src.start(0);
        this.activeLoops.set(key, { source: src, gainNode: g });
        return true;
      } catch { /* ignore */ }
    }
    return false;
  }

  stop(key) {
    const entry = this.activeLoops.get(key);
    if (!entry) return;
    try {
      if (entry.audioEl) {
        entry.audioEl.pause();
        entry.audioEl.currentTime = 0;
        entry.audioEl.loop = false;
      }
      if (entry.source) entry.source.stop();
    } catch { /* ignore */ }
    this.activeLoops.delete(key);
  }

  stopAllLoops() {
    Array.from(this.activeLoops.keys()).forEach((k) => this.stop(k));
  }

  // ---------- High-level event helpers ----------
  onMessageReceived() { this.play('msg_received', { vibratePattern: 30 }); }
  onMessageSent() { this.play('msg_sent'); }
  onMessageSeen() { this.play('msg_seen'); }
  onMessageFailed() { this.play('msg_failed', { vibratePattern: [40, 60, 40] }); }
  onTyping() { this.play('typing_click'); }

  onNotification(type = 'generic') {
    const map = {
      like: 'notif_like',
      comment: 'notif_comment',
      follow: 'notif_follow',
      mention: 'notif_mention',
      friend_request: 'notif_friend_req',
      gift: 'notif_gift',
      viewer_join: 'notif_viewer_join',
    };
    const key = map[type] || 'notif_generic';
    this.play(key, { vibratePattern: 50 });
  }

  startIncomingCall(video = false) {
    const key = video ? this.settings.videoRingtone : this.settings.ringtone;
    this._vibrate([300, 200, 300, 200]);
    return this.play(key, { force: false });
  }

  stopIncomingCall() {
    this.stop('ring_voice');
    this.stop('ring_video');
    this.stop('call_waiting');
  }

  endCall() {
    this.stopIncomingCall();
    this.play('call_end');
  }

  liveStarted() { this.play('live_start'); }
  liveEnded() { this.play('live_end'); }

  // Flush any queued events once unlocked
  _flushQueue() {
    if (!this.unlocked) return;
    const items = this.queue.splice(0);
    items.forEach(({ key, opts }) => this.play(key, opts));
  }
}

const audioService = new AudioEngine();

export default audioService;
