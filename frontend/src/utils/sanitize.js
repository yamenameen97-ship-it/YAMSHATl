import DOMPurify from 'dompurify';

/**
 * Stronger XSS Handling, URL Validation, and Media Validation
 */

const entityMap = {
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '`': '&#96;',
};

// --- URL Validation ---
export const isValidUrl = (url) => {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(parsed.protocol);
  } catch (e) {
    return false;
  }
};

// --- Media Validation ---
export const validateMediaFile = (file, allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'audio/mpeg']) => {
  if (!file) return { valid: false, error: 'No file provided' };
  
  // Check MIME type
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: `Invalid file type: ${file.type}` };
  }

  // Check file size (e.g., 50MB limit)
  const maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) {
    return { valid: false, error: 'File size exceeds 50MB limit' };
  }

  return { valid: true };
};

// --- Enhanced Sanitization ---
export function cleanText(value = '') {
  return DOMPurify.sanitize(String(value || ''), {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    FORBID_TAGS: ['style', 'script', 'iframe', 'object', 'embed'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
  });
}

export function sanitizeInputText(value, { maxLength = 2000 } = {}) {
  if (!value) return '';
  let sanitized = cleanText(value)
    .replace(/[<>",'`]/g, (char) => entityMap[char] || char)
    .replace(/\s+/g, ' ')
    .trim();
  
  return sanitized.slice(0, maxLength);
}

export function sanitizeUserHtml(value, { maxLength = 5000 } = {}) {
  if (!value) return '';
  return DOMPurify.sanitize(String(value).slice(0, maxLength), {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'span'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'title', 'class'],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    ADD_ATTR: ['target'],
    FORBID_TAGS: ['script', 'style', 'iframe', 'form', 'input', 'button'],
    FORBID_ATTR: ['style', 'onerror', 'onload'],
  }).trim();
}

/**
 * Validates and sanitizes a URL for safe usage in href or src
 */
export function sanitizeUrl(url) {
  if (!url) return '';
  if (isValidUrl(url)) return url;
  return '';
}
