import { a$ as useLocation, b0 as useNavigate, aK as reactExports, ah as jsxRuntimeExports, c as Button, f as Link, aS as setStoredUser, a0 as getDefaultPostLoginPath } from "../index-Dz8FA2T4.js";
import { n as normalizeOtpDigits, A as AuthShell, i as isValidEmail, l as localizeAuthMessage } from "./authValidation-CTLC0RAQ.js";
import { O as OtpCodeInput } from "./OtpCodeInput-C3mQkxG-.js";
import { v as verifyEmail, h as resendVerification } from "./auth-DP2KaJez.js";
import { u as useSingleFlight } from "./useSingleFlight-CRwptUxL.js";
import "./BrandLogo-ChpT5I0m.js";
function VerifyEmail() {
  const location = useLocation();
  const navigate = useNavigate();
  const initialEmail = reactExports.useMemo(() => location.state?.email || "", [location.state]);
  const initialCode = reactExports.useMemo(() => normalizeOtpDigits(location.state?.devCode || location.state?.code || ""), [location.state]);
  const [form, setForm] = reactExports.useState({
    email: initialEmail,
    code: initialCode,
    rememberMe: Boolean(location.state?.rememberMe ?? true)
  });
  const [loading, setLoading] = reactExports.useState(false);
  const [resending, setResending] = reactExports.useState(false);
  const [error, setError] = reactExports.useState("");
  const [success, setSuccess] = reactExports.useState(location.state?.message || "");
  const [devCode, setDevCode] = reactExports.useState(location.state?.devCode || "");
  const [cooldown, setCooldown] = reactExports.useState(30);
  const [attempts, setAttempts] = reactExports.useState(0);
  const [showFallback, setShowFallback] = reactExports.useState(false);
  const [isTimeout, setIsTimeout] = reactExports.useState(false);
  const { run: runVerify } = useSingleFlight();
  const timerRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    if (cooldown <= 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setCooldown((prev) => Math.max(prev - 1, 0));
    }, 1e3);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [cooldown]);
  reactExports.useEffect(() => {
    const timeout = setTimeout(() => {
      setIsTimeout(true);
      setError("انتهت صلاحية الجلسة. يرجى طلب كود جديد.");
    }, 10 * 60 * 1e3);
    return () => clearTimeout(timeout);
  }, []);
  const handleSubmit = async (incomingCode = form.code) => {
    const code = normalizeOtpDigits(incomingCode);
    if (!isValidEmail(form.email)) {
      setError("البريد الإلكتروني غير صحيح.");
      return;
    }
    if (code.length !== 6) {
      setError("يرجى إدخال الرمز المكون من 6 أرقام.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await runVerify(async () => {
        return await verifyEmail({
          email: form.email.trim().toLowerCase(),
          code,
          remember_me: form.rememberMe
        });
      });
      const { data } = result;
      setStoredUser(data);
      navigate(getDefaultPostLoginPath(data), { replace: true });
    } catch (err) {
      const msg = localizeAuthMessage(err?.response?.data?.detail, "رمز التفعيل غير صحيح أو انتهت صلاحيته.");
      setError(msg);
      setAttempts((prev) => prev + 1);
      if (attempts >= 2) {
        setShowFallback(true);
      }
    } finally {
      setLoading(false);
    }
  };
  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    if (!isValidEmail(form.email)) {
      setError("يرجى إدخال بريد إلكتروني صحيح.");
      return;
    }
    setResending(true);
    setError("");
    setSuccess("");
    try {
      const { data } = await resendVerification({ email: form.email.trim().toLowerCase() });
      setSuccess(localizeAuthMessage(data?.message, "تم إرسال كود جديد إلى بريدك الإلكتروني."));
      setDevCode(data?.dev_verification_code || "");
      if (data?.dev_verification_code) {
        setForm((prev) => ({ ...prev, code: normalizeOtpDigits(data.dev_verification_code) }));
      }
      setCooldown(60);
      setIsTimeout(false);
      setAttempts(0);
      setShowFallback(false);
    } catch (err) {
      setError(localizeAuthMessage(err?.response?.data?.detail, "تعذر إعادة إرسال الكود حالياً. حاول مجدداً بعد قليل."));
    } finally {
      setResending(false);
    }
  };
  reactExports.useEffect(() => {
    if (form.code.length === 6 && !loading) {
      handleSubmit(form.code);
    }
  }, [form.code]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    AuthShell,
    {
      badge: "YAMSHAT",
      title: "تأكيد الحساب",
      description: "أدخل رمز التحقق المرسل إلى بريدك الإلكتروني لتفعيل حسابك.",
      alternateAction: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "muted", children: "هل تريد تغيير البريد؟" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/register", className: "auth-inline-link", children: "العودة للتسجيل" })
      ] }),
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { className: "auth-form auth-form-enhanced", onSubmit: (event) => {
          event.preventDefault();
          handleSubmit();
        }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "auth-form-head", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", justifyContent: "center", marginBottom: 20 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "icon-circle", style: { width: 64, height: 64, background: "rgba(var(--accent-rgb), 0.1)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)" }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "32", height: "32", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "22,6 12,13 2,6" })
            ] }) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { children: "تحقق من بريدك" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "muted", children: [
              "أرسلنا كود التفعيل إلى ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { style: { color: "var(--text)" }, children: form.email })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            OtpCodeInput,
            {
              value: form.code,
              onChange: (next) => setForm((prev) => ({ ...prev, code: next })),
              onComplete: handleSubmit,
              disabled: loading || isTimeout,
              label: "رمز التحقق"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { margin: "16px 0" }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "remember-me-row", style: { display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "checkbox",
                checked: form.rememberMe,
                onChange: (event) => setForm((prev) => ({ ...prev, rememberMe: event.target.checked })),
                disabled: loading
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: 14 }, children: "تذكّرني على هذا الجهاز" })
          ] }) }),
          success && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "alert success animate-fade-in", children: success }),
          devCode && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "alert info", style: { background: "rgba(255,255,255,0.05)", border: "1px dashed var(--line)" }, children: [
            "كود المطور المحاكي: ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("code", { children: devCode })
          ] }),
          error && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "alert error animate-shake", children: error }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", loading, disabled: loading || isTimeout || form.code.length !== 6, style: { height: 50 }, children: loading ? "جاري التحقق..." : "تأكيد الرمز" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { textAlign: "center", marginTop: 16 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              className: "link-btn",
              disabled: resending || cooldown > 0,
              onClick: handleResend,
              style: { opacity: cooldown > 0 ? 0.6 : 1 },
              children: resending ? "جاري الإرسال..." : cooldown > 0 ? `إعادة الإرسال خلال ${cooldown}ث` : "لم يصلك الكود؟ إعادة إرسال"
            }
          ) }),
          showFallback && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "fallback-section animate-fade-in", style: { marginTop: 24, padding: 16, background: "var(--bg-soft)", borderRadius: 12, border: "1px solid var(--line)" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { style: { marginBottom: 8, fontSize: 14 }, children: "تواجه مشكلة؟" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { style: { fontSize: 13, paddingRight: 20, margin: 0, color: "var(--muted)" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "تأكد من مجلد الرسائل غير المرغوب فيها (Spam)." }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "تأكد من كتابة البريد الإلكتروني بشكل صحيح." }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/support", className: "auth-inline-link", children: "تواصل مع الدعم الفني" }) })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
        .animate-fade-in { animation: fadeIn 0.4s ease-out; }
        .animate-shake { animation: shake 0.4s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
        .icon-circle { animation: pulse 2s infinite; }
        @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(var(--accent-rgb), 0.4); } 70% { box-shadow: 0 0 0 15px rgba(var(--accent-rgb), 0); } 100% { box-shadow: 0 0 0 0 rgba(var(--accent-rgb), 0); } }
      ` })
      ]
    }
  );
}
export {
  VerifyEmail as default
};
