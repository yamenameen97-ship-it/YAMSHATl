import { b0 as reactExports, bz as useNavigate, by as useLocation, aj as getStoredUser, ar as jsxRuntimeExports, P as PRIMARY_ADMIN_EMAIL, c as Button, f as Link, a2 as getCaptchaChallenge, bK as verifyTwoFactorLogin, ax as loginUser, z as clearStoredUser, J as devLoginUser, bh as setStoredUser, ap as isPrimaryAdminSession } from "../index-CbZjTFV4.js";
import { I as Input } from "./Input-DGgw5m9X.js";
import { A as AuthShell, l as localizeAuthMessage, p as parseApiDetail, a as looksLikeEmail, i as isValidEmail } from "./authValidation-qojcfRPm.js";
import { C as CaptchaBox, s as sanitizeInputText } from "./sanitize-C5lEGQVJ.js";
import { T as TwoFactorChallengeModal } from "./TwoFactorChallengeModal-BOryq-S8.js";
import "./BrandLogo-Kcp8I14n.js";
const canAccessAdminPanel = (session) => isPrimaryAdminSession(session);
const canShowDevTools = () => {
  if (typeof window === "undefined") return Boolean(false);
  const host = window.location.hostname;
  return Boolean(["localhost", "127.0.0.1"].includes(host));
};
function AdminLogin() {
  const [form, setForm] = reactExports.useState({ identifier: "", password: "", rememberMe: true, captchaAnswer: "" });
  const [loading, setLoading] = reactExports.useState(false);
  const [devLoading, setDevLoading] = reactExports.useState(false);
  const [captchaLoading, setCaptchaLoading] = reactExports.useState(false);
  const [captcha, setCaptcha] = reactExports.useState(null);
  const [error, setError] = reactExports.useState("");
  const [captchaError, setCaptchaError] = reactExports.useState("");
  const [show2FAModal, setShow2FAModal] = reactExports.useState(false);
  const [pendingChallenge, setPendingChallenge] = reactExports.useState(null);
  const [twoFactorError, setTwoFactorError] = reactExports.useState("");
  const [twoFactorLoading, setTwoFactorLoading] = reactExports.useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const submitLockRef = reactExports.useRef(false);
  const showDevTools = reactExports.useMemo(() => canShowDevTools(), []);
  const loadCaptcha = async () => {
    try {
      setCaptchaLoading(true);
      setCaptchaError("");
      const { data } = await getCaptchaChallenge();
      setCaptcha(data);
      setForm((prev) => ({ ...prev, captchaAnswer: "" }));
    } catch (err) {
      setCaptchaError(localizeAuthMessage(err?.response?.data?.detail, "تعذر تحميل الكابتشا حالياً."));
    } finally {
      setCaptchaLoading(false);
    }
  };
  reactExports.useEffect(() => {
    const user = getStoredUser();
    if (canAccessAdminPanel(user)) {
      navigate("/admin/dashboard", { replace: true });
      return;
    }
    loadCaptcha();
  }, [navigate]);
  const handleChange = (key) => (event) => {
    const value = key === "rememberMe" ? event.target.checked : event.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
  };
  const completeAdminLogin = (data) => {
    if (!canAccessAdminPanel(data)) {
      clearStoredUser();
      setError(`هذا الحساب لا يملك صلاحية دخول لوحة الإدارة. البريد الإداري الحالي هو ${PRIMARY_ADMIN_EMAIL}.`);
      return false;
    }
    setStoredUser(data);
    const targetPath = location.state?.from?.pathname?.startsWith("/admin") ? location.state.from.pathname : "/admin/dashboard";
    navigate(targetPath, { replace: true });
    return true;
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
      const allowed = completeAdminLogin(data);
      if (!allowed) {
        await loadCaptcha();
      }
    } catch (err) {
      const parsed = parseApiDetail(err?.response?.data?.detail, "رمز التحقق غير صحيح أو انتهت صلاحيته.");
      setTwoFactorError(parsed?.message || "رمز التحقق غير صحيح أو انتهت صلاحيته.");
    } finally {
      setTwoFactorLoading(false);
    }
  };
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitLockRef.current || loading) return;
    const identifier = sanitizeInputText(form.identifier, { maxLength: 120 });
    if (!identifier) {
      setError("اكتب بريد الإدارة أو اسم المستخدم.");
      return;
    }
    if (looksLikeEmail(identifier) && !isValidEmail(identifier)) {
      setError("البريد الإلكتروني غير صحيح.");
      return;
    }
    if (!form.password.trim()) {
      setError("اكتب كلمة المرور.");
      return;
    }
    if (!captcha?.captcha_id) {
      setError("حدّث الكابتشا أولاً.");
      await loadCaptcha();
      return;
    }
    if (!form.captchaAnswer.trim()) {
      setError("اكتب إجابة الكابتشا أولاً.");
      return;
    }
    submitLockRef.current = true;
    setLoading(true);
    setError("");
    try {
      const { data } = await loginUser({
        identifier,
        email: identifier,
        username: identifier,
        password: form.password,
        remember_me: form.rememberMe,
        captcha_id: captcha.captcha_id,
        captcha_answer: form.captchaAnswer
      });
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
      const allowed = completeAdminLogin(data);
      if (!allowed) {
        await loadCaptcha();
      }
    } catch (err) {
      clearStoredUser();
      const authError = parseApiDetail(err?.response?.data?.detail, "فشل تسجيل دخول الإدارة، راجع البيانات.");
      if (authError?.message === localizeAuthMessage("Email verification required", "لازم تفعّل البريد الإلكتروني الأول.")) {
        navigate("/verify-email", {
          state: {
            email: authError.email || identifier.trim(),
            message: "لازم تفعّل البريد الإلكتروني للحساب الإداري الأول.",
            devCode: authError.dev_verification_code || "",
            rememberMe: form.rememberMe
          }
        });
        return;
      }
      setError(authError?.message || "فشل تسجيل دخول الإدارة، راجع البيانات.");
      await loadCaptcha();
    } finally {
      submitLockRef.current = false;
      setLoading(false);
    }
  };
  const handleDevLogin = async () => {
    try {
      setDevLoading(true);
      setError("");
      const { data } = await devLoginUser({ preset: "admin", remember_me: form.rememberMe });
      if (!canAccessAdminPanel(data)) {
        setError("تم الدخول التطويري لكن الحساب ليس أدمن أساسي.");
        return;
      }
      setStoredUser(data);
      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      setError(localizeAuthMessage(err?.response?.data?.detail, "تعذر تشغيل دخول التطوير للإدارة."));
    } finally {
      setDevLoading(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    AuthShell,
    {
      badge: "YAMSHAT ADMIN",
      title: "دخول الإدارة",
      description: "هذه الصفحة مخصصة للأدمن فقط. لو البريد الإداري مضبوط صح هتدخل مباشرة إلى لوحة التحكم.",
      alternateAction: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "muted", children: "دخول المشتركين" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/login", className: "auth-inline-link", children: "الصفحة العادية" })
      ] }),
      footer: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        "رابط الإدارة الأساسي ",
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/admin/login", children: "/admin/login" }),
        " والرابط الاحتياطي ",
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/admin.html", children: "/admin.html" }),
        "."
      ] }),
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { className: "auth-form auth-form-enhanced", onSubmit: handleSubmit, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "auth-form-head", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { children: "لوحة تحكم الإدارة" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "muted", children: [
              "دخول لوحة الإدارة مقصور على البريد المخصص للإدارة فقط: ",
              PRIMARY_ADMIN_EMAIL
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { label: "البريد الإلكتروني أو اسم المستخدم", placeholder: PRIMARY_ADMIN_EMAIL, value: form.identifier, onChange: handleChange("identifier"), autoComplete: "username" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { label: "كلمة المرور", type: "password", placeholder: "••••••••", value: form.password, onChange: handleChange("password"), hint: "الحد الأدنى 6 أحرف", autoComplete: "current-password" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "remember-me-row", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", checked: form.rememberMe, onChange: handleChange("rememberMe") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "تذكّر جلسة الإدارة على هذا الجهاز" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            CaptchaBox,
            {
              challenge: captcha,
              value: form.captchaAnswer,
              onChange: (event) => setForm((prev) => ({ ...prev, captchaAnswer: event.target.value })),
              onRefresh: loadCaptcha,
              loading: captchaLoading,
              disabled: loading || devLoading,
              error: captchaError
            }
          ),
          showDevTools ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "dev-login-card", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Development Login" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "muted no-margin", children: "زر سريع لتجربة لوحة الأدمن أثناء التطوير المحلي." }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "secondary", onClick: handleDevLogin, loading: devLoading, disabled: loading || devLoading, children: devLoading ? "جارٍ دخول الإدارة التطويري..." : "دخول تطويري للأدمن" })
          ] }) : null,
          error ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "alert error", children: error }) : null,
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", loading, disabled: loading || devLoading, children: loading ? "جارٍ دخول الإدارة..." : "دخول الإدارة" })
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
        )
      ]
    }
  );
}
export {
  AdminLogin as default
};
