import React, { useState, useEffect } from 'react';

export default function OptimizedImage({ src, alt, className, style, placeholder = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==' }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(placeholder);

  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      setCurrentSrc(src);
      setIsLoaded(true);
    };
  }, [src]);

  return (
    <div 
      className={`image-container ${className}`} 
      style={{ 
        position: 'relative', 
        overflow: 'hidden',
        backgroundColor: '#222',
        ...style 
      }}
    >
      <img
        src={currentSrc}
        alt={alt}
        loading="lazy"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          filter: isLoaded ? 'none' : 'blur(10px)',
          transition: 'filter 0.3s ease-in-out',
          opacity: isLoaded ? 1 : 0.7
        }}
      />
    </div>
  );
}
