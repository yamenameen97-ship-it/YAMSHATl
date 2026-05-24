const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const OTP_REGEX = /\d/g;

export const looksLikeEmail = (value) => String(value || '').includes('@');
export const isValidEmail = (value) => EMAIL_REGEX.test(String(value || '').trim());
export const normalizeOtpDigits = (value, length = 6) => (String(value || '').match(OTP_REGEX) || []).join('').slice(0, length);

const MESSAGE_MAP = new Map([
  ['Missing or invalid registration fields', 'بيانات التسجيل ناقصة أو غير صحيحة.'],
  ['Email already exists', 'البريد الإلكتروني مستخدم بالفعل.'],
  ['Username already exists', 'اسم المستخدم مستخدم بالفعل.'],
  ['Email or username already exists', 'البريد الإلكتروني أو اسم المستخدم مستخدم بالفعل.'],
  ['Identifier and password are required', 'اكتب البريد أو اسم المستخدم وكلمة المرور.'],
  ['Invalid credentials', 'البريد الإلكتروني أو اسم المستخدم أو كلمة المرور غير صحيحة.'],
  ['Incorrect password', 'كلمة المرور غير صحيحة.'],
  ['Email or username not found', 'البريد الإلكتروني أو اسم المستخدم غير صحيح.'],
  ['Invalid email format', 'صيغة البريد الإلكتروني غير صحيحة.'],
  ['Invalid email address', 'البريد الإلكتروني غير صحيح.'],
  ['Email verification required', 'لازم تفعّل البريد الإلكتروني الأول.'],
  ['Too many login attempts', 'تم تجاوز عدد محاولات الدخول، حاول بعد قليل.'],
  ['Too many registration attempts', 'تم تجاوز عدد محاولات إنشاء الحساب، حاول بعد قليل.'],
  ['Too many attempts, try again later', 'عدد المحاولات كبير، حاول بعد قليل.'],
  ['Too many verification attempts', 'تم تجاوز عدد محاولات التحقق، استنى شوية وجرب تاني.'],
  ['Too many resend attempts', 'طلبات إعادة الإرسال كثيرة جداً، استنى دقيقة وجرب تاني.'],
  ['Too many refresh attempts', 'طلبات تحديث الجلسة كثيرة، حاول بعد قليل.'],
  ['Captcha is required', 'لازم تحل كابتشا الأمان.'],
  ['Captcha expired or missing', 'الكابتشا انتهت أو غير موجودة. حدّثها وجرب تاني.'],
  ['Captcha answer is incorrect', 'إجابة الكابتشا غير صحيحة.'],
  ['Too many captcha requests', 'تم تجاوز عدد طلبات الكابتشا، حاول بعد قليل.'],
  ['Additional verification is required', 'مطلوب تأكيد إضافي قبل إكمال تسجيل الدخول.'],
  ['Challenge not found', 'طلب التحقق الإضافي غير موجود أو تم استهلاكه.'],
  ['Challenge expired', 'رمز التحقق الإضافي انتهت صلاحيته.'],
  ['Invalid challenge type', 'نوع طلب التحقق غير صحيح.'],
  ['Password must be at least 6 characters', 'كلمة المرور لازم تكون 6 أحرف على الأقل.'],
  ['Email and code are required', 'اكتب البريد الإلكتروني ورمز التحقق.'],
  ['Reset code not found', 'رمز التحقق غير موجود أو لم يتم طلبه بعد.'],
  ['Reset code expired', 'رمز التحقق انتهت صلاحيته. اطلب رمز جديد.'],
  ['Invalid reset code', 'رمز التحقق غير صحيح.'],
  ['Password reset successfully', 'تم تحديث كلمة المرور بنجاح.'],
  ['Verification code not found', 'رمز التفعيل غير موجود.'],
  ['Verification code expired', 'رمز التفعيل انتهت صلاحيته.'],
  ['Invalid verification code', 'رمز التفعيل غير صحيح.'],
  ['If the account exists, a reset code has been sent', 'لو الحساب موجود، بعتنا رمز تحقق على البريد الإلكتروني.'],
  ['Reset code verified', 'تم التحقق من الرمز بنجاح.'],
  ['Email verified successfully', 'تم تأكيد البريد الإلكتروني بنجاح.'],
  ['Account created successfully. Please verify your email to continue.', 'تم إنشاء الحساب. فعّل بريدك الإلكتروني قبل تسجيل الدخول.'],
  ['Verification code sent', 'تم إرسال رمز تحقق جديد.'],
  ['Email already verified', 'البريد الإلكتروني متفعل بالفعل.'],
  ['Development login is disabled', 'وضع الدخول التطويري غير مفعل حالياً.'],
  ['Development account not found', 'حساب التطوير المطلوب غير موجود.'],
  ['Refresh token device mismatch', 'الجلسة دي تخص جهاز تاني.'],
  ['Refresh token user agent mismatch', 'تم رفض الجلسة لأن المتصفح مختلف.'],
  ['Refresh token IP mismatch', 'تم رفض الجلسة لأن الشبكة مختلفة بشكل كبير.'],
  ['Refresh session not found', 'الجلسة غير موجودة أو تم إنهاؤها.'],
  ['Session not found', 'الجلسة غير موجودة.'],
  ['Logged out from all devices', 'تم تسجيل الخروج من كل الأجهزة.'],
  ['Origin not allowed', 'فيه مشكلة ربط بين الواجهة والباك إند: الدومين الحالي غير مسموح له على السيرفر.'],
  ['CSRF token mismatch', 'فيه تعارض في جلسة الحماية. حدّث الصفحة وجرّب تاني.'],
  ['CSRF protection blocked the request', 'طلب المصادقة اترفض بسبب إعدادات الحماية أو الربط بين الواجهة والباك إند.'],
  ['Access to XMLHttpRequest', 'الواجهة مش قادرة توصل للباك إند بسبب إعدادات الربط بين الدومينات.'],
  ['CORS policy', 'الواجهة مش قادرة توصل للباك إند بسبب إعدادات الربط بين الدومينات.'],
  ['Network Error', 'تعذر الاتصال بالسيرفر حالياً. لو لسه المشكلة موجودة بعد التحديث، اعمل إعادة نشر للفرونت والباك مع الملف المصلح.'],
  ['User not found', 'الحساب غير موجود.'],
]);

export function localizeAuthMessage(input, fallback = 'حدث خطأ غير متوقع.') {
  if (!input) return fallback;
  const value = String(input).trim();
  if (!value) return fallback;
  if (/[\u0000-\u007f]/.test(value) === false) return value;
  for (const [key, translated] of MESSAGE_MAP.entries()) {
    if (value === key || value.includes(key)) return translated;
  }
  return value;
}

export function parseApiDetail(detail, fallback) {
  if (typeof detail === 'string') return { message: localizeAuthMessage(detail, fallback) };
  if (detail && typeof detail === 'object') {
    return {
      ...detail,
      message: localizeAuthMessage(detail.message || detail.detail || fallback, fallback),
    };
  }
  return { message: fallback };
}
