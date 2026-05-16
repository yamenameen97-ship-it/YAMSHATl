import {
  __toESM,
  init_define_import_meta_env,
  require_jsx_runtime,
  require_react
} from "./chunk-SOYW6UE7.js";

// src/components/admin/ToastProvider.jsx
init_define_import_meta_env();
var import_react = __toESM(require_react(), 1);
var import_jsx_runtime = __toESM(require_jsx_runtime(), 1);
var ToastContext = (0, import_react.createContext)({ pushToast: () => {
} });
var MAX_TOASTS = 4;
function normalizeToast(toast = {}) {
  const title = toast.title || toast.message || toast.label || (toast.type === "error" ? "\u062D\u062F\u062B \u062E\u0637\u0623" : toast.type === "success" ? "\u062A\u0645 \u0628\u0646\u062C\u0627\u062D" : "\u062A\u0646\u0628\u064A\u0647");
  const description = toast.description || (toast.title && toast.message && toast.title !== toast.message ? toast.message : "") || "";
  return {
    id: toast.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: toast.type || "info",
    title,
    description,
    duration: Number(toast.duration || 4200),
    actionLabel: toast.actionLabel || "",
    onAction: typeof toast.onAction === "function" ? toast.onAction : null
  };
}
function ToastProvider({ children }) {
  const [toasts, setToasts] = (0, import_react.useState)([]);
  const dismissToast = (0, import_react.useCallback)((toastId) => {
    setToasts((prev) => prev.filter((item) => item.id !== toastId));
  }, []);
  const pushToast = (0, import_react.useCallback)((toast) => {
    const nextToast = normalizeToast(toast);
    setToasts((prev) => [...prev.filter((item) => item.title !== nextToast.title || item.description !== nextToast.description), nextToast].slice(-MAX_TOASTS));
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== nextToast.id));
    }, nextToast.duration);
  }, []);
  (0, import_react.useEffect)(() => {
    const handleToast = (event) => pushToast(event.detail || {});
    window.addEventListener("yamshat:toast", handleToast);
    return () => window.removeEventListener("yamshat:toast", handleToast);
  }, [pushToast]);
  const value = (0, import_react.useMemo)(() => ({ pushToast, dismissToast }), [dismissToast, pushToast]);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ToastContext.Provider, { value, children: [
    children,
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "toast-stack", "aria-live": "polite", "aria-atomic": "true", children: toasts.map((toast) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: `toast toast-${toast.type}`, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "toast-head-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: toast.title }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "toast-close-btn", onClick: () => dismissToast(toast.id), "aria-label": "\u0625\u063A\u0644\u0627\u0642 \u0627\u0644\u0625\u0634\u0639\u0627\u0631", children: "\xD7" })
      ] }),
      toast.description ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: toast.description }) : null,
      toast.actionLabel ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "button",
        {
          type: "button",
          className: "toast-action-btn",
          onClick: () => {
            toast.onAction?.();
            dismissToast(toast.id);
          },
          children: toast.actionLabel
        }
      ) : null,
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "toast-progress", style: { animationDuration: `${toast.duration}ms` } })
    ] }, toast.id)) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", { children: `
        .toast-head-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }
        .toast-close-btn,
        .toast-action-btn {
          border: none;
          cursor: pointer;
          font: inherit;
        }
        .toast-close-btn {
          width: 28px;
          height: 28px;
          border-radius: 999px;
          background: rgba(255,255,255,0.08);
          color: inherit;
        }
        .toast-action-btn {
          justify-self: start;
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(59,130,246,0.14);
          color: #bfdbfe;
          font-weight: 700;
        }
        .toast {
          overflow: hidden;
          position: relative;
        }
        .toast-progress {
          position: absolute;
          inset-inline-start: 0;
          bottom: 0;
          height: 3px;
          width: 100%;
          transform-origin: left;
          background: linear-gradient(90deg, #8b5cf6, #22d3ee);
          animation-name: toast-progress-shrink;
          animation-timing-function: linear;
          animation-fill-mode: forwards;
        }
        @keyframes toast-progress-shrink {
          from { transform: scaleX(1); }
          to { transform: scaleX(0); }
        }
      ` })
  ] });
}
function useToast() {
  return (0, import_react.useContext)(ToastContext);
}

export {
  ToastProvider,
  useToast
};
