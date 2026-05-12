import API from '../api/axios.js';

const CACHE_KEY_PREFIX = 'admin_cache_';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const ANALYTICS_CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Admin Service
 * Features: Caching, Analytics endpoints, Audit logs integration
 */
export const adminService = {
  /**
   * Gets cached data or fetches from API
   */
  async getCachedData(key, fetcher, ttl = CACHE_TTL_MS) {
    const cacheKey = `${CACHE_KEY_PREFIX}${key}`;
    const cached = this.getFromCache(cacheKey);

    if (cached && !this.isCacheExpired(cacheKey)) {
      return cached;
    }

    try {
      const data = await fetcher();
      this.setInCache(cacheKey, data, ttl);
      return data;
    } catch (error) {
      // Return cached data even if expired on error
      if (cached) return cached;
      throw error;
    }
  },

  /**
   * Gets data from localStorage cache
   */
  getFromCache(key) {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;
      const { data } = JSON.parse(item);
      return data;
    } catch (error) {
      console.warn('Failed to get cache:', error);
      return null;
    }
  },

  /**
   * Sets data in localStorage cache
   */
  setInCache(key, data, ttl = CACHE_TTL_MS) {
    try {
      localStorage.setItem(
        key,
        JSON.stringify({
          data,
          timestamp: Date.now(),
          ttl,
        })
      );
    } catch (error) {
      console.warn('Failed to set cache:', error);
    }
  },

  /**
   * Checks if cache is expired
   */
  isCacheExpired(key) {
    try {
      const item = localStorage.getItem(key);
      if (!item) return true;
      const { timestamp, ttl } = JSON.parse(item);
      return Date.now() - timestamp > ttl;
    } catch (error) {
      return true;
    }
  },

  /**
   * Clears cache for a specific key
   */
  clearCache(key) {
    try {
      localStorage.removeItem(`${CACHE_KEY_PREFIX}${key}`);
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  },

  /**
   * Clears all admin cache
   */
  clearAllCache() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith(CACHE_KEY_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear all cache:', error);
    }
  },

  // ============ OVERVIEW ============

  /**
   * Gets admin overview with caching
   */
  async getOverview() {
    return this.getCachedData('overview', async () => {
      const { data } = await API.get('/admin/overview');
      return data;
    }, CACHE_TTL_MS);
  },

  // ============ USERS ============

  /**
   * Gets admin users with caching and filters
   */
  async getUsers(params = {}) {
    const cacheKey = `users_${JSON.stringify(params)}`;
    return this.getCachedData(cacheKey, async () => {
      const { data } = await API.get('/admin/users', { params });
      return data;
    }, CACHE_TTL_MS);
  },

  /**
   * Gets single user details
   */
  async getUser(userId) {
    return this.getCachedData(`user_${userId}`, async () => {
      const { data } = await API.get(`/admin/users/${userId}`);
      return data;
    }, CACHE_TTL_MS);
  },

  /**
   * Bans or unbans user
   */
  async banUser(userId, restore = false) {
    const response = await API.post(`/admin/users/${userId}/ban`, null, {
      params: { restore },
    });
    this.clearCache(`users_*`);
    this.clearCache(`user_${userId}`);
    return response.data;
  },

  /**
   * Toggles shadow ban for user
   */
  async toggleShadowBan(userId, enabled = true) {
    const response = await API.post(`/admin/users/${userId}/shadow-ban`, null, {
      params: { enabled },
    });
    this.clearCache(`user_${userId}`);
    return response.data;
  },

  /**
   * Gets ban history with caching
   */
  async getBanHistory(limit = 30) {
    return this.getCachedData(`ban_history_${limit}`, async () => {
      const { data } = await API.get('/admin/users/ban-history', {
        params: { limit },
      });
      return data;
    }, CACHE_TTL_MS);
  },

  // ============ ANALYTICS ============

  /**
   * Gets analytics dashboard data with caching
   */
  async getAnalyticsDashboard() {
    return this.getCachedData('analytics_dashboard', async () => {
      const { data } = await API.get('/admin/analytics/dashboard');
      return data;
    }, ANALYTICS_CACHE_TTL_MS);
  },

  /**
   * Gets user analytics with caching
   */
  async getUserAnalytics(params = {}) {
    const cacheKey = `user_analytics_${JSON.stringify(params)}`;
    return this.getCachedData(cacheKey, async () => {
      const { data } = await API.get('/admin/analytics/users', { params });
      return data;
    }, ANALYTICS_CACHE_TTL_MS);
  },

  /**
   * Gets content analytics with caching
   */
  async getContentAnalytics(params = {}) {
    const cacheKey = `content_analytics_${JSON.stringify(params)}`;
    return this.getCachedData(cacheKey, async () => {
      const { data } = await API.get('/admin/analytics/content', { params });
      return data;
    }, ANALYTICS_CACHE_TTL_MS);
  },

  /**
   * Gets engagement analytics with caching
   */
  async getEngagementAnalytics(params = {}) {
    const cacheKey = `engagement_analytics_${JSON.stringify(params)}`;
    return this.getCachedData(cacheKey, async () => {
      const { data } = await API.get('/admin/analytics/engagement', { params });
      return data;
    }, ANALYTICS_CACHE_TTL_MS);
  },

  /**
   * Gets system health metrics with caching
   */
  async getSystemHealth() {
    return this.getCachedData('system_health', async () => {
      const { data } = await API.get('/admin/analytics/system-health');
      return data;
    }, 30000); // 30 seconds for real-time data
  },

  // ============ AUDIT LOGS ============

  /**
   * Gets audit logs with caching
   */
  async getAuditLogs(params = {}) {
    const cacheKey = `audit_logs_${JSON.stringify(params)}`;
    return this.getCachedData(cacheKey, async () => {
      const { data } = await API.get('/admin/audit-logs', { params });
      return data;
    }, CACHE_TTL_MS);
  },

  /**
   * Gets audit logs for specific user
   */
  async getUserAuditLogs(userId, params = {}) {
    const cacheKey = `user_audit_logs_${userId}_${JSON.stringify(params)}`;
    return this.getCachedData(cacheKey, async () => {
      const { data } = await API.get(`/admin/audit-logs/user/${userId}`, { params });
      return data;
    }, CACHE_TTL_MS);
  },

  /**
   * Logs admin action
   */
  async logAction(action, details = {}) {
    try {
      await API.post('/admin/audit-logs', {
        action,
        details,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to log action:', error);
    }
  },

  /**
   * Gets audit logs summary
   */
  async getAuditLogsSummary(params = {}) {
    const cacheKey = `audit_logs_summary_${JSON.stringify(params)}`;
    return this.getCachedData(cacheKey, async () => {
      const { data } = await API.get('/admin/audit-logs/summary', { params });
      return data;
    }, CACHE_TTL_MS);
  },

  // ============ REPORTS ============

  /**
   * Gets reports summary with caching
   */
  async getReportsSummary(params = {}) {
    const cacheKey = `reports_summary_${JSON.stringify(params)}`;
    return this.getCachedData(cacheKey, async () => {
      const { data } = await API.get('/admin/reports/summary', { params });
      return data;
    }, CACHE_TTL_MS);
  },

  /**
   * Updates report status
   */
  async updateReportStatus(reportId, status) {
    const response = await API.post(`/admin/reports/${reportId}/status`, { status });
    this.clearCache('reports_summary_*');
    return response.data;
  },

  /**
   * Escalates report
   */
  async escalateReport(reportId) {
    const response = await API.post(`/admin/reports/${reportId}/escalate`);
    this.clearCache('reports_summary_*');
    return response.data;
  },

  // ============ POSTS ============

  /**
   * Gets admin posts with caching
   */
  async getPosts(params = {}) {
    const cacheKey = `admin_posts_${JSON.stringify(params)}`;
    return this.getCachedData(cacheKey, async () => {
      const { data } = await API.get('/admin/posts', { params });
      return data;
    }, CACHE_TTL_MS);
  },

  /**
   * Moderates post with AI
   */
  async moderatePostAI(postId) {
    const response = await API.post(`/admin/posts/${postId}/moderate-ai`);
    this.clearCache('admin_posts_*');
    return response.data;
  },

  /**
   * Bulk updates post status
   */
  async bulkUpdatePostStatus(ids, status) {
    const response = await API.post('/admin/posts/bulk-update-status', { ids, status });
    this.clearCache('admin_posts_*');
    return response.data;
  },

  // ============ SETTINGS ============

  /**
   * Gets admin settings with caching
   */
  async getSettings() {
    return this.getCachedData('admin_settings', async () => {
      const { data } = await API.get('/admin/settings');
      return data;
    }, ANALYTICS_CACHE_TTL_MS);
  },

  /**
   * Updates admin settings
   */
  async updateSettings(settings) {
    const response = await API.put('/admin/settings', settings);
    this.clearCache('admin_settings');
    return response.data;
  },

  // ============ EXPORTS ============

  /**
   * Exports admin report
   */
  async exportReport(format = 'csv') {
    const response = await API.get('/admin/reports/export', {
      params: { format },
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Exports users data
   */
  async exportUsers(format = 'csv') {
    const response = await API.get('/admin/users/export', {
      params: { format },
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Exports analytics data
   */
  async exportAnalytics(format = 'csv') {
    const response = await API.get('/admin/analytics/export', {
      params: { format },
      responseType: 'blob',
    });
    return response.data;
  },

  // ============ UTILITY ============

  /**
   * Gets cache statistics
   */
  getCacheStats() {
    const stats = {
      totalItems: 0,
      totalSize: 0,
      items: [],
    };

    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith(CACHE_KEY_PREFIX)) {
          const item = localStorage.getItem(key);
          const size = item ? item.length : 0;
          stats.totalItems++;
          stats.totalSize += size;
          stats.items.push({
            key: key.replace(CACHE_KEY_PREFIX, ''),
            size,
            expired: this.isCacheExpired(key),
          });
        }
      });
    } catch (error) {
      console.warn('Failed to get cache stats:', error);
    }

    return stats;
  },
};

export default adminService;
