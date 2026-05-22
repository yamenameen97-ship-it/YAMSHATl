/**
 * Advanced Cache Service
 * Handles memory and persistent caching with TTL and versioning
 */

class CacheService {
  constructor() {
    this.memoryCache = new Map();
    this.prefix = 'yamshat_cache_';
  }

  /**
   * Set a value in cache
   * @param {string} key 
   * @param {any} value 
   * @param {number} ttl - Time to live in milliseconds (default 1 hour)
   */
  set(key, value, ttl = 3600000) {
    const expiry = Date.now() + ttl;
    const data = { value, expiry };
    
    // Memory cache
    this.memoryCache.set(key, data);
    
    // Persistent cache
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(data));
    } catch (e) {
      console.warn('[CacheService] LocalStorage full, using memory only');
    }
  }

  /**
   * Get a value from cache
   * @param {string} key 
   * @returns {any|null}
   */
  get(key) {
    // Check memory first
    let data = this.memoryCache.get(key);
    
    // Check localStorage if not in memory
    if (!data) {
      const stored = localStorage.getItem(this.prefix + key);
      if (stored) {
        try {
          data = JSON.parse(stored);
          this.memoryCache.set(key, data); // Sync back to memory
        } catch (e) {
          return null;
        }
      }
    }

    if (!data) return null;

    // Check expiry
    if (Date.now() > data.expiry) {
      this.remove(key);
      return null;
    }

    return data.value;
  }

  remove(key) {
    this.memoryCache.delete(key);
    localStorage.removeItem(this.prefix + key);
  }

  clear() {
    this.memoryCache.clear();
    Object.keys(localStorage)
      .filter(key => key.startsWith(this.prefix))
      .forEach(key => localStorage.removeItem(key));
  }

  /**
   * Cache a promise result (e.g., API call)
   */
  async remember(key, ttl, promiseFn) {
    const cached = this.get(key);
    if (cached) return cached;

    const result = await promiseFn();
    this.set(key, result, ttl);
    return result;
  }
}

export const cacheService = new CacheService();
