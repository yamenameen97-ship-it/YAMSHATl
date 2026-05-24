const STORAGE_PREFIX = 'yamshat:chat:stable:v1';
const MAX_PERSISTED_MESSAGES = 250;
const MAX_ACK_ITEMS = 300;

function safeParse(raw, fallback) {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function toIso(value) {
  if (!value) return new Date().toISOString();
  try {
    return new Date(value).toISOString();
  } catch {
    return new Date().toISOString();
  }
}

function getStorage() {
  if (typeof window === 'undefined') return null;
  return window.localStorage;
}

function key(scope, user = 'guest', peer = 'global') {
  return `${STORAGE_PREFIX}:${scope}:${user}:${peer}`;
}

export function getMessageIdentity(message = {}) {
  const id = message?.id ?? message?.message_id;
  if (id !== undefined && id !== null && String(id).trim()) return `id:${String(id)}`;
  if (message?.client_id) return `client:${String(message.client_id)}`;
  if (message?.local_id) return `local:${String(message.local_id)}`;
  const sender = String(message?.sender || '');
  const receiver = String(message?.receiver || '');
  const createdAt = String(message?.created_at || message?.timestamp || '');
  const content = String(message?.content || message?.message || '');
  const media = String(message?.media_url || '');
  return `fallback:${sender}|${receiver}|${createdAt}|${content}|${media}`;
}

export function normalizeMessage(message = {}) {
  const normalized = {
    ...message,
    created_at: toIso(message?.created_at || message?.timestamp || Date.now()),
  };
  if (!normalized.message && normalized.content) normalized.message = normalized.content;
  if (!normalized.content && normalized.message) normalized.content = normalized.message;
  if (!normalized.status) normalized.status = normalized.deleted ? 'deleted' : 'sent';
  if (!normalized.local_id) normalized.local_id = normalized.client_id || normalized.id || undefined;
  return normalized;
}

export function mergeMessages(existing = [], incoming = [], options = {}) {
  const keep = Number(options.keep || MAX_PERSISTED_MESSAGES);
  const map = new Map();

  [...(Array.isArray(existing) ? existing : []), ...(Array.isArray(incoming) ? incoming : [])]
    .map((item) => normalizeMessage(item))
    .forEach((item) => {
      const identity = getMessageIdentity(item);
      const previous = map.get(identity);
      map.set(identity, previous ? { ...previous, ...item } : item);
    });

  const merged = Array.from(map.values()).sort((a, b) => {
    const aTime = new Date(a.created_at || 0).getTime();
    const bTime = new Date(b.created_at || 0).getTime();
    if (aTime !== bTime) return aTime - bTime;
    return String(a.id || a.client_id || '').localeCompare(String(b.id || b.client_id || ''));
  });

  return keep > 0 ? merged.slice(-keep) : merged;
}

export function loadConversationSnapshot(user, peer) {
  const storage = getStorage();
  if (!storage || !user || !peer) return { messages: [], paging: { has_more: true, next_before_id: null }, updated_at: null };
  return safeParse(storage.getItem(key('conversation', user, peer)), {
    messages: [],
    paging: { has_more: true, next_before_id: null },
    updated_at: null,
  });
}

export function persistConversationSnapshot(user, peer, snapshot = {}) {
  const storage = getStorage();
  if (!storage || !user || !peer) return snapshot;
  const current = loadConversationSnapshot(user, peer);
  const payload = {
    messages: mergeMessages(current.messages, snapshot.messages, { keep: Number(snapshot.keep || MAX_PERSISTED_MESSAGES) }),
    paging: {
      ...(current.paging || {}),
      ...(snapshot.paging || {}),
    },
    updated_at: new Date().toISOString(),
  };
  storage.setItem(key('conversation', user, peer), JSON.stringify(payload));
  return payload;
}

export function replaceConversationSnapshot(user, peer, snapshot = {}) {
  const storage = getStorage();
  if (!storage || !user || !peer) return snapshot;
  const payload = {
    messages: mergeMessages([], snapshot.messages, { keep: Number(snapshot.keep || MAX_PERSISTED_MESSAGES) }),
    paging: {
      has_more: true,
      next_before_id: null,
      ...(snapshot.paging || {}),
    },
    updated_at: new Date().toISOString(),
  };
  storage.setItem(key('conversation', user, peer), JSON.stringify(payload));
  return payload;
}

export function loadPendingAckMap(user) {
  const storage = getStorage();
  if (!storage || !user) return {};
  return safeParse(storage.getItem(key('acks', user, 'global')), {});
}

export function persistPendingAckMap(user, ackMap = {}) {
  const storage = getStorage();
  if (!storage || !user) return ackMap;
  const entries = Object.entries(ackMap || {}).slice(-MAX_ACK_ITEMS);
  const compact = Object.fromEntries(entries);
  storage.setItem(key('acks', user, 'global'), JSON.stringify(compact));
  return compact;
}

export function markPendingAck(user, peer, message = {}) {
  const ackMap = loadPendingAckMap(user);
  const ackKey = String(message?.client_id || message?.local_id || message?.id || '');
  if (!ackKey) return ackMap;
  ackMap[ackKey] = {
    peer,
    created_at: toIso(message?.created_at || Date.now()),
    status: message?.status || 'sending',
    id: message?.id || null,
  };
  return persistPendingAckMap(user, ackMap);
}

export function resolvePendingAck(user, clientOrLocalId, patch = {}) {
  const ackMap = loadPendingAckMap(user);
  const ackKey = String(clientOrLocalId || '');
  if (!ackKey || !ackMap[ackKey]) return ackMap;
  if (patch?.remove !== false) {
    delete ackMap[ackKey];
  } else {
    ackMap[ackKey] = { ...ackMap[ackKey], ...(patch || {}) };
  }
  return persistPendingAckMap(user, ackMap);
}

export function listPendingAckItems(user, peer = '') {
  const ackMap = loadPendingAckMap(user);
  return Object.entries(ackMap)
    .map(([clientId, value]) => ({ clientId, ...(value || {}) }))
    .filter((item) => !peer || item.peer === peer)
    .sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());
}

export function mergePaging(current = {}, incoming = {}) {
  return {
    has_more: typeof incoming?.has_more === 'boolean' ? incoming.has_more : Boolean(current?.has_more),
    next_before_id: incoming?.next_before_id ?? current?.next_before_id ?? null,
    limit: incoming?.limit ?? current?.limit ?? null,
  };
}

export function buildQueuedChatAction(payload = {}) {
  const clientId = String(payload?.client_id || `queued-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  return {
    id: `chat-send:${clientId}`,
    type: 'chat:send_message',
    payload: {
      ...payload,
      client_id: clientId,
    },
    meta: {
      receiver: payload?.receiver,
      kind: payload?.type || 'text',
    },
  };
}
