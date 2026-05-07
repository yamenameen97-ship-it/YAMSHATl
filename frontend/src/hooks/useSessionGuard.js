import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import sessionManager from '../auth/sessionManager.js';
import { clearStoredUser, getAuthToken, getSessionTtlMs, getStoredUser, hasStoredSession, shouldRefreshSessionSoon } from '../utils/auth.js';
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
        const pathname = location.pathname;
        const publicPath = isPublicPath(pathname);
        const stored = getStoredUser();
        const token = getAuthToken();
        const shouldAttemptRestore = !publicPath || hasStoredSession();

        if (stored && token && !shouldRefreshSessionSoon(REFRESH_EARLY_WINDOW_MS)) return;
        if (!shouldAttemptRestore) return;

        await sessionManager.refreshSession({
          reason: publicPath ? 'public-bootstrap' : 'protected-bootstrap',
          force: !publicPath,
        });
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
        await sessionManager.refreshSession({ reason: 'scheduled' });
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
