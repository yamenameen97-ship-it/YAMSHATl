import { aq as jsxRuntimeExports, aJ as motion } from "../index-2I4hYPnI.js";
import { B as BrandLogo } from "./BrandLogo-BFUGbKFF.js";
function AuthShell({ badge, title, description, footer, alternateAction, children }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "auth-shell auth-shell-fb", dir: "rtl", style: { fontFamily: "'Noto Sans Arabic', 'Cairo', system-ui, sans-serif" }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      motion.div,
      {
        className: "auth-card auth-card-fb",
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.3 },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "auth-fb-header", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(BrandLogo, { size: 44, alt: "شعار يام شات", className: "auth-fb-logo" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "auth-fb-brand-text", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "auth-fb-brand-name", children: badge || "YAMSHAT" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "auth-fb-brand-tagline", children: description || "سجل دخولك للمتابعة" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "auth-form-panel auth-form-panel-fb", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              motion.div,
              {
                className: "auth-floating-watermark",
                "aria-hidden": "true",
                initial: { opacity: 0, scale: 0.94, rotate: -8 },
                animate: { opacity: 0.06, scale: [0.96, 1.04, 0.98], rotate: [-8, -2, -10] },
                transition: { duration: 14, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" },
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(BrandLogo, { size: 260, alt: "", className: "auth-floating-watermark-logo", shadow: false })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "auth-form-panel-content auth-form-panel-content-fb", children: [
              alternateAction ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "auth-switch-row", children: alternateAction }) : null,
              children,
              footer ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "auth-note auth-note-small", children: footer }) : null
            ] })
          ] })
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
        .auth-shell-fb {
          min-height: 100vh;
          display: grid;
          place-items: start center;
          padding: 16px 14px;
          font-family: 'Noto Sans Arabic','Cairo',system-ui,sans-serif;
        }
        .auth-card-fb {
          width: min(420px, 100%);
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 14px 14px 18px;
          border-radius: 18px;
          border: 1px solid var(--line, rgba(148,163,184,0.14));
          background: rgba(7, 12, 24, 0.92);
          box-shadow: 0 18px 44px rgba(2, 6, 23, 0.45);
        }
        .auth-fb-header {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 4px 4px 8px;
          border-bottom: 1px solid rgba(148,163,184,0.08);
        }
        .auth-fb-logo {
          flex-shrink: 0;
        }
        .auth-fb-brand-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }
        .auth-fb-brand-name {
          font-size: 14px;
          font-weight: 700;
          color: #c4b5fd;
          letter-spacing: 0.5px;
        }
        .auth-fb-brand-tagline {
          font-size: 11px;
          color: #94a3b8;
          line-height: 1.4;
        }
        .auth-form-panel-fb {
          padding: 12px;
          border-radius: 14px;
          background: rgba(15, 23, 42, 0.5);
          border: 1px solid rgba(148, 163, 184, 0.08);
          position: relative;
          overflow: hidden;
        }
        .auth-form-panel-content-fb {
          position: relative;
          z-index: 1;
        }
        .auth-note-small {
          font-size: 11px;
          color: #94a3b8;
          margin-top: 8px;
          text-align: center;
        }
        @media (max-width: 480px) {
          .auth-card-fb {
            padding: 12px 12px 16px;
            border-radius: 14px;
          }
          .auth-fb-brand-name { font-size: 13px; }
          .auth-fb-brand-tagline { font-size: 10.5px; }
        }
      ` })
  ] });
}
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const OTP_REGEX = /\d/g;
const looksLikeEmail = (value) => String(value || "").includes("@");
const isValidEmail = (value) => EMAIL_REGEX.test(String(value || "").trim());
const normalizeOtpDigits = (value, length = 6) => (String(value || "").match(OTP_REGEX) || []).join("").slice(0, length);
const MESSAGE_MAP = /* @__PURE__ */ new Map([
  ["Missing or invalid registration fields", "بيانات التسجيل ناقصة أو غير صحيحة."],
  ["Email already exists", "البريد الإلكتروني مستخدم بالفعل."],
  ["Username already exists", "اسم المستخدم مستخدم بالفعل."],
  ["Email or username already exists", "البريد الإلكتروني أو اسم المستخدم مستخدم بالفعل."],
  ["Identifier and password are required", "اكتب البريد أو اسم المستخدم وكلمة المرور."],
  ["Invalid credentials", "البريد الإلكتروني أو اسم المستخدم أو كلمة المرور غير صحيحة."],
  ["Incorrect password", "كلمة المرور غير صحيحة."],
  ["Email or username not found", "البريد الإلكتروني أو اسم المستخدم غير صحيح."],
  ["Invalid email format", "صيغة البريد الإلكتروني غير صحيحة."],
  ["Invalid email address", "البريد الإلكتروني غير صحيح."],
  ["Email verification required", "لازم تفعّل البريد الإلكتروني الأول."],
  ["Too many login attempts", "تم تجاوز عدد محاولات الدخول، حاول بعد قليل."],
  ["Too many registration attempts", "تم تجاوز عدد محاولات إنشاء الحساب، حاول بعد قليل."],
  ["Too many attempts, try again later", "عدد المحاولات كبير، حاول بعد قليل."],
  ["Too many verification attempts", "تم تجاوز عدد محاولات التحقق، استنى شوية وجرب تاني."],
  ["Too many resend attempts", "طلبات إعادة الإرسال كثيرة جداً، استنى دقيقة وجرب تاني."],
  ["Too many refresh attempts", "طلبات تحديث الجلسة كثيرة، حاول بعد قليل."],
  ["Captcha is required", "لازم تحل كابتشا الأمان."],
  ["Captcha expired or missing", "الكابتشا انتهت أو غير موجودة. حدّثها وجرب تاني."],
  ["Captcha answer is incorrect", "إجابة الكابتشا غير صحيحة."],
  ["Too many captcha requests", "تم تجاوز عدد طلبات الكابتشا، حاول بعد قليل."],
  ["Additional verification is required", "مطلوب تأكيد إضافي قبل إكمال تسجيل الدخول."],
  ["Challenge not found", "طلب التحقق الإضافي غير موجود أو تم استهلاكه."],
  ["Challenge expired", "رمز التحقق الإضافي انتهت صلاحيته."],
  ["Invalid challenge type", "نوع طلب التحقق غير صحيح."],
  ["Password must be at least 6 characters", "كلمة المرور لازم تكون 6 أحرف على الأقل."],
  ["Email and code are required", "اكتب البريد الإلكتروني ورمز التحقق."],
  ["Reset code not found", "رمز التحقق غير موجود أو لم يتم طلبه بعد."],
  ["Reset code expired", "رمز التحقق انتهت صلاحيته. اطلب رمز جديد."],
  ["Invalid reset code", "رمز التحقق غير صحيح."],
  ["Password reset successfully", "تم تحديث كلمة المرور بنجاح."],
  ["Verification code not found", "رمز التفعيل غير موجود."],
  ["Verification code expired", "رمز التفعيل انتهت صلاحيته."],
  ["Invalid verification code", "رمز التفعيل غير صحيح."],
  ["If the account exists, a reset code has been sent", "لو الحساب موجود، بعتنا رمز تحقق على البريد الإلكتروني."],
  ["Reset code verified", "تم التحقق من الرمز بنجاح."],
  ["Email verified successfully", "تم تأكيد البريد الإلكتروني بنجاح."],
  ["Account created successfully. Please verify your email to continue.", "تم إنشاء الحساب. فعّل بريدك الإلكتروني قبل تسجيل الدخول."],
  ["Verification code sent", "تم إرسال رمز تحقق جديد."],
  ["Email already verified", "البريد الإلكتروني متفعل بالفعل."],
  ["Development login is disabled", "وضع الدخول التطويري غير مفعل حالياً."],
  ["Development account not found", "حساب التطوير المطلوب غير موجود."],
  ["Refresh token device mismatch", "الجلسة دي تخص جهاز تاني."],
  ["Refresh token user agent mismatch", "تم رفض الجلسة لأن المتصفح مختلف."],
  ["Refresh token IP mismatch", "تم رفض الجلسة لأن الشبكة مختلفة بشكل كبير."],
  ["Refresh session not found", "الجلسة غير موجودة أو تم إنهاؤها."],
  ["Session not found", "الجلسة غير موجودة."],
  ["Logged out from all devices", "تم تسجيل الخروج من كل الأجهزة."],
  ["Origin not allowed", "فيه مشكلة ربط بين الواجهة والباك إند: الدومين الحالي غير مسموح له على السيرفر."],
  ["CSRF token mismatch", "فيه تعارض في جلسة الحماية. حدّث الصفحة وجرّب تاني."],
  ["CSRF protection blocked the request", "طلب المصادقة اترفض بسبب إعدادات الحماية أو الربط بين الواجهة والباك إند."],
  ["User not found", "الحساب غير موجود."]
]);
function localizeAuthMessage(input, fallback = "حدث خطأ غير متوقع.") {
  if (!input) return fallback;
  const value = String(input).trim();
  if (!value) return fallback;
  if (/[\u0000-\u007f]/.test(value) === false) return value;
  for (const [key, translated] of MESSAGE_MAP.entries()) {
    if (value === key || value.includes(key)) return translated;
  }
  return value;
}
function parseApiDetail(detail, fallback) {
  if (typeof detail === "string") return { message: localizeAuthMessage(detail, fallback) };
  if (detail && typeof detail === "object") {
    return {
      ...detail,
      message: localizeAuthMessage(detail.message || detail.detail || fallback, fallback)
    };
  }
  return { message: fallback };
}
export {
  AuthShell as A,
  looksLikeEmail as a,
  isValidEmail as i,
  localizeAuthMessage as l,
  normalizeOtpDigits as n,
  parseApiDetail as p
};
