/**
 * Advanced Security Manager - Yamshat Enterprise Edition
 * Features: Suspicious Activity Detection, Rate Limiting, Anti-Spam, CSP Support, Device Fingerprinting
 */

import DOMPurify from 'dompurify';
import FingerprintJS from '@fingerprintjs/fingerprintjs';

// --- Suspicious Activity Detection ---
const suspiciousPatterns = [
  /<script.*?>.*?<\/script>/gi,
  /javascript:/gi,
  /onload=/gi,
  /onerror=/gi,
  /eval\(/gi,
  /base64/gi
];

export const detectSuspiciousActivity = (input) => {
  if (typeof input !== 'string') return false;
  return suspiciousPatterns.some(pattern => pattern.test(input));
};

// --- Rate Limit Handling ---
const rateLimits = new Map();
export const checkRateLimit = (action, limit = 10, windowMs = 60000) => {
  const now = Date.now();
  const record = rateLimits.get(action) || { count: 0, startTime: now };

  if (now - record.startTime > windowMs) {
    record.count = 1;
    record.startTime = now;
  } else {
    record.count++;
  }

  rateLimits.set(action, record);
  return record.count <= limit;
};

// --- Anti-Spam Layer ---
const lastSubmissionTime = new Map();
export const isSpam = (userId, minIntervalMs = 2000) => {
  const now = Date.now();
  const lastTime = lastSubmissionTime.get(userId) || 0;
  if (now - lastTime < minIntervalMs) {
    return true;
  }
  lastSubmissionTime.set(userId, now);
  return false;
};

// --- CSP Support ---
export const injectStrictCSP = () => {
  if (typeof document === 'undefined') return;
  
  const existingMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
  if (existingMeta) return;

  const meta = existingMeta || document.createElement('meta');
  meta.httpEquiv = "Content-Security-Policy";
  meta.content = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' https://cdn.yamshat.com https://apis.google.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' data: https: blob:;
    connect-src 'self' wss: https:;
    font-src 'self' data: https://fonts.gstatic.com;
    object-src 'none';
    media-src 'self' https: blob:;
    frame-src 'self' https://www.youtube.com;
    base-uri 'self';
    upgrade-insecure-requests;
  `.replace(/\s+/g, ' ').trim();
  if (!meta.parentNode) document.head.appendChild(meta);
};

// --- Device Fingerprinting ---
let cachedFingerprint = null;
export const getDeviceFingerprint = async () => {
  if (cachedFingerprint) return cachedFingerprint;
  try {
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    cachedFingerprint = result.visitorId;
    return cachedFingerprint;
  } catch (err) {
    console.error('[Security] Fingerprint error:', err);
    return 'unknown_device_' + Math.random().toString(36).substr(2, 9);
  }
};

// --- XSS Sanitization ---
export const sanitizeHTML = (html, options = {}) => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: options.tags || ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'span', 'ul', 'li'],
    ALLOWED_ATTR: options.attrs || ['href', 'target', 'rel', 'class', 'style'],
    ...options
  });
};

// --- Secure Storage ---
export const setSecureItem = (key, value) => {
  try {
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(value))));
    localStorage.setItem(`_secure_${key}`, encoded);
  } catch (e) {
    console.error('[Security] Storage error:', e);
  }
};

export const getSecureItem = (key) => {
  const encoded = localStorage.getItem(`_secure_${key}`);
  if (!encoded) return null;
  try {
    return JSON.parse(decodeURIComponent(escape(atob(encoded))));
  } catch {
    return null;
  }
};

// Auto-initialize
if (typeof window !== 'undefined') {
  injectStrictCSP();
  getDeviceFingerprint();
}
