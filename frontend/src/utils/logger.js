const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };
const JWT_PATTERN = /\b[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\b/g;
const SENSITIVE_KEYS = new Set([
  'authorization',
  'token',
  'access_token',
  'refresh_token',
  'csrf_token',
  'password',
  'secret',
  'cookie',
  'set-cookie',
]);

function currentLevel() {
  const raw = String(import.meta.env.VITE_LOG_LEVEL || 'info').toLowerCase();
  return LEVELS[raw] || LEVELS.info;
}

function canLog(level) {
  return LEVELS[level] >= currentLevel();
}

function redactString(value) {
  return String(value || '').replace(JWT_PATTERN, '[REDACTED_JWT]');
}

function redactMeta(value) {
  if (Array.isArray(value)) return value.map((item) => redactMeta(item));
  if (!value || typeof value !== 'object') return typeof value === 'string' ? redactString(value) : value;
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => {
      if (SENSITIVE_KEYS.has(String(key).toLowerCase())) return [key, '[REDACTED]'];
      return [key, redactMeta(entry)];
    })
  );
}

function emit(level, message, meta = {}) {
  if (!canLog(level)) return;
  const safeMeta = redactMeta(meta);
  const safeMessage = redactString(message);
  const payload = {
    level,
    message: safeMessage,
    meta: safeMeta,
    timestamp: new Date().toISOString(),
  };
  const method = level === 'debug' ? 'debug' : level === 'info' ? 'info' : level === 'warn' ? 'warn' : 'error';
  if (typeof console !== 'undefined' && typeof console[method] === 'function') {
    console[method](`[yamshat:${level}] ${safeMessage}`, safeMeta);
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('yamshat:log', { detail: payload }));
  }
}

export const logger = {
  debug: (message, meta) => emit('debug', message, meta),
  info: (message, meta) => emit('info', message, meta),
  warn: (message, meta) => emit('warn', message, meta),
  error: (message, meta) => emit('error', message, meta),
};

export default logger;
