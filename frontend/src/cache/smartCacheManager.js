
class SmartCacheManager {
  set(key, value, ttl = 60000) {
    const payload = {
      value,
      expiresAt: Date.now() + ttl,
    };

    localStorage.setItem(
      key,
      JSON.stringify(payload)
    );
  }

  get(key) {
    const raw = localStorage.getItem(key);

    if (!raw) return null;

    const payload = JSON.parse(raw);

    if (Date.now() > payload.expiresAt) {
      localStorage.removeItem(key);
      return null;
    }

    return payload.value;
  }
}

export const smartCacheManager =
  new SmartCacheManager();
