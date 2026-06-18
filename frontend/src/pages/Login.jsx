import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import AuthShell from '../components/auth/AuthShell.jsx';
import CaptchaBox from '../components/auth/CaptchaBox.jsx';
import TwoFactorChallengeModal from '../components/auth/TwoFactorChallengeModal.jsx';
import { getCaptchaChallenge, loginUser, verifyTwoFactorLogin } from '../api/auth.js';
import SocialLoginButtons from '../components/auth/SocialLoginButtons.jsx';
import { sanitizeInputText } from '../utils/sanitize.js';
import { setStoredUser } from '../utils/auth.js';
import { getDefaultPostLoginPath } from '../utils/access.js';
import { isValidEmail, localizeAuthMessage, looksLikeEmail, parseApiDetail } from '../utils/authValidation.js';
import useSingleFlight from '../hooks/useSingleFlight.js';

function decodeOAuthPayload(hashValue = '') {
  const rawHash = String(hashValue || '').replace(/^#/, '');
  const params = new URLSearchParams(rawHash);
  const encodedPayload = params.get('oauth_payload') || '';
  if (!encodedPayload) return null;
  try {
    const normalized = encodedPayload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    const decoded = window.atob(padded);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export default function LoginEnhanced() {
  const [form, setForm] = useState({
    identifier: '',
    password: '',
    rememberMe: true, // محفوظ افتراضياً (تم إخفاء الـ checkbox من الواجهة بناءً على طلب المستخدم)
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

  const loadCaptcha = async (force = false) => {
    if (!force && captchaCooldown > 0) return;
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
    const timer = setTimeout(() => {
      loadCaptcha(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!captcha?.expires_in_seconds) return undefined;
    const ms = Math.max((Number(captcha.expires_in_seconds) - 30) * 1000, 30 * 1000);
    const timer = setTimeout(() => loadCaptcha(true), ms);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [captcha?.captcha_id]);

  const handleChange = (key) => (event) => {
    const value = key === 'rememberMe' ? event.target.checked : event.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
    if (error) setError('');
  };

  const completeLogin = (data) => {
    setStoredUser({
      ...data,
      remember_me: data?.remember_me ?? form.rememberMe,
    });
    const fallbackPath = getDefaultPostLoginPath(data);
    navigate(location.state?.from?.pathname || fallbackPath, { replace: true });
  };

  useEffect(() => {
    const oauthError = new URLSearchParams(location.search).get('oauth_error');
    if (oauthError) {
      setError(oauthError);
      window.history.replaceState({}, document.title, '/login');
      return;
    }

    const payload = decodeOAuthPayload(window.location.hash);
    if (!payload?.token) return;
    window.history.replaceState({}, document.title, '/login');
    completeLogin(payload);
  }, [location.search]);

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
      const status = err?.response?.status;
      const message = localizeAuthMessage(apiError?.message || err?.message, 'فشل تسجيل الدخول. يرجى التأكد من البيانات والمحاولة مرة أخرى.');
      setError(message);

      // v60 🔧 إصلاح جذري: أي 4xx يعني أن الـ nonce قد تم استهلاكه أو الكابتشا انتهت،
      // لذلك نجبر تحديث الكابتشا دائماً لتجنب فشل المحاولة التالية.
      // هذا يحل سيناريو "الكابتشا انتهت" عند إعادة المحاولة.
      const captchaRelated = apiError?.field === 'captcha'
        || message.includes('كابتشا')
        || message.toLowerCase?.().includes('captcha');
      const shouldRefreshCaptcha = captchaRelated
        || (typeof status === 'number' && status >= 400 && status < 500 && status !== 403);
      if (shouldRefreshCaptcha) {
        setForm((prev) => ({ ...prev, captchaAnswer: '' }));
        // forceLoad=true لتجاوز الـ cooldown عند فشل login
        loadCaptcha(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      badge="YAMSHAT"
      title="تسجيل الدخول"
      description="سجل دخولك للمتابعة"
    >
      <form className="auth-form auth-form-fb" onSubmit={handleSubmit} noValidate dir="rtl">
        <div className="auth-form-head-fb">
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
            style={{ position: 'absolute', top: 0, left: 0, fontSize: 11 }}
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
          disabled={loading}
          refreshCooldown={captchaCooldown}
        />

        {/* ملاحظة: تم حذف checkbox "تذكرني على هذا الجهاز" من الواجهة بناءً على طلب المستخدم.
            القيمة لا تزال true افتراضياً في state وتُرسل مع الطلب. */}

        {error && (
          <div className="alert error alert-fb" style={{ display: 'flex', alignItems: 'center', gap: 8, animation: 'shake 0.4s ease' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div style={{ flex: 1, fontSize: 12 }}>
              <div>{error}</div>
              {retryCount > 2 && <div style={{ fontSize: 10, marginTop: 2, opacity: 0.8 }}>إذا كنت تواجه مشكلة مستمرة، يرجى إعادة تعيين كلمة المرور.</div>}
            </div>
            {retryCount > 1 && (
              <button type="button" onClick={handleSubmit} disabled={loading} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', textDecoration: 'underline', fontSize: 11 }}>
                إعادة المحاولة
              </button>
            )}
          </div>
        )}

        <Button
          type="submit"
          loading={loading}
          disabled={loading || !form.identifier || !form.password || !form.captchaAnswer}
          style={{ height: 42, fontSize: 14, fontWeight: 700 }}
        >
          {loading ? 'جاري التحقق...' : 'تسجيل الدخول'}
        </Button>

        <SocialLoginButtons
          disabled={loading || captchaLoading}
          onSuccess={(payload) => completeLogin(payload)}
        />

        <div className="auth-form-footer auth-form-footer-fb">
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
        /* نموذج مدمج بنمط فيسبوك — مسافات صغيرة وخط مقروء في صفحة واحدة */
        .auth-form-fb {
          display: flex;
          flex-direction: column;
          gap: 10px;
          font-family: 'Noto Sans Arabic','Cairo',system-ui,sans-serif;
        }
        .auth-form-fb .auth-form-head-fb {
          text-align: center;
          margin-bottom: 2px;
        }
        .auth-form-fb .auth-form-head-fb h2 {
          margin: 0;
          font-size: 17px;
          font-weight: 700;
          color: #e2e8f0;
        }
        .auth-form-fb .auth-form-head-fb p {
          margin: 2px 0 0;
          font-size: 11.5px;
          color: #94a3b8;
        }
        .auth-form-fb label,
        .auth-form-fb .input-label {
          font-size: 11.5px !important;
        }
        .auth-form-fb input,
        .auth-form-fb .input {
          font-size: 13px !important;
          padding: 9px 11px !important;
          height: 38px !important;
        }
        .auth-form-fb .captcha-box {
          padding: 8px 10px !important;
          font-size: 12px !important;
        }
        .auth-form-fb .captcha-box .captcha-question {
          font-size: 15px !important;
        }
        .alert-fb {
          padding: 8px 10px !important;
          border-radius: 10px !important;
        }
        .auth-form-footer-fb {
          display: flex;
          justify-content: center;
          gap: 6px;
          font-size: 12px;
          margin-top: 4px;
          padding-top: 8px;
          border-top: 1px solid rgba(148,163,184,0.08);
        }
        .social-login-divider {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--muted);
          font-size: 11px;
        }
        .social-login-divider span {
          flex: 1;
          height: 1px;
          background: rgba(148, 163, 184, 0.18);
        }
        .social-login-grid {
          display: grid;
          gap: 8px;
        }
        @media (max-width: 480px) {
          .auth-form-fb { gap: 9px; }
          .auth-form-fb input,
          .auth-form-fb .input { height: 36px !important; font-size: 12.5px !important; }
        }
      `}</style>
    </AuthShell>
  );
}
