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
    textMuted: '#8fa2bd',
    textOnPrimary: '#ffffff',
  },
  borders: {
    subtle: 'rgba(148, 163, 184, 0.16)',
    strong: 'rgba(148, 163, 184, 0.28)',
    focus: 'rgba(139, 92, 246, 0.42)',
  },
  danger: {
    50: '#fef2f2',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
  },
  success: {
    50: '#f0fdf4',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
  },
  gradients: {
    primary: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)',
    surface: 'linear-gradient(160deg, #07101d 0%, #091321 55%, #060c17 100%)',
    hero: 'linear-gradient(135deg, rgba(139, 92, 246, 0.24), rgba(6, 182, 212, 0.14))',
  },
} as const;

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
} as const;

export const radii = {
  small: '8px',
  medium: '12px',
  large: '16px',
  xl: '24px',
  pill: '999px',
} as const;

export const shadows = {
  small: '0 10px 24px rgba(15, 23, 42, 0.12)',
  medium: '0 18px 36px rgba(15, 23, 42, 0.18)',
  large: '0 26px 60px rgba(2, 6, 23, 0.24)',
  xl: '0 34px 80px rgba(2, 6, 23, 0.32)',
  focus: '0 0 0 3px rgba(139, 92, 246, 0.16)',
} as const;

export const themeContract = {
  colors,
  spacing,
  radii,
  shadows,
} as const;

export default themeContract;
