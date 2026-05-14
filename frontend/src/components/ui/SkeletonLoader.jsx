/**
 * SkeletonLoader Component
 * 
 * مكونات تحميل هيكلية مع:
 * - Shimmer animation
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
}) {
  return (
    <div
      className={`skeleton-loader ${className}`}
      style={{
        width,
        height,
        borderRadius,
        background: 'var(--bg-soft)',
        animation: 'shimmer 1.5s infinite',
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
        <SkeletonLoader width="44px" height="44px" borderRadius="50%" />
        <div style={{ flex: 1, display: 'grid', gap: '8px' }}>
          <SkeletonLoader width="80%" height="16px" />
          <SkeletonLoader width="60%" height="12px" />
        </div>
      </div>

      <SkeletonLoader width="100%" height="16px" />
      <SkeletonLoader width="100%" height="16px" />
      <SkeletonLoader width="80%" height="16px" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
        <SkeletonLoader width="100%" height="40px" borderRadius="6px" />
        <SkeletonLoader width="100%" height="40px" borderRadius="6px" />
        <SkeletonLoader width="100%" height="40px" borderRadius="6px" />
      </div>
    </div>
  );
}

export function SkeletonFeed() {
  return (
    <div style={{ display: 'grid', gap: '16px' }}>
      {[1, 2, 3].map(i => (
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
        />
      ))}
    </div>
  );
}

export function SkeletonAvatar() {
  return (
    <SkeletonLoader
      width="48px"
      height="48px"
      borderRadius="50%"
    />
  );
}

export function SkeletonButton() {
  return (
    <SkeletonLoader
      width="100%"
      height="40px"
      borderRadius="6px"
    />
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

  .skeleton-loader {
    background: linear-gradient(
      90deg,
      var(--bg-soft) 25%,
      var(--bg-card) 50%,
      var(--bg-soft) 75%
    );
    background-size: 1000px 100%;
    animation: shimmer 1.5s infinite;
  }
`;

// Export styles
export function SkeletonStyles() {
  return <style>{skeletonStyles}</style>;
}
