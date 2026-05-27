import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const loadedSources = new Set();
const failedSources = new Set();
const decodePromises = new Map();
let sharedObserver = null;
const observerCallbacks = new WeakMap();

function canUseDOM() {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

function getObserver() {
  if (!canUseDOM() || typeof IntersectionObserver === 'undefined') return null;
  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const callback = observerCallbacks.get(entry.target);
        if (entry.isIntersecting) {
          callback?.();
          sharedObserver?.unobserve(entry.target);
          observerCallbacks.delete(entry.target);
        }
      });
    }, { rootMargin: '280px 0px' });
  }
  return sharedObserver;
}

function normalizeSource(value = '') {
  return String(value || '').trim();
}

function appendQuery(url, params = {}) {
  const source = normalizeSource(url);
  if (!source || /^data:|^blob:/i.test(source)) return source;

  try {
    const base = canUseDOM() ? new URL(source, window.location.origin) : new URL(source);
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '' || base.searchParams.has(key)) return;
      base.searchParams.set(key, String(value));
    });
    return base.toString();
  } catch {
    return source;
  }
}

function buildSourceVariant(url, { width, quality, format } = {}) {
  const source = normalizeSource(url);
  if (!source || /^data:|^blob:/i.test(source)) return source;

  if (/res\.cloudinary\.com/i.test(source)) {
    const transforms = [format ? `f_${format}` : 'f_auto', quality ? `q_${quality}` : 'q_auto'];
    if (width) transforms.push(`w_${width}`);
    return source.replace('/upload/', `/upload/${transforms.join(',')}/`);
  }

  if (/imagekit\.io/i.test(source)) {
    const tr = [];
    if (width) tr.push(`w-${width}`);
    tr.push(`q-${quality || 80}`);
    tr.push(`f-${format || 'auto'}`);
    return appendQuery(source, { tr: tr.join(',') });
  }

  if (/\.(jpe?g|png|webp|avif)(\?.*)?$/i.test(source)) {
    return appendQuery(source, {
      ...(width ? { w: width } : {}),
      ...(quality ? { q: quality } : {}),
      ...(format ? { format } : {}),
    });
  }

  return source;
}

function getPlaceholder(alt = '') {
  return `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" role="img" aria-label="${alt}">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="rgba(148,163,184,0.16)" />
          <stop offset="100%" stop-color="rgba(71,85,105,0.26)" />
        </linearGradient>
      </defs>
      <rect width="800" height="600" fill="url(#g)" />
    </svg>
  `)}`;
}

function warmImage(src) {
  const target = normalizeSource(src);
  if (!canUseDOM() || !target || loadedSources.has(target) || failedSources.has(target)) return Promise.resolve(target);
  if (decodePromises.has(target)) return decodePromises.get(target);

  const promise = new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.src = target;
    image.onload = async () => {
      try {
        await image.decode?.();
      } catch {
        // ignore decode errors after successful load
      }
      loadedSources.add(target);
      decodePromises.delete(target);
      resolve(target);
    };
    image.onerror = () => {
      failedSources.add(target);
      decodePromises.delete(target);
      reject(new Error('image-load-failed'));
    };
  });

  decodePromises.set(target, promise);
  return promise;
}

export default function OptimizedImage({
  src,
  alt = '',
  width,
  height,
  className = '',
  style = {},
  onLoad,
  onError,
  priority = false,
  quality = 'auto',
  sizes = '100vw',
  retryCount = 2,
  blurPlaceholder = true,
  blurDataUrl = null,
  fit = 'cover',
  aspectRatio,
  showLoader = true,
  ...props
}) {
  const hostRef = useRef(null);
  const retriesRef = useRef(0);
  const [visible, setVisible] = useState(Boolean(priority));
  const [currentSrc, setCurrentSrc] = useState(() => (priority ? normalizeSource(src) : ''));
  const [loaded, setLoaded] = useState(() => loadedSources.has(normalizeSource(src)));
  const [failed, setFailed] = useState(() => failedSources.has(normalizeSource(src)));

  const normalizedSrc = useMemo(() => normalizeSource(src), [src]);

  const numericQuality = useMemo(() => {
    if (quality === 'low') return 50;
    if (quality === 'medium') return 68;
    if (quality === 'high') return 84;
    return 76;
  }, [quality]);

  const sourceSet = useMemo(() => {
    if (!normalizedSrc) return { avif: '', webp: '', fallback: '' };
    return {
      avif: buildSourceVariant(normalizedSrc, { width, quality: numericQuality, format: 'avif' }),
      webp: buildSourceVariant(normalizedSrc, { width, quality: numericQuality, format: 'webp' }),
      fallback: buildSourceVariant(normalizedSrc, { width, quality: numericQuality }),
    };
  }, [normalizedSrc, width, numericQuality]);

  const placeholder = blurDataUrl || getPlaceholder(alt || 'image');
  const ratio = aspectRatio || (width && height ? `${width} / ${height}` : undefined);

  useEffect(() => {
    setFailed(failedSources.has(normalizedSrc));
    setLoaded(loadedSources.has(normalizedSrc));
    if (priority) {
      setVisible(true);
      setCurrentSrc(normalizedSrc);
    } else {
      setVisible(false);
      setCurrentSrc('');
    }
    retriesRef.current = 0;
  }, [normalizedSrc, priority]);

  useEffect(() => {
    if (priority || visible || !hostRef.current) return undefined;
    const observer = getObserver();
    if (!observer) {
      setVisible(true);
      setCurrentSrc(normalizedSrc);
      return undefined;
    }

    const node = hostRef.current;
    observerCallbacks.set(node, () => {
      setVisible(true);
      setCurrentSrc(normalizedSrc);
    });
    observer.observe(node);

    return () => {
      observer.unobserve(node);
      observerCallbacks.delete(node);
    };
  }, [normalizedSrc, priority, visible]);

  useEffect(() => {
    if (!visible || !currentSrc) return undefined;
    let cancelled = false;

    warmImage(sourceSet.webp || sourceSet.fallback)
      .then(() => {
        if (cancelled) return;
        setLoaded(true);
        setFailed(false);
        onLoad?.();
      })
      .catch(() => {
        if (cancelled) return;
      });

    return () => {
      cancelled = true;
    };
  }, [currentSrc, onLoad, sourceSet.fallback, sourceSet.webp, visible]);

  const handleNativeLoad = useCallback(() => {
    loadedSources.add(normalizedSrc);
    setLoaded(true);
    setFailed(false);
    onLoad?.();
  }, [normalizedSrc, onLoad]);

  const handleNativeError = useCallback(() => {
    if (retriesRef.current < retryCount) {
      retriesRef.current += 1;
      const separator = normalizedSrc.includes('?') ? '&' : '?';
      setCurrentSrc(`${normalizedSrc}${separator}retry=${Date.now()}`);
      return;
    }
    failedSources.add(normalizedSrc);
    setFailed(true);
    onError?.();
  }, [normalizedSrc, onError, retryCount]);

  return (
    <span
      ref={hostRef}
      className={`yam-optimized-image-shell ${loaded ? 'is-loaded' : ''} ${failed ? 'has-error' : ''} ${className}`.trim()}
      style={{
        ...style,
        aspectRatio: ratio,
        position: 'relative',
        display: 'block',
        overflow: 'hidden',
        background: 'rgba(148,163,184,0.08)',
      }}
    >
      {!visible ? (
        <img
          src={placeholder}
          alt=""
          aria-hidden="true"
          className="yam-optimized-image placeholder"
          style={{ width: '100%', height: '100%', objectFit: fit }}
        />
      ) : (
        <picture>
          {sourceSet.avif ? <source srcSet={sourceSet.avif} sizes={sizes} type="image/avif" /> : null}
          {sourceSet.webp ? <source srcSet={sourceSet.webp} sizes={sizes} type="image/webp" /> : null}
          <img
            src={currentSrc || sourceSet.fallback || normalizedSrc || placeholder}
            alt={alt}
            width={width}
            height={height}
            className="yam-optimized-image"
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            fetchPriority={priority ? 'high' : 'auto'}
            onLoad={handleNativeLoad}
            onError={handleNativeError}
            style={{
              width: '100%',
              height: '100%',
              objectFit: fit,
              opacity: loaded ? 1 : 0.01,
              transform: loaded ? 'scale(1)' : 'scale(1.03)',
            }}
            {...props}
          />
        </picture>
      )}

      {showLoader && !loaded && !failed ? (
        <span className="yam-optimized-image-loader" aria-hidden="true">
          <span className="yam-optimized-image-shimmer" />
        </span>
      ) : null}

      {failed ? (
        <span className="yam-optimized-image-fallback" role="status" aria-live="polite">
          <span>تعذر تحميل الصورة</span>
        </span>
      ) : null}

      {blurPlaceholder && !loaded && !failed ? (
        <img
          src={placeholder}
          alt=""
          aria-hidden="true"
          className="yam-optimized-image-blur"
          style={{ width: '100%', height: '100%', objectFit: fit }}
        />
      ) : null}

      <style>{`
        .yam-optimized-image-shell {
          isolation: isolate;
          border-radius: inherit;
          max-width: 100%;
          contain: layout paint style;
        }

        .yam-optimized-image-shell picture {
          display: block;
          width: 100%;
          height: 100%;
        }

        .yam-optimized-image,
        .yam-optimized-image-blur {
          display: block;
          border-radius: inherit;
          transition: opacity 240ms var(--ease-standard, ease), transform 260ms var(--ease-standard, ease), filter 260ms var(--ease-standard, ease);
        }

        .yam-optimized-image-blur {
          position: absolute;
          inset: 0;
          z-index: 0;
          filter: blur(18px) saturate(0.9);
          opacity: 0.92;
          transform: scale(1.06);
        }

        .yam-optimized-image-shell.is-loaded .yam-optimized-image-blur {
          opacity: 0;
        }

        .yam-optimized-image-loader {
          position: absolute;
          inset: 0;
          z-index: 1;
          overflow: hidden;
          background: linear-gradient(135deg, rgba(148,163,184,0.1), rgba(71,85,105,0.14));
        }

        .yam-optimized-image-shimmer {
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent);
          transform: translateX(-100%);
          animation: yamImageShimmer 1.3s linear infinite;
        }

        .yam-optimized-image-shell.is-loaded .yam-optimized-image-loader {
          opacity: 0;
          pointer-events: none;
          transition: opacity 180ms ease;
        }

        .yam-optimized-image-fallback {
          position: absolute;
          inset: 0;
          z-index: 2;
          display: grid;
          place-items: center;
          padding: 12px;
          text-align: center;
          font-size: 12px;
          color: var(--text-soft, #cbd5e1);
          background: linear-gradient(180deg, rgba(15,23,42,0.72), rgba(15,23,42,0.88));
        }

        @keyframes yamImageShimmer {
          100% {
            transform: translateX(100%);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .yam-optimized-image,
          .yam-optimized-image-blur,
          .yam-optimized-image-loader {
            transition: none;
          }

          .yam-optimized-image-shimmer {
            animation: none;
          }
        }
      `}</style>
    </span>
  );
}
