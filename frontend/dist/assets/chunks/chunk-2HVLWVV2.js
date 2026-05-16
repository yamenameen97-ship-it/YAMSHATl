import {
  OtpCodeInput
} from "./chunk-4IZ2IZPF.js";
import {
  AuthShell,
  isValidEmail,
  localizeAuthMessage,
  normalizeOtpDigits
} from "./chunk-2GKLYX3P.js";
import {
  forgotPassword,
  resetPassword,
  verifyResetCode
} from "./chunk-27I664WH.js";
import {
  Input
} from "./chunk-RYTW2TDG.js";
import {
  Button
} from "./chunk-EHD43N2I.js";
import {
  Link,
  useLocation,
  useNavigate
} from "./chunk-FJN4GIYV.js";
import {
  __toESM,
  init_define_import_meta_env,
  require_jsx_runtime,
  require_react
} from "./chunk-SOYW6UE7.js";

// src/components/auth/PasswordRecoveryFlow.jsx
init_define_import_meta_env();
var import_react = __toESM(require_react(), 1);
var import_jsx_runtime = __toESM(require_jsx_runtime(), 1);
function PasswordRecoveryFlow({ initialStep = "request" }) {
  const location = useLocation();
  const navigate = useNavigate();
  const initialEmail = (0, import_react.useMemo)(() => location.state?.email || "", [location.state]);
  const initialCode = (0, import_react.useMemo)(() => normalizeOtpDigits(location.state?.code || ""), [location.state]);
  const [step, setStep] = (0, import_react.useState)(initialStep === "reset" ? "verify" : initialStep);
  const [email, setEmail] = (0, import_react.useState)(initialEmail);
  const [code, setCode] = (0, import_react.useState)(initialCode);
  const [password, setPassword] = (0, import_react.useState)("");
  const [confirmPassword, setConfirmPassword] = (0, import_react.useState)("");
  const [loading, setLoading] = (0, import_react.useState)(false);
  const [verifying, setVerifying] = (0, import_react.useState)(false);
  const [saving, setSaving] = (0, import_react.useState)(false);
  const [error, setError] = (0, import_react.useState)("");
  const [success, setSuccess] = (0, import_react.useState)(location.state?.message || "");
  const [devCode, setDevCode] = (0, import_react.useState)(location.state?.devCode || "");
  const autoVerifiedCodeRef = (0, import_react.useRef)("");
  const validateEmailStep = () => {
    if (!email.trim()) {
      setError("\u0627\u0643\u062A\u0628 \u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0627\u0644\u0645\u0633\u062C\u0644 \u0628\u0627\u0644\u062D\u0633\u0627\u0628.");
      return false;
    }
    if (!isValidEmail(email)) {
      setError("\u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u063A\u064A\u0631 \u0635\u062D\u064A\u062D.");
      return false;
    }
    return true;
  };
  const sendCode = async (event) => {
    event?.preventDefault?.();
    setError("");
    setSuccess("");
    if (!validateEmailStep()) return;
    setLoading(true);
    try {
      const { data } = await forgotPassword({ email: email.trim().toLowerCase() });
      setStep("verify");
      setSuccess(localizeAuthMessage(data?.message, "\u062A\u0645 \u0625\u0631\u0633\u0627\u0644 \u0631\u0645\u0632 \u062A\u062D\u0642\u0642 \u0639\u0644\u0649 \u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A."));
      setDevCode(data?.dev_reset_code || "");
      setCode("");
      autoVerifiedCodeRef.current = "";
    } catch (err) {
      setError(localizeAuthMessage(err?.response?.data?.detail, "\u062A\u0639\u0630\u0631 \u0625\u0631\u0633\u0627\u0644 \u0631\u0645\u0632 \u0627\u0644\u0627\u0633\u062A\u0631\u062C\u0627\u0639."));
    } finally {
      setLoading(false);
    }
  };
  const verifyCode = async (incomingCode = code) => {
    const normalizedCode = normalizeOtpDigits(incomingCode);
    if (verifying || normalizedCode.length !== 6) return;
    if (!validateEmailStep()) return;
    setVerifying(true);
    setError("");
    setSuccess("");
    try {
      const { data } = await verifyResetCode({ email: email.trim().toLowerCase(), code: normalizedCode });
      setCode(normalizedCode);
      setStep("reset");
      setSuccess(localizeAuthMessage(data?.message, "\u062A\u0645 \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u0627\u0644\u0631\u0645\u0632. \u0627\u0643\u062A\u0628 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0627\u0644\u062C\u062F\u064A\u062F\u0629."));
      autoVerifiedCodeRef.current = normalizedCode;
    } catch (err) {
      autoVerifiedCodeRef.current = "";
      setError(localizeAuthMessage(err?.response?.data?.detail, "\u0631\u0645\u0632 \u0627\u0644\u062A\u062D\u0642\u0642 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D."));
    } finally {
      setVerifying(false);
    }
  };
  const handleOtpComplete = async (normalizedCode) => {
    setCode(normalizedCode);
    if (autoVerifiedCodeRef.current === normalizedCode) return;
    await verifyCode(normalizedCode);
  };
  const savePassword = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!validateEmailStep()) return;
    if (normalizeOtpDigits(code).length !== 6) {
      setError("\u0627\u0643\u062A\u0628 \u0631\u0645\u0632 \u0627\u0644\u062A\u062D\u0642\u0642 \u0627\u0644\u0643\u0627\u0645\u0644 \u0623\u0648\u0644\u0627\u064B.");
      setStep("verify");
      return;
    }
    if (password.length < 6) {
      setError("\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0644\u0627\u0632\u0645 \u062A\u0643\u0648\u0646 6 \u0623\u062D\u0631\u0641 \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644.");
      return;
    }
    if (password !== confirmPassword) {
      setError("\u062A\u0623\u0643\u064A\u062F \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u063A\u064A\u0631 \u0645\u0637\u0627\u0628\u0642.");
      return;
    }
    setSaving(true);
    try {
      const { data } = await resetPassword({
        email: email.trim().toLowerCase(),
        code: normalizeOtpDigits(code),
        new_password: password
      });
      setSuccess(localizeAuthMessage(data?.message, "\u062A\u0645 \u062A\u062D\u062F\u064A\u062B \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0628\u0646\u062C\u0627\u062D."));
      setTimeout(() => navigate("/login", { replace: true }), 1200);
    } catch (err) {
      setError(localizeAuthMessage(err?.response?.data?.detail, "\u062A\u0639\u0630\u0631 \u062A\u062D\u062F\u064A\u062B \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631."));
    } finally {
      setSaving(false);
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    AuthShell,
    {
      badge: "YAMSHAT",
      title: "\u0627\u0633\u062A\u0631\u062C\u0627\u0639 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631",
      description: "\u0627\u0637\u0644\u0628 \u0631\u0645\u0632 \u062A\u062D\u0642\u0642\u060C \u0648\u0628\u0639\u062F \u0645\u0627 \u064A\u062A\u0623\u0643\u062F \u0647\u064A\u0641\u062A\u062D \u0644\u0643 \u0641\u0648\u0631\u0645 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0627\u0644\u062C\u062F\u064A\u062F\u0629 \u0645\u0628\u0627\u0634\u0631\u0629.",
      alternateAction: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "muted", children: "\u0631\u062C\u0648\u0639" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, { to: "/login", className: "auth-inline-link", children: "\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644" })
      ] }),
      footer: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
        "\u062F\u062E\u0648\u0644 \u0627\u0644\u0625\u062F\u0627\u0631\u0629 \u064A\u062A\u0645 \u0645\u0646 ",
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, { to: "/admin/login", children: "/admin/login" }),
        " \u0623\u0648 ",
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, { to: "/admin.html", children: "/admin.html" }),
        "."
      ] }),
      children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", { className: "auth-form auth-form-enhanced", onSubmit: step === "reset" ? savePassword : sendCode, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "auth-form-head", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "\u062A\u063A\u064A\u064A\u0631 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { className: "muted", children: [
            step === "request" && "\u0627\u0628\u062F\u0623 \u0628\u0625\u0631\u0633\u0627\u0644 \u0631\u0645\u0632 \u0627\u0644\u062A\u062D\u0642\u0642 \u0639\u0644\u0649 \u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A.",
            step === "verify" && "\u062A\u0645 \u0641\u062A\u062D \u0645\u0631\u0628\u0639 \u0627\u0644\u0631\u0645\u0632. \u0623\u0648\u0644 \u0645\u0627 \u0627\u0644\u0631\u0645\u0632 \u064A\u0628\u0642\u0649 \u0635\u062D\u064A\u062D \u0647\u0646\u0641\u062A\u062D \u0641\u0648\u0631\u0645 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0627\u0644\u062C\u062F\u064A\u062F\u0629.",
            step === "reset" && "\u0627\u0644\u0631\u0645\u0632 \u0635\u062D\u064A\u062D. \u0627\u0643\u062A\u0628 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0627\u0644\u062C\u062F\u064A\u062F\u0629 \u062B\u0645 \u0627\u062D\u0641\u0638."
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          Input,
          {
            label: "\u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A",
            placeholder: "user@mail.com",
            type: "email",
            autoComplete: "email",
            value: email,
            onChange: (event) => setEmail(event.target.value)
          }
        ),
        step === "request" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, { type: "submit", loading, disabled: loading, children: loading ? "\u062C\u0627\u0631\u064D \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0631\u0645\u0632..." : "\u0625\u0631\u0633\u0627\u0644 \u0631\u0645\u0632 \u0627\u0644\u062A\u062D\u0642\u0642" }) : null,
        step !== "request" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            OtpCodeInput,
            {
              value: code,
              onChange: setCode,
              onComplete: handleOtpComplete,
              disabled: verifying || saving,
              label: "\u0631\u0645\u0632 \u0627\u0644\u062A\u062D\u0642\u0642",
              hint: "\u0644\u0648 \u0646\u0633\u062E\u062A \u0627\u0644\u0631\u0645\u0632 \u0645\u0646 \u0627\u0644\u0628\u0631\u064A\u062F \u0623\u0648 \u0627\u0644\u062D\u0627\u0641\u0638\u0629 \u0647\u064A\u062A\u0648\u0632\u0639 \u062A\u0644\u0642\u0627\u0626\u064A\u0627\u064B \u0639\u0644\u0649 \u0627\u0644\u0645\u0631\u0628\u0639\u0627\u062A."
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: "12px", flexWrap: "wrap" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, { type: "button", loading: verifying, disabled: verifying || code.length !== 6, onClick: () => verifyCode(code), children: verifying ? "\u062C\u0627\u0631\u064D \u0627\u0644\u062A\u062D\u0642\u0642..." : step === "reset" ? "\u062A\u0645 \u0627\u0644\u062A\u062D\u0642\u0642" : "\u062A\u0623\u0643\u064A\u062F \u0627\u0644\u0631\u0645\u0632" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, { type: "button", variant: "secondary", loading, disabled: loading, onClick: sendCode, children: "\u0625\u0639\u0627\u062F\u0629 \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0631\u0645\u0632" })
          ] })
        ] }) : null,
        step === "reset" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            Input,
            {
              label: "\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0627\u0644\u062C\u062F\u064A\u062F\u0629",
              type: "password",
              autoComplete: "new-password",
              placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
              value: password,
              onChange: (event) => setPassword(event.target.value),
              hint: "6 \u0623\u062D\u0631\u0641 \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644"
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            Input,
            {
              label: "\u062A\u0623\u0643\u064A\u062F \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631",
              type: "password",
              autoComplete: "new-password",
              placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
              value: confirmPassword,
              onChange: (event) => setConfirmPassword(event.target.value)
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, { type: "submit", loading: saving, disabled: saving, children: saving ? "\u062C\u0627\u0631\u064D \u062D\u0641\u0638 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631..." : "\u062D\u0641\u0638 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0627\u0644\u062C\u062F\u064A\u062F\u0629" })
        ] }) : null,
        success ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "alert success", children: success }) : null,
        devCode ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "alert", children: [
          "\u0643\u0648\u062F \u0627\u0644\u062A\u0637\u0648\u064A\u0631: ",
          devCode
        ] }) : null,
        error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "alert error", children: error }) : null
      ] })
    }
  );
}

export {
  PasswordRecoveryFlow
};
