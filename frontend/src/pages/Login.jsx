import { useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import AuthShell from '../components/auth/AuthShell.jsx';
import { loginUser } from '../api/auth.js';
import { sanitizeInputText } from '../utils/sanitize.js';
import { setStoredUser } from '../utils/auth.js';
import { getDefaultPostLoginPath } from '../utils/access.js';
import { isValidEmail, localizeAuthMessage, looksLikeEmail, parseApiDetail } from '../utils/authValidation.js';

export default function Login() {
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const submitLockRef = useRef(false);

  const handleChange = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
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

    submitLockRef.current = true;
    setLoading(true);
    setError('');

    try {
      const { data } = await loginUser({
        identifier,
        email: identifier,
        username: identifier,
        password: form.password,
      });
      setStoredUser(data);
      const fallbackPath = getDefaultPostLoginPath(data);
      navigate(location.state?.from?.pathname || fallbackPath, { replace: true });
    } catch (err) {
      const authError = parseApiDetail(err?.response?.data?.detail, 'فشل تسجيل الدخول، راجع البيانات.');
      if (authError?.message === localizeAuthMessage('Email verification required', 'لازم تفعّل البريد الإلكتروني الأول.')) {
        navigate('/verify-email', {
          state: {
            email: authError.email || identifier.trim(),
            message: 'لازم تفعّل البريد الإلكتروني الأول قبل الدخول.',
            devCode: authError.dev_verification_code || '',
          },
        });
        return;
      }
      setError(authError?.message || 'فشل تسجيل الدخول، راجع البيانات.');
    } finally {
      submitLockRef.current = false;
      setLoading(false);
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

        <Input label="البريد الإلكتروني أو اسم المستخدم" placeholder="admin@mail.com أو admin" value={form.identifier} onChange={handleChange('identifier')} autoComplete="username" />
        <Input label="كلمة المرور" type="password" placeholder="••••••••" value={form.password} onChange={handleChange('password')} hint="الحد الأدنى 6 أحرف" autoComplete="current-password" />

        {error ? <div className="alert error">{error}</div> : null}

        <Button type="submit" loading={loading} disabled={loading}>{loading ? 'جارٍ تسجيل الدخول...' : 'تسجيل الدخول'}</Button>
      </form>
    </AuthShell>
  );
}
