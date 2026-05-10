/**
 * Advanced Security Manager - Yamshat Enterprise Edition
 * Features: CSP Strict Mode, Device Fingerprinting, Abuse Protection, XSS Sanitization
 */

import DOMPurify from 'dompurify';
import FingerprintJS from '@fingerprintjs/fingerprintjs';

// XSS Sanitization
export const sanitizeHTML = (html) => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href', 'target', 'rel']
  });
};

// Advanced Device Fingerprinting
let cachedFingerprint = null;
export const getDeviceFingerprint = async () => {
  if (cachedFingerprint) return cachedFingerprint;
  try {
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    cachedFingerprint = result.visitorId;
    return cachedFingerprint;
  } catch (err) {
    console.error('Fingerprint error:', err);
    return 'unknown_device';
  }
};

// Abuse Protection: Anti-Spam Rate Limiting
const actionLog = new Map();
export const validateSecurityAction = (actionType, limitMs = 1000) => {
  const now = Date.now();
  const lastTime = actionLog.get(actionType) || 0;
  if (now - lastTime < limitMs) {
    console.warn(`[Security] Rate limit hit for ${actionType}`);
    return false;
  }
  actionLog.set(actionType, now);
  return true;
};

// Secure Storage with Base64 Encoding
export const setSecureItem = (key, value) => {
  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(value))));
  localStorage.setItem(`_secure_${key}`, encoded);
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

// CSP Strict Mode Injection
export const injectStrictCSP = () => {
  const meta = document.createElement('meta');
  meta.httpEquiv = "Content-Security-Policy";
  meta.content = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' https://cdn.yamshat.com;
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https:;
    connect-src 'self' wss: https:;
    font-src 'self' data:;
    object-src 'none';
    base-uri 'self';
    upgrade-insecure-requests;
  `.replace(/\s+/g, ' ').trim();
  document.head.appendChild(meta);
};

// Auto-initialize strict security on load
if (typeof window !== 'undefined') {
  injectStrictCSP();
  getDeviceFingerprint();
}
