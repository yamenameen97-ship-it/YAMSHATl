import { API_BASE } from '../api/config.js';
import { getAuthToken } from './auth.js';

const QUEUE_KEY = 'yamshat-analytics-queue';

function readQueue() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(QUEUE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue(queue) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(QUEUE_KEY, JSON.stringify(queue.slice(-50)));
  } catch {
    // ignore
  }
}

function getAnonymousId() {
  if (typeof window === 'undefined') return 'server';
  try {
    const key = 'yamshat-anonymous-id';
    const existing = window.localStorage.getItem(key);
    if (existing) return existing;
    const next = `anon-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem(key, next);
    return next;
  } catch {
    return `anon-${Date.now()}`;
  }
}

function buildHeaders() {
  const headers = {
    'Content-Type': 'application/json',
    'X-Yamshat-Client': 'web',
    'X-Session-Id': typeof window === 'undefined' ? 'server' : (window.sessionStorage.getItem('yamshat-session-id') || getAnonymousId()),
    'X-Anonymous-Id': getAnonymousId(),
  };
  const token = getAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function sendPayload(payload) {
  const endpoint = `${API_BASE}/analytics/events`;
  const body = JSON.stringify(payload);

  if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
    try {
      const blob = new Blob([body], { type: 'application/json' });
      const ok = navigator.sendBeacon(endpoint, blob);
      if (ok) return true;
    } catch {
      // fallback to fetch
    }
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: buildHeaders(),
    body,
    keepalive: true,
    credentials: 'include',
  });
  if (!response.ok) throw new Error(`Analytics failed: ${response.status}`);
  return true;
}

export async function flushAnalyticsQueue() {
  const queued = readQueue();
  if (!queued.length) return;
  const pending = [...queued];
  writeQueue([]);
  for (const item of pending) {
    try {
      await sendPayload(item);
    } catch {
      writeQueue([...readQueue(), item]);
    }
  }
}

export async function trackEvent(eventName, properties = {}, context = {}) {
  const payload = {
    event_name: eventName,
    category: context.category || 'ui',
    route: context.route || (typeof window !== 'undefined' ? window.location.pathname : '/'),
    platform: 'web',
    anonymous_id: getAnonymousId(),
    properties,
    context,
  };

  try {
    await sendPayload(payload);
  } catch {
    writeQueue([...readQueue(), payload]);
  }
}

export function trackPageView(route, title = '') {
  return trackEvent('page_view', { title: title || (typeof document !== 'undefined' ? document.title : '') }, { category: 'navigation', route });
}
