import { memo, useRef, useCallback } from 'react';

/**
 * MobileFilterPills (v73 — DEFINITIVE ROOT FIX)
 * ----------------------------------------------------------------
 * 🔥 v73 يحلّ المشكلة المزمنة جذرياً عبر CSS Grid على الحاوية الأم.
 *
 * هذا الملف:
 *   ✅ أزال inline-style guard القديم (containerInlineGuard) الذي
 *      كان يفرض marginInline سالب — لم يعد ضرورياً.
 *   ✅ أزال قواعد .ym-filters-container من <style>{`...`}</style>
 *      المضمن لأنها تتعارض مع v73. كل الستايل المتعلق بالـ layout
 *      الخارجي (العرض، الـ sticky، الـ padding، الـ background)
 *      مركزي في v73 CSS.
 *   ✅ أبقى فقط على ستايل الـ pills الداخلي (الذي لا يتعارض).
 *
 * الترتيب البصري RTL على الشاشة من اليمين → اليسار:
 *   [الكل (نشط)] [المجموعات] [الستوري] [الوسائط]
 */
const FILTERS = [
  { id: 'all', label: 'الكل' },
  { id: 'community', label: 'المجموعات' },
  { id: 'stories', label: 'الستوري' },
  { id: 'updates', label: 'الوسائط' },
];

function MobileFilterPills({ activeId, activeFilter, onChange, onFilterChange }) {
  const currentActive = activeFilter ?? activeId ?? 'all';
  const tabRefs = useRef({});

  const handleChange = useCallback((id) => {
    if (typeof onFilterChange === 'function') onFilterChange(id);
    if (typeof onChange === 'function') onChange(id);
  }, [onFilterChange, onChange]);

  const onKeyDown = useCallback((e, idx) => {
    let nextIdx = null;
    if (e.key === 'ArrowLeft') nextIdx = idx + 1; // RTL forward
    else if (e.key === 'ArrowRight') nextIdx = idx - 1; // RTL back
    else if (e.key === 'Home') nextIdx = 0;
    else if (e.key === 'End') nextIdx = FILTERS.length - 1;
    else return;
    e.preventDefault();
    nextIdx = (nextIdx + FILTERS.length) % FILTERS.length;
    const nextId = FILTERS[nextIdx].id;
    handleChange(nextId);
    try { tabRefs.current[nextId]?.focus(); } catch { /* ignore */ }
  }, [handleChange]);

  /* ⭐ v75 ABSOLUTE FIX: inline guard لـ .ym-filters-container
     يضمن width:100% + zero margin-inline حتى لو فشلت CSS
     في الفوز على أي قاعدة سابقة. */
  const containerInlineGuard = {
    display: 'block',
    width: '100%',
    maxWidth: '100%',
    minWidth: 0,
    marginLeft: 0,
    marginRight: 0,
    marginInlineStart: 0,
    marginInlineEnd: 0,
    boxSizing: 'border-box',
    direction: 'rtl',
  };

  const filtersInlineGuard = {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    width: '100%',
    maxWidth: '100%',
    minWidth: 0,
    margin: 0,
    padding: 0,
    direction: 'rtl',
  };

  return (
    <div className="ym-filters-container" dir="rtl" style={containerInlineGuard}>
      <div
        className="ym-filters"
        role="tablist"
        aria-label="تصفية المحتوى"
        dir="rtl"
        style={filtersInlineGuard}
      >
        {FILTERS.map((f, idx) => {
          const isActive = f.id === currentActive;
          return (
            <button
              key={f.id}
              ref={(el) => { tabRefs.current[f.id] = el; }}
              type="button"
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              className={`ym-filter-pill-new ${f.id} ${isActive ? 'is-active' : ''}`}
              onClick={() => handleChange(f.id)}
              onKeyDown={(e) => onKeyDown(e, idx)}
              dir="rtl"
            >
              <span className="pill-content">{f.label}</span>
            </button>
          );
        })}
      </div>

      {/* ⭐ v73 — Internal styles محدودة فقط على الـ pills الداخلية.
          القواعد الخاصة بـ .ym-filters-container (العرض، الـ sticky،
          الـ padding، الـ background) كلها مركزية في v73 CSS. */}
      <style>{`
        .ym-filter-pill-new {
          flex: 0 0 auto;
          height: 34px;
          padding: 0 14px;
          border-radius: 999px;
          border: none;
          background: #1A1F2E;
          color: #9CA3AF;
          font-size: 0.78rem;
          font-weight: 600;
          font-family: 'Noto Sans Arabic', 'Tajawal', system-ui, sans-serif;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.18s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
          direction: rtl;
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
          -webkit-user-select: none;
          user-select: none;
          min-width: 40px;
          position: relative;
          z-index: 1;
        }
        .ym-filter-pill-new:active { transform: scale(0.96); }

        .ym-filter-pill-new:focus { outline: none; }
        .ym-filter-pill-new:focus-visible {
          outline: 2px solid #A78BFA;
          outline-offset: 2px;
          box-shadow: 0 0 0 4px rgba(167, 139, 250, 0.25);
        }

        /* الزر النشط "الكل" — تعبئة بنفسجية */
        .ym-filter-pill-new.is-active {
          background-color: #7C3AED;
          color: #FFFFFF;
          box-shadow: 0 2px 10px rgba(124, 58, 237, 0.45);
        }

        .pill-content {
          display: inline-flex;
          align-items: center;
          line-height: 1;
          font-family: 'Noto Sans Arabic', 'Tajawal', system-ui, sans-serif;
          pointer-events: none;
        }

        @media (max-width: 400px) {
          .ym-filter-pill-new {
            height: 32px;
            padding: 0 12px;
            font-size: 0.74rem;
          }
        }
        @media (max-width: 360px) {
          .ym-filter-pill-new {
            height: 30px;
            padding: 0 10px;
            font-size: 0.7rem;
          }
        }
        @media (max-width: 320px) {
          .ym-filter-pill-new {
            height: 26px;
            padding: 0 8px;
            font-size: 0.62rem;
          }
        }
        @media (max-width: 393px) and (min-width: 361px) {
          .ym-filter-pill-new { height: 32px; padding: 0 12px; font-size: 0.76rem; }
        }

        @media (prefers-reduced-motion: reduce) {
          .ym-filter-pill-new { transition: none !important; }
          .ym-filter-pill-new:active { transform: none !important; }
        }
      `}</style>
    </div>
  );
}

export default memo(MobileFilterPills);
