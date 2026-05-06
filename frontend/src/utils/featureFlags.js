function readFlag(name, fallback = true) {
  const value = import.meta.env[name];
  if (value === undefined) return fallback;
  return String(value).trim().toLowerCase() !== 'false';
}

export const featureFlags = {
  offlineQueue: readFlag('VITE_ENABLE_OFFLINE_QUEUE', true),
  chatCache: readFlag('VITE_ENABLE_CHAT_CACHE', true),
  frontendLogging: readFlag('VITE_ENABLE_FRONTEND_LOGGING', true),
};

export default featureFlags;
