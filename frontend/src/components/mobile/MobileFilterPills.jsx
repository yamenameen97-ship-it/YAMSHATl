import { memo } from 'react';

/**
 * MobileFilterPills
 * أزرار فلاتر للخلاصة: الكل / التحديثات / البث / الستوري
 */
const DEFAULT_FILTERS = [
  { id: 'all', label: 'الكل' },
  { id: 'posts', label: 'التحديثات' },
  { id: 'live', label: 'البث' },
  { id: 'stories', label: 'الستوري' },
];

function MobileFilterPills({ filters = DEFAULT_FILTERS, activeId = 'all', onChange }) {
  return (
    <div className="ym-filters" role="tablist" aria-label="فلاتر الخلاصة">
      {filters.map((f) => {
        const isActive = f.id === activeId;
        return (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`ym-filter-pill ${isActive ? 'is-active' : ''}`}
            onClick={() => onChange?.(f.id)}
          >
            {f.label}
          </button>
        );
      })}
    </div>
  );
}

export default memo(MobileFilterPills);
