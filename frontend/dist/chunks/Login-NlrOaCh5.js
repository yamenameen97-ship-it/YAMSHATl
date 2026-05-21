import { r as reactExports, u as useNavigate, a as useLocation, j as jsxRuntimeExports, L as Link, B as Button, s as setStoredUser, g as getDefaultPostLoginPath } from "../index-DuXBJv5q.js";
import { I as Input } from "./Input-B86JccIb.js";
import { A as AuthShell, l as localizeAuthMessage, p as parseApiDetail, a as looksLikeEmail, i as isValidEmail } from "./authValidation-C9DebCcL.js";
import { C as CaptchaBox, s as sanitizeInputText } from "./sanitize-wjAo3Zg-.js";
import { T as TwoFactorChallengeModal } from "./TwoFactorChallengeModal-3BTBUGV0.js";
import { g as getCaptchaChallenge, v as verifyTwoFactorLogin, l as loginUser } from "./auth-BuYaukiy.js";
import { u as useSingleFlight } from "./useSingleFlight-BZ92gu-c.js";
import "./proxy-BFepwXo2.js";
function LoginEnhanced() {
  const [form, setForm] = reactExports.useState({
    identifier: "",
    password: "",
    rememberMe: true,
    captchaAnswer: ""
  });
  const [loading, setLoading] = reactExports.useState(false);
  const [captchaLoading, setCaptchaLoading] = reactExports.useState(false);
  const [captcha, setCaptcha] = reactExports.useState(null);
  const [error, setError] = reactExports.useState("");
  const [captchaError, setCaptchaError] = reactExports.useState("");
  const [show2FAModal, setShow2FAModal] = reactExports.useState(false);
  const [pendingChallenge, setPendingChallenge] = reactExports.useState(null);
  const [twoFactorError, setTwoFactorError] = reactExports.useState("");
  const [twoFactorLoading, setTwoFactorLoading] = reactExports.useState(false);
  const [captchaCooldown, setCaptchaCooldown] = reactExports.useState(0);
  const [retryCount, setRetryCount] = reactExports.useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { run: runLogin } = useSingleFlight();
  reactExports.useEffect(() => {
    if (captchaCooldown <= 0) return;
    const timer = setInterval(() => setCaptchaCooldown((c) => c - 1), 1e3);
    return () => clearInterval(timer);
  }, [captchaCooldown]);
  const loadCaptcha = async () => {
    if (captchaCooldown > 0) return;
    try {
      setCaptchaLoading(true);
      setCaptchaError("");
      const { data } = await getCaptchaChallenge();
      setCaptcha(data);
      setForm((prev) => ({ ...prev, captchaAnswer: "" }));
      setCaptchaCooldown(5);
    } catch (err) {
      setCaptchaError(localizeAuthMessage(err?.response?.data?.detail, "تعذر تحميل الكابتشا حالياً. حاول مجدداً بعد قليل."));
    } finally {
      setCaptchaLoading(false);
    }
  };
  reactExports.useEffect(() => {
    loadCaptcha();
  }, []);
  const handleChange = (key) => (event) => {
    const value = key === "rememberMe" ? event.target.checked : event.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
    if (error) setError("");
  };
  const completeLogin = (data) => {
    setStoredUser(data, { persist: form.rememberMe });
    const fallbackPath = getDefaultPostLoginPath(data);
    navigate(location.state?.from?.pathname || fallbackPath, { replace: true });
  };
  const closeTwoFactorModal = () => {
    setShow2FAModal(false);
    setPendingChallenge(null);
    setTwoFactorError("");
  };
  const handleTwoFactorSubmit = async (code) => {
    if (!pendingChallenge?.challenge_id || !pendingChallenge?.email) {
      setTwoFactorError("بيانات التحقق الإضافي غير مكتملة. حاول تسجيل الدخول من جديد.");
      return;
    }
    try {
      setTwoFactorLoading(true);
      setTwoFactorError("");
      const { data } = await verifyTwoFactorLogin({
        email: pendingChallenge.email,
        challenge_id: pendingChallenge.challenge_id,
        code,
        remember_me: pendingChallenge.remember_me
      });
      closeTwoFactorModal();
      completeLogin(data);
    } catch (err) {
      const parsed = parseApiDetail(err?.response?.data?.detail, "رمز التحقق غير صحيح أو انتهت صلاحيته.");
      setTwoFactorError(parsed?.message || "رمز التحقق غير صحيح أو انتهت صلاحيته.");
    } finally {
      setTwoFactorLoading(false);
    }
  };
  const handleSubmit = async (event) => {
    if (event) event.preventDefault();
    const identifier = sanitizeInputText(form.identifier, { maxLength: 120 });
    if (!identifier) {
      setError("يرجى إدخال البريد الإلكتروني أو اسم المستخدم.");
      return;
    }
    if (looksLikeEmail(identifier) && !isValidEmail(identifier)) {
      setError("تنسيق البريد الإلكتروني غير صحيح.");
      return;
    }
    if (!form.password.trim()) {
      setError("كلمة المرور مطلوبة.");
      return;
    }
    if (!captcha?.captcha_id) {
      setError("يرجى حل الكابتشا للمتابعة.");
      loadCaptcha();
      return;
    }
    if (!form.captchaAnswer) {
      setError("يرجى إدخال رمز الكابتشا.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await runLogin(async () => {
        return await loginUser({
          identifier,
          password: form.password,
          remember_me: form.rememberMe,
          captcha_id: captcha.captcha_id,
          captcha_answer: form.captchaAnswer
        });
      });
      const { data } = result;
      if (data?.requires_2fa && data?.challenge_id) {
        setPendingChallenge({
          challenge_id: data.challenge_id,
          email: data.email,
          remember_me: form.rememberMe,
          delivery: data.delivery || null,
          devCode: data.dev_verification_code || ""
        });
        setTwoFactorError("");
        setShow2FAModal(true);
        return;
      }
      completeLogin(data);
    } catch (err) {
      setRetryCount((prev) => prev + 1);
      const apiError = parseApiDetail(err?.response?.data?.detail);
      const message = localizeAuthMessage(apiError?.message || err?.message, "فشل تسجيل الدخول. يرجى التأكد من البيانات والمحاولة مرة أخرى.");
      setError(message);
      if (apiError?.field === "captcha" || message.includes("كابتشا")) {
        loadCaptcha();
      }
    } finally {
      setLoading(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    AuthShell,
    {
      badge: "YAMSHAT",
      title: "تسجيل الدخول",
      description: "مرحباً بك مجدداً في يمشات. سجل دخولك للمتابعة.",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { className: "auth-form auth-form-enhanced", onSubmit: handleSubmit, noValidate: true, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "auth-form-head", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { children: "تسجيل الدخول" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "muted", children: "أدخل بيانات حسابك للوصول إلى لوحة التحكم." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              label: "اسم المستخدم أو البريد",
              placeholder: "username / email",
              value: form.identifier,
              onChange: handleChange("identifier"),
              autoComplete: "username",
              disabled: loading,
              required: true
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { position: "relative" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                label: "كلمة المرور",
                type: "password",
                placeholder: "••••••••",
                value: form.password,
                onChange: handleChange("password"),
                autoComplete: "current-password",
                disabled: loading,
                required: true
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Link,
              {
                to: "/forgot-password",
                className: "auth-inline-link",
                style: { position: "absolute", top: 0, left: 0, fontSize: 12 },
                children: "نسيت كلمة المرور؟"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            CaptchaBox,
            {
              challenge: captcha,
              value: form.captchaAnswer,
              onChange: handleChange("captchaAnswer"),
              onRefresh: loadCaptcha,
              loading: captchaLoading,
              error: captchaError,
              disabled: loading || captchaCooldown > 0,
              refreshCooldown: captchaCooldown
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { margin: "16px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { style: { display: "flex", alignItems: "center", gap: 8, cursor: "pointer", userSelect: "none" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "checkbox",
                checked: form.rememberMe,
                onChange: handleChange("rememberMe"),
                disabled: loading
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: 14 }, children: "تذكرني على هذا الجهاز" })
          ] }) }),
          error && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "alert error", style: { display: "flex", alignItems: "center", gap: 10, animation: "shake 0.4s ease" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "12", cy: "12", r: "10" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "12", y1: "8", x2: "12", y2: "12" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "12", y1: "16", x2: "12.01", y2: "16" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1 }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: error }),
              retryCount > 2 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: 11, marginTop: 4, opacity: 0.8 }, children: "إذا كنت تواجه مشكلة مستمرة، يرجى إعادة تعيين كلمة المرور." })
            ] }),
            retryCount > 1 && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: handleSubmit, disabled: loading, style: { background: "none", border: "none", color: "inherit", cursor: "pointer", textDecoration: "underline", fontSize: 12 }, children: "إعادة المحاولة" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              type: "submit",
              loading,
              disabled: loading || !form.identifier || !form.password || !form.captchaAnswer,
              style: { height: 50, fontSize: 16, fontWeight: "bold" },
              children: loading ? "جاري التحقق..." : "تسجيل الدخول"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "auth-form-footer", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "ليس لديك حساب؟" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/register", className: "link-btn", children: "إنشاء حساب جديد" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          TwoFactorChallengeModal,
          {
            isOpen: show2FAModal,
            onClose: closeTwoFactorModal,
            onSubmit: handleTwoFactorSubmit,
            loading: twoFactorLoading,
            error: twoFactorError,
            email: pendingChallenge?.email || "",
            devCode: pendingChallenge?.devCode || "",
            delivery: pendingChallenge?.delivery || null
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .auth-form-enhanced {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
      ` })
      ]
    }
  );
}
export {
  LoginEnhanced as default
};
