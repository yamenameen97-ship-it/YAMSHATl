import { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import AuthShell from '../components/auth/AuthShell.jsx';
import CaptchaBox from '../components/auth/CaptchaBox.jsx';
import { getCaptchaChallenge, registerUser } from '../api/auth.js';
import { sanitizeInputText } from '../utils/sanitize.js';
import { isValidEmail, localizeAuthMessage } from '../utils/authValidation.js';
import useSingleFlight from '../hooks/useSingleFlight.js';

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
        <small style={{ color, fontWeight: 'bold', fontSize: 11 }}>قوة كلمة المرور: {label}</small>
        <div style={{ display: 'flex', gap: 4 }}>
           <span style={{ fontSize: 10, color: password.length >= 8 ? '#44ff44' : 'var(--muted)' }}>8+ أحرف</span>
           <span style={{ fontSize: 10, color: /[A-Z]/.test(password) ? '#44ff44' : 'var(--muted)' }}>كبير</span>
           <span style={{ fontSize: 10, color: /\d/.test(password) ? '#44ff44' : 'var(--muted)' }}>رقم</span>
        </div>
      </div>
    </div>
  );
}

function UsernameAvailability({ username, checking, available }) {
  if (!username || username.length < 3) return null;

  return (
    <div style={{ marginTop: 4, display: 'flex', gap: 8, alignItems: 'center', fontSize: 12 }}>
      {checking ? (
        <span className="muted" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span className="spinner-small"></span> جاري التحقق...
        </span>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: available ? '#44ff44' : '#ff4444' }}>
          {available ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
              <span>اسم المستخدم متاح</span>
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              <span>اسم المستخدم مستخدم بالفعل</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ProfileStep({ form, onChange, onImageSelect, preview }) {
  const fileInputRef = useRef(null);
  return (
    <div className="step-content animate-fade-in">
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div 
          onClick={() => fileInputRef.current?.click()}
          style={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: 'var(--bg-soft)',
            border: '2px dashed var(--line)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            margin: '0 auto 16px',
            overflow: 'hidden',
            position: 'relative',
            transition: 'all 0.3s ease',
            boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
          }}
          className="avatar-upload-box"
        >
          {preview ? (
            <img src={preview} alt="Avatar Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--muted)' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              <div style={{ fontSize: 12, marginTop: 4 }}>اختر صورة</div>
            </div>
          )}
          <div className="overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', opacity: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
          </div>
        </div>
        <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={(e) => onImageSelect(e.target.files[0])} />
        <h3>أهلاً بك! لنكمل ملفك الشخصي</h3>
        <p className="muted">هذه البيانات ستساعد الآخرين في التعرف عليك.</p>
      </div>

      <Input
        label="الاسم التعريفي (اختياري)"
        placeholder="الاسم الذي سيظهر للجميع"
        value={form.displayName}
        onChange={(e) => onChange('displayName', e.target.value)}
      />
      <div style={{ marginTop: 16 }}>
        <label style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>نبذة تعريفية (اختياري)</label>
        <textarea
          style={{
            width: '100%',
            background: 'var(--bg-input)',
            border: '1px solid var(--line)',
            borderRadius: 12,
            padding: 12,
            color: 'var(--text)',
            minHeight: 80,
            resize: 'none'
          }}
          placeholder="أخبرنا قليلاً عن نفسك..."
          value={form.bio}
          onChange={(e) => onChange('bio', e.target.value)}
        />
      </div>
    </div>
  );
}

export default function RegisterEnhanced() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptedTerms: false,
    profileImage: null,
    displayName: '',
    bio: '',
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
  const { run: runRegister } = useSingleFlight();
  const checkTimeoutRef = useRef(null);

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
      await new Promise((resolve) => setTimeout(resolve, 600));
      const forbidden = ['admin', 'test', 'yamshat', 'root', 'support'];
      setUsernameAvailable(!forbidden.includes(username.toLowerCase()));
    } catch (err) {
      console.error('Failed to check username:', err);
    } finally {
      setUsernameChecking(false);
    }
  }, []);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (error) setError('');

    if (key === 'name') {
      const sanitized = value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
      if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current);
      checkTimeoutRef.current = setTimeout(() => checkUsernameAvailability(sanitized), 500);
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

  const validateStep1 = () => {
    const username = sanitizeInputText(form.name, { maxLength: 50 }).replace(/\s/g, '').toLowerCase();
    const email = sanitizeInputText(form.email, { maxLength: 120 }).toLowerCase();

    if (!username || !email || !form.password.trim()) {
      setError('من فضلك أكمل كل البيانات المطلوبة.');
      return false;
    }
    if (username.length < 3) {
      setError('اسم المستخدم يجب أن يكون 3 أحرف على الأقل.');
      return false;
    }
    if (!isValidEmail(email)) {
      setError('البريد الإلكتروني غير صحيح.');
      return false;
    }
    if (isDisposableEmail(email)) {
      setError('يرجى استخدام بريد إلكتروني حقيقي، خدمات البريد المؤقت غير مسموح بها.');
      return false;
    }
    if (form.password.length < 8) {
      setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل.');
      return false;
    }
    if (form.password !== form.confirmPassword) {
      setError('كلمات المرور غير متطابقة.');
      return false;
    }
    if (!form.acceptedTerms) {
      setError('يجب الموافقة على شروط الاستخدام.');
      return false;
    }
    if (!captchaAnswer) {
      setError('يرجى إدخال رمز الكابتشا.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (event) => {
    if (event) event.preventDefault();
    
    if (step === 1) {
      if (validateStep1()) setStep(2);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('username', form.name.toLowerCase());
      formData.append('email', form.email.toLowerCase());
      formData.append('password', form.password);
      formData.append('captcha_id', captcha.captcha_id);
      formData.append('captcha_answer', captchaAnswer);
      if (form.displayName) formData.append('display_name', form.displayName);
      if (form.bio) formData.append('bio', form.bio);
      if (form.profileImage) formData.append('avatar', form.profileImage);

      await runRegister(async () => {
        return await registerUser(formData);
      });

      navigate('/login', { state: { message: 'تم إنشاء الحساب بنجاح! يرجى تسجيل الدخول.' } });
    } catch (err) {
      setError(localizeAuthMessage(err?.response?.data?.detail, 'فشل إنشاء الحساب. حاول مجدداً.'));
      if (err?.response?.data?.detail?.includes('كابتشا')) loadCaptcha();
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      badge="YAMSHAT"
      title="إنشاء حساب"
      description="انضم إلى مجتمع يام شات اليوم وابدأ التواصل."
    >
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {step === 1 ? (
          <div className="step-content animate-fade-in">
            <div className="auth-form-head">
              <h2>إنشاء حساب جديد</h2>
              <p className="muted">أدخل بياناتك الأساسية للبدء.</p>
            </div>

            <div style={{ position: 'relative' }}>
              <Input
                label="اسم المستخدم"
                placeholder="username"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                disabled={loading}
                required
              />
              <UsernameAvailability username={form.name} checking={usernameChecking} available={usernameAvailable} />
            </div>

            <Input
              label="البريد الإلكتروني"
              type="email"
              placeholder="email@example.com"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              disabled={loading}
              required
            />

            <div style={{ position: 'relative' }}>
              <Input
                label="كلمة المرور"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => handleChange('password', e.target.value)}
                disabled={loading}
                required
              />
              <PasswordStrengthMeter password={form.password} />
            </div>

            <Input
              label="تأكيد كلمة المرور"
              type="password"
              placeholder="••••••••"
              value={form.confirmPassword}
              onChange={(e) => handleChange('confirmPassword', e.target.value)}
              disabled={loading}
              required
            />

            <CaptchaBox
              challenge={captcha}
              value={captchaAnswer}
              onChange={(e) => setCaptchaAnswer(e.target.value)}
              onRefresh={loadCaptcha}
              loading={captchaLoading}
              error={captchaError}
              disabled={loading}
            />

            <div style={{ margin: '16px 0' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={form.acceptedTerms} 
                  onChange={(e) => handleChange('acceptedTerms', e.target.checked)} 
                  disabled={loading}
                />
                <span style={{ fontSize: 13 }}>أوافق على <Link to="/terms" className="link">شروط الاستخدام</Link> و <Link to="/privacy" className="link">سياسة الخصوصية</Link></span>
              </label>
            </div>
          </div>
        ) : (
          <ProfileStep 
            form={form} 
            onChange={handleChange} 
            onImageSelect={handleImageSelect} 
            preview={profileImagePreview} 
          />
        )}

        {error && (
          <div className="alert error animate-shake">
            <span>{error}</span>
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
          {step === 2 && (
            <Button type="button" variant="secondary" onClick={() => setStep(1)} disabled={loading} style={{ flex: 1 }}>
              السابق
            </Button>
          )}
          <Button 
            type="submit" 
            loading={loading} 
            disabled={loading || (step === 1 && (!form.name || !form.email || !form.password || !captchaAnswer))}
            style={{ flex: 2 }}
          >
            {step === 1 ? 'المتابعة' : 'إكمال التسجيل'}
          </Button>
        </div>

        <div className="auth-form-footer">
          <span>لديك حساب بالفعل؟</span>
          <Link to="/login" className="link-btn">تسجيل الدخول</Link>
        </div>
      </form>
    </AuthShell>
  );
}
