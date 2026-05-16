import {
  TwoFactorChallengeModal
} from "./chunk-ZRWW7YS3.js";
import {
  CaptchaBox,
  sanitizeInputText
} from "./chunk-6JCSOY2Y.js";
import {
  AuthShell,
  isValidEmail,
  localizeAuthMessage,
  looksLikeEmail,
  parseApiDetail
} from "./chunk-2GKLYX3P.js";
import {
  devLoginUser,
  getCaptchaChallenge,
  loginUser,
  verifyTwoFactorLogin
} from "./chunk-27I664WH.js";
import {
  Input
} from "./chunk-RYTW2TDG.js";
import "./chunk-BDBRQ2OX.js";
import {
  Button
} from "./chunk-EHD43N2I.js";
import {
  Link,
  PRIMARY_ADMIN_EMAIL,
  clearStoredUser,
  getStoredUser,
  isPrimaryAdminSession,
  setStoredUser,
  useLocation,
  useNavigate
} from "./chunk-FJN4GIYV.js";
import {
  __toESM,
  define_import_meta_env_default,
  init_define_import_meta_env,
  require_jsx_runtime,
  require_react
} from "./chunk-SOYW6UE7.js";

// src/pages/AdminLogin.jsx
init_define_import_meta_env();
var import_react = __toESM(require_react(), 1);
var import_jsx_runtime = __toESM(require_jsx_runtime(), 1);
var canAccessAdminPanel = (session) => isPrimaryAdminSession(session);
var canShowDevTools = () => {
  if (typeof window === "undefined") return Boolean(define_import_meta_env_default.DEV);
  const host = window.location.hostname;
  return Boolean(define_import_meta_env_default.DEV || define_import_meta_env_default.VITE_ENABLE_DEV_LOGIN === "true" || ["localhost", "127.0.0.1"].includes(host));
};
function AdminLogin() {
  const [form, setForm] = (0, import_react.useState)({ identifier: "", password: "", rememberMe: true, captchaAnswer: "" });
  const [loading, setLoading] = (0, import_react.useState)(false);
  const [devLoading, setDevLoading] = (0, import_react.useState)(false);
  const [captchaLoading, setCaptchaLoading] = (0, import_react.useState)(false);
  const [captcha, setCaptcha] = (0, import_react.useState)(null);
  const [error, setError] = (0, import_react.useState)("");
  const [captchaError, setCaptchaError] = (0, import_react.useState)("");
  const [show2FAModal, setShow2FAModal] = (0, import_react.useState)(false);
  const [pendingChallenge, setPendingChallenge] = (0, import_react.useState)(null);
  const [twoFactorError, setTwoFactorError] = (0, import_react.useState)("");
  const [twoFactorLoading, setTwoFactorLoading] = (0, import_react.useState)(false);
  const navigate = useNavigate();
  const location = useLocation();
  const submitLockRef = (0, import_react.useRef)(false);
  const showDevTools = (0, import_react.useMemo)(() => canShowDevTools(), []);
  const loadCaptcha = async () => {
    try {
      setCaptchaLoading(true);
      setCaptchaError("");
      const { data } = await getCaptchaChallenge();
      setCaptcha(data);
      setForm((prev) => ({ ...prev, captchaAnswer: "" }));
    } catch (err) {
      setCaptchaError(localizeAuthMessage(err?.response?.data?.detail, "\u062A\u0639\u0630\u0631 \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0643\u0627\u0628\u062A\u0634\u0627 \u062D\u0627\u0644\u064A\u0627\u064B."));
    } finally {
      setCaptchaLoading(false);
    }
  };
  (0, import_react.useEffect)(() => {
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
      setError(`\u0647\u0630\u0627 \u0627\u0644\u062D\u0633\u0627\u0628 \u0644\u0627 \u064A\u0645\u0644\u0643 \u0635\u0644\u0627\u062D\u064A\u0629 \u062F\u062E\u0648\u0644 \u0644\u0648\u062D\u0629 \u0627\u0644\u0625\u062F\u0627\u0631\u0629. \u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u062F\u0627\u0631\u064A \u0627\u0644\u062D\u0627\u0644\u064A \u0647\u0648 ${PRIMARY_ADMIN_EMAIL}.`);
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
      setTwoFactorError("\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u062A\u062D\u0642\u0642 \u0627\u0644\u0625\u0636\u0627\u0641\u064A \u063A\u064A\u0631 \u0645\u0643\u062A\u0645\u0644\u0629. \u062D\u0627\u0648\u0644 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0645\u0646 \u062C\u062F\u064A\u062F.");
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
      const parsed = parseApiDetail(err?.response?.data?.detail, "\u0631\u0645\u0632 \u0627\u0644\u062A\u062D\u0642\u0642 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D \u0623\u0648 \u0627\u0646\u062A\u0647\u062A \u0635\u0644\u0627\u062D\u064A\u062A\u0647.");
      setTwoFactorError(parsed?.message || "\u0631\u0645\u0632 \u0627\u0644\u062A\u062D\u0642\u0642 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D \u0623\u0648 \u0627\u0646\u062A\u0647\u062A \u0635\u0644\u0627\u062D\u064A\u062A\u0647.");
    } finally {
      setTwoFactorLoading(false);
    }
  };
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitLockRef.current || loading) return;
    const identifier = sanitizeInputText(form.identifier, { maxLength: 120 });
    if (!identifier) {
      setError("\u0627\u0643\u062A\u0628 \u0628\u0631\u064A\u062F \u0627\u0644\u0625\u062F\u0627\u0631\u0629 \u0623\u0648 \u0627\u0633\u0645 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645.");
      return;
    }
    if (looksLikeEmail(identifier) && !isValidEmail(identifier)) {
      setError("\u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u063A\u064A\u0631 \u0635\u062D\u064A\u062D.");
      return;
    }
    if (!form.password.trim()) {
      setError("\u0627\u0643\u062A\u0628 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631.");
      return;
    }
    if (!captcha?.captcha_id) {
      setError("\u062D\u062F\u0651\u062B \u0627\u0644\u0643\u0627\u0628\u062A\u0634\u0627 \u0623\u0648\u0644\u0627\u064B.");
      await loadCaptcha();
      return;
    }
    if (!form.captchaAnswer.trim()) {
      setError("\u0627\u0643\u062A\u0628 \u0625\u062C\u0627\u0628\u0629 \u0627\u0644\u0643\u0627\u0628\u062A\u0634\u0627 \u0623\u0648\u0644\u0627\u064B.");
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
      const authError = parseApiDetail(err?.response?.data?.detail, "\u0641\u0634\u0644 \u062A\u0633\u062C\u064A\u0644 \u062F\u062E\u0648\u0644 \u0627\u0644\u0625\u062F\u0627\u0631\u0629\u060C \u0631\u0627\u062C\u0639 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A.");
      if (authError?.message === localizeAuthMessage("Email verification required", "\u0644\u0627\u0632\u0645 \u062A\u0641\u0639\u0651\u0644 \u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0627\u0644\u0623\u0648\u0644.")) {
        navigate("/verify-email", {
          state: {
            email: authError.email || identifier.trim(),
            message: "\u0644\u0627\u0632\u0645 \u062A\u0641\u0639\u0651\u0644 \u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0644\u0644\u062D\u0633\u0627\u0628 \u0627\u0644\u0625\u062F\u0627\u0631\u064A \u0627\u0644\u0623\u0648\u0644.",
            devCode: authError.dev_verification_code || "",
            rememberMe: form.rememberMe
          }
        });
        return;
      }
      setError(authError?.message || "\u0641\u0634\u0644 \u062A\u0633\u062C\u064A\u0644 \u062F\u062E\u0648\u0644 \u0627\u0644\u0625\u062F\u0627\u0631\u0629\u060C \u0631\u0627\u062C\u0639 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A.");
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
        setError("\u062A\u0645 \u0627\u0644\u062F\u062E\u0648\u0644 \u0627\u0644\u062A\u0637\u0648\u064A\u0631\u064A \u0644\u0643\u0646 \u0627\u0644\u062D\u0633\u0627\u0628 \u0644\u064A\u0633 \u0623\u062F\u0645\u0646 \u0623\u0633\u0627\u0633\u064A.");
        return;
      }
      setStoredUser(data);
      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      setError(localizeAuthMessage(err?.response?.data?.detail, "\u062A\u0639\u0630\u0631 \u062A\u0634\u063A\u064A\u0644 \u062F\u062E\u0648\u0644 \u0627\u0644\u062A\u0637\u0648\u064A\u0631 \u0644\u0644\u0625\u062F\u0627\u0631\u0629."));
    } finally {
      setDevLoading(false);
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
    AuthShell,
    {
      badge: "YAMSHAT ADMIN",
      title: "\u062F\u062E\u0648\u0644 \u0627\u0644\u0625\u062F\u0627\u0631\u0629",
      description: "\u0647\u0630\u0647 \u0627\u0644\u0635\u0641\u062D\u0629 \u0645\u062E\u0635\u0635\u0629 \u0644\u0644\u0623\u062F\u0645\u0646 \u0641\u0642\u0637. \u0644\u0648 \u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u062F\u0627\u0631\u064A \u0645\u0636\u0628\u0648\u0637 \u0635\u062D \u0647\u062A\u062F\u062E\u0644 \u0645\u0628\u0627\u0634\u0631\u0629 \u0625\u0644\u0649 \u0644\u0648\u062D\u0629 \u0627\u0644\u062A\u062D\u0643\u0645.",
      alternateAction: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "muted", children: "\u062F\u062E\u0648\u0644 \u0627\u0644\u0645\u0634\u062A\u0631\u0643\u064A\u0646" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, { to: "/login", className: "auth-inline-link", children: "\u0627\u0644\u0635\u0641\u062D\u0629 \u0627\u0644\u0639\u0627\u062F\u064A\u0629" })
      ] }),
      footer: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
        "\u0631\u0627\u0628\u0637 \u0627\u0644\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0623\u0633\u0627\u0633\u064A ",
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, { to: "/admin/login", children: "/admin/login" }),
        " \u0648\u0627\u0644\u0631\u0627\u0628\u0637 \u0627\u0644\u0627\u062D\u062A\u064A\u0627\u0637\u064A ",
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, { to: "/admin.html", children: "/admin.html" }),
        "."
      ] }),
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", { className: "auth-form auth-form-enhanced", onSubmit: handleSubmit, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "auth-form-head", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "\u0644\u0648\u062D\u0629 \u062A\u062D\u0643\u0645 \u0627\u0644\u0625\u062F\u0627\u0631\u0629" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { className: "muted", children: [
              "\u062F\u062E\u0648\u0644 \u0644\u0648\u062D\u0629 \u0627\u0644\u0625\u062F\u0627\u0631\u0629 \u0645\u0642\u0635\u0648\u0631 \u0639\u0644\u0649 \u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0645\u062E\u0635\u0635 \u0644\u0644\u0625\u062F\u0627\u0631\u0629 \u0641\u0642\u0637: ",
              PRIMARY_ADMIN_EMAIL
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, { label: "\u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0623\u0648 \u0627\u0633\u0645 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645", placeholder: PRIMARY_ADMIN_EMAIL, value: form.identifier, onChange: handleChange("identifier"), autoComplete: "username" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, { label: "\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631", type: "password", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", value: form.password, onChange: handleChange("password"), hint: "\u0627\u0644\u062D\u062F \u0627\u0644\u0623\u062F\u0646\u0649 6 \u0623\u062D\u0631\u0641", autoComplete: "current-password" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "remember-me-row", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: "checkbox", checked: form.rememberMe, onChange: handleChange("rememberMe") }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u062A\u0630\u0643\u0651\u0631 \u062C\u0644\u0633\u0629 \u0627\u0644\u0625\u062F\u0627\u0631\u0629 \u0639\u0644\u0649 \u0647\u0630\u0627 \u0627\u0644\u062C\u0647\u0627\u0632" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
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
          showDevTools ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dev-login-card", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Development Login" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "muted no-margin", children: "\u0632\u0631 \u0633\u0631\u064A\u0639 \u0644\u062A\u062C\u0631\u0628\u0629 \u0644\u0648\u062D\u0629 \u0627\u0644\u0623\u062F\u0645\u0646 \u0623\u062B\u0646\u0627\u0621 \u0627\u0644\u062A\u0637\u0648\u064A\u0631 \u0627\u0644\u0645\u062D\u0644\u064A." }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, { type: "button", variant: "secondary", onClick: handleDevLogin, loading: devLoading, disabled: loading || devLoading, children: devLoading ? "\u062C\u0627\u0631\u064D \u062F\u062E\u0648\u0644 \u0627\u0644\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u062A\u0637\u0648\u064A\u0631\u064A..." : "\u062F\u062E\u0648\u0644 \u062A\u0637\u0648\u064A\u0631\u064A \u0644\u0644\u0623\u062F\u0645\u0646" })
          ] }) : null,
          error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "alert error", children: error }) : null,
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, { type: "submit", loading, disabled: loading || devLoading, children: loading ? "\u062C\u0627\u0631\u064D \u062F\u062E\u0648\u0644 \u0627\u0644\u0625\u062F\u0627\u0631\u0629..." : "\u062F\u062E\u0648\u0644 \u0627\u0644\u0625\u062F\u0627\u0631\u0629" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
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
