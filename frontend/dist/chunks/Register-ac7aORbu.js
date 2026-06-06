import { aP as reactExports, b9 as useNavigate, am as jsxRuntimeExports, f as Link, c as Button } from "../index-T8PSkq5D.js";
import { I as Input } from "./Input-DVtIP6sp.js";
import { A as AuthShell, l as localizeAuthMessage, i as isValidEmail } from "./authValidation-BpxVNcip.js";
import { C as CaptchaBox, s as sanitizeInputText } from "./sanitize-D-tB03Eq.js";
import { g as getCaptchaChallenge, r as registerUser } from "./auth-CwyBvh2q.js";
import { u as useSingleFlight } from "./useSingleFlight-BIl1381x.js";
import "./BrandLogo-B8rkCqHE.js";
const TEMP_EMAIL_DOMAINS = ["tempmail.com", "10minutemail.com", "guerrillamail.com", "mailinator.com"];
const DISPOSABLE_DOMAINS = ["temp", "temporary", "test", "example"];
function PasswordStrengthMeter({ password }) {
  if (!password) return null;
  let strength = 0;
  let label = "ضعيفة جداً";
  let color = "#ff4444";
  if (password.length >= 8) strength += 1;
  if (password.length >= 12) strength += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 1;
  if (/\d/.test(password)) strength += 1;
  if (/[!@#$%^&*]/.test(password)) strength += 1;
  if (strength === 0) label = "ضعيفة جداً";
  else if (strength === 1) label = "ضعيفة";
  else if (strength === 2) label = "متوسطة";
  else if (strength === 3) label = "قوية";
  else if (strength >= 4) label = "قوية جداً";
  if (strength <= 1) color = "#ff4444";
  else if (strength === 2) color = "#ffaa00";
  else if (strength === 3) color = "#ffdd00";
  else color = "#44ff44";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginTop: 8, display: "grid", gap: 6 }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", gap: 4 }, children: [1, 2, 3, 4, 5].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
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
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("small", { style: { color, fontWeight: "bold", fontSize: 11 }, children: [
        "قوة كلمة المرور: ",
        label
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 4 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: 10, color: password.length >= 8 ? "#44ff44" : "var(--muted)" }, children: "8+ أحرف" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: 10, color: /[A-Z]/.test(password) ? "#44ff44" : "var(--muted)" }, children: "كبير" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: 10, color: /\d/.test(password) ? "#44ff44" : "var(--muted)" }, children: "رقم" })
      ] })
    ] })
  ] });
}
function UsernameAvailability({ username, checking, available }) {
  if (!username || username.length < 3) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { marginTop: 4, display: "flex", gap: 8, alignItems: "center", fontSize: 12 }, children: checking ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "muted", style: { display: "flex", alignItems: "center", gap: 4 }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "spinner-small" }),
    " جاري التحقق..."
  ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", alignItems: "center", gap: 4, color: available ? "#44ff44" : "#ff4444" }, children: available ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "20 6 9 17 4 12" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "اسم المستخدم متاح" })
  ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "18", y1: "6", x2: "6", y2: "18" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "6", y1: "6", x2: "18", y2: "18" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "اسم المستخدم مستخدم بالفعل" })
  ] }) }) });
}
function ProfileStep({ form, onChange, onImageSelect, preview }) {
  const fileInputRef = reactExports.useRef(null);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "step-content animate-fade-in", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { textAlign: "center", marginBottom: 24 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
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
            preview ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: preview, alt: "Avatar Preview", style: { width: "100%", height: "100%", objectFit: "cover" } }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { textAlign: "center", color: "var(--muted)" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "40", height: "40", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "12", cy: "13", r: "4" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: 12, marginTop: 4 }, children: "اختر صورة" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overlay", style: { position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", opacity: 0, display: "flex", alignItems: "center", justifyContent: "center", transition: "0.2s" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "#fff", strokeWidth: "2", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M12 5v14M5 12h14" }) }) })
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "file", ref: fileInputRef, hidden: true, accept: "image/*", onChange: (e) => onImageSelect(e.target.files[0]) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { children: "أهلاً بك! لنكمل ملفك الشخصي" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "muted", children: "هذه البيانات ستساعد الآخرين في التعرف عليك." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Input,
      {
        label: "الاسم التعريفي (اختياري)",
        placeholder: "الاسم الذي سيظهر للجميع",
        value: form.displayName,
        onChange: (e) => onChange("displayName", e.target.value)
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginTop: 16 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("label", { style: { display: "block", marginBottom: 8, fontSize: 14 }, children: "نبذة تعريفية (اختياري)" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
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
          placeholder: "أخبرنا قليلاً عن نفسك...",
          value: form.bio,
          onChange: (e) => onChange("bio", e.target.value)
        }
      )
    ] })
  ] });
}
function RegisterEnhanced() {
  const [step, setStep] = reactExports.useState(1);
  const [form, setForm] = reactExports.useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptedTerms: false,
    profileImage: null,
    displayName: "",
    bio: ""
  });
  const [loading, setLoading] = reactExports.useState(false);
  const [captchaLoading, setCaptchaLoading] = reactExports.useState(false);
  const [captcha, setCaptcha] = reactExports.useState(null);
  const [captchaAnswer, setCaptchaAnswer] = reactExports.useState("");
  const [error, setError] = reactExports.useState("");
  const [captchaError, setCaptchaError] = reactExports.useState("");
  const [usernameChecking, setUsernameChecking] = reactExports.useState(false);
  const [usernameAvailable, setUsernameAvailable] = reactExports.useState(null);
  const [profileImagePreview, setProfileImagePreview] = reactExports.useState("");
  const navigate = useNavigate();
  const { run: runRegister } = useSingleFlight();
  const checkTimeoutRef = reactExports.useRef(null);
  const loadCaptcha = async () => {
    try {
      setCaptchaLoading(true);
      setCaptchaError("");
      const { data } = await getCaptchaChallenge();
      setCaptcha(data);
      setCaptchaAnswer("");
    } catch (err) {
      setCaptchaError(localizeAuthMessage(err?.response?.data?.detail, "تعذر تحميل الكابتشا حالياً."));
    } finally {
      setCaptchaLoading(false);
    }
  };
  reactExports.useEffect(() => {
    loadCaptcha();
  }, []);
  const checkUsernameAvailability = reactExports.useCallback(async (username) => {
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
        setError("حجم الصورة كبير جداً، الحد الأقصى 2 ميجابايت");
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
      setError("من فضلك أكمل كل البيانات المطلوبة.");
      return false;
    }
    if (username.length < 3) {
      setError("اسم المستخدم يجب أن يكون 3 أحرف على الأقل.");
      return false;
    }
    if (!isValidEmail(email)) {
      setError("البريد الإلكتروني غير صحيح.");
      return false;
    }
    if (isDisposableEmail(email)) {
      setError("يرجى استخدام بريد إلكتروني حقيقي، خدمات البريد المؤقت غير مسموح بها.");
      return false;
    }
    if (form.password.length < 8) {
      setError("كلمة المرور يجب أن تكون 8 أحرف على الأقل.");
      return false;
    }
    if (form.password !== form.confirmPassword) {
      setError("كلمات المرور غير متطابقة.");
      return false;
    }
    if (!form.acceptedTerms) {
      setError("يجب الموافقة على شروط الاستخدام.");
      return false;
    }
    if (!captchaAnswer) {
      setError("يرجى إدخال رمز الكابتشا.");
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
      navigate("/login", { state: { message: "تم إنشاء الحساب بنجاح! يرجى تسجيل الدخول." } });
    } catch (err) {
      setError(localizeAuthMessage(err?.response?.data?.detail, "فشل إنشاء الحساب. حاول مجدداً."));
      if (err?.response?.data?.detail?.includes("كابتشا")) loadCaptcha();
      setStep(1);
    } finally {
      setLoading(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    AuthShell,
    {
      badge: "YAMSHAT",
      title: "إنشاء حساب",
      description: "انضم إلى مجتمع يام شات اليوم وابدأ التواصل.",
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { className: "auth-form", onSubmit: handleSubmit, noValidate: true, children: [
        step === 1 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "step-content animate-fade-in", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "auth-form-head", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { children: "إنشاء حساب جديد" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "muted", children: "أدخل بياناتك الأساسية للبدء." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { position: "relative" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                label: "اسم المستخدم",
                placeholder: "username",
                value: form.name,
                onChange: (e) => handleChange("name", e.target.value),
                disabled: loading,
                required: true
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(UsernameAvailability, { username: form.name, checking: usernameChecking, available: usernameAvailable })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              label: "البريد الإلكتروني",
              type: "email",
              placeholder: "email@example.com",
              value: form.email,
              onChange: (e) => handleChange("email", e.target.value),
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
                onChange: (e) => handleChange("password", e.target.value),
                disabled: loading,
                required: true
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(PasswordStrengthMeter, { password: form.password })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              label: "تأكيد كلمة المرور",
              type: "password",
              placeholder: "••••••••",
              value: form.confirmPassword,
              onChange: (e) => handleChange("confirmPassword", e.target.value),
              disabled: loading,
              required: true
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
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
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { margin: "16px 0" }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { style: { display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "checkbox",
                checked: form.acceptedTerms,
                onChange: (e) => handleChange("acceptedTerms", e.target.checked),
                disabled: loading
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { fontSize: 13 }, children: [
              "أوافق على ",
              /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/terms", className: "link", children: "شروط الاستخدام" }),
              " و ",
              /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/privacy", className: "link", children: "سياسة الخصوصية" })
            ] })
          ] }) })
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(
          ProfileStep,
          {
            form,
            onChange: handleChange,
            onImageSelect: handleImageSelect,
            preview: profileImagePreview
          }
        ),
        error && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "alert error animate-shake", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: error }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 12, marginTop: 12 }, children: [
          step === 2 && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "secondary", onClick: () => setStep(1), disabled: loading, style: { flex: 1 }, children: "السابق" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              type: "submit",
              loading,
              disabled: loading || step === 1 && (!form.name || !form.email || !form.password || !captchaAnswer),
              style: { flex: 2 },
              children: step === 1 ? "المتابعة" : "إكمال التسجيل"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "auth-form-footer", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "لديك حساب بالفعل؟" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/login", className: "link-btn", children: "تسجيل الدخول" })
        ] })
      ] })
    }
  );
}
export {
  RegisterEnhanced as default
};
