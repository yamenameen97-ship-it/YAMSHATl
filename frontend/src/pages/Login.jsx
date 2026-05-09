import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import AuthShell from '../components/auth/AuthShell.jsx';
import CaptchaBox from '../components/auth/CaptchaBox.jsx';
import { devLoginUser, getCaptchaChallenge, loginUser } from '../api/auth.js';
import { sanitizeInputText } from '../utils/sanitize.js';
import { setStoredUser } from '../utils/auth.js';
import { getDefaultPostLoginPath } from '../utils/access.js';
import { isValidEmail, localizeAuthMessage, looksLikeEmail, parseApiDetail } from '../utils/authValidation.js';

const canShowDevTools = () => {
  if (typeof window === 'undefined') return Boolean(import.meta.env.DEV);
  const host = window.location.hostname;
  return Boolean(import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEV_LOGIN === 'true' || ['localhost', '127.0.0.1'].includes(host));
};

export default function Login() {
  const [form, setForm] = useState({ identifier: '', password: '', rememberMe: true, captchaAnswer: '' });
  const [loading, setLoading] = useState(false);
  const [devLoading, setDevLoading] = useState(false);
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const [captcha, setCaptcha] = useState(null);
  const [error, setError] = useState('');
  const [captchaError, setCaptchaError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const submitLockRef = useRef(false);
  const showDevTools = useMemo(() => canShowDevTools(), []);

  const loadCaptcha = async () => {
    try {
      setCaptchaLoading(true);
      setCaptchaError('');
      const { data } = await getCaptchaChallenge();
      setCaptcha(data);
      setForm((prev) => ({ ...prev, captchaAnswer: '' }));
    } catch (err) {
      setCaptchaError(localizeAuthMessage(err?.response?.data?.detail, 'تعذر تحميل الكابتشا حالياً.'));
    } finally {
      setCaptchaLoading(false);
    }
  };

  useEffect(() => {
    loadCaptcha();
  }, []);

  const handleChange = (key) => (event) => {
    const value = key === 'rememberMe' ? event.target.checked : event.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const completeLogin = (data) => {
    setStoredUser(data);
    const fallbackPath = getDefaultPostLoginPath(data);
    navigate(location.state?.from?.pathname || fallbackPath, { replace: true });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitLockRef.current || loading) return;

    const identifier = sanitizeInputText(form.identifier, { maxLength: 120 });
    if (!identifier) {
      setError('اكتب البريد الإلكتروني أو اسم المستخدم.');
      return;
    }
    if (looksLikeEmail(identifier) && !isValidEmail(identifier)) {
      setError('البريد الإلكتروني غير صحيح.');
      return;
    }
    if (!form.password.trim()) {
      setError('اكتب كلمة المرور.');
      return;
    }
    if (!captcha?.captcha_id) {
      setError('حدّث الكابتشا أولاً.');
      await loadCaptcha();
      return;
    }

    submitLockRef.current = true;
    setLoading(true);
    setError('');

    try {
      const { data } = await loginUser({
        identifier,
        email: identifier,
        username: identifier,
        password: form.password,
        remember_me: form.rememberMe,
        captcha_id: captcha.captcha_id,
        captcha_answer: form.captchaAnswer,
      });
      completeLogin(data);
    } catch (err) {
      const authError = parseApiDetail(err?.response?.data?.detail, 'فشل تسجيل الدخول، راجع البيانات.');
      if (authError?.message === localizeAuthMessage('Email verification required', 'لازم تفعّل البريد الإلكتروني الأول.')) {
        navigate('/verify-email', {
          state: {
            email: authError.email || identifier.trim(),
            message: 'لازم تفعّل البريد الإلكتروني الأول قبل الدخول.',
            devCode: authError.dev_verification_code || '',
            rememberMe: form.rememberMe,
          },
        });
        return;
      }
      setError(authError?.message || 'فشل تسجيل الدخول، راجع البيانات.');
      await loadCaptcha();
    } finally {
      submitLockRef.current = false;
      setLoading(false);
    }
  };

  const handleDevLogin = async () => {
    try {
      setDevLoading(true);
      setError('');
      const { data } = await devLoginUser({ preset: 'subscriber', remember_me: form.rememberMe });
      completeLogin(data);
    } catch (err) {
      setError(localizeAuthMessage(err?.response?.data?.detail, 'تعذر تشغيل دخول التطوير.'));
    } finally {
      setDevLoading(false);
    }
  };

  return (
    <AuthShell
      badge="YAMSHAT"
      title="تسجيل الدخول"
      description="ادخل إلى يمشات بواجهة جوال داكنة ومنظمة بنفس ألوان وترتيب المرجع المرسل."
      alternateAction={
        <>
          <span className="muted">ليس لديك حساب؟</span>
          <Link to="/register" className="auth-inline-link">إنشاء حساب</Link>
        </>
      }
      footer={
        <>
          لو نسيت كلمة المرور استخدم <Link to="/forgot-password">نسيت كلمة المرور</Link>، ولو عايز الإدارة استخدم <Link to="/admin/login">/admin/login</Link>.
        </>
      }
    >
      <form className="auth-form auth-form-enhanced" onSubmit={handleSubmit}>
        <div className="auth-form-head">
          <h2>مرحباً بعودتك</h2>
          <p className="muted">استخدم البريد الإلكتروني أو اسم المستخدم للدخول إلى مجتمعك ومحتواك.</p>
        </div>

        <Input label="البريد الإلكتروني أو اسم المستخدم" placeholder="yasr أو user@mail.com" value={form.identifier} onChange={handleChange('identifier')} autoComplete="username" />
        <Input label="كلمة المرور" type="password" placeholder="••••••••" value={form.password} onChange={handleChange('password')} hint="الحد الأدنى 6 أحرف" autoComplete="current-password" />

        <label className="remember-me-row">
          <input type="checkbox" checked={form.rememberMe} onChange={handleChange('rememberMe')} />
          <span>تذكّرني على هذا الجهاز</span>
        </label>

        <CaptchaBox
          challenge={captcha}
          value={form.captchaAnswer}
          onChange={(value) => setForm((prev) => ({ ...prev, captchaAnswer: value }))}
          onRefresh={loadCaptcha}
          loading={captchaLoading}
          disabled={loading || devLoading}
          error={captchaError}
        />

        {showDevTools ? (
          <div className="dev-login-card">
            <strong>Development Login</strong>
            <p className="muted no-margin">زر سريع لدخول التطوير المحلي بعد تفعيل متغيرات البيئة الخاصة به.</p>
            <Button type="button" variant="secondary" onClick={handleDevLogin} loading={devLoading} disabled={loading || devLoading}>
              {devLoading ? 'جارٍ الدخول التطويري...' : 'دخول حساب التطوير'}
            </Button>
          </div>
        ) : null}

        {error ? <div className="alert error">{error}</div> : null}

        <Button type="submit" loading={loading} disabled={loading || devLoading}>{loading ? 'جارٍ تسجيل الدخول...' : 'تسجيل الدخول'}</Button>
      </form>
    </AuthShell>
  );
}
