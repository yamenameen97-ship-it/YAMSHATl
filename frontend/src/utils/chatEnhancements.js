const CHAT_PREFS_KEY = 'yamshat:chat:prefs';
const CHAT_REACTIONS_KEY = 'yamshat:chat:reactions';
const CHAT_SCHEDULED_KEY = 'yamshat:chat:scheduled';

function safeParse(value, fallback) {
  try {
    return JSON.parse(value ?? '');
  } catch {
    return fallback;
  }
}

function loadJson(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  return safeParse(window.localStorage.getItem(key), fallback);
}

function saveJson(key, value) {
  if (typeof window === 'undefined') return value;
  window.localStorage.setItem(key, JSON.stringify(value));
  return value;
}

export function getChatPrefs() {
  return loadJson(CHAT_PREFS_KEY, { pinned: {}, archived: {} });
}

export function isPinnedChat(username) {
  return Boolean(getChatPrefs().pinned?.[username]);
}

export function isArchivedChat(username) {
  return Boolean(getChatPrefs().archived?.[username]);
}

export function togglePinnedChat(username) {
  const prefs = getChatPrefs();
  prefs.pinned[username] = !prefs.pinned[username];
  return saveJson(CHAT_PREFS_KEY, prefs);
}

export function toggleArchivedChat(username) {
  const prefs = getChatPrefs();
  prefs.archived[username] = !prefs.archived[username];
  return saveJson(CHAT_PREFS_KEY, prefs);
}

export function getMessageReactions(peer) {
  const all = loadJson(CHAT_REACTIONS_KEY, {});
  return all?.[peer] || {};
}

export function toggleMessageReaction(peer, messageKey, emoji) {
  const all = loadJson(CHAT_REACTIONS_KEY, {});
  const byPeer = all[peer] || {};
  const current = byPeer[messageKey] || [];
  const exists = current.includes(emoji);
  byPeer[messageKey] = exists ? current.filter((item) => item !== emoji) : [...current, emoji];
  all[peer] = byPeer;
  saveJson(CHAT_REACTIONS_KEY, all);
  return byPeer;
}

export function buildReplyText(text, originalMessage) {
  const cleanText = String(text || '').trim();
  const original = String(originalMessage?.message || originalMessage?.content || '').trim();
  const sender = String(originalMessage?.sender || '').trim();
  if (!cleanText) return '';
  if (!original) return cleanText;
  const snippet = original.length > 80 ? `${original.slice(0, 77)}...` : original;
  return `↪ ${sender}: ${snippet}\n${cleanText}`;
}

export function parseReplyText(content) {
  const text = String(content || '');
  const lines = text.split('\n');
  const first = lines[0] || '';
  if (!first.startsWith('↪ ')) return { replyMeta: null, body: text };
  return {
    replyMeta: first.replace(/^↪\s*/, ''),
    body: lines.slice(1).join('\n').trim(),
  };
}

export async function compressImageFile(file, options = {}) {
  if (!file || !String(file.type || '').startsWith('image/')) return file;
  const maxDimension = Number(options.maxDimension || 1600);
  const quality = Number(options.quality || 0.82);
  const minBytes = Number(options.minBytes || 1.5 * 1024 * 1024);
  if (file.size < minBytes) return file;

  const imageUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const next = new Image();
      next.onload = () => resolve(next);
      next.onerror = reject;
      next.src = imageUrl;
    });

    const ratio = Math.min(1, maxDimension / Math.max(img.width || 1, img.height || 1));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round((img.width || 1) * ratio);
    canvas.height = Math.round((img.height || 1) * ratio);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg', lastModified: Date.now() });
  } catch {
    return file;
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

export function exportConversation(peer, messages) {
  const payload = {
    peer,
    exported_at: new Date().toISOString(),
    total_messages: Array.isArray(messages) ? messages.length : 0,
    messages,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `chat-backup-${peer}-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function getScheduledMessages() {
  return loadJson(CHAT_SCHEDULED_KEY, []);
}

export function saveScheduledMessages(items) {
  return saveJson(CHAT_SCHEDULED_KEY, items);
}

export function queueScheduledMessage(item) {
  const items = getScheduledMessages();
  items.push(item);
  saveScheduledMessages(items);
  return items;
}

export function removeScheduledMessage(scheduleId) {
  const next = getScheduledMessages().filter((item) => item.schedule_id !== scheduleId);
  saveScheduledMessages(next);
  return next;
}

function normalizeSearchText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[^\p{L}\p{N}\s._-]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenizeSearch(value) {
  return normalizeSearchText(value)
    .split(' ')
    .map((token) => token.trim())
    .filter(Boolean);
}

export function buildMessageSearchIndex(messages = [], resolveMessageText = (message) => message?.message || message?.content || '') {
  return messages.map((message) => {
    const resolved = resolveMessageText(message);
    const text = typeof resolved === 'string' ? resolved : (resolved?.text || '');
    const fileName = String(message?.file_name || message?.media_name || message?.attachment_name || '');
    const sender = String(message?.sender || '');
    const type = String(message?.type || 'text');
    const searchable = normalizeSearchText([text, fileName, sender, type].filter(Boolean).join(' '));
    return {
      key: message?.id || message?.client_id,
      message,
      searchable,
      tokens: tokenizeSearch(searchable),
    };
  });
}

export function searchIndexedMessages(index = [], query = '') {
  const terms = tokenizeSearch(query);
  if (!terms.length) return index.map((entry) => entry.message);
  return index
    .filter((entry) => terms.every((term) => entry.searchable.includes(term) || entry.tokens.includes(term)))
    .map((entry) => entry.message);
}
