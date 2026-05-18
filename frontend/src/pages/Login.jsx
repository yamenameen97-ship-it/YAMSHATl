import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import AuthShell from '../components/auth/AuthShell.jsx';
import CaptchaBox from '../components/auth/CaptchaBox.jsx';
import TwoFactorChallengeModal from '../components/auth/TwoFactorChallengeModal.jsx';
import API from '../api/axios.js';
import { getCaptchaChallenge, loginUser, verifyTwoFactorLogin } from '../api/auth.js';
import { sanitizeInputText } from '../utils/sanitize.js';
import { setStoredUser } from '../utils/auth.js';
import { getDefaultPostLoginPath } from '../utils/access.js';
import { isValidEmail, localizeAuthMessage, looksLikeEmail, parseApiDetail } from '../utils/authValidation.js';
import useSingleFlight from '../hooks/useSingleFlight.js';

const SOCIAL_PROVIDERS = [
  {
    key: 'google',
    label: 'المتابعة عبر Google',
    shortLabel: 'Google',
    accent: '#ffffff',
    textColor: '#111827',
    borderColor: 'rgba(255,255,255,0.16)',
    glyph: 'G',
  },
  {
    key: 'facebook',
    label: 'المتابعة عبر Facebook',
    shortLabel: 'Facebook',
    accent: '#1877F2',
    textColor: '#ffffff',
    borderColor: 'rgba(24,119,242,0.45)',
    glyph: 'f',
  },
  {
    key: 'apple',
    label: 'المتابعة عبر Apple',
    shortLabel: 'Apple',
    accent: '#111111',
    textColor: '#ffffff',
    borderColor: 'rgba(255,255,255,0.14)',
    glyph: '',
  },
];

function SocialAuthButtons({ loading, activeProvider, onStart }) {
  return (
    <div className="social-auth-panel">
      <div className="social-auth-header">
        <span className="social-auth-line" />
        <span className="social-auth-title">تسجيل أسرع وآمن</span>
        <span className="social-auth-line" />
      </div>
      <div className="social-auth-grid">
        {SOCIAL_PROVIDERS.map((provider) => {
          const isBusy = activeProvider === provider.key;
          return (
            <button
              key={provider.key}
              type="button"
              className="social-auth-btn"
              onClick={() => onStart(provider.key)}
              disabled={loading || Boolean(activeProvider)}
              aria-busy={isBusy ? 'true' : 'false'}
              style={{
                '--social-bg': provider.accent,
                '--social-color': provider.textColor,
                '--social-border': provider.borderColor,
              }}
            >
              <span className="social-auth-glyph" aria-hidden="true">{provider.glyph}</span>
              <span className="social-auth-copy">
                <strong>{provider.shortLabel}</strong>
                <small>{isBusy ? 'جاري تحويلك الآن...' : provider.label}</small>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function LoginPage() {
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
  const [activeProvider, setActiveProvider] = useState('');

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

  const handleSocialLogin = async (provider) => {
    try {
      setActiveProvider(provider);
      setError('');
      const frontendUrl = window.location.origin;
      const { data } = await API.get(`/auth/oauth/${provider}/login`, {
        params: { frontend_url: frontendUrl },
        timeout: 15000,
      });
      if (!data?.url) {
        throw new Error('تعذر تجهيز رابط المصادقة الاجتماعية.');
      }
      window.location.assign(data.url);
    } catch (err) {
      const message = localizeAuthMessage(
        err?.response?.data?.detail,
        provider === 'apple'
          ? 'تسجيل Apple غير مفعّل حالياً في بيئة النشر الحالية.'
          : `تعذر بدء تسجيل ${provider}.`
      );
      setError(message);
      setActiveProvider('');
    }
  };

  return (
    <AuthShell
      badge="YAMSHAT"
      title="تسجيل الدخول"
      description="تسجيل دخول حديث مع Google وFacebook وApple، كابتشا، تذكرني، واستعادة جلسة محسّنة."
    >
      <form className="auth-form auth-form-enhanced" onSubmit={handleSubmit} noValidate>
        <div className="auth-form-head">
          <h2>تسجيل الدخول</h2>
          <p className="muted">أدخل بيانات حسابك للوصول إلى لوحة التحكم والمتابعة بشكل آمن.</p>
        </div>

        <SocialAuthButtons loading={loading} activeProvider={activeProvider} onStart={handleSocialLogin} />

        <div className="auth-mini-links">
          <Link to="/verify-email" className="link-btn secondary">تفعيل البريد</Link>
          <Link to="/forgot-password" className="link-btn secondary">إعادة تعيين كلمة المرور</Link>
        </div>

        <Input
          label="اسم المستخدم أو البريد"
          placeholder="username / email"
          value={form.identifier}
          onChange={handleChange('identifier')}
          autoComplete="username"
          disabled={loading || Boolean(activeProvider)}
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
            disabled={loading || Boolean(activeProvider)}
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
          disabled={loading || captchaCooldown > 0 || Boolean(activeProvider)}
          refreshCooldown={captchaCooldown}
        />

        <div className="auth-control-row">
          <label className="remember-me-toggle">
            <input
              type="checkbox"
              checked={form.rememberMe}
              onChange={handleChange('rememberMe')}
              disabled={loading || Boolean(activeProvider)}
            />
            <span>تذكرني على هذا الجهاز</span>
          </label>
          <Link to="/verify-email" className="auth-inline-link">إعادة إرسال كود التفعيل</Link>
        </div>

        {error && (
          <div className="alert error" style={{ display: 'flex', alignItems: 'center', gap: 10, animation: 'shake 0.4s ease' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div style={{ flex: 1 }}>
              <div>{error}</div>
              {retryCount > 2 && <div style={{ fontSize: 11, marginTop: 4, opacity: 0.8 }}>إذا كنت تواجه مشكلة مستمرة، استخدم إعادة التعيين أو التفعيل ثم حاول مجدداً.</div>}
            </div>
            {retryCount > 1 && !activeProvider && (
              <button type="button" onClick={handleSubmit} disabled={loading} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', textDecoration: 'underline', fontSize: 12 }}>
                إعادة المحاولة
              </button>
            )}
          </div>
        )}

        <Button
          type="submit"
          loading={loading}
          disabled={loading || Boolean(activeProvider) || !form.identifier || !form.password || !form.captchaAnswer}
          style={{ height: 50, fontSize: 16, fontWeight: 'bold' }}
        >
          {loading ? 'جاري التحقق...' : 'تسجيل الدخول'}
        </Button>

        <div className="auth-form-footer auth-form-footer-grid">
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
        .social-auth-panel {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 14px;
          border-radius: 18px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.02);
        }
        .social-auth-header {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 12px;
          color: rgba(255,255,255,0.65);
        }
        .social-auth-line {
          flex: 1;
          height: 1px;
          background: rgba(255,255,255,0.1);
        }
        .social-auth-grid {
          display: grid;
          gap: 10px;
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
        .social-auth-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          min-height: 64px;
          padding: 14px 16px;
          border-radius: 16px;
          border: 1px solid var(--social-border);
          background: linear-gradient(180deg, color-mix(in srgb, var(--social-bg) 92%, transparent), color-mix(in srgb, var(--social-bg) 80%, #000 20%));
          color: var(--social-color);
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
          text-align: right;
        }
        .social-auth-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 10px 24px rgba(0,0,0,0.18);
        }
        .social-auth-btn:disabled {
          opacity: 0.72;
          cursor: not-allowed;
        }
        .social-auth-glyph {
          width: 34px;
          height: 34px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          background: rgba(255,255,255,0.14);
          font-size: 20px;
          font-weight: 700;
          flex: 0 0 auto;
        }
        .social-auth-copy {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }
        .social-auth-copy strong {
          font-size: 14px;
          white-space: nowrap;
        }
        .social-auth-copy small {
          font-size: 11px;
          opacity: 0.88;
          line-height: 1.4;
        }
        .auth-mini-links {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .auth-control-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-top: -4px;
        }
        .remember-me-toggle {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-size: 14px;
          user-select: none;
        }
        .auth-form-footer-grid {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }
        @media (max-width: 900px) {
          .social-auth-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 640px) {
          .auth-control-row,
          .auth-form-footer-grid {
            flex-direction: column;
            align-items: stretch;
          }
        }
      `}</style>
    </AuthShell>
  );
}
