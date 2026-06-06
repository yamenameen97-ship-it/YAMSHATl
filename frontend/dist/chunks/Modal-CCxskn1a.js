import { aP as reactExports, aO as reactDomExports, am as jsxRuntimeExports } from "../index-T8PSkq5D.js";
function Modal({
  open,
  isOpen,
  title,
  subtitle = "",
  children,
  onClose,
  size = "medium",
  footer = null,
  className = "",
  closeOnOverlay = true
}) {
  const visible = typeof open === "boolean" ? open : Boolean(isOpen);
  const modalRef = reactExports.useRef(null);
  const onCloseRef = reactExports.useRef(onClose);
  const titleId = reactExports.useId();
  const descriptionId = reactExports.useId();
  reactExports.useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);
  reactExports.useEffect(() => {
    if (!visible) return void 0;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement;
    document.body.style.overflow = "hidden";
    const focusFirst = window.setTimeout(() => {
      const preferredFocusable = modalRef.current?.querySelector(
        'input:not([type="hidden"]):not([disabled]), textarea:not([disabled]), select:not([disabled]), [contenteditable="true"], [data-modal-autofocus="true"]'
      );
      const fallbackFocusable = modalRef.current?.querySelector(
        'button:not([disabled]), [href], input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      (preferredFocusable || fallbackFocusable)?.focus();
    }, 40);
    const onKeyDown = (event) => {
      if (event.key === "Escape") onCloseRef.current?.();
      if (event.key !== "Tab" || !modalRef.current) return;
      const focusables = Array.from(modalRef.current.querySelectorAll(
        'button:not([disabled]), [href], input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )).filter((element) => !element.hasAttribute("disabled") && element.getAttribute("aria-hidden") !== "true");
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(focusFirst);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      if (previousFocus && typeof previousFocus.focus === "function" && document.contains(previousFocus)) {
        previousFocus.focus();
      }
    };
  }, [visible]);
  if (!visible) return null;
  return reactDomExports.createPortal(
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: "ui-modal-backdrop",
        onClick: () => {
          if (closeOnOverlay) onCloseRef.current?.();
        },
        role: "presentation",
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "section",
          {
            className: `ui-modal ui-modal-${size} ${className}`.trim(),
            onClick: (event) => event.stopPropagation(),
            ref: modalRef,
            tabIndex: "-1",
            role: "dialog",
            "aria-modal": "true",
            "aria-labelledby": title ? titleId : void 0,
            "aria-describedby": subtitle ? descriptionId : void 0,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "ui-modal-header", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  title ? /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { id: titleId, children: title }) : null,
                  subtitle ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { id: descriptionId, children: subtitle }) : null
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "btn btn-secondary btn-small", onClick: () => onCloseRef.current?.(), "aria-label": "إغلاق النافذة", children: "✕" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ui-modal-body", children }),
              footer ? /* @__PURE__ */ jsxRuntimeExports.jsx("footer", { className: "ui-modal-footer", children: footer }) : null
            ]
          }
        )
      }
    ),
    document.body
  );
}
export {
  Modal as M
};
