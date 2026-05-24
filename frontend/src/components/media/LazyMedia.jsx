import { useEffect, useMemo, useRef, useState } from 'react';
import { optimizeImageUrl, optimizeVideoUrl } from '../../utils/media.js';

const VIDEO_RE = /\.(mp4|mov|webm|mkv)$/i;

function fallbackBlur(seed = '') {
  const palette = ['7c3aed', '2563eb', 'db2777', '0f766e', 'ea580c'];
  const index = Math.abs(String(seed).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % palette.length;
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 240'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop stop-color='%23${palette[index]}' stop-opacity='.48'/%3E%3Cstop offset='1' stop-color='%230f172a' stop-opacity='.9'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='400' height='240' fill='url(%23g)'/%3E%3C/svg%3E`;
}

export default function LazyMedia({ src, alt = 'media', className = '', poster = '', blurDataUrl = '', priority = false, style = {} }) {
  const hostRef = useRef(null);
  const [visible, setVisible] = useState(Boolean(priority));
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(Boolean(priority));

  useEffect(() => {
    if (visible || !hostRef.current || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: '320px 0px' });
    observer.observe(hostRef.current);
    return () => observer.disconnect();
  }, [visible]);

  useEffect(() => {
    setLoaded(Boolean(priority));
    setFailed(false);
  }, [priority, src, poster]);

  const isVideo = VIDEO_RE.test(src);
  const optimizedSrc = useMemo(
    () => (isVideo ? optimizeVideoUrl(src, { width: 1280, quality: 80 }) : optimizeImageUrl(src, { width: priority ? 1600 : 1280, quality: 80 })),
    [isVideo, priority, src],
  );
  const optimizedPoster = useMemo(() => optimizeImageUrl(poster || '', { width: 960, quality: 78 }), [poster]);

  const shellStyle = {
    width: '100%',
    minHeight: 120,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    background: 'rgba(255,255,255,0.04)',
    ...style,
  };

  const finalSrc = failed ? src : optimizedSrc || src;
  const finalPoster = optimizedPoster || poster || '';
  const placeholder = blurDataUrl || finalPoster || fallbackBlur(src || alt);

  return (
    <div ref={hostRef} style={shellStyle} className={className}>
      {!loaded ? (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${placeholder})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(18px) saturate(1.15)',
            transform: 'scale(1.06)',
            transition: 'opacity 220ms ease',
          }}
        />
      ) : null}

      {visible ? (
        isVideo ? (
          <video
            src={finalSrc}
            poster={placeholder}
            controls
            playsInline
            preload={priority ? 'metadata' : 'none'}
            controlsList="nodownload noplaybackrate"
            style={{ width: '100%', display: 'block', borderRadius: 20, opacity: loaded ? 1 : 0.01, transition: 'opacity 220ms ease' }}
            onLoadedData={() => setLoaded(true)}
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
            style={{ width: '100%', display: 'block', objectFit: 'cover', borderRadius: 20, opacity: loaded ? 1 : 0.01, transition: 'opacity 220ms ease' }}
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
          />
        )
      ) : (
        <div style={{ aspectRatio: '16 / 9', width: '100%', backgroundImage: `url(${placeholder})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(18px)', transform: 'scale(1.03)' }} />
      )}
    </div>
  );
}
