import { useEffect, useMemo, useRef, useState } from 'react';

/**
 * MediaPreviewModal
 * --------------------------------------------------------------------------
 * نافذة معاينة قبل إرسال الصور/الفيديوهات/الملفات داخل الدردشة أو المجموعات.
 * تعرض الملفات المختارة مع إمكانية:
 *  - إضافة تسمية توضيحية (caption)
 *  - إضافة المزيد من الملفات
 *  - إزالة ملف
 *  - الإلغاء (تراجع كامل)
 *  - الإرسال النهائي
 *
 * تستخدم في كل من Chat.jsx (الدردشة الخاصة) و GroupChat.jsx (المجموعات).
 *
 * Props:
 *   files        : File[]                       — قائمة الملفات المختارة
 *   onCancel     : () => void                   — إلغاء كامل
 *   onSend       : (files, caption) => void     — إرسال نهائي
 *   onAddMore    : () => void                   — فتح مربع اختيار ملفات إضافي
 *   onRemove     : (index) => void              — إزالة ملف من القائمة
 *   accept       : string                       — أنواع mime المسموحة (default image/video)
 */
export default function MediaPreviewModal({
  files = [],
  onCancel,
  onSend,
  onAddMore,
  onRemove,
  accept = 'image/*,video/*',
}) {
  const [caption, setCaption] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const previewUrlsRef = useRef([]);

  // بناء روابط المعاينة + تنظيفها عند الإغلاق
  const previews = useMemo(() => {
    // نظّف القديم
    previewUrlsRef.current.forEach((u) => {
      try { URL.revokeObjectURL(u); } catch {}
    });
    const urls = files.map((f) => {
      if (!f) return { url: '', kind: 'file' };
      if (f.type?.startsWith('image/')) return { url: URL.createObjectURL(f), kind: 'image' };
      if (f.type?.startsWith('video/')) return { url: URL.createObjectURL(f), kind: 'video' };
      return { url: '', kind: 'file' };
    });
    previewUrlsRef.current = urls.map((u) => u.url).filter(Boolean);
    return urls;
  }, [files]);

  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach((u) => {
        try { URL.revokeObjectURL(u); } catch {}
      });
    };
  }, []);

  // الحفاظ على فهرس صالح إذا تغيّرت القائمة
  useEffect(() => {
    if (activeIndex >= files.length) setActiveIndex(Math.max(0, files.length - 1));
  }, [files.length, activeIndex]);

  if (!files.length) return null;

  const activeFile = files[activeIndex];
  const activePreview = previews[activeIndex] || { url: '', kind: 'file' };

  const handleEscape = (e) => {
    if (e.key === 'Escape') onCancel?.();
  };

  return (
    <div
      className="yam-media-preview-overlay"
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-label="معاينة قبل الإرسال"
      onKeyDown={handleEscape}
    >
      <style>{`
        .yam-media-preview-overlay {
          position: fixed; inset: 0; z-index: 9999;
          background: rgba(0,0,0,0.92);
          display: flex; flex-direction: column;
          font-family: 'Noto Sans Arabic', 'Cairo', 'Tahoma', sans-serif;
          color: #fff;
          animation: yam-fade-in 0.2s ease;
        }
        @keyframes yam-fade-in { from { opacity: 0; } to { opacity: 1; } }

        .yam-media-preview-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 18px;
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .yam-media-preview-header button {
          background: transparent; border: none; color: #fff;
          font-size: 26px; cursor: pointer; padding: 6px 10px;
          border-radius: 10px; transition: background 0.15s;
        }
        .yam-media-preview-header button:hover { background: rgba(255,255,255,0.12); }
        .yam-media-preview-header .title {
          font-size: 16px; font-weight: 600;
        }
        .yam-media-preview-header .counter {
          font-size: 13px; opacity: 0.7; margin-inline-start: 8px;
        }

        .yam-media-preview-stage {
          flex: 1;
          display: flex; align-items: center; justify-content: center;
          padding: 24px;
          overflow: hidden;
          position: relative;
        }
        .yam-media-preview-stage img,
        .yam-media-preview-stage video {
          max-width: 100%; max-height: 100%;
          object-fit: contain;
          border-radius: 14px;
          box-shadow: 0 12px 40px rgba(0,0,0,0.6);
        }
        .yam-media-preview-stage .file-card {
          background: rgba(255,255,255,0.08);
          padding: 30px 36px; border-radius: 16px;
          display: flex; flex-direction: column; align-items: center; gap: 12px;
          max-width: 80%;
        }
        .yam-media-preview-stage .file-card .icon { font-size: 64px; }
        .yam-media-preview-stage .file-card .name { font-size: 16px; word-break: break-all; text-align: center; }
        .yam-media-preview-stage .file-card .size { font-size: 13px; opacity: 0.7; }

        .yam-media-preview-thumbs {
          display: flex; gap: 10px;
          padding: 12px 18px;
          overflow-x: auto;
          background: rgba(0,0,0,0.4);
          border-top: 1px solid rgba(255,255,255,0.08);
        }
        .yam-media-preview-thumbs::-webkit-scrollbar { height: 4px; }
        .yam-media-preview-thumbs::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 4px; }

        .yam-thumb {
          position: relative;
          width: 64px; height: 64px;
          border-radius: 10px;
          overflow: hidden;
          flex-shrink: 0;
          cursor: pointer;
          border: 2px solid transparent;
          background: rgba(255,255,255,0.06);
          transition: border-color 0.15s, transform 0.15s;
        }
        .yam-thumb:hover { transform: translateY(-2px); }
        .yam-thumb.active { border-color: #22c55e; }
        .yam-thumb img,
        .yam-thumb video {
          width: 100%; height: 100%; object-fit: cover;
        }
        .yam-thumb .file-icon {
          width: 100%; height: 100%;
          display: flex; align-items: center; justify-content: center;
          font-size: 24px;
        }
        .yam-thumb .remove {
          position: absolute; top: 2px; inset-inline-end: 2px;
          width: 20px; height: 20px;
          border-radius: 50%;
          background: rgba(0,0,0,0.7);
          color: #fff; border: none;
          font-size: 12px; line-height: 1;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
        }
        .yam-thumb .remove:hover { background: #ef4444; }

        .yam-thumb-add {
          width: 64px; height: 64px;
          border-radius: 10px;
          border: 2px dashed rgba(255,255,255,0.3);
          background: transparent;
          color: #fff;
          font-size: 28px;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          transition: border-color 0.15s, background 0.15s;
        }
        .yam-thumb-add:hover {
          border-color: #22c55e;
          background: rgba(34,197,94,0.1);
        }

        .yam-media-preview-footer {
          display: flex; align-items: center; gap: 10px;
          padding: 14px 16px;
          background: linear-gradient(0deg, rgba(0,0,0,0.85), rgba(0,0,0,0.7));
          border-top: 1px solid rgba(255,255,255,0.08);
        }
        .yam-caption-input {
          flex: 1;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 22px;
          padding: 10px 16px;
          color: #fff;
          font-family: inherit;
          font-size: 15px;
          resize: none;
          max-height: 120px;
          min-height: 44px;
          outline: none;
          transition: border-color 0.15s, background 0.15s;
        }
        .yam-caption-input:focus {
          border-color: #22c55e;
          background: rgba(255,255,255,0.14);
        }
        .yam-caption-input::placeholder { color: rgba(255,255,255,0.5); }

        .yam-send-btn {
          width: 48px; height: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, #22c55e, #16a34a);
          border: none;
          color: #fff;
          font-size: 22px;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 12px rgba(34,197,94,0.4);
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .yam-send-btn:hover { transform: scale(1.05); }
        .yam-send-btn:active { transform: scale(0.95); }
        .yam-send-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        @media (max-width: 600px) {
          .yam-media-preview-header { padding: 10px 14px; }
          .yam-media-preview-header .title { font-size: 14px; }
          .yam-media-preview-stage { padding: 12px; }
          .yam-thumb, .yam-thumb-add { width: 54px; height: 54px; }
        }
      `}</style>

      {/* Header */}
      <div className="yam-media-preview-header">
        <button type="button" onClick={onCancel} aria-label="إلغاء وإغلاق">×</button>
        <div>
          <span className="title">معاينة قبل الإرسال</span>
          <span className="counter">({activeIndex + 1} / {files.length})</span>
        </div>
        <div style={{ width: 40 }} />
      </div>

      {/* Stage */}
      <div className="yam-media-preview-stage">
        {activePreview.kind === 'image' && activePreview.url ? (
          <img src={activePreview.url} alt={activeFile?.name || 'معاينة'} />
        ) : activePreview.kind === 'video' && activePreview.url ? (
          <video src={activePreview.url} controls playsInline />
        ) : (
          <div className="file-card">
            <span className="icon">📎</span>
            <span className="name">{activeFile?.name || 'ملف'}</span>
            <span className="size">
              {((activeFile?.size || 0) / 1024 / 1024).toFixed(2)} MB
            </span>
          </div>
        )}
      </div>

      {/* Thumbs */}
      <div className="yam-media-preview-thumbs">
        {files.map((file, idx) => {
          const p = previews[idx] || {};
          return (
            <div
              key={`thumb-${idx}`}
              className={`yam-thumb ${idx === activeIndex ? 'active' : ''}`}
              onClick={() => setActiveIndex(idx)}
              role="button"
              tabIndex={0}
            >
              {p.kind === 'image' && p.url ? (
                <img src={p.url} alt="" />
              ) : p.kind === 'video' && p.url ? (
                <video src={p.url} muted />
              ) : (
                <div className="file-icon">📄</div>
              )}
              <button
                type="button"
                className="remove"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove?.(idx);
                }}
                aria-label="إزالة"
              >×</button>
            </div>
          );
        })}
        {onAddMore ? (
          <button
            type="button"
            className="yam-thumb-add"
            onClick={onAddMore}
            aria-label="إضافة المزيد"
          >+</button>
        ) : null}
      </div>

      {/* Footer: Caption + Send */}
      <div className="yam-media-preview-footer">
        <textarea
          className="yam-caption-input"
          dir="rtl"
          placeholder="أضف تعليقاً (اختياري)..."
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={1}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSend?.(files, caption);
            }
          }}
        />
        <button
          type="button"
          className="yam-send-btn"
          onClick={() => onSend?.(files, caption)}
          disabled={!files.length}
          aria-label="إرسال"
          title="إرسال"
        >
          ➤
        </button>
      </div>
    </div>
  );
}
