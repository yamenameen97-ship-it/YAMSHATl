const BUS_EVENT_PREFIX = 'yamshat:chat-bus:';
const listeners = new Map();

function getTarget() {
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') return window;
  if (typeof globalThis !== 'undefined' && typeof globalThis.EventTarget === 'function') {
    if (!globalThis.__YAMSHAT_CHAT_EVENT_BUS__) {
      globalThis.__YAMSHAT_CHAT_EVENT_BUS__ = new globalThis.EventTarget();
    }
    return globalThis.__YAMSHAT_CHAT_EVENT_BUS__;
  }
  return null;
}

function busName(topic = '') {
  return `${BUS_EVENT_PREFIX}${String(topic || '').trim()}`;
}

export function emitChatBus(topic, detail = {}) {
  const target = getTarget();
  if (!target || !topic) return;
  target.dispatchEvent(new CustomEvent(busName(topic), { detail }));
}

export function onChatBus(topic, handler) {
  const target = getTarget();
  if (!target || !topic || typeof handler !== 'function') return () => {};

  const eventName = busName(topic);
  const wrapped = (event) => handler(event?.detail || {});
  listeners.set(handler, wrapped);
  target.addEventListener(eventName, wrapped);
  return () => offChatBus(topic, handler);
}

export function offChatBus(topic, handler) {
  const target = getTarget();
  if (!target || !topic || typeof handler !== 'function') return;
  const wrapped = listeners.get(handler) || handler;
  target.removeEventListener(busName(topic), wrapped);
  listeners.delete(handler);
}
