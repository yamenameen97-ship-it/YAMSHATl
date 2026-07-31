import { memo, useEffect, useRef, useState } from 'react';

/**
 * FeedVideoPlayer (v89.12 — ROOT FIX: مطابقة صفحة الويب الرئيسية FeedEnhanced.jsx)
 * ------------------------------------------------------------------------------
 * المشكلة السابقة (v88.61 → v88.99):
 *   كان المكون يعتمد على زر ميكروفون عائم مخصص (absolute) + overlay fullscreen.
 *   هذا الأسلوب أدى إلى:
 *     • ظهور زر الصوت مقتطعاً على يسار الفيديو بدل شريط تحكم متكامل.
 *     • "هروب" الفيديو جانبياً وأخذ مساحة زائدة عند العرض على الكمبيوتر.
 *     • غياب زر التكبير (Fullscreen) وزر إعدادات المشغّل (⋮) الأصليّين.
 *
 * الحل الجذري (v89.12):
 *   نطبّق نفس المنهج المُثبت في الصفحة الرئيسية العادية (FeedEnhanced.jsx / MediaTile):
 *     1) نستخدم عنصر <video> أصلي مع controls الأصلية للمتصفح.
 *        → المتصفح يعرض شريطاً موحداً بالأسفل يحوي:
 *          [تشغيل/إيقاف] [الزمن] [شريط تقدم] [الصوت 🔊] [الإعدادات ⋮] [تكبير ⛶]
 *     2) IntersectionObserver يبدأ التشغيل تلقائياً بصوت مكتوم عند الظهور،
 *        ويوقفه عند الخروج من الرؤية — مطابقاً لسلوك فيسبوك.
 *     3) نوقف الفيديو أيضاً عند إخفاء التبويب (visibilitychange).
 *     4) لا overlay ولا زر عائم — الفيديو لا "يهرب" جانبياً على أي شاشة.
 *
 * ملاحظة توافق: نفس التوقيع (src, poster) — لا يحتاج المستدعي أي تعديل.
 */

function FeedVideoPlayer({ src, poster }) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  /* ==========================================================
     1) IntersectionObserver — تشغيل عند الظهور، إيقاف عند الخروج
     ========================================================== */
  useEffect(() => {
    const node = containerRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(entry.isIntersecting && entry.intersectionRatio >= 0.6);
        });
      },
      { threshold: [0, 0.4, 0.6, 1] }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [src]);

  /* ==========================================================
     2) تحكم فعلي في play/pause + إيقاف عند إخفاء التبويب
     ========================================================== */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    if (isVisible) {
      const playPromise = video.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {
          /* بعض المتصفحات ترفض autoplay — نتجاهل بأمان */
        });
      }
    } else {
      try { video.pause(); } catch (_) { /* noop */ }
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        try { video.pause(); } catch (_) { /* noop */ }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      try { video.pause(); } catch (_) { /* noop */ }
    };
  }, [isVisible, src]);

  return (
    <div ref={containerRef} className="ym-feed-video-native">
      <video
        ref={videoRef}
        src={src}
        poster={poster || undefined}
        className="ym-feed-video-el"
        muted
        loop
        playsInline
        webkit-playsinline="true"
        x5-playsinline="true"
        preload="metadata"
        controls
        controlsList="nodownload"
        crossOrigin="anonymous"
        onError={(e) => {
          try {
            const el = e.currentTarget;
            const parent = el.parentNode;
            el.style.display = 'none';
            if (parent && !parent.querySelector('.ym-fv-fallback')) {
              const fb = document.createElement('div');
              fb.className = 'ym-fv-fallback';
              fb.textContent = 'تعذّر تشغيل الفيديو';
              parent.appendChild(fb);
            }
          } catch { /* ignore */ }
        }}
      />

      <style>{`
        /* ============ الحاوية Inline (v89.12 — بدون زر عائم) ============
           - width: 100% فقط، دون حجم ثابت، حتى لا يفرّ الفيديو جانبياً.
           - controls أصلية للمتصفح تعرض: الصوت + التكبير + الإعدادات + شريط التقدم.
           - direction: ltr لعناصر التحكم فقط (الفيديو نفسه محايد للاتجاه). */
        .ym-feed-video-native {
          position: relative;
          width: 100%;
          max-width: 100%;
          background: #000;
          border-radius: 12px;
          overflow: hidden;
          -webkit-tap-highlight-color: transparent;
          /* لا نبتلع لمس التمرير العمودي */
          touch-action: pan-y;
          /* ✅ v89.12: نضمن أن الحاوية لا تتجاوز عرض البطاقة على الكمبيوتر */
          box-sizing: border-box;
        }
        .ym-feed-video-el {
          display: block;
          width: 100%;
          height: auto;
          max-width: 100%;
          max-height: min(78dvh, 720px);
          object-fit: contain;
          background: #000;
          /* شريط التحكم الأصلي يظهر LTR (مطابق لسلوك الصفحة العادية) */
          direction: ltr;
        }
        .ym-fv-fallback {
          padding: 24px;
          text-align: center;
          color: #9CA3AF;
          background: linear-gradient(135deg, #1a1f33, #0f1422);
          border-radius: 8px;
        }
      `}</style>
    </div>
  );
}

export default memo(FeedVideoPlayer);
