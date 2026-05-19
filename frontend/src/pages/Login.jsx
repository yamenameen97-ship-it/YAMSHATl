import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import AuthShell from '../components/auth/AuthShell.jsx';
import CaptchaBox from '../components/auth/CaptchaBox.jsx';
import TwoFactorChallengeModal from '../components/auth/TwoFactorChallengeModal.jsx';
import {
  getCaptchaChallenge,
  loginUser,
  loginWithApple,
  loginWithFacebook,
  loginWithGoogle,
  verifyTwoFactorLogin,
} from '../api/auth.js';
import { sanitizeInputText } from '../utils/sanitize.js';
import { setStoredUser } from '../utils/auth.js';
import { getDefaultPostLoginPath } from '../utils/access.js';
import { isValidEmail, localizeAuthMessage, looksLikeEmail, parseApiDetail } from '../utils/authValidation.js';
import useSingleFlight from '../hooks/useSingleFlight.js';

const AUTH_FEATURES = [
  'Google',
  'Facebook',
  'Apple',
  '2FA',
  'CAPTCHA',
  'Remember me',
  'Session restore',
  'CSRF',
  'Secure cookies',
  'Auth retry logic',
];

function SocialButton({ label, icon, onClick, disabled }) {
  return (
    <button type="button" className="social-auth-btn" onClick={onClick} disabled={disabled}>
      <span className="social-auth-icon" aria-hidden="true">{icon}</span>
      <span>{label}</span>
    </button>
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
  const [pendingChallenge, setPendingChallenge] = useState(null);
  const [twoFactorError, setTwoFactorError] = useState('');
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
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

  const featureSummary = useMemo(() => AUTH_FEATURES.join(' • '), []);

  const handleChange = (key) => (event) => {
    const value = key === 'rememberMe' ? event.target.checked : event.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
    if (error) setError('');
  };

  const completeLogin = (data) => {
    setStoredUser({ ...data, remember_me: form.rememberMe });
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
      const result = await runLogin(async () => loginUser({
        identifier,
        password: form.password,
        remember_me: form.rememberMe,
        captcha_id: captcha.captcha_id,
        captcha_answer: form.captchaAnswer,
      }));

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
      description="تسجيل دخول احترافي مع تسجيل اجتماعي، تحقق إضافي، استرجاع الجلسة، ومعالجة متقدمة لانتهاء التوكن."
    >
      <div className="auth-showcase-card">
        <div>
          <strong>مركز الدخول والمصادقة</strong>
          <p>{featureSummary}</p>
        </div>
        <div className="auth-feature-pills">
          {AUTH_FEATURES.map((item) => <span key={item}>{item}</span>)}
        </div>
      </div>

      <div className="social-auth-grid">
        <SocialButton label="المتابعة عبر Google" icon="G" onClick={loginWithGoogle} disabled={loading} />
        <SocialButton label="المتابعة عبر Facebook" icon="f" onClick={loginWithFacebook} disabled={loading} />
        <SocialButton label="المتابعة عبر Apple" icon="" onClick={loginWithApple} disabled={loading} />
      </div>

      <div className="auth-divider"><span>أو سجّل ببيانات الحساب</span></div>

      <form className="auth-form auth-form-enhanced" onSubmit={handleSubmit} noValidate>
        <div className="auth-form-head">
          <h2>تسجيل الدخول</h2>
          <p className="muted">أدخل بيانات حسابك للوصول إلى الخلاصة، الإعدادات، وإدارة الجلسات والأجهزة.</p>
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

        <div className="remember-row">
          <label className="remember-checkbox">
            <input
              type="checkbox"
              checked={form.rememberMe}
              onChange={handleChange('rememberMe')}
              disabled={loading}
            />
            <span>تذكرني على هذا الجهاز</span>
          </label>
          <div className="remember-note">يدعم استعادة الجلسة تلقائياً وتجديد الجلسة عند الحاجة.</div>
        </div>

        {error ? (
          <div className="alert error" style={{ display: 'flex', alignItems: 'center', gap: 10, animation: 'shake 0.4s ease' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div style={{ flex: 1 }}>
              <div>{error}</div>
              {retryCount > 2 ? <div style={{ fontSize: 11, marginTop: 4, opacity: 0.8 }}>إذا كانت المشكلة مستمرة استخدم استعادة كلمة المرور أو إعادة التفعيل.</div> : null}
            </div>
            {retryCount > 1 ? (
              <button type="button" onClick={handleSubmit} disabled={loading} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', textDecoration: 'underline', fontSize: 12 }}>
                إعادة المحاولة
              </button>
            ) : null}
          </div>
        ) : null}

        <Button
          type="submit"
          loading={loading}
          disabled={loading || !form.identifier || !form.password || !form.captchaAnswer}
          style={{ height: 50, fontSize: 16, fontWeight: 'bold' }}
        >
          {loading ? 'جاري التحقق...' : 'تسجيل الدخول'}
        </Button>

        <div className="auth-quick-links">
          <Link to="/verify-email">تفعيل البريد</Link>
          <Link to="/forgot-password">إعادة تعيين كلمة المرور</Link>
          <Link to="/register">إنشاء حساب جديد</Link>
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
        .auth-showcase-card {
          border: 1px solid rgba(96, 165, 250, 0.2);
          background: linear-gradient(135deg, rgba(37, 99, 235, 0.16), rgba(124, 58, 237, 0.12));
          padding: 16px;
          border-radius: 18px;
          margin-bottom: 16px;
          display: grid;
          gap: 12px;
        }
        .auth-showcase-card p {
          margin: 6px 0 0;
          line-height: 1.8;
          color: rgba(226, 232, 240, 0.82);
          font-size: 13px;
        }
        .auth-feature-pills {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .auth-feature-pills span {
          border-radius: 999px;
          padding: 7px 12px;
          background: rgba(15, 23, 42, 0.45);
          border: 1px solid rgba(148, 163, 184, 0.16);
          font-size: 12px;
        }
        .social-auth-grid {
          display: grid;
          gap: 10px;
          margin-bottom: 16px;
        }
        .social-auth-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          border-radius: 14px;
          border: 1px solid rgba(148, 163, 184, 0.18);
          background: rgba(15, 23, 42, 0.5);
          color: var(--text);
          padding: 12px 16px;
          cursor: pointer;
          transition: 0.2s ease;
          font-weight: 700;
        }
        .social-auth-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          border-color: rgba(96, 165, 250, 0.38);
        }
        .social-auth-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .social-auth-icon {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.08);
          font-weight: 900;
        }
        .auth-divider {
          display: flex;
          align-items: center;
          gap: 10px;
          color: rgba(226, 232, 240, 0.68);
          margin: 2px 0 16px;
          font-size: 13px;
        }
        .auth-divider::before,
        .auth-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(148, 163, 184, 0.18);
        }
        .remember-row {
          display: grid;
          gap: 8px;
          margin-top: -2px;
        }
        .remember-checkbox {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          user-select: none;
          font-size: 14px;
        }
        .remember-note {
          color: rgba(226, 232, 240, 0.68);
          font-size: 12px;
        }
        .auth-quick-links {
          display: flex;
          gap: 10px;
          justify-content: center;
          flex-wrap: wrap;
          font-size: 13px;
        }
        .auth-quick-links a {
          color: #93c5fd;
          text-decoration: none;
        }
      `}</style>
    </AuthShell>
  );
}
