import { useEffect, useRef, useState } from 'react';

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export default function Button({
  children,
  type = 'button',
  variant = 'primary',
  className = '',
  disabled = false,
  loading = false,
  preventRepeat = true,
  cooldownMs = 500,
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

  const handleClick = async (event) => {
    if (!onClick) return;
    if (locked) {
      event.preventDefault();
      return;
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

  return (
    <button
      type={type}
      disabled={locked}
      aria-busy={busy}
      data-busy={busy ? 'true' : 'false'}
      className={`btn btn-${variant} ${busy ? 'is-busy' : ''} ${className}`.trim()}
      onClick={handleClick}
      {...props}
    >
      {busy ? <span className="btn-spinner" aria-hidden="true" /> : null}
      <span className="btn-label">{children}</span>
    </button>
  );
}
