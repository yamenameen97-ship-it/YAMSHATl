import API from './axios.js';
import sessionManager from '../auth/sessionManager.js';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const OAUTH_EVENT_SUCCESS = 'yamshat-oauth-success';
const OAUTH_EVENT_ERROR = 'yamshat-oauth-error';
const OAUTH_POPUP_FEATURES = 'popup=yes,width=560,height=720,menubar=no,toolbar=no,location=yes,resizable=yes,scrollbars=yes,status=no';

export const loginUser = async (data) => {
  const response = await API.post('/auth/login', data);
  return response;
};

export const socialLoginUser = async (data) => {
  const response = await API.post('/auth/social-login', data);
  return response;
};

export const verifyTwoFactorLogin = async (data) => {
  const response = await API.post('/auth/verify-2fa-login', data);
  return response;
};

export const setupTwoFactor = async () => {
  const response = await API.post('/auth/2fa/setup');
  return response;
};

export const verifyTwoFactorSetup = async (data) => {
  const response = await API.post('/auth/2fa/verify-setup', data);
  return response;
};

export const disableTwoFactor = async () => {
  const response = await API.post('/auth/2fa/disable');
  return response;
};

export const devLoginUser = async (data = {}) => {
  const response = await API.post('/auth/dev-login', data);
  return response;
};

export const registerUser = async (data) => {
  const response = await API.post('/auth/register', data);
  return response;
};

export const verifyEmail = async (data) => {
  const response = await API.post('/auth/verify-email', data);
  return response;
};

export const resendVerification = async (data) => {
  const response = await API.post('/auth/resend-verification', data);
  return response;
};

// 🔥 Warmup: استيقاظ الباك إند قبل أول طلب captcha
// يحل مشكلة 503 cold start على Render Free
let _warmupDone = false;
const warmupBackend = async () => {
  if (_warmupDone) return;
  try {
    await API.get('/warmup', { timeout: 60000, retryable: true, cache: false });
    _warmupDone = true;
  } catch {
    // تجاهل — السيرفر قد لا يدعم /warmup، سنحاول /captcha مباشرة
  }
};

export const getCaptchaChallenge = async () => {
  let lastError;

  // 🔥 إصلاح حاسم: على Render Free، الخدمة تنام بعد 15د.
  // أول طلب يرجّع 503 وأحياناً يظهر كأنه CORS error.
  // الحل: warmup + retries أطول (5 محاولات × backoff تصاعدي)
  await warmupBackend();

  const MAX_ATTEMPTS = 5;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await API.get('/auth/captcha', {
        cache: false,
        forceRefresh: true,
        retryable: true,
        timeout: 60000,
      });
      _warmupDone = true; // نجح الطلب => السيرفر صاحٍ
      return response;
    } catch (error) {
      lastError = error;
      const status = error?.response?.status;
      // معاملة أخطاء الشبكة (no response) كـ retriable لأنها غالباً cold start
      const isNetworkError = !error?.response;
      const isRetriable = isNetworkError || [408, 425, 429, 500, 502, 503, 504].includes(status);
      if (!isRetriable || attempt === MAX_ATTEMPTS - 1) break;
      // backoff: 1.5s, 3s, 5s, 8s
      const delay = [1500, 3000, 5000, 8000][attempt] || 8000;
      await sleep(delay);
    }
  }

  throw lastError;
};

export const forgotPassword = async (data) => {
  const response = await API.post('/auth/forgot-password', data);
  return response;
};

export const verifyResetCode = async (data) => {
  const response = await API.post('/auth/verify-reset-code', data);
  return response;
};

export const resetPassword = async (data) => {
  const response = await API.post('/auth/reset-password', data);
  return response;
};

export const refreshSession = async () => sessionManager.refreshSession({ reason: 'manual' });
export const getMe = () => API.get('/users/me');
export const logoutUser = () => API.post('/auth/logout');
export const logoutAllDevices = () => API.post('/auth/logout-all');

async function fetchOAuthLoginUrl(provider) {
  const { data } = await API.get(`/auth/oauth/${provider}/login`, { cache: false, forceRefresh: true });
  if (!data?.url) {
    throw new Error(data?.detail || `OAuth URL is missing for ${provider}`);
  }
  return data;
}

export async function startOAuthPopup(provider, { timeoutMs = 180000 } = {}) {
  const { url } = await fetchOAuthLoginUrl(provider);
  const popup = window.open(url, `yamshat-oauth-${provider}`, OAUTH_POPUP_FEATURES);

  if (!popup) {
    window.location.assign(url);
    return { pendingRedirect: true };
  }

  popup.focus?.();

  return new Promise((resolve, reject) => {
    let timeoutId = null;
    let popupMonitorId = null;

    const cleanup = () => {
      window.removeEventListener('message', handleMessage);
      if (timeoutId) window.clearTimeout(timeoutId);
      if (popupMonitorId) window.clearInterval(popupMonitorId);
    };

    const handleMessage = (event) => {
      const { data } = event;
      if (!data?.type || ![OAUTH_EVENT_SUCCESS, OAUTH_EVENT_ERROR].includes(data.type)) return;

      cleanup();
      try {
        popup.close();
      } catch {
        // ignore popup close errors
      }

      if (data.type === OAUTH_EVENT_ERROR) {
        reject(new Error(data.error || 'تعذر إكمال تسجيل الدخول الاجتماعي.'));
        return;
      }

      resolve(data.payload || null);
    };

    timeoutId = window.setTimeout(() => {
      cleanup();
      try {
        popup.close();
      } catch {
        // ignore popup close errors
      }
      reject(new Error('انتهت مهلة تسجيل الدخول الاجتماعي. حاول مرة أخرى.'));
    }, timeoutMs);

    popupMonitorId = window.setInterval(() => {
      if (!popup || popup.closed) {
        cleanup();
        reject(new Error('تم إغلاق نافذة تسجيل الدخول قبل إكمال العملية.'));
      }
    }, 500);

    window.addEventListener('message', handleMessage);
  });
}

export const loginWithGoogle = () => startOAuthPopup('google');
export const loginWithFacebook = () => startOAuthPopup('facebook');
export const loginWithApple = () => startOAuthPopup('apple');
