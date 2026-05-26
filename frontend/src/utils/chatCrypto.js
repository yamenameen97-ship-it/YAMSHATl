const CHAT_E2EE_KEY = 'yamshat:chat:e2ee';
const ENCRYPTION_PREFIX = '__yamshat_enc__';

function safeParse(value, fallback) {
  try {
    return JSON.parse(value ?? '');
  } catch {
    return fallback;
  }
}

function readStore() {
  if (typeof window === 'undefined') return {};
  return safeParse(window.localStorage.getItem(CHAT_E2EE_KEY), {});
}

function writeStore(store) {
  if (typeof window === 'undefined') return store;
  window.localStorage.setItem(CHAT_E2EE_KEY, JSON.stringify(store));
  return store;
}

function getPeerSalt(peer) {
  return `yamshat:${String(peer || '').trim().toLowerCase()}`;
}

function bytesToBase64(bytes) {
  let binary = '';
  bytes.forEach((value) => {
    binary += String.fromCharCode(value);
  });
  return window.btoa(binary);
}

function base64ToBytes(base64) {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

async function deriveConversationKey(passphrase, peer) {
  const subtle = window?.crypto?.subtle;
  if (!subtle) throw new Error('Web Crypto is unavailable');
  const encoder = new TextEncoder();
  const baseKey = await subtle.importKey(
    'raw',
    encoder.encode(String(passphrase || '')),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(getPeerSalt(peer)),
      iterations: 120000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export function isEncryptedChatText(value) {
  return String(value || '').startsWith(`${ENCRYPTION_PREFIX}:`);
}

export function getConversationEncryptionState(peer) {
  const store = readStore();
  return store?.[peer] || { enabled: false, passphrase: '' };
}

export function saveConversationEncryptionState(peer, payload = {}) {
  if (!peer) return payload;
  const store = readStore();
  store[peer] = {
    enabled: Boolean(payload.enabled),
    passphrase: String(payload.passphrase || ''),
    updated_at: new Date().toISOString(),
  };
  writeStore(store);
  return store[peer];
}

export function clearConversationEncryptionState(peer) {
  if (!peer) return {};
  const store = readStore();
  delete store[peer];
  writeStore(store);
  return store;
}

export async function encryptChatText(value, passphrase, peer) {
  const text = String(value || '');
  if (!text) return text;
  if (!passphrase) throw new Error('Missing passphrase');
  const subtle = window?.crypto?.subtle;
  if (!subtle) throw new Error('Web Crypto is unavailable');
  const encoder = new TextEncoder();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveConversationKey(passphrase, peer);
  const encrypted = await subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(text));
  return `${ENCRYPTION_PREFIX}:${bytesToBase64(iv)}:${bytesToBase64(new Uint8Array(encrypted))}`;
}

export async function decryptChatText(value, passphrase, peer) {
  const text = String(value || '');
  if (!isEncryptedChatText(text)) return text;
  if (!passphrase) throw new Error('Missing passphrase');
  const subtle = window?.crypto?.subtle;
  if (!subtle) throw new Error('Web Crypto is unavailable');
  const [, ivBase64, cipherBase64] = text.split(':');
  if (!ivBase64 || !cipherBase64) throw new Error('Invalid payload');
  const key = await deriveConversationKey(passphrase, peer);
  const decrypted = await subtle.decrypt(
    { name: 'AES-GCM', iv: base64ToBytes(ivBase64) },
    key,
    base64ToBytes(cipherBase64),
  );
  return new TextDecoder().decode(decrypted);
}
