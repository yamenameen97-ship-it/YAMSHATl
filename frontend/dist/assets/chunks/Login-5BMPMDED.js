import {
  TwoFactorChallengeModal
} from "./chunk-ZRWW7YS3.js";
import {
  CaptchaBox,
  sanitizeInputText
} from "./chunk-6JCSOY2Y.js";
import {
  useSingleFlight
} from "./chunk-RWUEOPHG.js";
import {
  AuthShell,
  isValidEmail,
  localizeAuthMessage,
  looksLikeEmail,
  parseApiDetail
} from "./chunk-2GKLYX3P.js";
import {
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
  getDefaultPostLoginPath,
  setStoredUser,
  useLocation,
  useNavigate
} from "./chunk-FJN4GIYV.js";
import {
  __toESM,
  init_define_import_meta_env,
  require_jsx_runtime,
  require_react
} from "./chunk-SOYW6UE7.js";

// src/pages/Login.jsx
init_define_import_meta_env();
var import_react = __toESM(require_react(), 1);
var import_jsx_runtime = __toESM(require_jsx_runtime(), 1);
function LoginEnhanced() {
  const [form, setForm] = (0, import_react.useState)({
    identifier: "",
    password: "",
    rememberMe: true,
    captchaAnswer: ""
  });
  const [loading, setLoading] = (0, import_react.useState)(false);
  const [captchaLoading, setCaptchaLoading] = (0, import_react.useState)(false);
  const [captcha, setCaptcha] = (0, import_react.useState)(null);
  const [error, setError] = (0, import_react.useState)("");
  const [captchaError, setCaptchaError] = (0, import_react.useState)("");
  const [show2FAModal, setShow2FAModal] = (0, import_react.useState)(false);
  const [pendingChallenge, setPendingChallenge] = (0, import_react.useState)(null);
  const [twoFactorError, setTwoFactorError] = (0, import_react.useState)("");
  const [twoFactorLoading, setTwoFactorLoading] = (0, import_react.useState)(false);
  const [captchaCooldown, setCaptchaCooldown] = (0, import_react.useState)(0);
  const [retryCount, setRetryCount] = (0, import_react.useState)(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { run: runLogin } = useSingleFlight();
  (0, import_react.useEffect)(() => {
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
      setCaptchaError(localizeAuthMessage(err?.response?.data?.detail, "\u062A\u0639\u0630\u0631 \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0643\u0627\u0628\u062A\u0634\u0627 \u062D\u0627\u0644\u064A\u0627\u064B. \u062D\u0627\u0648\u0644 \u0645\u062C\u062F\u062F\u0627\u064B \u0628\u0639\u062F \u0642\u0644\u064A\u0644."));
    } finally {
      setCaptchaLoading(false);
    }
  };
  (0, import_react.useEffect)(() => {
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
      completeLogin(data);
    } catch (err) {
      const parsed = parseApiDetail(err?.response?.data?.detail, "\u0631\u0645\u0632 \u0627\u0644\u062A\u062D\u0642\u0642 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D \u0623\u0648 \u0627\u0646\u062A\u0647\u062A \u0635\u0644\u0627\u062D\u064A\u062A\u0647.");
      setTwoFactorError(parsed?.message || "\u0631\u0645\u0632 \u0627\u0644\u062A\u062D\u0642\u0642 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D \u0623\u0648 \u0627\u0646\u062A\u0647\u062A \u0635\u0644\u0627\u062D\u064A\u062A\u0647.");
    } finally {
      setTwoFactorLoading(false);
    }
  };
  const handleSubmit = async (event) => {
    if (event) event.preventDefault();
    const identifier = sanitizeInputText(form.identifier, { maxLength: 120 });
    if (!identifier) {
      setError("\u064A\u0631\u062C\u0649 \u0625\u062F\u062E\u0627\u0644 \u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0623\u0648 \u0627\u0633\u0645 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645.");
      return;
    }
    if (looksLikeEmail(identifier) && !isValidEmail(identifier)) {
      setError("\u062A\u0646\u0633\u064A\u0642 \u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u063A\u064A\u0631 \u0635\u062D\u064A\u062D.");
      return;
    }
    if (!form.password.trim()) {
      setError("\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0645\u0637\u0644\u0648\u0628\u0629.");
      return;
    }
    if (!captcha?.captcha_id) {
      setError("\u064A\u0631\u062C\u0649 \u062D\u0644 \u0627\u0644\u0643\u0627\u0628\u062A\u0634\u0627 \u0644\u0644\u0645\u062A\u0627\u0628\u0639\u0629.");
      loadCaptcha();
      return;
    }
    if (!form.captchaAnswer) {
      setError("\u064A\u0631\u062C\u0649 \u0625\u062F\u062E\u0627\u0644 \u0631\u0645\u0632 \u0627\u0644\u0643\u0627\u0628\u062A\u0634\u0627.");
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
      const message = localizeAuthMessage(apiError?.message || err?.message, "\u0641\u0634\u0644 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644. \u064A\u0631\u062C\u0649 \u0627\u0644\u062A\u0623\u0643\u062F \u0645\u0646 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0648\u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629 \u0645\u0631\u0629 \u0623\u062E\u0631\u0649.");
      setError(message);
      if (apiError?.field === "captcha" || message.includes("\u0643\u0627\u0628\u062A\u0634\u0627")) {
        loadCaptcha();
      }
    } finally {
      setLoading(false);
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
    AuthShell,
    {
      badge: "YAMSHAT",
      title: "\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644",
      description: "\u0645\u0631\u062D\u0628\u0627\u064B \u0628\u0643 \u0645\u062C\u062F\u062F\u0627\u064B \u0641\u064A \u064A\u0645\u0634\u0627\u062A. \u0633\u062C\u0644 \u062F\u062E\u0648\u0644\u0643 \u0644\u0644\u0645\u062A\u0627\u0628\u0639\u0629.",
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", { className: "auth-form auth-form-enhanced", onSubmit: handleSubmit, noValidate: true, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "auth-form-head", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "muted", children: "\u0623\u062F\u062E\u0644 \u0628\u064A\u0627\u0646\u0627\u062A \u062D\u0633\u0627\u0628\u0643 \u0644\u0644\u0648\u0635\u0648\u0644 \u0625\u0644\u0649 \u0644\u0648\u062D\u0629 \u0627\u0644\u062A\u062D\u0643\u0645." })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            Input,
            {
              label: "\u0627\u0633\u0645 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0623\u0648 \u0627\u0644\u0628\u0631\u064A\u062F",
              placeholder: "username / email",
              value: form.identifier,
              onChange: handleChange("identifier"),
              autoComplete: "username",
              disabled: loading,
              required: true
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "relative" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              Input,
              {
                label: "\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631",
                type: "password",
                placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
                value: form.password,
                onChange: handleChange("password"),
                autoComplete: "current-password",
                disabled: loading,
                required: true
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              Link,
              {
                to: "/forgot-password",
                className: "auth-inline-link",
                style: { position: "absolute", top: 0, left: 0, fontSize: 12 },
                children: "\u0646\u0633\u064A\u062A \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631\u061F"
              }
            )
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
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
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { margin: "16px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { style: { display: "flex", alignItems: "center", gap: 8, cursor: "pointer", userSelect: "none" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "input",
              {
                type: "checkbox",
                checked: form.rememberMe,
                onChange: handleChange("rememberMe"),
                disabled: loading
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 14 }, children: "\u062A\u0630\u0643\u0631\u0646\u064A \u0639\u0644\u0649 \u0647\u0630\u0627 \u0627\u0644\u062C\u0647\u0627\u0632" })
          ] }) }),
          error && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "alert error", style: { display: "flex", alignItems: "center", gap: 10, animation: "shake 0.4s ease" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "12", cy: "12", r: "10" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", { x1: "12", y1: "8", x2: "12", y2: "12" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", { x1: "12", y1: "16", x2: "12.01", y2: "16" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { flex: 1 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: error }),
              retryCount > 2 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { fontSize: 11, marginTop: 4, opacity: 0.8 }, children: "\u0625\u0630\u0627 \u0643\u0646\u062A \u062A\u0648\u0627\u062C\u0647 \u0645\u0634\u0643\u0644\u0629 \u0645\u0633\u062A\u0645\u0631\u0629\u060C \u064A\u0631\u062C\u0649 \u0625\u0639\u0627\u062F\u0629 \u062A\u0639\u064A\u064A\u0646 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631." })
            ] }),
            retryCount > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", onClick: handleSubmit, disabled: loading, style: { background: "none", border: "none", color: "inherit", cursor: "pointer", textDecoration: "underline", fontSize: 12 }, children: "\u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            Button,
            {
              type: "submit",
              loading,
              disabled: loading || !form.identifier || !form.password || !form.captchaAnswer,
              style: { height: 50, fontSize: 16, fontWeight: "bold" },
              children: loading ? "\u062C\u0627\u0631\u064A \u0627\u0644\u062A\u062D\u0642\u0642..." : "\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644"
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "auth-form-footer", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u0644\u064A\u0633 \u0644\u062F\u064A\u0643 \u062D\u0633\u0627\u0628\u061F" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, { to: "/register", className: "link-btn", children: "\u0625\u0646\u0634\u0627\u0621 \u062D\u0633\u0627\u0628 \u062C\u062F\u064A\u062F" })
          ] })
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
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", { children: `
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
