import { useEffect, useMemo, useRef, useState } from 'react';
import { optimizeImageUrl, optimizeVideoUrl } from '../../utils/media.js';

const VIDEO_RE = /\.(mp4|mov|webm|mkv)$/i;

export default function LazyMedia({ src, alt = 'media', className = '', poster = '', priority = false, style = {} }) {
  const hostRef = useRef(null);
  const [visible, setVisible] = useState(Boolean(priority));
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (visible || !hostRef.current || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: '350px 0px' });
    observer.observe(hostRef.current);
    return () => observer.disconnect();
  }, [visible]);

  const isVideo = VIDEO_RE.test(src);
  const optimizedSrc = useMemo(
    () => (isVideo ? optimizeVideoUrl(src, { width: 1280, quality: 80 }) : optimizeImageUrl(src, { width: priority ? 1600 : 1280, quality: 80 })),
    [isVideo, priority, src]
  );
  const optimizedPoster = useMemo(
    () => optimizeImageUrl(poster || '', { width: 960, quality: 78 }),
    [poster]
  );

  const shellStyle = {
    width: '100%',
    minHeight: 120,
    borderRadius: 20,
    overflow: 'hidden',
    background: 'rgba(255,255,255,0.04)',
    ...style,
  };

  const finalSrc = failed ? src : optimizedSrc || src;
  const finalPoster = optimizedPoster || poster || '';

  return (
    <div ref={hostRef} style={shellStyle} className={className}>
      {visible ? (
        isVideo ? (
          <video
            src={finalSrc}
            poster={finalPoster}
            controls
            playsInline
            preload={priority ? 'metadata' : 'none'}
            controlsList="nodownload noplaybackrate"
            style={{ width: '100%', display: 'block', borderRadius: 20 }}
            onError={() => setFailed(true)}
          />
        ) : (
          <img
            src={finalSrc}
            alt={alt}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            fetchPriority={priority ? 'high' : 'auto'}
            referrerPolicy="no-referrer"
            style={{ width: '100%', display: 'block', objectFit: 'cover', borderRadius: 20 }}
            onError={() => setFailed(true)}
          />
        )
      ) : (
        <div style={{ aspectRatio: '16 / 9', width: '100%', background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(139,92,246,0.14))' }} />
      )}
    </div>
  );
}
