import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import AuthShell from '../components/auth/AuthShell.jsx';
import CaptchaBox from '../components/auth/CaptchaBox.jsx';
import { getCaptchaChallenge, loginUser, verifyTwoFactorLogin } from '../api/auth.js';
import { sanitizeInputText } from '../utils/sanitize.js';
import { setStoredUser } from '../utils/auth.js';
import { getDefaultPostLoginPath } from '../utils/access.js';
import { isValidEmail, localizeAuthMessage, looksLikeEmail, parseApiDetail } from '../utils/authValidation.js';
import useSingleFlight from '../hooks/useSingleFlight.js';

function TwoFactorModal({ isOpen, onClose, onSubmit, loading, challenge }) {
  const [code, setCode] = useState('');

  useEffect(() => {
    if (!isOpen) setCode('');
  }, [isOpen]);

  const handleSubmit = () => {
    if (code.length === 6) {
      onSubmit(code);
    }
  };

  if (!isOpen) return null;

  const helperText = challenge?.delivery?.sent
    ? `تم إرسال رمز التحقق إلى ${challenge?.email || 'بريدك الإلكتروني'}.`
    : 'أدخل رمز التحقق الإضافي لإكمال تسجيل الدخول.';

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        backdropFilter: 'blur(8px)',
      }}
    >
      <div
        className="glass-card"
        style={{
          background: 'var(--bg)',
          borderRadius: 16,
          padding: 32,
          maxWidth: 400,
          width: '90%',
          border: '1px solid var(--line)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
        }}
      >
        <h3 style={{ marginBottom: 12, textAlign: 'center' }}>التحقق الإضافي</h3>
        <p className="muted" style={{ textAlign: 'center', marginBottom: 24 }}>{helperText}</p>
        <Input
          type="text"
          placeholder="000000"
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
          maxLength="6"
          style={{ textAlign: 'center', fontSize: 28, letterSpacing: 8, height: 60 }}
          autoFocus
        />
        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          <Button onClick={handleSubmit} loading={loading} disabled={code.length !== 6 || loading} style={{ flex: 2 }}>
            تأكيد الرمز
          </Button>
          <Button variant="secondary" onClick={onClose} style={{ flex: 1 }}>
            إلغاء
          </Button>
        </div>
      </div>
    </div>
  );
}

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
  const [twoFactorChallenge, setTwoFactorChallenge] = useState(null);
  const [captchaCooldown, setCaptchaCooldown] = useState(0);
  const [retryCount, setRetryCount] = useState(0);

  const navigate = useNavigate();
  const location = useLocation();
  const { run: runLogin } = useSingleFlight();

  useEffect(() => {
    if (captchaCooldown <= 0) return undefined;
    const timer = setInterval(() => setCaptchaCooldown((current) => current - 1), 1000);
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
    setStoredUser(data);
    const fallbackPath = getDefaultPostLoginPath(data);
    navigate(location.state?.from?.pathname || fallbackPath, { replace: true });
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
      const result = await runLogin(async () => loginUser({
        identifier,
        password: form.password,
        remember_me: form.rememberMe,
        captcha_id: captcha.captcha_id,
        captcha_answer: form.captchaAnswer,
      }));

      const { data } = result;

      if (data?.requires_2fa) {
        setTwoFactorChallenge({
          challenge_id: data.challenge_id,
          email: data.email,
          remember_me: form.rememberMe,
          delivery: data.delivery,
        });
        setShow2FAModal(true);
        setError('تم إرسال رمز تحقق إضافي. أدخله لإكمال تسجيل الدخول.');
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

  const handleVerifyTwoFactor = async (code) => {
    if (!twoFactorChallenge?.challenge_id) return;

    setLoading(true);
    setError('');
    try {
      const { data } = await verifyTwoFactorLogin({
        email: twoFactorChallenge.email || sanitizeInputText(form.identifier, { maxLength: 120 }).trim().toLowerCase(),
        challenge_id: twoFactorChallenge.challenge_id,
        code,
        remember_me: twoFactorChallenge.remember_me ?? form.rememberMe,
      });
      setShow2FAModal(false);
      setTwoFactorChallenge(null);
      completeLogin(data);
    } catch (err) {
      const apiError = parseApiDetail(err?.response?.data?.detail);
      setError(localizeAuthMessage(apiError?.message || err?.message, 'رمز التحقق غير صحيح أو منتهي الصلاحية.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell badge="YAMSHAT" title="تسجيل الدخول" description="مرحباً بك مجدداً في يمشات. سجل دخولك للمتابعة.">
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
          <Link to="/forgot-password" className="auth-inline-link" style={{ position: 'absolute', top: 0, left: 0, fontSize: 12 }}>
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
            <input type="checkbox" checked={form.rememberMe} onChange={handleChange('rememberMe')} disabled={loading} />
            <span style={{ fontSize: 14 }}>تذكرني على هذا الجهاز</span>
          </label>
        </div>

        {error && (
          <div className="alert error" style={{ display: 'flex', alignItems: 'center', gap: 10, animation: 'shake 0.4s ease' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div style={{ flex: 1 }}>
              <div>{error}</div>
              {retryCount > 2 ? <div style={{ fontSize: 11, marginTop: 4, opacity: 0.8 }}>إذا كنت تواجه مشكلة مستمرة، يرجى إعادة تعيين كلمة المرور.</div> : null}
            </div>
            {retryCount > 1 ? (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', textDecoration: 'underline', fontSize: 12 }}
              >
                إعادة المحاولة
              </button>
            ) : null}
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

      <TwoFactorModal
        isOpen={show2FAModal}
        onClose={() => {
          setShow2FAModal(false);
          setTwoFactorChallenge(null);
        }}
        onSubmit={handleVerifyTwoFactor}
        loading={loading}
        challenge={twoFactorChallenge}
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
