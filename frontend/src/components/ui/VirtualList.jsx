import React, { useRef, useState, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * VirtualList Component
 * Renders only the visible items in a long list for better performance
 */
const VirtualList = ({ 
  items, 
  itemHeight, 
  renderItem, 
  containerHeight = '500px',
  buffer = 5 
}) => {
  const containerRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);

  const handleScroll = (e) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  const totalHeight = items.length * itemHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - buffer);
  const endIndex = Math.min(
    items.length - 1,
    Math.floor((scrollTop + parseInt(containerHeight)) / itemHeight) + buffer
  );

  const visibleItems = items.slice(startIndex, endIndex + 1).map((item, index) => {
    const actualIndex = startIndex + index;
    return (
      <div
        key={actualIndex}
        style={{
          position: 'absolute',
          top: actualIndex * itemHeight,
          width: '100%',
          height: itemHeight,
        }}
      >
        {renderItem(item, actualIndex)}
      </div>
    );
  });

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{
        height: containerHeight,
        overflowY: 'auto',
        position: 'relative',
      }}
    >
      <div style={{ height: totalHeight, width: '100%' }}>
        {visibleItems}
      </div>
    </div>
  );
};

VirtualList.propTypes = {
  items: PropTypes.array.isRequired,
  itemHeight: PropTypes.number.isRequired,
  renderItem: PropTypes.func.isRequired,
  containerHeight: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  buffer: PropTypes.number,
};

export default VirtualList;
