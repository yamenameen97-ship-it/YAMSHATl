import { j as jsxRuntimeExports } from "../index-D6u1FUhW.js";
function Input({ label, hint, className = "", ...props }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: `field ${className}`.trim(), children: [
    label ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "field-label", children: label }) : null,
    /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input", ...props }),
    hint ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "field-hint", children: hint }) : null
  ] });
}
export {
  Input as I
};
