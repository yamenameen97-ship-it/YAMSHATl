/**
 * Loader Component
 * Features: Unified loading shapes, Skeleton system, Page loader, Inline loader
 */

/**
 * Page Loader - Full page loading state
 */
export function PageLoader({ label = 'جارٍ التحميل...', description = 'بنجهز لك الواجهة بشكل أسرع وأكثر سلاسة.' }) {
  return (
    <div className="page-loader" role="status" aria-live="polite">
      <div className="page-loader-spinner" />
      <div className="page-loader-copy">
        <strong>{label}</strong>
        <span>{description}</span>
      </div>
      <style dangerouslySetInnerHTML={{
        __html: `
          .page-loader {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            gap: 20px;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          }

          .page-loader-spinner {
            width: 60px;
            height: 60px;
            border: 4px solid rgba(59, 130, 246, 0.1);
            border-top-color: #3b82f6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }

          .page-loader-copy {
            text-align: center;
          }

          .page-loader-copy strong {
            display: block;
            font-size: 1.25rem;
            color: #111827;
            margin-bottom: 8px;
          }

          .page-loader-copy span {
            display: block;
            font-size: 0.875rem;
            color: #6b7280;
          }

          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `,
      }}
      />
    </div>
  );
}

/**
 * Inline Loader - Small inline loading indicator
 */
export function InlineLoader({ size = 'small', label = null }) {
  const sizeMap = {
    small: 20,
    medium: 30,
    large: 40,
  };

  const dimension = sizeMap[size] || sizeMap.small;

  return (
    <div className={`inline-loader inline-loader-${size}`} role="status" aria-label={label || 'جارٍ التحميل'}>
      <div
        className="inline-loader-spinner"
        style={{
          width: dimension,
          height: dimension,
        }}
      />
      {label && <span className="inline-loader-label">{label}</span>}
      <style dangerouslySetInnerHTML={{
        __html: `
          .inline-loader {
            display: inline-flex;
            align-items: center;
            gap: 8px;
          }

          .inline-loader-spinner {
            border: 2px solid rgba(59, 130, 246, 0.1);
            border-top-color: #3b82f6;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }

          .inline-loader-label {
            font-size: 0.875rem;
            color: #6b7280;
          }

          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `,
      }}
      />
    </div>
  );
}

/**
 * Skeleton Loader - Placeholder for content
 */
export function SkeletonLoader({ type = 'text', count = 1, width = '100%', height = '20px' }) {
  const skeletons = Array.from({ length: count });

  const getSkeletonStyle = () => {
    switch (type) {
      case 'circle':
        return { borderRadius: '50%', width: height, height };
      case 'rect':
        return { borderRadius: '8px', width, height };
      case 'text':
      default:
        return { borderRadius: '4px', width, height };
    }
  };

  const style = getSkeletonStyle();

  return (
    <div className="skeleton-loader">
      {skeletons.map((_, i) => (
        <div
          key={i}
          className="skeleton-item"
          style={{
            ...style,
            marginBottom: i < skeletons.length - 1 ? '12px' : 0,
          }}
        />
      ))}
      <style dangerouslySetInnerHTML={{
        __html: `
          .skeleton-loader {
            width: 100%;
          }

          .skeleton-item {
            background: linear-gradient(
              90deg,
              #f3f4f6 25%,
              #e5e7eb 50%,
              #f3f4f6 75%
            );
            background-size: 200% 100%;
            animation: shimmer 2s infinite;
          }

          @keyframes shimmer {
            0% {
              background-position: 200% 0;
            }
            100% {
              background-position: -200% 0;
            }
          }
        `,
      }}
      />
    </div>
  );
}

/**
 * Pulse Loader - Pulsing animation
 */
export function PulseLoader({ size = 'medium' }) {
  const sizeMap = {
    small: 24,
    medium: 40,
    large: 60,
  };

  const dimension = sizeMap[size] || sizeMap.medium;

  return (
    <div className={`pulse-loader pulse-loader-${size}`} role="status" aria-label="جارٍ التحميل">
      <div
        className="pulse-loader-dot"
        style={{
          width: dimension,
          height: dimension,
        }}
      />
      <style dangerouslySetInnerHTML={{
        __html: `
          .pulse-loader {
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .pulse-loader-dot {
            background: #3b82f6;
            border-radius: 50%;
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }

          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.5;
            }
          }
        `,
      }}
      />
    </div>
  );
}

/**
 * Dots Loader - Three dots animation
 */
export function DotsLoader({ size = 'medium' }) {
  const sizeMap = {
    small: 6,
    medium: 10,
    large: 14,
  };

  const dotSize = sizeMap[size] || sizeMap.medium;

  return (
    <div className={`dots-loader dots-loader-${size}`} role="status" aria-label="جارٍ التحميل">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="dots-loader-dot"
          style={{
            width: dotSize,
            height: dotSize,
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
      <style dangerouslySetInnerHTML={{
        __html: `
          .dots-loader {
            display: flex;
            gap: 6px;
            align-items: center;
            justify-content: center;
          }

          .dots-loader-dot {
            background: #3b82f6;
            border-radius: 50%;
            animation: bounce 1.4s infinite ease-in-out both;
          }

          @keyframes bounce {
            0%, 80%, 100% {
              transform: scale(0);
              opacity: 0.5;
            }
            40% {
              transform: scale(1);
              opacity: 1;
            }
          }
        `,
      }}
      />
    </div>
  );
}

/**
 * Ring Loader - Ring animation
 */
export function RingLoader({ size = 'medium' }) {
  const sizeMap = {
    small: 30,
    medium: 50,
    large: 70,
  };

  const dimension = sizeMap[size] || sizeMap.medium;

  return (
    <div className={`ring-loader ring-loader-${size}`} role="status" aria-label="جارٍ التحميل">
      <div
        className="ring-loader-ring"
        style={{
          width: dimension,
          height: dimension,
        }}
      />
      <style dangerouslySetInnerHTML={{
        __html: `
          .ring-loader {
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .ring-loader-ring {
            border: 3px solid rgba(59, 130, 246, 0.1);
            border-top-color: #3b82f6;
            border-right-color: #3b82f6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `,
      }}
      />
    </div>
  );
}

/**
 * Bar Loader - Progress bar animation
 */
export function BarLoader({ width = '100%', height = '4px' }) {
  return (
    <div className="bar-loader" style={{ width, height }}>
      <div className="bar-loader-bar" />
      <style dangerouslySetInnerHTML={{
        __html: `
          .bar-loader {
            background: #e5e7eb;
            border-radius: 2px;
            overflow-y:auto;
          }

          .bar-loader-bar {
            height: 100%;
            background: linear-gradient(90deg, #3b82f6, #60a5fa, #3b82f6);
            background-size: 200% 100%;
            animation: slide 1.5s ease-in-out infinite;
          }

          @keyframes slide {
            0% {
              background-position: 200% 0;
            }
            100% {
              background-position: -200% 0;
            }
          }
        `,
      }}
      />
    </div>
  );
}

export default {
  PageLoader,
  InlineLoader,
  SkeletonLoader,
  PulseLoader,
  DotsLoader,
  RingLoader,
  BarLoader,
};
