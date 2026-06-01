const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export function encodeUtf8(value = '') {
  return textEncoder.encode(String(value ?? ''));
}

export function decodeUtf8(value) {
  if (!value) return '';
  const bytes = value instanceof Uint8Array ? value : new Uint8Array(value);
  return textDecoder.decode(bytes);
}

export function bytesToBase64(value) {
  if (!value) return '';
  const bytes = value instanceof Uint8Array ? value : new Uint8Array(value);
  let binary = '';
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return window.btoa(binary);
}

export function base64ToBytes(value = '') {
  if (!value) return new Uint8Array();
  const binary = window.atob(String(value));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

export function randomBytes(length = 16) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

export function bytesToHex(value) {
  const bytes = value instanceof Uint8Array ? value : new Uint8Array(value || []);
  return Array.from(bytes, (item) => item.toString(16).padStart(2, '0')).join('');
}

export function safeJsonParse(value, fallback = null) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}
