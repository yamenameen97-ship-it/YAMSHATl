const CHAT_STORAGE_VERSION = 2;
const CHAT_STORAGE_PREFIX = `yamshat-chat-state-v${CHAT_STORAGE_VERSION}`;
const OUTBOX_STORAGE_PREFIX = `yamshat-chat-outbox-v${CHAT_STORAGE_VERSION}`;
const RECEIPTS_STORAGE_PREFIX = `yamshat-chat-receipts-v${CHAT_STORAGE_VERSION}`;
const MAX_OUTBOX_ITEMS = 200;

function canUseStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}

function normalizeUserKey(user = '') {
  return String(user || 'guest').trim().toLowerCase() || 'guest';
}

function safeReadJson(key, fallbackValue) {
  if (!canUseStorage()) return fallbackValue;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallbackValue;
    const parsed = JSON.parse(raw);
    return parsed ?? fallbackValue;
  } catch {
    return fallbackValue;
  }
}

function safeWriteJson(key, value) {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage quota / privacy mode failures
  }
}

function safeRemove(key) {
  if (!canUseStorage()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore storage cleanup failures
  }
}

function asIsoTimestamp(value, fallback = null) {
  if (!value) return fallback;
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return fallback;
    return date.toISOString();
  } catch {
    return fallback;
  }
}

function stableString(value = '') {
  return String(value || '').trim();
}

export function getChatSnapshotStorageKey(user = '') {
  return `${CHAT_STORAGE_PREFIX}:${normalizeUserKey(user)}`;
}

export function getOutboxStorageKey(user = '') {
  return `${OUTBOX_STORAGE_PREFIX}:${normalizeUserKey(user)}`;
}

export function getReceiptsStorageKey(user = '') {
  return `${RECEIPTS_STORAGE_PREFIX}:${normalizeUserKey(user)}`;
}

export function loadChatSnapshot(user = '') {
  const fallback = {
    threadsByUsername: {},
    conversationsByPeer: {},
    pendingReceiptsByPeer: {},
    lastHydratedAt: null,
  };
  return safeReadJson(getChatSnapshotStorageKey(user), fallback);
}

export function persistChatSnapshot(user = '', snapshot = {}) {
  if (!user) return;
  safeWriteJson(getChatSnapshotStorageKey(user), {
    threadsByUsername: snapshot.threadsByUsername || {},
    conversationsByPeer: snapshot.conversationsByPeer || {},
    pendingReceiptsByPeer: snapshot.pendingReceiptsByPeer || {},
    lastHydratedAt: snapshot.lastHydratedAt || new Date().toISOString(),
  });
}

export function clearChatSnapshot(user = '') {
  if (!user) return;
  safeRemove(getChatSnapshotStorageKey(user));
}

export function loadOutbox(user = '') {
  const parsed = safeReadJson(getOutboxStorageKey(user), []);
  return Array.isArray(parsed) ? parsed : [];
}

export function persistOutbox(user = '', entries = []) {
  if (!user) return;
  const safeEntries = Array.isArray(entries) ? entries.slice(-MAX_OUTBOX_ITEMS) : [];
  safeWriteJson(getOutboxStorageKey(user), safeEntries);
}

export function loadPendingReceipts(user = '') {
  const parsed = safeReadJson(getReceiptsStorageKey(user), {});
  return parsed && typeof parsed === 'object' ? parsed : {};
}

export function persistPendingReceipts(user = '', receipts = {}) {
  if (!user) return;
  safeWriteJson(getReceiptsStorageKey(user), receipts && typeof receipts === 'object' ? receipts : {});
}

export function buildMessageIdentity(message = {}) {
  return stableString(
    message?.id
    || message?.message_id
    || message?.client_id
    || message?._id
    || `${stableString(message?.sender)}:${stableString(message?.receiver)}:${stableString(message?.created_at)}:${stableString(message?.content || message?.message)}`,
  );
}

export function getMessageTimestamp(message = {}) {
  return asIsoTimestamp(message?.created_at || message?.updated_at || message?.sent_at, new Date(0).toISOString());
}

export function compareMessages(a = {}, b = {}) {
  const timeA = new Date(getMessageTimestamp(a)).getTime();
  const timeB = new Date(getMessageTimestamp(b)).getTime();
  if (timeA !== timeB) return timeA - timeB;
  return buildMessageIdentity(a).localeCompare(buildMessageIdentity(b));
}

export function mergeMessages(existing = [], incoming = [], options = {}) {
  const limit = Math.max(20, Number(options?.limit || 200));
  const merged = new Map();

  [...(Array.isArray(existing) ? existing : []), ...(Array.isArray(incoming) ? incoming : [])].forEach((message) => {
    const key = buildMessageIdentity(message);
    if (!key) return;
    const previous = merged.get(key) || {};
    merged.set(key, {
      ...previous,
      ...(message || {}),
      id: message?.id ?? previous?.id,
      client_id: message?.client_id ?? previous?.client_id,
    });
  });

  return Array.from(merged.values())
    .sort(compareMessages)
    .slice(-limit);
}

export function normalizeThread(thread = {}) {
  const username = stableString(thread?.username || thread?.peer || thread?.name);
  if (!username) return null;

  return {
    username,
    unread_count: Math.max(0, Number(thread?.unread_count ?? thread?.unreadCount ?? 0)),
    last_message: thread?.last_message || thread?.message || thread?.preview || 'ابدأ المحادثة الآن',
    last_message_type: thread?.last_message_type || thread?.type || 'text',
    last_message_at: asIsoTimestamp(thread?.last_message_at || thread?.created_at, new Date().toISOString()),
    presence: {
      ...(thread?.presence || {}),
      is_online: Boolean(thread?.presence?.is_online ?? thread?.is_online ?? thread?.isOnline ?? false),
    },
    draft: stableString(thread?.draft),
  };
}

export function mergeThreadsMap(existing = {}, incoming = []) {
  const next = { ...(existing || {}) };
  (Array.isArray(incoming) ? incoming : []).forEach((thread) => {
    const normalized = normalizeThread(thread);
    if (!normalized?.username) return;
    next[normalized.username] = {
      ...(next[normalized.username] || {}),
      ...normalized,
      presence: {
        ...(next[normalized.username]?.presence || {}),
        ...(normalized.presence || {}),
      },
    };
  });
  return next;
}

export function createConversationState(messages = [], meta = {}) {
  return {
    messages: mergeMessages([], messages, { limit: meta?.limit || 200 }),
    hasMore: Boolean(meta?.hasMore),
    oldestMessageId: stableString(meta?.oldestMessageId || messages?.[0]?.id || messages?.[0]?.message_id || ''),
    lastUpdate: Date.now(),
  };
}

export function mergeConversationState(current = {}, incomingMessages = [], meta = {}) {
  const mergedMessages = mergeMessages(current?.messages || [], incomingMessages, { limit: meta?.limit || 200 });
  return {
    ...current,
    messages: mergedMessages,
    hasMore: meta?.hasMore ?? current?.hasMore ?? false,
    oldestMessageId: stableString(meta?.oldestMessageId || mergedMessages?.[0]?.id || mergedMessages?.[0]?.message_id || current?.oldestMessageId || ''),
    lastUpdate: Date.now(),
  };
}

export function buildQueuedEnvelope(eventName, payload = {}, options = {}) {
  const now = Date.now();
  const randomId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `evt-${now}-${Math.random().toString(36).slice(2, 10)}`;

  return {
    id: stableString(options?.id || payload?.queue_id || payload?.client_id || randomId),
    eventName: stableString(eventName),
    payload: { ...(payload || {}) },
    attempts: Math.max(0, Number(options?.attempts || 0)),
    maxAttempts: Math.max(1, Number(options?.maxAttempts || 5)),
    createdAt: Number(options?.createdAt || now),
    lastAttemptAt: Number(options?.lastAttemptAt || 0),
    nextRetryAt: Number(options?.nextRetryAt || 0),
    volatile: Boolean(options?.volatile),
  };
}

export function mergeQueuedEnvelopes(existing = [], nextEntry) {
  const entries = Array.isArray(existing) ? existing : [];
  const envelope = nextEntry || null;
  if (!envelope?.id) return entries.slice(-MAX_OUTBOX_ITEMS);
  const filtered = entries.filter((item) => item?.id !== envelope.id);
  return [...filtered, envelope].slice(-MAX_OUTBOX_ITEMS);
}

export function removeQueuedEnvelope(existing = [], envelopeId = '') {
  return (Array.isArray(existing) ? existing : []).filter((item) => item?.id !== envelopeId);
}

export function mergeReceiptBucket(current = {}, peer = '', messageIds = [], type = 'seen') {
  const peerKey = stableString(peer);
  if (!peerKey) return current || {};

  const ids = new Set([
    ...((current?.[peerKey]?.[type] || []).map((value) => stableString(value))),
    ...((Array.isArray(messageIds) ? messageIds : []).map((value) => stableString(value))),
  ].filter(Boolean));

  return {
    ...(current || {}),
    [peerKey]: {
      ...(current?.[peerKey] || {}),
      [type]: Array.from(ids),
    },
  };
}

export function removeReceiptIds(current = {}, peer = '', type = 'seen', messageIds = []) {
  const peerKey = stableString(peer);
  if (!peerKey || !current?.[peerKey]?.[type]) return current || {};
  const toRemove = new Set((Array.isArray(messageIds) ? messageIds : []).map((value) => stableString(value)).filter(Boolean));
  const nextIds = toRemove.size
    ? current[peerKey][type].filter((value) => !toRemove.has(stableString(value)))
    : [];

  const next = { ...(current || {}) };
  next[peerKey] = {
    ...(next[peerKey] || {}),
    [type]: nextIds,
  };

  if (!nextIds.length && !((next[peerKey]?.delivered || []).length)) {
    delete next[peerKey];
  }

  return next;
}
