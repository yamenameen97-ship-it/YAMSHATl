import { A as API } from "../index-T8PSkq5D.js";
const OAUTH_EVENT_SUCCESS = "yamshat-oauth-success";
const OAUTH_EVENT_ERROR = "yamshat-oauth-error";
const OAUTH_POPUP_FEATURES = "popup=yes,width=560,height=720,menubar=no,toolbar=no,location=yes,resizable=yes,scrollbars=yes,status=no";
const loginUser = async (data) => {
  const response = await API.post("/auth/login", data);
  return response;
};
const verifyTwoFactorLogin = async (data) => {
  const response = await API.post("/auth/verify-2fa-login", data);
  return response;
};
const devLoginUser = async (data = {}) => {
  const response = await API.post("/auth/dev-login", data);
  return response;
};
const registerUser = async (data) => {
  const response = await API.post("/auth/register", data);
  return response;
};
const verifyEmail = async (data) => {
  const response = await API.post("/auth/verify-email", data);
  return response;
};
const resendVerification = async (data) => {
  const response = await API.post("/auth/resend-verification", data);
  return response;
};
const getCaptchaChallenge = async () => {
  const response = await API.get("/auth/captcha", { cache: false, forceRefresh: true });
  return response;
};
const forgotPassword = async (data) => {
  const response = await API.post("/auth/forgot-password", data);
  return response;
};
const verifyResetCode = async (data) => {
  const response = await API.post("/auth/verify-reset-code", data);
  return response;
};
const resetPassword = async (data) => {
  const response = await API.post("/auth/reset-password", data);
  return response;
};
const logoutUser = () => API.post("/auth/logout");
async function fetchOAuthLoginUrl(provider) {
  const { data } = await API.get(`/auth/oauth/${provider}/login`, { cache: false, forceRefresh: true });
  if (!data?.url) {
    throw new Error(data?.detail || `OAuth URL is missing for ${provider}`);
  }
  return data;
}
async function startOAuthPopup(provider, { timeoutMs = 18e4 } = {}) {
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
      window.removeEventListener("message", handleMessage);
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
      }
      if (data.type === OAUTH_EVENT_ERROR) {
        reject(new Error(data.error || "تعذر إكمال تسجيل الدخول الاجتماعي."));
        return;
      }
      resolve(data.payload || null);
    };
    timeoutId = window.setTimeout(() => {
      cleanup();
      try {
        popup.close();
      } catch {
      }
      reject(new Error("انتهت مهلة تسجيل الدخول الاجتماعي. حاول مرة أخرى."));
    }, timeoutMs);
    popupMonitorId = window.setInterval(() => {
      if (!popup || popup.closed) {
        cleanup();
        reject(new Error("تم إغلاق نافذة تسجيل الدخول قبل إكمال العملية."));
      }
    }, 500);
    window.addEventListener("message", handleMessage);
  });
}
const loginWithGoogle = () => startOAuthPopup("google");
const loginWithFacebook = () => startOAuthPopup("facebook");
const loginWithApple = () => startOAuthPopup("apple");
export {
  loginWithApple as a,
  loginWithFacebook as b,
  loginWithGoogle as c,
  devLoginUser as d,
  logoutUser as e,
  forgotPassword as f,
  getCaptchaChallenge as g,
  resendVerification as h,
  resetPassword as i,
  verifyResetCode as j,
  verifyTwoFactorLogin as k,
  loginUser as l,
  registerUser as r,
  verifyEmail as v
};
