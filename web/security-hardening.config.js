/**
 * Yamshat Security Hardening Configuration
 * تعزيز الحماية والـ Security
 * Version 2.0.0
 */

// ============ Content Security Policy (CSP) ============

export const cspConfig = {
  // CSP headers
  headers: {
    'Content-Security-Policy': `
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.yamshat.com https://analytics.google.com;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      img-src 'self' data: https: blob:;
      font-src 'self' https://fonts.gstatic.com;
      connect-src 'self' https://api.yamshat.com https://analytics.google.com wss://socket.yamshat.com;
      frame-ancestors 'none';
      base-uri 'self';
      form-action 'self';
      upgrade-insecure-requests;
    `,
    'Content-Security-Policy-Report-Only': `
      default-src 'self';
      report-uri https://api.yamshat.com/csp-report;
    `,
  },

  // CSP directives
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.yamshat.com'],
    styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
    fontSrc: ["'self'", 'https://fonts.gstatic.com'],
    connectSrc: ["'self'", 'https://api.yamshat.com', 'wss://socket.yamshat.com'],
    frameAncestors: ["'none'"],
    baseUri: ["'self'"],
    formAction: ["'self'"],
    upgradeInsecureRequests: [],
  },

  // Report violations
  reportUri: 'https://api.yamshat.com/csp-report',
};

// ============ XSS Protection ============

export const xssProtection = {
  // XSS headers
  headers: {
    'X-XSS-Protection': '1; mode=block',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
  },

  // Input sanitization
  sanitization: {
    enabled: true,
    library: 'dompurify',
    config: {
      ALLOWED_TAGS: [
        'b', 'i', 'em', 'strong', 'u', 'p', 'br',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'a', 'img',
      ],
      ALLOWED_ATTR: [
        'href', 'title', 'src', 'alt', 'class',
      ],
      KEEP_CONTENT: true,
    },
  },

  // Output encoding
  outputEncoding: {
    enabled: true,
    htmlEncode: true,
    urlEncode: true,
    jsEncode: true,
  },

  // HTML escaping
  htmlEscaping: {
    enabled: true,
    escapeCharacters: {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;',
    },
  },
};

// ============ Secure Cookies ============

export const secureCookies = {
  // Cookie attributes
  attributes: {
    Secure: true,
    HttpOnly: true,
    SameSite: 'Strict',
    Path: '/',
    Domain: '.yamshat.com',
    MaxAge: 7 * 24 * 60 * 60, // 7 days
  },

  // Session cookie
  sessionCookie: {
    name: 'YAMSHAT_SESSION',
    secure: true,
    httpOnly: true,
    sameSite: 'Strict',
  },

  // CSRF token cookie
  csrfCookie: {
    name: 'XSRF-TOKEN',
    secure: true,
    httpOnly: false,
    sameSite: 'Strict',
  },

  // Tracking cookie
  trackingCookie: {
    name: 'YAMSHAT_TRACKING',
    secure: true,
    httpOnly: true,
    sameSite: 'Lax',
  },

  // Cookie encryption
  encryption: {
    enabled: true,
    algorithm: 'AES-256-GCM',
  },
};

// ============ Hidden Source Maps ============

export const hiddenSourceMaps = {
  // Source maps in production
  production: {
    enabled: false,
    devtool: false,
  },

  // Source maps in development
  development: {
    enabled: true,
    devtool: 'source-map',
  },

  // Source map upload
  upload: {
    enabled: true,
    service: 'sentry',
    dsn: process.env.SENTRY_DSN,
  },

  // Source map removal
  removal: {
    enabled: true,
    patterns: ['*.map'],
  },
};

// ============ Environment Protection ============

export const environmentProtection = {
  // Environment variables
  variables: {
    // Public variables (safe to expose)
    public: [
      'REACT_APP_API_URL',
      'REACT_APP_SOCKET_URL',
      'REACT_APP_CDN_URL',
    ],

    // Private variables (never expose)
    private: [
      'API_KEY',
      'SECRET_KEY',
      'DATABASE_URL',
      'JWT_SECRET',
      'ENCRYPTION_KEY',
    ],
  },

  // Environment file
  envFile: {
    enabled: true,
    gitignore: true,
    example: '.env.example',
  },

  // Environment validation
  validation: {
    enabled: true,
    schema: {
      REACT_APP_API_URL: 'string',
      REACT_APP_SOCKET_URL: 'string',
      REACT_APP_CDN_URL: 'string',
    },
  },
};

// ============ API Obfuscation ============

export const apiObfuscation = {
  // API endpoint obfuscation
  endpoints: {
    enabled: true,
    prefix: '/api/v1/',
    randomize: true,
  },

  // Request obfuscation
  request: {
    enabled: true,
    encrypt: true,
    compress: true,
    randomizeHeaders: true,
  },

  // Response obfuscation
  response: {
    enabled: true,
    encrypt: true,
    compress: true,
    removeMetadata: true,
  },

  // Parameter obfuscation
  parameters: {
    enabled: true,
    obfuscate: true,
    randomNames: true,
  },

  // API key protection
  apiKey: {
    enabled: true,
    rotation: true,
    rotationInterval: 30 * 24 * 60 * 60 * 1000, // 30 days
    storage: 'secure-storage',
  },
};

// ============ Upload Validation ============

export const uploadValidation = {
  // File type validation
  fileType: {
    enabled: true,
    whitelist: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/avif',
      'video/mp4',
      'video/webm',
      'audio/mpeg',
      'audio/wav',
    ],
    blacklist: [
      'application/x-executable',
      'application/x-msdownload',
      'application/x-msdos-program',
    ],
  },

  // File size validation
  fileSize: {
    enabled: true,
    maxSize: 100 * 1024 * 1024, // 100 MB
    minSize: 1024, // 1 KB
  },

  // File extension validation
  fileExtension: {
    enabled: true,
    whitelist: [
      'jpg', 'jpeg', 'png', 'gif', 'webp', 'avif',
      'mp4', 'webm', 'mov',
      'mp3', 'wav', 'aac',
    ],
    blacklist: [
      'exe', 'bat', 'cmd', 'sh', 'py', 'js',
    ],
  },

  // Virus scanning
  virusScan: {
    enabled: true,
    service: 'clamav',
    timeout: 30000,
  },

  // Image validation
  imageValidation: {
    enabled: true,
    checkMetadata: true,
    removeMetadata: true,
    validateDimensions: true,
    maxWidth: 4096,
    maxHeight: 4096,
  },

  // Video validation
  videoValidation: {
    enabled: true,
    checkMetadata: true,
    validateDuration: true,
    maxDuration: 3600, // 1 hour
  },
};

// ============ MIME Type Validation ============

export const mimeValidation = {
  // MIME type checking
  checking: {
    enabled: true,
    library: 'file-type',
    checkMagicBytes: true,
  },

  // MIME type whitelist
  whitelist: {
    images: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/avif',
      'image/svg+xml',
    ],
    videos: [
      'video/mp4',
      'video/webm',
      'video/quicktime',
    ],
    audio: [
      'audio/mpeg',
      'audio/wav',
      'audio/aac',
      'audio/ogg',
    ],
  },

  // MIME type enforcement
  enforcement: {
    enabled: true,
    strict: true,
  },
};

// ============ Anti-Spam Protection ============

export const antiSpam = {
  // Rate limiting
  rateLimiting: {
    enabled: true,
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    message: 'عدد كبير جداً من الطلبات، يرجى المحاولة لاحقاً',
  },

  // Request throttling
  throttling: {
    enabled: true,
    delayMs: 100,
    delayAfter: 5,
  },

  // Spam detection
  detection: {
    enabled: true,
    keywords: [
      'viagra', 'casino', 'lottery',
    ],
    patterns: [
      /\b[A-Z]{5,}\b/g, // All caps words
      /(.)\1{4,}/g, // Repeated characters
    ],
  },

  // Spam filtering
  filtering: {
    enabled: true,
    quarantine: true,
    notifyModerators: true,
  },
};

// ============ Anti-Bot Protection ============

export const antiBot = {
  // CAPTCHA
  captcha: {
    enabled: true,
    provider: 'recaptcha-v3',
    siteKey: process.env.RECAPTCHA_SITE_KEY,
    secretKey: process.env.RECAPTCHA_SECRET_KEY,
    threshold: 0.5,
  },

  // Bot detection
  botDetection: {
    enabled: true,
    userAgent: true,
    fingerprinting: true,
    behavior: true,
  },

  // Honeypot
  honeypot: {
    enabled: true,
    fields: ['website', 'phone_number'],
  },

  // Challenge-response
  challengeResponse: {
    enabled: true,
    timeout: 5000,
  },
};

// ============ Anti-Flood Protection ============

export const antiFlood = {
  // Connection limiting
  connectionLimiting: {
    enabled: true,
    maxConnections: 1000,
    maxConnectionsPerIP: 10,
  },

  // Bandwidth limiting
  bandwidthLimiting: {
    enabled: true,
    maxBandwidth: 1024 * 1024 * 1024, // 1 GB
    maxBandwidthPerIP: 100 * 1024 * 1024, // 100 MB
  },

  // Flood detection
  floodDetection: {
    enabled: true,
    threshold: 100,
    window: 60000, // 1 minute
  },

  // DDoS protection
  ddosProtection: {
    enabled: true,
    service: 'cloudflare',
    rules: [
      {
        action: 'block',
        expression: '(cf.bot_management.score < 30)',
      },
    ],
  },
};

// ============ Request Signing ============

export const requestSigning = {
  // Request signature
  signature: {
    enabled: true,
    algorithm: 'HMAC-SHA256',
    header: 'X-Signature',
  },

  // Timestamp validation
  timestamp: {
    enabled: true,
    header: 'X-Timestamp',
    tolerance: 300000, // 5 minutes
  },

  // Nonce validation
  nonce: {
    enabled: true,
    header: 'X-Nonce',
    storage: 'redis',
  },

  // Key rotation
  keyRotation: {
    enabled: true,
    interval: 30 * 24 * 60 * 60 * 1000, // 30 days
  },
};

// ============ Device Fingerprinting ============

export const deviceFingerprinting = {
  // Fingerprinting enabled
  enabled: true,

  // Fingerprinting components
  components: {
    userAgent: true,
    language: true,
    timezone: true,
    screenResolution: true,
    colorDepth: true,
    plugins: true,
    fonts: true,
    canvas: true,
    webgl: true,
    audioContext: true,
  },

  // Fingerprinting storage
  storage: {
    enabled: true,
    type: 'localStorage',
    key: 'yamshat_fingerprint',
  },

  // Fingerprinting validation
  validation: {
    enabled: true,
    tolerance: 0.9, // 90% match
  },
};

// ============ Session Protection ============

export const sessionProtection = {
  // Session timeout
  timeout: {
    enabled: true,
    duration: 30 * 60 * 1000, // 30 minutes
    warningDuration: 5 * 60 * 1000, // 5 minutes
  },

  // Session validation
  validation: {
    enabled: true,
    checkUserAgent: true,
    checkIP: true,
    checkFingerprint: true,
  },

  // Session fixation protection
  fixationProtection: {
    enabled: true,
    regenerateOnLogin: true,
    regenerateOnPrivilegeChange: true,
  },

  // Session hijacking detection
  hijackingDetection: {
    enabled: true,
    checkBehavior: true,
    checkLocation: true,
  },
};

// ============ Clickjacking Protection ============

export const clickjackingProtection = {
  // X-Frame-Options header
  xFrameOptions: 'DENY',

  // Frame-ancestors CSP
  frameAncestors: ["'none'"],

  // UI redressing protection
  uiRedressing: {
    enabled: true,
    framebusting: true,
  },

  // Transparent overlay detection
  overlayDetection: {
    enabled: true,
    sensitivity: 'high',
  },
};

// ============ Dependency Audit ============

export const dependencyAudit = {
  // Audit enabled
  enabled: true,

  // Audit frequency
  frequency: 'weekly',

  // Audit tools
  tools: [
    'npm-audit',
    'snyk',
    'dependabot',
  ],

  // Vulnerability thresholds
  thresholds: {
    critical: 0,
    high: 0,
    medium: 5,
    low: 10,
  },

  // Auto-fix
  autoFix: {
    enabled: true,
    createPullRequest: true,
  },
};

// ============ Secret Scanning ============

export const secretScanning = {
  // Secret scanning enabled
  enabled: true,

  // Scan patterns
  patterns: [
    /(?:api[_-]?key|apikey)\s*[:=]\s*['\"]?[a-zA-Z0-9_\-]{20,}['\"]?/gi,
    /(?:password|passwd)\s*[:=]\s*['\"]?[^\s'\"]+['\"]?/gi,
    /(?:secret|token)\s*[:=]\s*['\"]?[a-zA-Z0-9_\-]{20,}['\"]?/gi,
    /(?:private[_-]?key|privatekey)\s*[:=]\s*['\"]?-----BEGIN[^\"]*-----[^\"]*-----END[^\"]*-----['\"]?/gi,
  ],

  // Scan locations
  locations: [
    'source code',
    'git history',
    'environment files',
    'configuration files',
  ],

  // Notification
  notification: {
    enabled: true,
    channels: ['email', 'slack'],
  },

  // Remediation
  remediation: {
    enabled: true,
    rotateSecrets: true,
    revokeAccess: true,
  },
};

export default {
  cspConfig,
  xssProtection,
  secureCookies,
  hiddenSourceMaps,
  environmentProtection,
  apiObfuscation,
  uploadValidation,
  mimeValidation,
  antiSpam,
  antiBot,
  antiFlood,
  requestSigning,
  deviceFingerprinting,
  sessionProtection,
  clickjackingProtection,
  dependencyAudit,
  secretScanning,
};
