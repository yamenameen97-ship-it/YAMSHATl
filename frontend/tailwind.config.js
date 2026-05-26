/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--primary)',
        secondary: 'var(--secondary)',
        success: 'var(--success)',
        danger: 'var(--danger)',
        surface: {
          DEFAULT: 'var(--panel)',
          strong: 'var(--panel-strong)',
          soft: 'var(--panel-soft)',
          bg: 'var(--bg)',
        },
        border: {
          DEFAULT: 'var(--line)',
          strong: 'var(--border-strong)',
        },
      },
      spacing: {
        'ui-1': 'var(--spacing-4)',
        'ui-2': 'var(--spacing-8)',
        'ui-3': 'var(--spacing-12)',
        'ui-4': 'var(--spacing-16)',
        'ui-5': 'var(--spacing-24)',
        'ui-6': 'var(--spacing-32)',
      },
      borderRadius: {
        small: 'var(--radius-small)',
        medium: 'var(--radius-medium)',
        large: 'var(--radius-large)',
        xl: 'var(--radius-xl)',
      },
      boxShadow: {
        small: 'var(--shadow-small)',
        medium: 'var(--shadow-medium)',
        large: 'var(--shadow-large)',
        xl: 'var(--shadow-xl)',
      },
      backgroundImage: {
        'gradient-primary': 'var(--gradient-primary)',
        'gradient-hero': 'var(--gradient-hero)',
      },
    },
  },
  plugins: [],
};
