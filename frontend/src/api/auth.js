import axios from 'axios';
import API from './axios.js';
import { API_BASE } from './config.js';
import { getRefreshToken } from '../utils/auth.js';

const plainHttp = axios.create({
  baseURL: API_BASE,
});

export const loginUser = async (data) => {
  const response = await API.post('/auth/login', data);
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

export const refreshSession = async (token = '') => {
  const refreshToken = token || getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }
  const response = await plainHttp.post('/auth/refresh', { refresh_token: refreshToken });
  return response;
};

export const getMe = () => API.get('/users/me');
export const logoutUser = () => API.post('/auth/logout');
