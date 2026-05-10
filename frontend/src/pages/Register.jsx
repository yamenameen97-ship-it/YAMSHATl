import { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import AuthShell from '../components/auth/AuthShell.jsx';
import CaptchaBox from '../components/auth/CaptchaBox.jsx';
import { getCaptchaChallenge, registerUser } from '../api/auth.js';
import { sanitizeInputText } from '../utils/sanitize.js';
import { isValidEmail, localizeAuthMessage } from '../utils/authValidation.js';

const TEMP_EMAIL_DOMAINS = ['tempmail.com', '10minutemail.com', 'guerrillamail.com', 'mailinator.com'];
const DISPOSABLE_DOMAINS = ['temp', 'temporary', 'test', 'example'];

function PasswordStrengthMeter({ password }) {
  if (!password) return null;
  
  let strength = 0;
  let label = 'ضعيفة جداً';
  let color = '#ff4444';

  if (password.length >= 8) strength += 1;
  if (password.length >= 12) strength += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 1;
  if (/\d/.test(password)) strength += 1;
  if (/[!@#$%^&*]/.test(password)) strength += 1;

  if (strength === 0) label = 'ضعيفة جداً';
  else if (strength === 1) label = 'ضعيفة';
  else if (strength === 2) label = 'متوسطة';
  else if (strength === 3) label = 'قوية';
  else if (strength >= 4) label = 'قوية جداً';

  if (strength <= 1) color = '#ff4444';
  else if (strength === 2) color = '#ffaa00';
  else if (strength === 3) color = '#ffdd00';
  else color = '#44ff44';

  return (
    <div style={{ marginTop: 8, display: 'grid', gap: 6 }}>
      <div style={{ display: 'flex', gap: 4 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              background: i <= strength ? color : 'rgba(255,255,255,0.1)',
              transition: 'all 0.3s ease'
            }}
          />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <small style={{ color, fontWeight: 'bold' }}>قوة كلمة المرور: {label}</small>
        <small className="muted" style={{ fontSize: 10 }}>استخدم رموز وأرقام</small>
      </div>
    </div>
  );
}

function UsernameAvailability({ username, checking, available }) {
  if (!username || username.length < 3) return null;

  return (
    <div style={{ marginTop: 4, display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}>
      {checking ? (
        <span className="muted">🔍 جاري التحقق من التوفر...</span>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: available ? '#44ff44' : '#ff4444' }}>
          <span>{available ? '✅ اسم المستخدم متاح' : '❌ اسم المستخدم مستخدم بالفعل'}</span>
        </div>
      )}
    </div>
  );
}

function AvatarUpload({ onImageSelect, preview }) {
  const fileInputRef = useRef(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginBottom: 20 }}>
      <div 
        onClick={() => fileInputRef.current?.click()}
        style={{
          width: 100,
          height: 100,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)',
          border: '2px dashed var(--line)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {preview ? (
          <img src={preview} alt="Avatar Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ textAlign: 'center' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </div>
        )}
      </div>
      <input 
        type="file" 
        ref={fileInputRef} 
        hidden 
        accept="image/*" 
        onChange={(e) => onImageSelect(e.target.files[0])} 
      />
      <button type="button" className="link-btn" onClick={() => fileInputRef.current?.click()} style={{ fontSize: 13 }}>
        {preview ? 'تغيير الصورة الشخصية' : 'رفع صورة شخصية'}
      </button>
    </div>
  );
}

export default function RegisterEnhanced() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    acceptedTerms: false,
    profileImage: null,
  });
  const [loading, setLoading] = useState(false);
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const [captcha, setCaptcha] = useState(null);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [error, setError] = useState('');
  const [captchaError, setCaptchaError] = useState('');
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState('');
  const navigate = useNavigate();

  const loadCaptcha = async () => {
    try {
      setCaptchaLoading(true);
      setCaptchaError('');
      const { data } = await getCaptchaChallenge();
      setCaptcha(data);
      setCaptchaAnswer('');
    } catch (err) {
      setCaptchaError(localizeAuthMessage(err?.response?.data?.detail, 'تعذر تحميل الكابتشا حالياً.'));
    } finally {
      setCaptchaLoading(false);
    }
  };

  useEffect(() => {
    loadCaptcha();
  }, []);

  const checkUsernameAvailability = useCallback(async (username) => {
    if (!username || username.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    setUsernameChecking(true);
    try {
      // Simulate API call for live check
      await new Promise((resolve) => setTimeout(resolve, 800));
      const isAvailable = !['admin', 'test', 'yamshat', 'user'].includes(username.toLowerCase());
      setUsernameAvailable(isAvailable);
    } catch (err) {
      console.error('Failed to check username:', err);
    } finally {
      setUsernameChecking(false);
    }
  }, []);

  const handleChange = (key) => (event) => {
    const value = key === 'acceptedTerms' ? event.target.checked : event.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));

    if (key === 'name') {
      const sanitized = value.replace(/\s/g, '').toLowerCase();
      checkUsernameAvailability(sanitized);
    }
  };

  const handleImageSelect = (file) => {
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('حجم الصورة كبير جداً، الحد الأقصى 2 ميجابايت');
        return;
      }
      setForm(prev => ({ ...prev, profileImage: file }));
      const reader = new FileReader();
      reader.onload = (e) => setProfileImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const isDisposableEmail = (email) => {
    const domain = email.split('@')[1]?.toLowerCase() || '';
    return TEMP_EMAIL_DOMAINS.includes(domain) || DISPOSABLE_DOMAINS.some((d) => domain.includes(d));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    const username = sanitizeInputText(form.name, { maxLength: 50 }).replace(/\s/g, '').toLowerCase();
    const email = sanitizeInputText(form.email, { maxLength: 120 }).toLowerCase();

    if (!username || !email || !form.password.trim()) {
      setError('من فضلك أكمل كل البيانات المطلوبة.');
      return;
    }
    if (!isValidEmail(email)) {
      setError('البريد الإلكتروني غير صحيح.');
      return;
    }
    if (isDisposableEmail(email)) {
      setError('لا يمكن استخدام بريد إلكتروني مؤقت.');
      return;
    }
    if (form.password.length < 8) {
      setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('تأكيد كلمة المرور غير مطابق.');
      return;
    }
    if (!form.acceptedTerms) {
      setError('لازم توافق على الشروط والأحكام.');
      return;
    }
    if (!captcha?.captcha_id) {
      setError('حدّث الكابتشا أولاً.');
      await loadCaptcha();
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('username', username);
      formData.append('email', email);
      formData.append('password', form.password);
      formData.append('captcha_id', captcha.captcha_id);
      formData.append('captcha_answer', captchaAnswer);
      if (form.profileImage) {
        formData.append('avatar', form.profileImage);
      }

      const { data } = await registerUser(formData);
      navigate('/verify-email', {
        replace: true,
        state: {
          email: data?.email || email,
          message: 'تم إنشاء الحساب بنجاح! يرجى تفعيل بريدك الإلكتروني.',
          devCode: data?.dev_verification_code || '',
          rememberMe: true,
        },
      });
    } catch (err) {
      setError(localizeAuthMessage(err?.response?.data?.detail, 'تعذر إنشاء الحساب حالياً.'));
      await loadCaptcha();
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      badge="YAMSHAT"
      title="إنشاء حساب"
      description="انضم إلى مجتمع يمشات وشارك لحظاتك مع العالم."
    >
      <form className="auth-form auth-form-enhanced" onSubmit={handleSubmit}>
        <div className="auth-form-head">
          <h2>إنشاء حساب جديد</h2>
          <p className="muted">أكمل بياناتك للبدء في استخدام يمشات.</p>
        </div>

        <AvatarUpload onImageSelect={handleImageSelect} preview={profileImagePreview} />

        <Input
          label="اسم المستخدم"
          placeholder="yamshat_user"
          value={form.name}
          onChange={handleChange('name')}
          autoComplete="username"
        />
        <UsernameAvailability
          username={form.name}
          checking={usernameChecking}
          available={usernameAvailable}
        />

        <Input
          label="البريد الإلكتروني"
          placeholder="user@mail.com"
          type="email"
          value={form.email}
          onChange={handleChange('email')}
          autoComplete="email"
        />

        <Input
          label="كلمة المرور"
          type="password"
          placeholder="••••••••"
          value={form.password}
          onChange={handleChange('password')}
          autoComplete="new-password"
        />
        <PasswordStrengthMeter password={form.password} />

        <Input
          label="تأكيد كلمة المرور"
          type="password"
          placeholder="••••••••"
          value={form.confirmPassword}
          onChange={handleChange('confirmPassword')}
          autoComplete="new-password"
        />

        <div style={{ margin: '16px 0' }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', fontSize: 14 }}>
            <input 
              type="checkbox" 
              checked={form.acceptedTerms} 
              onChange={handleChange('acceptedTerms')} 
              style={{ marginTop: 4 }}
            />
            <span>أوافق على <Link to="/terms" className="auth-inline-link">شروط الخدمة</Link> و <Link to="/privacy" className="auth-inline-link">سياسة الخصوصية</Link></span>
          </label>
        </div>

        <CaptchaBox
          captcha={captcha}
          value={captchaAnswer}
          onChange={(e) => setCaptchaAnswer(e.target.value)}
          onRefresh={loadCaptcha}
          loading={captchaLoading}
          error={captchaError}
        />

        {error ? <div className="alert error">{error}</div> : null}

        <Button type="submit" loading={loading} disabled={loading || (usernameAvailable === false)}>
          إنشاء الحساب
        </Button>

        <div className="auth-form-footer">
          <span>لديك حساب بالفعل؟</span>
          <Link to="/login" className="link-btn">تسجيل الدخول</Link>
        </div>
      </form>
    </AuthShell>
  );
}
