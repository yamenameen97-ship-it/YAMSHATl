import { useEffect } from 'react';
import { clearStoredUser, getSessionTtlMs, getStoredUser } from '../utils/auth.js';

function redirectToLogin() {
  if (typeof window === 'undefined') return;
  const loginPath = window.location.pathname.startsWith('/admin') ? '/admin/login' : '/login';
  if (window.location.pathname !== loginPath) {
    window.location.href = loginPath;
  }
}

export default function useSessionGuard() {
  useEffect(() => {
    const current = getStoredUser();
    if (!current) return undefined;

    const ttl = getSessionTtlMs();
    if (ttl !== null && ttl <= 0) {
      clearStoredUser();
      redirectToLogin();
      return undefined;
    }

    if (ttl === null) return undefined;

    const timer = window.setTimeout(() => {
      clearStoredUser();
      redirectToLogin();
    }, ttl + 250);

    return () => window.clearTimeout(timer);
  }, [typeof window !== 'undefined' ? window.location.pathname : '']);
}
