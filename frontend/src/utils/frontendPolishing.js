/**
 * تحسينات الفرونت إند (Frontend Polishing)
 * - تحسين الأداء
 * - معالجة الأخطاء
 * - التحقق من المدخلات
 * - تحسين تجربة المستخدم
 */

/**
 * معالج الأخطاء الموحد
 */
export class ErrorHandler {
  static handle(error, context = 'unknown') {
    console.error(`❌ Error in ${context}:`, error);
    
    return {
      success: false,
      error: error.message || 'حدث خطأ غير متوقع',
      context,
      timestamp: new Date().toISOString()
    };
  }

  static handleNetworkError(error) {
    console.error('🌐 Network error:', error);
    
    return {
      success: false,
      error: 'فشل الاتصال بالخادم',
      error_code: 'NETWORK_ERROR',
      details: error.message
    };
  }

  static handleValidationError(errors) {
    console.warn('⚠️ Validation errors:', errors);
    
    return {
      success: false,
      error: 'البيانات المدخلة غير صحيحة',
      error_code: 'VALIDATION_ERROR',
      details: errors
    };
  }

  static handleAuthError() {
    console.warn('🔐 Authentication error');
    
    return {
      success: false,
      error: 'انتهت جلستك، يرجى تسجيل الدخول مجدداً',
      error_code: 'AUTH_ERROR'
    };
  }
}

/**
 * التحقق من المدخلات
 */
export class InputValidator {
  static validateEmail(email) {
    const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return pattern.test(email);
  }

  static validatePhone(phone) {
    const pattern = /^\+?1?\d{9,15}$/;
    const cleaned = phone.replace(/[-\s]/g, '');
    return pattern.test(cleaned);
  }

  static validateUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  static validatePasswordStrength(password) {
    const issues = [];

    if (password.length < 8) {
      issues.push('يجب أن تكون كلمة المرور 8 أحرف على الأقل');
    }

    if (!/[A-Z]/.test(password)) {
      issues.push('يجب أن تحتوي على حرف كبير واحد على الأقل');
    }

    if (!/[a-z]/.test(password)) {
      issues.push('يجب أن تحتوي على حرف صغير واحد على الأقل');
    }

    if (!/\d/.test(password)) {
      issues.push('يجب أن تحتوي على رقم واحد على الأقل');
    }

    if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
      issues.push('يجب أن تحتوي على رمز خاص واحد على الأقل');
    }

    return {
      isStrong: issues.length === 0,
      issues,
      strengthScore: Math.max(0, 100 - (issues.length * 20))
    };
  }

  static validateRequiredFields(data, requiredFields) {
    const missingFields = [];

    for (const field of requiredFields) {
      if (!data[field] || data[field] === '' || data[field] === null) {
        missingFields.push(field);
      }
    }

    return {
      isValid: missingFields.length === 0,
      missingFields
    };
  }

  static validateFileSize(file, maxSizeMB = 10) {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxSizeBytes;
  }

  static validateFileType(file, allowedTypes = []) {
    return allowedTypes.includes(file.type);
  }
}

/**
 * تنظيف البيانات
 */
export class DataSanitizer {
  static sanitizeString(text, maxLength = 1000) {
    if (typeof text !== 'string') {
      return '';
    }

    // إزالة المسافات الزائدة
    let sanitized = text.trim();

    // تقليص الطول
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }

    // إزالة الأحرف الخطرة
    const dangerousChars = ['<', '>', '"', "'", '&'];
    for (const char of dangerousChars) {
      sanitized = sanitized.replace(new RegExp(char, 'g'), '');
    }

    return sanitized;
  }

  static sanitizeEmail(email) {
    if (typeof email !== 'string') {
      return '';
    }

    return email.trim().toLowerCase().replace(/\s/g, '');
  }

  static sanitizeJSON(data) {
    const sanitized = {};

    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeString(value);
      } else if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
          sanitized[key] = value.map(item =>
            typeof item === 'string' ? this.sanitizeString(item) : item
          );
        } else {
          sanitized[key] = this.sanitizeJSON(value);
        }
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  static escapeHTML(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };

    return text.replace(/[&<>"']/g, m => map[m]);
  }
}

/**
 * تنسيق الاستجابات
 */
export class ResponseFormatter {
  static successResponse(data = null, message = 'نجح') {
    return {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    };
  }

  static errorResponse(error, errorCode = 'ERROR', details = null) {
    return {
      success: false,
      error,
      error_code: errorCode,
      details,
      timestamp: new Date().toISOString()
    };
  }

  static paginatedResponse(items, total, page, pageSize) {
    const totalPages = Math.ceil(total / pageSize);

    return {
      success: true,
      data: items,
      pagination: {
        total,
        page,
        pageSize,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1
      },
      timestamp: new Date().toISOString()
    };
  }

  static listResponse(items, count = null) {
    return {
      success: true,
      data: items,
      count: count || items.length,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * مراقب الأداء
 */
export class PerformanceMonitor {
  constructor() {
    this.metrics = {};
  }

  recordMetric(name, value, unit = 'ms') {
    if (!this.metrics[name]) {
      this.metrics[name] = [];
    }

    this.metrics[name].push({
      value,
      unit,
      timestamp: new Date().toISOString()
    });
  }

  getMetricsSummary() {
    const summary = {};

    for (const [name, values] of Object.entries(this.metrics)) {
      const numbers = values.map(v => v.value);
      summary[name] = {
        count: numbers.length,
        min: Math.min(...numbers),
        max: Math.max(...numbers),
        avg: numbers.reduce((a, b) => a + b, 0) / numbers.length,
        unit: values[0]?.unit || 'unknown'
      };
    }

    return summary;
  }

  clearMetrics() {
    this.metrics = {};
  }
}

/**
 * معالج الطلبات (Request Handler)
 */
export class RequestHandler {
  static async makeRequest(url, options = {}) {
    const startTime = performance.now();

    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      const duration = performance.now() - startTime;
      console.log(`📊 Request to ${url} took ${duration.toFixed(2)}ms`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return { success: true, data, duration };

    } catch (error) {
      const duration = performance.now() - startTime;
      console.error(`❌ Request to ${url} failed after ${duration.toFixed(2)}ms:`, error);
      return { success: false, error, duration };
    }
  }

  static async get(url, options = {}) {
    return this.makeRequest(url, { ...options, method: 'GET' });
  }

  static async post(url, data, options = {}) {
    return this.makeRequest(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async put(url, data, options = {}) {
    return this.makeRequest(url, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  static async delete(url, options = {}) {
    return this.makeRequest(url, { ...options, method: 'DELETE' });
  }
}

/**
 * مدير الحالة المحلية (Local State Manager)
 */
export class LocalStateManager {
  constructor(storageKey = 'app-state') {
    this.storageKey = storageKey;
    this.state = this.loadState();
    this.listeners = new Set();
  }

  loadState() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Failed to load state:', error);
      return {};
    }
  }

  saveState() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.state));
    } catch (error) {
      console.error('Failed to save state:', error);
    }
  }

  setState(key, value) {
    this.state[key] = value;
    this.saveState();
    this.notifyListeners();
  }

  getState(key) {
    return key ? this.state[key] : this.state;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notifyListeners() {
    this.listeners.forEach(listener => listener(this.state));
  }

  clear() {
    this.state = {};
    localStorage.removeItem(this.storageKey);
    this.notifyListeners();
  }
}

/**
 * مدير الجلسة (Session Manager)
 */
export class SessionManager {
  constructor(sessionTimeout = 30 * 60 * 1000) { // 30 دقيقة
    this.sessionTimeout = sessionTimeout;
    this.sessionTimer = null;
    this.isActive = false;
  }

  startSession() {
    this.isActive = true;
    this.resetSessionTimer();
    document.addEventListener('mousemove', () => this.resetSessionTimer());
    document.addEventListener('keypress', () => this.resetSessionTimer());
  }

  resetSessionTimer() {
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
    }

    this.sessionTimer = setTimeout(() => {
      this.endSession();
    }, this.sessionTimeout);
  }

  endSession() {
    this.isActive = false;
    console.log('⏱️ Session expired');
    // إرسال حدث انتهاء الجلسة
    window.dispatchEvent(new Event('sessionExpired'));
  }

  isSessionActive() {
    return this.isActive;
  }

  destroy() {
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
    }
    this.isActive = false;
  }
}

/**
 * إنشاء مثيلات عامة
 */
export const errorHandler = new ErrorHandler();
export const inputValidator = new InputValidator();
export const dataSanitizer = new DataSanitizer();
export const responseFormatter = new ResponseFormatter();
export const performanceMonitor = new PerformanceMonitor();
export const requestHandler = new RequestHandler();
export const localStateManager = new LocalStateManager();
export const sessionManager = new SessionManager();
