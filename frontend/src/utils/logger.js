const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };

function currentLevel() {
  const raw = String(import.meta.env.VITE_LOG_LEVEL || 'info').toLowerCase();
  return LEVELS[raw] || LEVELS.info;
}

function canLog(level) {
  return LEVELS[level] >= currentLevel();
}

function emit(level, message, meta = {}) {
  if (!canLog(level)) return;
  const payload = {
    level,
    message,
    meta,
    timestamp: new Date().toISOString(),
  };
  const method = level === 'debug' ? 'debug' : level === 'info' ? 'info' : level === 'warn' ? 'warn' : 'error';
  if (typeof console !== 'undefined' && typeof console[method] === 'function') {
    console[method](`[yamshat:${level}] ${message}`, meta);
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
