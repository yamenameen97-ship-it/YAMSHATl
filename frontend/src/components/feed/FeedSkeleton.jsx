import { SkeletonCard, SkeletonStyles } from '../ui/SkeletonLoader.jsx';

export default function FeedSkeleton({ count = 3 }) {
  return (
    <div className="feed-skeleton" aria-label="جاري تحميل المنشورات">
      <SkeletonStyles />
      <div style={{ display: 'grid', gap: 18 }}>
        {Array.from({ length: count }).map((_, index) => (
          <SkeletonCard key={index} showMedia compact={index > 1} />
        ))}
      </div>
    </div>
  );
}
