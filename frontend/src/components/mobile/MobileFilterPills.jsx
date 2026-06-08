import { memo } from 'react';

/**
 * MobileFilterPills
 * أزرار فلاتر دائرية: الكل / التحديثات / الستوري / البث
 * محدثة لتطابق الصورة المرفقة
 */
const FILTERS = [
  { id: 'all', label: 'الكل' },
  { id: 'updates', label: 'التحديثات' },
  { id: 'stories', label: 'الستوري', hasDot: true },
  { id: 'live', label: 'البث' },
];

function MobileFilterPills({ activeId = 'all', onChange }) {
  return (
    <div className="ym-filters-container">
      <div className="ym-filters" role="tablist">
        {FILTERS.map((f) => {
          const isActive = f.id === activeId;
          return (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`ym-filter-pill-new ${f.id} ${isActive ? 'is-active' : ''}`}
              onClick={() => onChange?.(f.id)}
            >
              <div className="pill-content">
                {f.hasDot && <span className="pill-dot"></span>}
                {f.label}
              </div>
            </button>
          );
        })}
      </div>

      <style>{`
        .ym-filters-container {
          padding: 12px 16px;
          background-color: #0A0D1A;
        }
        
        .ym-filters {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          scrollbar-width: none;
        }
        
        .ym-filters::-webkit-scrollbar {
          display: none;
        }
        
        .ym-filter-pill-new {
          flex: 1;
          min-width: 80px;
          height: 36px;
          border-radius: 8px;
          border: 1px solid #1F2937;
          background: #111827;
          color: #9CA3AF;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .ym-filter-pill-new.all.is-active {
          background-color: #6D28D9;
          border-color: #7C3AED;
          color: white;
        }
        
        .ym-filter-pill-new.is-active:not(.all) {
          border-color: #8B5CF6;
          color: #8B5CF6;
          background: rgba(139, 92, 246, 0.1);
        }

        .pill-content {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .pill-dot {
          width: 6px;
          height: 6px;
          background-color: #8B5CF6;
          border-radius: 50%;
        }
      `}</style>
    </div>
  );
}

export default memo(MobileFilterPills);
