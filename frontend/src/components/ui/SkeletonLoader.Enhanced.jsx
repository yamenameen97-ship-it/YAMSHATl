/**
 * Enhanced Skeleton Loading Components
 * 
 * مكونات تحميل هيكلية محسّنة مع:
 * - Shimmer animation
 * - Multiple variants
 * - Customizable shapes
 * - Responsive design
 * - Accessibility
 */

export function SkeletonLoader({
  width = '100%',
  height = '20px',
  borderRadius = '4px',
  className = '',
  style = {},
  variant = 'default',
  animated = true,
}) {
  const variantStyles = {
    default: {
      background: 'var(--bg-soft)',
    },
    pulse: {
      background: 'var(--bg-soft)',
      animation: animated ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none',
    },
    wave: {
      background: 'linear-gradient(90deg, var(--bg-soft) 25%, var(--bg-card) 50%, var(--bg-soft) 75%)',
      backgroundSize: '200% 100%',
      animation: animated ? 'wave 1.5s infinite' : 'none',
    },
  };

  return (
    <div
      className={`skeleton-loader skeleton-${variant} ${className}`}
      style={{
        width,
        height,
        borderRadius,
        ...variantStyles[variant],
        ...style,
      }}
      aria-busy="true"
      aria-label="جاري التحميل"
    />
  );
}

export function SkeletonCard() {
  return (
    <div style={{
      padding: '16px',
      background: 'var(--bg-card)',
      borderRadius: '8px',
      border: '1px solid var(--line)',
      display: 'grid',
      gap: '12px',
    }}>
      <div style={{ display: 'flex', gap: '12px' }}>
        <SkeletonLoader width="44px" height="44px" borderRadius="50%" variant="pulse" />
        <div style={{ flex: 1, display: 'grid', gap: '8px' }}>
          <SkeletonLoader width="80%" height="16px" variant="wave" />
          <SkeletonLoader width="60%" height="12px" variant="wave" />
        </div>
      </div>

      <SkeletonLoader width="100%" height="16px" variant="wave" />
      <SkeletonLoader width="100%" height="16px" variant="wave" />
      <SkeletonLoader width="80%" height="16px" variant="wave" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
        <SkeletonLoader width="100%" height="40px" borderRadius="6px" variant="pulse" />
        <SkeletonLoader width="100%" height="40px" borderRadius="6px" variant="pulse" />
        <SkeletonLoader width="100%" height="40px" borderRadius="6px" variant="pulse" />
      </div>
    </div>
  );
}

export function SkeletonFeed({ count = 3 }) {
  return (
    <div style={{ display: 'grid', gap: '16px' }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonImage() {
  return (
    <SkeletonLoader
      width="100%"
      height="300px"
      borderRadius="8px"
      variant="wave"
      style={{ aspectRatio: '16/9' }}
    />
  );
}

export function SkeletonText({ lines = 3 }) {
  return (
    <div style={{ display: 'grid', gap: '8px' }}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLoader
          key={i}
          width={i === lines - 1 ? '80%' : '100%'}
          height="16px"
          variant="wave"
        />
      ))}
    </div>
  );
}

export function SkeletonAvatar({ size = '48px' }) {
  return (
    <SkeletonLoader
      width={size}
      height={size}
      borderRadius="50%"
      variant="pulse"
    />
  );
}

export function SkeletonButton() {
  return (
    <SkeletonLoader
      width="100%"
      height="40px"
      borderRadius="6px"
      variant="pulse"
    />
  );
}

export function SkeletonInput() {
  return (
    <SkeletonLoader
      width="100%"
      height="40px"
      borderRadius="6px"
      variant="wave"
    />
  );
}

export function SkeletonHeader() {
  return (
    <div style={{
      padding: '16px',
      background: 'var(--bg-card)',
      borderRadius: '8px',
      border: '1px solid var(--line)',
      display: 'grid',
      gap: '12px',
    }}>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <SkeletonLoader width="40px" height="40px" borderRadius="50%" variant="pulse" />
        <div style={{ flex: 1, display: 'grid', gap: '6px' }}>
          <SkeletonLoader width="70%" height="14px" variant="wave" />
          <SkeletonLoader width="50%" height="10px" variant="wave" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonComment() {
  return (
    <div style={{
      padding: '12px',
      display: 'grid',
      gap: '8px',
    }}>
      <div style={{ display: 'flex', gap: '8px' }}>
        <SkeletonLoader width="32px" height="32px" borderRadius="50%" variant="pulse" />
        <div style={{ flex: 1, display: 'grid', gap: '6px' }}>
          <SkeletonLoader width="60%" height="12px" variant="wave" />
          <SkeletonLoader width="100%" height="12px" variant="wave" />
          <SkeletonLoader width="80%" height="12px" variant="wave" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonComments({ count = 3 }) {
  return (
    <div style={{ display: 'grid', gap: '12px' }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonComment key={i} />
      ))}
    </div>
  );
}

export function SkeletonStory() {
  return (
    <div style={{
      width: '100%',
      aspectRatio: '9/16',
      borderRadius: '8px',
      overflow: 'hidden',
    }}>
      <SkeletonLoader
        width="100%"
        height="100%"
        borderRadius="8px"
        variant="pulse"
      />
    </div>
  );
}

export function SkeletonStories({ count = 5 }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${Math.min(count, 5)}, 1fr)`,
      gap: '8px',
    }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonStory key={i} />
      ))}
    </div>
  );
}

export function SkeletonGrid({ columns = 3, count = 6 }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(auto-fill, minmax(200px, 1fr))`,
      gap: '12px',
    }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonLoader
          key={i}
          width="100%"
          height="200px"
          borderRadius="8px"
          variant="wave"
        />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 4 }) {
  return (
    <div style={{
      display: 'grid',
      gap: '12px',
    }}>
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gap: '12px',
            padding: '12px',
            background: 'var(--bg-card)',
            borderRadius: '6px',
            border: '1px solid var(--line)',
          }}
        >
          {Array.from({ length: columns }).map((_, colIdx) => (
            <SkeletonLoader
              key={`${rowIdx}-${colIdx}`}
              width="100%"
              height="20px"
              variant="wave"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonProfile() {
  return (
    <div style={{
      padding: '16px',
      background: 'var(--bg-card)',
      borderRadius: '8px',
      border: '1px solid var(--line)',
      display: 'grid',
      gap: '16px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
        <SkeletonLoader width="80px" height="80px" borderRadius="50%" variant="pulse" />
        <div style={{ flex: 1, display: 'grid', gap: '8px' }}>
          <SkeletonLoader width="70%" height="18px" variant="wave" />
          <SkeletonLoader width="50%" height="14px" variant="wave" />
          <SkeletonLoader width="100%" height="40px" borderRadius="6px" variant="pulse" />
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ textAlign: 'center', display: 'grid', gap: '6px' }}>
            <SkeletonLoader width="100%" height="16px" variant="wave" />
            <SkeletonLoader width="100%" height="12px" variant="wave" />
          </div>
        ))}
      </div>

      {/* Bio */}
      <SkeletonText lines={2} />
    </div>
  );
}

export function SkeletonChat() {
  return (
    <div style={{
      display: 'grid',
      gap: '12px',
    }}>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            gap: '8px',
            justifyContent: i % 2 === 0 ? 'flex-end' : 'flex-start',
          }}
        >
          {i % 2 === 0 ? null : (
            <SkeletonLoader width="32px" height="32px" borderRadius="50%" variant="pulse" />
          )}
          <SkeletonLoader
            width="60%"
            height="40px"
            borderRadius="8px"
            variant="wave"
          />
        </div>
      ))}
    </div>
  );
}

// Styles
const skeletonStyles = `
  @keyframes shimmer {
    0% {
      background-position: -1000px 0;
    }
    100% {
      background-position: 1000px 0;
    }
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  @keyframes wave {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }

  .skeleton-loader {
    background: linear-gradient(
      90deg,
      var(--bg-soft) 25%,
      var(--bg-card) 50%,
      var(--bg-soft) 75%
    );
    background-size: 200% 100%;
  }

  .skeleton-default {
    background: var(--bg-soft);
  }

  .skeleton-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }

  .skeleton-wave {
    background: linear-gradient(
      90deg,
      var(--bg-soft) 25%,
      var(--bg-card) 50%,
      var(--bg-soft) 75%
    );
    background-size: 200% 100%;
    animation: wave 1.5s infinite;
  }
`;

// Export styles
export function SkeletonStyles() {
  return <style>{skeletonStyles}</style>;
}

export default {
  SkeletonLoader,
  SkeletonCard,
  SkeletonFeed,
  SkeletonImage,
  SkeletonText,
  SkeletonAvatar,
  SkeletonButton,
  SkeletonInput,
  SkeletonHeader,
  SkeletonComment,
  SkeletonComments,
  SkeletonStory,
  SkeletonStories,
  SkeletonGrid,
  SkeletonTable,
  SkeletonProfile,
  SkeletonChat,
  SkeletonStyles,
};
