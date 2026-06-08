const STORAGE_KEY = 'yamshat-chat-preferences';

function readRaw() {
  if (typeof window === 'undefined') return { muted: [], archived: [], pinned: [] };
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}');
    return {
      muted: Array.isArray(parsed.muted) ? parsed.muted : [],
      archived: Array.isArray(parsed.archived) ? parsed.archived : [],
      pinned: Array.isArray(parsed.pinned) ? parsed.pinned : [],
    };
  } catch {
    return { muted: [], archived: [], pinned: [] };
  }
}

function writeRaw(data) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getChatPreferences() {
  const raw = readRaw();
  return {
    muted: new Set(raw.muted),
    archived: new Set(raw.archived),
    pinned: new Set(raw.pinned),
  };
}

export function toggleChatPreference(type, username) {
  const raw = readRaw();
  const next = new Set(raw[type] || []);
  if (next.has(username)) next.delete(username);
  else next.add(username);
  raw[type] = [...next];
  writeRaw(raw);
  return new Set(raw[type]);
}

export function setChatPreferenceSet(type, values) {
  const raw = readRaw();
  raw[type] = [...new Set([...(values || [])])];
  writeRaw(raw);
  return new Set(raw[type]);
}
