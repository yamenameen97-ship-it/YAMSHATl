import DOMPurify from 'dompurify';

/**
 * Enhanced Security Utilities
 * Provides XSS prevention, input sanitization, and file validation
 */

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param {string} dirty - The HTML content to sanitize
 * @param {object} config - DOMPurify configuration
 * @returns {string} Sanitized HTML
 */
export function sanitizeHTML(dirty, config = {}) {
  const defaultConfig = {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'span', 'div'],
    ALLOWED_ATTR: ['href', 'title', 'target', 'rel'],
    KEEP_CONTENT: true,
  };

  return DOMPurify.sanitize(dirty, { ...defaultConfig, ...config });
}

/**
 * Sanitize text input to prevent script injection
 * @param {string} text - The text to sanitize
 * @param {object} options - Sanitization options
 * @returns {string} Sanitized text
 */
export function sanitizeText(text, options = {}) {
  const {
    maxLength = 1000,
    trim = true,
    lowercase = false,
    removeSpecialChars = false,
    allowedChars = null,
  } = options;

  let result = String(text || '');

  if (trim) {
    result = result.trim();
  }

  if (lowercase) {
    result = result.toLowerCase();
  }

  if (removeSpecialChars) {
    result = result.replace(/[^\w\s\-\.\@]/g, '');
  }

  if (allowedChars) {
    const regex = new RegExp(`[^${allowedChars}]`, 'g');
    result = result.replace(regex, '');
  }

  if (maxLength && result.length > maxLength) {
    result = result.substring(0, maxLength);
  }

  return result;
}

/**
 * Sanitize input text specifically for form fields
 * @param {string} text - The input text
 * @returns {string} Sanitized input text
 */
export function sanitizeInputText(text) {
  return sanitizeText(text, { maxLength: 500, trim: true });
}

/**
 * Validate and sanitize email addresses
 * @param {string} email - The email to validate
 * @returns {string|null} Sanitized email or null if invalid
 */
export function sanitizeEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const sanitized = sanitizeText(email, { trim: true, lowercase: true });

  if (!emailRegex.test(sanitized)) {
    return null;
  }

  return sanitized;
}

/**
 * Validate and sanitize URLs
 * @param {string} url - The URL to validate
 * @returns {string|null} Sanitized URL or null if invalid
 */
export function sanitizeURL(url) {
  try {
    const urlObj = new URL(url);
    const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:'];

    if (!allowedProtocols.includes(urlObj.protocol)) {
      return null;
    }

    return urlObj.toString();
  } catch {
    return null;
  }
}

/**
 * Validate file uploads for security
 * @param {File} file - The file to validate
 * @param {object} options - Validation options
 * @returns {object} Validation result { valid: boolean, error?: string }
 */
export function validateFileUpload(file, options = {}) {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4'],
    allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'mp4'],
  } = options;

  // Check file exists
  if (!file) {
    return { valid: false, error: 'لم يتم اختيار ملف.' };
  }

  // Check file size
  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
    return { valid: false, error: `حجم الملف يجب أن يكون أقل من ${maxSizeMB}MB.` };
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: `نوع الملف غير مدعوم. الأنواع المدعومة: ${allowedTypes.join(', ')}` };
  }

  // Check file extension
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  if (!allowedExtensions.includes(fileExtension)) {
    return { valid: false, error: `امتداد الملف غير مدعوم.` };
  }

  // Check for suspicious file names
  if (/[<>:"|?*]/.test(file.name)) {
    return { valid: false, error: 'اسم الملف يحتوي على أحرف غير مسموحة.' };
  }

  return { valid: true };
}

/**
 * Prevent spam by rate limiting
 * @param {string} key - The rate limit key
 * @param {number} maxAttempts - Maximum attempts allowed
 * @param {number} windowMs - Time window in milliseconds
 * @returns {boolean} Whether the action is allowed
 */
export function checkRateLimit(key, maxAttempts = 5, windowMs = 60000) {
  const storageKey = `rateLimit_${key}`;
  const now = Date.now();
  const data = JSON.parse(localStorage.getItem(storageKey) || '{"attempts":0,"resetTime":0}');

  // Reset if window expired
  if (now > data.resetTime) {
    data.attempts = 0;
    data.resetTime = now + windowMs;
  }

  // Check if limit exceeded
  if (data.attempts >= maxAttempts) {
    return false;
  }

  // Increment attempts
  data.attempts += 1;
  localStorage.setItem(storageKey, JSON.stringify(data));

  return true;
}

/**
 * Clear rate limit for a key
 * @param {string} key - The rate limit key
 */
export function clearRateLimit(key) {
  const storageKey = `rateLimit_${key}`;
  localStorage.removeItem(storageKey);
}

/**
 * Get remaining rate limit attempts
 * @param {string} key - The rate limit key
 * @param {number} maxAttempts - Maximum attempts allowed
 * @returns {number} Remaining attempts
 */
export function getRateLimitRemaining(key, maxAttempts = 5) {
  const storageKey = `rateLimit_${key}`;
  const data = JSON.parse(localStorage.getItem(storageKey) || '{"attempts":0}');
  return Math.max(0, maxAttempts - data.attempts);
}

/**
 * Validate password strength
 * @param {string} password - The password to validate
 * @returns {object} Validation result with strength level
 */
export function validatePasswordStrength(password) {
  const result = {
    valid: false,
    strength: 'weak',
    score: 0,
    errors: [],
  };

  if (!password) {
    result.errors.push('كلمة المرور مطلوبة.');
    return result;
  }

  if (password.length < 8) {
    result.errors.push('يجب أن تكون كلمة المرور 8 أحرف على الأقل.');
  } else {
    result.score += 1;
  }

  if (!/[a-z]/.test(password)) {
    result.errors.push('يجب أن تحتوي على أحرف صغيرة.');
  } else {
    result.score += 1;
  }

  if (!/[A-Z]/.test(password)) {
    result.errors.push('يجب أن تحتوي على أحرف كبيرة.');
  } else {
    result.score += 1;
  }

  if (!/[0-9]/.test(password)) {
    result.errors.push('يجب أن تحتوي على أرقام.');
  } else {
    result.score += 1;
  }

  if (!/[!@#$%^&*]/.test(password)) {
    result.errors.push('يجب أن تحتوي على رموز خاصة (!@#$%^&*).');
  } else {
    result.score += 1;
  }

  // Determine strength
  if (result.score <= 2) {
    result.strength = 'weak';
  } else if (result.score <= 3) {
    result.strength = 'fair';
  } else if (result.score <= 4) {
    result.strength = 'good';
  } else {
    result.strength = 'strong';
  }

  result.valid = result.errors.length === 0;

  return result;
}

/**
 * Generate CSRF token
 * @returns {string} CSRF token
 */
export function generateCSRFToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Validate CSRF token
 * @param {string} token - The token to validate
 * @returns {boolean} Whether token is valid
 */
export function validateCSRFToken(token) {
  const storedToken = sessionStorage.getItem('csrfToken');
  return token === storedToken;
}

/**
 * Store CSRF token
 * @param {string} token - The token to store
 */
export function storeCSRFToken(token) {
  sessionStorage.setItem('csrfToken', token);
}

/**
 * Detect potential XSS attempts in user input
 * @param {string} input - The input to check
 * @returns {boolean} Whether potential XSS detected
 */
export function detectXSSAttempt(input) {
  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /<object[^>]*>.*?<\/object>/gi,
    /<embed[^>]*>/gi,
    /<img[^>]*on\w+/gi,
  ];

  return xssPatterns.some((pattern) => pattern.test(input));
}

/**
 * Sanitize object recursively
 * @param {object} obj - The object to sanitize
 * @param {object} options - Sanitization options
 * @returns {object} Sanitized object
 */
export function sanitizeObject(obj, options = {}) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item, options));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    const sanitizedKey = sanitizeText(key, { removeSpecialChars: true });
    
    if (typeof value === 'string') {
      sanitized[sanitizedKey] = sanitizeText(value, options);
    } else if (typeof value === 'object') {
      sanitized[sanitizedKey] = sanitizeObject(value, options);
    } else {
      sanitized[sanitizedKey] = value;
    }
  }

  return sanitized;
}

export default {
  sanitizeHTML,
  sanitizeText,
  sanitizeInputText,
  sanitizeEmail,
  sanitizeURL,
  validateFileUpload,
  checkRateLimit,
  clearRateLimit,
  getRateLimitRemaining,
  validatePasswordStrength,
  generateCSRFToken,
  validateCSRFToken,
  storeCSRFToken,
  detectXSSAttempt,
  sanitizeObject,
};
