import { memo } from 'react';

/**
 * MobileFilterPills (v47.13 — اتجاه معكوس بناءً على طلب المستخدم)
 * ----------------------------------------------------------------
 * الترتيب البصري الجديد على الشاشة من اليمين → اليسار:
 *   [الوسائط] [الستوري] [المجموعات] [الكل (نشط)]
 *
 * - "الوسائط" في **أقصى اليمين** على الشاشة.
 * - "الكل" في **أقصى اليسار** على الشاشة وهو الزر النشط (بنفسجي ممتلئ).
 * - تم عكس الترتيب بالكامل مقارنة بالنسخة السابقة.
 */
const FILTERS = [
  { id: 'updates', label: 'الوسائط' },
  { id: 'stories', label: 'الستوري' },
  { id: 'community', label: 'المجموعات' },
  { id: 'all', label: 'الكل' },
];

function MobileFilterPills({ activeId, activeFilter, onChange, onFilterChange }) {
  const currentActive = activeFilter ?? activeId ?? 'all';
  const handleChange = (id) => {
    if (typeof onFilterChange === 'function') onFilterChange(id);
    if (typeof onChange === 'function') onChange(id);
  };

  return (
    <div className="ym-filters-container" dir="rtl">
      <div className="ym-filters" role="tablist" dir="rtl">
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
              onTouchEnd={(e) => {
                /* تحسين الاستجابة على الجوال — يمنع تأخير 300ms في كروم/سفاري */
                e.preventDefault();
                handleChange(f.id);
              }}
              dir="rtl"
            >
              <span className="pill-content">{f.label}</span>
            </button>
          );
        })}
      </div>

      <style>{`
        .ym-filters-container {
          padding: 8px 12px 10px;
          background-color: #0A0D1A;
          box-sizing: border-box;
          width: 100%;
          max-width: 100%;
          overflow: hidden;
          font-family: 'Noto Sans Arabic', 'Tajawal', system-ui, sans-serif;
          /* تحسينات اللمس للجوال */
          touch-action: pan-y;
          -webkit-tap-highlight-color: transparent;
          /* ✅ v51 — جعل شريط التصفية لاصقاً فوق صورة الملف الشخصي لصاحب المنشور */
          position: sticky;
          top: calc(56px + env(safe-area-inset-top, 0px));
          z-index: 50;
          border-bottom: 1px solid #1F2937;
          direction: rtl;
        }
        @media (min-width: 768px) {
          .ym-filters-container { top: calc(60px + env(safe-area-inset-top, 0px)); }
        }
        @media (min-width: 1024px) {
          .ym-filters-container { top: calc(64px + env(safe-area-inset-top, 0px)); }
        }
        @media (max-width: 480px) {
          .ym-filters-container { top: calc(54px + env(safe-area-inset-top, 0px)); }
        }
        @media (max-width: 400px) {
          .ym-filters-container { top: calc(52px + env(safe-area-inset-top, 0px)); }
        }
        @media (max-width: 360px) {
          .ym-filters-container { top: calc(50px + env(safe-area-inset-top, 0px)); }
        }
        @media (max-width: 340px) {
          .ym-filters-container { top: calc(48px + env(safe-area-inset-top, 0px)); }
        }
        .ym-filters {
          display: flex;
          flex-direction: row;
          gap: 8px;
          overflow-x: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
          padding-bottom: 2px;
          width: 100%;
          direction: rtl;
          /* ✅ v51 — ترتيب عربي: العناصر تبدأ من اليمين */
          justify-content: flex-start;
          /* تمكين السحب الأفقي السلس على الجوال */
          -webkit-overflow-scrolling: touch;
          overscroll-behavior-x: contain;
          touch-action: pan-x;
        }
        .ym-filters::-webkit-scrollbar { display: none; }

        .ym-filter-pill-new {
          flex: 0 0 auto;
          height: 36px;
          padding: 0 18px;
          border-radius: 999px;
          border: none;
          background: #1A1F2E;
          color: #9CA3AF;
          font-size: 0.82rem;
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
          min-width: 44px;
          position: relative;
          z-index: 1;
        }
        .ym-filter-pill-new:active { transform: scale(0.96); }

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
          .ym-filters-container { padding: 7px 10px 9px; }
          .ym-filters { gap: 7px; }
          .ym-filter-pill-new {
            height: 34px;
            padding: 0 16px;
            font-size: 0.78rem;
          }
        }
        @media (max-width: 360px) {
          .ym-filters-container { padding: 6px 8px 8px; }
          .ym-filters { gap: 6px; }
          .ym-filter-pill-new {
            height: 32px;
            padding: 0 14px;
            font-size: 0.74rem;
          }
        }
        @media (max-width: 320px) {
          .ym-filters-container { padding: 5px 6px 6px; }
          .ym-filters { gap: 4px; }
          .ym-filter-pill-new {
            height: 28px;
            padding: 0 10px;
            font-size: 0.66rem;
          }
        }
        @media (max-width: 393px) and (min-width: 361px) {
          .ym-filter-pill-new { height: 35px; padding: 0 17px; font-size: 0.8rem; }
        }
      `}</style>
    </div>
  );
}

export default memo(MobileFilterPills);
