import { E as reactExports, I as jsxRuntimeExports } from "../index-DRmq1dbV.js";
function MediaPreviewModal({
  files = [],
  onCancel,
  onSend,
  onAddMore,
  onRemove,
  accept = "image/*,video/*"
}) {
  const [caption, setCaption] = reactExports.useState("");
  const [activeIndex, setActiveIndex] = reactExports.useState(0);
  const previewUrlsRef = reactExports.useRef([]);
  const previews = reactExports.useMemo(() => {
    previewUrlsRef.current.forEach((u) => {
      try {
        URL.revokeObjectURL(u);
      } catch {
      }
    });
    const urls = files.map((f) => {
      if (!f) return { url: "", kind: "file" };
      if (f.type?.startsWith("image/")) return { url: URL.createObjectURL(f), kind: "image" };
      if (f.type?.startsWith("video/")) return { url: URL.createObjectURL(f), kind: "video" };
      return { url: "", kind: "file" };
    });
    previewUrlsRef.current = urls.map((u) => u.url).filter(Boolean);
    return urls;
  }, [files]);
  reactExports.useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach((u) => {
        try {
          URL.revokeObjectURL(u);
        } catch {
        }
      });
    };
  }, []);
  reactExports.useEffect(() => {
    if (activeIndex >= files.length) setActiveIndex(Math.max(0, files.length - 1));
  }, [files.length, activeIndex]);
  if (!files.length) return null;
  const activeFile = files[activeIndex];
  const activePreview = previews[activeIndex] || { url: "", kind: "file" };
  const handleEscape = (e) => {
    if (e.key === "Escape") onCancel?.();
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: "yam-media-preview-overlay",
      dir: "rtl",
      role: "dialog",
      "aria-modal": "true",
      "aria-label": "معاينة قبل الإرسال",
      onKeyDown: handleEscape,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
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
      ` }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-media-preview-header", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: onCancel, "aria-label": "إلغاء وإغلاق", children: "×" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "title", children: "معاينة قبل الإرسال" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "counter", children: [
              "(",
              activeIndex + 1,
              " / ",
              files.length,
              ")"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: 40 } })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-media-preview-stage", children: activePreview.kind === "image" && activePreview.url ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: activePreview.url, alt: activeFile?.name || "معاينة" }) : activePreview.kind === "video" && activePreview.url ? /* @__PURE__ */ jsxRuntimeExports.jsx("video", { src: activePreview.url, controls: true, playsInline: true }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "file-card", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "icon", children: "📎" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "name", children: activeFile?.name || "ملف" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "size", children: [
            ((activeFile?.size || 0) / 1024 / 1024).toFixed(2),
            " MB"
          ] })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-media-preview-thumbs", children: [
          files.map((file, idx) => {
            const p = previews[idx] || {};
            return /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                className: `yam-thumb ${idx === activeIndex ? "active" : ""}`,
                onClick: () => setActiveIndex(idx),
                role: "button",
                tabIndex: 0,
                children: [
                  p.kind === "image" && p.url ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: p.url, alt: "" }) : p.kind === "video" && p.url ? /* @__PURE__ */ jsxRuntimeExports.jsx("video", { src: p.url, muted: true }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "file-icon", children: "📄" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      type: "button",
                      className: "remove",
                      onClick: (e) => {
                        e.stopPropagation();
                        onRemove?.(idx);
                      },
                      "aria-label": "إزالة",
                      children: "×"
                    }
                  )
                ]
              },
              `thumb-${idx}`
            );
          }),
          onAddMore ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              className: "yam-thumb-add",
              onClick: onAddMore,
              "aria-label": "إضافة المزيد",
              children: "+"
            }
          ) : null
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-media-preview-footer", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "textarea",
            {
              className: "yam-caption-input",
              dir: "rtl",
              placeholder: "أضف تعليقاً (اختياري)...",
              value: caption,
              onChange: (e) => setCaption(e.target.value),
              rows: 1,
              onKeyDown: (e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSend?.(files, caption);
                }
              }
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              className: "yam-send-btn",
              onClick: () => onSend?.(files, caption),
              disabled: !files.length,
              "aria-label": "إرسال",
              title: "إرسال",
              children: "➤"
            }
          )
        ] })
      ]
    }
  );
}
function MessageActionsToolbar({
  selectedMessage,
  onClose,
  onForward,
  onDelete,
  onStar,
  onReply,
  onCopy,
  onPin,
  onInfo,
  onReport
}) {
  const [menuOpen, setMenuOpen] = reactExports.useState(false);
  const menuRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [menuOpen]);
  if (!selectedMessage) return null;
  const wrap = (fn) => () => {
    setMenuOpen(false);
    fn?.(selectedMessage);
    onClose?.();
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: "yam-msg-actions-toolbar",
      dir: "rtl",
      role: "toolbar",
      "aria-label": "إجراءات الرسالة",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
        .yam-msg-actions-toolbar {
          position: absolute; top: 0; inset-inline: 0;
          height: 56px;
          background: linear-gradient(135deg, #1e293b, #0f172a);
          color: #fff;
          display: flex; align-items: center;
          padding: 0 12px;
          gap: 4px;
          z-index: 50;
          font-family: 'Noto Sans Arabic', 'Cairo', 'Tahoma', sans-serif;
          box-shadow: 0 4px 14px rgba(0,0,0,0.35);
          animation: yam-slide-down 0.18s ease;
        }
        @keyframes yam-slide-down {
          from { transform: translateY(-100%); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
        }
        .yam-msg-actions-toolbar .icon-btn {
          width: 40px; height: 40px;
          border-radius: 10px;
          background: transparent;
          border: none;
          color: #fff;
          font-size: 19px;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.15s;
        }
        .yam-msg-actions-toolbar .icon-btn:hover {
          background: rgba(255,255,255,0.1);
        }
        .yam-msg-actions-toolbar .spacer { flex: 1; }
        .yam-msg-actions-toolbar .count-label {
          font-size: 15px; font-weight: 600;
          margin-inline-start: 8px;
        }
        .yam-msg-actions-menu {
          position: absolute;
          top: 56px;
          inset-inline-end: 8px;
          background: #1e293b;
          border-radius: 10px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          min-width: 200px;
          padding: 6px;
          z-index: 60;
          animation: yam-pop 0.15s ease;
        }
        @keyframes yam-pop {
          from { transform: scale(0.92); opacity: 0; }
          to   { transform: scale(1); opacity: 1; }
        }
        .yam-msg-actions-menu button {
          width: 100%;
          text-align: start;
          background: transparent;
          border: none;
          color: #fff;
          padding: 10px 14px;
          font-size: 14px;
          border-radius: 8px;
          cursor: pointer;
          font-family: inherit;
          display: flex; align-items: center; gap: 10px;
          transition: background 0.12s;
        }
        .yam-msg-actions-menu button:hover { background: rgba(255,255,255,0.08); }
        .yam-msg-actions-menu button .em { font-size: 17px; width: 22px; text-align: center; }
        .yam-msg-actions-menu button.danger { color: #fca5a5; }
        .yam-msg-actions-menu .divider {
          height: 1px; background: rgba(255,255,255,0.08);
          margin: 4px 0;
        }
      ` }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            className: "icon-btn",
            onClick: onClose,
            "aria-label": "إلغاء التحديد",
            title: "إلغاء",
            children: "×"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "count-label", children: "1" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "spacer" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            className: "icon-btn",
            onClick: wrap(onForward),
            "aria-label": "إعادة إرسال",
            title: "إعادة إرسال",
            children: "↪"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            className: "icon-btn",
            onClick: wrap(onDelete),
            "aria-label": "حذف",
            title: "حذف",
            children: "🗑"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            className: "icon-btn",
            onClick: wrap(onStar),
            "aria-label": "تمييز",
            title: "تمييز",
            children: "⭐"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            className: "icon-btn",
            onClick: wrap(onReply),
            "aria-label": "رد",
            title: "رد",
            children: "↩"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            className: "icon-btn",
            onClick: () => setMenuOpen((v) => !v),
            "aria-label": "المزيد",
            "aria-expanded": menuOpen,
            title: "المزيد",
            children: "⋮"
          }
        ),
        menuOpen ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-msg-actions-menu", ref: menuRef, role: "menu", dir: "rtl", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: wrap(onReply), role: "menuitem", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "em", children: "↩" }),
            " رد"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: wrap(onForward), role: "menuitem", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "em", children: "↪" }),
            " إعادة توجيه"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: wrap(onCopy), role: "menuitem", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "em", children: "📋" }),
            " نسخ"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: wrap(onStar), role: "menuitem", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "em", children: "⭐" }),
            " تمييز بنجمة"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: wrap(onPin), role: "menuitem", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "em", children: "📌" }),
            " تثبيت"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: wrap(onInfo), role: "menuitem", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "em", children: "ⓘ" }),
            " معلومات"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "divider" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: wrap(onReport), role: "menuitem", className: "danger", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "em", children: "⚠" }),
            " إبلاغ"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: wrap(onDelete), role: "menuitem", className: "danger", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "em", children: "🗑" }),
            " حذف"
          ] })
        ] }) : null
      ]
    }
  );
}
const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏", "🔥"];
const EXTENDED_EMOJIS = [
  "👍",
  "👎",
  "❤️",
  "🔥",
  "😂",
  "😍",
  "😮",
  "😢",
  "😡",
  "🙏",
  "👏",
  "💯",
  "🎉",
  "🤔",
  "😎",
  "😱",
  "🥰",
  "😭",
  "🤣",
  "💔",
  "✨",
  "💪",
  "🙌",
  "👌",
  "✅",
  "❌",
  "⭐",
  "💜",
  "💙",
  "💚"
];
function MessageReactionPicker({
  anchorRect,
  onPick,
  onClose,
  onOpenMore
}) {
  const [showExtended, setShowExtended] = reactExports.useState(false);
  const ref = reactExports.useRef(null);
  reactExports.useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose?.();
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    const esc = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
      document.removeEventListener("keydown", esc);
    };
  }, [onClose]);
  if (!anchorRect) return null;
  const top = Math.max(70, anchorRect.top - 60);
  const left = Math.max(12, Math.min(anchorRect.left, window.innerWidth - 360));
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      ref,
      className: "yam-reaction-picker",
      dir: "rtl",
      role: "dialog",
      "aria-label": "اختر تفاعلاً",
      style: { top: `${top}px`, left: `${left}px` },
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
        .yam-reaction-picker {
          position: fixed;
          background: #1e293b;
          border-radius: 28px;
          padding: 8px 12px;
          display: flex; align-items: center; gap: 4px;
          box-shadow: 0 12px 32px rgba(0,0,0,0.5);
          z-index: 70;
          font-family: 'Noto Sans Arabic', 'Cairo', 'Tahoma', sans-serif;
          animation: yam-pop-in 0.16s ease;
          max-width: calc(100vw - 24px);
        }
        @keyframes yam-pop-in {
          from { transform: scale(0.6) translateY(8px); opacity: 0; }
          to   { transform: scale(1) translateY(0); opacity: 1; }
        }
        .yam-reaction-picker .emoji-btn {
          background: transparent;
          border: none;
          font-size: 24px;
          width: 38px; height: 38px;
          border-radius: 50%;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: transform 0.15s, background 0.15s;
          padding: 0;
        }
        .yam-reaction-picker .emoji-btn:hover {
          transform: scale(1.25);
          background: rgba(255,255,255,0.08);
        }
        .yam-reaction-picker .more-btn {
          width: 34px; height: 34px;
          border-radius: 50%;
          background: rgba(255,255,255,0.08);
          color: #fff;
          font-size: 18px;
          border: none;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          margin-inline-start: 4px;
          transition: background 0.15s;
        }
        .yam-reaction-picker .more-btn:hover {
          background: rgba(255,255,255,0.16);
        }

        .yam-reaction-extended {
          position: fixed;
          background: #1e293b;
          border-radius: 16px;
          padding: 14px;
          box-shadow: 0 12px 32px rgba(0,0,0,0.55);
          z-index: 75;
          font-family: 'Noto Sans Arabic', 'Cairo', 'Tahoma', sans-serif;
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 4px;
          max-width: 320px;
        }
        .yam-reaction-extended .emoji-btn {
          background: transparent;
          border: none;
          font-size: 22px;
          width: 40px; height: 40px;
          border-radius: 50%;
          cursor: pointer;
          transition: transform 0.15s, background 0.15s;
          padding: 0;
        }
        .yam-reaction-extended .emoji-btn:hover {
          transform: scale(1.2);
          background: rgba(255,255,255,0.08);
        }
      ` }),
        !showExtended ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          QUICK_EMOJIS.map((e) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              className: "emoji-btn",
              onClick: () => {
                onPick?.(e);
                onClose?.();
              },
              "aria-label": `تفاعل ${e}`,
              children: e
            },
            e
          )),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              className: "more-btn",
              onClick: () => {
                if (onOpenMore) {
                  onOpenMore();
                  onClose?.();
                } else setShowExtended(true);
              },
              "aria-label": "المزيد من الإيموجي",
              children: "+"
            }
          )
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: "yam-reaction-extended",
            dir: "rtl",
            style: { position: "static", boxShadow: "none", padding: 0, background: "transparent" },
            children: EXTENDED_EMOJIS.map((e) => /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                className: "emoji-btn",
                onClick: () => {
                  onPick?.(e);
                  onClose?.();
                },
                "aria-label": `تفاعل ${e}`,
                children: e
              },
              e
            ))
          }
        )
      ]
    }
  );
}
export {
  MessageActionsToolbar as M,
  MessageReactionPicker as a,
  MediaPreviewModal as b
};
