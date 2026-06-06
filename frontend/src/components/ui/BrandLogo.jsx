export default function BrandLogo({
  size = 48,
  alt = 'Yamshat logo',
  className = '',
  style = {},
  shadow = true,
}) {
  const mergedStyle = {
    width: size,
    height: size,
    objectFit: 'contain',
    display: 'block',
    filter: shadow ? 'drop-shadow(0 14px 28px rgba(124, 58, 237, 0.28))' : 'none',
    ...style,
  };

  return (
    <img
      src="/brand/yamshat-logo.jpg"
      alt={alt}
      className={['brand-logo-img', className].filter(Boolean).join(' ')}
      style={mergedStyle}
      loading="eager"
      decoding="async"
    />
  );
}
