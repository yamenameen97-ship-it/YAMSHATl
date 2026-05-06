import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { refreshSession } from '../api/auth.js';
import { clearStoredUser, getAuthToken, getSessionTtlMs, getStoredUser, hasStoredSession, mergeStoredUser } from '../utils/auth.js';
import { useAppStore } from '../store/appStore.js';

const PUBLIC_PATHS = new Set(['/login', '/register', '/verify-email', '/forgot-password', '/reset-password', '/admin', '/admin/login']);
const REFRESH_EARLY_WINDOW_MS = 60_000;

function isPublicPath(pathname) {
  if (PUBLIC_PATHS.has(pathname)) return true;
  return pathname.startsWith('/reset-password');
}

function redirectToLogin(pathname) {
  if (typeof window === 'undefined') return;
  const loginPath = pathname.startsWith('/admin') ? '/admin/login' : '/login';
  if (window.location.pathname !== loginPath) window.location.href = loginPath;
}

export default function useSessionGuard() {
  const location = useLocation();
  const setAuthHydrated = useAppStore((state) => state.setAuthHydrated);
  const setAuthLoading = useAppStore((state) => state.setAuthLoading);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      setAuthLoading(true);
      try {
        const stored = getStoredUser();
        if (!stored || !hasStoredSession()) return;

        const ttl = getSessionTtlMs();
        const token = getAuthToken();
        const shouldRefresh = !token || (ttl !== null && ttl <= REFRESH_EARLY_WINDOW_MS);
        if (!shouldRefresh) return;

        const { data } = await refreshSession();
        if (cancelled) return;
        mergeStoredUser(data);
      } catch {
        if (cancelled) return;
        clearStoredUser();
        if (!isPublicPath(location.pathname)) redirectToLogin(location.pathname);
      } finally {
        if (!cancelled) {
          setAuthHydrated(true);
          setAuthLoading(false);
        }
      }
    };

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [location.pathname, setAuthHydrated, setAuthLoading]);

  useEffect(() => {
    if (!hasStoredSession()) return undefined;

    const ttl = getSessionTtlMs();
    if (ttl === null) return undefined;

    const refreshIn = Math.max(ttl - REFRESH_EARLY_WINDOW_MS, 5_000);
    const timer = window.setTimeout(async () => {
      try {
        setAuthLoading(true);
        const { data } = await refreshSession();
        mergeStoredUser(data);
      } catch {
        clearStoredUser();
        if (!isPublicPath(location.pathname)) redirectToLogin(location.pathname);
      } finally {
        setAuthHydrated(true);
        setAuthLoading(false);
      }
    }, refreshIn);

    return () => window.clearTimeout(timer);
  }, [location.pathname, setAuthHydrated, setAuthLoading]);
}
