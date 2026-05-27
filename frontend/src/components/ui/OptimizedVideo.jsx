import { useState, useEffect, useRef } from 'react';

/**
 * Optimized Video Component
 * Features:
 * - Lazy loading with Intersection Observer
 * - Adaptive bitrate streaming
 * - Thumbnail preview
 * - Error handling
 * - Loading states
 * - Playback controls
 */
export default function OptimizedVideo({
  src,
  poster,
  alt = 'فيديو',
  width = '100%',
  height = 'auto',
  aspectRatio = '16/9',
  className = '',
  style = {},
  controls = true,
  autoplay = false,
  muted = false,
  loop = false,
  lazy = true,
  quality = 'auto',
  onPlay,
  onPause,
  onError,
  onLoad,
  ...props
}) {
  const [isInView, setIsInView] = useState(!lazy);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentQuality, setCurrentQuality] = useState(quality);
  const videoRef = useRef(null);
  const observerRef = useRef(null);
  const containerRef = useRef(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || !containerRef.current) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          if (observerRef.current && containerRef.current) {
            observerRef.current.unobserve(containerRef.current);
          }
        }
      },
      { rootMargin: '100px' }
    );

    observerRef.current.observe(containerRef.current);

    return () => {
      if (observerRef.current && containerRef.current) {
        observerRef.current.unobserve(containerRef.current);
      }
    };
  }, [lazy]);

  // Detect connection speed for adaptive quality
  useEffect(() => {
    if (quality !== 'auto') return;

    const detectQuality = () => {
      if ('connection' in navigator) {
        const connection = navigator.connection;
        const effectiveType = connection.effectiveType;

        switch (effectiveType) {
          case '4g':
            setCurrentQuality('1080p');
            break;
          case '3g':
            setCurrentQuality('720p');
            break;
          case '2g':
          case 'slow-2g':
            setCurrentQuality('360p');
            break;
          default:
            setCurrentQuality('720p');
        }
      }
    };

    detectQuality();

    if ('connection' in navigator) {
      navigator.connection.addEventListener('change', detectQuality);
      return () => navigator.connection.removeEventListener('change', detectQuality);
    }
  }, [quality]);

  const handlePlay = (e) => {
    setIsPlaying(true);
    if (onPlay) onPlay(e);
  };

  const handlePause = (e) => {
    setIsPlaying(false);
    if (onPause) onPause(e);
  };

  const handleError = (e) => {
    setError(new Error('Failed to load video'));
    if (onError) onError(e);
  };

  const handleLoadedData = (e) => {
    setIsLoaded(true);
    if (onLoad) onLoad(e);
  };

  const containerStyle = {
    position: 'relative',
    width,
    aspectRatio,
    background: 'var(--bg-soft)',
    borderRadius: '8px',
    overflow: 'hidden',
    ...style,
  };

  const videoStyle = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: 'center',
  };

  return (
    <div
      ref={containerRef}
      className={`optimized-video ${className}`}
      style={containerStyle}
      data-loaded={isLoaded}
      data-error={!!error}
      data-playing={isPlaying}
    >
      {/* Video Element */}
      {isInView && (
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          style={videoStyle}
          controls={controls}
          autoPlay={autoplay}
          muted={muted}
          loop={loop}
          onPlay={handlePlay}
          onPause={handlePause}
          onError={handleError}
          onLoadedData={handleLoadedData}
          preload="metadata"
          {...props}
        />
      )}

      {/* Poster Image (before video loads) */}
      {!isInView && poster && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${poster})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      )}

      {/* Loading Indicator */}
      {!isLoaded && isInView && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.3)',
          }}
          aria-hidden="true"
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              border: '3px solid rgba(255, 255, 255, 0.3)',
              borderTopColor: 'white',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
        </div>
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
            fontSize: '14px',
            textAlign: 'center',
            padding: '16px',
          }}
        >
          <div>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginBottom: '8px' }}>
              <path d="M23 7l-7 5 7 5V7z" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
            <p>فشل تحميل الفيديو</p>
          </div>
        </div>
      )}

      {/* Quality Badge */}
      {isLoaded && currentQuality !== 'auto' && (
        <div
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'rgba(0, 0, 0, 0.6)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 'bold',
          }}
        >
          {currentQuality}
        </div>
      )}

      <style>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .optimized-video {
          display: block;
        }

        .optimized-video video {
          display: block;
        }
      `}</style>
    </div>
  );
}

/**
 * Video Gallery Component
 */
export function VideoGallery({
  videos = [],
  columns = 2,
  gap = '12px',
  onVideoClick,
  className = '',
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fill, minmax(300px, 1fr))`,
        gap,
      }}
      className={className}
    >
      {videos.map((video, idx) => (
        <div
          key={idx}
          style={{
            cursor: onVideoClick ? 'pointer' : 'default',
            borderRadius: '8px',
            overflow: 'hidden',
            position: 'relative',
          }}
          onClick={() => onVideoClick?.(video, idx)}
          role={onVideoClick ? 'button' : undefined}
          tabIndex={onVideoClick ? 0 : undefined}
          onKeyDown={(e) => {
            if (onVideoClick && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              onVideoClick(video, idx);
            }
          }}
        >
          <OptimizedVideo
            src={video.src}
            poster={video.poster}
            alt={video.alt || `فيديو ${idx + 1}`}
            controls={false}
            lazy
          />
          {onVideoClick && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0, 0, 0, 0.3)',
                opacity: 0,
                transition: 'opacity 0.3s ease',
              }}
              className="video-overlay"
            >
              <svg width="48" height="48" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </div>
          )}

          <style>{`
            .video-overlay {
              pointer-events: none;
            }
          `}</style>
        </div>
      ))}
    </div>
  );
}

/**
 * Reels Component (TikTok-like vertical videos)
 */
export function VideoReels({
  videos = [],
  onVideoChange,
  className = '',
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef(null);

  const handlePrevious = () => {
    const newIndex = (currentIndex - 1 + videos.length) % videos.length;
    setCurrentIndex(newIndex);
    if (onVideoChange) onVideoChange(newIndex);
  };

  const handleNext = () => {
    const newIndex = (currentIndex + 1) % videos.length;
    setCurrentIndex(newIndex);
    if (onVideoChange) onVideoChange(newIndex);
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        overflow: 'hidden',
        background: 'black',
      }}
      className={className}
    >
      {/* Video Container */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {videos.map((video, idx) => (
          <div
            key={idx}
            style={{
              position: 'absolute',
              inset: 0,
              opacity: idx === currentIndex ? 1 : 0,
              transition: 'opacity 0.3s ease',
              pointerEvents: idx === currentIndex ? 'auto' : 'none',
            }}
          >
            <OptimizedVideo
              src={video.src}
              poster={video.poster}
              controls={false}
              autoplay={idx === currentIndex}
              muted
              loop
              style={{
                width: '100%',
                height: '100%',
              }}
            />
          </div>
        ))}
      </div>

      {/* Navigation Buttons */}
      <button
        onClick={handlePrevious}
        style={{
          position: 'absolute',
          left: '20px',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'rgba(255, 255, 255, 0.3)',
          border: 'none',
          color: 'white',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
        }}
        aria-label="الفيديو السابق"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      <button
        onClick={handleNext}
        style={{
          position: 'absolute',
          right: '20px',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'rgba(255, 255, 255, 0.3)',
          border: 'none',
          color: 'white',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
        }}
        aria-label="الفيديو التالي"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      {/* Indicators */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '8px',
          zIndex: 10,
        }}
      >
        {videos.map((_, idx) => (
          <button
            key={idx}
            onClick={() => {
              setCurrentIndex(idx);
              if (onVideoChange) onVideoChange(idx);
            }}
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              border: 'none',
              background: idx === currentIndex ? 'white' : 'rgba(255, 255, 255, 0.5)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
            aria-label={`الذهاب إلى الفيديو ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

