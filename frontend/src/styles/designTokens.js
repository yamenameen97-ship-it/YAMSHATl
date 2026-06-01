/**
 * Yamshat Design System Tokens
 * Single source of truth for colors, spacing, typography, radius and elevation.
 */

export const colors = {
  primary: {
    50: '#f5f3ff',
    100: '#ede9fe',
    500: '#8b5cf6',
    600: '#7c3aed',
    700: '#6d28d9',
    900: '#2e1065',
  },
  secondary: {
    50: '#ecfeff',
    100: '#cffafe',
    500: '#06b6d4',
    600: '#0891b2',
    700: '#0e7490',
    900: '#164e63',
  },
  surfaces: {
    background: '#07101d',
    backgroundMuted: '#0d1728',
    surface: 'rgba(11, 18, 32, 0.88)',
    surfaceStrong: 'rgba(12, 20, 36, 0.94)',
    surfaceSoft: 'rgba(148, 163, 184, 0.08)',
    overlay: 'rgba(7, 12, 24, 0.72)',
    text: '#e5eefc',
    textSoft: '#c6d3e6',
    textMuted: '#8fa2bd',
    textOnPrimary: '#ffffff',
  },
  borders: {
    subtle: 'rgba(148, 163, 184, 0.16)',
    strong: 'rgba(148, 163, 184, 0.28)',
    focus: 'rgba(139, 92, 246, 0.42)',
  },
  success: {
    50: '#f0fdf4',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
  },
  warning: {
    500: '#f59e0b',
    600: '#d97706',
  },
  danger: {
    50: '#fef2f2',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
  },
  gradients: {
    primary: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)',
    surface: 'linear-gradient(160deg, #07101d 0%, #091321 55%, #060c17 100%)',
    hero: 'linear-gradient(135deg, rgba(139, 92, 246, 0.24), rgba(6, 182, 212, 0.14))',
  },
};

export const spacing = {
  4: '4px',
  8: '8px',
  12: '12px',
  16: '16px',
  24: '24px',
  32: '32px',
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  '2xl': '32px',
};

export const radii = {
  small: '8px',
  medium: '12px',
  large: '16px',
  xl: '24px',
  pill: '999px',
};

export const shadows = {
  xs: '0 4px 10px rgba(15, 23, 42, 0.08)',
  small: '0 10px 24px rgba(15, 23, 42, 0.12)',
  medium: '0 18px 36px rgba(15, 23, 42, 0.18)',
  large: '0 26px 60px rgba(2, 6, 23, 0.24)',
  xl: '0 34px 80px rgba(2, 6, 23, 0.32)',
  inset: 'inset 0 1px 0 rgba(255, 255, 255, 0.04)',
  focus: '0 0 0 4px rgba(139, 92, 246, 0.14)',
  sm: '0 10px 24px rgba(15, 23, 42, 0.12)',
  md: '0 18px 36px rgba(15, 23, 42, 0.18)',
  lg: '0 26px 60px rgba(2, 6, 23, 0.24)',
};

export const typography = {
  fontFamily: {
    sans: "'Inter', 'Cairo', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    display: "'Inter', 'Cairo', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', ui-monospace, SFMono-Regular, monospace",
  },
  sizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
  },
  headings: {
    h1: 'clamp(2rem, 4vw, 3rem)',
    h2: 'clamp(1.625rem, 3vw, 2.25rem)',
    h3: 'clamp(1.375rem, 2.4vw, 1.75rem)',
    h4: '1.25rem',
    h5: '1.125rem',
    h6: '1rem',
  },
  weights: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
  lineHeights: {
    tight: 1.2,
    snug: 1.35,
    normal: 1.55,
    relaxed: 1.7,
  },
};

export const tokens = {
  colors,
  spacing,
  radii,
  shadows,
  typography,
  animations: {
    durations: {
      fast: '180ms',
      normal: '240ms',
      slow: '360ms',
    },
    easings: {
      standard: 'cubic-bezier(0.22, 1, 0.36, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    },
  },
  borderRadius: {
    small: radii.small,
    medium: radii.medium,
    large: radii.large,
    xl: radii.xl,
    full: radii.pill,
    sm: radii.small,
    md: radii.medium,
    lg: radii.large,
  },
};

export default tokens;
