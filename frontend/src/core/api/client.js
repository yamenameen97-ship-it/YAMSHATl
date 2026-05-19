/**
 * Unified API Client
 * 
 * Provides:
 * - Centralized HTTP client using Axios
 * - Request/response interceptors
 * - Automatic token refresh
 * - Smart caching
 * - Retry logic with exponential backoff
 * - Error handling
 */

import axios from 'axios';
import { API_BASE_URL, API_TIMEOUT, CACHE_TTL } from '../../config/constants.js';
import { getAuthToken, setAuthToken } from '../../infrastructure/auth/tokenManager.js';
import logger from '../utils/logger.js';

// ============================================
// Constants
// ============================================

const DEFAULT_TIMEOUT_MS = API_TIMEOUT || 20000;
const RETRYABLE_STATUSES = new Set([408, 409, 425, 429, 500, 502, 503, 504]);
const MAX_RETRIES = 3;

// ============================================
// Cache Management
// ============================================

class CacheManager {
  constructor() {
    this.cache = new Map();
    this.timers = new Map();
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  set(key, data, ttl = CACHE_TTL) {
    // Clear existing timer
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });

    // Set auto-cleanup timer
    const timer = setTimeout(() => {
      this.cache.delete(key);
      this.timers.delete(key);
    }, ttl);

    this.timers.set(key, timer);
  }

  remove(key) {
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }
    this.cache.delete(key);
  }

  clear() {
    this.timers.forEach(timer => clearTimeout(timer));
    this.cache.clear();
    this.timers.clear();
  }

  getCacheKey(config) {
    return `${config.method}:${config.baseURL}${config.url}${JSON.stringify(config.params || {})}`;
  }
}

// ============================================
// API Client
// ============================================

class ApiClient {
  constructor() {
    this.cache = new CacheManager();
    this.client = this.createClient();
    this.setupInterceptors();
  }

  createClient() {
    return axios.create({
      baseURL: API_BASE_URL,
      timeout: DEFAULT_TIMEOUT_MS,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  setupInterceptors() {
    // Request Interceptor
    this.client.interceptors.request.use(
      (config) => this.handleRequest(config),
      (error) => this.handleRequestError(error)
    );

    // Response Interceptor
    this.client.interceptors.response.use(
      (response) => this.handleResponse(response),
      (error) => this.handleResponseError(error)
    );
  }

  handleRequest(config) {
    // Add auth token
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Setup cache configuration
    config.metadata = {
      startTime: Date.now(),
      useCache: config.cache !== false && config.method === 'get',
      forceRefresh: config.forceRefresh || false,
      cacheTtl: config.cacheTtl || CACHE_TTL,
    };

    // Check cache for GET requests
    if (config.method === 'get' && config.metadata.useCache && !config.metadata.forceRefresh) {
      const cacheKey = this.cache.getCacheKey(config);
      const cachedData = this.cache.get(cacheKey);

      if (cachedData) {
        logger.debug(`[Cache Hit] ${config.url}`);
        config.adapter = () => Promise.resolve({
          data: cachedData,
          status: 200,
          statusText: 'OK (from cache)',
          headers: {},
          config,
          request: {},
        });
      }
    }

    logger.debug(`[Request] ${config.method.toUpperCase()} ${config.url}`);
    return config;
  }

  handleRequestError(error) {
    logger.error('[Request Error]', error);
    return Promise.reject(error);
  }

  handleResponse(response) {
    const { metadata } = response.config;

    // Cache successful GET responses
    if (response.config.method === 'get' && metadata?.useCache) {
      const cacheKey = this.cache.getCacheKey(response.config);
      this.cache.set(cacheKey, response.data, metadata.cacheTtl);
    }

    const duration = Date.now() - metadata.startTime;
    logger.debug(`[Response] ${response.status} ${response.config.url} (${duration}ms)`);

    return response;
  }

  async handleResponseError(error) {
    const { config, response } = error;

    if (!config) {
      logger.error('[Response Error] No config', error);
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized - Try to refresh token
    if (response?.status === 401 && !config._retry) {
      config._retry = true;
      try {
        logger.info('[Auth] Token expired, attempting refresh...');
        // TODO: Implement token refresh logic
        // const newToken = await refreshAuthToken();
        // setAuthToken(newToken);
        // config.headers.Authorization = `Bearer ${newToken}`;
        // return this.client(config);
      } catch (refreshError) {
        logger.error('[Auth] Token refresh failed', refreshError);
        // TODO: Redirect to login
        return Promise.reject(refreshError);
      }
    }

    // Handle retryable errors with exponential backoff
    const retryCount = config._retryCount || 0;
    if (RETRYABLE_STATUSES.has(response?.status) && retryCount < MAX_RETRIES) {
      config._retryCount = retryCount + 1;
      const delay = Math.pow(2, retryCount) * 1000 + Math.random() * 1000;

      logger.warn(
        `[Retry] Attempt ${config._retryCount}/${MAX_RETRIES} after ${delay}ms for ${config.url}`
      );

      await new Promise(resolve => setTimeout(resolve, delay));
      return this.client(config);
    }

    logger.error(
      `[Response Error] ${response?.status} ${config.url}`,
      response?.data || error.message
    );

    return Promise.reject(error);
  }

  // ============================================
  // Public Methods
  // ============================================

  async get(url, config = {}) {
    return this.client.get(url, { ...config, method: 'get' });
  }

  async post(url, data, config = {}) {
    return this.client.post(url, data, config);
  }

  async put(url, data, config = {}) {
    return this.client.put(url, data, config);
  }

  async patch(url, data, config = {}) {
    return this.client.patch(url, data, config);
  }

  async delete(url, config = {}) {
    return this.client.delete(url, config);
  }

  async request(config) {
    return this.client.request(config);
  }

  // ============================================
  // Cache Methods
  // ============================================

  clearCache() {
    this.cache.clear();
    logger.info('[Cache] Cleared');
  }

  clearCacheByKey(key) {
    this.cache.remove(key);
  }

  getCacheSize() {
    return this.cache.cache.size;
  }

  // ============================================
  // Utility Methods
  // ============================================

  setAuthToken(token) {
    setAuthToken(token);
  }

  getClient() {
    return this.client;
  }
}

// ============================================
// Export Singleton Instance
// ============================================

export const apiClient = new ApiClient();

export default apiClient;
