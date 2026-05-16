import {
  useSingleFlight
} from "./chunk-RWUEOPHG.js";
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
  resendVerification,
  verifyEmail
} from "./chunk-27I664WH.js";
import "./chunk-RYTW2TDG.js";
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

// src/pages/VerifyEmail.jsx
init_define_import_meta_env();
var import_react = __toESM(require_react(), 1);
var import_jsx_runtime = __toESM(require_jsx_runtime(), 1);
function VerifyEmail() {
  const location = useLocation();
  const navigate = useNavigate();
  const initialEmail = (0, import_react.useMemo)(() => location.state?.email || "", [location.state]);
  const initialCode = (0, import_react.useMemo)(() => normalizeOtpDigits(location.state?.devCode || location.state?.code || ""), [location.state]);
  const [form, setForm] = (0, import_react.useState)({
    email: initialEmail,
    code: initialCode,
    rememberMe: Boolean(location.state?.rememberMe ?? true)
  });
  const [loading, setLoading] = (0, import_react.useState)(false);
  const [resending, setResending] = (0, import_react.useState)(false);
  const [error, setError] = (0, import_react.useState)("");
  const [success, setSuccess] = (0, import_react.useState)(location.state?.message || "");
  const [devCode, setDevCode] = (0, import_react.useState)(location.state?.devCode || "");
  const [cooldown, setCooldown] = (0, import_react.useState)(30);
  const [attempts, setAttempts] = (0, import_react.useState)(0);
  const [showFallback, setShowFallback] = (0, import_react.useState)(false);
  const [isTimeout, setIsTimeout] = (0, import_react.useState)(false);
  const { run: runVerify } = useSingleFlight();
  const timerRef = (0, import_react.useRef)(null);
  (0, import_react.useEffect)(() => {
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
  (0, import_react.useEffect)(() => {
    const timeout = setTimeout(() => {
      setIsTimeout(true);
      setError("\u0627\u0646\u062A\u0647\u062A \u0635\u0644\u0627\u062D\u064A\u0629 \u0627\u0644\u062C\u0644\u0633\u0629. \u064A\u0631\u062C\u0649 \u0637\u0644\u0628 \u0643\u0648\u062F \u062C\u062F\u064A\u062F.");
    }, 10 * 60 * 1e3);
    return () => clearTimeout(timeout);
  }, []);
  const handleSubmit = async (incomingCode = form.code) => {
    const code = normalizeOtpDigits(incomingCode);
    if (!isValidEmail(form.email)) {
      setError("\u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u063A\u064A\u0631 \u0635\u062D\u064A\u062D.");
      return;
    }
    if (code.length !== 6) {
      setError("\u064A\u0631\u062C\u0649 \u0625\u062F\u062E\u0627\u0644 \u0627\u0644\u0631\u0645\u0632 \u0627\u0644\u0645\u0643\u0648\u0646 \u0645\u0646 6 \u0623\u0631\u0642\u0627\u0645.");
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
      const msg = localizeAuthMessage(err?.response?.data?.detail, "\u0631\u0645\u0632 \u0627\u0644\u062A\u0641\u0639\u064A\u0644 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D \u0623\u0648 \u0627\u0646\u062A\u0647\u062A \u0635\u0644\u0627\u062D\u064A\u062A\u0647.");
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
      setError("\u064A\u0631\u062C\u0649 \u0625\u062F\u062E\u0627\u0644 \u0628\u0631\u064A\u062F \u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0635\u062D\u064A\u062D.");
      return;
    }
    setResending(true);
    setError("");
    setSuccess("");
    try {
      const { data } = await resendVerification({ email: form.email.trim().toLowerCase() });
      setSuccess(localizeAuthMessage(data?.message, "\u062A\u0645 \u0625\u0631\u0633\u0627\u0644 \u0643\u0648\u062F \u062C\u062F\u064A\u062F \u0625\u0644\u0649 \u0628\u0631\u064A\u062F\u0643 \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A."));
      setDevCode(data?.dev_verification_code || "");
      if (data?.dev_verification_code) {
        setForm((prev) => ({ ...prev, code: normalizeOtpDigits(data.dev_verification_code) }));
      }
      setCooldown(60);
      setIsTimeout(false);
      setAttempts(0);
      setShowFallback(false);
    } catch (err) {
      setError(localizeAuthMessage(err?.response?.data?.detail, "\u062A\u0639\u0630\u0631 \u0625\u0639\u0627\u062F\u0629 \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0643\u0648\u062F \u062D\u0627\u0644\u064A\u0627\u064B. \u062D\u0627\u0648\u0644 \u0645\u062C\u062F\u062F\u0627\u064B \u0628\u0639\u062F \u0642\u0644\u064A\u0644."));
    } finally {
      setResending(false);
    }
  };
  (0, import_react.useEffect)(() => {
    if (form.code.length === 6 && !loading) {
      handleSubmit(form.code);
    }
  }, [form.code]);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
    AuthShell,
    {
      badge: "YAMSHAT",
      title: "\u062A\u0623\u0643\u064A\u062F \u0627\u0644\u062D\u0633\u0627\u0628",
      description: "\u0623\u062F\u062E\u0644 \u0631\u0645\u0632 \u0627\u0644\u062A\u062D\u0642\u0642 \u0627\u0644\u0645\u0631\u0633\u0644 \u0625\u0644\u0649 \u0628\u0631\u064A\u062F\u0643 \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0644\u062A\u0641\u0639\u064A\u0644 \u062D\u0633\u0627\u0628\u0643.",
      alternateAction: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "muted", children: "\u0647\u0644 \u062A\u0631\u064A\u062F \u062A\u063A\u064A\u064A\u0631 \u0627\u0644\u0628\u0631\u064A\u062F\u061F" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, { to: "/register", className: "auth-inline-link", children: "\u0627\u0644\u0639\u0648\u062F\u0629 \u0644\u0644\u062A\u0633\u062C\u064A\u0644" })
      ] }),
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", { className: "auth-form auth-form-enhanced", onSubmit: (event) => {
          event.preventDefault();
          handleSubmit();
        }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "auth-form-head", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", justifyContent: "center", marginBottom: 20 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "icon-circle", style: { width: 64, height: 64, background: "rgba(var(--accent-rgb), 0.1)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { width: "32", height: "32", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("polyline", { points: "22,6 12,13 2,6" })
            ] }) }) }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "\u062A\u062D\u0642\u0642 \u0645\u0646 \u0628\u0631\u064A\u062F\u0643" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { className: "muted", children: [
              "\u0623\u0631\u0633\u0644\u0646\u0627 \u0643\u0648\u062F \u0627\u0644\u062A\u0641\u0639\u064A\u0644 \u0625\u0644\u0649 ",
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { style: { color: "var(--text)" }, children: form.email })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            OtpCodeInput,
            {
              value: form.code,
              onChange: (next) => setForm((prev) => ({ ...prev, code: next })),
              onComplete: handleSubmit,
              disabled: loading || isTimeout,
              label: "\u0631\u0645\u0632 \u0627\u0644\u062A\u062D\u0642\u0642"
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { margin: "16px 0" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "remember-me-row", style: { display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "input",
              {
                type: "checkbox",
                checked: form.rememberMe,
                onChange: (event) => setForm((prev) => ({ ...prev, rememberMe: event.target.checked })),
                disabled: loading
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 14 }, children: "\u062A\u0630\u0643\u0651\u0631\u0646\u064A \u0639\u0644\u0649 \u0647\u0630\u0627 \u0627\u0644\u062C\u0647\u0627\u0632" })
          ] }) }),
          success && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "alert success animate-fade-in", children: success }),
          devCode && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "alert info", style: { background: "rgba(255,255,255,0.05)", border: "1px dashed var(--line)" }, children: [
            "\u0643\u0648\u062F \u0627\u0644\u0645\u0637\u0648\u0631 \u0627\u0644\u0645\u062D\u0627\u0643\u064A: ",
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: devCode })
          ] }),
          error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "alert error animate-shake", children: error }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, { type: "submit", loading, disabled: loading || isTimeout || form.code.length !== 6, style: { height: 50 }, children: loading ? "\u062C\u0627\u0631\u064A \u0627\u0644\u062A\u062D\u0642\u0642..." : "\u062A\u0623\u0643\u064A\u062F \u0627\u0644\u0631\u0645\u0632" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { textAlign: "center", marginTop: 16 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "button",
            {
              type: "button",
              className: "link-btn",
              disabled: resending || cooldown > 0,
              onClick: handleResend,
              style: { opacity: cooldown > 0 ? 0.6 : 1 },
              children: resending ? "\u062C\u0627\u0631\u064A \u0627\u0644\u0625\u0631\u0633\u0627\u0644..." : cooldown > 0 ? `\u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u0625\u0631\u0633\u0627\u0644 \u062E\u0644\u0627\u0644 ${cooldown}\u062B` : "\u0644\u0645 \u064A\u0635\u0644\u0643 \u0627\u0644\u0643\u0648\u062F\u061F \u0625\u0639\u0627\u062F\u0629 \u0625\u0631\u0633\u0627\u0644"
            }
          ) }),
          showFallback && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "fallback-section animate-fade-in", style: { marginTop: 24, padding: 16, background: "var(--bg-soft)", borderRadius: 12, border: "1px solid var(--line)" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", { style: { marginBottom: 8, fontSize: 14 }, children: "\u062A\u0648\u0627\u062C\u0647 \u0645\u0634\u0643\u0644\u0629\u061F" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", { style: { fontSize: 13, paddingRight: 20, margin: 0, color: "var(--muted)" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "\u062A\u0623\u0643\u062F \u0645\u0646 \u0645\u062C\u0644\u062F \u0627\u0644\u0631\u0633\u0627\u0626\u0644 \u063A\u064A\u0631 \u0627\u0644\u0645\u0631\u063A\u0648\u0628 \u0641\u064A\u0647\u0627 (Spam)." }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "\u062A\u0623\u0643\u062F \u0645\u0646 \u0643\u062A\u0627\u0628\u0629 \u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0628\u0634\u0643\u0644 \u0635\u062D\u064A\u062D." }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, { to: "/support", className: "auth-inline-link", children: "\u062A\u0648\u0627\u0635\u0644 \u0645\u0639 \u0627\u0644\u062F\u0639\u0645 \u0627\u0644\u0641\u0646\u064A" }) })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", { children: `
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
