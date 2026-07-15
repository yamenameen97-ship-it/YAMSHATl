import { I as jsxRuntimeExports, ah as resolveMediaUrl, E as reactExports, G as useLocation, L as Link, by as NavLink, ag as reactDomExports, bb as useLanguage, bz as useReducedMotion, aB as motion } from "../index-DRmq1dbV.js";
import { s as statusColor } from "./YamshatDesign-COVLXNSC.js";
import { V as VoiceMessagePlayer } from "./VoiceMessagePlayer-DGEeX04l.js";
import { g as getTranslationPrefs, q as quickDetectLang, t as translateText } from "./translationService-tb0zyizg.js";
import { A as AnimatePresence } from "./index-CsbVSjc_.js";
function CallBubble({ call, onCallBack }) {
  if (!call) return null;
  const isVideo = call.mode === "video";
  const isMissed = call.status === "missed" || call.status === "canceled" || call.status === "declined";
  const isOutgoing = call.direction === "outgoing" || call.isMe;
  const icon = isVideo ? "🎥" : "📞";
  const arrow = isMissed ? isOutgoing ? "↗" : "↙" : isOutgoing ? "↗" : "↙";
  const title = isMissed ? isVideo ? "مكالمة فيديو فائتة" : "مكالمة صوتية فائتة" : isVideo ? "مكالمة فيديو" : "مكالمة صوتية";
  const subtitle = isMissed ? "اضغط لمعاودة الاتصال" : call.duration_sec ? formatDuration(call.duration_sec) : isOutgoing ? "لم يتم الرد" : "تم الرد";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: `yam-call-bubble ${call.isMe ? "me" : "them"} ${isMissed ? "missed" : ""}`,
      dir: "rtl",
      role: "button",
      tabIndex: 0,
      onClick: onCallBack,
      onKeyDown: (e) => {
        if (e.key === "Enter") onCallBack?.();
      },
      "aria-label": `${title} - ${subtitle}`,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
        .yam-call-bubble {
          display: inline-flex; align-items: center; gap: 12px;
          padding: 10px 14px;
          border-radius: 14px;
          font-family: 'Noto Sans Arabic', 'Cairo', 'Tahoma', sans-serif;
          cursor: pointer;
          max-width: 280px;
          min-width: 200px;
          transition: transform 0.12s, box-shadow 0.12s;
          border: 1px solid transparent;
        }
        .yam-call-bubble:hover { transform: translateY(-1px); }
        .yam-call-bubble.me {
          background: linear-gradient(135deg, rgba(34,197,94,0.18), rgba(16,185,129,0.10));
          border-color: rgba(34,197,94,0.3);
          color: #d1fae5;
        }
        .yam-call-bubble.them {
          background: rgba(255,255,255,0.06);
          border-color: rgba(255,255,255,0.1);
          color: #e5e7eb;
        }
        .yam-call-bubble.missed.me,
        .yam-call-bubble.missed.them {
          border-color: rgba(239,68,68,0.4);
          background: rgba(239,68,68,0.12);
          color: #fecaca;
        }
        .yam-call-bubble .icon-wrap {
          width: 40px; height: 40px;
          border-radius: 50%;
          background: rgba(255,255,255,0.08);
          display: flex; align-items: center; justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
        }
        .yam-call-bubble.missed .icon-wrap {
          background: rgba(239,68,68,0.2);
          color: #ef4444;
        }
        .yam-call-bubble .body {
          display: flex; flex-direction: column; gap: 2px;
          min-width: 0;
        }
        .yam-call-bubble .title-row {
          display: flex; align-items: center; gap: 6px;
          font-size: 14px; font-weight: 600;
        }
        .yam-call-bubble .arrow {
          font-size: 13px;
          opacity: 0.7;
        }
        .yam-call-bubble.missed .arrow { color: #ef4444; opacity: 1; }
        .yam-call-bubble .sub {
          font-size: 12px;
          opacity: 0.7;
        }
        .yam-call-bubble .time {
          font-size: 11px;
          opacity: 0.55;
          margin-inline-start: auto;
          white-space: nowrap;
        }
      ` }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "icon-wrap", "aria-hidden": "true", children: icon }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "body", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "title-row", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "arrow", children: arrow }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: title })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "sub", children: subtitle })
        ] }),
        call.time ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "time", children: call.time }) : null
      ]
    }
  );
}
function formatDuration(sec) {
  const s = Number(sec) || 0;
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m > 0) return `المدة: ${m}:${String(r).padStart(2, "0")}`;
  return `المدة: ${r} ث`;
}
const sizeMap = {
  xs: 28,
  sm: 36,
  md: 44,
  lg: 56,
  xl: 72
};
function Avatar({
  src,
  alt,
  name = "",
  size = "md",
  status = "offline",
  className = "",
  rounded = "full",
  icon = null,
  showStatus = false,
  ring = false,
  ringTone = "primary",
  ...props
}) {
  const resolvedSize = typeof size === "number" ? size : sizeMap[size] || sizeMap.md;
  const initial = String(name || alt || "Y").trim().charAt(0).toUpperCase() || "Y";
  const resolvedSrc = resolveMediaUrl(src);
  const [hasError, setHasError] = reactExports.useState(false);
  reactExports.useEffect(() => {
    setHasError(false);
  }, [resolvedSrc]);
  const showImage = Boolean(resolvedSrc) && !hasError;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "span",
    {
      className: `ui-avatar is-${rounded} ${ring ? `has-ring ring-${ringTone}` : ""} ${className}`.trim(),
      style: { "--avatar-size": `${resolvedSize}px` },
      "aria-label": alt || name || "avatar",
      ...props,
      children: [
        showImage ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          "img",
          {
            src: resolvedSrc,
            alt: alt || name || "avatar",
            loading: "lazy",
            onError: () => setHasError(true)
          }
        ) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ui-avatar-fallback", "aria-hidden": "true", children: icon || initial }),
        showStatus ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `ui-avatar-status is-${status}`, "aria-hidden": "true" }) : null
      ]
    }
  );
}
function BottomNav({ items = [], className = "" }) {
  const location = useLocation();
  if (!items.length) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "nav",
    {
      className: `ui-bottom-nav ${className}`.trim(),
      "aria-label": "التنقل السفلي",
      role: "navigation",
      children: items.map((item) => {
        const isActive = typeof item.match === "function" ? item.match(location.pathname) : location.pathname === item.to;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Link,
          {
            to: item.to,
            className: `ui-bottom-nav-item ${isActive ? "is-active" : ""}`.trim(),
            "aria-current": isActive ? "page" : void 0,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ui-bottom-nav-icon", "aria-hidden": "true", children: [
                item.icon,
                item.badge === "live" ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mobile-live-dot", "aria-hidden": "true" }) : null
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ui-bottom-nav-label", children: item.label }),
              item.badge !== "live" && item.badge ? /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { className: "ui-bottom-nav-badge", "aria-label": `${item.badge} غير مقروء`, children: item.badge }) : null
            ]
          },
          item.to
        );
      })
    }
  );
}
reactExports.memo(BottomNav);
function TopBar({
  brand = { to: "/", label: "YAMSHAT", icon: "👑" },
  navItems = [],
  mobileQuickLinks = null,
  trailingActions = null,
  account = null,
  className = ""
}) {
  const location = useLocation();
  return /* @__PURE__ */ jsxRuntimeExports.jsx("header", { className: `ui-topbar ${className}`.trim(), dir: "rtl", style: { fontFamily: "'Noto Sans Arabic', 'Tajawal', sans-serif" }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ui-topbar-track", dir: "rtl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Link,
      {
        to: brand.to,
        className: "ui-topbar-brand",
        "aria-label": brand.label,
        dir: "rtl",
        style: { fontFamily: "'Noto Sans Arabic', 'Tajawal', sans-serif" },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ui-topbar-brand-mark", "aria-hidden": "true", children: brand.icon }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ui-topbar-brand-copy", children: brand.label })
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("nav", { className: "ui-topbar-nav", "aria-label": "التنقل الرئيسي", children: navItems.map((item) => {
      const matched = typeof item.match === "function" ? item.match(location.pathname) : false;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs(
        NavLink,
        {
          to: item.to,
          className: ({ isActive }) => `ui-topbar-link ${isActive || matched ? "is-active" : ""}`.trim(),
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ui-topbar-link-icon", "aria-hidden": "true", children: item.icon }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: item.label }),
            item.badge ? /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { className: "ui-topbar-link-badge", children: item.badge }) : null
          ]
        },
        item.to
      );
    }) }),
    mobileQuickLinks ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ui-topbar-mobile-section", children: mobileQuickLinks }) : null,
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ui-topbar-actions", children: trailingActions }),
    account ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ui-topbar-account", children: account }) : null
  ] }) });
}
reactExports.memo(TopBar);
function SafeImage({
  src,
  alt = "صورة",
  onOpen,
  onLongPress,
  maxHeight = 340,
  className = ""
}) {
  const [state, setState] = reactExports.useState("loading");
  const [retryKey, setRetryKey] = reactExports.useState(0);
  reactExports.useEffect(() => {
    setState("loading");
  }, [src]);
  const handleLoad = () => setState("ok");
  const handleError = () => setState("error");
  const handleRetry = (e) => {
    e.stopPropagation();
    setState("loading");
    setRetryKey((k) => k + 1);
  };
  let pressTimer = null;
  const startPress = () => {
    if (!onLongPress) return;
    pressTimer = setTimeout(() => onLongPress(), 500);
  };
  const endPress = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: `yam-safe-image ${state} ${className}`,
      dir: "rtl",
      style: { maxHeight: `${maxHeight}px` },
      onClick: () => state === "ok" && onOpen?.(),
      onTouchStart: startPress,
      onTouchEnd: endPress,
      onTouchCancel: endPress,
      onMouseDown: startPress,
      onMouseUp: endPress,
      onMouseLeave: endPress,
      role: "button",
      tabIndex: 0,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
        /* ✅ v87.6: حاوية تتقلص لحجم الصورة تماماً (مثل واتساب) — بدون أي حواف زائدة */
        .yam-safe-image {
          position: relative;
          display: block;
          width: auto;
          max-width: min(280px, 68vw);
          min-width: 0;
          min-height: 0;
          height: auto;
          border-radius: 12px;
          overflow: hidden;
          background: transparent;
          padding: 0;
          margin: 0;
          line-height: 0;
          cursor: pointer;
          font-family: 'Noto Sans Arabic', 'Cairo', 'Tahoma', sans-serif;
        }
        /* أثناء التحميل فقط: مربع مؤقت خفيف — سيختفي عند 'ok' */
        .yam-safe-image.loading {
          min-width: 160px;
          min-height: 120px;
          background: rgba(255,255,255,0.06);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .yam-safe-image.ok {
          background: transparent;
          min-width: 0;
          min-height: 0;
        }
        .yam-safe-image.error {
          min-width: 160px;
          min-height: 90px;
          background: rgba(239,68,68,0.08);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .yam-safe-image img {
          display: block;
          width: 100%;
          max-width: 100%;
          height: auto;
          max-height: inherit;
          object-fit: cover;
          object-position: center;
          border-radius: 12px;
          -webkit-user-drag: none;
          user-select: none;
        }
        .yam-safe-image.loading::before {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(110deg, rgba(255,255,255,0.04) 30%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.04) 70%);
          background-size: 200% 100%;
          animation: yam-shimmer 1.2s infinite linear;
          border-radius: 12px;
          pointer-events: none;
        }
        @keyframes yam-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .yam-safe-image .yam-img-fallback {
          padding: 14px 12px;
          display: flex; flex-direction: column; gap: 6px;
          align-items: center; justify-content: center;
          color: #fca5a5;
          font-size: 13px;
          text-align: center;
          line-height: 1.35;
        }
        .yam-safe-image .yam-img-fallback .icon { font-size: 24px; }
        .yam-safe-image .yam-img-fallback button {
          margin-top: 4px;
          background: rgba(239,68,68,0.15);
          border: 1px solid rgba(239,68,68,0.4);
          color: #fecaca;
          padding: 5px 12px;
          border-radius: 16px;
          font-family: inherit;
          font-size: 12px;
          cursor: pointer;
        }
        .yam-safe-image .yam-img-fallback button:hover {
          background: rgba(239,68,68,0.25);
        }
      ` }),
        state !== "error" ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          "img",
          {
            src,
            alt,
            loading: "lazy",
            decoding: "async",
            referrerPolicy: "no-referrer",
            onLoad: handleLoad,
            onError: handleError,
            draggable: false
          },
          retryKey
        ) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-img-fallback", dir: "rtl", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "icon", "aria-hidden": "true", children: "🖼️" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "تعذّر تحميل الصورة" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: handleRetry, children: "إعادة المحاولة" })
        ] })
      ]
    }
  );
}
const QUICK_EMOJIS = ["❤️", "😂", "😮", "😢", "👍"];
function MessageContextPopup({
  anchorRect,
  isMe = false,
  message,
  onClose,
  onReact,
  onReply,
  onCopy,
  onEdit,
  onResend,
  onDelete,
  onDeleteForMe,
  onDeleteForEveryone
}) {
  const [showSubmenu, setShowSubmenu] = reactExports.useState(false);
  const [position, setPosition] = reactExports.useState({ top: 0, left: 0, submenuTop: 0, submenuLeft: 0 });
  const popupRef = reactExports.useRef(null);
  const submenuRef = reactExports.useRef(null);
  const moreBtnRef = reactExports.useRef(null);
  reactExports.useLayoutEffect(() => {
    if (!anchorRect) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const POPUP_WIDTH = Math.min(vw - 24, 340);
    const POPUP_HEIGHT = 150;
    const HEADER_SAFE = 72;
    const INPUT_SAFE = 110;
    const usableBottom = vh - INPUT_SAFE;
    let top = anchorRect.top - POPUP_HEIGHT - 12;
    if (top < HEADER_SAFE) {
      top = HEADER_SAFE;
    }
    if (top + POPUP_HEIGHT > usableBottom) {
      top = Math.max(HEADER_SAFE, usableBottom - POPUP_HEIGHT);
    }
    let left = anchorRect.left + anchorRect.width / 2 - POPUP_WIDTH / 2;
    left = Math.max(12, Math.min(left, vw - POPUP_WIDTH - 12));
    setPosition((prev) => ({ ...prev, top, left }));
  }, [anchorRect]);
  reactExports.useEffect(() => {
    const handler = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target) && (!submenuRef.current || !submenuRef.current.contains(e.target))) {
        onClose?.();
      }
    };
    const esc = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    const t = setTimeout(() => {
      document.addEventListener("mousedown", handler);
      document.addEventListener("touchstart", handler);
      document.addEventListener("keydown", esc);
    }, 50);
    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
      document.removeEventListener("keydown", esc);
    };
  }, [onClose]);
  if (!anchorRect) return null;
  if (typeof document === "undefined") return null;
  const handleEmojiClick = (emoji) => {
    onReact?.(emoji);
    onClose?.();
  };
  const handleAction = (fn) => () => {
    fn?.();
    onClose?.();
  };
  const toggleSubmenu = () => {
    if (!showSubmenu && moreBtnRef.current) {
      const rect = moreBtnRef.current.getBoundingClientRect();
      const vw = window.innerWidth;
      const SUBMENU_WIDTH = 220;
      const SUBMENU_HEIGHT = 200;
      const HEADER_SAFE = 64;
      let subLeft = rect.right - SUBMENU_WIDTH;
      subLeft = Math.max(12, Math.min(subLeft, vw - SUBMENU_WIDTH - 12));
      let subTop = rect.top - SUBMENU_HEIGHT - 6;
      if (subTop < HEADER_SAFE) {
        subTop = HEADER_SAFE;
      }
      setPosition((p) => ({
        ...p,
        submenuTop: subTop,
        submenuLeft: subLeft
      }));
    }
    setShowSubmenu((v) => !v);
  };
  return reactDomExports.createPortal(
    /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-msg-overlay", onClick: () => onClose?.() }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          ref: popupRef,
          className: "yam-msg-popup-container",
          dir: "rtl",
          role: "dialog",
          "aria-label": "خيارات الرسالة",
          style: {
            position: "fixed",
            top: `${position.top}px`,
            left: `${position.left}px`,
            zIndex: 9998,
            display: "flex",
            flexDirection: "column",
            gap: 6,
            fontFamily: "'Noto Sans Arabic', 'Cairo', sans-serif",
            animation: "ymPopIn 0.16s ease"
          },
          onClick: (e) => e.stopPropagation(),
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                className: "yam-reaction-picker v60",
                style: {
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 10px",
                  background: "#1F2230",
                  borderRadius: 999,
                  boxShadow: "0 12px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)",
                  gap: 2
                },
                children: [
                  QUICK_EMOJIS.map((e) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      type: "button",
                      className: "emoji-btn",
                      onClick: () => handleEmojiClick(e),
                      "aria-label": `تفاعل ${e}`,
                      style: {
                        width: 40,
                        height: 40,
                        background: "transparent",
                        border: "none",
                        fontSize: 24,
                        cursor: "pointer",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 0
                      },
                      children: e
                    },
                    e
                  )),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      type: "button",
                      className: "more-btn",
                      onClick: () => handleEmojiClick("🎉"),
                      "aria-label": "المزيد من الإيموجي",
                      style: {
                        width: 32,
                        height: 32,
                        background: "#2a2d3e",
                        color: "#d1d5db",
                        border: "none",
                        borderRadius: "50%",
                        fontSize: 20,
                        cursor: "pointer",
                        marginInlineStart: 4,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      },
                      children: "+"
                    }
                  )
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-msg-action-bar", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "ym-action-btn", onClick: handleAction(onReply), children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "icon", "aria-hidden": "true", children: "↩" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "label", children: "رد" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "ym-action-btn", onClick: handleAction(onCopy), children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "icon", "aria-hidden": "true", children: "⎘" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "label", children: "نسخ" })
              ] }),
              isMe && onEdit && !message?.deleted && !message?.media_url && !["image", "video", "audio", "voice", "file", "media"].includes(String(message?.type || "").toLowerCase()) ? /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "ym-action-btn", onClick: handleAction(onEdit), children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "icon", "aria-hidden": "true", children: "✎" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "label", children: "تعديل" })
              ] }) : null,
              isMe && onResend ? /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "ym-action-btn", onClick: handleAction(onResend), children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "icon", "aria-hidden": "true", children: "↻" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "label", children: "إعادة إرسال" })
              ] }) : null,
              /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "ym-action-btn", onClick: handleAction(onDelete || onDeleteForMe), children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "icon", "aria-hidden": "true", children: "🗑" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "label", children: "حذف" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  ref: moreBtnRef,
                  type: "button",
                  className: "ym-action-btn",
                  onClick: (e) => {
                    e.stopPropagation();
                    toggleSubmenu();
                  },
                  "aria-expanded": showSubmenu,
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "icon", "aria-hidden": "true", children: "⋯" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "label", children: "المزيد" })
                  ]
                }
              )
            ] })
          ]
        }
      ),
      showSubmenu ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          ref: submenuRef,
          className: "yam-msg-submenu",
          dir: "rtl",
          role: "menu",
          style: {
            top: `${position.submenuTop}px`,
            left: `${position.submenuLeft}px`
          },
          onClick: (e) => e.stopPropagation(),
          children: [
            isMe && onEdit && !message?.deleted && !message?.media_url && !["image", "video", "audio", "voice", "file", "media"].includes(String(message?.type || "").toLowerCase()) ? /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", role: "menuitem", onClick: handleAction(onEdit), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "تعديل لدى الجميع" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "icon", "aria-hidden": "true", children: "✎" })
            ] }) : null,
            isMe && onEdit && !message?.deleted && !message?.media_url && !["image", "video", "audio", "voice", "file", "media"].includes(String(message?.type || "").toLowerCase()) ? /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", role: "menuitem", onClick: handleAction(onEdit), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "تعديل لدي" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "icon", "aria-hidden": "true", children: "✎" })
            ] }) : null,
            isMe && onResend ? /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", role: "menuitem", onClick: handleAction(onResend), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "إعادة إرسال" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "icon", "aria-hidden": "true", children: "↻" })
            ] }) : null,
            isMe ? /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", role: "menuitem", className: "danger", onClick: handleAction(onDeleteForEveryone), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "حذف لدى الجميع" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "icon", "aria-hidden": "true", children: "🗑" })
            ] }) : null,
            /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", role: "menuitem", className: "danger", onClick: handleAction(onDeleteForMe), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "حذف لدي" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "icon", "aria-hidden": "true", children: "🗑" })
            ] })
          ]
        }
      ) : null
    ] }),
    document.body
  );
}
function MessageReadReceipts({
  message,
  currentUser,
  isMe: isMeProp,
  className = ""
}) {
  const isMine = reactExports.useMemo(() => {
    if (typeof isMeProp === "boolean") return isMeProp;
    if (message?.isMe === true) return true;
    const me = String(currentUser || "").trim().toLowerCase().replace(/^@/, "");
    const sender = String(
      message?.sender_username || message?.sender || message?.author || message?.from || ""
    ).trim().toLowerCase().replace(/^@/, "");
    return Boolean(me) && Boolean(sender) && me === sender;
  }, [isMeProp, currentUser, message]);
  const statusIcon = reactExports.useMemo(() => {
    if (!isMine) return null;
    const lifecycle = message?.lifecycle?.status || message?.status;
    if (lifecycle === "failed" || message?.failed) {
      return { icon: "✕", label: "فشل الإرسال", kind: "failed" };
    }
    if (lifecycle === "pending" || lifecycle === "sending" || message?.pending) {
      return { icon: "⏱", label: "قيد الإرسال", kind: "pending" };
    }
    if (message?.read_at || message?.read_receipt || message?.read_by_count > 0) {
      return { icon: "✓✓", label: "مقروءة", kind: "read", timestamp: message?.read_at };
    }
    if (message?.delivered_at || message?.delivered) {
      return { icon: "✓✓", label: "تم التسليم", kind: "delivered", timestamp: message?.delivered_at };
    }
    if (message?.sent_at || lifecycle === "sent" || message?.id) {
      return { icon: "✓", label: "مرسلة", kind: "sent", timestamp: message?.sent_at || message?.created_at };
    }
    return { icon: "⏱", label: "قيد الإرسال", kind: "pending" };
  }, [isMine, message]);
  if (!isMine || !statusIcon) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "span",
    {
      className: `message-read-receipts is-${statusIcon.kind} ${className}`,
      "data-status": statusIcon.kind,
      title: statusIcon.label,
      "aria-label": statusIcon.label,
      children: statusIcon.icon
    }
  );
}
const MessageReadReceipts$1 = reactExports.memo(MessageReadReceipts);
function MessageRetry({
  message,
  currentUser,
  onRetry,
  className = ""
}) {
  const isMine = message?.sender === currentUser;
  const isFailed = message?.status === "failed" || message?.lifecycle?.status === "failed";
  const [isRetrying, setIsRetrying] = reactExports.useState(false);
  const isMountedRef = reactExports.useRef(true);
  reactExports.useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  const errorMessage = message?.queue_error || message?.error || "فشل إرسال الرسالة";
  const handleRetry = reactExports.useCallback(async () => {
    if (!isFailed || isRetrying || !onRetry) return;
    setIsRetrying(true);
    try {
      await onRetry(message);
    } finally {
      if (isMountedRef.current) setIsRetrying(false);
    }
  }, [isFailed, isRetrying, message, onRetry]);
  if (!isMine || !isFailed) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `message-retry-container ${className}`, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "message-error-banner", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "error-icon", children: "⚠️" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "error-text", children: errorMessage }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        type: "button",
        className: `retry-button ${isRetrying ? "retrying" : ""}`,
        onClick: handleRetry,
        disabled: isRetrying,
        "aria-label": "إعادة محاولة إرسال الرسالة",
        children: isRetrying ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "spinner" }),
          "جاري الإرسال..."
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "retry-icon", children: "🔄" }),
          "إعادة محاولة"
        ] })
      }
    )
  ] }) });
}
const MessageRetry$1 = reactExports.memo(MessageRetry);
function useMessageTranslation(content, { skip = false, isMe = false } = {}) {
  const { lang: viewerLang } = useLanguage();
  const [state, setState] = reactExports.useState({
    loading: false,
    translated: "",
    detected: "unknown",
    provider: "idle"
  });
  const lastRequest = reactExports.useRef({ content: "", viewerLang: "" });
  const prefs = getTranslationPrefs();
  const autoTranslate = prefs.autoTranslate !== false;
  reactExports.useEffect(() => {
    if (skip || !autoTranslate) return void 0;
    const trimmed = String(content || "").trim();
    if (!trimmed) return void 0;
    if (isMe) return void 0;
    const detected = quickDetectLang(trimmed);
    if (detected === "unknown" || detected === viewerLang) {
      setState({ loading: false, translated: "", detected, provider: "noop" });
      return void 0;
    }
    if (lastRequest.current.content === trimmed && lastRequest.current.viewerLang === viewerLang) {
      return void 0;
    }
    lastRequest.current = { content: trimmed, viewerLang };
    let active = true;
    setState((prev) => ({ ...prev, loading: true, detected }));
    translateText(trimmed, viewerLang, detected).then((result) => {
      if (!active) return;
      if (!result || !result.text || result.text === trimmed) {
        setState({ loading: false, translated: "", detected, provider: result?.provider || "noop" });
        return;
      }
      setState({
        loading: false,
        translated: result.text,
        detected: result.detected || detected,
        provider: result.provider || "unknown"
      });
    }).catch(() => {
      if (!active) return;
      setState({ loading: false, translated: "", detected, provider: "error" });
    });
    return () => {
      active = false;
    };
  }, [content, viewerLang, skip, autoTranslate, isMe]);
  const showTranslation = autoTranslate && !isMe && Boolean(state.translated) && state.translated !== content;
  return {
    enabled: autoTranslate,
    loading: state.loading,
    translated: state.translated,
    detected: state.detected,
    provider: state.provider,
    showTranslation
  };
}
const QUICK_REACTIONS = ["❤️", "🔥", "😂", "👏", "👍", "😮"];
const LONG_PRESS_MS = 450;
const SWIPE_REPLY_THRESHOLD = 60;
const SWIPE_REPLY_MAX = 100;
function formatMessageTime(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}
const IMAGE_MEDIA_RE = /\.(jpg|jpeg|png|gif|webp|svg|avif|bmp|heic|heif)(?:$|\?)/i;
const VIDEO_MEDIA_RE = /\.(mp4|webm|mov|m4v|mkv)(?:$|\?)/i;
const AUDIO_MEDIA_RE = /\.(mp3|wav|ogg|oga|m4a|aac|opus|webm)(?:$|\?)/i;
function getPrimaryAttachment(message = {}) {
  return Array.isArray(message?.attachments) && message.attachments.length ? message.attachments[0] || {} : {};
}
function resolveMessageMediaUrl(message = {}) {
  const attachment = getPrimaryAttachment(message);
  return String(
    message?.media_url || message?.media_urls?.[0] || attachment?.cdn_url || attachment?.url || attachment?.mediaUrl || attachment?.media_url || attachment?.file_url || ""
  ).trim();
}
function resolveMessagePreviewUrl(message = {}) {
  const attachment = getPrimaryAttachment(message);
  return String(
    attachment?.thumbnail_url || attachment?.thumbnailUrl || attachment?.preview_url || attachment?.previewUrl || resolveMessageMediaUrl(message) || ""
  ).trim();
}
function resolveMessageDurationSeconds(message = {}) {
  const attachment = getPrimaryAttachment(message);
  const candidates = [
    message?.audio_duration_seconds,
    message?.duration_seconds,
    message?.duration,
    attachment?.duration_seconds,
    attachment?.duration,
    attachment?.audio_duration_seconds
  ];
  for (const value of candidates) {
    const numeric = Number(value);
    if (Number.isFinite(numeric) && numeric > 0) return numeric;
  }
  return 0;
}
function resolveMessageSenderAvatar(message = {}) {
  const attachment = getPrimaryAttachment(message);
  return String(
    message?.sender_avatar || message?.senderAvatar || attachment?.sender_avatar || attachment?.senderAvatar || ""
  ).trim();
}
function resolveMessageMediaKind(message = {}) {
  const attachment = getPrimaryAttachment(message);
  const rawType = String(
    message?.type || message?.message_type || attachment?.kind || attachment?.type || attachment?.mediaType || attachment?.media_type || attachment?.attachment_kind || attachment?.content_type || attachment?.contentType || message?.content_type || message?.mime_type || ""
  ).trim().toLowerCase();
  const mime = String(
    attachment?.mime_type || attachment?.mimeType || attachment?.content_type || attachment?.contentType || message?.mime_type || message?.content_type || ""
  ).trim().toLowerCase();
  const mediaUrl = resolveMessageMediaUrl(message).toLowerCase();
  const previewUrl = resolveMessagePreviewUrl(message).toLowerCase();
  const fileName = String(
    attachment?.file_name || attachment?.fileName || attachment?.originalName || attachment?.name || message?.attachment_name || ""
  ).trim().toLowerCase();
  if (["voice", "audio", "audio_message", "voice_message"].includes(rawType)) return "voice";
  if (["image", "photo", "img", "media_image"].includes(rawType)) return "image";
  if (["video", "media_video"].includes(rawType)) return "video";
  if (["file", "document", "attachment", "media"].includes(rawType)) {
    if (mime.startsWith("image/") || IMAGE_MEDIA_RE.test(fileName) || IMAGE_MEDIA_RE.test(mediaUrl) || IMAGE_MEDIA_RE.test(previewUrl)) return "image";
    if (mime.startsWith("video/") || VIDEO_MEDIA_RE.test(fileName) || VIDEO_MEDIA_RE.test(mediaUrl)) return "video";
    if (mime.startsWith("audio/") || AUDIO_MEDIA_RE.test(fileName) || AUDIO_MEDIA_RE.test(mediaUrl)) return "voice";
    return resolveMessageMediaUrl(message) ? "file" : "none";
  }
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "voice";
  if (IMAGE_MEDIA_RE.test(fileName) || IMAGE_MEDIA_RE.test(mediaUrl) || IMAGE_MEDIA_RE.test(previewUrl)) return "image";
  if (VIDEO_MEDIA_RE.test(fileName) || VIDEO_MEDIA_RE.test(mediaUrl)) return "video";
  if (AUDIO_MEDIA_RE.test(fileName) || AUDIO_MEDIA_RE.test(mediaUrl)) return "voice";
  if (attachment?.thumbnail_url || attachment?.thumbnailUrl) return "image";
  if (resolveMessageMediaUrl(message)) return "file";
  return "none";
}
function extractFileName(message) {
  const attachment = getPrimaryAttachment(message);
  if (message?.attachment_name) return message.attachment_name;
  if (attachment?.fileName) return attachment.fileName;
  if (attachment?.file_name) return attachment.file_name;
  if (attachment?.name) return attachment.name;
  const mediaUrl = resolveMessageMediaUrl(message);
  if (!mediaUrl) return "ملف مرفق";
  try {
    const clean = mediaUrl.split("?")[0];
    return decodeURIComponent(clean.split("/").pop() || "ملف مرفق");
  } catch {
    return "ملف مرفق";
  }
}
function normalizeMessageContent(message = {}, mediaKind = "none") {
  const rawContent = String(message?.content ?? message?.message ?? "").trim();
  if (!rawContent || mediaKind === "none") return rawContent;
  const normalized = rawContent.replace(/[‎‏‪-‮]/g, "").replace(/[🎤📷🖼️🎬📹📎🎧🎵]/g, "").replace(/\s+/g, " ").trim().toLowerCase();
  const syntheticCaptions = {
    voice: /* @__PURE__ */ new Set([
      "رسالة صوتية",
      "رساله صوتيه",
      "voice message",
      "audio message",
      "voice note",
      "audio note"
    ]),
    image: /* @__PURE__ */ new Set([
      "صورة",
      "صوره",
      "image",
      "photo",
      "picture"
    ]),
    video: /* @__PURE__ */ new Set([
      "فيديو",
      "video",
      "clip"
    ]),
    file: /* @__PURE__ */ new Set([
      "ملف",
      "ملف مرفق",
      "مرفق",
      "file",
      "attachment",
      "document"
    ])
  };
  if (syntheticCaptions[mediaKind]?.has(normalized)) return "";
  return rawContent;
}
function hasMeaningfulMediaCaption(message = {}, content = "", mediaKind = "none") {
  const raw = String(content || "").replace(/[‎‏‪-‮]/g, "").trim();
  if (!raw) return false;
  const lowered = raw.toLowerCase().replace(/\s+/g, " ").trim();
  const fileName = String(extractFileName(message) || "").toLowerCase().trim();
  const mediaUrl = String(resolveMessageMediaUrl(message) || "").toLowerCase().trim();
  const attachment = getPrimaryAttachment(message);
  const attachmentUrl = String(attachment?.url || attachment?.media_url || attachment?.mediaUrl || "").toLowerCase().trim();
  const genericValues = /* @__PURE__ */ new Set([
    "رسالة صوتية",
    "رساله صوتيه",
    "voice message",
    "audio message",
    "voice note",
    "audio note",
    "صورة",
    "صوره",
    "image",
    "photo",
    "picture",
    "فيديو",
    "video",
    "clip",
    "ملف",
    "ملف مرفق",
    "مرفق",
    "file",
    "attachment",
    "document"
  ]);
  if (genericValues.has(lowered)) return false;
  if (fileName && lowered === fileName) return false;
  if (mediaUrl && lowered === mediaUrl) return false;
  if (attachmentUrl && lowered === attachmentUrl) return false;
  if (mediaKind === "voice" && /^(?:\d+:)?\d{1,2}:\d{2}$/.test(lowered)) return false;
  return true;
}
function messageMatchesSearch(message, query) {
  const lowered = String(query || "").trim().toLowerCase();
  if (!lowered) return true;
  return [
    message?.content,
    message?.message,
    message?.sender,
    extractFileName(message)
  ].some((value) => String(value || "").toLowerCase().includes(lowered));
}
function areGrouped(firstMessage, secondMessage) {
  if (!firstMessage || !secondMessage) return false;
  if (firstMessage.sender !== secondMessage.sender) return false;
  const firstStamp = new Date(firstMessage.created_at || 0).getTime();
  const secondStamp = new Date(secondMessage.created_at || 0).getTime();
  return Math.abs(secondStamp - firstStamp) <= 5 * 60 * 1e3;
}
function MessageBubble({
  message,
  isMe,
  prevMessage,
  nextMessage,
  highlightQuery = "",
  reactionState,
  onReply,
  onDelete,
  onDeleteForMe,
  onDeleteForEveryone,
  onEdit,
  onResend,
  onReport,
  onReact,
  onJumpToReply,
  registerMessageNode,
  onOpenMedia
}) {
  const [showToolbar, setShowToolbar] = reactExports.useState(false);
  const [contextMenu, setContextMenu] = reactExports.useState(null);
  const [popupAnchor, setPopupAnchor] = reactExports.useState(null);
  const [swipeOffset, setSwipeOffset] = reactExports.useState(0);
  const reduceMotion = useReducedMotion();
  const longPressTimerRef = reactExports.useRef(null);
  const touchStartRef = reactExports.useRef({ x: 0, y: 0, time: 0 });
  const isSwipingRef = reactExports.useRef(false);
  const isLongPressFiredRef = reactExports.useRef(false);
  const bubbleRef = reactExports.useRef(null);
  const isMountedRef = reactExports.useRef(true);
  reactExports.useEffect(() => () => {
    isMountedRef.current = false;
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);
  const mediaUrl = resolveMessageMediaUrl(message);
  const previewUrl = resolveMessagePreviewUrl(message) || mediaUrl;
  const mediaDurationSeconds = resolveMessageDurationSeconds(message);
  const senderAvatar = resolveMessageSenderAvatar(message);
  const mediaKind = resolveMessageMediaKind(message);
  const hasMedia = Boolean(mediaUrl);
  const isVoice = mediaKind === "voice";
  const isImage = mediaKind === "image";
  const isVideo = mediaKind === "video";
  const isFile = mediaKind === "file";
  const content = normalizeMessageContent(message, mediaKind);
  const fileName = extractFileName(message);
  const shouldGlow = highlightQuery.trim() && messageMatchesSearch(message, highlightQuery);
  const groupedWithPrev = areGrouped(prevMessage, message);
  const groupedWithNext = areGrouped(message, nextMessage);
  const showAvatar = !isMe && !groupedWithNext;
  const replyTarget = message?.reply_to || message?.replyTo || null;
  const isFailed = message?.status === "failed" || message?.failed;
  const topReactions = reactExports.useMemo(() => Object.entries(reactionState?.counts || {}).filter(([, count]) => Number(count || 0) > 0).sort((left, right) => Number(right[1]) - Number(left[1])).slice(0, 3), [reactionState]);
  const messageId = message?.id || message?.client_id;
  const rowMotion = reduceMotion ? { initial: false, animate: { opacity: 1 } } : {
    initial: { opacity: 0, x: isMe ? 20 : -20, y: 14, scale: 0.985 },
    animate: { opacity: 1, x: 0, y: 0, scale: 1 },
    transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] }
  };
  const popMotion = reduceMotion ? { initial: false, animate: { opacity: 1, scale: 1 } } : {
    initial: { opacity: 0, scale: 0.9, y: 8 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.92, y: 6 },
    transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] }
  };
  const openCurrentMedia = () => {
    if (!mediaUrl) return;
    onOpenMedia?.(message);
  };
  const hasMeaningfulCaption = hasMeaningfulMediaCaption(message, content, mediaKind);
  const isVoiceOnly = isVoice && !hasMeaningfulCaption && !replyTarget && !message?.deleted;
  const isImageOnly = isImage && !hasMeaningfulCaption && !replyTarget && !message?.deleted;
  const isVideoOnly = isVideo && !hasMeaningfulCaption && !replyTarget && !message?.deleted;
  const isMediaOnly = isImageOnly || isVideoOnly;
  const openContextMenu = reactExports.useCallback((x, y) => {
    const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;
    if (isMobile && bubbleRef.current) {
      const rect = bubbleRef.current.querySelector(".yam-bubble")?.getBoundingClientRect() || bubbleRef.current.getBoundingClientRect();
      setPopupAnchor(rect);
      setShowToolbar(false);
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        try {
          navigator.vibrate(15);
        } catch {
        }
      }
      return;
    }
    const maxX = window.innerWidth - 200;
    const maxY = window.innerHeight - 280;
    setContextMenu({
      x: Math.min(Math.max(8, x), maxX),
      y: Math.min(Math.max(8, y), maxY)
    });
    setShowToolbar(false);
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate(15);
      } catch {
      }
    }
  }, []);
  const closeContextMenu = reactExports.useCallback(() => {
    setContextMenu(null);
    setPopupAnchor(null);
  }, []);
  reactExports.useEffect(() => {
    if (!contextMenu) return void 0;
    const onClickAway = () => closeContextMenu();
    const onEsc = (e) => {
      if (e.key === "Escape") closeContextMenu();
    };
    window.addEventListener("click", onClickAway);
    window.addEventListener("scroll", onClickAway, true);
    window.addEventListener("keydown", onEsc);
    return () => {
      window.removeEventListener("click", onClickAway);
      window.removeEventListener("scroll", onClickAway, true);
      window.removeEventListener("keydown", onEsc);
    };
  }, [contextMenu, closeContextMenu]);
  const startLongPress = reactExports.useCallback((x, y) => {
    isLongPressFiredRef.current = false;
    clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      if (!isMountedRef.current) return;
      isLongPressFiredRef.current = true;
      openContextMenu(x, y);
    }, LONG_PRESS_MS);
  }, [openContextMenu]);
  const cancelLongPress = reactExports.useCallback(() => {
    clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = null;
  }, []);
  const handleTouchStart = reactExports.useCallback((e) => {
    const touch = e.touches?.[0];
    if (!touch) return;
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
    isSwipingRef.current = false;
    startLongPress(touch.clientX, touch.clientY);
  }, [startLongPress]);
  const handleTouchMove = reactExports.useCallback((e) => {
    const touch = e.touches?.[0];
    if (!touch) return;
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8) {
      cancelLongPress();
      return;
    }
    if (Math.abs(dx) > 10) {
      cancelLongPress();
      isSwipingRef.current = true;
      const allowed = isMe ? Math.max(0, dx) : Math.min(0, dx);
      const clamped = Math.sign(allowed) * Math.min(Math.abs(allowed), SWIPE_REPLY_MAX);
      setSwipeOffset(clamped);
    }
  }, [cancelLongPress, isMe]);
  const handleTouchEnd = reactExports.useCallback(() => {
    cancelLongPress();
    if (isSwipingRef.current && Math.abs(swipeOffset) >= SWIPE_REPLY_THRESHOLD) {
      onReply?.(message);
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        try {
          navigator.vibrate(20);
        } catch {
        }
      }
    }
    isSwipingRef.current = false;
    setSwipeOffset(0);
  }, [cancelLongPress, swipeOffset, onReply, message]);
  const handleMouseDown = reactExports.useCallback((e) => {
    if (e.button !== 0) return;
    startLongPress(e.clientX, e.clientY);
  }, [startLongPress]);
  const handleMouseUp = reactExports.useCallback(() => cancelLongPress(), [cancelLongPress]);
  const handleMouseLeave = reactExports.useCallback(() => cancelLongPress(), [cancelLongPress]);
  const handleContextMenu = reactExports.useCallback((e) => {
    e.preventDefault();
    openContextMenu(e.clientX, e.clientY);
  }, [openContextMenu]);
  const handleClickCapture = reactExports.useCallback((e) => {
    if (isLongPressFiredRef.current || isSwipingRef.current) {
      e.preventDefault();
      e.stopPropagation();
      isLongPressFiredRef.current = false;
    }
  }, []);
  const doReply = () => {
    onReply?.(message);
    closeContextMenu();
  };
  const doResend = () => {
    if (onResend) onResend(message);
    else onReply?.(message);
    closeContextMenu();
  };
  const doDeleteForMe = () => {
    if (onDeleteForMe) onDeleteForMe(messageId);
    else onDelete?.(messageId, false);
    closeContextMenu();
  };
  const doDeleteForEveryone = () => {
    if (onDeleteForEveryone) onDeleteForEveryone(messageId);
    else onDelete?.(messageId, true);
    closeContextMenu();
  };
  const doEdit = () => {
    onEdit?.(message);
    closeContextMenu();
  };
  const doReport = () => {
    onReport?.(message);
    closeContextMenu();
  };
  const swipeIndicatorVisible = Math.abs(swipeOffset) > 12;
  const swipeIndicatorActive = Math.abs(swipeOffset) >= SWIPE_REPLY_THRESHOLD;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    motion.div,
    {
      ref: (node) => {
        bubbleRef.current = node;
        registerMessageNode?.(String(messageId), node);
      },
      className: `yam-message-row ${isMe ? "me" : "them"} ${groupedWithPrev ? "grouped-prev" : ""} ${groupedWithNext ? "grouped-next" : ""} ${isVoiceOnly ? "voice-only" : ""} ${isMediaOnly ? "media-only" : ""}`,
      "data-msg-id": messageId,
      layout: !reduceMotion,
      onMouseEnter: () => setShowToolbar(true),
      onMouseLeave: () => {
        setShowToolbar(false);
        handleMouseLeave();
      },
      onContextMenu: handleContextMenu,
      onClickCapture: handleClickCapture,
      dir: "rtl",
      ...rowMotion,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(AnimatePresence, { children: swipeIndicatorVisible && /* @__PURE__ */ jsxRuntimeExports.jsx(
          motion.div,
          {
            className: `yam-swipe-reply-indicator ${swipeIndicatorActive ? "active" : ""} ${isMe ? "me" : "them"}`,
            initial: { opacity: 0, scale: 0.7 },
            animate: { opacity: 1, scale: swipeIndicatorActive ? 1.1 : 1 },
            exit: { opacity: 0, scale: 0.7 },
            style: {
              position: "absolute",
              top: "50%",
              transform: "translateY(-50%)",
              [isMe ? "left" : "right"]: 12,
              pointerEvents: "none",
              fontSize: 20,
              color: swipeIndicatorActive ? "#22c55e" : "#94a3b8",
              fontFamily: "'Noto Sans Arabic', system-ui, sans-serif"
            },
            "aria-hidden": "true",
            children: "↩"
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `yam-message-avatar ${showAvatar ? "visible" : ""}`, children: showAvatar ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          Avatar,
          {
            name: message?.sender || "مستخدم",
            src: message?.sender_avatar,
            size: "sm",
            showStatus: true,
            status: "online"
          }
        ) : null }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "yam-message-stack",
            style: {
              transform: `translateX(${swipeOffset}px)`,
              transition: isSwipingRef.current ? "none" : "transform 0.2s cubic-bezier(0.22, 1, 0.36, 1)",
              touchAction: "pan-y"
            },
            onTouchStart: handleTouchStart,
            onTouchMove: handleTouchMove,
            onTouchEnd: handleTouchEnd,
            onTouchCancel: handleTouchEnd,
            onMouseDown: handleMouseDown,
            onMouseUp: handleMouseUp,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                motion.div,
                {
                  className: `yam-bubble ${isMe ? "bubble-me" : "bubble-them"} ${shouldGlow ? "search-hit" : ""} ${showToolbar ? "toolbar-open" : ""} ${isVoiceOnly ? "is-voice-only" : ""} ${isMediaOnly ? "is-media-only" : ""} ${isImageOnly ? "is-image-only" : ""} ${isVideoOnly ? "is-video-only" : ""}`,
                  layout: !reduceMotion,
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "button",
                      {
                        type: "button",
                        className: "yam-bubble-more",
                        "aria-label": "خيارات الرسالة",
                        onClick: (e) => {
                          e.stopPropagation();
                          const rect = e.currentTarget.getBoundingClientRect();
                          openContextMenu(rect.left, rect.bottom + 4);
                        },
                        style: { fontFamily: "'Noto Sans Arabic', system-ui, sans-serif" },
                        children: "⋯"
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(AnimatePresence, { initial: false, children: showToolbar ? /* @__PURE__ */ jsxRuntimeExports.jsxs(motion.div, { className: "yam-bubble-toolbar", ...popMotion, children: [
                      QUICK_REACTIONS.map((emoji) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "button",
                        {
                          type: "button",
                          onClick: (e) => {
                            e.stopPropagation();
                            onReact?.(message, emoji);
                            setShowToolbar(false);
                          },
                          title: `إضافة ${emoji}`,
                          children: emoji
                        },
                        emoji
                      )),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: (e) => {
                        e.stopPropagation();
                        onReply?.(message);
                        setShowToolbar(false);
                      }, children: "↩" })
                    ] }) : null }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(AnimatePresence, { initial: false, children: replyTarget ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      motion.button,
                      {
                        type: "button",
                        className: "yam-reply-preview",
                        onClick: (e) => {
                          e.stopPropagation();
                          onJumpToReply?.(replyTarget?.id);
                        },
                        layout: !reduceMotion,
                        ...popMotion,
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "↩ الرد على" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: replyTarget?.content || replyTarget?.message || "..." })
                        ]
                      }
                    ) : null }),
                    message?.type === "call" || message?.call ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                      CallBubble,
                      {
                        call: {
                          ...message?.call || {},
                          mode: message?.call?.mode || message?.callMode || "voice",
                          direction: message?.isMe || message?.sender === message?.currentUser ? "outgoing" : "incoming",
                          status: message?.call?.status || message?.callStatus || "missed",
                          duration_sec: message?.call?.duration_sec || message?.callDuration || 0,
                          time: message?.time,
                          isMe: message?.isMe
                        },
                        onCallBack: () => {
                          window.dispatchEvent(new CustomEvent("yamshat:callback", { detail: message }));
                        }
                      }
                    ) : null,
                    isImage && mediaUrl ? /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "yam-media-button", onClick: openCurrentMedia, children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SafeImage, { src: previewUrl, alt: fileName, onOpen: openCurrentMedia, maxHeight: 340 }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-bubble-media-overlay", children: "تكبير" })
                    ] }) : null,
                    isVideo && mediaUrl ? /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "yam-media-button yam-video-preview-shell", onClick: openCurrentMedia, children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("video", { src: mediaUrl, muted: true, playsInline: true, className: "yam-bubble-media", preload: "metadata" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-bubble-media-overlay", children: "تشغيل كامل" })
                    ] }) : null,
                    isVoice && mediaUrl ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                      VoiceMessagePlayer,
                      {
                        src: mediaUrl,
                        seed: message?.waveform_seed || message?.created_at || messageId,
                        title: "رسالة صوتية",
                        bubbleless: true,
                        isMe,
                        initialDuration: mediaDurationSeconds,
                        avatarSrc: senderAvatar,
                        avatarAlt: message?.sender || "مستخدم"
                      }
                    ) : null,
                    isFile && mediaUrl ? /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: mediaUrl, target: "_blank", rel: "noreferrer", className: "yam-file-card", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-file-icon", children: "📄" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "yam-file-copy", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: fileName }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("small", { children: (message?.attachments?.[0]?.mediaType || message?.type || "FILE").toUpperCase() })
                      ] })
                    ] }) : null,
                    content && !message?.deleted ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "div",
                        {
                          className: "bubble-text",
                          style: {
                            fontFamily: "'Noto Sans Arabic', 'Apple Color Emoji', 'Segoe UI Emoji', system-ui, sans-serif",
                            direction: "rtl",
                            unicodeBidi: "plaintext"
                          },
                          children: content
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(ChatTranslationStrip, { content, isMe })
                    ] }) : null,
                    message?.deleted ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bubble-deleted", children: "تم حذف الرسالة" }) : null,
                    message?.forwarded_from || message?.is_forwarded || message?.forwardedFrom ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bubble-forwarded-label", "aria-label": "رسالة محوّلة", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "11", height: "11", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "15 17 20 12 15 7" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M4 18v-2a4 4 0 0 1 4-4h12" })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                        "محوّلة",
                        message?.forwarded_from ? ` من ${message.forwarded_from}` : ""
                      ] })
                    ] }) : null,
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bubble-meta", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "bubble-time", children: formatMessageTime(message?.created_at) }),
                      message?.edited ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "bubble-edited", title: "تم التعديل", children: "معدّلة" }) : null,
                      isMe ? (
                        /* v87.10 — استبدال statusTicks الثابت بمكوّن MessageReadReceipts الديناميكي
                           الذي يعرض ✓/✓✓/✓✓-مقروءة بألوان مختلفة حسب read_at/delivered_at */
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          MessageReadReceipts$1,
                          {
                            message,
                            currentUser: isMe ? message?.sender : void 0,
                            className: `bubble-status ds-color-${statusColor(message?.status)}`
                          }
                        )
                      ) : null
                    ] })
                  ]
                }
              ),
              isFailed && onResend ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                MessageRetry$1,
                {
                  message,
                  currentUser: isMe ? message?.sender : null,
                  onRetry: onResend
                }
              ) : null,
              /* @__PURE__ */ jsxRuntimeExports.jsx(AnimatePresence, { initial: false, children: topReactions.length ? /* @__PURE__ */ jsxRuntimeExports.jsx(motion.div, { className: `yam-reaction-summary ${isMe ? "me" : "them"}`, layout: !reduceMotion, ...popMotion, children: topReactions.map(([emoji, count]) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                motion.button,
                {
                  type: "button",
                  layout: !reduceMotion,
                  className: `yam-reaction-chip ${reactionState?.myReaction === emoji ? "active" : ""}`,
                  onClick: (e) => {
                    e.stopPropagation();
                    onReact?.(message, emoji);
                  },
                  whileTap: reduceMotion ? void 0 : { scale: 0.94 },
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: emoji }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: count })
                  ]
                },
                emoji
              )) }) : null })
            ]
          }
        ),
        popupAnchor ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          MessageContextPopup,
          {
            anchorRect: popupAnchor,
            isMe,
            message,
            onClose: closeContextMenu,
            onReact: (emoji) => {
              onReact?.(message, emoji);
            },
            onReply: () => onReply?.(message),
            onCopy: () => {
              const text = message?.content || message?.message || "";
              if (text && typeof navigator !== "undefined" && navigator.clipboard) {
                try {
                  navigator.clipboard.writeText(text);
                } catch {
                }
              }
            },
            onEdit: () => onEdit?.(message),
            onResend: onResend ? () => onResend(message) : void 0,
            onDelete: () => {
              if (onDeleteForMe) onDeleteForMe(messageId);
              else onDelete?.(messageId, false);
            },
            onDeleteForMe: () => {
              if (onDeleteForMe) onDeleteForMe(messageId);
              else onDelete?.(messageId, false);
            },
            onDeleteForEveryone: () => {
              if (onDeleteForEveryone) onDeleteForEveryone(messageId);
              else onDelete?.(messageId, true);
            }
          }
        ) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsx(AnimatePresence, { children: contextMenu && /* @__PURE__ */ jsxRuntimeExports.jsxs(
          motion.div,
          {
            className: "yam-context-menu",
            role: "menu",
            "aria-label": "خيارات الرسالة",
            dir: "rtl",
            style: {
              position: "fixed",
              top: contextMenu.y,
              left: contextMenu.x,
              zIndex: 9999,
              background: "rgba(20, 24, 36, 0.98)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 14,
              boxShadow: "0 18px 60px rgba(0,0,0,0.55)",
              minWidth: 200,
              padding: 6,
              fontFamily: "'Noto Sans Arabic', system-ui, sans-serif",
              color: "#e6e9f2"
            },
            initial: { opacity: 0, scale: 0.92, y: -6 },
            animate: { opacity: 1, scale: 1, y: 0 },
            exit: { opacity: 0, scale: 0.92, y: -6 },
            transition: { duration: 0.16, ease: [0.22, 1, 0.36, 1] },
            onClick: (e) => e.stopPropagation(),
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", role: "menuitem", className: "yam-ctx-item", onClick: doReply, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "↩" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "رد" })
              ] }),
              isFailed || isMe ? /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", role: "menuitem", className: "yam-ctx-item", onClick: doResend, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "📤" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "إعادة إرسال إلى…" })
              ] }) : null,
              /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", role: "menuitem", className: "yam-ctx-item", onClick: doDeleteForMe, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "🗑️" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "حذف لدي" })
              ] }),
              isMe ? /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", role: "menuitem", className: "yam-ctx-item danger", onClick: doDeleteForEveryone, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "🧹" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "حذف لدى الجميع" })
              ] }) : null,
              isMe && !message?.deleted && !hasMedia ? /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", role: "menuitem", className: "yam-ctx-item", onClick: doEdit, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "✏️" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "تعديل" })
              ] }) : null,
              !isMe ? /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", role: "menuitem", className: "yam-ctx-item danger", onClick: doReport, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "⚠️" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "إبلاغ" })
              ] }) : null,
              /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
              .yam-ctx-item {
                display: flex;
                align-items: center;
                gap: 10px;
                width: 100%;
                padding: 10px 12px;
                background: transparent;
                border: 0;
                border-radius: 10px;
                color: inherit;
                font: inherit;
                text-align: right;
                cursor: pointer;
                transition: background 0.15s ease;
              }
              .yam-ctx-item:hover, .yam-ctx-item:focus-visible {
                background: rgba(255,255,255,0.08);
                outline: none;
              }
              .yam-ctx-item.danger { color: #f87171; }
              .yam-ctx-item.danger:hover { background: rgba(248, 113, 113, 0.12); }
              .yam-ctx-item > span:first-child { font-size: 16px; width: 22px; text-align: center; }
            ` })
            ]
          }
        ) })
      ]
    }
  );
}
const ChatBubble = reactExports.memo(MessageBubble);
function ChatTranslationStrip({ content, isMe }) {
  const { showTranslation, loading, translated, provider } = useMessageTranslation(content, { isMe });
  if (!showTranslation && !loading) return null;
  if (isMe) return null;
  if (loading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-translation-strip is-loading", "aria-live": "polite", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-translation-label", children: "جارٍ الترجمة…" }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: "yam-translation-strip",
      style: { direction: "rtl", unicodeBidi: "plaintext" },
      title: provider === "backend" ? "Yamshat Translate" : provider === "google-free" ? "Google Translate" : "MyMemory",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-translation-label", children: "تمت الترجمة تلقائياً" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-translation-text", children: translated })
      ]
    }
  );
}
const STORAGE_KEY = "yamshat-chat-preferences";
function readRaw() {
  if (typeof window === "undefined") return { muted: [], archived: [], pinned: [] };
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}");
    return {
      muted: Array.isArray(parsed.muted) ? parsed.muted : [],
      archived: Array.isArray(parsed.archived) ? parsed.archived : [],
      pinned: Array.isArray(parsed.pinned) ? parsed.pinned : []
    };
  } catch {
    return { muted: [], archived: [], pinned: [] };
  }
}
function writeRaw(data) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
function getChatPreferences() {
  const raw = readRaw();
  return {
    muted: new Set(raw.muted),
    archived: new Set(raw.archived),
    pinned: new Set(raw.pinned)
  };
}
function toggleChatPreference(type, username) {
  const raw = readRaw();
  const next = new Set(raw[type] || []);
  if (next.has(username)) next.delete(username);
  else next.add(username);
  raw[type] = [...next];
  writeRaw(raw);
  return new Set(raw[type]);
}
export {
  Avatar as A,
  ChatBubble as C,
  getChatPreferences as g,
  toggleChatPreference as t
};
