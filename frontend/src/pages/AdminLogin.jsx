import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import AuthShell from '../components/auth/AuthShell.jsx';
import CaptchaBox from '../components/auth/CaptchaBox.jsx';
import TwoFactorChallengeModal from '../components/auth/TwoFactorChallengeModal.jsx';
import { devLoginUser, getCaptchaChallenge, loginUser, verifyTwoFactorLogin } from '../api/auth.js';
import { sanitizeInputText } from '../utils/sanitize.js';
import { clearStoredUser, getStoredUser, setStoredUser } from '../utils/auth.js';
import { PRIMARY_ADMIN_EMAIL, isPrimaryAdminSession } from '../utils/access.js';
import { isValidEmail, localizeAuthMessage, looksLikeEmail, parseApiDetail } from '../utils/authValidation.js';
import { CAPTCHA_ENABLED } from '../utils/securityFlags.js';

const canAccessAdminPanel = (session) => isPrimaryAdminSession(session);
const canShowDevTools = () => {
  if (typeof window === 'undefined') return Boolean(import.meta.env.DEV);
  const host = window.location.hostname;
  return Boolean(import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEV_LOGIN === 'true' || ['localhost', '127.0.0.1'].includes(host));
};

export default function AdminLogin() {
  const [form, setForm] = useState({ identifier: '', password: '', rememberMe: true, captchaAnswer: '' });
  const [loading, setLoading] = useState(false);
  const [devLoading, setDevLoading] = useState(false);
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const [captcha, setCaptcha] = useState(null);
  const [error, setError] = useState('');
  const [captchaError, setCaptchaError] = useState('');
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [pendingChallenge, setPendingChallenge] = useState(null);
  const [twoFactorError, setTwoFactorError] = useState('');
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const submitLockRef = useRef(false);
  const showDevTools = useMemo(() => canShowDevTools(), []);

  const loadCaptcha = async () => {
    if (!CAPTCHA_ENABLED) {
      setCaptcha(null);
      setCaptchaError('');
      setCaptchaLoading(false);
      return;
    }
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
    const user = getStoredUser();
    if (canAccessAdminPanel(user)) {
      navigate('/admin/dashboard', { replace: true });
      return;
    }
    if (CAPTCHA_ENABLED) loadCaptcha();
  }, [navigate]);

  const handleChange = (key) => (event) => {
    const value = key === 'rememberMe' ? event.target.checked : event.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const completeAdminLogin = (data) => {
    if (!canAccessAdminPanel(data)) {
      clearStoredUser();
      setError(`هذا الحساب لا يملك صلاحية دخول لوحة الإدارة. البريد الإداري الحالي هو ${PRIMARY_ADMIN_EMAIL}.`);
      return false;
    }

    setStoredUser(data);
    const targetPath = location.state?.from?.pathname?.startsWith('/admin')
      ? location.state.from.pathname
      : '/admin/dashboard';
    navigate(targetPath, { replace: true });
    return true;
  };

  const closeTwoFactorModal = () => {
    setShow2FAModal(false);
    setPendingChallenge(null);
    setTwoFactorError('');
  };

  const handleTwoFactorSubmit = async (code) => {
    if (!pendingChallenge?.challenge_id || !pendingChallenge?.email) {
      setTwoFactorError('بيانات التحقق الإضافي غير مكتملة. حاول تسجيل الدخول من جديد.');
      return;
    }

    try {
      setTwoFactorLoading(true);
      setTwoFactorError('');
      const { data } = await verifyTwoFactorLogin({
        email: pendingChallenge.email,
        challenge_id: pendingChallenge.challenge_id,
        code,
        remember_me: pendingChallenge.remember_me,
      });
      closeTwoFactorModal();
      const allowed = completeAdminLogin(data);
      if (!allowed) {
        await loadCaptcha();
      }
    } catch (err) {
      const parsed = parseApiDetail(err?.response?.data?.detail, 'رمز التحقق غير صحيح أو انتهت صلاحيته.');
      setTwoFactorError(parsed?.message || 'رمز التحقق غير صحيح أو انتهت صلاحيته.');
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitLockRef.current || loading) return;

    const identifier = sanitizeInputText(form.identifier, { maxLength: 120 });
    if (!identifier) {
      setError('اكتب بريد الإدارة أو اسم المستخدم.');
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
    if (CAPTCHA_ENABLED && !captcha?.captcha_id) {
      setError('حدّث الكابتشا أولاً.');
      await loadCaptcha();
      return;
    }
    if (CAPTCHA_ENABLED && !form.captchaAnswer.trim()) {
      setError('اكتب إجابة الكابتشا أولاً.');
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
        ...(CAPTCHA_ENABLED ? {
          captcha_id: captcha?.captcha_id,
          captcha_answer: form.captchaAnswer,
        } : {}),
      });

      if (data?.requires_2fa && data?.challenge_id) {
        setPendingChallenge({
          challenge_id: data.challenge_id,
          email: data.email,
          remember_me: form.rememberMe,
          delivery: data.delivery || null,
          devCode: data.dev_verification_code || '',
        });
        setTwoFactorError('');
        setShow2FAModal(true);
        return;
      }

      const allowed = completeAdminLogin(data);
      if (!allowed) {
        await loadCaptcha();
      }
    } catch (err) {
      clearStoredUser();
      const authError = parseApiDetail(err?.response?.data?.detail, 'فشل تسجيل دخول الإدارة، راجع البيانات.');
      if (authError?.message === localizeAuthMessage('Email verification required', 'لازم تفعّل البريد الإلكتروني الأول.')) {
        navigate('/verify-email', {
          state: {
            email: authError.email || identifier.trim(),
            message: 'لازم تفعّل البريد الإلكتروني للحساب الإداري الأول.',
            devCode: authError.dev_verification_code || '',
            rememberMe: form.rememberMe,
          },
        });
        return;
      }
      setError(authError?.message || 'فشل تسجيل دخول الإدارة، راجع البيانات.');
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
      const { data } = await devLoginUser({ preset: 'admin', remember_me: form.rememberMe });
      if (!canAccessAdminPanel(data)) {
        setError('تم الدخول التطويري لكن الحساب ليس أدمن أساسي.');
        return;
      }
      setStoredUser(data);
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      setError(localizeAuthMessage(err?.response?.data?.detail, 'تعذر تشغيل دخول التطوير للإدارة.'));
    } finally {
      setDevLoading(false);
    }
  };

  return (
    <AuthShell
      badge="YAMSHAT ADMIN"
      title="دخول الإدارة"
      description="هذه الصفحة مخصصة للأدمن فقط. لو البريد الإداري مضبوط صح هتدخل مباشرة إلى لوحة التحكم."
      alternateAction={
        <>
          <span className="muted">دخول المشتركين</span>
          <Link to="/login" className="auth-inline-link">الصفحة العادية</Link>
        </>
      }
      footer={
        <>
          رابط الإدارة الأساسي <Link to="/admin/login">/admin/login</Link> والرابط الاحتياطي <Link to="/admin.html">/admin.html</Link>.
        </>
      }
    >
      <form className="auth-form auth-form-enhanced" onSubmit={handleSubmit}>
        <div className="auth-form-head">
          <h2>لوحة تحكم الإدارة</h2>
          <p className="muted">دخول لوحة الإدارة مقصور على البريد المخصص للإدارة فقط: {PRIMARY_ADMIN_EMAIL}</p>
        </div>

        <Input label="البريد الإلكتروني أو اسم المستخدم" placeholder={PRIMARY_ADMIN_EMAIL} value={form.identifier} onChange={handleChange('identifier')} autoComplete="username" />
        <Input label="كلمة المرور" type="password" placeholder="••••••••" value={form.password} onChange={handleChange('password')} hint="الحد الأدنى 6 أحرف" autoComplete="current-password" />

        <label className="remember-me-row">
          <input type="checkbox" checked={form.rememberMe} onChange={handleChange('rememberMe')} />
          <span>تذكّر جلسة الإدارة على هذا الجهاز</span>
        </label>

        {CAPTCHA_ENABLED ? (
          <CaptchaBox
            challenge={captcha}
            value={form.captchaAnswer}
            onChange={(event) => setForm((prev) => ({ ...prev, captchaAnswer: event.target.value }))}
            onRefresh={loadCaptcha}
            loading={captchaLoading}
            disabled={loading || devLoading}
            error={captchaError}
          />
        ) : null}

        {showDevTools ? (
          <div className="dev-login-card">
            <strong>Development Login</strong>
            <p className="muted no-margin">زر سريع لتجربة لوحة الأدمن أثناء التطوير المحلي.</p>
            <Button type="button" variant="secondary" onClick={handleDevLogin} loading={devLoading} disabled={loading || devLoading}>
              {devLoading ? 'جارٍ دخول الإدارة التطويري...' : 'دخول تطويري للأدمن'}
            </Button>
          </div>
        ) : null}

        {error ? <div className="alert error">{error}</div> : null}

        <Button type="submit" loading={loading} disabled={loading || devLoading}>{loading ? 'جارٍ دخول الإدارة...' : 'دخول الإدارة'}</Button>
      </form>

      <TwoFactorChallengeModal
        isOpen={show2FAModal}
        onClose={closeTwoFactorModal}
        onSubmit={handleTwoFactorSubmit}
        loading={twoFactorLoading}
        error={twoFactorError}
        email={pendingChallenge?.email || ''}
        devCode={pendingChallenge?.devCode || ''}
        delivery={pendingChallenge?.delivery || null}
      />
    </AuthShell>
  );
}
