import { buildTextFingerprint, getPostId, getUserId, safeNumber } from './utils.js';

function mergeArrays(left, right) {
  if (!Array.isArray(left) && !Array.isArray(right)) return left ?? right;
  return Array.from(new Set([...(left || []), ...(right || [])].filter(Boolean)));
}

function mergeRecords(base = {}, incoming = {}) {
  const merged = { ...base };
  Object.entries(incoming || {}).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      merged[key] = mergeArrays(base[key], value);
      return;
    }

    const currentValue = merged[key];
    if (currentValue === undefined || currentValue === null || currentValue === '') {
      merged[key] = value;
      return;
    }

    if (typeof value === 'number' && value > safeNumber(currentValue, Number.NEGATIVE_INFINITY)) {
      merged[key] = value;
      return;
    }

    if (typeof value === 'string' && value.length > String(currentValue || '').length) {
      merged[key] = value;
      return;
    }
  });

  const existingCreatedAt = new Date(base.created_at || 0).getTime();
  const incomingCreatedAt = new Date(incoming.created_at || 0).getTime();
  if (incomingCreatedAt > existingCreatedAt) {
    merged.created_at = incoming.created_at || merged.created_at;
  }

  return merged;
}

export function dedupePosts(posts = []) {
  const map = new Map();

  (posts || []).forEach((post) => {
    if (!post || typeof post !== 'object') return;
    const key = getPostId(post) || buildTextFingerprint(post);
    if (!key) return;

    const normalized = {
      ...post,
      id: post.id || key,
    };

    if (!map.has(key)) {
      map.set(key, normalized);
      return;
    }

    map.set(key, mergeRecords(map.get(key), normalized));
  });

  return Array.from(map.values());
}

export function dedupeUsers(users = []) {
  const map = new Map();
  (users || []).forEach((user) => {
    if (!user || typeof user !== 'object') return;
    const key = getUserId(user);
    if (!key) return;
    const normalized = { ...user, username: user.username || user.name || key };
    map.set(key, map.has(key) ? mergeRecords(map.get(key), normalized) : normalized);
  });
  return Array.from(map.values());
}

export function removeDuplicateContent(posts = []) {
  return dedupePosts(posts);
}
