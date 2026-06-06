const DRAFT_STORAGE_PREFIX = 'yamshat-chat-draft-v1';

function canUseStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}

function stableKey(value = '') {
  return String(value || '').trim().toLowerCase();
}

function buildStorageKey(currentUser = '', peer = '') {
  return `${DRAFT_STORAGE_PREFIX}:${stableKey(currentUser) || 'guest'}:${stableKey(peer) || 'unknown'}`;
}

export function loadChatDraft(currentUser = '', peer = '') {
  if (!canUseStorage() || !peer) return '';
  try {
    return window.localStorage.getItem(buildStorageKey(currentUser, peer)) || '';
  } catch {
    return '';
  }
}

export function persistChatDraft(currentUser = '', peer = '', value = '') {
  if (!canUseStorage() || !peer) return;
  const nextValue = String(value || '');
  try {
    if (!nextValue.trim()) {
      window.localStorage.removeItem(buildStorageKey(currentUser, peer));
      return;
    }
    window.localStorage.setItem(buildStorageKey(currentUser, peer), nextValue);
  } catch {
    // ignore private mode / quota failures
  }
}

export function clearChatDraft(currentUser = '', peer = '') {
  if (!canUseStorage() || !peer) return;
  try {
    window.localStorage.removeItem(buildStorageKey(currentUser, peer));
  } catch {
    // ignore storage cleanup failures
  }
}
