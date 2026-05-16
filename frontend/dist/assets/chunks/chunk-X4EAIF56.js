import {
  Button
} from "./chunk-EHD43N2I.js";
import {
  __toESM,
  init_define_import_meta_env,
  require_jsx_runtime
} from "./chunk-SOYW6UE7.js";

// src/components/feedback/ErrorState.jsx
init_define_import_meta_env();
var import_jsx_runtime = __toESM(require_jsx_runtime(), 1);
function ErrorState({
  title = "\u062D\u062F\u062B \u062E\u0637\u0623 \u063A\u064A\u0631 \u0645\u062A\u0648\u0642\u0639",
  description = "\u062D\u0627\u0648\u0644 \u0645\u0631\u0629 \u0623\u062E\u0631\u0649 \u0628\u0639\u062F \u0642\u0644\u064A\u0644.",
  onRetry
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "error-state-card", role: "alert", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "empty-state-icon", children: "\u26A0\uFE0F" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: title }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: description }),
    onRetry ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, { onClick: onRetry, children: "\u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629" }) : null
  ] });
}

export {
  ErrorState
};
