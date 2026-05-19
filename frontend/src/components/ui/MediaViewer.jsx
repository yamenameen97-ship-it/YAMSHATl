import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { tokens } from '../../styles/designTokens';

/**
 * MediaViewer Component
 * A full-screen or modal viewer for images and videos
 */
const MediaViewer = ({ src, type = 'image', onClose, alt = 'Media content' }) => {
  const [isLoading, setIsLoading] = useState(true);

  if (!src) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backdropFilter: 'blur(8px)',
    }}>
      {/* Close Button */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: tokens.spacing.lg,
          right: tokens.spacing.lg,
          background: 'rgba(255, 255, 255, 0.2)',
          border: 'none',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          color: 'white',
          fontSize: '24px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
        }}
      >
        ✕
      </button>

      {isLoading && (
        <div style={{ color: 'white' }}>جاري التحميل...</div>
      )}

      <div style={{ maxWidth: '90%', maxHeight: '90%', position: 'relative' }}>
        {type === 'image' ? (
          <img
            src={src}
            alt={alt}
            onLoad={() => setIsLoading(false)}
            style={{
              maxWidth: '100%',
              maxHeight: '90vh',
              objectFit: 'contain',
              borderRadius: tokens.borderRadius.md,
              display: isLoading ? 'none' : 'block',
            }}
          />
        ) : (
          <video
            src={src}
            controls
            autoPlay
            onLoadedData={() => setIsLoading(false)}
            style={{
              maxWidth: '100%',
              maxHeight: '90vh',
              borderRadius: tokens.borderRadius.md,
              display: isLoading ? 'none' : 'block',
            }}
          />
        )}
      </div>
    </div>
  );
};

MediaViewer.propTypes = {
  src: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['image', 'video']),
  onClose: PropTypes.func.isRequired,
  alt: PropTypes.string,
};

export default MediaViewer;
