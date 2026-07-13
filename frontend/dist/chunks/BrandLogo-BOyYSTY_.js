import { b0 as reactExports, ar as jsxRuntimeExports } from "../index-D5NOBPt4.js";
function BrandLogo({
  size = 48,
  alt = "Yamshat logo",
  className = "",
  style = {},
  shadow = true
}) {
  const [failed, setFailed] = reactExports.useState(false);
  const mergedStyle = {
    width: size,
    height: size,
    objectFit: "contain",
    display: "block",
    filter: shadow ? "drop-shadow(0 14px 28px rgba(124, 58, 237, 0.28))" : "none",
    ...style
  };
  if (failed) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: ["brand-logo-fallback", className].filter(Boolean).join(" "),
        style: {
          ...mergedStyle,
          borderRadius: size / 4,
          background: "linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontWeight: 900,
          fontSize: size / 2,
          fontFamily: "system-ui, sans-serif"
        },
        "aria-label": alt,
        children: "Y"
      }
    );
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "img",
    {
      src: "/brand/yamshat-logo.jpg",
      alt,
      className: ["brand-logo-img", className].filter(Boolean).join(" "),
      style: mergedStyle,
      loading: "eager",
      decoding: "async",
      onError: () => setFailed(true)
    }
  );
}
export {
  BrandLogo as B
};
