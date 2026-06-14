// UTF-8 safe base64 encoding (supports Arabic and other non-Latin1 characters)
function utf8ToBase64(str) {
  try {
    // Browser path: TextEncoder → binary string → btoa
    const bytes = new TextEncoder().encode(str);
    let binary = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode.apply(
        null,
        bytes.subarray(i, i + chunkSize)
      );
    }
    return btoa(binary);
  } catch (_) {
    // Fallback (older browsers)
    return btoa(unescape(encodeURIComponent(str)));
  }
}

function base64ToUtf8(str) {
  try {
    const binary = atob(str);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder('utf-8').decode(bytes);
  } catch (_) {
    return decodeURIComponent(escape(atob(str)));
  }
}

function encode(value) {
  return utf8ToBase64(JSON.stringify(value));
}

function decode(raw) {
  try {
    return JSON.parse(base64ToUtf8(raw));
  } catch (_) {
    // Backward compatibility: legacy entries encoded with plain btoa
    try {
      return JSON.parse(atob(raw));
    } catch (__) {
      return null;
    }
  }
}

export function secureSet(key, value, options = {}) {
  const persist = Boolean(options?.persist);
  const storage = persist ? localStorage : sessionStorage;
  const fallbackStorage = persist ? sessionStorage : localStorage;
  const encoded = encode(value);
  storage.setItem(key, encoded);
  fallbackStorage.removeItem(key);
}

export function secureGet(key) {
  const raw = sessionStorage.getItem(key) || localStorage.getItem(key);
  if (!raw) return null;
  return decode(raw);
}

export function secureRemove(key) {
  sessionStorage.removeItem(key);
  localStorage.removeItem(key);
}

export const secureStorage = {
  set: secureSet,
  get: secureGet,
  remove: secureRemove,
};
