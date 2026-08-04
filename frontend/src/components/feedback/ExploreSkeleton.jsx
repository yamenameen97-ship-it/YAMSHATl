/**
 * ExploreSkeleton
 *
 * Skeleton هيكلي لصفحة الاستكشاف/البحث (Search.jsx) في الوضع الأولي
 * (قبل إدخال المستخدم لأي استعلام) — يطابق تخطيط search-dashboard-grid
 * ذي الأعمدة الثلاثة:
 *   1) سيرش سريع
 *   2) الترند الآن
 *   3) اكتشاف أشخاص
 *
 * يُستخدم بدل ListSkeleton العام كي لا يقفز التخطيط عند وصول البيانات
 * (يقلّل CLS ويعطي مستخدم Yamshat إحساساً بسلاسة مطابق لتجارب
 *  Instagram/Facebook أثناء تحميل بيانات API).
 */

import { SkeletonBlock } from './Skeleton.jsx';

function ExploreColumnSkeleton({ rows = 5 }) {
  return (
    <div
      className="card skeleton-card"
      style={{
        padding: 18,
        display: 'grid',
        gap: 12,
        border: '1px solid var(--line)',
        borderRadius: 16,
        background: 'var(--bg-card)',
      }}
    >
      <SkeletonBlock className="skeleton-title-md skeleton-line short" />
      <div style={{ display: 'grid', gap: 10 }}>
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            style={{ display: 'flex', gap: 12, alignItems: 'center' }}
          >
            <SkeletonBlock className="skeleton-avatar" style={{ width: 36, height: 36 }} />
            <div style={{ flex: 1, display: 'grid', gap: 6 }}>
              <SkeletonBlock className="skeleton-line short" />
              <SkeletonBlock className="skeleton-line tiny" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ExploreSkeleton() {
  return (
    <div
      className="search-dashboard-grid explore-skeleton"
      role="status"
      aria-live="polite"
      aria-label="جاري تحميل صفحة الاستكشاف"
    >
      <ExploreColumnSkeleton rows={5} />
      <ExploreColumnSkeleton rows={6} />
      <ExploreColumnSkeleton rows={5} />
    </div>
  );
}
