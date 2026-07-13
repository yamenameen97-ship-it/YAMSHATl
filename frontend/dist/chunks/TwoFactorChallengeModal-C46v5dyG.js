import { a_ as reactExports, aq as jsxRuntimeExports, c as Button } from "../index-2I4hYPnI.js";
import { I as Input } from "./Input-BbnyGTK3.js";
const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0, 0, 0, 0.8)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 2e3,
  backdropFilter: "blur(8px)"
};
const cardStyle = {
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
  const [code, setCode] = reactExports.useState("");
  reactExports.useEffect(() => {
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
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: overlayStyle, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass-card", style: cardStyle, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { style: { marginBottom: 12, textAlign: "center" }, children: "تأكيد تسجيل الدخول" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "muted", style: { textAlign: "center", marginBottom: 18 }, children: [
      "تم إرسال رمز تحقق من 6 أرقام لإكمال تسجيل الدخول",
      email ? ` إلى ${email}` : "",
      "."
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Input,
      {
        label: "رمز التحقق",
        type: "text",
        placeholder: "000000",
        value: code,
        onChange: (event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6)),
        maxLength: "6",
        autoFocus: true
      }
    ),
    delivery ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "muted", style: { fontSize: 12, marginTop: 10, lineHeight: 1.7 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        "طريقة الإرسال: ",
        delivery.provider || "email"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        "صلاحية الرمز: ",
        delivery.code_expires_in_minutes || 10,
        " دقائق"
      ] })
    ] }) : null,
    devCode ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "alert success", style: { marginTop: 12 }, children: [
      "رمز التطوير: ",
      /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: devCode })
    ] }) : null,
    error ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "alert error", style: { marginTop: 12 }, children: error }) : null,
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 12, marginTop: 24 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleSubmit, loading, disabled: loading || code.length !== 6, style: { flex: 2 }, children: "تأكيد الرمز" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", onClick: onClose, disabled: loading, style: { flex: 1 }, children: "إلغاء" })
    ] })
  ] }) });
}
export {
  TwoFactorChallengeModal as T
};
