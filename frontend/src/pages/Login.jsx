import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import AuthShell from '../components/auth/AuthShell.jsx';
import CaptchaBox from '../components/auth/CaptchaBox.jsx';
import TwoFactorChallengeModal from '../components/auth/TwoFactorChallengeModal.jsx';
import { getCaptchaChallenge, loginUser, verifyTwoFactorLogin } from '../api/auth.js';
import { sanitizeInputText } from '../utils/sanitize.js';
import { setStoredUser } from '../utils/auth.js';
import { getDefaultPostLoginPath } from '../utils/access.js';
import { isValidEmail, localizeAuthMessage, looksLikeEmail, parseApiDetail } from '../utils/authValidation.js';
import useSingleFlight from '../hooks/useSingleFlight.js';

export default function LoginEnhanced() {
  const [form, setForm] = useState({
    identifier: '',
    password: '',
    rememberMe: true,
    captchaAnswer: '',
  });
  const [loading, setLoading] = useState(false);
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const [captcha, setCaptcha] = useState(null);
  const [error, setError] = useState('');
  const [captchaError, setCaptchaError] = useState('');
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [pendingChallenge, setPendingChallenge] = useState(null);
  const [twoFactorError, setTwoFactorError] = useState('');
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [captchaCooldown, setCaptchaCooldown] = useState(0);
  const [retryCount, setRetryCount] = useState(0);

  const navigate = useNavigate();
  const location = useLocation();
  const { run: runLogin } = useSingleFlight();

  useEffect(() => {
    if (captchaCooldown <= 0) return;
    const timer = setInterval(() => setCaptchaCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [captchaCooldown]);

  const loadCaptcha = async () => {
    if (captchaCooldown > 0) return;
    try {
      setCaptchaLoading(true);
      setCaptchaError('');
      const { data } = await getCaptchaChallenge();
      setCaptcha(data);
      setForm((prev) => ({ ...prev, captchaAnswer: '' }));
      setCaptchaCooldown(5);
    } catch (err) {
      setCaptchaError(localizeAuthMessage(err?.response?.data?.detail, 'تعذر تحميل الكابتشا حالياً. حاول مجدداً بعد قليل.'));
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
    if (error) setError('');
  };

  const completeLogin = (data) => {
    setStoredUser(data, { persist: form.rememberMe });
    const fallbackPath = getDefaultPostLoginPath(data);
    navigate(location.state?.from?.pathname || fallbackPath, { replace: true });
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
      completeLogin(data);
    } catch (err) {
      const parsed = parseApiDetail(err?.response?.data?.detail, 'رمز التحقق غير صحيح أو انتهت صلاحيته.');
      setTwoFactorError(parsed?.message || 'رمز التحقق غير صحيح أو انتهت صلاحيته.');
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    if (event) event.preventDefault();

    const identifier = sanitizeInputText(form.identifier, { maxLength: 120 });
    if (!identifier) {
      setError('يرجى إدخال البريد الإلكتروني أو اسم المستخدم.');
      return;
    }
    if (looksLikeEmail(identifier) && !isValidEmail(identifier)) {
      setError('تنسيق البريد الإلكتروني غير صحيح.');
      return;
    }
    if (!form.password.trim()) {
      setError('كلمة المرور مطلوبة.');
      return;
    }
    if (!captcha?.captcha_id) {
      setError('يرجى حل الكابتشا للمتابعة.');
      loadCaptcha();
      return;
    }
    if (!form.captchaAnswer) {
      setError('يرجى إدخال رمز الكابتشا.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await runLogin(async () => {
        return await loginUser({
          identifier,
          password: form.password,
          remember_me: form.rememberMe,
          captcha_id: captcha.captcha_id,
          captcha_answer: form.captchaAnswer,
        });
      });

      const { data } = result;

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

      completeLogin(data);
    } catch (err) {
      setRetryCount((prev) => prev + 1);
      const apiError = parseApiDetail(err?.response?.data?.detail);
      const message = localizeAuthMessage(apiError?.message || err?.message, 'فشل تسجيل الدخول. يرجى التأكد من البيانات والمحاولة مرة أخرى.');
      setError(message);

      if (apiError?.field === 'captcha' || message.includes('كابتشا')) {
        loadCaptcha();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      badge="YAMSHAT"
      title="تسجيل الدخول"
      description="مرحباً بك مجدداً في يمشات. سجل دخولك للمتابعة."
    >
      <form className="auth-form auth-form-enhanced" onSubmit={handleSubmit} noValidate>
        <div className="auth-form-head">
          <h2>تسجيل الدخول</h2>
          <p className="muted">أدخل بيانات حسابك للوصول إلى لوحة التحكم.</p>
        </div>

        <Input
          label="اسم المستخدم أو البريد"
          placeholder="username / email"
          value={form.identifier}
          onChange={handleChange('identifier')}
          autoComplete="username"
          disabled={loading}
          required
        />

        <div style={{ position: 'relative' }}>
          <Input
            label="كلمة المرور"
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={handleChange('password')}
            autoComplete="current-password"
            disabled={loading}
            required
          />
          <Link
            to="/forgot-password"
            className="auth-inline-link"
            style={{ position: 'absolute', top: 0, left: 0, fontSize: 12 }}
          >
            نسيت كلمة المرور؟
          </Link>
        </div>

        <CaptchaBox
          challenge={captcha}
          value={form.captchaAnswer}
          onChange={handleChange('captchaAnswer')}
          onRefresh={loadCaptcha}
          loading={captchaLoading}
          error={captchaError}
          disabled={loading || captchaCooldown > 0}
          refreshCooldown={captchaCooldown}
        />

        <div style={{ margin: '16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
            <input
              type="checkbox"
              checked={form.rememberMe}
              onChange={handleChange('rememberMe')}
              disabled={loading}
            />
            <span style={{ fontSize: 14 }}>تذكرني على هذا الجهاز</span>
          </label>
        </div>

        {error && (
          <div className="alert error" style={{ display: 'flex', alignItems: 'center', gap: 10, animation: 'shake 0.4s ease' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div style={{ flex: 1 }}>
              <div>{error}</div>
              {retryCount > 2 && <div style={{ fontSize: 11, marginTop: 4, opacity: 0.8 }}>إذا كنت تواجه مشكلة مستمرة، يرجى إعادة تعيين كلمة المرور.</div>}
            </div>
            {retryCount > 1 && (
              <button type="button" onClick={handleSubmit} disabled={loading} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', textDecoration: 'underline', fontSize: 12 }}>
                إعادة المحاولة
              </button>
            )}
          </div>
        )}

        <Button
          type="submit"
          loading={loading}
          disabled={loading || !form.identifier || !form.password || !form.captchaAnswer}
          style={{ height: 50, fontSize: 16, fontWeight: 'bold' }}
        >
          {loading ? 'جاري التحقق...' : 'تسجيل الدخول'}
        </Button>

        <div className="auth-form-footer">
          <span>ليس لديك حساب؟</span>
          <Link to="/register" className="link-btn">إنشاء حساب جديد</Link>
        </div>
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

      <style>{`
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
      `}</style>
    </AuthShell>
  );
}
