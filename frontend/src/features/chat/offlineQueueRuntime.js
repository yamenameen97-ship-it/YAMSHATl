const DEAD_LETTER_STORAGE_PREFIX = 'yamshat-chat-dead-letter-v1';

function canUseStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}

function stableKey(value = '') {
  return String(value || '').trim().toLowerCase() || 'guest';
}

function deadLetterKey(user = '') {
  return `${DEAD_LETTER_STORAGE_PREFIX}:${stableKey(user)}`;
}

export function loadDeadLetters(user = '') {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(deadLetterKey(user));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function persistDeadLetters(user = '', entries = []) {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(deadLetterKey(user), JSON.stringify(Array.isArray(entries) ? entries.slice(-100) : []));
  } catch {
    // ignore storage failures
  }
}

export function pushDeadLetter(user = '', entry = {}) {
  const next = [
    ...loadDeadLetters(user),
    {
      id: entry?.id || `dead-${Date.now()}`,
      payload: entry?.payload || {},
      error: entry?.error || 'Queue item moved to dead letter',
      createdAt: entry?.createdAt || new Date().toISOString(),
      attempts: Number(entry?.attempts || 0),
      type: entry?.type || 'chat:send_message',
      priority: entry?.priority || 'normal',
    },
  ];
  persistDeadLetters(user, next);
  return next[next.length - 1];
}

export function prioritizeQueuedActions(actions = []) {
  const priorityOrder = { high: 0, normal: 1, low: 2 };
  return [...(Array.isArray(actions) ? actions : [])].sort((left, right) => {
    const leftPriority = priorityOrder[left?.priority] ?? priorityOrder.normal;
    const rightPriority = priorityOrder[right?.priority] ?? priorityOrder.normal;
    if (leftPriority !== rightPriority) return leftPriority - rightPriority;
    return new Date(left?.createdAt || 0).getTime() - new Date(right?.createdAt || 0).getTime();
  });
}
