import axios from 'axios';
import { API_BASE } from './config.js';
import { getAuthToken } from '../utils/auth.js';

const API = axios.create({
  baseURL: API_BASE,
});

API.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;
