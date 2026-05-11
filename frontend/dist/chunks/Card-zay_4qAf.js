import { n as require_jsx_runtime, t as motion } from "./vendor-motion-BBlFOFzY.js";
//#region src/components/ui/Card.jsx
var import_jsx_runtime = require_jsx_runtime();
function Card({ children, className = "", ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
		initial: {
			opacity: 0,
			y: 10
		},
		animate: {
			opacity: 1,
			y: 0
		},
		transition: { duration: .25 },
		className: `card ${className}`.trim(),
		...props,
		children
	});
}
//#endregion
export { Card as t };
