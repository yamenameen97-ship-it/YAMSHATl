import DOMPurify from 'dompurify';

/**
 * XSS Protection Utilities
 * 
 * حماية من هجمات XSS من خلال:
 * - HTML sanitization
 * - Safe rendering
 * - Input validation
 * - Output encoding
 */

/**
 * Configure DOMPurify
 */
const purifyConfig = {
  ALLOWED_TAGS: [
    'b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li',
    'blockquote', 'code', 'pre', 'hr', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'img', 'video', 'audio', 'iframe', 'span', 'div', 'section', 'article',
  ],
  ALLOWED_ATTR: [
    'href', 'title', 'target', 'rel', 'src', 'alt', 'width', 'height',
    'class', 'id', 'style', 'data-*', 'aria-*',
  ],
  KEEP_CONTENT: true,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  FORCE_BODY: false,
  SANITIZE_DOM: true,
  IN_PLACE: false,
};

/**
 * Sanitize HTML
 * 
 * تنظيف HTML من الأكواد الضارة
 */
export function sanitizeHTML(html) {
  if (!html || typeof html !== 'string') return '';
  return DOMPurify.sanitize(html, purifyConfig);
}

/**
 * Sanitize User Input
 * 
 * تنظيف مدخلات المستخدم
 */
export function sanitizeInput(input) {
  if (!input || typeof input !== 'string') return '';
  
  // Remove any HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');
  
  // Escape special characters
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
  
  return sanitized;
}

/**
 * Safe Text Rendering
 * 
 * عرض نص آمن بدون HTML
 */
export function safeText(text) {
  if (!text || typeof text !== 'string') return '';
  
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Validate URL
 * 
 * التحقق من سلامة الـ URL
 */
export function isValidURL(url) {
  if (!url || typeof url !== 'string') return false;
  
  try {
    const urlObj = new URL(url);
    
    // Only allow http and https
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return false;
    }
    
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Safe Link Rendering
 * 
 * عرض روابط آمنة
 */
export function createSafeLink(url, text = url) {
  if (!isValidURL(url)) {
    return text;
  }
  
  return {
    href: url,
    text: sanitizeInput(text),
    target: '_blank',
    rel: 'noopener noreferrer',
  };
}

/**
 * Detect XSS Patterns
 * 
 * الكشف عن أنماط XSS الشائعة
 */
export function detectXSSPatterns(input) {
  if (!input || typeof input !== 'string') return [];
  
  const patterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe[^>]*>/gi,
    /<object[^>]*>/gi,
    /<embed[^>]*>/gi,
    /eval\(/gi,
    /expression\(/gi,
  ];
  
  const detectedPatterns = [];
  
  patterns.forEach(pattern => {
    if (pattern.test(input)) {
      detectedPatterns.push(pattern.source);
    }
  });
  
  return detectedPatterns;
}

/**
 * Safe HTML Component Hook
 * 
 * Hook لعرض HTML آمن في React
 */
export function useSafeHTML(html) {
  const sanitized = sanitizeHTML(html);
  
  return {
    __html: sanitized,
  };
}

/**
 * Content Security Validator
 * 
 * التحقق من أمان المحتوى
 */
export function validateContentSecurity(content) {
  const issues = [];
  
  // Check for XSS patterns
  const xssPatterns = detectXSSPatterns(content);
  if (xssPatterns.length > 0) {
    issues.push({
      type: 'XSS_PATTERN',
      patterns: xssPatterns,
      severity: 'HIGH',
    });
  }
  
  // Check for suspicious URLs
  const urlPattern = /https?:\/\/[^\s]+/g;
  const urls = content.match(urlPattern) || [];
  const suspiciousUrls = urls.filter(url => !isValidURL(url));
  
  if (suspiciousUrls.length > 0) {
    issues.push({
      type: 'SUSPICIOUS_URL',
      urls: suspiciousUrls,
      severity: 'MEDIUM',
    });
  }
  
  return {
    isSafe: issues.length === 0,
    issues,
  };
}

/**
 * XSS Protection Utilities Object
 */
export const XSSProtection = {
  sanitizeHTML,
  sanitizeInput,
  safeText,
  isValidURL,
  createSafeLink,
  detectXSSPatterns,
  useSafeHTML,
  validateContentSecurity,
};
