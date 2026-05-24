/**
 * Content Security Policy Configuration
 * 
 * تحسين أمان التطبيق من خلال:
 * - تقييد مصادر المحتوى
 * - منع XSS attacks
 * - منع Clickjacking
 * - منع data exfiltration
 */

/**
 * CSP Headers Configuration
 * 
 * يجب إضافة هذه الـ headers في الـ backend:
 */
export const cspHeaders = {
  'Content-Security-Policy': [
    // Default source
    "default-src 'self'",

    // Scripts
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com",

    // Styles
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",

    // Images
    "img-src 'self' data: https: blob:",

    // Fonts
    "font-src 'self' https://fonts.gstatic.com data:",

    // Media
    "media-src 'self' https: blob:",

    // Frames
    "frame-src 'self' https://www.youtube.com https://player.vimeo.com",

    // Connections
    "connect-src 'self' https: wss: ws:",

    // Forms
    "form-action 'self'",

    // Frames ancestors
    "frame-ancestors 'none'",

    // Base URI
    "base-uri 'self'",

    // Object sources
    "object-src 'none'",

    // Upgrade insecure requests
    "upgrade-insecure-requests",

    // Block all mixed content
    "block-all-mixed-content",
  ].join('; '),

  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': [
    'geolocation=()',
    'microphone=()',
    'camera=()',
    'payment=()',
  ].join(', '),
};

/**
 * Apply CSP Headers
 * 
 * تطبيق CSP headers في الـ frontend
 */
export function applyCSPHeaders() {
  // Add meta tag for CSP
  const meta = document.createElement('meta');
  meta.httpEquiv = 'Content-Security-Policy';
  meta.content = cspHeaders['Content-Security-Policy'];
  document.head.appendChild(meta);

  // Add other security headers as meta tags
  const xContentType = document.createElement('meta');
  xContentType.httpEquiv = 'X-UA-Compatible';
  xContentType.content = 'IE=edge';
  document.head.appendChild(xContentType);
}

/**
 * Validate CSP Compliance
 * 
 * التحقق من امتثال الكود للـ CSP
 */
export function validateCSPCompliance() {
  const issues = [];

  // Check for inline scripts
  const inlineScripts = document.querySelectorAll('script:not([src])');
  if (inlineScripts.length > 0) {
    issues.push(`Found ${inlineScripts.length} inline scripts (violates CSP)`);
  }

  // Check for inline styles
  const inlineStyles = document.querySelectorAll('[style]');
  if (inlineStyles.length > 0) {
    issues.push(`Found ${inlineStyles.length} elements with inline styles (violates CSP)`);
  }

  // Check for event handlers
  const eventHandlers = document.querySelectorAll('[onclick], [onload], [onerror]');
  if (eventHandlers.length > 0) {
    issues.push(`Found ${eventHandlers.length} event handlers (violates CSP)`);
  }

  if (issues.length > 0) {
    console.warn('CSP Compliance Issues:', issues);
  }

  return issues;
}

/**
 * CSP Violation Handler
 * 
 * معالج انتهاكات CSP
 */
export function setupCSPViolationHandler() {
  document.addEventListener('securitypolicyviolation', (event) => {
    console.warn('CSP Violation:', {
      blockedURI: event.blockedURI,
      violatedDirective: event.violatedDirective,
      originalPolicy: event.originalPolicy,
      sourceFile: event.sourceFile,
      lineNumber: event.lineNumber,
    });

    // Log to backend
    fetch('/api/security/csp-violations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        blockedURI: event.blockedURI,
        violatedDirective: event.violatedDirective,
        originalPolicy: event.originalPolicy,
        sourceFile: event.sourceFile,
        lineNumber: event.lineNumber,
        timestamp: new Date().toISOString(),
      }),
    }).catch(err => console.warn('Failed to log CSP violation:', err));
  });
}

/**
 * Generate Nonce for Inline Scripts
 * 
 * توليد nonce للـ inline scripts
 */
export function generateNonce() {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * CSP Utilities
 */
export const CSP = {
  headers: cspHeaders,
  apply: applyCSPHeaders,
  validate: validateCSPCompliance,
  setupViolationHandler: setupCSPViolationHandler,
  generateNonce,
};
