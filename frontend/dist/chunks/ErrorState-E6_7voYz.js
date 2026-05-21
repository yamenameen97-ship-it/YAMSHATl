import { j as jsxRuntimeExports, B as Button } from "../index-DuXBJv5q.js";
function ErrorState({
  title = "حدث خطأ غير متوقع",
  description = "حاول مرة أخرى بعد قليل.",
  onRetry
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "error-state-card", role: "alert", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "empty-state-icon", children: "⚠️" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { children: title }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: description }),
    onRetry ? /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: onRetry, children: "إعادة المحاولة" }) : null
  ] });
}
export {
  ErrorState as E
};
