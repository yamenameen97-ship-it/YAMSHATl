import { memo, useCallback } from 'react';

/**
 * MemoizedButton Component
 * 
 * زر محسّن مع:
 * - React.memo لمنع rerenders غير الضرورية
 * - useCallback لـ handlers
 * - Optimized styling
 */
const MemoizedButton = memo(function Button({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  loading = false,
  className = '',
  style = {},
  type = 'button',
  ...props
}) {
  // useCallback لضمان عدم تغيير الـ reference
  const handleClick = useCallback((e) => {
    if (!disabled && !loading && onClick) {
      onClick(e);
    }
  }, [onClick, disabled, loading]);

  const baseStyles = {
    padding: '8px 16px',
    borderRadius: '6px',
    border: 'none',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    opacity: disabled || loading ? 0.6 : 1,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    ...style,
  };

  const variantStyles = {
    primary: {
      background: 'var(--primary)',
      color: 'white',
    },
    secondary: {
      background: 'var(--bg-soft)',
      color: 'var(--text)',
      border: '1px solid var(--line)',
    },
    danger: {
      background: '#ef4444',
      color: 'white',
    },
    success: {
      background: '#10b981',
      color: 'white',
    },
  };

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={disabled || loading}
      className={`memoized-button ${className}`}
      style={{ ...baseStyles, ...variantStyles[variant] }}
      {...props}
    >
      {loading && <span className="spinner" />}
      {children}
    </button>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for memo
  // Return true if props are equal (skip re-render)
  return (
    prevProps.children === nextProps.children &&
    prevProps.onClick === nextProps.onClick &&
    prevProps.variant === nextProps.variant &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.loading === nextProps.loading &&
    prevProps.className === nextProps.className &&
    JSON.stringify(prevProps.style) === JSON.stringify(nextProps.style)
  );
});

MemoizedButton.displayName = 'MemoizedButton';

export default MemoizedButton;
