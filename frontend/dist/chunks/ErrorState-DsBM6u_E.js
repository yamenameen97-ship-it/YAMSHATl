import { aq as jsxRuntimeExports, c as Button } from "../index-2I4hYPnI.js";
function EmptyState({
  title = "لا توجد بيانات",
  description = "عند توفر محتوى سيظهر هنا تلقائياً.",
  actionLabel,
  onAction,
  icon = "📭"
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "empty-state-card", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "empty-state-icon", children: icon }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { children: title }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: description }),
    actionLabel && onAction ? /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: onAction, children: actionLabel }) : null
  ] });
}
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
  EmptyState as E,
  ErrorState as a
};
