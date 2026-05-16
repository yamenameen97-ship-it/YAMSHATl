import {
  Button
} from "./chunk-EHD43N2I.js";
import {
  __toESM,
  init_define_import_meta_env,
  require_jsx_runtime
} from "./chunk-SOYW6UE7.js";

// src/components/feedback/EmptyState.jsx
init_define_import_meta_env();
var import_jsx_runtime = __toESM(require_jsx_runtime(), 1);
function EmptyState({
  title = "\u0644\u0627 \u062A\u0648\u062C\u062F \u0628\u064A\u0627\u0646\u0627\u062A",
  description = "\u0639\u0646\u062F \u062A\u0648\u0641\u0631 \u0645\u062D\u062A\u0648\u0649 \u0633\u064A\u0638\u0647\u0631 \u0647\u0646\u0627 \u062A\u0644\u0642\u0627\u0626\u064A\u0627\u064B.",
  actionLabel,
  onAction,
  icon = "\u{1F4ED}"
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "empty-state-card", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "empty-state-icon", children: icon }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: title }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: description }),
    actionLabel && onAction ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, { onClick: onAction, children: actionLabel }) : null
  ] });
}

export {
  EmptyState
};
