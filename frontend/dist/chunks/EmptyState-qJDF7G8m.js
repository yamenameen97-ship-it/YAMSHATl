import { n as require_jsx_runtime } from "./vendor-motion-BBlFOFzY.js";
import { p as Button } from "../index-DMsnM20S.js";
//#region src/components/feedback/EmptyState.jsx
var import_jsx_runtime = require_jsx_runtime();
function EmptyState({ title = "لا توجد بيانات", description = "عند توفر محتوى سيظهر هنا تلقائياً.", actionLabel, onAction, icon = "📭" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "empty-state-card",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "empty-state-icon",
				children: icon
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: title }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: description }),
			actionLabel && onAction ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				onClick: onAction,
				children: actionLabel
			}) : null
		]
	});
}
//#endregion
export { EmptyState as t };
