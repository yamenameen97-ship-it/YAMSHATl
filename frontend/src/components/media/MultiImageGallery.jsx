import { useState, useCallback, useMemo, memo } from 'react';
import OptimizedImage from './OptimizedImage.jsx';
import ImageViewer from './ImageViewer.jsx';

/**
 * MultiImageGallery Component
 * 
 * معرض صور متقدم مع:
 * - عرض الصور المتعددة
 * - تخطيط ديناميكي
 * - معاينة سريعة
 * - عرض كامل الشاشة
 * - انتقالات سلسة
 */

const MultiImageGallery = memo(function MultiImageGallery({
  images = [],
  maxVisible = 4,
  onImageClick,
  enableViewer = true,
  layout = 'grid', // 'grid', 'masonry', 'carousel'
  spacing = 8,
  borderRadius = 8,
  showCount = true,
}) {
  const [showViewer, setShowViewer] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Calculate grid layout based on image count
  const gridLayout = useMemo(() => {
    const count = Math.min(images.length, maxVisible);
    if (count === 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-2';
    if (count === 3) return 'grid-cols-3';
    return 'grid-cols-2';
  }, [images.length, maxVisible]);

  // Handle image click
  const handleImageClick = useCallback((index) => {
    if (enableViewer) {
      setSelectedIndex(index);
      setShowViewer(true);
    }
    onImageClick?.(index, images[index]);
  }, [enableViewer, images, onImageClick]);

  if (images.length === 0) return null;

  const visibleImages = images.slice(0, maxVisible);
  const remainingCount = images.length - maxVisible;

  // Grid Layout
  if (layout === 'grid') {
    return (
      <>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(auto-fit, minmax(150px, 1fr))`,
            gap: spacing,
            marginTop: 12,
          }}
        >
          {visibleImages.map((image, idx) => (
            <div
              key={idx}
              onClick={() => handleImageClick(idx)}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{
                position: 'relative',
                borderRadius,
                overflow: 'hidden',
                cursor: 'pointer',
                aspectRatio: '1',
                background: '#000',
              }}
            >
              <OptimizedImage
                src={image}
                alt={`Gallery ${idx + 1}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transition: 'transform 0.3s ease',
                  transform: hoveredIndex === idx ? 'scale(1.1)' : 'scale(1)',
                }}
              />

              {/* Overlay on hover */}
              {hoveredIndex === idx && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: 'fadeIn 0.2s ease-out',
                  }}
                >
                  <span style={{ fontSize: 24, color: 'white' }}>🔍</span>
                </div>
              )}

              {/* Remaining count badge */}
              {idx === maxVisible - 1 && remainingCount > 0 && showCount && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: 18,
                    fontWeight: '600',
                  }}
                >
                  +{remainingCount}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Image Viewer */}
        {showViewer && enableViewer && (
          <ImageViewer
            images={images}
            initialIndex={selectedIndex}
            onClose={() => setShowViewer(false)}
            showThumbnails={true}
            enableZoom={true}
          />
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
        `}</style>
      </>
    );
  }

  // Masonry Layout
  if (layout === 'masonry') {
    return (
      <>
        <div
          style={{
            columnCount: Math.min(visibleImages.length, 3),
            columnGap: spacing,
            marginTop: 12,
          }}
        >
          {visibleImages.map((image, idx) => (
            <div
              key={idx}
              onClick={() => handleImageClick(idx)}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{
                position: 'relative',
                borderRadius,
                overflow: 'hidden',
                cursor: 'pointer',
                marginBottom: spacing,
                breakInside: 'avoid',
                background: '#000',
              }}
            >
              <OptimizedImage
                src={image}
                alt={`Gallery ${idx + 1}`}
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                  transition: 'transform 0.3s ease',
                  transform: hoveredIndex === idx ? 'scale(1.05)' : 'scale(1)',
                }}
              />

              {/* Overlay on hover */}
              {hoveredIndex === idx && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: 'fadeIn 0.2s ease-out',
                  }}
                >
                  <span style={{ fontSize: 24, color: 'white' }}>🔍</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Remaining count */}
        {remainingCount > 0 && showCount && (
          <div
            style={{
              marginTop: spacing,
              padding: 12,
              background: 'var(--bg-soft)',
              borderRadius,
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onClick={() => {
              setSelectedIndex(maxVisible);
              setShowViewer(true);
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--primary)';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--bg-soft)';
              e.currentTarget.style.color = 'var(--text)';
            }}
          >
            عرض {remainingCount} صورة أخرى
          </div>
        )}

        {/* Image Viewer */}
        {showViewer && enableViewer && (
          <ImageViewer
            images={images}
            initialIndex={selectedIndex}
            onClose={() => setShowViewer(false)}
            showThumbnails={true}
            enableZoom={true}
          />
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
        `}</style>
      </>
    );
  }

  // Carousel Layout
  if (layout === 'carousel') {
    return (
      <>
        <div
          style={{
            position: 'relative',
            borderRadius,
            overflow: 'hidden',
            background: '#000',
            marginTop: 12,
          }}
        >
          <OptimizedImage
            src={visibleImages[0]}
            alt="Carousel"
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
            }}
          />

          {/* Click to view all */}
          <button
            type="button"
            onClick={() => setShowViewer(true)}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0, 0, 0, 0)',
              border: 'none',
              cursor: 'pointer',
              transition: 'background 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0)';
            }}
          />

          {/* Image count badge */}
          {images.length > 1 && (
            <div
              style={{
                position: 'absolute',
                bottom: 12,
                right: 12,
                background: 'rgba(0, 0, 0, 0.6)',
                color: 'white',
                padding: '6px 12px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: '500',
                backdropFilter: 'blur(4px)',
              }}
            >
              1 / {images.length}
            </div>
          )}
        </div>

        {/* Thumbnail strip */}
        {images.length > 1 && (
          <div
            style={{
              display: 'flex',
              gap: spacing,
              marginTop: spacing,
              overflowX: 'auto',
              paddingBottom: 8,
            }}
          >
            {images.map((image, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setSelectedIndex(idx);
                  setShowViewer(true);
                }}
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 6,
                  border: '2px solid var(--line)',
                  background: 'var(--bg-soft)',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  flexShrink: 0,
                  transition: 'all 0.2s ease',
                  padding: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--line)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <OptimizedImage
                  src={image}
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

        {/* Image Viewer */}
        {showViewer && enableViewer && (
          <ImageViewer
            images={images}
            initialIndex={selectedIndex}
            onClose={() => setShowViewer(false)}
            showThumbnails={true}
            enableZoom={true}
          />
        )}
      </>
    );
  }

  return null;
});

MultiImageGallery.displayName = 'MultiImageGallery';

export default MultiImageGallery;

