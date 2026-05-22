import API from './axios.js';
import { BACKEND_ORIGIN } from './config.js';
import sessionManager from '../auth/sessionManager.js';

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

export const getCaptchaChallenge = async () => {
  const response = await API.get('/auth/captcha', { cache: false, forceRefresh: true });
  return response;
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


export const loginWithGoogle = () => {
  window.location.href = `${BACKEND_ORIGIN}/auth/google/login`;
};

export const loginWithFacebook = () => {
  window.location.href = `${BACKEND_ORIGIN}/auth/facebook/login`;
};

export const loginWithApple = () => {
  window.location.href = `${BACKEND_ORIGIN}/auth/apple/login`;
};
