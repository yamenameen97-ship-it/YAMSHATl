import API from './axios.js';
import { API_BASE } from './config.js';
import sessionManager from '../auth/sessionManager.js';

export const loginUser = async (data) => {
  const response = await API.post('/auth/login', data, { public: true, skipAuth: true, skipCsrf: true });
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
  const response = await API.post('/auth/dev-login', data, { public: true, skipAuth: true, skipCsrf: true });
  return response;
};

export const registerUser = async (data) => {
  const response = await API.post('/auth/register', data, { public: true, skipAuth: true, skipCsrf: true });
  return response;
};

export const verifyEmail = async (data) => {
  const response = await API.post('/auth/verify-email', data, { public: true, skipAuth: true, skipCsrf: true });
  return response;
};

export const resendVerification = async (data) => {
  const response = await API.post('/auth/resend-verification', data, { public: true, skipAuth: true, skipCsrf: true });
  return response;
};

export const getCaptchaChallenge = async () => {
  const response = await API.get('/auth/captcha', {
    cache: false,
    forceRefresh: true,
    public: true,
    skipAuth: true,
    skipCsrf: true,
  });
  return response;
};

export const forgotPassword = async (data) => {
  const response = await API.post('/auth/forgot-password', data, { public: true, skipAuth: true, skipCsrf: true });
  return response;
};

export const verifyResetCode = async (data) => {
  const response = await API.post('/auth/verify-reset-code', data, { public: true, skipAuth: true, skipCsrf: true });
  return response;
};

export const resetPassword = async (data) => {
  const response = await API.post('/auth/reset-password', data, { public: true, skipAuth: true, skipCsrf: true });
  return response;
};

export const refreshSession = async () => sessionManager.refreshSession({ reason: 'manual' });
export const getMe = () => API.get('/users/me');
export const logoutUser = () => API.post('/auth/logout');
export const logoutAllDevices = () => API.post('/auth/logout-all');


export const loginWithGoogle = () => {
  window.location.href = `${API_BASE}/auth/oauth/google/login`;
};

export const loginWithFacebook = () => {
  window.location.href = `${API_BASE}/auth/oauth/facebook/login`;
};

export const loginWithApple = () => {
  window.location.href = `${API_BASE}/auth/oauth/apple/login`;
};
