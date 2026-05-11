import { a as __toESM } from "./rolldown-runtime-DuU1KJyR.js";
import { X as useLocation, Z as useNavigate, ot as require_react, t as purify } from "./vendor-BEGBKm-Y.js";
import { n as Link } from "./vendor-react-D9YCW6KT.js";
import { n as require_jsx_runtime, t as motion } from "./vendor-motion-DouOFhvK.js";
import { D as getStoredUser, F as getDefaultPostLoginPath, I as isPrimaryAdminSession, P as PRIMARY_ADMIN_EMAIL, S as Button, k as setStoredUser, w as clearStoredUser } from "../index-RNpBu_Fp.js";
import { c as resetPassword, i as loginUser, l as verifyEmail, n as forgotPassword, o as registerUser, r as getCaptchaChallenge, s as resendVerification, t as devLoginUser, u as verifyResetCode } from "./auth-C2WvK0K6.js";
import { t as Input } from "./Input-BNYQZD5U.js";
//#region src/components/auth/AuthShell.jsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var featureItems = [
	{
		label: "المشاركة",
		value: "منشورات، صور، فيديو، وتفاعل لحظي"
	},
	{
		label: "المجتمع",
		value: "ريلز، ستوري، دردشة، وبث مباشر"
	},
	{
		label: "الهوية",
		value: "Dark mode + purple glow + Arabic mobile UX"
	}
];
function AuthShell({ badge, title, description, footer, alternateAction, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "auth-shell auth-shell-enhanced",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
			className: "auth-card auth-card-enhanced",
			initial: {
				opacity: 0,
				y: 20
			},
			animate: {
				opacity: 1,
				y: 0
			},
			transition: { duration: .35 },
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "auth-copy auth-copy-enhanced",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "badge",
						children: badge
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: title }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: description }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "auth-feature-list",
						children: featureItems.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "auth-feature-item",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "auth-feature-label",
								children: item.label
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: item.value })]
						}, item.label))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "auth-side-footer",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "واجهة جوال اجتماعية مطورة على نفس المشروع الحالي بالكامل." }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "auth-side-links",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/login",
									children: "تسجيل الدخول"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/register",
									children: "إنشاء حساب"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/",
									children: "الرئيسية"
								})
							]
						})]
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "auth-form-panel",
				children: [
					alternateAction ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "auth-switch-row",
						children: alternateAction
					}) : null,
					children,
					footer ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "auth-note auth-note-large",
						children: footer
					}) : null
				]
			})]
		})
	});
}
//#endregion
//#region src/components/auth/CaptchaBox.jsx
function CaptchaBox({ challenge, captcha, value, onChange, onRefresh, loading = false, disabled = false, error = "" }) {
	const currentChallenge = challenge || captcha || null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "captcha-box",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "captcha-row",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "field-label",
					children: "كابتشا الأمان"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "captcha-question",
					children: currentChallenge?.question || "..."
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					variant: "secondary",
					onClick: onRefresh,
					loading,
					disabled: disabled || loading,
					className: "captcha-refresh-btn",
					children: "تحديث"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
				label: "إجابة العملية",
				type: "text",
				inputMode: "numeric",
				dir: "ltr",
				autoComplete: "off",
				name: "captcha_answer",
				placeholder: "اكتب الناتج",
				value: value ?? "",
				onChange,
				disabled: disabled || loading || !currentChallenge?.captcha_id
			}),
			error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "field-hint error-text",
				children: error
			}) : null
		]
	});
}
//#endregion
//#region src/utils/sanitize.js
/**
* Stronger XSS Handling, URL Validation, and Media Validation
*/
var entityMap = {
	"<": "&lt;",
	">": "&gt;",
	"\"": "&quot;",
	"'": "&#39;",
	"`": "&#96;"
};
function cleanText(value = "") {
	return purify.sanitize(String(value || ""), {
		ALLOWED_TAGS: [],
		ALLOWED_ATTR: [],
		FORBID_TAGS: [
			"style",
			"script",
			"iframe",
			"object",
			"embed"
		],
		FORBID_ATTR: [
			"onerror",
			"onload",
			"onclick",
			"onmouseover"
		]
	});
}
function sanitizeInputText(value, { maxLength = 2e3 } = {}) {
	if (!value) return "";
	return cleanText(value).replace(/[<>",'`]/g, (char) => entityMap[char] || char).replace(/\s+/g, " ").trim().slice(0, maxLength);
}
//#endregion
//#region src/utils/authValidation.js
var EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
var OTP_REGEX = /\d/g;
var looksLikeEmail = (value) => String(value || "").includes("@");
var isValidEmail = (value) => EMAIL_REGEX.test(String(value || "").trim());
var normalizeOtpDigits = (value, length = 6) => (String(value || "").match(OTP_REGEX) || []).join("").slice(0, length);
var MESSAGE_MAP = new Map([
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
	for (const [key, translated] of MESSAGE_MAP.entries()) if (value === key || value.includes(key)) return translated;
	return value;
}
function parseApiDetail(detail, fallback) {
	if (typeof detail === "string") return { message: localizeAuthMessage(detail, fallback) };
	if (detail && typeof detail === "object") return {
		...detail,
		message: localizeAuthMessage(detail.message || detail.detail || fallback, fallback)
	};
	return { message: fallback };
}
//#endregion
//#region src/hooks/useSingleFlight.js
function useSingleFlight(asyncFn, options = {}) {
	const fnRef = (0, import_react.useRef)(asyncFn);
	const inflightRef = (0, import_react.useRef)(null);
	const [loading, setLoading] = (0, import_react.useState)(false);
	const cooldownMs = Number(options.cooldownMs || 0);
	fnRef.current = asyncFn;
	return {
		run: (0, import_react.useCallback)(async (...args) => {
			if (inflightRef.current) return inflightRef.current;
			const promise = (async () => {
				setLoading(true);
				try {
					return await fnRef.current(...args);
				} finally {
					if (cooldownMs > 0) await new Promise((resolve) => window.setTimeout(resolve, cooldownMs));
					inflightRef.current = null;
					setLoading(false);
				}
			})();
			inflightRef.current = promise;
			return promise;
		}, [cooldownMs]),
		loading,
		busy: loading
	};
}
//#endregion
//#region src/pages/Login.jsx
function TwoFactorModal({ isOpen, onClose, onSubmit, loading }) {
	const [code, setCode] = (0, import_react.useState)("");
	const handleSubmit = () => {
		if (code.length === 6) {
			onSubmit(code);
			setCode("");
		}
	};
	if (!isOpen) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		style: {
			position: "fixed",
			top: 0,
			left: 0,
			right: 0,
			bottom: 0,
			background: "rgba(0,0,0,0.8)",
			display: "flex",
			alignItems: "center",
			justifyContent: "center",
			zIndex: 2e3,
			backdropFilter: "blur(8px)"
		},
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "glass-card",
			style: {
				background: "var(--bg)",
				borderRadius: 16,
				padding: 32,
				maxWidth: 400,
				width: "90%",
				border: "1px solid var(--line)",
				boxShadow: "0 20px 50px rgba(0,0,0,0.3)"
			},
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					style: {
						marginBottom: 12,
						textAlign: "center"
					},
					children: "التحقق بخطوتين (2FA)"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "muted",
					style: {
						textAlign: "center",
						marginBottom: 24
					},
					children: "أدخل رمز التحقق من تطبيق المصادقة الخاص بك لضمان أمان حسابك."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					type: "text",
					placeholder: "000000",
					value: code,
					onChange: (e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6)),
					maxLength: "6",
					style: {
						textAlign: "center",
						fontSize: 28,
						letterSpacing: 8,
						height: 60
					},
					autoFocus: true
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					style: {
						display: "flex",
						gap: 12,
						marginTop: 24
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						onClick: handleSubmit,
						loading,
						disabled: code.length !== 6 || loading,
						style: { flex: 2 },
						children: "تأكيد الرمز"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "secondary",
						onClick: onClose,
						style: { flex: 1 },
						children: "إلغاء"
					})]
				})
			]
		})
	});
}
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
	const [sessionToken, setSessionToken] = (0, import_react.useState)("");
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
			setForm((prev) => ({
				...prev,
				captchaAnswer: ""
			}));
			setCaptchaCooldown(5);
		} catch (err) {
			setCaptchaError(localizeAuthMessage(err?.response?.data?.detail, "تعذر تحميل الكابتشا حالياً. حاول مجدداً بعد قليل."));
		} finally {
			setCaptchaLoading(false);
		}
	};
	(0, import_react.useEffect)(() => {
		loadCaptcha();
	}, []);
	const handleChange = (key) => (event) => {
		const value = key === "rememberMe" ? event.target.checked : event.target.value;
		setForm((prev) => ({
			...prev,
			[key]: value
		}));
		if (error) setError("");
	};
	const completeLogin = (data) => {
		setStoredUser(data, { persist: form.rememberMe });
		const fallbackPath = getDefaultPostLoginPath(data);
		navigate(location.state?.from?.pathname || fallbackPath, { replace: true });
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
			const { data } = await runLogin(async () => {
				return await loginUser({
					identifier,
					password: form.password,
					remember_me: form.rememberMe,
					captcha_id: captcha.captcha_id,
					captcha_answer: form.captchaAnswer
				});
			});
			if (data?.requires_2fa) {
				setSessionToken(data?.session_token || "");
				setShow2FAModal(true);
				return;
			}
			completeLogin(data);
		} catch (err) {
			setRetryCount((prev) => prev + 1);
			const apiError = parseApiDetail(err?.response?.data?.detail);
			const message = localizeAuthMessage(apiError?.message || err?.message, "فشل تسجيل الدخول. يرجى التأكد من البيانات والمحاولة مرة أخرى.");
			setError(message);
			if (apiError?.field === "captcha" || message.includes("كابتشا")) loadCaptcha();
		} finally {
			setLoading(false);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AuthShell, {
		badge: "YAMSHAT",
		title: "تسجيل الدخول",
		description: "مرحباً بك مجدداً في يمشات. سجل دخولك للمتابعة.",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "auth-form auth-form-enhanced",
				onSubmit: handleSubmit,
				noValidate: true,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "auth-form-head",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "تسجيل الدخول" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "muted",
							children: "أدخل بيانات حسابك للوصول إلى لوحة التحكم."
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						label: "اسم المستخدم أو البريد",
						placeholder: "username / email",
						value: form.identifier,
						onChange: handleChange("identifier"),
						autoComplete: "username",
						disabled: loading,
						required: true
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						style: { position: "relative" },
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							label: "كلمة المرور",
							type: "password",
							placeholder: "••••••••",
							value: form.password,
							onChange: handleChange("password"),
							autoComplete: "current-password",
							disabled: loading,
							required: true
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/forgot-password",
							className: "auth-inline-link",
							style: {
								position: "absolute",
								top: 0,
								left: 0,
								fontSize: 12
							},
							children: "نسيت كلمة المرور؟"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CaptchaBox, {
						challenge: captcha,
						value: form.captchaAnswer,
						onChange: handleChange("captchaAnswer"),
						onRefresh: loadCaptcha,
						loading: captchaLoading,
						error: captchaError,
						disabled: loading || captchaCooldown > 0,
						refreshCooldown: captchaCooldown
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						style: {
							margin: "16px 0",
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center"
						},
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							style: {
								display: "flex",
								alignItems: "center",
								gap: 8,
								cursor: "pointer",
								userSelect: "none"
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "checkbox",
								checked: form.rememberMe,
								onChange: handleChange("rememberMe"),
								disabled: loading
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								style: { fontSize: 14 },
								children: "تذكرني على هذا الجهاز"
							})]
						})
					}),
					error && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "alert error",
						style: {
							display: "flex",
							alignItems: "center",
							gap: 10,
							animation: "shake 0.4s ease"
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
								width: "20",
								height: "20",
								viewBox: "0 0 24 24",
								fill: "none",
								stroke: "currentColor",
								strokeWidth: "2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
										cx: "12",
										cy: "12",
										r: "10"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
										x1: "12",
										y1: "8",
										x2: "12",
										y2: "12"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
										x1: "12",
										y1: "16",
										x2: "12.01",
										y2: "16"
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								style: { flex: 1 },
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: error }), retryCount > 2 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									style: {
										fontSize: 11,
										marginTop: 4,
										opacity: .8
									},
									children: "إذا كنت تواجه مشكلة مستمرة، يرجى إعادة تعيين كلمة المرور."
								})]
							}),
							retryCount > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: handleSubmit,
								disabled: loading,
								style: {
									background: "none",
									border: "none",
									color: "inherit",
									cursor: "pointer",
									textDecoration: "underline",
									fontSize: 12
								},
								children: "إعادة المحاولة"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "submit",
						loading,
						disabled: loading || !form.identifier || !form.password || !form.captchaAnswer,
						style: {
							height: 50,
							fontSize: 16,
							fontWeight: "bold"
						},
						children: loading ? "جاري التحقق..." : "تسجيل الدخول"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "auth-form-footer",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "ليس لديك حساب؟" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/register",
							className: "link-btn",
							children: "إنشاء حساب جديد"
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TwoFactorModal, {
				isOpen: show2FAModal,
				onClose: () => setShow2FAModal(false),
				onSubmit: async (code) => {
					setLoading(true);
					setLoading(false);
				},
				loading
			}),
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
	});
}
//#endregion
//#region src/pages/AdminLogin.jsx
var canAccessAdminPanel = (session) => isPrimaryAdminSession(session);
var canShowDevTools = () => {
	if (typeof window === "undefined") return Boolean(false);
	const host = window.location.hostname;
	return Boolean(["localhost", "127.0.0.1"].includes(host));
};
function AdminLogin() {
	const [form, setForm] = (0, import_react.useState)({
		identifier: "",
		password: "",
		rememberMe: true,
		captchaAnswer: ""
	});
	const [loading, setLoading] = (0, import_react.useState)(false);
	const [devLoading, setDevLoading] = (0, import_react.useState)(false);
	const [captchaLoading, setCaptchaLoading] = (0, import_react.useState)(false);
	const [captcha, setCaptcha] = (0, import_react.useState)(null);
	const [error, setError] = (0, import_react.useState)("");
	const [captchaError, setCaptchaError] = (0, import_react.useState)("");
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
			setForm((prev) => ({
				...prev,
				captchaAnswer: ""
			}));
		} catch (err) {
			setCaptchaError(localizeAuthMessage(err?.response?.data?.detail, "تعذر تحميل الكابتشا حالياً."));
		} finally {
			setCaptchaLoading(false);
		}
	};
	(0, import_react.useEffect)(() => {
		if (canAccessAdminPanel(getStoredUser())) {
			navigate("/admin/dashboard", { replace: true });
			return;
		}
		loadCaptcha();
	}, [navigate]);
	const handleChange = (key) => (event) => {
		const value = key === "rememberMe" ? event.target.checked : event.target.value;
		setForm((prev) => ({
			...prev,
			[key]: value
		}));
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
			if (!canAccessAdminPanel(data)) {
				clearStoredUser();
				setError(`هذا الحساب لا يملك صلاحية دخول لوحة الإدارة. البريد الإداري الحالي هو ${PRIMARY_ADMIN_EMAIL}.`);
				await loadCaptcha();
				return;
			}
			setStoredUser(data);
			navigate(location.state?.from?.pathname?.startsWith("/admin") ? location.state.from.pathname : "/admin/dashboard", { replace: true });
		} catch (err) {
			clearStoredUser();
			const authError = parseApiDetail(err?.response?.data?.detail, "فشل تسجيل دخول الإدارة، راجع البيانات.");
			if (authError?.message === localizeAuthMessage("Email verification required", "لازم تفعّل البريد الإلكتروني الأول.")) {
				navigate("/verify-email", { state: {
					email: authError.email || identifier.trim(),
					message: "لازم تفعّل البريد الإلكتروني للحساب الإداري الأول.",
					devCode: authError.dev_verification_code || "",
					rememberMe: form.rememberMe
				} });
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
			const { data } = await devLoginUser({
				preset: "admin",
				remember_me: form.rememberMe
			});
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthShell, {
		badge: "YAMSHAT ADMIN",
		title: "دخول الإدارة",
		description: "هذه الصفحة مخصصة للأدمن فقط. لو البريد الإداري مضبوط صح هتدخل مباشرة إلى لوحة التحكم.",
		alternateAction: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "muted",
			children: "دخول المشتركين"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
			to: "/login",
			className: "auth-inline-link",
			children: "الصفحة العادية"
		})] }),
		footer: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			"رابط الإدارة الأساسي ",
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/admin/login",
				children: "/admin/login"
			}),
			" والرابط الاحتياطي ",
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/admin.html",
				children: "/admin.html"
			}),
			"."
		] }),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			className: "auth-form auth-form-enhanced",
			onSubmit: handleSubmit,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "auth-form-head",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "لوحة تحكم الإدارة" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "muted",
						children: ["دخول لوحة الإدارة مقصور على البريد المخصص للإدارة فقط: ", PRIMARY_ADMIN_EMAIL]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					label: "البريد الإلكتروني أو اسم المستخدم",
					placeholder: PRIMARY_ADMIN_EMAIL,
					value: form.identifier,
					onChange: handleChange("identifier"),
					autoComplete: "username"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					label: "كلمة المرور",
					type: "password",
					placeholder: "••••••••",
					value: form.password,
					onChange: handleChange("password"),
					hint: "الحد الأدنى 6 أحرف",
					autoComplete: "current-password"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "remember-me-row",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "checkbox",
						checked: form.rememberMe,
						onChange: handleChange("rememberMe")
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "تذكّر جلسة الإدارة على هذا الجهاز" })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CaptchaBox, {
					challenge: captcha,
					value: form.captchaAnswer,
					onChange: (event) => setForm((prev) => ({
						...prev,
						captchaAnswer: event.target.value
					})),
					onRefresh: loadCaptcha,
					loading: captchaLoading,
					disabled: loading || devLoading,
					error: captchaError
				}),
				showDevTools ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "dev-login-card",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Development Login" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "muted no-margin",
							children: "زر سريع لتجربة لوحة الأدمن أثناء التطوير المحلي."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "secondary",
							onClick: handleDevLogin,
							loading: devLoading,
							disabled: loading || devLoading,
							children: devLoading ? "جارٍ دخول الإدارة التطويري..." : "دخول تطويري للأدمن"
						})
					]
				}) : null,
				error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "alert error",
					children: error
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "submit",
					loading,
					disabled: loading || devLoading,
					children: loading ? "جارٍ دخول الإدارة..." : "دخول الإدارة"
				})
			]
		})
	});
}
//#endregion
//#region src/pages/Register.jsx
var TEMP_EMAIL_DOMAINS = [
	"tempmail.com",
	"10minutemail.com",
	"guerrillamail.com",
	"mailinator.com"
];
var DISPOSABLE_DOMAINS = [
	"temp",
	"temporary",
	"test",
	"example"
];
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		style: {
			marginTop: 8,
			display: "grid",
			gap: 6
		},
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			style: {
				display: "flex",
				gap: 4
			},
			children: [
				1,
				2,
				3,
				4,
				5
			].map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: {
				flex: 1,
				height: 4,
				borderRadius: 2,
				background: i <= strength ? color : "rgba(255,255,255,0.1)",
				transition: "all 0.3s ease"
			} }, i))
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			style: {
				display: "flex",
				justifyContent: "space-between",
				alignItems: "center"
			},
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("small", {
				style: {
					color,
					fontWeight: "bold",
					fontSize: 11
				},
				children: ["قوة كلمة المرور: ", label]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					display: "flex",
					gap: 4
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						style: {
							fontSize: 10,
							color: password.length >= 8 ? "#44ff44" : "var(--muted)"
						},
						children: "8+ أحرف"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						style: {
							fontSize: 10,
							color: /[A-Z]/.test(password) ? "#44ff44" : "var(--muted)"
						},
						children: "كبير"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						style: {
							fontSize: 10,
							color: /\d/.test(password) ? "#44ff44" : "var(--muted)"
						},
						children: "رقم"
					})
				]
			})]
		})]
	});
}
function UsernameAvailability({ username, checking, available }) {
	if (!username || username.length < 3) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		style: {
			marginTop: 4,
			display: "flex",
			gap: 8,
			alignItems: "center",
			fontSize: 12
		},
		children: checking ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "muted",
			style: {
				display: "flex",
				alignItems: "center",
				gap: 4
			},
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "spinner-small" }), " جاري التحقق..."]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			style: {
				display: "flex",
				alignItems: "center",
				gap: 4,
				color: available ? "#44ff44" : "#ff4444"
			},
			children: available ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
				width: "14",
				height: "14",
				viewBox: "0 0 24 24",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "3",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("polyline", { points: "20 6 9 17 4 12" })
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "اسم المستخدم متاح" })] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
				width: "14",
				height: "14",
				viewBox: "0 0 24 24",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
					x1: "18",
					y1: "6",
					x2: "6",
					y2: "18"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
					x1: "6",
					y1: "6",
					x2: "18",
					y2: "18"
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "اسم المستخدم مستخدم بالفعل" })] })
		})
	});
}
function ProfileStep({ form, onChange, onImageSelect, preview }) {
	const fileInputRef = (0, import_react.useRef)(null);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "step-content animate-fade-in",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					textAlign: "center",
					marginBottom: 24
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
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
						children: [preview ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: preview,
							alt: "Avatar Preview",
							style: {
								width: "100%",
								height: "100%",
								objectFit: "cover"
							}
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							style: {
								textAlign: "center",
								color: "var(--muted)"
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
								width: "40",
								height: "40",
								viewBox: "0 0 24 24",
								fill: "none",
								stroke: "currentColor",
								strokeWidth: "1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
									cx: "12",
									cy: "13",
									r: "4"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								style: {
									fontSize: 12,
									marginTop: 4
								},
								children: "اختر صورة"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "overlay",
							style: {
								position: "absolute",
								inset: 0,
								background: "rgba(0,0,0,0.4)",
								opacity: 0,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								transition: "0.2s"
							},
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
								width: "24",
								height: "24",
								viewBox: "0 0 24 24",
								fill: "none",
								stroke: "#fff",
								strokeWidth: "2",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12 5v14M5 12h14" })
							})
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "file",
						ref: fileInputRef,
						hidden: true,
						accept: "image/*",
						onChange: (e) => onImageSelect(e.target.files[0])
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "أهلاً بك! لنكمل ملفك الشخصي" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "muted",
						children: "هذه البيانات ستساعد الآخرين في التعرف عليك."
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
				label: "الاسم التعريفي (اختياري)",
				placeholder: "الاسم الذي سيظهر للجميع",
				value: form.displayName,
				onChange: (e) => onChange("displayName", e.target.value)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: { marginTop: 16 },
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
					style: {
						display: "block",
						marginBottom: 8,
						fontSize: 14
					},
					children: "نبذة تعريفية (اختياري)"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
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
				})]
			})
		]
	});
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
			setCaptchaError(localizeAuthMessage(err?.response?.data?.detail, "تعذر تحميل الكابتشا حالياً."));
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
			setUsernameAvailable(![
				"admin",
				"test",
				"yamshat",
				"root",
				"support"
			].includes(username.toLowerCase()));
		} catch (err) {
			console.error("Failed to check username:", err);
		} finally {
			setUsernameChecking(false);
		}
	}, []);
	const handleChange = (key, value) => {
		setForm((prev) => ({
			...prev,
			[key]: value
		}));
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
			setForm((prev) => ({
				...prev,
				profileImage: file
			}));
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthShell, {
		badge: "YAMSHAT",
		title: "إنشاء حساب",
		description: "انضم إلى مجتمع يمشات اليوم وابدأ التواصل.",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			className: "auth-form",
			onSubmit: handleSubmit,
			noValidate: true,
			children: [
				step === 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "step-content animate-fade-in",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "auth-form-head",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "إنشاء حساب جديد" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "muted",
								children: "أدخل بياناتك الأساسية للبدء."
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							style: { position: "relative" },
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								label: "اسم المستخدم",
								placeholder: "username",
								value: form.name,
								onChange: (e) => handleChange("name", e.target.value),
								disabled: loading,
								required: true
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UsernameAvailability, {
								username: form.name,
								checking: usernameChecking,
								available: usernameAvailable
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							label: "البريد الإلكتروني",
							type: "email",
							placeholder: "email@example.com",
							value: form.email,
							onChange: (e) => handleChange("email", e.target.value),
							disabled: loading,
							required: true
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							style: { position: "relative" },
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								label: "كلمة المرور",
								type: "password",
								placeholder: "••••••••",
								value: form.password,
								onChange: (e) => handleChange("password", e.target.value),
								disabled: loading,
								required: true
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PasswordStrengthMeter, { password: form.password })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							label: "تأكيد كلمة المرور",
							type: "password",
							placeholder: "••••••••",
							value: form.confirmPassword,
							onChange: (e) => handleChange("confirmPassword", e.target.value),
							disabled: loading,
							required: true
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CaptchaBox, {
							challenge: captcha,
							value: captchaAnswer,
							onChange: (e) => setCaptchaAnswer(e.target.value),
							onRefresh: loadCaptcha,
							loading: captchaLoading,
							error: captchaError,
							disabled: loading
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							style: { margin: "16px 0" },
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								style: {
									display: "flex",
									alignItems: "center",
									gap: 8,
									cursor: "pointer"
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "checkbox",
									checked: form.acceptedTerms,
									onChange: (e) => handleChange("acceptedTerms", e.target.checked),
									disabled: loading
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									style: { fontSize: 13 },
									children: [
										"أوافق على ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
											to: "/terms",
											className: "link",
											children: "شروط الاستخدام"
										}),
										" و ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
											to: "/privacy",
											className: "link",
											children: "سياسة الخصوصية"
										})
									]
								})]
							})
						})
					]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProfileStep, {
					form,
					onChange: handleChange,
					onImageSelect: handleImageSelect,
					preview: profileImagePreview
				}),
				error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "alert error animate-shake",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: error })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					style: {
						display: "flex",
						gap: 12,
						marginTop: 12
					},
					children: [step === 2 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						variant: "secondary",
						onClick: () => setStep(1),
						disabled: loading,
						style: { flex: 1 },
						children: "السابق"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "submit",
						loading,
						disabled: loading || step === 1 && (!form.name || !form.email || !form.password || !captchaAnswer),
						style: { flex: 2 },
						children: step === 1 ? "المتابعة" : "إكمال التسجيل"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "auth-form-footer",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "لديك حساب بالفعل؟" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/login",
						className: "link-btn",
						children: "تسجيل الدخول"
					})]
				})
			]
		})
	});
}
//#endregion
//#region src/components/auth/OtpCodeInput.jsx
function OtpCodeInput({ value = "", onChange, onComplete, length = 6, disabled = false, label = "رمز التحقق", hint = "اكتب الرمز أو الصقه وسيتم توزيعه تلقائياً.", allowClipboardRead = true }) {
	const refs = (0, import_react.useRef)([]);
	const digits = (0, import_react.useMemo)(() => {
		const normalized = normalizeOtpDigits(value, length);
		return Array.from({ length }, (_, index) => normalized[index] || "");
	}, [length, value]);
	const emitValue = (nextValue) => {
		const normalized = normalizeOtpDigits(nextValue, length);
		onChange?.(normalized);
		if (normalized.length === length) onComplete?.(normalized);
	};
	const focusIndex = (index) => {
		const target = refs.current[index];
		if (target) {
			target.focus();
			target.select();
		}
	};
	const handleDigitChange = (index) => (event) => {
		const incoming = normalizeOtpDigits(event.target.value, length);
		if (!incoming) {
			const next = [...digits];
			next[index] = "";
			emitValue(next.join(""));
			return;
		}
		if (incoming.length > 1) {
			emitValue(incoming);
			focusIndex(Math.min(incoming.length, length) - 1);
			return;
		}
		const next = [...digits];
		next[index] = incoming;
		emitValue(next.join(""));
		if (incoming && index < length - 1) focusIndex(index + 1);
	};
	const handleKeyDown = (index) => (event) => {
		if (event.key === "Backspace" && !digits[index] && index > 0) focusIndex(index - 1);
		if (event.key === "ArrowLeft" && index > 0) {
			event.preventDefault();
			focusIndex(index - 1);
		}
		if (event.key === "ArrowRight" && index < length - 1) {
			event.preventDefault();
			focusIndex(index + 1);
		}
	};
	const handlePaste = (event) => {
		event.preventDefault();
		emitValue(event.clipboardData.getData("text"));
	};
	const handleReadClipboard = async () => {
		if (!navigator?.clipboard?.readText) return;
		const normalized = normalizeOtpDigits(await navigator.clipboard.readText(), length);
		if (normalized) emitValue(normalized);
	};
	(0, import_react.useEffect)(() => {
		if (digits.every((digit) => !digit)) refs.current[0]?.focus();
	}, [digits]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "field",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "field-label",
				children: label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				style: {
					display: "flex",
					gap: "10px",
					direction: "ltr",
					justifyContent: "center",
					flexWrap: "wrap"
				},
				children: digits.map((digit, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					ref: (node) => {
						refs.current[index] = node;
					},
					className: "input",
					inputMode: "numeric",
					autoComplete: index === 0 ? "one-time-code" : "off",
					maxLength: 1,
					disabled,
					value: digit,
					onChange: handleDigitChange(index),
					onKeyDown: handleKeyDown(index),
					onPaste: handlePaste,
					style: {
						width: "52px",
						textAlign: "center",
						fontSize: "1.25rem",
						fontWeight: 700,
						paddingInline: 0
					}
				}, `${label}-${index}`))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					display: "flex",
					justifyContent: "space-between",
					gap: "12px",
					alignItems: "center",
					flexWrap: "wrap"
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "field-hint",
					children: hint
				}), allowClipboardRead ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "mini-action",
					onClick: handleReadClipboard,
					disabled,
					children: "قراءة الرمز من الحافظة"
				}) : null]
			})
		]
	});
}
//#endregion
//#region src/pages/VerifyEmail.jsx
function VerifyEmail() {
	const location = useLocation();
	const navigate = useNavigate();
	const [form, setForm] = (0, import_react.useState)({
		email: (0, import_react.useMemo)(() => location.state?.email || "", [location.state]),
		code: (0, import_react.useMemo)(() => normalizeOtpDigits(location.state?.devCode || location.state?.code || ""), [location.state]),
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
			setError("انتهت صلاحية الجلسة. يرجى طلب كود جديد.");
		}, 600 * 1e3);
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
			const { data } = await runVerify(async () => {
				return await verifyEmail({
					email: form.email.trim().toLowerCase(),
					code,
					remember_me: form.rememberMe
				});
			});
			setStoredUser(data);
			navigate(getDefaultPostLoginPath(data), { replace: true });
		} catch (err) {
			setError(localizeAuthMessage(err?.response?.data?.detail, "رمز التفعيل غير صحيح أو انتهت صلاحيته."));
			setAttempts((prev) => prev + 1);
			if (attempts >= 2) setShowFallback(true);
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
			if (data?.dev_verification_code) setForm((prev) => ({
				...prev,
				code: normalizeOtpDigits(data.dev_verification_code)
			}));
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
	(0, import_react.useEffect)(() => {
		if (form.code.length === 6 && !loading) handleSubmit(form.code);
	}, [form.code]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AuthShell, {
		badge: "YAMSHAT",
		title: "تأكيد الحساب",
		description: "أدخل رمز التحقق المرسل إلى بريدك الإلكتروني لتفعيل حسابك.",
		alternateAction: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "muted",
			children: "هل تريد تغيير البريد؟"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
			to: "/register",
			className: "auth-inline-link",
			children: "العودة للتسجيل"
		})] }),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			className: "auth-form auth-form-enhanced",
			onSubmit: (event) => {
				event.preventDefault();
				handleSubmit();
			},
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "auth-form-head",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							style: {
								display: "flex",
								justifyContent: "center",
								marginBottom: 20
							},
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "icon-circle",
								style: {
									width: 64,
									height: 64,
									background: "rgba(var(--accent-rgb), 0.1)",
									borderRadius: "50%",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									color: "var(--accent)"
								},
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
									width: "32",
									height: "32",
									viewBox: "0 0 24 24",
									fill: "none",
									stroke: "currentColor",
									strokeWidth: "2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("polyline", { points: "22,6 12,13 2,6" })]
								})
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "تحقق من بريدك" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "muted",
							children: ["أرسلنا كود التفعيل إلى ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
								style: { color: "var(--text)" },
								children: form.email
							})]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OtpCodeInput, {
					value: form.code,
					onChange: (next) => setForm((prev) => ({
						...prev,
						code: next
					})),
					onComplete: handleSubmit,
					disabled: loading || isTimeout,
					label: "رمز التحقق"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					style: { margin: "16px 0" },
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "remember-me-row",
						style: {
							display: "flex",
							alignItems: "center",
							gap: 8,
							cursor: "pointer"
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "checkbox",
							checked: form.rememberMe,
							onChange: (event) => setForm((prev) => ({
								...prev,
								rememberMe: event.target.checked
							})),
							disabled: loading
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							style: { fontSize: 14 },
							children: "تذكّرني على هذا الجهاز"
						})]
					})
				}),
				success && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "alert success animate-fade-in",
					children: success
				}),
				devCode && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "alert info",
					style: {
						background: "rgba(255,255,255,0.05)",
						border: "1px dashed var(--line)"
					},
					children: ["كود المطور المحاكي: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: devCode })]
				}),
				error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "alert error animate-shake",
					children: error
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "submit",
					loading,
					disabled: loading || isTimeout || form.code.length !== 6,
					style: { height: 50 },
					children: loading ? "جاري التحقق..." : "تأكيد الرمز"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					style: {
						textAlign: "center",
						marginTop: 16
					},
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "link-btn",
						disabled: resending || cooldown > 0,
						onClick: handleResend,
						style: { opacity: cooldown > 0 ? .6 : 1 },
						children: resending ? "جاري الإرسال..." : cooldown > 0 ? `إعادة الإرسال خلال ${cooldown}ث` : "لم يصلك الكود؟ إعادة إرسال"
					})
				}),
				showFallback && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "fallback-section animate-fade-in",
					style: {
						marginTop: 24,
						padding: 16,
						background: "var(--bg-soft)",
						borderRadius: 12,
						border: "1px solid var(--line)"
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
						style: {
							marginBottom: 8,
							fontSize: 14
						},
						children: "تواجه مشكلة؟"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
						style: {
							fontSize: 13,
							paddingRight: 20,
							margin: 0,
							color: "var(--muted)"
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "تأكد من مجلد الرسائل غير المرغوب فيها (Spam)." }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "تأكد من كتابة البريد الإلكتروني بشكل صحيح." }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/support",
								className: "auth-inline-link",
								children: "تواصل مع الدعم الفني"
							}) })
						]
					})]
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", { children: `
        .animate-fade-in { animation: fadeIn 0.4s ease-out; }
        .animate-shake { animation: shake 0.4s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
        .icon-circle { animation: pulse 2s infinite; }
        @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(var(--accent-rgb), 0.4); } 70% { box-shadow: 0 0 0 15px rgba(var(--accent-rgb), 0); } 100% { box-shadow: 0 0 0 0 rgba(var(--accent-rgb), 0); } }
      ` })]
	});
}
//#endregion
//#region src/components/auth/PasswordRecoveryFlow.jsx
function PasswordRecoveryFlow({ initialStep = "request" }) {
	const location = useLocation();
	const navigate = useNavigate();
	const initialEmail = (0, import_react.useMemo)(() => location.state?.email || "", [location.state]);
	const initialCode = (0, import_react.useMemo)(() => normalizeOtpDigits(location.state?.code || ""), [location.state]);
	const [step, setStep] = (0, import_react.useState)(initialStep === "reset" ? "verify" : initialStep);
	const [email, setEmail] = (0, import_react.useState)(initialEmail);
	const [code, setCode] = (0, import_react.useState)(initialCode);
	const [password, setPassword] = (0, import_react.useState)("");
	const [confirmPassword, setConfirmPassword] = (0, import_react.useState)("");
	const [loading, setLoading] = (0, import_react.useState)(false);
	const [verifying, setVerifying] = (0, import_react.useState)(false);
	const [saving, setSaving] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)("");
	const [success, setSuccess] = (0, import_react.useState)(location.state?.message || "");
	const [devCode, setDevCode] = (0, import_react.useState)(location.state?.devCode || "");
	const autoVerifiedCodeRef = (0, import_react.useRef)("");
	const validateEmailStep = () => {
		if (!email.trim()) {
			setError("اكتب البريد الإلكتروني المسجل بالحساب.");
			return false;
		}
		if (!isValidEmail(email)) {
			setError("البريد الإلكتروني غير صحيح.");
			return false;
		}
		return true;
	};
	const sendCode = async (event) => {
		event?.preventDefault?.();
		setError("");
		setSuccess("");
		if (!validateEmailStep()) return;
		setLoading(true);
		try {
			const { data } = await forgotPassword({ email: email.trim().toLowerCase() });
			setStep("verify");
			setSuccess(localizeAuthMessage(data?.message, "تم إرسال رمز تحقق على البريد الإلكتروني."));
			setDevCode(data?.dev_reset_code || "");
			setCode("");
			autoVerifiedCodeRef.current = "";
		} catch (err) {
			setError(localizeAuthMessage(err?.response?.data?.detail, "تعذر إرسال رمز الاسترجاع."));
		} finally {
			setLoading(false);
		}
	};
	const verifyCode = async (incomingCode = code) => {
		const normalizedCode = normalizeOtpDigits(incomingCode);
		if (verifying || normalizedCode.length !== 6) return;
		if (!validateEmailStep()) return;
		setVerifying(true);
		setError("");
		setSuccess("");
		try {
			const { data } = await verifyResetCode({
				email: email.trim().toLowerCase(),
				code: normalizedCode
			});
			setCode(normalizedCode);
			setStep("reset");
			setSuccess(localizeAuthMessage(data?.message, "تم التحقق من الرمز. اكتب كلمة المرور الجديدة."));
			autoVerifiedCodeRef.current = normalizedCode;
		} catch (err) {
			autoVerifiedCodeRef.current = "";
			setError(localizeAuthMessage(err?.response?.data?.detail, "رمز التحقق غير صحيح."));
		} finally {
			setVerifying(false);
		}
	};
	const handleOtpComplete = async (normalizedCode) => {
		setCode(normalizedCode);
		if (autoVerifiedCodeRef.current === normalizedCode) return;
		await verifyCode(normalizedCode);
	};
	const savePassword = async (event) => {
		event.preventDefault();
		setError("");
		setSuccess("");
		if (!validateEmailStep()) return;
		if (normalizeOtpDigits(code).length !== 6) {
			setError("اكتب رمز التحقق الكامل أولاً.");
			setStep("verify");
			return;
		}
		if (password.length < 6) {
			setError("كلمة المرور لازم تكون 6 أحرف على الأقل.");
			return;
		}
		if (password !== confirmPassword) {
			setError("تأكيد كلمة المرور غير مطابق.");
			return;
		}
		setSaving(true);
		try {
			const { data } = await resetPassword({
				email: email.trim().toLowerCase(),
				code: normalizeOtpDigits(code),
				new_password: password
			});
			setSuccess(localizeAuthMessage(data?.message, "تم تحديث كلمة المرور بنجاح."));
			setTimeout(() => navigate("/login", { replace: true }), 1200);
		} catch (err) {
			setError(localizeAuthMessage(err?.response?.data?.detail, "تعذر تحديث كلمة المرور."));
		} finally {
			setSaving(false);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthShell, {
		badge: "YAMSHAT",
		title: "استرجاع كلمة المرور",
		description: "اطلب رمز تحقق، وبعد ما يتأكد هيفتح لك فورم كلمة المرور الجديدة مباشرة.",
		alternateAction: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "muted",
			children: "رجوع"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
			to: "/login",
			className: "auth-inline-link",
			children: "تسجيل الدخول"
		})] }),
		footer: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			"دخول الإدارة يتم من ",
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/admin/login",
				children: "/admin/login"
			}),
			" أو ",
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/admin.html",
				children: "/admin.html"
			}),
			"."
		] }),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			className: "auth-form auth-form-enhanced",
			onSubmit: step === "reset" ? savePassword : sendCode,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "auth-form-head",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "تغيير كلمة المرور" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "muted",
						children: [
							step === "request" && "ابدأ بإرسال رمز التحقق على البريد الإلكتروني.",
							step === "verify" && "تم فتح مربع الرمز. أول ما الرمز يبقى صحيح هنفتح فورم كلمة المرور الجديدة.",
							step === "reset" && "الرمز صحيح. اكتب كلمة المرور الجديدة ثم احفظ."
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					label: "البريد الإلكتروني",
					placeholder: "user@mail.com",
					type: "email",
					autoComplete: "email",
					value: email,
					onChange: (event) => setEmail(event.target.value)
				}),
				step === "request" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "submit",
					loading,
					disabled: loading,
					children: loading ? "جارٍ إرسال الرمز..." : "إرسال رمز التحقق"
				}) : null,
				step !== "request" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OtpCodeInput, {
					value: code,
					onChange: setCode,
					onComplete: handleOtpComplete,
					disabled: verifying || saving,
					label: "رمز التحقق",
					hint: "لو نسخت الرمز من البريد أو الحافظة هيتوزع تلقائياً على المربعات."
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					style: {
						display: "flex",
						gap: "12px",
						flexWrap: "wrap"
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						loading: verifying,
						disabled: verifying || code.length !== 6,
						onClick: () => verifyCode(code),
						children: verifying ? "جارٍ التحقق..." : step === "reset" ? "تم التحقق" : "تأكيد الرمز"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						variant: "secondary",
						loading,
						disabled: loading,
						onClick: sendCode,
						children: "إعادة إرسال الرمز"
					})]
				})] }) : null,
				step === "reset" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						label: "كلمة المرور الجديدة",
						type: "password",
						autoComplete: "new-password",
						placeholder: "••••••••",
						value: password,
						onChange: (event) => setPassword(event.target.value),
						hint: "6 أحرف على الأقل"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						label: "تأكيد كلمة المرور",
						type: "password",
						autoComplete: "new-password",
						placeholder: "••••••••",
						value: confirmPassword,
						onChange: (event) => setConfirmPassword(event.target.value)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "submit",
						loading: saving,
						disabled: saving,
						children: saving ? "جارٍ حفظ كلمة المرور..." : "حفظ كلمة المرور الجديدة"
					})
				] }) : null,
				success ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "alert success",
					children: success
				}) : null,
				devCode ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "alert",
					children: ["كود التطوير: ", devCode]
				}) : null,
				error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "alert error",
					children: error
				}) : null
			]
		})
	});
}
//#endregion
//#region src/pages/ForgotPassword.jsx
function ForgotPassword() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PasswordRecoveryFlow, { initialStep: "request" });
}
//#endregion
//#region src/pages/ResetPassword.jsx
function ResetPassword() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PasswordRecoveryFlow, { initialStep: "verify" });
}
//#endregion
export { AdminLogin, ForgotPassword, LoginEnhanced as Login, RegisterEnhanced as Register, ResetPassword, VerifyEmail };
