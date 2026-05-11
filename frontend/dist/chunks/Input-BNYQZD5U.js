import { n as require_jsx_runtime } from "./vendor-motion-DouOFhvK.js";
//#region src/components/ui/Input.jsx
var import_jsx_runtime = require_jsx_runtime();
function Input({ label, hint, className = "", ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: `field ${className}`.trim(),
		children: [
			label ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "field-label",
				children: label
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				className: "input",
				...props
			}),
			hint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "field-hint",
				children: hint
			}) : null
		]
	});
}
//#endregion
export { Input as t };
