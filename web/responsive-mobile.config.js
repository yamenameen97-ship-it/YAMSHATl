/**
 * Yamshat Responsive & Mobile Optimization
 * تحسين التوافق مع الموبايل والـ Responsive Design
 * Version 2.0.0
 */

// ============ Responsive Breakpoints ============

export const breakpoints = {
  xs: 0,      // Extra small devices
  sm: 576,    // Small devices (landscape phones)
  md: 768,    // Medium devices (tablets)
  lg: 992,    // Large devices (desktops)
  xl: 1200,   // Extra large devices
  xxl: 1400,  // XXL devices
  foldable: 1024, // Foldable devices
};

export const mediaQueries = {
  xs: `@media (min-width: ${breakpoints.xs}px)`,
  sm: `@media (min-width: ${breakpoints.sm}px)`,
  md: `@media (min-width: ${breakpoints.md}px)`,
  lg: `@media (min-width: ${breakpoints.lg}px)`,
  xl: `@media (min-width: ${breakpoints.xl}px)`,
  xxl: `@media (min-width: ${breakpoints.xxl}px)`,
  foldable: `@media (min-width: ${breakpoints.foldable}px)`,
  landscape: '@media (orientation: landscape)',
  portrait: '@media (orientation: portrait)',
  touchDevice: '@media (hover: none) and (pointer: coarse)',
  pointerDevice: '@media (hover: hover) and (pointer: fine)',
};

// ============ Safe Areas (Notch Support) ============

export const safeAreas = {
  // CSS variables for safe areas
  cssVariables: `
    :root {
      --safe-area-inset-top: env(safe-area-inset-top, 0px);
      --safe-area-inset-right: env(safe-area-inset-right, 0px);
      --safe-area-inset-bottom: env(safe-area-inset-bottom, 0px);
      --safe-area-inset-left: env(safe-area-inset-left, 0px);
    }
  `,

  // Safe area padding
  padding: {
    top: 'var(--safe-area-inset-top)',
    right: 'var(--safe-area-inset-right)',
    bottom: 'var(--safe-area-inset-bottom)',
    left: 'var(--safe-area-inset-left)',
  },

  // Safe area margins
  margin: {
    top: 'var(--safe-area-inset-top)',
    right: 'var(--safe-area-inset-right)',
    bottom: 'var(--safe-area-inset-bottom)',
    left: 'var(--safe-area-inset-left)',
  },

  // Viewport fit
  viewportMeta: 'viewport-fit=cover',
};

// ============ Gesture Navigation ============

export const gestureNavigation = {
  // Swipe gestures
  swipe: {
    enabled: true,
    sensitivity: 50,
    threshold: 10,
  },

  // Long press
  longPress: {
    enabled: true,
    duration: 500,
  },

  // Double tap
  doubleTap: {
    enabled: true,
    delay: 300,
  },

  // Pinch zoom
  pinchZoom: {
    enabled: true,
    minScale: 1,
    maxScale: 3,
  },

  // Rotate
  rotate: {
    enabled: true,
    threshold: 15,
  },
};

// ============ Touch Optimization ============

export const touchOptimization = {
  // Touch target size
  touchTargetSize: 44, // minimum 44x44 pixels

  // Touch feedback
  touchFeedback: {
    enabled: true,
    duration: 200,
    opacity: 0.7,
  },

  // Prevent double tap zoom
  preventDoubleTapZoom: true,

  // Touch action CSS
  touchActionCSS: `
    button, a, input, select, textarea {
      touch-action: manipulation;
    }
  `,

  // Haptic feedback
  hapticFeedback: {
    enabled: true,
    light: 10,
    medium: 20,
    heavy: 30,
  },
};

// ============ Keyboard Handling ============

export const keyboardHandling = {
  // Keyboard detection
  keyboardDetection: {
    enabled: true,
    adjustViewport: true,
  },

  // Virtual keyboard handling
  virtualKeyboard: {
    adjustHeight: true,
    adjustScroll: true,
    adjustPadding: true,
  },

  // Keyboard shortcuts
  shortcuts: {
    enabled: true,
    escapeToClose: true,
    enterToSubmit: true,
    tabNavigation: true,
  },

  // Input handling
  inputHandling: {
    autoCorrect: 'off',
    autoCapitalize: 'off',
    spellCheck: 'false',
    autocomplete: 'off',
  },
};

// ============ Landscape Support ============

export const landscapeSupport = {
  // Landscape layout
  landscapeLayout: {
    enabled: true,
    adjustPadding: true,
    adjustFontSize: true,
    adjustSpacing: true,
  },

  // Landscape CSS
  landscapeCSS: `
    @media (orientation: landscape) {
      body {
        padding-top: 0;
        padding-bottom: 0;
      }
      
      header {
        height: auto;
        padding: 8px 16px;
      }
      
      main {
        height: 100vh;
        overflow-y: auto;
      }
      
      footer {
        position: fixed;
        bottom: 0;
        height: auto;
      }
    }
  `,

  // Landscape detection
  orientationChange: {
    enabled: true,
    debounce: 250,
  },
};

// ============ Foldable Device Support ============

export const foldableSupport = {
  // Foldable detection
  foldableDetection: {
    enabled: true,
    checkMediaQuery: true,
  },

  // Foldable CSS
  foldableCSS: `
    @media (screen-spanning: single-fold-vertical) {
      body {
        display: flex;
        flex-direction: row;
      }
      
      main {
        width: env(viewport-segment-width 0 0);
        height: 100vh;
        overflow-y: auto;
      }
      
      aside {
        width: env(viewport-segment-width 1 0);
        height: 100vh;
        overflow-y: auto;
      }
    }
    
    @media (screen-spanning: single-fold-horizontal) {
      body {
        display: flex;
        flex-direction: column;
      }
      
      header {
        height: env(viewport-segment-height 0 0);
      }
      
      main {
        height: env(viewport-segment-height 1 0);
        overflow-y: auto;
      }
    }
  `,

  // Viewport segments
  viewportSegments: {
    enabled: true,
    adjustLayout: true,
  },
};

// ============ Tablet Optimization ============

export const tabletOptimization = {
  // Tablet layout
  tabletLayout: {
    enabled: true,
    multiColumn: true,
    sidebarLayout: true,
  },

  // Tablet CSS
  tabletCSS: `
    @media (min-width: 768px) {
      .container {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
      }
      
      .sidebar {
        display: block;
        width: 300px;
      }
      
      .main-content {
        flex: 1;
      }
    }
  `,

  // Tablet touch handling
  touchHandling: {
    enabled: true,
    adjustTouchTargets: true,
  },
};

// ============ Adaptive Layouts ============

export const adaptiveLayouts = {
  // Grid layout
  gridLayout: {
    enabled: true,
    autoColumns: 'auto-fit',
    minColumnWidth: '250px',
  },

  // Flexbox layout
  flexLayout: {
    enabled: true,
    autoWrap: true,
  },

  // Container queries
  containerQueries: {
    enabled: true,
    breakpoints: {
      sm: '300px',
      md: '600px',
      lg: '900px',
      xl: '1200px',
    },
  },

  // Responsive typography
  responsiveTypography: {
    enabled: true,
    minFontSize: 14,
    maxFontSize: 20,
    minViewportWidth: 320,
    maxViewportWidth: 1400,
  },

  // Responsive spacing
  responsiveSpacing: {
    enabled: true,
    minSpacing: 8,
    maxSpacing: 32,
  },
};

// ============ Bottom Navigation ============

export const bottomNavigation = {
  // Bottom nav configuration
  config: {
    enabled: true,
    position: 'fixed',
    bottom: 0,
    height: 56,
    zIndex: 100,
  },

  // Bottom nav items
  items: [
    {
      id: 'home',
      label: 'الرئيسية',
      icon: 'home',
      route: '/',
    },
    {
      id: 'messages',
      label: 'الرسائل',
      icon: 'message',
      route: '/messages',
      badge: true,
    },
    {
      id: 'calls',
      label: 'المكالمات',
      icon: 'call',
      route: '/calls',
    },
    {
      id: 'profile',
      label: 'الملف',
      icon: 'profile',
      route: '/profile',
    },
  ],

  // Safe area adjustment
  safeAreaAdjustment: {
    enabled: true,
    paddingBottom: 'var(--safe-area-inset-bottom)',
  },

  // Scroll behavior
  scrollBehavior: {
    hideOnScroll: true,
    showOnScrollUp: true,
  },
};

// ============ Responsive Typography ============

export const responsiveTypography = {
  // Font sizes
  fontSizes: {
    h1: {
      mobile: '24px',
      tablet: '32px',
      desktop: '40px',
    },
    h2: {
      mobile: '20px',
      tablet: '28px',
      desktop: '32px',
    },
    h3: {
      mobile: '18px',
      tablet: '24px',
      desktop: '28px',
    },
    body: {
      mobile: '14px',
      tablet: '16px',
      desktop: '16px',
    },
    small: {
      mobile: '12px',
      tablet: '14px',
      desktop: '14px',
    },
  },

  // Line heights
  lineHeights: {
    heading: 1.2,
    body: 1.5,
    relaxed: 1.75,
  },

  // Letter spacing
  letterSpacing: {
    tight: '-0.02em',
    normal: '0em',
    wide: '0.02em',
  },

  // Fluid typography CSS
  fluidTypography: `
    h1 {
      font-size: clamp(24px, 5vw, 40px);
    }
    
    h2 {
      font-size: clamp(20px, 4vw, 32px);
    }
    
    h3 {
      font-size: clamp(18px, 3vw, 28px);
    }
    
    body {
      font-size: clamp(14px, 2vw, 16px);
    }
  `,
};

// ============ Responsive Media ============

export const responsiveMedia = {
  // Image srcset
  imageSrcset: {
    enabled: true,
    sizes: [320, 640, 960, 1280, 1920],
  },

  // Picture element
  pictureElement: {
    enabled: true,
    formats: ['webp', 'avif', 'jpg'],
  },

  // Video responsive
  videoResponsive: {
    enabled: true,
    aspectRatios: {
      '16:9': 'padding-bottom: 56.25%',
      '4:3': 'padding-bottom: 75%',
      '1:1': 'padding-bottom: 100%',
    },
  },

  // Responsive iframes
  iframeResponsive: {
    enabled: true,
    aspectRatio: '16 / 9',
  },
};

export default {
  breakpoints,
  mediaQueries,
  safeAreas,
  gestureNavigation,
  touchOptimization,
  keyboardHandling,
  landscapeSupport,
  foldableSupport,
  tabletOptimization,
  adaptiveLayouts,
  bottomNavigation,
  responsiveTypography,
  responsiveMedia,
};
