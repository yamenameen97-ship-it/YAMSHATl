import { memo } from 'react';

/**
 * MobileTabs
 * تبويبات أعلى الصفحة الرئيسية مطابقة للتصميم:
 * - الرئيسية / الرائج / المتابعون
 * - النشط: لون بنفسجي + خط سفلي
 */
const DEFAULT_TABS = [
  { id: 'home', label: 'الرئيسية' },
  { id: 'trending', label: 'الرائج' },
  { id: 'following', label: 'المتابعون' },
];

function MobileTabs({ tabs = DEFAULT_TABS, activeId = 'home', onChange }) {
  return (
    <nav className="ym-tabs" aria-label="أقسام الخلاصة">
      <div className="ym-tabs-inner" role="tablist">
        {tabs.map((t) => {
          const isActive = t.id === activeId;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`ym-tab ${isActive ? 'is-active' : ''}`}
              onClick={() => onChange?.(t.id)}
            >
              {t.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default memo(MobileTabs);
