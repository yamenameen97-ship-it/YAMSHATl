import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * OptimizedImage Component
 * 
 * تحسين الصور مع:
 * - WebP format support مع fallback
 * - Lazy loading باستخدام Intersection Observer
 * - Responsive images مع srcset
 * - Progressive loading مع placeholder
 * - Error handling و retry logic
 */
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
  retryCount = 3,
  ...props
}) {
  const [imageSrc, setImageSrc] = useState(priority ? src : null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [retries, setRetries] = useState(0);
  const imgRef = useRef(null);
  const observerRef = useRef(null);

  // Generate WebP version of image URL
  const getWebPUrl = useCallback((imageUrl) => {
    if (!imageUrl) return null;
    
    // If already WebP, return as is
    if (imageUrl.includes('.webp')) return imageUrl;
    
    // For CDN URLs, append WebP format parameter
    if (imageUrl.includes('cloudinary.com') || imageUrl.includes('imgix.net')) {
      const separator = imageUrl.includes('?') ? '&' : '?';
      return `${imageUrl}${separator}f=webp`;
    }
    
    // For local images, replace extension
    return imageUrl.replace(/\.(jpg|jpeg|png)$/i, '.webp');
  }, []);

  // Generate responsive srcset
  const generateSrcSet = useCallback((baseUrl) => {
    if (!baseUrl) return '';
    
    const sizes = [320, 640, 1024, 1280, 1920];
    return sizes
      .map(size => {
        const url = baseUrl.includes('?')
          ? `${baseUrl}&w=${size}`
          : `${baseUrl}?w=${size}`;
        return `${url} ${size}w`;
      })
      .join(', ');
  }, []);

  // Setup Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || !imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setImageSrc(src);
          observer.unobserve(entry.target);
        }
      },
      {
        rootMargin: '50px', // Start loading 50px before entering viewport
      }
    );

    observer.observe(imgRef.current);
    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [src, priority]);

  // Handle image load
  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    setError(null);
    setRetries(0);
    onLoad?.();
  }, [onLoad]);

  // Handle image error with retry
  const handleError = useCallback(() => {
    if (retries < retryCount) {
      // Retry with a delay
      setTimeout(() => {
        setRetries(prev => prev + 1);
        // Force reload by adding timestamp
        const separator = src.includes('?') ? '&' : '?';
        setImageSrc(`${src}${separator}t=${Date.now()}`);
      }, 1000 * (retries + 1));
    } else {
      setError(true);
      onError?.();
    }
  }, [src, retries, retryCount, onError]);

  const webpSrc = getWebPUrl(imageSrc);
  const srcSet = generateSrcSet(imageSrc);
  const webpSrcSet = generateSrcSet(webpSrc);

  return (
    <picture ref={imgRef} style={{ display: 'block', ...style }}>
      {/* WebP format for modern browsers */}
      {imageSrc && webpSrc && (
        <source
          srcSet={webpSrcSet}
          sizes={sizes}
          type="image/webp"
        />
      )}

      {/* Fallback formats */}
      {imageSrc && (
        <source
          srcSet={srcSet}
          sizes={sizes}
          type={imageSrc.includes('.png') ? 'image/png' : 'image/jpeg'}
        />
      )}

      {/* Main image element */}
      <img
        ref={imgRef}
        src={imageSrc}
        alt={alt}
        width={width}
        height={height}
        className={`optimized-image ${isLoaded ? 'loaded' : 'loading'} ${error ? 'error' : ''} ${className}`}
        style={{
          opacity: isLoaded ? 1 : 0.7,
          transition: 'opacity 0.3s ease-in-out',
          backgroundColor: error ? '#f0f0f0' : 'transparent',
          ...style,
        }}
        onLoad={handleLoad}
        onError={handleError}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        {...props}
      />

      {/* Error fallback */}
      {error && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f0f0f0',
            color: '#999',
            fontSize: '12px',
            textAlign: 'center',
            padding: '8px',
          }}
        >
          ❌ فشل تحميل الصورة
        </div>
      )}

      <style>{`
        picture {
          display: block;
          overflow: hidden;
        }

        .optimized-image {
          display: block;
          width: 100%;
          height: auto;
          object-fit: cover;
        }

        .optimized-image.loading {
          background: linear-gradient(
            90deg,
            rgba(200, 200, 200, 0.2) 25%,
            rgba(200, 200, 200, 0.3) 50%,
            rgba(200, 200, 200, 0.2) 75%
          );
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }

        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .optimized-image.loaded {
          animation: fadeIn 0.3s ease-in-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </picture>
  );
}
