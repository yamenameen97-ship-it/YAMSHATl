const sizeMap = {
  xs: 28,
  sm: 36,
  md: 44,
  lg: 56,
  xl: 72,
};

export default function Avatar({
  src,
  alt,
  name = '',
  size = 'md',
  status = 'offline',
  className = '',
  rounded = 'full',
  icon = null,
  showStatus = false,
  ring = false,
  ringTone = 'primary',
  ...props
}) {
  const resolvedSize = typeof size === 'number' ? size : (sizeMap[size] || sizeMap.md);
  const initial = String(name || alt || 'Y').trim().charAt(0).toUpperCase() || 'Y';

  return (
    <span
      className={`ui-avatar is-${rounded} ${ring ? `has-ring ring-${ringTone}` : ''} ${className}`.trim()}
      style={{ '--avatar-size': `${resolvedSize}px` }}
      aria-label={alt || name || 'avatar'}
      {...props}
    >
      {src ? (
        <img src={src} alt={alt || name || 'avatar'} loading="lazy" />
      ) : (
        <span className="ui-avatar-fallback" aria-hidden="true">
          {icon || initial}
        </span>
      )}
      {showStatus ? <span className={`ui-avatar-status is-${status}`} aria-hidden="true" /> : null}
    </span>
  );
}
