const cache = new Map();

export function saveFeedCache(key, data) {
  cache.set(key, data);
}

export function getFeedCache(key) {
  return cache.get(key);
}