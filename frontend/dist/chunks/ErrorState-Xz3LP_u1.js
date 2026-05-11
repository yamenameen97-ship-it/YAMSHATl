import { n as require_jsx_runtime } from "./vendor-motion-DouOFhvK.js";
import { S as Button } from "../index-RNpBu_Fp.js";
//#region src/components/feedback/ErrorState.jsx
var import_jsx_runtime = require_jsx_runtime();
function ErrorState({ title = "حدث خطأ غير متوقع", description = "حاول مرة أخرى بعد قليل.", onRetry }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "error-state-card",
		role: "alert",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "empty-state-icon",
				children: "⚠️"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: title }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: description }),
			onRetry ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				onClick: onRetry,
				children: "إعادة المحاولة"
			}) : null
		]
	});
}
//#endregion
export { ErrorState as t };
