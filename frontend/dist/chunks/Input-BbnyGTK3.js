import { aq as jsxRuntimeExports } from "../index-2I4hYPnI.js";
function Input({
  label,
  hint,
  error = "",
  className = "",
  inputClassName = "",
  leading = null,
  trailing = null,
  as = "input",
  rows = 4,
  ...props
}) {
  const Tag = as === "textarea" ? "textarea" : "input";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: `field ${error ? "has-error" : ""} ${className}`.trim(), children: [
    label ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "field-label", children: label }) : null,
    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: `input-shell ${leading ? "has-leading" : ""} ${trailing ? "has-trailing" : ""}`.trim(), children: [
      leading ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "input-addon input-addon-leading", children: leading }) : null,
      /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { className: `input ${inputClassName}`.trim(), rows: Tag === "textarea" ? rows : void 0, ...props }),
      trailing ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "input-addon input-addon-trailing", children: trailing }) : null
    ] }),
    error ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "field-error", children: error }) : hint ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "field-hint", children: hint }) : null
  ] });
}
export {
  Input as I
};
