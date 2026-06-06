import { memo } from 'react';

/**
 * MobileFilterPills
 * أزرار فلاتر دائرية: الكل / التحديثات / الإعلانات / المجتمع
 */
const DEFAULT_FILTERS = [
  { id: 'all', label: 'الكل' },
  { id: 'updates', label: 'التحديثات' },
  { id: 'ads', label: 'الإعلانات' },
  { id: 'community', label: 'المجتمع' },
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
