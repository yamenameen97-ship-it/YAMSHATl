import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import AuthShell from '../components/auth/AuthShell.jsx';
import { loginUser } from '../api/auth.js';
import { setStoredUser } from '../utils/auth.js';

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
      navigate(location.state?.from?.pathname || '/', { replace: true });
    } catch (err) {
      setError(err?.response?.data?.detail || 'فشل تسجيل الدخول، راجع البيانات.');
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
          أول حساب يتم إنشاؤه يأخذ صلاحية Admin تلقائياً. <Link to="/register">إنشاء حساب جديد</Link>
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
