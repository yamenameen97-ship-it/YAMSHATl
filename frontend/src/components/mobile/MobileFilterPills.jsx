import { memo, useRef, useCallback } from 'react';

/**
 * MobileFilterPills (v59.13.23 — A11y Pass)
 *  • v59.13.23 UX fixes:
 *    - إزالة onTouchEnd+preventDefault الذي كان يسبب إطلاق مزدوج (touch+click).
 *      touch-action: manipulation والـ onClick وحدهما كافيان لإلغاء تأخير 300ms.
 *    - إضافة دعم الأسهم اليمين/يسار (Keyboard navigation بين التبويبات) حسب ARIA Authoring Practices.
 *    - إضافة focus-visible ring للكيبورد.
 *    - احترام prefers-reduced-motion.
 *
 * MobileFilterPills (v59.13.21 — RTL صحيح مع عدم الفيضان)
 * ----------------------------------------------------------------
 * الترتيب البصري على الشاشة من اليمين → اليسار:
 *   [الكل (نشط)] [المجموعات] [الستوري] [الوسائط]
 *
 * - "الكل" في **أقصى اليمين** على الشاشة (الزر النشط).
 * - "الوسائط" في **أقصى اليسار**.
 * - أحجام أصغر وحشو أقل لضمان ظهور الأربعة دفعة واحدة بدون فيضان.
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

  // ⭐ v59.13.23 a11y: تنقل بالأسهم حسب ARIA Authoring Practices Tabs pattern.
  // في RTL: سهم اليمين = سابق (لأن البصر يبدأ من اليمين)، سهم اليسار = تالي.
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

  return (
    <div className="ym-filters-container" dir="rtl">
      <div className="ym-filters" role="tablist" aria-label="تصفية المحتوى" dir="rtl">
        {FILTERS.map((f, idx) => {
          const isActive = f.id === currentActive;
          return (
            <button
              key={f.id}
              ref={(el) => { tabRefs.current[f.id] = el; }}
              type="button"
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}  /* ⭐ v59.13.23 a11y: roving tabindex */
              className={`ym-filter-pill-new ${f.id} ${isActive ? 'is-active' : ''}`}
              onClick={() => handleChange(f.id)}
              onKeyDown={(e) => onKeyDown(e, idx)}
              /* ✅ v59.13.23: أُزيل onTouchEnd+preventDefault لأنه
                 كان يسبب إطلاق مزدوج، ولأن touch-action: manipulation لا
                 يحتاج لـ preventDefault لتجنب تأخير 300ms. */
              dir="rtl"
            >
              <span className="pill-content">{f.label}</span>
            </button>
          );
        })}
      </div>

      <style>{`
        .ym-filters-container {
          /* ⭐ v59.13.24: padding متماثل يسارًا ويمينًا حتى تلتصق
             أول pill (الكل) بحافة اليمين تماماً */
          padding: 8px 12px 10px;
          padding-inline-start: 12px;
          padding-inline-end: 12px;
          margin: 0;
          background-color: #0A0D1A;
          box-sizing: border-box;
          width: 100%;
          max-width: 100%;
          overflow: hidden;
          font-family: 'Noto Sans Arabic', 'Tajawal', system-ui, sans-serif;
          /* ⭐ v59.13.24: لا نقيّد اللمس هنا حتى يمرّ التمرير العمودي لـ main */
          touch-action: pan-x pan-y;
          -webkit-tap-highlight-color: transparent;
          /* ⭐ v59.13.38 FIX: sticky داخل .yam-home-mobile-page
             (scroll-container داخلي). تلتصق تحت صندوق «بماذا
             تفكر؟» الملتصق أيضاً. الـ top = ارتفاع الصندوق
             تقريباً (~52px) حتى تبقى الاثنتان مرئيّتين فوق بعضهما. */
          position: sticky;
          top: 52px;
          /* تعويض الـ padding الجانبي لحاوية .yam-home-mobile-page (12px)
             حتى تلتصق الفلاتر بحواف منطقة العرض تماماً */
          margin-inline-start: -12px;
          margin-inline-end: -12px;
          margin-top: 0;
          padding-top: 8px;
          z-index: 50;
          border-bottom: 1px solid #1F2937;
          direction: rtl;
        }
        .ym-filters {
          display: flex;
          flex-direction: row;
          gap: 6px;
          overflow-x: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
          padding-bottom: 2px;
          padding-inline-start: 0;
          padding-inline-end: 0;
          margin: 0;
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
          direction: rtl;
          /* ⭐ v59.13.24 — في RTL: flex-start = أقصى اليمين */
          justify-content: flex-start;
          -webkit-overflow-scrolling: touch;
          overscroll-behavior-x: contain;
          touch-action: pan-x;
        }
        .ym-filters::-webkit-scrollbar { display: none; }

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
          /* استجابة لمس فورية على PWA / Chrome Mobile */
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
          -webkit-user-select: none;
          user-select: none;
          /* ضمان قابلية اللمس */
          min-width: 40px;
          position: relative;
          z-index: 1;
        }
        .ym-filter-pill-new:active { transform: scale(0.96); }

        /* ⭐ v59.13.23 a11y: focus-visible ring لمستخدمي الكيبورد */
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
          pointer-events: none; /* يضمن تلقي الزر للنقرة وليس النص الداخلي */
        }

        @media (max-width: 400px) {
          .ym-filters-container { padding: 7px 8px 9px; padding-top: 8px; top: 50px; }
          .ym-filters { gap: 5px; }
          .ym-filter-pill-new {
            height: 32px;
            padding: 0 12px;
            font-size: 0.74rem;
          }
        }
        @media (max-width: 360px) {
          .ym-filters-container { padding: 6px 6px 8px; padding-top: 8px; top: 48px; }
          .ym-filters { gap: 4px; }
          .ym-filter-pill-new {
            height: 30px;
            padding: 0 10px;
            font-size: 0.7rem;
          }
        }
        @media (max-width: 320px) {
          .ym-filters-container { padding: 5px 4px 6px; padding-top: 8px; top: 46px; }
          .ym-filters { gap: 3px; }
          .ym-filter-pill-new {
            height: 26px;
            padding: 0 8px;
            font-size: 0.62rem;
          }
        }
        @media (max-width: 393px) and (min-width: 361px) {
          .ym-filter-pill-new { height: 32px; padding: 0 12px; font-size: 0.76rem; }
        }

        /* ⭐ v59.13.23 a11y: احترام prefers-reduced-motion */
        @media (prefers-reduced-motion: reduce) {
          .ym-filter-pill-new { transition: none !important; }
          .ym-filter-pill-new:active { transform: none !important; }
        }
      `}</style>
    </div>
  );
}

export default memo(MobileFilterPills);
