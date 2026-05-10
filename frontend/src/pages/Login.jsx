import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
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

function TwoFactorModal({ isOpen, onClose, onSubmit, loading }) {
  const [code, setCode] = useState('');

  const handleSubmit = () => {
    if (code.length === 6) {
      onSubmit(code);
      setCode('');
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
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
    }}>
      <div style={{
        background: 'var(--bg)',
        borderRadius: 12,
        padding: 24,
        maxWidth: 400,
        border: '1px solid var(--line)',
      }}>
        <h3>التحقق بخطوتين (2FA)</h3>
        <p className="muted">أدخل رمز التحقق من تطبيق المصادقة الخاص بك لضمان أمان حسابك.</p>
        <Input
          type="text"
          placeholder="000000"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          maxLength="6"
          style={{ textAlign: 'center', fontSize: 24, letterSpacing: 8 }}
        />
        <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
          <Button onClick={handleSubmit} loading={loading} disabled={code.length !== 6 || loading}>
            تأكيد الرمز
          </Button>
          <Button variant="secondary" onClick={onClose}>إلغاء</Button>
        </div>
      </div>
    </div>
  );
}

function LoginHistoryModal({ isOpen, onClose, history }) {
  if (!isOpen) return null;
  return (
    <div style={{
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
    }}>
      <div style={{
        background: 'var(--bg)',
        borderRadius: 12,
        padding: 24,
        maxWidth: 500,
        width: '90%',
        maxHeight: '80vh',
        overflowY: 'auto',
        border: '1px solid var(--line)',
      }}>
        <h3>سجل نشاط تسجيل الدخول</h3>
        <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
          {history.map((item, idx) => (
            <div key={idx} style={{ padding: 12, borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{item.device} - {item.browser}</strong>
                <small className="muted">{item.time}</small>
              </div>
              <div style={{ fontSize: 12, marginTop: 4 }}>
                <span>IP: {item.ip}</span> • <span>الموقع: {item.location}</span>
              </div>
            </div>
          ))}
        </div>
        <Button style={{ marginTop: 20 }} onClick={onClose}>إغلاق</Button>
      </div>
    </div>
  );
}

function DeviceSessionDetection() {
  const [deviceInfo, setDeviceInfo] = useState(null);

  useEffect(() => {
    const getDeviceInfo = () => {
      const ua = navigator.userAgent;
      const isWindows = ua.includes('Windows');
      const isMac = ua.includes('Macintosh');
      const isLinux = ua.includes('Linux');
      const isAndroid = ua.includes('Android');
      const isIOS = ua.includes('iPhone') || ua.includes('iPad');

      let os = 'Unknown';
      if (isWindows) os = 'Windows';
      else if (isMac) os = 'macOS';
      else if (isLinux) os = 'Linux';
      else if (isAndroid) os = 'Android';
      else if (isIOS) os = 'iOS';

      setDeviceInfo({
        os,
        browser: ua.includes('Chrome') ? 'Chrome' : ua.includes('Firefox') ? 'Firefox' : ua.includes('Safari') ? 'Safari' : 'Unknown',
        timestamp: new Date().toLocaleString('ar-EG'),
      });
    };

    getDeviceInfo();
  }, []);

  if (!deviceInfo) return null;

  return (
    <div className="glass-chip" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8, padding: 12, borderRadius: 12, border: '1px solid var(--line)' }}>
      <strong>🔒 جلسة الجهاز الحالية</strong>
      <div style={{ fontSize: 12 }}>
        <div className="muted">النظام: {deviceInfo.os}</div>
        <div className="muted">المتصفح: {deviceInfo.browser}</div>
        <div className="muted">وقت الدخول: {deviceInfo.timestamp}</div>
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
  const [twoFALoading, setTwoFALoading] = useState(false);
  const [sessionToken, setSessionToken] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
  // Mock login history
  const [loginHistory] = useState([
    { device: 'Windows PC', browser: 'Chrome', time: 'منذ ساعتين', ip: '192.168.1.1', location: 'الرياض، السعودية' },
    { device: 'iPhone 13', browser: 'Safari', time: 'أمس، 10:30 م', ip: '172.16.0.5', location: 'جدة، السعودية' },
    { device: 'MacBook Pro', browser: 'Firefox', time: '3 مايو 2026', ip: '10.0.0.42', location: 'دبي، الإمارات' },
  ]);

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

  const handleGoogleLogin = useCallback(async () => {
    try {
      setOauthLoading(true);
      setError('');
      // Simulate Google OAuth Redirect
      console.log('Redirecting to Google OAuth...');
      await new Promise(r => setTimeout(r, 1500));
      // In real app: window.location.href = `${API_BASE_URL}/auth/google`;
      completeLogin({ username: 'google_user', token: 'mock_google_token' });
    } catch (err) {
      setError('فشل تسجيل الدخول عبر Google. حاول مرة أخرى.');
    } finally {
      setOauthLoading(false);
    }
  }, [navigate]);

  const handleForgotPassword = async () => {
    if (!forgotEmail.trim()) {
      setError('أدخل البريد الإلكتروني');
      return;
    }
    if (!isValidEmail(forgotEmail)) {
      setError('البريد الإلكتروني غير صحيح');
      return;
    }

    try {
      setForgotLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setForgotSent(true);
      setError('');
    } catch (err) {
      setError('فشل إرسال رابط إعادة تعيين كلمة المرور');
    } finally {
      setForgotLoading(false);
    }
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

      if (data?.requires_2fa) {
        setSessionToken(data?.session_token || '');
        setShow2FAModal(true);
        return;
      }

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

  const handle2FASubmit = async (code) => {
    try {
      setTwoFALoading(true);
      // Simulate 2FA verification API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setShow2FAModal(false);
      completeLogin({ session_token: sessionToken, verified_2fa: true, username: form.identifier });
    } catch (err) {
      setError('رمز التحقق غير صحيح أو انتهت صلاحيته.');
    } finally {
      setTwoFALoading(false);
    }
  };

  if (showForgotPassword) {
    return (
      <AuthShell
        badge="YAMSHAT"
        title="نسيت كلمة المرور"
        description="أدخل بريدك الإلكتروني وسنرسل لك رابط لإعادة تعيين كلمة المرور"
      >
        <form className="auth-form auth-form-enhanced" onSubmit={(e) => { e.preventDefault(); handleForgotPassword(); }}>
          <div className="auth-form-head">
            <h2>استعادة كلمة المرور</h2>
            <p className="muted">سنرسل لك بريد إلكتروني يحتوي على رابط آمن لإعادة تعيين كلمة المرور.</p>
          </div>

          {!forgotSent ? (
            <>
              <Input
                label="البريد الإلكتروني"
                type="email"
                placeholder="user@mail.com"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
              />
              {error ? <div className="alert error">{error}</div> : null}
              <Button type="submit" loading={forgotLoading} disabled={forgotLoading}>
                إرسال رابط الاستعادة
              </Button>
            </>
          ) : (
            <div className="alert success">تم إرسال الرابط! تفقد بريدك الإلكتروني.</div>
          )}

          <div className="auth-form-footer">
            <button type="button" className="link-btn" onClick={() => setShowForgotPassword(false)}>
              العودة لتسجيل الدخول
            </button>
          </div>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      badge="YAMSHAT"
      title="تسجيل الدخول"
      description="مرحباً بك مجدداً في يمشات، تواصل مع أصدقائك بكل سهولة."
    >
      <form className="auth-form auth-form-enhanced" onSubmit={handleSubmit}>
        <div className="auth-form-head">
          <h2>تسجيل الدخول</h2>
          <p className="muted">أدخل بياناتك للوصول إلى حسابك.</p>
        </div>

        <div style={{ display: 'grid', gap: 12, marginBottom: 20 }}>
          <Button 
            type="button" 
            variant="secondary" 
            onClick={handleGoogleLogin} 
            loading={oauthLoading}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="currentColor" d="M21.35,11.1H12.18V13.83H18.69C18.36,17.64 15.19,19.27 12.19,19.27C8.36,19.27 5,16.25 5,12C5,7.9 8.2,4.73 12.2,4.73C15.29,4.73 17.1,6.7 17.1,6.7L19,4.72C19,4.72 16.56,2 12.1,2C6.42,2 2.03,6.8 2.03,12C2.03,17.05 6.16,22 12.25,22C17.6,22 21.5,18.33 21.5,12.91C21.5,11.76 21.35,11.1 21.35,11.1V11.1Z" />
            </svg>
            تسجيل الدخول بواسطة Google
          </Button>
        </div>

        <div className="divider"><span>أو بواسطة البريد</span></div>

        <Input
          label="البريد الإلكتروني أو اسم المستخدم"
          placeholder="user@mail.com"
          value={form.identifier}
          onChange={handleChange('identifier')}
          autoComplete="username"
        />

        <Input
          label="كلمة المرور"
          type="password"
          placeholder="••••••••"
          value={form.password}
          onChange={handleChange('password')}
          autoComplete="current-password"
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
            <input type="checkbox" checked={form.rememberMe} onChange={handleChange('rememberMe')} />
            تذكرني
          </label>
          <button type="button" className="link-btn" onClick={() => setShowForgotPassword(true)} style={{ fontSize: 14 }}>
            نسيت كلمة المرور؟
          </button>
        </div>

        <CaptchaBox
          challenge={captcha}
          value={form.captchaAnswer}
          onChange={handleChange('captchaAnswer')}
          onRefresh={loadCaptcha}
          loading={captchaLoading}
          error={captchaError}
        />

        {error ? <div className="alert error">{error}</div> : null}

        <Button type="submit" loading={loading} disabled={loading}>
          دخول
        </Button>

        <div style={{ marginTop: 24, display: 'grid', gap: 16 }}>
          <DeviceSessionDetection />
          
          <button 
            type="button" 
            className="link-btn" 
            onClick={() => setShowHistory(true)}
            style={{ fontSize: 13, textAlign: 'center', textDecoration: 'underline' }}
          >
            عرض سجل النشاط الأخير
          </button>
        </div>

        <div className="auth-form-footer">
          <span>ليس لديك حساب؟</span>
          <Link to="/register" className="link-btn">إنشاء حساب جديد</Link>
        </div>
      </form>

      <TwoFactorModal
        isOpen={show2FAModal}
        onClose={() => setShow2FAModal(false)}
        onSubmit={handle2FASubmit}
        loading={twoFALoading}
      />

      <LoginHistoryModal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        history={loginHistory}
      />
    </AuthShell>
  );
}
