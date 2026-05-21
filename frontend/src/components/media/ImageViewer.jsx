import { useState, useCallback, useEffect, useRef, memo } from 'react';
import OptimizedImage from './OptimizedImage.jsx';

/**
 * ImageViewer Component
 * 
 * عارض صور متقدم مع:
 * - Smooth transitions
 * - Zoom functionality
 * - Touch gestures (pinch to zoom)
 * - Keyboard navigation
 * - Responsive design
 * - Loading states
 */
const ImageViewer = memo(function ImageViewer({ 
  images = [], 
  initialIndex = 0, 
  onClose,
  showThumbnails = true,
  enableZoom = true,
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [touchStart, setTouchStart] = useState(null);
  const [touchDistance, setTouchDistance] = useState(0);
  const containerRef = useRef(null);
  const imageRef = useRef(null);

  const currentImage = images[currentIndex];

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'ArrowLeft':
          handlePrevious();
          break;
        case 'ArrowRight':
          handleNext();
          break;
        case 'Escape':
          onClose?.();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex]);

  // Handle navigation
  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
    setZoom(1);
  }, [images.length]);

  const handlePrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    setZoom(1);
  }, [images.length]);

  // Handle zoom
  const handleZoom = useCallback((direction) => {
    if (!enableZoom) return;
    setZoom((prev) => {
      const newZoom = direction === 'in' ? prev + 0.2 : prev - 0.2;
      return Math.max(1, Math.min(3, newZoom));
    });
  }, [enableZoom]);

  // Handle touch events for pinch zoom
  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      setTouchStart(distance);
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (e.touches.length === 2 && touchStart) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      setTouchDistance(distance);
    }
  }, [touchStart]);

  const handleTouchEnd = useCallback(() => {
    if (touchStart && touchDistance) {
      const scale = touchDistance / touchStart;
      if (scale > 1.1) {
        handleZoom('in');
      } else if (scale < 0.9) {
        handleZoom('out');
      }
    }
    setTouchStart(null);
    setTouchDistance(0);
  }, [touchStart, touchDistance, handleZoom]);

  // Handle mouse wheel zoom
  const handleWheel = useCallback((e) => {
    if (!enableZoom) return;
    e.preventDefault();
    handleZoom(e.deltaY < 0 ? 'in' : 'out');
  }, [enableZoom, handleZoom]);

  if (!currentImage) return null;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.95)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        animation: 'fadeIn 0.3s ease-in-out',
      }}
      onClick={(e) => e.target === containerRef.current && onClose?.()}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
    >
      {/* Main Image */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <div
          ref={imageRef}
          style={{
            transform: `scale(${zoom})`,
            transition: 'transform 0.3s ease-out',
            cursor: enableZoom ? 'zoom-in' : 'default',
            maxWidth: '90%',
            maxHeight: '90%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => enableZoom && handleZoom('in')}
        >
          {typeof currentImage === 'string' ? (
            <OptimizedImage
              src={currentImage}
              alt="Viewer"
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
              }}
              onLoad={() => setIsLoading(false)}
              priority={true}
            />
          ) : (
            <img
              src={currentImage.src || currentImage}
              alt={currentImage.alt || 'Viewer'}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
              }}
              onLoad={() => setIsLoading(false)}
            />
          )}
        </div>

        {/* Loading indicator */}
        {isLoading && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 40,
              height: 40,
              border: '3px solid rgba(255,255,255,0.2)',
              borderTopColor: 'white',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          />
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            color: 'white',
            width: 40,
            height: 40,
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            transition: 'all 0.2s ease',
            backdropFilter: 'blur(4px)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          ✕
        </button>

        {/* Navigation arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrevious}
              style={{
                position: 'absolute',
                left: 20,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: 'white',
                width: 40,
                height: 40,
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                transition: 'all 0.2s ease',
                backdropFilter: 'blur(4px)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
              }}
            >
              ←
            </button>
            <button
              onClick={handleNext}
              style={{
                position: 'absolute',
                right: 20,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: 'white',
                width: 40,
                height: 40,
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                transition: 'all 0.2s ease',
                backdropFilter: 'blur(4px)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
              }}
            >
              →
            </button>
          </>
        )}

        {/* Zoom controls */}
        {enableZoom && (
          <div
            style={{
              position: 'absolute',
              bottom: 20,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: 10,
              background: 'rgba(0,0,0,0.5)',
              padding: '10px 15px',
              borderRadius: 20,
              backdropFilter: 'blur(4px)',
            }}
          >
            <button
              onClick={() => handleZoom('out')}
              disabled={zoom <= 1}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: 'white',
                width: 32,
                height: 32,
                borderRadius: '50%',
                cursor: zoom <= 1 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
                opacity: zoom <= 1 ? 0.5 : 1,
                transition: 'all 0.2s ease',
              }}
            >
              −
            </button>
            <div style={{ color: 'white', display: 'flex', alignItems: 'center', padding: '0 10px', fontSize: 12 }}>
              {Math.round(zoom * 100)}%
            </div>
            <button
              onClick={() => handleZoom('in')}
              disabled={zoom >= 3}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: 'white',
                width: 32,
                height: 32,
                borderRadius: '50%',
                cursor: zoom >= 3 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
                opacity: zoom >= 3 ? 0.5 : 1,
                transition: 'all 0.2s ease',
              }}
            >
              +
            </button>
          </div>
        )}

        {/* Image counter */}
        {images.length > 1 && (
          <div
            style={{
              position: 'absolute',
              top: 20,
              left: 20,
              background: 'rgba(0,0,0,0.5)',
              color: 'white',
              padding: '8px 12px',
              borderRadius: 20,
              fontSize: 12,
              backdropFilter: 'blur(4px)',
            }}
          >
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {showThumbnails && images.length > 1 && (
        <div
          style={{
            position: 'absolute',
            bottom: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: 8,
            maxWidth: '80%',
            overflowX: 'auto',
            padding: '10px',
            background: 'rgba(0,0,0,0.5)',
            borderRadius: 12,
            backdropFilter: 'blur(4px)',
          }}
        >
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentIndex(idx);
                setZoom(1);
              }}
              style={{
                width: 60,
                height: 60,
                borderRadius: 8,
                border: currentIndex === idx ? '2px solid white' : '1px solid rgba(255,255,255,0.3)',
                background: 'rgba(0,0,0,0.3)',
                cursor: 'pointer',
                overflow: 'hidden',
                flexShrink: 0,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <img
                src={typeof img === 'string' ? img : img.src || img}
                alt={`Thumbnail ${idx + 1}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </button>
          ))}
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
});

ImageViewer.displayName = 'ImageViewer';

export default ImageViewer;
