import { a as useLocation, u as useNavigate, r as reactExports, j as jsxRuntimeExports, B as Button, L as Link } from "../index-D6u1FUhW.js";
import { I as Input } from "./Input-seVNQLEe.js";
import { n as normalizeOtpDigits, A as AuthShell, l as localizeAuthMessage, i as isValidEmail } from "./authValidation-CEW5dnXp.js";
import { O as OtpCodeInput } from "./OtpCodeInput-CBX1INN3.js";
import { f as forgotPassword, c as verifyResetCode, e as resetPassword } from "./auth-B1x7DPWW.js";
function PasswordRecoveryFlow({ initialStep = "request" }) {
  const location = useLocation();
  const navigate = useNavigate();
  const initialEmail = reactExports.useMemo(() => location.state?.email || "", [location.state]);
  const initialCode = reactExports.useMemo(() => normalizeOtpDigits(location.state?.code || ""), [location.state]);
  const [step, setStep] = reactExports.useState(initialStep === "reset" ? "verify" : initialStep);
  const [email, setEmail] = reactExports.useState(initialEmail);
  const [code, setCode] = reactExports.useState(initialCode);
  const [password, setPassword] = reactExports.useState("");
  const [confirmPassword, setConfirmPassword] = reactExports.useState("");
  const [loading, setLoading] = reactExports.useState(false);
  const [verifying, setVerifying] = reactExports.useState(false);
  const [saving, setSaving] = reactExports.useState(false);
  const [error, setError] = reactExports.useState("");
  const [success, setSuccess] = reactExports.useState(location.state?.message || "");
  const [devCode, setDevCode] = reactExports.useState(location.state?.devCode || "");
  const autoVerifiedCodeRef = reactExports.useRef("");
  const validateEmailStep = () => {
    if (!email.trim()) {
      setError("اكتب البريد الإلكتروني المسجل بالحساب.");
      return false;
    }
    if (!isValidEmail(email)) {
      setError("البريد الإلكتروني غير صحيح.");
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
      setSuccess(localizeAuthMessage(data?.message, "تم إرسال رمز تحقق على البريد الإلكتروني."));
      setDevCode(data?.dev_reset_code || "");
      setCode("");
      autoVerifiedCodeRef.current = "";
    } catch (err) {
      setError(localizeAuthMessage(err?.response?.data?.detail, "تعذر إرسال رمز الاسترجاع."));
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
      setSuccess(localizeAuthMessage(data?.message, "تم التحقق من الرمز. اكتب كلمة المرور الجديدة."));
      autoVerifiedCodeRef.current = normalizedCode;
    } catch (err) {
      autoVerifiedCodeRef.current = "";
      setError(localizeAuthMessage(err?.response?.data?.detail, "رمز التحقق غير صحيح."));
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
      setError("اكتب رمز التحقق الكامل أولاً.");
      setStep("verify");
      return;
    }
    if (password.length < 6) {
      setError("كلمة المرور لازم تكون 6 أحرف على الأقل.");
      return;
    }
    if (password !== confirmPassword) {
      setError("تأكيد كلمة المرور غير مطابق.");
      return;
    }
    setSaving(true);
    try {
      const { data } = await resetPassword({
        email: email.trim().toLowerCase(),
        code: normalizeOtpDigits(code),
        new_password: password
      });
      setSuccess(localizeAuthMessage(data?.message, "تم تحديث كلمة المرور بنجاح."));
      setTimeout(() => navigate("/login", { replace: true }), 1200);
    } catch (err) {
      setError(localizeAuthMessage(err?.response?.data?.detail, "تعذر تحديث كلمة المرور."));
    } finally {
      setSaving(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    AuthShell,
    {
      badge: "YAMSHAT",
      title: "استرجاع كلمة المرور",
      description: "اطلب رمز تحقق، وبعد ما يتأكد هيفتح لك فورم كلمة المرور الجديدة مباشرة.",
      alternateAction: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "muted", children: "رجوع" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/login", className: "auth-inline-link", children: "تسجيل الدخول" })
      ] }),
      footer: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        "دخول الإدارة يتم من ",
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/admin/login", children: "/admin/login" }),
        " أو ",
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/admin.html", children: "/admin.html" }),
        "."
      ] }),
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { className: "auth-form auth-form-enhanced", onSubmit: step === "reset" ? savePassword : sendCode, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "auth-form-head", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { children: "تغيير كلمة المرور" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "muted", children: [
            step === "request" && "ابدأ بإرسال رمز التحقق على البريد الإلكتروني.",
            step === "verify" && "تم فتح مربع الرمز. أول ما الرمز يبقى صحيح هنفتح فورم كلمة المرور الجديدة.",
            step === "reset" && "الرمز صحيح. اكتب كلمة المرور الجديدة ثم احفظ."
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            label: "البريد الإلكتروني",
            placeholder: "user@mail.com",
            type: "email",
            autoComplete: "email",
            value: email,
            onChange: (event) => setEmail(event.target.value)
          }
        ),
        step === "request" ? /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", loading, disabled: loading, children: loading ? "جارٍ إرسال الرمز..." : "إرسال رمز التحقق" }) : null,
        step !== "request" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            OtpCodeInput,
            {
              value: code,
              onChange: setCode,
              onComplete: handleOtpComplete,
              disabled: verifying || saving,
              label: "رمز التحقق",
              hint: "لو نسخت الرمز من البريد أو الحافظة هيتوزع تلقائياً على المربعات."
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: "12px", flexWrap: "wrap" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", loading: verifying, disabled: verifying || code.length !== 6, onClick: () => verifyCode(code), children: verifying ? "جارٍ التحقق..." : step === "reset" ? "تم التحقق" : "تأكيد الرمز" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "secondary", loading, disabled: loading, onClick: sendCode, children: "إعادة إرسال الرمز" })
          ] })
        ] }) : null,
        step === "reset" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              label: "كلمة المرور الجديدة",
              type: "password",
              autoComplete: "new-password",
              placeholder: "••••••••",
              value: password,
              onChange: (event) => setPassword(event.target.value),
              hint: "6 أحرف على الأقل"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              label: "تأكيد كلمة المرور",
              type: "password",
              autoComplete: "new-password",
              placeholder: "••••••••",
              value: confirmPassword,
              onChange: (event) => setConfirmPassword(event.target.value)
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", loading: saving, disabled: saving, children: saving ? "جارٍ حفظ كلمة المرور..." : "حفظ كلمة المرور الجديدة" })
        ] }) : null,
        success ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "alert success", children: success }) : null,
        devCode ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "alert", children: [
          "كود التطوير: ",
          devCode
        ] }) : null,
        error ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "alert error", children: error }) : null
      ] })
    }
  );
}
export {
  PasswordRecoveryFlow as P
};
