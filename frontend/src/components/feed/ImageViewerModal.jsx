import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * ImageViewerModal (v88.8 — 2026-07)
 * ------------------------------------------------------------------
 * عارض صور بملء الشاشة مع مجموعة أزرار احترافية:
 *   • إعادة نشر (Repost)
 *   • حذف (سلة المهملات)
 *   • حفظ إلى الهاتف (Download)
 *   • تكبير (Zoom In)
 *   • تصغير (Zoom Out)
 *
 * يدعم:
 *   - Pinch-to-zoom (اللمس بإصبعين)
 *   - عجلة الفأرة للتكبير/التصغير
 *   - السحب لتحريك الصورة المكبّرة (pan)
 *   - النقر المزدوج للتكبير السريع
 *   - إغلاق بمفتاح Escape أو النقر خارج الصورة
 *   - RTL كامل + خط عربي
 */
function ImageViewerModal({
  open,
  imageUrl,
  altText = 'صورة المنشور',
  onClose,
  onRepost,
  onDelete,
  canDelete = false,
  fileName = 'yamshat-image',
}) {
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [toast, setToast] = useState('');
  const dragStart = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const pinchStart = useRef({ dist: 0, scale: 1 });
  const imgRef = useRef(null);

  // إعادة الضبط عند الفتح/الإغلاق
  useEffect(() => {
    if (open) {
      setScale(1);
      setTranslate({ x: 0, y: 0 });
      // منع التمرير في الخلفية
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // إغلاق بمفتاح Escape
  useEffect(() => {
    if (!open) return undefined;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose?.();
      if (e.key === '+' || e.key === '=') zoomIn();
      if (e.key === '-' || e.key === '_') zoomOut();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2200);
  };

  const zoomIn = useCallback(() => {
    setScale((s) => Math.min(5, +(s + 0.25).toFixed(2)));
  }, []);
  const zoomOut = useCallback(() => {
    setScale((s) => {
      const next = Math.max(0.5, +(s - 0.25).toFixed(2));
      if (next <= 1) setTranslate({ x: 0, y: 0 });
      return next;
    });
  }, []);

  // النقر المزدوج لتبديل التكبير
  const handleDoubleClick = () => {
    if (scale === 1) setScale(2.2);
    else { setScale(1); setTranslate({ x: 0, y: 0 }); }
  };

  // عجلة الفأرة
  const handleWheel = (e) => {
    e.preventDefault();
    if (e.deltaY < 0) zoomIn();
    else zoomOut();
  };

  // السحب (Pan) عند التكبير
  const handleMouseDown = (e) => {
    if (scale <= 1) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, tx: translate.x, ty: translate.y };
  };
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setTranslate({ x: dragStart.current.tx + dx, y: dragStart.current.ty + dy });
  };
  const handleMouseUp = () => setIsDragging(false);

  // اللمس (Touch) — pinch + pan
  const getDist = (touches) => {
    const [a, b] = touches;
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  };
  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      pinchStart.current = { dist: getDist(e.touches), scale };
    } else if (e.touches.length === 1 && scale > 1) {
      setIsDragging(true);
      const t = e.touches[0];
      dragStart.current = { x: t.clientX, y: t.clientY, tx: translate.x, ty: translate.y };
    }
  };
  const handleTouchMove = (e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const d = getDist(e.touches);
      const ratio = d / (pinchStart.current.dist || 1);
      const next = Math.max(0.5, Math.min(5, +(pinchStart.current.scale * ratio).toFixed(2)));
      setScale(next);
      if (next <= 1) setTranslate({ x: 0, y: 0 });
    } else if (e.touches.length === 1 && isDragging) {
      const t = e.touches[0];
      const dx = t.clientX - dragStart.current.x;
      const dy = t.clientY - dragStart.current.y;
      setTranslate({ x: dragStart.current.tx + dx, y: dragStart.current.ty + dy });
    }
  };
  const handleTouchEnd = () => setIsDragging(false);

  // حفظ إلى الهاتف
  const handleDownload = async () => {
    if (!imageUrl) return;
    try {
      const res = await fetch(imageUrl, { mode: 'cors', credentials: 'omit' });
      if (!res.ok) throw new Error('fetch-failed');
      const blob = await res.blob();
      const ext = (blob.type.split('/')[1] || 'jpg').split('+')[0];
      const safeName = String(fileName || 'yamshat-image').replace(/[^a-zA-Z0-9-_]/g, '_');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${safeName}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 3000);
      showToast('تم حفظ الصورة');
    } catch (err) {
      // fallback: افتح الصورة في تبويب جديد ليحفظها المستخدم يدوياً
      try {
        const a = document.createElement('a');
        a.href = imageUrl;
        a.download = fileName || 'yamshat-image';
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showToast('جاري التحميل...');
      } catch {
        showToast('تعذّر حفظ الصورة');
      }
    }
  };

  const handleRepost = () => {
    onRepost?.();
    showToast('جاري إعادة النشر...');
  };

  const handleDelete = () => {
    if (!canDelete) return;
    if (window.confirm('هل تريد حذف هذا المنشور؟')) {
      onDelete?.();
      onClose?.();
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose?.();
  };

  if (!open || !imageUrl) return null;

  return (
    <div
      className="ym-imgviewer-backdrop"
      dir="rtl"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="عارض الصور"
    >
      {/* ============ شريط الأزرار العلوي ============ */}
      <div className="ym-imgviewer-toolbar" dir="rtl">
        <button
          type="button"
          className="ym-imgviewer-btn"
          aria-label="إغلاق"
          onClick={onClose}
          title="إغلاق"
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="ym-imgviewer-actions">
          <button
            type="button"
            className="ym-imgviewer-btn"
            aria-label="تكبير"
            onClick={zoomIn}
            title="تكبير"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="11" y1="8" x2="11" y2="14" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
          </button>

          <button
            type="button"
            className="ym-imgviewer-btn"
            aria-label="تصغير"
            onClick={zoomOut}
            title="تصغير"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
          </button>

          <button
            type="button"
            className="ym-imgviewer-btn"
            aria-label="حفظ إلى الهاتف"
            onClick={handleDownload}
            title="حفظ إلى الهاتف"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </button>

          <button
            type="button"
            className="ym-imgviewer-btn"
            aria-label="إعادة نشر"
            onClick={handleRepost}
            title="إعادة نشر"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="17 1 21 5 17 9" />
              <path d="M3 11V9a4 4 0 0 1 4-4h14" />
              <polyline points="7 23 3 19 7 15" />
              <path d="M21 13v2a4 4 0 0 1-4 4H3" />
            </svg>
          </button>

          {canDelete && (
            <button
              type="button"
              className="ym-imgviewer-btn is-danger"
              aria-label="حذف"
              onClick={handleDelete}
              title="حذف"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6" />
                <path d="M14 11v6" />
                <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ============ حاوية الصورة ============ */}
      <div
        className="ym-imgviewer-stage"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onDoubleClick={handleDoubleClick}
        onClick={handleBackdropClick}
      >
        <img
          ref={imgRef}
          src={imageUrl}
          alt={altText}
          draggable={false}
          className="ym-imgviewer-img"
          style={{
            transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
            cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
            transition: isDragging ? 'none' : 'transform 0.18s ease-out',
          }}
        />
      </div>

      {/* ============ مؤشر التكبير ============ */}
      <div className="ym-imgviewer-scale-badge">{Math.round(scale * 100)}%</div>

      {/* ============ Toast ============ */}
      {toast && <div className="ym-imgviewer-toast">{toast}</div>}

      <style>{`
        .ym-imgviewer-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.96);
          z-index: 9999;
          display: flex;
          flex-direction: column;
          animation: ym-iv-fade 0.18s ease-out;
          font-family: 'Noto Sans Arabic', 'Tajawal', 'Cairo', system-ui, sans-serif;
        }
        @keyframes ym-iv-fade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .ym-imgviewer-toolbar {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 14px;
          background: linear-gradient(180deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 100%);
          z-index: 2;
          gap: 8px;
        }
        .ym-imgviewer-actions {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }
        .ym-imgviewer-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.14);
          background: rgba(255,255,255,0.08);
          color: #fff;
          cursor: pointer;
          transition: background 0.15s ease, transform 0.1s ease, color 0.15s ease;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
          backdrop-filter: blur(8px);
        }
        .ym-imgviewer-btn:hover {
          background: rgba(139, 92, 246, 0.28);
          color: #fff;
        }
        .ym-imgviewer-btn:active {
          transform: scale(0.92);
        }
        .ym-imgviewer-btn.is-danger {
          background: rgba(239, 68, 68, 0.15);
          border-color: rgba(239, 68, 68, 0.35);
          color: #fecaca;
        }
        .ym-imgviewer-btn.is-danger:hover {
          background: rgba(239, 68, 68, 0.35);
          color: #fff;
        }
        .ym-imgviewer-stage {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          touch-action: none;
          user-select: none;
          -webkit-user-select: none;
          position: relative;
        }
        .ym-imgviewer-img {
          max-width: 100%;
          max-height: 100%;
          width: auto;
          height: auto;
          object-fit: contain;
          display: block;
          transform-origin: center center;
          will-change: transform;
          -webkit-user-drag: none;
          pointer-events: auto;
        }
        .ym-imgviewer-scale-badge {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0,0,0,0.65);
          color: #fff;
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 0.82rem;
          font-weight: 600;
          font-variant-numeric: tabular-nums;
          border: 1px solid rgba(255,255,255,0.12);
          pointer-events: none;
          backdrop-filter: blur(6px);
        }
        .ym-imgviewer-toast {
          position: absolute;
          bottom: 70px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(15, 20, 34, 0.95);
          color: #fff;
          padding: 10px 18px;
          border-radius: 12px;
          font-size: 0.88rem;
          font-weight: 600;
          border: 1px solid rgba(139, 92, 246, 0.35);
          box-shadow: 0 10px 32px rgba(0,0,0,0.55);
          animation: ym-iv-toast 0.24s ease-out;
          z-index: 10;
        }
        @keyframes ym-iv-toast {
          from { opacity: 0; transform: translate(-50%, 10px); }
          to   { opacity: 1; transform: translate(-50%, 0); }
        }

        /* شاشات صغيرة */
        @media (max-width: 400px) {
          .ym-imgviewer-btn { width: 40px; height: 40px; }
          .ym-imgviewer-toolbar { padding: 10px 10px; }
          .ym-imgviewer-actions { gap: 4px; }
        }
        @media (max-width: 340px) {
          .ym-imgviewer-btn { width: 38px; height: 38px; }
          .ym-imgviewer-actions { gap: 3px; }
        }
      `}</style>
    </div>
  );
}

export default ImageViewerModal;
