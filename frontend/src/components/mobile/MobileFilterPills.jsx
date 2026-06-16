import { memo } from 'react';

/**
 * MobileFilterPills (v47)
 * -----------------------
 * أزرار فلاتر مستديرة:
 *   الكل / المجموعات / الستوري / التحديثات / التصفيات
 *
 * - الزر النشط (الكل افتراضياً) باللون البنفسجي الممتلئ
 * - باقي الأزرار بإطار رمادي خفيف
 * - النقطة الصغيرة تظهر فوق "الستوري" للإشارة إلى تحديثات جديدة
 * - المقاسات والمسافات مضبوطة لتعمل على الأجهزة القديمة (Redmi Note 8 ≈ 360px)
 *   بدون أن تخرج عن حدود الشاشة.
 */
// ترتيب جديد (v47.2): زر "الكل" أصبح أول زر من جهة اليمين (RTL start)
// كما هو معلّم بالسهم في صورة التصميم المرجعية للويب الجوال.
const FILTERS = [
  { id: 'all', label: 'الكل' },
  { id: 'community', label: 'المجموعات' },
  { id: 'stories', label: 'الستوري', hasDot: true },
  { id: 'updates', label: 'الوسائط' },
  { id: 'ads', label: 'التعليقات' },
];

function MobileFilterPills({ activeId, activeFilter, onChange, onFilterChange }) {
  // قبول الاسمين معاً للحفاظ على التوافق مع كل صفحات الاستخدام
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
              <div className="pill-content">
                {f.hasDot && <span className="pill-dot" aria-hidden="true"></span>}
                {f.label}
              </div>
            </button>
          );
        })}
      </div>

      <style>{`
        .ym-filters-container {
          padding: 8px 12px 10px;
          background-color: #0A0D1A;
          box-sizing: border-box;
          max-width: 100%;
        }
        .ym-filters {
          display: flex;
          gap: 6px;
          overflow-x: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
          padding-bottom: 2px;
        }
        .ym-filters::-webkit-scrollbar { display: none; }

        .ym-filter-pill-new {
          flex: 1 0 auto;
          min-width: 64px;
          height: 32px;
          padding: 0 12px;
          border-radius: 999px;
          border: 1px solid #1F2937;
          background: #111827;
          color: #9CA3AF;
          font-size: 0.78rem;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.18s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .ym-filter-pill-new:active { transform: scale(0.96); }

        /* الزر النشط "الكل" — تعبئة بنفسجية */
        .ym-filter-pill-new.is-active {
          background-color: #7C3AED;
          border-color: #7C3AED;
          color: #FFFFFF;
          box-shadow: 0 2px 8px rgba(124, 58, 237, 0.35);
        }

        .pill-content {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          line-height: 1;
        }
        .pill-dot {
          width: 5px;
          height: 5px;
          background-color: #8B5CF6;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .ym-filter-pill-new.is-active .pill-dot { background-color: #FFFFFF; }

        /* === الأجهزة الصغيرة === */
        @media (max-width: 400px) {
          .ym-filters-container { padding: 6px 10px 8px; }
          .ym-filters { gap: 5px; }
          .ym-filter-pill-new {
            min-width: auto;
            height: 30px;
            padding: 0 10px;
            font-size: 0.72rem;
          }
        }
        @media (max-width: 340px) {
          .ym-filter-pill-new {
            height: 28px;
            padding: 0 8px;
            font-size: 0.68rem;
          }
        }
      `}</style>
    </div>
  );
}

export default memo(MobileFilterPills);
