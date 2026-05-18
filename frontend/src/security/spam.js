import { createElement } from 'react';

const RATE_LIMIT_PREFIX = 'yamshat-rate-limit';
const SHADOW_BAN_KEY = 'yamshat-shadow-bans';

function now() {
  return Date.now();
}

function readJson(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export class RateLimiter {
  constructor(maxRequests = 10, windowMs = 60000, storageKey = '') {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.storageKey = storageKey || `${RATE_LIMIT_PREFIX}:${maxRequests}:${windowMs}`;
    this.requests = readJson(this.storageKey, []);
  }

  prune() {
    const threshold = now() - this.windowMs;
    this.requests = this.requests.filter((time) => Number(time) > threshold);
    writeJson(this.storageKey, this.requests);
  }

  isAllowed(weight = 1) {
    this.prune();
    if (this.requests.length + weight > this.maxRequests) return false;
    for (let index = 0; index < weight; index += 1) {
      this.requests.push(now());
    }
    writeJson(this.storageKey, this.requests);
    return true;
  }

  getRemainingRequests() {
    this.prune();
    return Math.max(0, this.maxRequests - this.requests.length);
  }

  getResetTime() {
    this.prune();
    if (!this.requests.length) return 0;
    return Math.max(0, this.requests[0] + this.windowMs - now());
  }

  reset() {
    this.requests = [];
    writeJson(this.storageKey, this.requests);
  }
}

export class CooldownManager {
  constructor() {
    this.cooldowns = new Map();
  }

  setCooldown(key, durationMs) {
    this.cooldowns.set(key, now() + durationMs);
  }

  isOnCooldown(key) {
    const expiresAt = this.cooldowns.get(key);
    if (!expiresAt) return false;
    if (expiresAt <= now()) {
      this.cooldowns.delete(key);
      return false;
    }
    return true;
  }

  getRemainingCooldown(key) {
    const expiresAt = this.cooldowns.get(key);
    return expiresAt ? Math.max(0, expiresAt - now()) : 0;
  }

  clear(key) {
    this.cooldowns.delete(key);
  }

  clearAll() {
    this.cooldowns.clear();
  }
}

export class DuplicateDetector {
  constructor(timeWindowMs = 5000) {
    this.timeWindowMs = timeWindowMs;
    this.history = [];
  }

  hashContent(content) {
    let hash = 0;
    const str = JSON.stringify(content);
    for (let i = 0; i < str.length; i += 1) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return String(hash);
  }

  isDuplicate(content) {
    const threshold = now() - this.timeWindowMs;
    this.history = this.history.filter((entry) => entry.time > threshold);
    const hash = this.hashContent(content);
    const duplicate = this.history.some((entry) => entry.hash === hash);
    this.history.push({ hash, time: now() });
    return duplicate;
  }

  clear() {
    this.history = [];
  }
}

export class BotDetector {
  analyze(payload = {}) {
    const pointerMoves = Number(payload.pointerMoves || 0);
    const keyStrokes = Number(payload.keyStrokes || 0);
    const typingDurationMs = Number(payload.typingDurationMs || 0);
    const pasteRatio = Number(payload.pasteRatio || 0);
    const retryBursts = Number(payload.retryBursts || 0);
    const formFillMs = Number(payload.formFillMs || 0);

    let score = 0;
    if (typingDurationMs > 0 && keyStrokes > 0) {
      const cps = keyStrokes / Math.max(typingDurationMs / 1000, 1);
      if (cps > 11) score += 24;
      else if (cps > 7) score += 12;
    }
    if (pointerMoves < 2 && keyStrokes > 12) score += 18;
    if (pasteRatio > 0.85) score += 14;
    if (retryBursts > 4) score += 20;
    if (formFillMs > 0 && formFillMs < 1200) score += 18;

    const verdict = score >= 60 ? 'high-risk' : score >= 35 ? 'review' : 'human-like';
    return {
      score,
      verdict,
      humanConfidence: Math.max(0, 100 - score),
      flags: [
        pointerMoves < 2 && keyStrokes > 12 ? 'low-pointer-activity' : '',
        pasteRatio > 0.85 ? 'high-paste-ratio' : '',
        retryBursts > 4 ? 'burst-retries' : '',
      ].filter(Boolean),
    };
  }
}

export class ShadowBanRegistry {
  list() {
    return readJson(SHADOW_BAN_KEY, []);
  }

  isShadowBanned(identifier) {
    return this.list().some((item) => item.identifier === identifier && item.active !== false);
  }

  set(identifier, reason = 'spam-risk') {
    const current = this.list().filter((item) => item.identifier !== identifier);
    const next = [{ identifier, reason, active: true, createdAt: new Date().toISOString() }, ...current].slice(0, 100);
    writeJson(SHADOW_BAN_KEY, next);
    return next[0];
  }

  clear(identifier) {
    const next = this.list().filter((item) => item.identifier !== identifier);
    writeJson(SHADOW_BAN_KEY, next);
    return next;
  }
}

export function createAntiSpamReport({ actionKey = 'generic', content = '', behavior = {} } = {}) {
  const limiter = new RateLimiter(8, 60_000, `${RATE_LIMIT_PREFIX}:${actionKey}`);
  const duplicateDetector = new DuplicateDetector(8_000);
  const botDetector = new BotDetector();
  const shadowBans = new ShadowBanRegistry();

  const allowed = limiter.isAllowed();
  const duplicate = duplicateDetector.isDuplicate(content);
  const bot = botDetector.analyze(behavior);
  const shouldShadowBan = duplicate && bot.score >= 35;
  if (shouldShadowBan) shadowBans.set(actionKey, 'duplicate + automated behavior');

  return {
    allowed,
    duplicate,
    bot,
    shadowBanned: shadowBans.isShadowBanned(actionKey),
    remainingRequests: limiter.getRemainingRequests(),
    resetInMs: limiter.getResetTime(),
  };
}

export function useRateLimit(maxRequests = 10, windowMs = 60000, storageKey = '') {
  const limiter = new RateLimiter(maxRequests, windowMs, storageKey);
  return {
    isAllowed: (weight = 1) => limiter.isAllowed(weight),
    getRemainingRequests: () => limiter.getRemainingRequests(),
    getResetTime: () => limiter.getResetTime(),
    reset: () => limiter.reset(),
  };
}

export function useCooldown() {
  const manager = new CooldownManager();
  return {
    setCooldown: (key, duration) => manager.setCooldown(key, duration),
    isOnCooldown: (key) => manager.isOnCooldown(key),
    getRemainingCooldown: (key) => manager.getRemainingCooldown(key),
    clear: (key) => manager.clear(key),
    clearAll: () => manager.clearAll(),
  };
}

export function useDuplicateDetector(timeWindowMs = 5000) {
  const detector = new DuplicateDetector(timeWindowMs);
  return {
    isDuplicate: (content) => detector.isDuplicate(content),
    clear: () => detector.clear(),
  };
}

export const SpamProtection = {
  RateLimiter,
  CooldownManager,
  DuplicateDetector,
  BotDetector,
  ShadowBanRegistry,
  createAntiSpamReport,
  useRateLimit,
  useCooldown,
  useDuplicateDetector,
};

export function RateLimitUI({ remaining, resetTime }) {
  if (remaining > 0) return null;
  const seconds = Math.ceil(resetTime / 1000);
  return createElement(
    'div',
    { style: { padding: '12px 16px', background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 10, fontSize: 14, color: '#92400e' } },
    `⏱️ تم الوصول للحد الأقصى من المحاولات. حاول تاني بعد ${seconds} ثانية.`
  );
}

export function CooldownUI({ remaining, action = 'الإجراء' }) {
  if (remaining <= 0) return null;
  const seconds = Math.ceil(remaining / 1000);
  return createElement(
    'div',
    { style: { padding: '12px 16px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, fontSize: 14, color: '#1d4ed8' } },
    `🛡️ انتظر ${seconds} ثانية قبل ${action} لتقليل الـ spam.`
  );
}
