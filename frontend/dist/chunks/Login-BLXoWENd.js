import { aP as reactExports, am as jsxRuntimeExports, c as Button, b9 as useNavigate, b8 as useLocation, f as Link, a_ as setStoredUser, a3 as getDefaultPostLoginPath } from "../index-T8PSkq5D.js";
import { I as Input } from "./Input-DVtIP6sp.js";
import { A as AuthShell, l as localizeAuthMessage, p as parseApiDetail, a as looksLikeEmail, i as isValidEmail } from "./authValidation-BpxVNcip.js";
import { C as CaptchaBox, s as sanitizeInputText } from "./sanitize-D-tB03Eq.js";
import { T as TwoFactorChallengeModal } from "./TwoFactorChallengeModal-CfbFRJ96.js";
import { c as loginWithGoogle, b as loginWithFacebook, a as loginWithApple, g as getCaptchaChallenge, k as verifyTwoFactorLogin, l as loginUser } from "./auth-CwyBvh2q.js";
import { u as useSingleFlight } from "./useSingleFlight-BIl1381x.js";
import "./BrandLogo-B8rkCqHE.js";
const PROVIDERS = [
  { key: "google", label: "المتابعة باستخدام Google", icon: "G", color: "#4285F4", action: loginWithGoogle },
  { key: "facebook", label: "المتابعة باستخدام Facebook", icon: "f", color: "#1877F2", action: loginWithFacebook },
  { key: "apple", label: "المتابعة باستخدام Apple", icon: "", color: "#111827", action: loginWithApple }
];
function SocialLoginButtons({ onSuccess, disabled = false }) {
  const [busyProvider, setBusyProvider] = reactExports.useState("");
  const [error, setError] = reactExports.useState("");
  const providers = reactExports.useMemo(() => PROVIDERS, []);
  const handleProviderLogin = async (provider) => {
    try {
      setBusyProvider(provider.key);
      setError("");
      const payload = await provider.action();
      if (payload?.pendingRedirect) return;
      if (payload && onSuccess) onSuccess(payload);
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || `تعذر إكمال تسجيل الدخول عبر ${provider.label}.`);
    } finally {
      setBusyProvider("");
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "social-login-block", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "social-login-divider", "aria-hidden": "true", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "أو" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", {})
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "social-login-grid", children: providers.map((provider) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Button,
      {
        type: "button",
        variant: "secondary",
        onClick: () => handleProviderLogin(provider),
        disabled: disabled || Boolean(busyProvider && busyProvider !== provider.key),
        loading: busyProvider === provider.key,
        className: "social-login-btn",
        style: { justifyContent: "flex-start", gap: 12, minHeight: 48 },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "span",
            {
              "aria-hidden": "true",
              style: {
                width: 24,
                height: 24,
                borderRadius: 999,
                background: provider.color,
                color: "#fff",
                display: "inline-grid",
                placeItems: "center",
                fontWeight: 700,
                flexShrink: 0
              },
              children: provider.icon
            }
          ),
          provider.label
        ]
      },
      provider.key
    )) }),
    error ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "alert error", style: { marginTop: 12 }, children: error }) : null
  ] });
}
function decodeOAuthPayload(hashValue = "") {
  const rawHash = String(hashValue || "").replace(/^#/, "");
  const params = new URLSearchParams(rawHash);
  const encodedPayload = params.get("oauth_payload") || "";
  if (!encodedPayload) return null;
  try {
    const normalized = encodedPayload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const decoded = window.atob(padded);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}
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
  const loadCaptcha = async (force = false) => {
    if (!force && captchaCooldown > 0) return;
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
    loadCaptcha(true);
  }, []);
  reactExports.useEffect(() => {
    if (!captcha?.expires_in_seconds) return void 0;
    const ms = Math.max((Number(captcha.expires_in_seconds) - 30) * 1e3, 30 * 1e3);
    const timer = setTimeout(() => loadCaptcha(true), ms);
    return () => clearTimeout(timer);
  }, [captcha?.captcha_id]);
  const handleChange = (key) => (event) => {
    const value = key === "rememberMe" ? event.target.checked : event.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
    if (error) setError("");
  };
  const completeLogin = (data) => {
    setStoredUser({
      ...data,
      remember_me: data?.remember_me ?? form.rememberMe
    });
    const fallbackPath = getDefaultPostLoginPath(data);
    navigate(location.state?.from?.pathname || fallbackPath, { replace: true });
  };
  reactExports.useEffect(() => {
    const oauthError = new URLSearchParams(location.search).get("oauth_error");
    if (oauthError) {
      setError(oauthError);
      window.history.replaceState({}, document.title, "/login");
      return;
    }
    const payload = decodeOAuthPayload(window.location.hash);
    if (!payload?.token) return;
    window.history.replaceState({}, document.title, "/login");
    completeLogin(payload);
  }, [location.search]);
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
      const captchaRelated = apiError?.field === "captcha" || message.includes("كابتشا") || message.toLowerCase?.().includes("captcha");
      if (captchaRelated) {
        setForm((prev) => ({ ...prev, captchaAnswer: "" }));
        loadCaptcha(true);
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
      description: "مرحباً بك مجدداً في يام شات. سجل دخولك للمتابعة.",
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
              disabled: loading,
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
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            SocialLoginButtons,
            {
              disabled: loading || captchaLoading,
              onSuccess: (payload) => completeLogin(payload)
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
        .social-login-divider {
          display: flex;
          align-items: center;
          gap: 10px;
          color: var(--muted);
          font-size: 12px;
        }
        .social-login-divider span {
          flex: 1;
          height: 1px;
          background: rgba(148, 163, 184, 0.18);
        }
        .social-login-grid {
          display: grid;
          gap: 10px;
        }
      ` })
      ]
    }
  );
}
export {
  LoginEnhanced as default
};
