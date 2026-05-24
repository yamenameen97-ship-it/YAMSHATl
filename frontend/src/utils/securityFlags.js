const normalizeBoolean = (value, fallback = false) => {
  if (value === undefined || value === null || value === '') return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return fallback;
};

const runtimeFlag = typeof window !== 'undefined'
  ? window.__APP_CAPTCHA_ENABLED__ ?? window.APP_CAPTCHA_ENABLED ?? ''
  : '';

export const CAPTCHA_ENABLED = normalizeBoolean(import.meta.env.VITE_CAPTCHA_ENABLED ?? runtimeFlag, false);
