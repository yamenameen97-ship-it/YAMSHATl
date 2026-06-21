/**
 * PullToRefresh
 * -------------
 * مكوّن لفّاف يضيف ميزة "السحب من أعلى للتحديث" لأي صفحة في يمشات.
 * يعمل بشكل صحيح مع RTL ويوفّر تجربة شبيهة بالتطبيقات الأصلية:
 *   ✓ مؤشّر دائري ينمو حسب مسافة السحب
 *   ✓ يدور تلقائياً أثناء التحديث
 *   ✓ يحترم safe-area على iOS
 *   ✓ يدعم خطوط Noto Sans Arabic للنص العربي
 */
import { memo } from 'react';
import usePullToRefresh from '../../hooks/usePullToRefresh.js';

function PullToRefresh({
  onRefresh,
  disabled = false,
  threshold = 70,
  children,
  className = '',
  loadingText = 'جارٍ التحديث…',
  pullText = 'اسحب للتحديث',
  releaseText = 'اترك للتحديث',
}) {
  const {
    containerRef,
    pullDistance,
    isRefreshing,
    isTriggered,
    progress,
  } = usePullToRefresh({ onRefresh, threshold, disabled });

  const visibleOffset = isRefreshing ? threshold : pullDistance;
  const indicatorOpacity = Math.min(1, Math.max(0.15, progress));
  const rotation = Math.round(progress * 360);

  const label = isRefreshing
    ? loadingText
    : (isTriggered ? releaseText : pullText);

  return (
    <div
      ref={containerRef}
      dir="rtl"
      className={`ym-ptr-container ${className}`}
      style={{
        position: 'relative',
        /* ⚠️ v57: لا overflow:auto هنا — يكسر التمرير في صفحة المنشورات.
           نترك التمرير على body طبيعياً. */
        overflowX: 'hidden',
        overflowY: 'visible',
        WebkitOverflowScrolling: 'touch',
        overscrollBehaviorY: 'contain',
        touchAction: 'pan-y',
        minHeight: '100%',
        width: '100%',
        flex: '1 1 auto',
      }}
    >
      {/* مؤشر السحب — يتمدّد من الأعلى */}
      <div
        aria-hidden={visibleOffset === 0}
        className="ym-ptr-indicator"
        style={{
          position: 'absolute',
          top: 0,
          insetInlineStart: 0,
          insetInlineEnd: 0,
          height: `${visibleOffset}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '6px',
          pointerEvents: 'none',
          opacity: visibleOffset > 0 ? 1 : 0,
          transition: isRefreshing || pullDistance === 0
            ? 'height 220ms cubic-bezier(.2,.8,.2,1), opacity 200ms'
            : 'opacity 150ms',
          fontFamily: '"Noto Sans Arabic", "Cairo", system-ui, sans-serif',
          color: '#9CA3AF',
          fontSize: '12px',
          userSelect: 'none',
          zIndex: 5,
        }}
      >
        <svg
          width="26"
          height="26"
          viewBox="0 0 26 26"
          style={{
            opacity: indicatorOpacity,
            transform: isRefreshing ? 'none' : `rotate(${rotation}deg)`,
            animation: isRefreshing ? 'ym-ptr-spin 0.9s linear infinite' : 'none',
            transition: isRefreshing ? 'none' : 'transform 90ms linear',
          }}
        >
          <circle
            cx="13"
            cy="13"
            r="10"
            fill="none"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="2.2"
          />
          <path
            d="M 13 3 A 10 10 0 0 1 23 13"
            fill="none"
            stroke={isTriggered ? '#22C55E' : '#60A5FA'}
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </svg>
        {visibleOffset > 18 && (
          <span style={{ direction: 'rtl' }}>{label}</span>
        )}
      </div>

      {/* المحتوى — يتزحزح لأسفل أثناء السحب */}
      <div
        className="ym-ptr-content"
        style={{
          transform: `translate3d(0, ${visibleOffset}px, 0)`,
          transition: isRefreshing || pullDistance === 0
            ? 'transform 240ms cubic-bezier(.2,.8,.2,1)'
            : 'none',
          willChange: 'transform',
        }}
      >
        {children}
      </div>

      <style>{`
        @keyframes ym-ptr-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .ym-ptr-container::-webkit-scrollbar { width: 0; height: 0; }
      `}</style>
    </div>
  );
}

export default memo(PullToRefresh);
