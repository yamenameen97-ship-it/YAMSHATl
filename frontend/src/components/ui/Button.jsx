import { useEffect, useRef, useState } from 'react';

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function triggerHapticFeedback(type = 'light') {
  if (!navigator.vibrate) return;
  const durations = {
    light: 10,
    medium: 20,
    heavy: 30,
  };
  navigator.vibrate(durations[type] || durations.light);
}

const VARIANT_MAP = {
  primary: 'primary',
  secondary: 'secondary',
  ghost: 'secondary',
  success: 'success',
  danger: 'danger',
  destructive: 'danger',
  warning: 'warning',
};

const SIZE_MAP = {
  sm: 'small',
  md: 'medium',
  lg: 'large',
};

export default function Button({
  children,
  type = 'button',
  variant = 'primary',
  size = 'medium',
  className = '',
  disabled = false,
  loading = false,
  preventRepeat = true,
  cooldownMs = 400,
  hapticFeedback = true,
  icon = null,
  trailingIcon = null,
  fullWidth = false,
  onClick,
  ...props
}) {
  const [internalBusy, setInternalBusy] = useState(false);
  const mountedRef = useRef(true);

  const resolvedVariant = VARIANT_MAP[variant] || variant;
  const resolvedSize = SIZE_MAP[size] || size;
  const busy = loading || internalBusy;
  const locked = disabled || busy;

  useEffect(() => () => {
    mountedRef.current = false;
  }, []);

  const handleClick = async (event) => {
    if (!onClick) return;
    if (locked) {
      event.preventDefault();
      return;
    }

    if (hapticFeedback) triggerHapticFeedback('light');

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

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick(event);
    }
  };

  const buttonClasses = [
    'btn',
    `btn-${resolvedVariant}`,
    `btn-${resolvedSize}`,
    busy ? 'is-busy' : '',
    locked ? 'is-disabled' : '',
    fullWidth ? 'is-full-width' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
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
      {busy ? <span className="btn-spinner" aria-hidden="true" /> : null}
      {icon ? <span className="btn-icon" aria-hidden="true">{icon}</span> : null}
      <span className="btn-label">{children}</span>
      {trailingIcon ? <span className="btn-icon btn-icon-trailing" aria-hidden="true">{trailingIcon}</span> : null}
    </button>
  );
}
