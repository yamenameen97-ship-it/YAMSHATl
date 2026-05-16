import {
  Input
} from "./chunk-RYTW2TDG.js";
import {
  Button
} from "./chunk-EHD43N2I.js";
import {
  __toESM,
  init_define_import_meta_env,
  require_jsx_runtime,
  require_react
} from "./chunk-SOYW6UE7.js";

// src/components/auth/TwoFactorChallengeModal.jsx
init_define_import_meta_env();
var import_react = __toESM(require_react(), 1);
var import_jsx_runtime = __toESM(require_jsx_runtime(), 1);
var overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0, 0, 0, 0.8)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 2e3,
  backdropFilter: "blur(8px)"
};
var cardStyle = {
  background: "var(--bg)",
  borderRadius: 16,
  padding: 32,
  maxWidth: 420,
  width: "92%",
  border: "1px solid var(--line)",
  boxShadow: "0 20px 50px rgba(0,0,0,0.3)"
};
function TwoFactorChallengeModal({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
  error = "",
  email = "",
  devCode = "",
  delivery = null
}) {
  const [code, setCode] = (0, import_react.useState)("");
  (0, import_react.useEffect)(() => {
    if (!isOpen) {
      setCode("");
    }
  }, [isOpen]);
  if (!isOpen) return null;
  const handleSubmit = () => {
    const normalized = String(code || "").replace(/\D/g, "").slice(0, 6);
    if (normalized.length === 6) {
      onSubmit(normalized);
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: overlayStyle, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "glass-card", style: cardStyle, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { style: { marginBottom: 12, textAlign: "center" }, children: "\u062A\u0623\u0643\u064A\u062F \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { className: "muted", style: { textAlign: "center", marginBottom: 18 }, children: [
      "\u062A\u0645 \u0625\u0631\u0633\u0627\u0644 \u0631\u0645\u0632 \u062A\u062D\u0642\u0642 \u0645\u0646 6 \u0623\u0631\u0642\u0627\u0645 \u0644\u0625\u0643\u0645\u0627\u0644 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644",
      email ? ` \u0625\u0644\u0649 ${email}` : "",
      "."
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      Input,
      {
        label: "\u0631\u0645\u0632 \u0627\u0644\u062A\u062D\u0642\u0642",
        type: "text",
        placeholder: "000000",
        value: code,
        onChange: (event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6)),
        maxLength: "6",
        autoFocus: true
      }
    ),
    delivery ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "muted", style: { fontSize: 12, marginTop: 10, lineHeight: 1.7 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        "\u0637\u0631\u064A\u0642\u0629 \u0627\u0644\u0625\u0631\u0633\u0627\u0644: ",
        delivery.provider || "email"
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        "\u0635\u0644\u0627\u062D\u064A\u0629 \u0627\u0644\u0631\u0645\u0632: ",
        delivery.code_expires_in_minutes || 10,
        " \u062F\u0642\u0627\u0626\u0642"
      ] })
    ] }) : null,
    devCode ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "alert success", style: { marginTop: 12 }, children: [
      "\u0631\u0645\u0632 \u0627\u0644\u062A\u0637\u0648\u064A\u0631: ",
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: devCode })
    ] }) : null,
    error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "alert error", style: { marginTop: 12 }, children: error }) : null,
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: 12, marginTop: 24 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, { onClick: handleSubmit, loading, disabled: loading || code.length !== 6, style: { flex: 2 }, children: "\u062A\u0623\u0643\u064A\u062F \u0627\u0644\u0631\u0645\u0632" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, { variant: "secondary", onClick: onClose, disabled: loading, style: { flex: 1 }, children: "\u0625\u0644\u063A\u0627\u0621" })
    ] })
  ] }) });
}

export {
  TwoFactorChallengeModal
};
