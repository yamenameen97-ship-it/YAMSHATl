import { a as __toESM } from "./rolldown-runtime-DuU1KJyR.js";
import { ot as require_react } from "./vendor-BEGBKm-Y.js";
import { a as require_react_dom } from "./vendor-react-D9YCW6KT.js";
import { n as require_jsx_runtime } from "./vendor-motion-DouOFhvK.js";
//#region src/components/ui/Modal.jsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_react_dom = /* @__PURE__ */ __toESM(require_react_dom(), 1);
var import_jsx_runtime = require_jsx_runtime();
/**
* Modal Component
* Features: Animations, Accessibility, Focus trap, Keyboard support
*/
function Modal({ open, title, children, onClose, size = "medium" }) {
	const modalRef = (0, import_react.useRef)(null);
	const previousFocus = (0, import_react.useRef)(null);
	const [isAnimating, setIsAnimating] = (0, import_react.useState)(false);
	/**
	* Handles tab key for focus trap
	*/
	const handleTabKey = (0, import_react.useCallback)((e) => {
		if (!modalRef.current) return;
		const focusableElements = modalRef.current.querySelectorAll("button, [href], input, select, textarea, [tabindex]:not([tabindex=\"-1\"])");
		if (focusableElements.length === 0) return;
		const firstElement = focusableElements[0];
		const lastElement = focusableElements[focusableElements.length - 1];
		if (e.key === "Tab") {
			if (e.shiftKey) {
				if (document.activeElement === firstElement) {
					lastElement.focus();
					e.preventDefault();
				}
			} else if (document.activeElement === lastElement) {
				firstElement.focus();
				e.preventDefault();
			}
		}
	}, []);
	/**
	* Sets up keyboard listeners and focus management
	*/
	(0, import_react.useEffect)(() => {
		if (open) {
			setIsAnimating(true);
			previousFocus.current = document.activeElement;
			document.body.style.overflow = "hidden";
			setTimeout(() => {
				(modalRef.current?.querySelector("button, [href], input, select, textarea, [tabindex]:not([tabindex=\"-1\"])"))?.focus();
			}, 100);
			const handleKeyDown = (e) => {
				if (e.key === "Escape") onClose();
				handleTabKey(e);
			};
			window.addEventListener("keydown", handleKeyDown);
			return () => {
				window.removeEventListener("keydown", handleKeyDown);
				document.body.style.overflow = "unset";
				previousFocus.current?.focus();
			};
		} else setIsAnimating(false);
	}, [
		open,
		onClose,
		handleTabKey
	]);
	if (!open && !isAnimating) return null;
	return (0, import_react_dom.createPortal)(/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `modal-backdrop ${isAnimating ? "fade-in" : "fade-out"}`,
		onClick: onClose,
		role: "presentation",
		"aria-hidden": !open,
		style: {
			opacity: isAnimating ? 1 : 0,
			pointerEvents: isAnimating ? "auto" : "none",
			transition: "opacity 0.2s ease-out"
		},
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: `modal-card ${isAnimating ? "slide-up" : "slide-down"} ${size}`,
			onClick: (e) => e.stopPropagation(),
			ref: modalRef,
			tabIndex: "-1",
			role: "dialog",
			"aria-modal": "true",
			"aria-labelledby": "modal-title",
			style: {
				transform: isAnimating ? "translateY(0)" : "translateY(20px)",
				opacity: isAnimating ? 1 : 0,
				transition: "all 0.3s ease-out"
			},
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "modal-header",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					id: "modal-title",
					children: title
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "modal-close",
					onClick: onClose,
					"aria-label": "إغلاق النافذة",
					children: "✕"
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "modal-body",
				children
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", { dangerouslySetInnerHTML: { __html: `
          .modal-backdrop {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(4px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
          }

          .modal-card {
            background: white;
            border-radius: 16px;
            width: 90%;
            max-height: 90vh;
            display: flex;
            flex-direction: column;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
            outline: none;
          }

          .modal-card.small {
            max-width: 400px;
          }

          .modal-card.medium {
            max-width: 600px;
          }

          .modal-card.large {
            max-width: 900px;
          }

          .modal-header {
            padding: 20px;
            border-bottom: 1px solid #f3f4f6;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .modal-header h3 {
            margin: 0;
            font-size: 1.25rem;
            font-weight: 600;
          }

          .modal-close {
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: #9ca3af;
            transition: all 0.2s ease;
            padding: 4px 8px;
            border-radius: 4px;
          }

          .modal-close:hover {
            color: #111827;
            background: #f3f4f6;
          }

          .modal-close:focus {
            outline: 2px solid #3b82f6;
            outline-offset: 2px;
          }

          .modal-body {
            padding: 20px;
            overflow-y: auto;
            flex: 1;
          }

          .fade-in {
            animation: fadeIn 0.2s ease-out;
          }

          .fade-out {
            animation: fadeOut 0.2s ease-out;
          }

          .slide-up {
            animation: slideUp 0.3s ease-out;
          }

          .slide-down {
            animation: slideDown 0.3s ease-out;
          }

          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          @keyframes fadeOut {
            from {
              opacity: 1;
            }
            to {
              opacity: 0;
            }
          }

          @keyframes slideUp {
            from {
              transform: translateY(20px);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }

          @keyframes slideDown {
            from {
              transform: translateY(0);
              opacity: 1;
            }
            to {
              transform: translateY(20px);
              opacity: 0;
            }
          }
        ` } })]
	}), document.body);
}
//#endregion
export { Modal as t };
