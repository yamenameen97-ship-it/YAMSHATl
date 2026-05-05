import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import AuthShell from '../components/auth/AuthShell.jsx';
import { loginUser } from '../api/auth.js';
import { setStoredUser } from '../utils/auth.js';
import { getDefaultPostLoginPath } from '../utils/access.js';

function extractAuthError(err) {
  const detail = err?.response?.data?.detail;
  if (typeof detail === 'string') return { message: detail };
  if (detail && typeof detail === 'object') return detail;
  return { message: 'فشل تسجيل الدخول، راجع البيانات.' };
}

export default function Login() {
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const handleChange = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data } = await loginUser({
        identifier: form.identifier.trim(),
        email: form.identifier.trim(),
        username: form.identifier.trim(),
        password: form.password,
      });
      setStoredUser(data);
      const fallbackPath = getDefaultPostLoginPath(data);
      navigate(location.state?.from?.pathname || fallbackPath, { replace: true });
    } catch (err) {
      const authError = extractAuthError(err);
      if (authError?.message === 'Email verification required') {
        navigate('/verify-email', {
          state: {
            email: authError.email || form.identifier.trim(),
            message: 'لازم تفعّل البريد الإلكتروني الأول قبل الدخول.',
            devCode: authError.dev_verification_code || '',
          },
        });
        return;
      }
      setError(authError?.message || 'فشل تسجيل الدخول، راجع البيانات.');
    } finally {
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
          دخول الإدارة يتم من الرابط المخصص للإدارة فقط، أما هذه الصفحة فهي للمشتركين. <Link to="/forgot-password">نسيت كلمة المرور</Link>
        </>
      }
    >
      <form className="auth-form auth-form-enhanced" onSubmit={handleSubmit}>
        <div className="auth-form-head">
          <h2>مرحباً بعودتك</h2>
          <p className="muted">استخدم البريد الإلكتروني أو اسم المستخدم للدخول إلى مجتمعك ومحتواك.</p>
        </div>

        <Input label="البريد الإلكتروني أو اسم المستخدم" placeholder="admin@mail.com أو admin" value={form.identifier} onChange={handleChange('identifier')} />
        <Input label="كلمة المرور" type="password" placeholder="••••••••" value={form.password} onChange={handleChange('password')} hint="الحد الأدنى 6 أحرف" />

        {error ? <div className="alert error">{error}</div> : null}

        <Button type="submit" disabled={loading}>{loading ? 'جارٍ تسجيل الدخول...' : 'تسجيل الدخول'}</Button>
      </form>
    </AuthShell>
  );
}
