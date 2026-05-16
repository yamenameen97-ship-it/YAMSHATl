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
  localizeAuthMessage
} from "./chunk-2GKLYX3P.js";
import {
  getCaptchaChallenge,
  registerUser
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
  useNavigate
} from "./chunk-FJN4GIYV.js";
import {
  __toESM,
  init_define_import_meta_env,
  require_jsx_runtime,
  require_react
} from "./chunk-SOYW6UE7.js";

// src/pages/Register.jsx
init_define_import_meta_env();
var import_react = __toESM(require_react(), 1);
var import_jsx_runtime = __toESM(require_jsx_runtime(), 1);
var TEMP_EMAIL_DOMAINS = ["tempmail.com", "10minutemail.com", "guerrillamail.com", "mailinator.com"];
var DISPOSABLE_DOMAINS = ["temp", "temporary", "test", "example"];
function PasswordStrengthMeter({ password }) {
  if (!password) return null;
  let strength = 0;
  let label = "\u0636\u0639\u064A\u0641\u0629 \u062C\u062F\u0627\u064B";
  let color = "#ff4444";
  if (password.length >= 8) strength += 1;
  if (password.length >= 12) strength += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 1;
  if (/\d/.test(password)) strength += 1;
  if (/[!@#$%^&*]/.test(password)) strength += 1;
  if (strength === 0) label = "\u0636\u0639\u064A\u0641\u0629 \u062C\u062F\u0627\u064B";
  else if (strength === 1) label = "\u0636\u0639\u064A\u0641\u0629";
  else if (strength === 2) label = "\u0645\u062A\u0648\u0633\u0637\u0629";
  else if (strength === 3) label = "\u0642\u0648\u064A\u0629";
  else if (strength >= 4) label = "\u0642\u0648\u064A\u0629 \u062C\u062F\u0627\u064B";
  if (strength <= 1) color = "#ff4444";
  else if (strength === 2) color = "#ffaa00";
  else if (strength === 3) color = "#ffdd00";
  else color = "#44ff44";
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { marginTop: 8, display: "grid", gap: 6 }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", gap: 4 }, children: [1, 2, 3, 4, 5].map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "div",
      {
        style: {
          flex: 1,
          height: 4,
          borderRadius: 2,
          background: i <= strength ? color : "rgba(255,255,255,0.1)",
          transition: "all 0.3s ease"
        }
      },
      i
    )) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("small", { style: { color, fontWeight: "bold", fontSize: 11 }, children: [
        "\u0642\u0648\u0629 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631: ",
        label
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: 4 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 10, color: password.length >= 8 ? "#44ff44" : "var(--muted)" }, children: "8+ \u0623\u062D\u0631\u0641" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 10, color: /[A-Z]/.test(password) ? "#44ff44" : "var(--muted)" }, children: "\u0643\u0628\u064A\u0631" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 10, color: /\d/.test(password) ? "#44ff44" : "var(--muted)" }, children: "\u0631\u0642\u0645" })
      ] })
    ] })
  ] });
}
function UsernameAvailability({ username, checking, available }) {
  if (!username || username.length < 3) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { marginTop: 4, display: "flex", gap: 8, alignItems: "center", fontSize: 12 }, children: checking ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "muted", style: { display: "flex", alignItems: "center", gap: 4 }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "spinner-small" }),
    " \u062C\u0627\u0631\u064A \u0627\u0644\u062A\u062D\u0642\u0642..."
  ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", alignItems: "center", gap: 4, color: available ? "#44ff44" : "#ff4444" }, children: available ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "3", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("polyline", { points: "20 6 9 17 4 12" }) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u0627\u0633\u0645 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0645\u062A\u0627\u062D" })
  ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "3", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", { x1: "18", y1: "6", x2: "6", y2: "18" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", { x1: "6", y1: "6", x2: "18", y2: "18" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u0627\u0633\u0645 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0645\u0633\u062A\u062E\u062F\u0645 \u0628\u0627\u0644\u0641\u0639\u0644" })
  ] }) }) });
}
function ProfileStep({ form, onChange, onImageSelect, preview }) {
  const fileInputRef = (0, import_react.useRef)(null);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "step-content animate-fade-in", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { textAlign: "center", marginBottom: 24 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
        "div",
        {
          onClick: () => fileInputRef.current?.click(),
          style: {
            width: 120,
            height: 120,
            borderRadius: "50%",
            background: "var(--bg-soft)",
            border: "2px dashed var(--line)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            margin: "0 auto 16px",
            overflow: "hidden",
            position: "relative",
            transition: "all 0.3s ease",
            boxShadow: "0 10px 20px rgba(0,0,0,0.1)"
          },
          className: "avatar-upload-box",
          children: [
            preview ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", { src: preview, alt: "Avatar Preview", style: { width: "100%", height: "100%", objectFit: "cover" } }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { textAlign: "center", color: "var(--muted)" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { width: "40", height: "40", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "12", cy: "13", r: "4" })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { fontSize: 12, marginTop: 4 }, children: "\u0627\u062E\u062A\u0631 \u0635\u0648\u0631\u0629" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "overlay", style: { position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", opacity: 0, display: "flex", alignItems: "center", justifyContent: "center", transition: "0.2s" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", { width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "#fff", strokeWidth: "2", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12 5v14M5 12h14" }) }) })
          ]
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: "file", ref: fileInputRef, hidden: true, accept: "image/*", onChange: (e) => onImageSelect(e.target.files[0]) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "\u0623\u0647\u0644\u0627\u064B \u0628\u0643! \u0644\u0646\u0643\u0645\u0644 \u0645\u0644\u0641\u0643 \u0627\u0644\u0634\u062E\u0635\u064A" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "muted", children: "\u0647\u0630\u0647 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0633\u062A\u0633\u0627\u0639\u062F \u0627\u0644\u0622\u062E\u0631\u064A\u0646 \u0641\u064A \u0627\u0644\u062A\u0639\u0631\u0641 \u0639\u0644\u064A\u0643." })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      Input,
      {
        label: "\u0627\u0644\u0627\u0633\u0645 \u0627\u0644\u062A\u0639\u0631\u064A\u0641\u064A (\u0627\u062E\u062A\u064A\u0627\u0631\u064A)",
        placeholder: "\u0627\u0644\u0627\u0633\u0645 \u0627\u0644\u0630\u064A \u0633\u064A\u0638\u0647\u0631 \u0644\u0644\u062C\u0645\u064A\u0639",
        value: form.displayName,
        onChange: (e) => onChange("displayName", e.target.value)
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { marginTop: 16 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: { display: "block", marginBottom: 8, fontSize: 14 }, children: "\u0646\u0628\u0630\u0629 \u062A\u0639\u0631\u064A\u0641\u064A\u0629 (\u0627\u062E\u062A\u064A\u0627\u0631\u064A)" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "textarea",
        {
          style: {
            width: "100%",
            background: "var(--bg-input)",
            border: "1px solid var(--line)",
            borderRadius: 12,
            padding: 12,
            color: "var(--text)",
            minHeight: 80,
            resize: "none"
          },
          placeholder: "\u0623\u062E\u0628\u0631\u0646\u0627 \u0642\u0644\u064A\u0644\u0627\u064B \u0639\u0646 \u0646\u0641\u0633\u0643...",
          value: form.bio,
          onChange: (e) => onChange("bio", e.target.value)
        }
      )
    ] })
  ] });
}
function RegisterEnhanced() {
  const [step, setStep] = (0, import_react.useState)(1);
  const [form, setForm] = (0, import_react.useState)({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptedTerms: false,
    profileImage: null,
    displayName: "",
    bio: ""
  });
  const [loading, setLoading] = (0, import_react.useState)(false);
  const [captchaLoading, setCaptchaLoading] = (0, import_react.useState)(false);
  const [captcha, setCaptcha] = (0, import_react.useState)(null);
  const [captchaAnswer, setCaptchaAnswer] = (0, import_react.useState)("");
  const [error, setError] = (0, import_react.useState)("");
  const [captchaError, setCaptchaError] = (0, import_react.useState)("");
  const [usernameChecking, setUsernameChecking] = (0, import_react.useState)(false);
  const [usernameAvailable, setUsernameAvailable] = (0, import_react.useState)(null);
  const [profileImagePreview, setProfileImagePreview] = (0, import_react.useState)("");
  const navigate = useNavigate();
  const { run: runRegister } = useSingleFlight();
  const checkTimeoutRef = (0, import_react.useRef)(null);
  const loadCaptcha = async () => {
    try {
      setCaptchaLoading(true);
      setCaptchaError("");
      const { data } = await getCaptchaChallenge();
      setCaptcha(data);
      setCaptchaAnswer("");
    } catch (err) {
      setCaptchaError(localizeAuthMessage(err?.response?.data?.detail, "\u062A\u0639\u0630\u0631 \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0643\u0627\u0628\u062A\u0634\u0627 \u062D\u0627\u0644\u064A\u0627\u064B."));
    } finally {
      setCaptchaLoading(false);
    }
  };
  (0, import_react.useEffect)(() => {
    loadCaptcha();
  }, []);
  const checkUsernameAvailability = (0, import_react.useCallback)(async (username) => {
    if (!username || username.length < 3) {
      setUsernameAvailable(null);
      return;
    }
    setUsernameChecking(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      const forbidden = ["admin", "test", "yamshat", "root", "support"];
      setUsernameAvailable(!forbidden.includes(username.toLowerCase()));
    } catch (err) {
      console.error("Failed to check username:", err);
    } finally {
      setUsernameChecking(false);
    }
  }, []);
  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (error) setError("");
    if (key === "name") {
      const sanitized = value.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase();
      if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current);
      checkTimeoutRef.current = setTimeout(() => checkUsernameAvailability(sanitized), 500);
    }
  };
  const handleImageSelect = (file) => {
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError("\u062D\u062C\u0645 \u0627\u0644\u0635\u0648\u0631\u0629 \u0643\u0628\u064A\u0631 \u062C\u062F\u0627\u064B\u060C \u0627\u0644\u062D\u062F \u0627\u0644\u0623\u0642\u0635\u0649 2 \u0645\u064A\u062C\u0627\u0628\u0627\u064A\u062A");
        return;
      }
      setForm((prev) => ({ ...prev, profileImage: file }));
      const reader = new FileReader();
      reader.onload = (e) => setProfileImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };
  const isDisposableEmail = (email) => {
    const domain = email.split("@")[1]?.toLowerCase() || "";
    return TEMP_EMAIL_DOMAINS.includes(domain) || DISPOSABLE_DOMAINS.some((d) => domain.includes(d));
  };
  const validateStep1 = () => {
    const username = sanitizeInputText(form.name, { maxLength: 50 }).replace(/\s/g, "").toLowerCase();
    const email = sanitizeInputText(form.email, { maxLength: 120 }).toLowerCase();
    if (!username || !email || !form.password.trim()) {
      setError("\u0645\u0646 \u0641\u0636\u0644\u0643 \u0623\u0643\u0645\u0644 \u0643\u0644 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0645\u0637\u0644\u0648\u0628\u0629.");
      return false;
    }
    if (username.length < 3) {
      setError("\u0627\u0633\u0645 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u064A\u062C\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 3 \u0623\u062D\u0631\u0641 \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644.");
      return false;
    }
    if (!isValidEmail(email)) {
      setError("\u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u063A\u064A\u0631 \u0635\u062D\u064A\u062D.");
      return false;
    }
    if (isDisposableEmail(email)) {
      setError("\u064A\u0631\u062C\u0649 \u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0628\u0631\u064A\u062F \u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u062D\u0642\u064A\u0642\u064A\u060C \u062E\u062F\u0645\u0627\u062A \u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0645\u0624\u0642\u062A \u063A\u064A\u0631 \u0645\u0633\u0645\u0648\u062D \u0628\u0647\u0627.");
      return false;
    }
    if (form.password.length < 8) {
      setError("\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u064A\u062C\u0628 \u0623\u0646 \u062A\u0643\u0648\u0646 8 \u0623\u062D\u0631\u0641 \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644.");
      return false;
    }
    if (form.password !== form.confirmPassword) {
      setError("\u0643\u0644\u0645\u0627\u062A \u0627\u0644\u0645\u0631\u0648\u0631 \u063A\u064A\u0631 \u0645\u062A\u0637\u0627\u0628\u0642\u0629.");
      return false;
    }
    if (!form.acceptedTerms) {
      setError("\u064A\u062C\u0628 \u0627\u0644\u0645\u0648\u0627\u0641\u0642\u0629 \u0639\u0644\u0649 \u0634\u0631\u0648\u0637 \u0627\u0644\u0627\u0633\u062A\u062E\u062F\u0627\u0645.");
      return false;
    }
    if (!captchaAnswer) {
      setError("\u064A\u0631\u062C\u0649 \u0625\u062F\u062E\u0627\u0644 \u0631\u0645\u0632 \u0627\u0644\u0643\u0627\u0628\u062A\u0634\u0627.");
      return false;
    }
    return true;
  };
  const handleSubmit = async (event) => {
    if (event) event.preventDefault();
    if (step === 1) {
      if (validateStep1()) setStep(2);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("username", form.name.toLowerCase());
      formData.append("email", form.email.toLowerCase());
      formData.append("password", form.password);
      formData.append("captcha_id", captcha.captcha_id);
      formData.append("captcha_answer", captchaAnswer);
      if (form.displayName) formData.append("display_name", form.displayName);
      if (form.bio) formData.append("bio", form.bio);
      if (form.profileImage) formData.append("avatar", form.profileImage);
      await runRegister(async () => {
        return await registerUser(formData);
      });
      navigate("/login", { state: { message: "\u062A\u0645 \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u062D\u0633\u0627\u0628 \u0628\u0646\u062C\u0627\u062D! \u064A\u0631\u062C\u0649 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644." } });
    } catch (err) {
      setError(localizeAuthMessage(err?.response?.data?.detail, "\u0641\u0634\u0644 \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u062D\u0633\u0627\u0628. \u062D\u0627\u0648\u0644 \u0645\u062C\u062F\u062F\u0627\u064B."));
      if (err?.response?.data?.detail?.includes("\u0643\u0627\u0628\u062A\u0634\u0627")) loadCaptcha();
      setStep(1);
    } finally {
      setLoading(false);
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    AuthShell,
    {
      badge: "YAMSHAT",
      title: "\u0625\u0646\u0634\u0627\u0621 \u062D\u0633\u0627\u0628",
      description: "\u0627\u0646\u0636\u0645 \u0625\u0644\u0649 \u0645\u062C\u062A\u0645\u0639 \u064A\u0645\u0634\u0627\u062A \u0627\u0644\u064A\u0648\u0645 \u0648\u0627\u0628\u062F\u0623 \u0627\u0644\u062A\u0648\u0627\u0635\u0644.",
      children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", { className: "auth-form", onSubmit: handleSubmit, noValidate: true, children: [
        step === 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "step-content animate-fade-in", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "auth-form-head", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "\u0625\u0646\u0634\u0627\u0621 \u062D\u0633\u0627\u0628 \u062C\u062F\u064A\u062F" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "muted", children: "\u0623\u062F\u062E\u0644 \u0628\u064A\u0627\u0646\u0627\u062A\u0643 \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629 \u0644\u0644\u0628\u062F\u0621." })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "relative" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              Input,
              {
                label: "\u0627\u0633\u0645 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645",
                placeholder: "username",
                value: form.name,
                onChange: (e) => handleChange("name", e.target.value),
                disabled: loading,
                required: true
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UsernameAvailability, { username: form.name, checking: usernameChecking, available: usernameAvailable })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            Input,
            {
              label: "\u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A",
              type: "email",
              placeholder: "email@example.com",
              value: form.email,
              onChange: (e) => handleChange("email", e.target.value),
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
                onChange: (e) => handleChange("password", e.target.value),
                disabled: loading,
                required: true
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PasswordStrengthMeter, { password: form.password })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            Input,
            {
              label: "\u062A\u0623\u0643\u064A\u062F \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631",
              type: "password",
              placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
              value: form.confirmPassword,
              onChange: (e) => handleChange("confirmPassword", e.target.value),
              disabled: loading,
              required: true
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            CaptchaBox,
            {
              challenge: captcha,
              value: captchaAnswer,
              onChange: (e) => setCaptchaAnswer(e.target.value),
              onRefresh: loadCaptcha,
              loading: captchaLoading,
              error: captchaError,
              disabled: loading
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { margin: "16px 0" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { style: { display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "input",
              {
                type: "checkbox",
                checked: form.acceptedTerms,
                onChange: (e) => handleChange("acceptedTerms", e.target.checked),
                disabled: loading
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontSize: 13 }, children: [
              "\u0623\u0648\u0627\u0641\u0642 \u0639\u0644\u0649 ",
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, { to: "/terms", className: "link", children: "\u0634\u0631\u0648\u0637 \u0627\u0644\u0627\u0633\u062A\u062E\u062F\u0627\u0645" }),
              " \u0648 ",
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, { to: "/privacy", className: "link", children: "\u0633\u064A\u0627\u0633\u0629 \u0627\u0644\u062E\u0635\u0648\u0635\u064A\u0629" })
            ] })
          ] }) })
        ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          ProfileStep,
          {
            form,
            onChange: handleChange,
            onImageSelect: handleImageSelect,
            preview: profileImagePreview
          }
        ),
        error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "alert error animate-shake", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: error }) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: 12, marginTop: 12 }, children: [
          step === 2 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, { type: "button", variant: "secondary", onClick: () => setStep(1), disabled: loading, style: { flex: 1 }, children: "\u0627\u0644\u0633\u0627\u0628\u0642" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            Button,
            {
              type: "submit",
              loading,
              disabled: loading || step === 1 && (!form.name || !form.email || !form.password || !captchaAnswer),
              style: { flex: 2 },
              children: step === 1 ? "\u0627\u0644\u0645\u062A\u0627\u0628\u0639\u0629" : "\u0625\u0643\u0645\u0627\u0644 \u0627\u0644\u062A\u0633\u062C\u064A\u0644"
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "auth-form-footer", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u0644\u062F\u064A\u0643 \u062D\u0633\u0627\u0628 \u0628\u0627\u0644\u0641\u0639\u0644\u061F" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, { to: "/login", className: "link-btn", children: "\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644" })
        ] })
      ] })
    }
  );
}
export {
  RegisterEnhanced as default
};
