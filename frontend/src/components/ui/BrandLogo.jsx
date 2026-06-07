// ✅ FIX: معالجة فشل تحميل صورة الشعار بصمت (إظهار سداد بدل الصورة المكسورة)
import { useState } from 'react';

export default function BrandLogo({
  size = 48,
  alt = 'Yamshat logo',
  className = '',
  style = {},
  shadow = true,
}) {
  const [failed, setFailed] = useState(false);

  const mergedStyle = {
    width: size,
    height: size,
    objectFit: 'contain',
    display: 'block',
    filter: shadow ? 'drop-shadow(0 14px 28px rgba(124, 58, 237, 0.28))' : 'none',
    ...style,
  };

  // صورة بديلة عند الفشل: سدادة بنفسجية فيها حرف Y
  if (failed) {
    return (
      <div
        className={['brand-logo-fallback', className].filter(Boolean).join(' ')}
        style={{
          ...mergedStyle,
          borderRadius: size / 4,
          background: 'linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontWeight: 900,
          fontSize: size / 2,
          fontFamily: 'system-ui, sans-serif',
        }}
        aria-label={alt}
      >
        Y
      </div>
    );
  }

  return (
    <img
      src="/brand/yamshat-logo.jpg"
      alt={alt}
      className={['brand-logo-img', className].filter(Boolean).join(' ')}
      style={mergedStyle}
      loading="eager"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
