import React from 'react';

const skeletonStyles = `
  @keyframes yamSkeletonWave {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }

  @keyframes yamSkeletonPulse {
    0%, 100% { opacity: 0.72; }
    50% { opacity: 1; }
  }

  .yam-skeleton {
    position: relative;
    overflow: hidden;
    display: block;
    background: linear-gradient(135deg, rgba(148, 163, 184, 0.12), rgba(148, 163, 184, 0.06));
    isolation: isolate;
    max-width: 100%;
  }

  .yam-skeleton::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.16), transparent);
    transform: translateX(-100%);
    animation: yamSkeletonWave 1.35s linear infinite;
  }

  .yam-skeleton--pulse::after {
    display: none;
  }

  .yam-skeleton--pulse {
    animation: yamSkeletonPulse 1.6s ease-in-out infinite;
  }

  .yam-skeleton--soft {
    background: linear-gradient(135deg, rgba(148,163,184,0.08), rgba(148,163,184,0.04));
  }

  .yam-skeleton-card {
    padding: 16px;
    border-radius: 20px;
    border: 1px solid var(--line, rgba(148,163,184,0.12));
    background: color-mix(in srgb, var(--panel, rgba(11,18,32,0.88)) 94%, transparent);
    display: grid;
    gap: 14px;
  }

  @media (prefers-reduced-motion: reduce) {
    .yam-skeleton,
    .yam-skeleton::after,
    .yam-skeleton--pulse {
      animation: none !important;
    }
  }
`;

export function SkeletonStyles() {
  return <style>{skeletonStyles}</style>;
}

export function SkeletonLoader({
  width = '100%',
  height = '20px',
  borderRadius = '14px',
  className = '',
  style = {},
  variant = 'wave',
  tone = 'default',
  ariaHidden = false,
}) {
  return (
    <>
      <SkeletonStyles />
      <span
        className={`yam-skeleton ${variant === 'pulse' ? 'yam-skeleton--pulse' : ''} ${tone === 'soft' ? 'yam-skeleton--soft' : ''} ${className}`.trim()}
        style={{ width, height, borderRadius, ...style }}
        aria-hidden={ariaHidden ? 'true' : undefined}
        aria-busy={ariaHidden ? undefined : 'true'}
      />
    </>
  );
}

export function SkeletonAvatar({ size = '48px' }) {
  return <SkeletonLoader width={size} height={size} borderRadius="50%" variant="pulse" />;
}

export function SkeletonText({ lines = 3, lastWidth = '72%' }) {
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {Array.from({ length: lines }).map((_, index) => (
        <SkeletonLoader
          key={index}
          height={index === 0 ? '15px' : '13px'}
          width={index === lines - 1 ? lastWidth : '100%'}
          borderRadius="999px"
        />
      ))}
    </div>
  );
}

export function SkeletonImage({ ratio = '16 / 9', height = 'auto' }) {
  return <SkeletonLoader width="100%" height={height} borderRadius="24px" style={{ aspectRatio: ratio }} />;
}

export function SkeletonButton({ width = '100%', compact = false }) {
  return <SkeletonLoader width={width} height={compact ? '40px' : '46px'} borderRadius="16px" variant="pulse" tone="soft" />;
}

export function SkeletonCard({ showMedia = true, compact = false }) {
  return (
    <div className="yam-skeleton-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <SkeletonAvatar size={compact ? '40px' : '48px'} />
        <div style={{ flex: 1, minWidth: 0, display: 'grid', gap: 8 }}>
          <SkeletonLoader width="38%" height="14px" borderRadius="999px" />
          <SkeletonLoader width="22%" height="11px" borderRadius="999px" tone="soft" />
        </div>
      </div>

      <SkeletonText lines={compact ? 2 : 3} lastWidth={compact ? '58%' : '74%'} />

      {showMedia ? <SkeletonImage ratio={compact ? '4 / 3' : '16 / 10'} /> : null}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
        <SkeletonButton compact />
        <SkeletonButton compact />
        <SkeletonButton compact />
      </div>
    </div>
  );
}

export function SkeletonFeed({ count = 3 }) {
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  );
}
