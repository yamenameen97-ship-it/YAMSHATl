import { useEffect, useRef, useState } from 'react';

/**
 * Button Component
 * Features: Unified variants, Loading states, Haptic feedback, Disabled polish
 */

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

/**
 * Triggers haptic feedback if available
 */
function triggerHapticFeedback(type = 'light') {
  if (navigator.vibrate) {
    switch (type) {
      case 'light':
        navigator.vibrate(10);
        break;
      case 'medium':
        navigator.vibrate(20);
        break;
      case 'heavy':
        navigator.vibrate(30);
        break;
      default:
        navigator.vibrate(10);
    }
  }
}

export default function Button({
  children,
  type = 'button',
  variant = 'primary',
  size = 'medium',
  className = '',
  disabled = false,
  loading = false,
  preventRepeat = true,
  cooldownMs = 500,
  hapticFeedback = true,
  icon = null,
  fullWidth = false,
  onClick,
  ...props
}) {
  const [internalBusy, setInternalBusy] = useState(false);
  const mountedRef = useRef(true);

  const busy = loading || internalBusy;
  const locked = disabled || busy;

  useEffect(() => () => {
    mountedRef.current = false;
  }, []);

  /**
   * Handles button click with haptic feedback
   */
  const handleClick = async (event) => {
    if (!onClick) return;
    if (locked) {
      event.preventDefault();
      return;
    }

    if (hapticFeedback) {
      triggerHapticFeedback('light');
    }

    if (!preventRepeat) {
      onClick(event);
      return;
    }

    setInternalBusy(true);
    try {
      await Promise.resolve(onClick(event));
      if (cooldownMs > 0) await wait(cooldownMs);
    } finally {
      if (mountedRef.current) setInternalBusy(false);
    }
  };

  /**
   * Handles keyboard interactions
   */
  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick(event);
    }
  };

  const buttonClasses = [
    'btn',
    `btn-${variant}`,
    `btn-${size}`,
    busy ? 'is-busy' : '',
    locked ? 'is-disabled' : '',
    fullWidth ? 'is-full-width' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <button
        type={type}
        disabled={locked}
        aria-busy={busy}
        data-busy={busy ? 'true' : 'false'}
        className={buttonClasses}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        {...props}
      >
        {icon && <span className="btn-icon">{icon}</span>}
        {busy && <span className="btn-spinner" aria-hidden="true" />}
        <span className="btn-label">{children}</span>
      </button>

      <style dangerouslySetInnerHTML={{
        __html: `
          .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            font-weight: 600;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s ease;
            outline: none;
            position: relative;
            overflow: hidden;
            white-space: nowrap;
          }

          /* Size variants */
          .btn-small {
            padding: 6px 12px;
            font-size: 0.875rem;
          }

          .btn-medium {
            padding: 10px 16px;
            font-size: 1rem;
          }

          .btn-large {
            padding: 14px 24px;
            font-size: 1.125rem;
          }

          /* Color variants */
          .btn-primary {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            color: white;
            box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.3);
          }

          .btn-primary:hover:not(:disabled) {
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            box-shadow: 0 6px 12px -1px rgba(59, 130, 246, 0.4);
            transform: translateY(-2px);
          }

          .btn-primary:active:not(:disabled) {
            transform: translateY(0);
            box-shadow: 0 2px 4px -1px rgba(59, 130, 246, 0.3);
          }

          .btn-primary:focus:not(:disabled) {
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1), 0 4px 6px -1px rgba(59, 130, 246, 0.3);
          }

          .btn-secondary {
            background: #e5e7eb;
            color: #111827;
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
          }

          .btn-secondary:hover:not(:disabled) {
            background: #d1d5db;
            box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.1);
            transform: translateY(-1px);
          }

          .btn-secondary:active:not(:disabled) {
            transform: translateY(0);
          }

          .btn-success {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.3);
          }

          .btn-success:hover:not(:disabled) {
            background: linear-gradient(135deg, #059669 0%, #047857 100%);
            box-shadow: 0 6px 12px -1px rgba(16, 185, 129, 0.4);
            transform: translateY(-2px);
          }

          .btn-danger {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            color: white;
            box-shadow: 0 4px 6px -1px rgba(239, 68, 68, 0.3);
          }

          .btn-danger:hover:not(:disabled) {
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
            box-shadow: 0 6px 12px -1px rgba(239, 68, 68, 0.4);
            transform: translateY(-2px);
          }

          .btn-warning {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            color: white;
            box-shadow: 0 4px 6px -1px rgba(245, 158, 11, 0.3);
          }

          .btn-warning:hover:not(:disabled) {
            background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
            box-shadow: 0 6px 12px -1px rgba(245, 158, 11, 0.4);
            transform: translateY(-2px);
          }

          /* Full width */
          .btn.is-full-width {
            width: 100%;
          }

          /* Loading state */
          .btn.is-busy {
            opacity: 0.8;
          }

          .btn-spinner {
            display: inline-block;
            width: 16px;
            height: 16px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-top-color: white;
            border-radius: 50%;
            animation: spin 0.6s linear infinite;
          }

          .btn-small .btn-spinner {
            width: 12px;
            height: 12px;
            border-width: 2px;
          }

          .btn-large .btn-spinner {
            width: 20px;
            height: 20px;
            border-width: 2px;
          }

          /* Icon */
          .btn-icon {
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }

          /* Disabled state */
          .btn:disabled,
          .btn.is-disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none !important;
            box-shadow: none !important;
          }

          /* Focus visible for accessibility */
          .btn:focus-visible {
            outline: 2px solid #3b82f6;
            outline-offset: 2px;
          }

          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }

          /* Ripple effect on click */
          .btn::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 0;
            height: 0;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.5);
            transform: translate(-50%, -50%);
            pointer-events: none;
          }

          .btn:active:not(:disabled)::after {
            animation: ripple 0.6s ease-out;
          }

          @keyframes ripple {
            to {
              width: 300px;
              height: 300px;
              opacity: 0;
            }
          }
        `,
      }}
      />
    </>
  );
}
