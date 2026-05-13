/**
 * Enhanced Responsive Utilities
 * Provides breakpoint detection, responsive hooks, and utilities
 */

// Breakpoints
export const BREAKPOINTS = {
  xs: 320,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

/**
 * Get current breakpoint
 * @returns {string} Current breakpoint name
 */
export function getCurrentBreakpoint() {
  const width = window.innerWidth;

  if (width < BREAKPOINTS.sm) return 'xs';
  if (width < BREAKPOINTS.md) return 'sm';
  if (width < BREAKPOINTS.lg) return 'md';
  if (width < BREAKPOINTS.xl) return 'lg';
  if (width < BREAKPOINTS['2xl']) return 'xl';
  return '2xl';
}

/**
 * Check if current width matches breakpoint
 * @param {string} breakpoint - Breakpoint name
 * @returns {boolean} Whether current width matches
 */
export function isBreakpoint(breakpoint) {
  return getCurrentBreakpoint() === breakpoint;
}

/**
 * Check if current width is at least breakpoint
 * @param {string} breakpoint - Breakpoint name
 * @returns {boolean} Whether current width is at least breakpoint
 */
export function isBreakpointUp(breakpoint) {
  const currentWidth = window.innerWidth;
  return currentWidth >= (BREAKPOINTS[breakpoint] || 0);
}

/**
 * Check if current width is below breakpoint
 * @param {string} breakpoint - Breakpoint name
 * @returns {boolean} Whether current width is below breakpoint
 */
export function isBreakpointDown(breakpoint) {
  const currentWidth = window.innerWidth;
  return currentWidth < (BREAKPOINTS[breakpoint] || 0);
}

/**
 * Get responsive value based on breakpoint
 * @param {object} values - Object with breakpoint keys and values
 * @returns {any} Value for current breakpoint
 */
export function getResponsiveValue(values) {
  const breakpoint = getCurrentBreakpoint();
  return values[breakpoint] !== undefined ? values[breakpoint] : values.xs;
}

/**
 * React hook for responsive breakpoint detection
 * @returns {string} Current breakpoint
 */
export function useResponsive() {
  const [breakpoint, setBreakpoint] = React.useState(getCurrentBreakpoint());

  React.useEffect(() => {
    const handleResize = () => {
      setBreakpoint(getCurrentBreakpoint());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return breakpoint;
}

/**
 * React hook for responsive values
 * @param {object} values - Object with breakpoint keys and values
 * @returns {any} Value for current breakpoint
 */
export function useResponsiveValue(values) {
  const breakpoint = useResponsive();
  return values[breakpoint] !== undefined ? values[breakpoint] : values.xs;
}

/**
 * React hook for media query matching
 * @param {string} query - Media query string
 * @returns {boolean} Whether media query matches
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handleChange = (e) => setMatches(e.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [query]);

  return matches;
}

/**
 * React hook to detect if device is mobile
 * @returns {boolean} Whether device is mobile
 */
export function useIsMobile() {
  return useMediaQuery(`(max-width: ${BREAKPOINTS.md - 1}px)`);
}

/**
 * React hook to detect if device is tablet
 * @returns {boolean} Whether device is tablet
 */
export function useIsTablet() {
  return useMediaQuery(`(min-width: ${BREAKPOINTS.md}px) and (max-width: ${BREAKPOINTS.lg - 1}px)`);
}

/**
 * React hook to detect if device is desktop
 * @returns {boolean} Whether device is desktop
 */
export function useIsDesktop() {
  return useMediaQuery(`(min-width: ${BREAKPOINTS.lg}px)`);
}

/**
 * React hook to detect if device is in portrait mode
 * @returns {boolean} Whether device is in portrait mode
 */
export function useIsPortrait() {
  return useMediaQuery('(orientation: portrait)');
}

/**
 * React hook to detect if device is in landscape mode
 * @returns {boolean} Whether device is in landscape mode
 */
export function useIsLandscape() {
  return useMediaQuery('(orientation: landscape)');
}

/**
 * React hook to detect if device prefers dark mode
 * @returns {boolean} Whether device prefers dark mode
 */
export function usePrefersDarkMode() {
  return useMediaQuery('(prefers-color-scheme: dark)');
}

/**
 * React hook to detect if device prefers reduced motion
 * @returns {boolean} Whether device prefers reduced motion
 */
export function usePrefersReducedMotion() {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

/**
 * React hook to get window size
 * @returns {object} Window size { width, height }
 */
export function useWindowSize() {
  const [size, setSize] = React.useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  React.useEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}

/**
 * React hook to detect if element is visible in viewport
 * @param {React.RefObject} ref - Element reference
 * @returns {boolean} Whether element is visible
 */
export function useInView(ref) {
  const [isInView, setIsInView] = React.useState(false);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [ref]);

  return isInView;
}

/**
 * Generate responsive CSS media queries
 * @param {string} breakpoint - Breakpoint name
 * @returns {string} Media query string
 */
export function getMediaQuery(breakpoint) {
  const width = BREAKPOINTS[breakpoint];
  if (!width) return '';
  return `@media (min-width: ${width}px)`;
}

/**
 * Generate responsive CSS media queries (max-width)
 * @param {string} breakpoint - Breakpoint name
 * @returns {string} Media query string
 */
export function getMediaQueryDown(breakpoint) {
  const width = BREAKPOINTS[breakpoint];
  if (!width) return '';
  return `@media (max-width: ${width - 1}px)`;
}

/**
 * Get responsive padding
 * @param {object} values - Padding values for each breakpoint
 * @returns {object} Responsive padding object
 */
export function getResponsivePadding(values = {}) {
  const defaults = {
    xs: '12px',
    sm: '16px',
    md: '20px',
    lg: '24px',
    xl: '32px',
    '2xl': '40px',
  };

  return { ...defaults, ...values };
}

/**
 * Get responsive font size
 * @param {object} values - Font size values for each breakpoint
 * @returns {object} Responsive font size object
 */
export function getResponsiveFontSize(values = {}) {
  const defaults = {
    xs: '12px',
    sm: '14px',
    md: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
  };

  return { ...defaults, ...values };
}

/**
 * Get responsive gap
 * @param {object} values - Gap values for each breakpoint
 * @returns {object} Responsive gap object
 */
export function getResponsiveGap(values = {}) {
  const defaults = {
    xs: '8px',
    sm: '12px',
    md: '16px',
    lg: '20px',
    xl: '24px',
    '2xl': '32px',
  };

  return { ...defaults, ...values };
}

/**
 * Get responsive columns for grid
 * @param {object} values - Column values for each breakpoint
 * @returns {object} Responsive columns object
 */
export function getResponsiveColumns(values = {}) {
  const defaults = {
    xs: 1,
    sm: 2,
    md: 3,
    lg: 4,
    xl: 5,
    '2xl': 6,
  };

  return { ...defaults, ...values };
}

/**
 * Handle responsive overflow
 * @param {HTMLElement} element - Element to handle
 */
export function handleResponsiveOverflow(element) {
  if (!element) return;

  const handleResize = () => {
    const width = window.innerWidth;
    const elementWidth = element.scrollWidth;

    if (elementWidth > width) {
      element.style.overflowX = 'auto';
      element.style.overflowY = 'hidden';
    } else {
      element.style.overflowX = 'hidden';
      element.style.overflowY = 'auto';
    }
  };

  window.addEventListener('resize', handleResize);
  handleResize();

  return () => window.removeEventListener('resize', handleResize);
}

/**
 * Get safe area insets for notched devices
 * @returns {object} Safe area insets { top, right, bottom, left }
 */
export function getSafeAreaInsets() {
  const style = getComputedStyle(document.documentElement);
  return {
    top: style.getPropertyValue('--safe-area-inset-top') || '0',
    right: style.getPropertyValue('--safe-area-inset-right') || '0',
    bottom: style.getPropertyValue('--safe-area-inset-bottom') || '0',
    left: style.getPropertyValue('--safe-area-inset-left') || '0',
  };
}

/**
 * Get device performance profile
 * @returns {object} Device profile information
 */
export function getDeviceProfile() {
  const isLowEnd = typeof navigator !== 'undefined' && 
    ((navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) || 
     (navigator.deviceMemory && navigator.deviceMemory <= 4));
  
  const connection = typeof navigator !== 'undefined' && navigator.connection ? 
    navigator.connection.effectiveType : 'unknown';

  return {
    isLowEndDevice: isLowEnd,
    effectiveType: connection,
    preferredVideoQuality: isLowEnd ? '480p' : '1080p',
  };
}

/**
 * Append quality parameter to video URL
 * @param {string} url - The video URL
 * @param {string} quality - The desired quality
 * @returns {string} URL with quality parameter
 */
export function appendVideoQuality(url, quality) {
  if (!url) return '';
  try {
    const urlObj = new URL(url, window.location.origin);
    urlObj.searchParams.set('q', quality);
    return urlObj.toString();
  } catch {
    return `${url}${url.includes('?') ? '&' : '?'}q=${quality}`;
  }
}

export default {
  BREAKPOINTS,
  getCurrentBreakpoint,
  isBreakpoint,
  isBreakpointUp,
  isBreakpointDown,
  getResponsiveValue,
  useResponsive,
  useResponsiveValue,
  useMediaQuery,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  useIsPortrait,
  useIsLandscape,
  usePrefersDarkMode,
  usePrefersReducedMotion,
  useWindowSize,
  useInView,
  getMediaQuery,
  getMediaQueryDown,
  getResponsivePadding,
  getResponsiveFontSize,
  getResponsiveGap,
  getResponsiveColumns,
  handleResponsiveOverflow,
  getSafeAreaInsets,
  getDeviceProfile,
  appendVideoQuality,
};
