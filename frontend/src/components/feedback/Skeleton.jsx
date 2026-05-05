export function SkeletonBlock({ className = '' }) {
  return <div className={`skeleton-block ${className}`.trim()} aria-hidden="true" />;
}

export function FeedSkeleton({ count = 3 }) {
  return (
    <div className="feed-stack">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="card post-card skeleton-card">
          <div className="post-head">
            <div className="user-row compact-row">
              <SkeletonBlock className="skeleton-avatar" />
              <div className="user-meta" style={{ minWidth: 180 }}>
                <SkeletonBlock className="skeleton-line short" />
                <SkeletonBlock className="skeleton-line tiny" />
              </div>
            </div>
          </div>
          <SkeletonBlock className="skeleton-line long" />
          <SkeletonBlock className="skeleton-line medium" />
          <SkeletonBlock className="skeleton-media" />
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton({ count = 6 }) {
  return (
    <div className="list-grid">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="card user-row">
          <SkeletonBlock className="skeleton-avatar" />
          <div className="user-meta" style={{ minWidth: 180 }}>
            <SkeletonBlock className="skeleton-line short" />
            <SkeletonBlock className="skeleton-line tiny" />
          </div>
        </div>
      ))}
    </div>
  );
}
