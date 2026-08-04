/**
 * GroupsSkeleton
 *
 * Skeleton هيكلي لصفحة المجموعات (GroupsHome).
 * يحاكي بشكل دقيق بنية بطاقة المجموعة الحقيقية (yam-group-card):
 *  - أيقونة نيون دائرية جانبية
 *  - اسم المجموعة (سطر عريض) + وصف (سطران)
 *  - شارة عدد الأعضاء + نقطة الحالة
 *  - عمود جانبي (آخر نشاط + شارة غير مقروء)
 *
 * يظهر بدل نص "جاري التحميل..." أثناء انتظار تحميل بيانات API،
 * ليمنح المستخدم إحساساً بسلاسة التجربة وتقليل ارتداد الواجهة (CLS).
 */

import { SkeletonBlock } from './Skeleton.jsx';

export default function GroupsSkeleton({ count = 6 }) {
  return (
    <div
      className="groups-skeleton-stack"
      role="status"
      aria-live="polite"
      aria-label="جاري تحميل المجموعات"
      style={{ display: 'grid', gap: 12 }}
    >
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="yam-group-card skeleton-card"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 16px',
            borderRadius: 16,
            border: '1px solid var(--line)',
            background: 'var(--bg-card)',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', flex: 1, minWidth: 0 }}>
            <SkeletonBlock className="skeleton-avatar" />
            <div style={{ flex: 1, minWidth: 0, display: 'grid', gap: 8 }}>
              <SkeletonBlock className="skeleton-line short" />
              <SkeletonBlock className="skeleton-line medium" />
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <SkeletonBlock className="skeleton-line tiny" />
                <SkeletonBlock className="skeleton-line tiny" style={{ width: 40 }} />
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gap: 8, justifyItems: 'flex-end' }}>
            <SkeletonBlock className="skeleton-line tiny" />
            <SkeletonBlock
              className="skeleton-block"
              style={{ width: 22, height: 22, borderRadius: 999 }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
