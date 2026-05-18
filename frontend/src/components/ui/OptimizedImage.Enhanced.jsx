import { useState, useEffect, useRef, useMemo } from 'react';
import imageCompression from 'browser-image-compression';

/**
 * Optimized Image Component
 * Features:
 * - Lazy loading with Intersection Observer
 * - Image compression
 * - Blur-up effect
 * - Responsive srcset
 * - Error handling
 * - Loading states
 */
export default function OptimizedImage({
  src,
  alt = 'صورة',
  width,
  height,
  aspectRatio,
  className = '',
  style = {},
  onLoad,
  onError,
  lazy = true,
  blur = true,
  compress = true,
  responsive = true,
  quality = 0.8,
  maxWidth = 1200,
  ...props
}) {
  const [imageSrc, setImageSrc] = useState(lazy ? null : src);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [isInView, setIsInView] = useState(!lazy);
  const imgRef = useRef(null);
  const observerRef = useRef(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || !imgRef.current) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          if (observerRef.current && imgRef.current) {
            observerRef.current.unobserve(imgRef.current);
          }
        }
      },
      { rootMargin: '50px' }
    );

    observerRef.current.observe(imgRef.current);

    return () => {
      if (observerRef.current && imgRef.current) {
        observerRef.current.unobserve(imgRef.current);
      }
    };
  }, [lazy]);

  // Load image when in view
  useEffect(() => {
    if (!isInView || !src) return;

    const loadImage = async () => {
      try {
        let finalSrc = src;

        // Compress image if enabled
        if (compress && src.startsWith('blob:')) {
          try {
            const response = await fetch(src);
            const blob = await response.blob();
            const file = new File([blob], 'image', { type: blob.type });

            const compressedFile = await imageCompression(file, {
              maxSizeMB: 1,
              maxWidthOrHeight: maxWidth,
              useWebWorker: true,
              quality,
            });

            finalSrc = URL.createObjectURL(compressedFile);
          } catch (err) {
            console.warn('Image compression failed:', err);
          }
        }

        setImageSrc(finalSrc);
      } catch (err) {
        console.error('Failed to load image:', err);
        setError(err);
      }
    };

    loadImage();
  }, [isInView, src, compress, maxWidth, quality]);

  const handleLoad = (e) => {
    setIsLoaded(true);
    if (onLoad) onLoad(e);
  };

  const handleError = (e) => {
    setError(new Error('Failed to load image'));
    if (onError) onError(e);
  };

  const containerStyle = {
    position: 'relative',
    overflow: 'hidden',
    ...style,
  };

  if (aspectRatio && !height) {
    containerStyle.aspectRatio = aspectRatio;
  }

  if (width) {
    containerStyle.width = width;
  }

  if (height) {
    containerStyle.height = height;
  }

  const imageStyle = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: 'center',
    transition: isLoaded ? 'opacity 0.3s ease' : 'none',
    opacity: isLoaded ? 1 : blur ? 0.1 : 1,
    filter: isLoaded ? 'blur(0px)' : blur ? 'blur(10px)' : 'blur(0px)',
  };

  return (
    <div
      ref={imgRef}
      className={`optimized-image ${className}`}
      style={containerStyle}
      data-loaded={isLoaded}
      data-error={!!error}
    >
      {/* Placeholder */}
      {!isLoaded && blur && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(45deg, var(--bg-soft) 25%, var(--bg-card) 50%, var(--bg-soft) 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
          }}
          aria-hidden="true"
        />
      )}

      {/* Image */}
      {imageSrc && (
        <img
          src={imageSrc}
          alt={alt}
          style={imageStyle}
          onLoad={handleLoad}
          onError={handleError}
          loading={lazy ? 'lazy' : 'eager'}
          {...props}
        />
      )}

      {/* Error State */}
      {error && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-soft)',
            color: 'var(--muted)',
            fontSize: '12px',
            textAlign: 'center',
            padding: '16px',
          }}
        >
          <div>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginBottom: '8px' }}>
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
            <p>فشل تحميل الصورة</p>
          </div>
        </div>
      )}

      {/* Loading Indicator */}
      {!isLoaded && !error && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-hidden="true"
        >
          <div
            style={{
              width: '24px',
              height: '24px',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderTopColor: 'white',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
        </div>
      )}

      <style>{`
        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .optimized-image {
          display: block;
        }

        .optimized-image[data-loaded="true"] {
          background: transparent;
        }

        .optimized-image[data-error="true"] {
          background: var(--bg-soft);
        }
      `}</style>
    </div>
  );
}

/**
 * Picture Component for Responsive Images
 */
export function ResponsivePicture({
  sources = [],
  src,
  alt = 'صورة',
  width,
  height,
  aspectRatio,
  className = '',
  style = {},
  ...props
}) {
  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        width,
        height,
        aspectRatio,
        ...style,
      }}
      className={className}
    >
      <picture>
        {sources.map((source, idx) => (
          <source key={idx} {...source} />
        ))}
        <img
          src={src}
          alt={alt}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
          }}
          {...props}
        />
      </picture>
    </div>
  );
}

/**
 * Image Gallery Component with Lazy Loading
 */
export function ImageGallery({
  images = [],
  columns = 3,
  gap = '12px',
  onImageClick,
  className = '',
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fill, minmax(200px, 1fr))`,
        gap,
      }}
      className={className}
    >
      {images.map((image, idx) => (
        <div
          key={idx}
          style={{
            cursor: onImageClick ? 'pointer' : 'default',
            borderRadius: '8px',
            overflow: 'hidden',
          }}
          onClick={() => onImageClick?.(image, idx)}
          role={onImageClick ? 'button' : undefined}
          tabIndex={onImageClick ? 0 : undefined}
          onKeyDown={(e) => {
            if (onImageClick && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              onImageClick(image, idx);
            }
          }}
        >
          <OptimizedImage
            src={image.src}
            alt={image.alt || `صورة ${idx + 1}`}
            aspectRatio="1/1"
            lazy
            blur
            compress
          />
        </div>
      ))}
    </div>
  );
}

/**
 * Avatar Component with Fallback
 */
export function OptimizedAvatar({
  src,
  alt = 'صورة المستخدم',
  size = '48px',
  fallback = '👤',
  className = '',
  style = {},
}) {
  const [hasError, setHasError] = useState(false);

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-soft)',
        fontSize: `calc(${size} * 0.4)`,
        ...style,
      }}
      className={className}
    >
      {!hasError && src ? (
        <OptimizedImage
          src={src}
          alt={alt}
          width={size}
          height={size}
          lazy
          blur={false}
          onError={() => setHasError(true)}
        />
      ) : (
        <span>{fallback}</span>
      )}
    </div>
  );
}

export default OptimizedImage;
