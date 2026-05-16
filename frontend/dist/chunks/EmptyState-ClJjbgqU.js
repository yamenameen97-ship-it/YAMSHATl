import { j as jsxRuntimeExports, B as Button } from "../index-D6u1FUhW.js";
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
export {
  EmptyState as E
};
