import { useEffect, useRef, useState } from 'react';

const VIDEO_RE = /\.(mp4|mov|webm|mkv)$/i;

export default function LazyMedia({ src, alt = 'media', className = '', poster = '', priority = false, style = {} }) {
  const hostRef = useRef(null);
  const [visible, setVisible] = useState(Boolean(priority));

  useEffect(() => {
    if (visible || !hostRef.current || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: '300px 0px' });
    observer.observe(hostRef.current);
    return () => observer.disconnect();
  }, [visible]);

  const shellStyle = {
    width: '100%',
    minHeight: 120,
    borderRadius: 20,
    overflow: 'hidden',
    background: 'rgba(255,255,255,0.04)',
    ...style,
  };

  return (
    <div ref={hostRef} style={shellStyle} className={className}>
      {visible ? (
        VIDEO_RE.test(src) ? (
          <video
            src={src}
            poster={poster || ''}
            controls
            playsInline
            preload={priority ? 'metadata' : 'none'}
            style={{ width: '100%', display: 'block', borderRadius: 20 }}
          />
        ) : (
          <img
            src={src}
            alt={alt}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            fetchPriority={priority ? 'high' : 'auto'}
            style={{ width: '100%', display: 'block', objectFit: 'cover', borderRadius: 20 }}
          />
        )
      ) : (
        <div style={{ aspectRatio: '16 / 9', width: '100%', background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(139,92,246,0.14))' }} />
      )}
    </div>
  );
}
