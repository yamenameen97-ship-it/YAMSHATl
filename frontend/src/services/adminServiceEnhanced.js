import API from '../api/axios.js';
import logger from '../utils/logger.js';

const CACHE_KEY_PREFIX = 'admin_cache_';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const ANALYTICS_CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Admin Service Enhanced
 * 
 * خدمة الإدارة المحسّنة مع:
 * - CRUD كامل للمستخدمين والمنشورات
 * - تصدير التقارير (CSV, PDF, Excel)
 * - إدارة الصلاحيات والأدوار الفرعية
 * - التدقيق والسجلات
 * - إدارة الذاكرة المؤقتة
 */
export const adminServiceEnhanced = {
  /**
   * ============ CACHE MANAGEMENT ============
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
      if (cached) return cached;
      throw error;
    }
  },

  getFromCache(key) {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;
      const { data } = JSON.parse(item);
      return data;
    } catch (error) {
      logger.warn('Failed to get cache', { error: error?.message });
      return null;
    }
  },

  setInCache(key, data, ttl = CACHE_TTL_MS) {
    try {
      localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now(), ttl }));
    } catch (error) {
      logger.warn('Failed to set cache', { error: error?.message });
    }
  },

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

  clearCache(key) {
    try {
      localStorage.removeItem(`${CACHE_KEY_PREFIX}${key}`);
    } catch (error) {
      logger.warn('Failed to clear cache', { error: error?.message });
    }
  },

  clearAllCache() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith(CACHE_KEY_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      logger.warn('Failed to clear all cache', { error: error?.message });
    }
  },

  /**
   * ============ USERS MANAGEMENT ============
   */

  async getUsers(params = {}) {
    const cacheKey = `users_${JSON.stringify(params)}`;
    return this.getCachedData(cacheKey, async () => {
      const { data } = await API.get('/admin/users', { params });
      return data;
    }, CACHE_TTL_MS);
  },

  async getUser(userId) {
    return this.getCachedData(`user_${userId}`, async () => {
      const { data } = await API.get(`/admin/users/${userId}`);
      return data;
    }, CACHE_TTL_MS);
  },

  async createUser(userData) {
    const response = await API.post('/admin/users', userData);
    this.clearCache('users_*');
    await this.logAction('CREATE_USER', { userId: response.data.id });
    return response.data;
  },

  async updateUser(userId, userData) {
    const response = await API.put(`/admin/users/${userId}`, userData);
    this.clearCache(`user_${userId}`);
    this.clearCache('users_*');
    await this.logAction('UPDATE_USER', { userId, changes: userData });
    return response.data;
  },

  async deleteUser(userId, hardDelete = false) {
    const response = await API.delete(`/admin/users/${userId}`, {
      params: { hardDelete },
    });
    this.clearCache(`user_${userId}`);
    this.clearCache('users_*');
    await this.logAction('DELETE_USER', { userId, hardDelete });
    return response.data;
  },

  async banUser(userId, reason = '', duration = null) {
    const response = await API.post(`/admin/users/${userId}/ban`, { reason, duration });
    this.clearCache(`user_${userId}`);
    this.clearCache('users_*');
    await this.logAction('BAN_USER', { userId, reason, duration });
    return response.data;
  },

  async unbanUser(userId) {
    const response = await API.post(`/admin/users/${userId}/unban`);
    this.clearCache(`user_${userId}`);
    this.clearCache('users_*');
    await this.logAction('UNBAN_USER', { userId });
    return response.data;
  },

  /**
   * ============ ROLES & PERMISSIONS ============
   */

  async getRoles() {
    return this.getCachedData('admin_roles', async () => {
      const { data } = await API.get('/admin/roles');
      return data;
    }, CACHE_TTL_MS);
  },

  async createRole(roleData) {
    const response = await API.post('/admin/roles', roleData);
    this.clearCache('admin_roles');
    await this.logAction('CREATE_ROLE', { role: roleData.name });
    return response.data;
  },

  async updateRole(roleId, roleData) {
    const response = await API.put(`/admin/roles/${roleId}`, roleData);
    this.clearCache('admin_roles');
    await this.logAction('UPDATE_ROLE', { roleId, changes: roleData });
    return response.data;
  },

  async deleteRole(roleId) {
    const response = await API.delete(`/admin/roles/${roleId}`);
    this.clearCache('admin_roles');
    await this.logAction('DELETE_ROLE', { roleId });
    return response.data;
  },

  async assignRole(userId, roleId) {
    const response = await API.post(`/admin/users/${userId}/roles`, { roleId });
    this.clearCache(`user_${userId}`);
    await this.logAction('ASSIGN_ROLE', { userId, roleId });
    return response.data;
  },

  async removeRole(userId, roleId) {
    const response = await API.delete(`/admin/users/${userId}/roles/${roleId}`);
    this.clearCache(`user_${userId}`);
    await this.logAction('REMOVE_ROLE', { userId, roleId });
    return response.data;
  },

  async getPermissions() {
    return this.getCachedData('admin_permissions', async () => {
      const { data } = await API.get('/admin/permissions');
      return data;
    }, CACHE_TTL_MS);
  },

  /**
   * ============ REPORTS & EXPORTS ============
   */

  async exportUsers(format = 'csv', filters = {}) {
    try {
      const response = await API.get('/admin/users/export', {
        params: { format, ...filters },
        responseType: 'blob',
      });

      this.downloadFile(response.data, `users-export.${format}`);
      await this.logAction('EXPORT_USERS', { format, filters });
      return response.data;
    } catch (error) {
      logger.error('Export users failed', { error: error?.message });
      throw error;
    }
  },

  async exportAnalytics(format = 'csv', dateRange = {}) {
    try {
      const response = await API.get('/admin/analytics/export', {
        params: { format, ...dateRange },
        responseType: 'blob',
      });

      this.downloadFile(response.data, `analytics-export.${format}`);
      await this.logAction('EXPORT_ANALYTICS', { format, dateRange });
      return response.data;
    } catch (error) {
      logger.error('Export analytics failed', { error: error?.message });
      throw error;
    }
  },

  async exportReports(format = 'csv', status = null) {
    try {
      const response = await API.get('/admin/reports/export', {
        params: { format, status },
        responseType: 'blob',
      });

      this.downloadFile(response.data, `reports-export.${format}`);
      await this.logAction('EXPORT_REPORTS', { format, status });
      return response.data;
    } catch (error) {
      logger.error('Export reports failed', { error: error?.message });
      throw error;
    }
  },

  async generateReport(reportType, options = {}) {
    try {
      const response = await API.post('/admin/reports/generate', {
        type: reportType,
        options,
      });

      await this.logAction('GENERATE_REPORT', { reportType, options });
      return response.data;
    } catch (error) {
      logger.error('Generate report failed', { error: error?.message });
      throw error;
    }
  },

  downloadFile(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  /**
   * ============ AUDIT LOGS ============
   */

  async getAuditLogs(params = {}) {
    const cacheKey = `audit_logs_${JSON.stringify(params)}`;
    return this.getCachedData(cacheKey, async () => {
      const { data } = await API.get('/admin/audit-logs', { params });
      return data;
    }, CACHE_TTL_MS);
  },

  async getUserAuditLogs(userId, params = {}) {
    const cacheKey = `user_audit_logs_${userId}_${JSON.stringify(params)}`;
    return this.getCachedData(cacheKey, async () => {
      const { data } = await API.get(`/admin/audit-logs/user/${userId}`, { params });
      return data;
    }, CACHE_TTL_MS);
  },

  async logAction(action, details = {}) {
    try {
      await API.post('/admin/audit-logs', {
        action,
        details,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.warn('Failed to log action', { error: error?.message });
    }
  },

  /**
   * ============ ANALYTICS ============
   */

  async getAnalyticsDashboard() {
    return this.getCachedData('analytics_dashboard', async () => {
      const { data } = await API.get('/admin/analytics/dashboard');
      return data;
    }, ANALYTICS_CACHE_TTL_MS);
  },

  async getUserAnalytics(params = {}) {
    const cacheKey = `user_analytics_${JSON.stringify(params)}`;
    return this.getCachedData(cacheKey, async () => {
      const { data } = await API.get('/admin/analytics/users', { params });
      return data;
    }, ANALYTICS_CACHE_TTL_MS);
  },

  async getContentAnalytics(params = {}) {
    const cacheKey = `content_analytics_${JSON.stringify(params)}`;
    return this.getCachedData(cacheKey, async () => {
      const { data } = await API.get('/admin/analytics/content', { params });
      return data;
    }, ANALYTICS_CACHE_TTL_MS);
  },

  /**
   * ============ POSTS MANAGEMENT ============
   */

  async getPosts(params = {}) {
    const cacheKey = `admin_posts_${JSON.stringify(params)}`;
    return this.getCachedData(cacheKey, async () => {
      const { data } = await API.get('/admin/posts', { params });
      return data;
    }, CACHE_TTL_MS);
  },

  async deletePost(postId, reason = '') {
    const response = await API.delete(`/admin/posts/${postId}`, {
      data: { reason },
    });
    this.clearCache('admin_posts_*');
    await this.logAction('DELETE_POST', { postId, reason });
    return response.data;
  },

  async moderatePost(postId, action, reason = '') {
    const response = await API.post(`/admin/posts/${postId}/moderate`, {
      action,
      reason,
    });
    this.clearCache('admin_posts_*');
    await this.logAction('MODERATE_POST', { postId, action, reason });
    return response.data;
  },

  /**
   * ============ UTILITY ============
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
      logger.warn('Failed to get cache stats', { error: error?.message });
    }

    return stats;
  },
};

export default adminServiceEnhanced;
