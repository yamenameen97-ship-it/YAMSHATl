import React, { useState, useEffect, useRef } from 'react';
import { resolveMediaUrl } from '../../config/mediaConfig.js';

const TRANSPARENT_PIXEL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

// Placeholder local quand l'image distante 404 (anciens uploads sur yamshat8.onrender.com)
const FALLBACK_SVG = "data:image/svg+xml;utf8," + encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'><rect width='80' height='80' fill='%23222'/><path d='M20 56l14-18 10 12 6-8 12 14H20z' fill='%23555'/><circle cx='30' cy='28' r='5' fill='%23555'/></svg>`
);

export default function OptimizedImage({
  src,
  alt,
  className,
  style,
  placeholder = TRANSPARENT_PIXEL,
  fallback = FALLBACK_SVG,
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(placeholder);
  const [hasErrored, setHasErrored] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => () => { mountedRef.current = false; }, []);

  useEffect(() => {
    setIsLoaded(false);
    setHasErrored(false);
    const resolved = resolveMediaUrl(src);
    if (!resolved) {
      setCurrentSrc(fallback);
      return undefined;
    }

    const img = new Image();
    img.src = resolved;
    img.onload = () => {
      if (!mountedRef.current) return;
      setCurrentSrc(resolved);
      setIsLoaded(true);
    };
    img.onerror = () => {
      if (!mountedRef.current) return;
      // 404 silencieux : on bascule sur le placeholder local sans polluer la console.
      setCurrentSrc(fallback);
      setIsLoaded(true);
      setHasErrored(true);
    };
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src, fallback]);

  return (
    <div
      className={`image-container ${className || ''}`}
      style={{
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#222',
        ...style,
      }}
    >
      <img
        src={currentSrc}
        alt={alt}
        loading="lazy"
        onError={(event) => {
          if (event.currentTarget.src !== fallback) {
            event.currentTarget.src = fallback;
          }
        }}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          filter: isLoaded || hasErrored ? 'none' : 'blur(10px)',
          transition: 'filter 0.3s ease-in-out',
          opacity: isLoaded || hasErrored ? 1 : 0.7,
        }}
      />
    </div>
  );
}
