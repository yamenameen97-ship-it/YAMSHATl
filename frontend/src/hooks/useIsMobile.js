import { useEffect, useState } from 'react';

/**
 * useIsMobile
 * -----------
 * يستخدم matchMedia بدل listener على resize ليقلّل rerenders.
 * Breakpoint افتراضي: 1024px (نفس قيمة الـ mobile-first.css).
 */
const MOBILE_QUERY = '(max-width: 1023.98px)';

function readMatch() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia(MOBILE_QUERY).matches;
}

export default function useIsMobile() {
  const [isMobile, setIsMobile] = useState(readMatch);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;

    const mql = window.matchMedia(MOBILE_QUERY);
    const handler = (event) => setIsMobile(event.matches);

    // sync بداية لتفادي SSR mismatch
    setIsMobile(mql.matches);

    // addEventListener حديث + fallback للمتصفحات الأقدم
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', handler);
      return () => mql.removeEventListener('change', handler);
    }
    mql.addListener(handler);
    return () => mql.removeListener(handler);
  }, []);

  return isMobile;
}
