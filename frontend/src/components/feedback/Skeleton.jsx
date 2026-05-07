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
        <div key={index} className="card user-row skeleton-card">
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

export function TableSkeleton({ rows = 6, columns = 6 }) {
  return (
    <div className="table-skeleton-card card">
      <div className="table-skeleton-head">
        {Array.from({ length: columns }).map((_, index) => (
          <SkeletonBlock key={`head-${index}`} className="skeleton-line table-head-cell" />
        ))}
      </div>
      <div className="table-skeleton-body">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={`row-${rowIndex}`} className="table-skeleton-row">
            {Array.from({ length: columns }).map((__, cellIndex) => (
              <SkeletonBlock key={`cell-${rowIndex}-${cellIndex}`} className="skeleton-line table-cell" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="page-state-stack">
      <div className="card skeleton-card skeleton-hero-card">
        <SkeletonBlock className="skeleton-pill" />
        <SkeletonBlock className="skeleton-title-xl" />
        <SkeletonBlock className="skeleton-line long" />
        <SkeletonBlock className="skeleton-line medium" />
      </div>
      <div className="stats-skeleton-grid">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="card skeleton-card stat-skeleton-card">
            <SkeletonBlock className="skeleton-line tiny" />
            <SkeletonBlock className="skeleton-value" />
            <SkeletonBlock className="skeleton-line short" />
          </div>
        ))}
      </div>
      <div className="list-grid two-column-grid-skeleton">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="card skeleton-card">
            <SkeletonBlock className="skeleton-title-md" />
            <SkeletonBlock className="skeleton-line long" />
            <SkeletonBlock className="skeleton-line medium" />
            <SkeletonBlock className="skeleton-media short-media" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="page-state-stack">
      <div className="card skeleton-card profile-skeleton-card">
        <div className="profile-header">
          <SkeletonBlock className="skeleton-avatar large-avatar" />
          <div className="user-meta">
            <SkeletonBlock className="skeleton-title-md" />
            <SkeletonBlock className="skeleton-line medium" />
          </div>
        </div>
        <div className="stats-skeleton-grid three-up">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="mini-stat skeleton-card compact">
              <SkeletonBlock className="skeleton-value" />
              <SkeletonBlock className="skeleton-line tiny" />
            </div>
          ))}
        </div>
      </div>
      <FeedSkeleton count={2} />
    </div>
  );
}

export function AdminOverviewSkeleton() {
  return (
    <div className="page-state-stack">
      <div className="list-grid two-column-grid-skeleton">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="card skeleton-card skeleton-hero-card">
            <SkeletonBlock className="skeleton-pill" />
            <SkeletonBlock className="skeleton-title-xl" />
            <SkeletonBlock className="skeleton-line long" />
            <SkeletonBlock className="skeleton-line medium" />
          </div>
        ))}
      </div>
      <div className="stats-skeleton-grid">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="card skeleton-card stat-skeleton-card">
            <SkeletonBlock className="skeleton-line tiny" />
            <SkeletonBlock className="skeleton-value" />
            <SkeletonBlock className="skeleton-line short" />
          </div>
        ))}
      </div>
      <div className="list-grid two-column-grid-skeleton">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="card skeleton-card">
            <SkeletonBlock className="skeleton-title-md" />
            <SkeletonBlock className="skeleton-line long" />
            <SkeletonBlock className="skeleton-line medium" />
            <SkeletonBlock className="skeleton-line short" />
            <SkeletonBlock className="skeleton-media short-media" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function RoutePageSkeleton() {
  return (
    <div className="page-state-stack route-page-skeleton" role="status" aria-live="polite">
      <div className="card skeleton-card skeleton-hero-card">
        <SkeletonBlock className="skeleton-pill" />
        <SkeletonBlock className="skeleton-title-xl" />
        <SkeletonBlock className="skeleton-line long" />
        <SkeletonBlock className="skeleton-line medium" />
      </div>
      <div className="stats-skeleton-grid">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="card skeleton-card stat-skeleton-card">
            <SkeletonBlock className="skeleton-line tiny" />
            <SkeletonBlock className="skeleton-value" />
            <SkeletonBlock className="skeleton-line short" />
          </div>
        ))}
      </div>
      <FeedSkeleton count={2} />
    </div>
  );
}
