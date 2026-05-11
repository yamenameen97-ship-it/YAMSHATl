/**
 * Spam Protection Utilities
 * 
 * حماية من الـ Spam من خلال:
 * - Rate limiting
 * - Cooldowns
 * - Request throttling
 * - Duplicate detection
 */

/**
 * RateLimiter Class
 * 
 * تحديد معدل الطلبات
 */
export class RateLimiter {
  constructor(maxRequests = 10, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = [];
  }

  isAllowed() {
    const now = Date.now();
    
    // Remove old requests outside the window
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    // Check if limit exceeded
    if (this.requests.length >= this.maxRequests) {
      return false;
    }
    
    // Add current request
    this.requests.push(now);
    return true;
  }

  getRemainingRequests() {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    return Math.max(0, this.maxRequests - this.requests.length);
  }

  getResetTime() {
    if (this.requests.length === 0) return 0;
    return this.requests[0] + this.windowMs - Date.now();
  }

  reset() {
    this.requests = [];
  }
}

/**
 * Cooldown Manager
 * 
 * إدارة فترات الانتظار بين الإجراءات
 */
export class CooldownManager {
  constructor() {
    this.cooldowns = new Map();
  }

  setCooldown(key, durationMs) {
    const expiresAt = Date.now() + durationMs;
    this.cooldowns.set(key, expiresAt);
  }

  isOnCooldown(key) {
    const expiresAt = this.cooldowns.get(key);
    if (!expiresAt) return false;
    
    if (Date.now() > expiresAt) {
      this.cooldowns.delete(key);
      return false;
    }
    
    return true;
  }

  getRemainingCooldown(key) {
    const expiresAt = this.cooldowns.get(key);
    if (!expiresAt) return 0;
    
    const remaining = expiresAt - Date.now();
    return remaining > 0 ? remaining : 0;
  }

  clear(key) {
    this.cooldowns.delete(key);
  }

  clearAll() {
    this.cooldowns.clear();
  }
}

/**
 * Duplicate Detector
 * 
 * الكشف عن الطلبات المكررة
 */
export class DuplicateDetector {
  constructor(timeWindowMs = 5000) {
    this.timeWindowMs = timeWindowMs;
    this.history = [];
  }

  isDuplicate(content) {
    const now = Date.now();
    
    // Remove old entries
    this.history = this.history.filter(entry => now - entry.time < this.timeWindowMs);
    
    // Check for duplicate
    const hash = this.hashContent(content);
    const isDuplicate = this.history.some(entry => entry.hash === hash);
    
    // Add current entry
    this.history.push({ hash, time: now });
    
    return isDuplicate;
  }

  hashContent(content) {
    // Simple hash function
    let hash = 0;
    const str = JSON.stringify(content);
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return hash.toString();
  }

  clear() {
    this.history = [];
  }
}

/**
 * useRateLimit Hook
 * 
 * Hook لـ rate limiting
 */
export function useRateLimit(maxRequests = 10, windowMs = 60000) {
  const limiter = new RateLimiter(maxRequests, windowMs);

  return {
    isAllowed: () => limiter.isAllowed(),
    getRemainingRequests: () => limiter.getRemainingRequests(),
    getResetTime: () => limiter.getResetTime(),
    reset: () => limiter.reset(),
  };
}

/**
 * useCooldown Hook
 * 
 * Hook لـ cooldown management
 */
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

/**
 * useDuplicateDetector Hook
 * 
 * Hook للكشف عن المكررات
 */
export function useDuplicateDetector(timeWindowMs = 5000) {
  const detector = new DuplicateDetector(timeWindowMs);

  return {
    isDuplicate: (content) => detector.isDuplicate(content),
    clear: () => detector.clear(),
  };
}

/**
 * SpamProtection Utilities Object
 */
export const SpamProtection = {
  RateLimiter,
  CooldownManager,
  DuplicateDetector,
  useRateLimit,
  useCooldown,
  useDuplicateDetector,
};

/**
 * Rate Limit UI Component
 * 
 * مكون لعرض حالة Rate Limiting
 */
export function RateLimitUI({ remaining, total, resetTime }) {
  if (remaining > 0) return null;

  const seconds = Math.ceil(resetTime / 1000);

  return (
    <div style={{
      padding: '12px 16px',
      background: '#fef3c7',
      border: '1px solid #fcd34d',
      borderRadius: '6px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
      fontSize: '14px',
      color: '#92400e',
    }}>
      <span>⏱️ تم تجاوز حد الطلبات. حاول مرة أخرى بعد {seconds} ثانية</span>
    </div>
  );
}

/**
 * Cooldown UI Component
 * 
 * مكون لعرض حالة الـ Cooldown
 */
export function CooldownUI({ remaining, action = 'الإجراء' }) {
  if (remaining <= 0) return null;

  const seconds = Math.ceil(remaining / 1000);

  return (
    <div style={{
      padding: '12px 16px',
      background: '#fef3c7',
      border: '1px solid #fcd34d',
      borderRadius: '6px',
      fontSize: '14px',
      color: '#92400e',
      textAlign: 'center',
    }}>
      ⏳ يرجى الانتظار {seconds} ثانية قبل {action}
    </div>
  );
}
