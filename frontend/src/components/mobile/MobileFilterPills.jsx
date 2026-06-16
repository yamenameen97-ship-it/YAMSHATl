import { memo } from 'react';

/**
 * MobileFilterPills (v47.4 — pixel-perfect filter tabs)
 * -----------------------------------------------------
 * مطابقة كاملة للصورة المرجعية (RTL — من اليمين لليسار):
 *   [الكل (نشط)] [المجموعات] [الستوري] [الوسائط] [التعليقات]
 *
 * - الزر النشط "الكل" ممتلئ بنفسجي #7C3AED بدون حواف ظاهرة.
 * - الأزرار غير النشطة بخلفية رمادية داكنة #1A1F2E.
 * - حجم خط مدمج ليتسع 5 أزرار في 360px بدون scroll.
 * - استجابة كاملة: 320 / 360 / 400 / 480px.
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
          padding: 4px 10px 8px;
          background-color: #0A0D1A;
          box-sizing: border-box;
          width: 100%;
          max-width: 100%;
          overflow: hidden;
        }
        .ym-filters {
          display: flex;
          flex-direction: row;
          gap: 6px;
          overflow-x: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
          padding-bottom: 2px;
          width: 100%;
        }
        .ym-filters::-webkit-scrollbar { display: none; }

        .ym-filter-pill-new {
          flex: 0 0 auto;
          height: 30px;
          padding: 0 12px;
          border-radius: 999px;
          border: none;
          background: #1A1F2E;
          color: #9CA3AF;
          font-size: 0.76rem;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.18s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
        }
        .ym-filter-pill-new:active { transform: scale(0.96); }

        /* الزر النشط "الكل" — تعبئة بنفسجية */
        .ym-filter-pill-new.is-active {
          background-color: #7C3AED;
          color: #FFFFFF;
          box-shadow: 0 2px 8px rgba(124, 58, 237, 0.4);
        }

        .pill-content {
          display: inline-flex;
          align-items: center;
          line-height: 1;
        }

        /* === الأجهزة المتوسطة === */
        @media (max-width: 400px) {
          .ym-filters-container { padding: 4px 8px 7px; }
          .ym-filters { gap: 5px; }
          .ym-filter-pill-new {
            height: 28px;
            padding: 0 10px;
            font-size: 0.72rem;
          }
        }
        /* === الجوالات القديمة الصغيرة === */
        @media (max-width: 360px) {
          .ym-filters-container { padding: 3px 6px 6px; }
          .ym-filters { gap: 4px; }
          .ym-filter-pill-new {
            height: 26px;
            padding: 0 9px;
            font-size: 0.68rem;
          }
        }
        @media (max-width: 320px) {
          .ym-filters-container { padding: 3px 5px 5px; }
          .ym-filters { gap: 3px; }
          .ym-filter-pill-new {
            height: 24px;
            padding: 0 7px;
            font-size: 0.62rem;
          }
        }
      `}</style>
    </div>
  );
}

export default memo(MobileFilterPills);
