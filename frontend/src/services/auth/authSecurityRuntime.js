const securityState = {
  sessions: [],
  suspiciousEvents: [],
};

export function enable2FA(userId) {
  return { userId, enabled: true };
}

export function generateOTP(userId) {
  return {
    userId,
    otp: Math.floor(100000 + Math.random() * 900000),
  };
}

export function socialLogin(provider, profile = {}) {
  return {
    provider,
    authenticated: true,
    profile,
  };
}

export function registerSession(device) {
  securityState.sessions.push({
    device,
    createdAt: Date.now(),
  });

  return securityState.sessions;
}

export function detectSuspiciousLogin(event) {
  securityState.suspiciousEvents.push(event);

  return {
    suspicious: true,
    event,
  };
}

export function rotateRefreshToken(token) {
  return `${token}_rotated`;
}

export function secureSessionSync() {
  return {
    synced: true,
    encrypted: true,
  };
}

export function biometricAuth() {
  return {
    biometric: true,
    verified: true,
  };
}

export function passwordlessAuth(email) {
  return {
    email,
    loginLinkSent: true,
  };
}

export default {
  enable2FA,
  generateOTP,
  socialLogin,
  registerSession,
  detectSuspiciousLogin,
  rotateRefreshToken,
  secureSessionSync,
  biometricAuth,
  passwordlessAuth,
};