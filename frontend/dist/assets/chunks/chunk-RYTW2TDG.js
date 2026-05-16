import {
  __toESM,
  init_define_import_meta_env,
  require_jsx_runtime
} from "./chunk-SOYW6UE7.js";

// src/components/ui/Input.jsx
init_define_import_meta_env();
var import_jsx_runtime = __toESM(require_jsx_runtime(), 1);
function Input({ label, hint, className = "", ...props }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: `field ${className}`.trim(), children: [
    label ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "field-label", children: label }) : null,
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { className: "input", ...props }),
    hint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "field-hint", children: hint }) : null
  ] });
}

export {
  Input
};
