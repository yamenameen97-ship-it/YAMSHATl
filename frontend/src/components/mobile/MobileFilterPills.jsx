import { memo } from 'react';

/**
 * MobileFilterPills (v47.3 — pixel-perfect filter tabs)
 * -----------------------------------------------------
 * مطابقة كاملة للصورة المرجعية (RTL من اليمين لليسار):
 *   الكل (نشط — بنفسجي ممتلئ) | المجموعات | الستوري | الوسائط | التعليقات
 *
 * - الزر النشط ممتلئ بنفسجي (#7C3AED) بدون حواف
 * - الأزرار غير النشطة بخلفية داكنة جداً قريبة من خلفية الصفحة بدون حواف ظاهرة
 * - استجابة كاملة للجوالات القديمة (320–360px)
 */
const FILTERS = [
  { id: 'all', label: 'الكل' },
  { id: 'community', label: 'المجموعات' },
  { id: 'stories', label: 'الستوري' },
  { id: 'updates', label: 'الوسائط' },
  { id: 'ads', label: 'التعليقات' },
];

function MobileFilterPills({ activeId, activeFilter, onChange, onFilterChange }) {
  const currentActive = activeFilter ?? activeId ?? 'all';
  const handleChange = (id) => {
    if (typeof onFilterChange === 'function') onFilterChange(id);
    if (typeof onChange === 'function') onChange(id);
  };

  return (
    <div className="ym-filters-container" dir="rtl">
      <div className="ym-filters" role="tablist">
        {FILTERS.map((f) => {
          const isActive = f.id === currentActive;
          return (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`ym-filter-pill-new ${f.id} ${isActive ? 'is-active' : ''}`}
              onClick={() => handleChange(f.id)}
            >
              <span className="pill-content">{f.label}</span>
            </button>
          );
        })}
      </div>

      <style>{`
        .ym-filters-container {
          padding: 6px 12px 10px;
          background-color: #0A0D1A;
          box-sizing: border-box;
          max-width: 100%;
        }
        .ym-filters {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
          padding-bottom: 2px;
        }
        .ym-filters::-webkit-scrollbar { display: none; }

        .ym-filter-pill-new {
          flex: 0 0 auto;
          height: 34px;
          padding: 0 16px;
          border-radius: 999px;
          border: none;
          background: #1A1F2E;
          color: #9CA3AF;
          font-size: 0.82rem;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.18s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .ym-filter-pill-new:active { transform: scale(0.96); }

        /* الزر النشط "الكل" — تعبئة بنفسجية */
        .ym-filter-pill-new.is-active {
          background-color: #7C3AED;
          color: #FFFFFF;
          box-shadow: 0 2px 10px rgba(124, 58, 237, 0.4);
        }

        .pill-content {
          display: inline-flex;
          align-items: center;
          line-height: 1;
        }

        /* === الأجهزة المتوسطة === */
        @media (max-width: 400px) {
          .ym-filters-container { padding: 6px 10px 8px; }
          .ym-filters { gap: 6px; }
          .ym-filter-pill-new {
            height: 32px;
            padding: 0 14px;
            font-size: 0.78rem;
          }
        }
        /* === الجوالات القديمة الصغيرة === */
        @media (max-width: 360px) {
          .ym-filters-container { padding: 5px 8px 7px; }
          .ym-filters { gap: 5px; }
          .ym-filter-pill-new {
            height: 30px;
            padding: 0 12px;
            font-size: 0.74rem;
          }
        }
        @media (max-width: 320px) {
          .ym-filter-pill-new {
            height: 28px;
            padding: 0 10px;
            font-size: 0.7rem;
          }
        }
      `}</style>
    </div>
  );
}

export default memo(MobileFilterPills);
