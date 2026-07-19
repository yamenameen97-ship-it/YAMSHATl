import { useEffect, useState } from 'react';

/**
 * Controlled image viewer used by both desktop and mobile post cards.
 * Kept self-contained so a missing legacy viewer cannot break the feed build.
 */
export default function ImageViewerModal({
  open = false,
  imageUrl = '',
  altText = 'صورة منشور',
  canDelete = false,
  onClose,
  onRepost,
  onDelete,
}) {
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (!open) return undefined;
    setZoom(1);
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open || !imageUrl) return null;

  const buttonStyle = {
    minWidth: 44,
    minHeight: 44,
    border: '1px solid rgba(255,255,255,.22)',
    borderRadius: 12,
    background: 'rgba(15,18,35,.82)',
    color: '#fff',
    padding: '8px 12px',
    font: 'inherit',
    cursor: 'pointer',
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={altText}
      dir="rtl"
      onClick={(event) => { if (event.target === event.currentTarget) onClose?.(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 12000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,.92)', padding: 16,
      }}
    >
      <img
        src={imageUrl}
        alt={altText}
        style={{
          maxWidth: '100%', maxHeight: '86dvh', objectFit: 'contain',
          transform: `scale(${zoom})`, transition: 'transform 160ms ease',
        }}
      />
      <div style={{ position: 'absolute', top: 16, insetInlineEnd: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="button" style={buttonStyle} aria-label="إغلاق" onClick={onClose}>×</button>
        <button type="button" style={buttonStyle} aria-label="تكبير" onClick={() => setZoom((value) => Math.min(3, value + .25))}>+</button>
        <button type="button" style={buttonStyle} aria-label="تصغير" onClick={() => setZoom((value) => Math.max(1, value - .25))}>−</button>
        {onRepost && <button type="button" style={buttonStyle} onClick={onRepost}>إعادة نشر</button>}
        {canDelete && onDelete && <button type="button" style={{ ...buttonStyle, color: '#fecaca' }} onClick={onDelete}>حذف</button>}
      </div>
    </div>
  );
}
