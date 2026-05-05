import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import AuthShell from '../components/auth/AuthShell.jsx';
import { loginUser } from '../api/auth.js';
import { clearStoredUser, getStoredUser, setStoredUser } from '../utils/auth.js';
import { PRIMARY_ADMIN_EMAIL, isPrimaryAdminSession } from '../utils/access.js';

const canAccessAdminPanel = (session) => isPrimaryAdminSession(session);

function extractAuthError(err) {
  const detail = err?.response?.data?.detail;
  if (typeof detail === 'string') return { message: detail };
  if (detail && typeof detail === 'object') return detail;
  return { message: 'فشل تسجيل دخول الإدارة، راجع البيانات.' };
}

export default function AdminLogin() {
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const user = getStoredUser();
    if (canAccessAdminPanel(user)) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [navigate]);

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

      if (!canAccessAdminPanel(data)) {
        clearStoredUser();
        setError('هذا الحساب لا يملك صلاحية دخول لوحة الإدارة. استخدم صفحة المشتركين العادية.');
        return;
      }

      setStoredUser(data);
      const targetPath = location.state?.from?.pathname?.startsWith('/admin')
        ? location.state.from.pathname
        : '/admin/dashboard';
      navigate(targetPath, { replace: true });
    } catch (err) {
      clearStoredUser();
      const authError = extractAuthError(err);
      if (authError?.message === 'Email verification required') {
        navigate('/verify-email', {
          state: {
            email: authError.email || form.identifier.trim(),
            message: 'لازم تفعّل البريد الإلكتروني للحساب الإداري الأول.',
            devCode: authError.dev_verification_code || '',
          },
        });
        return;
      }
      setError(authError?.message || 'فشل تسجيل دخول الإدارة، راجع البيانات.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      badge="YAMSHAT ADMIN"
      title="دخول الإدارة"
      description="هذه الصفحة مخصصة للأدمن والمشرفين فقط. دخول المشتركين العاديين يتم من الصفحة الرئيسية للتطبيق."
      alternateAction={
        <>
          <span className="muted">دخول المشتركين</span>
          <Link to="/login" className="auth-inline-link">الصفحة العادية</Link>
        </>
      }
      footer={
        <>
          لو عايز دخول المستخدمين العاديين استخدم <Link to="/login">صفحة المشتركين</Link>.
        </>
      }
    >
      <form className="auth-form auth-form-enhanced" onSubmit={handleSubmit}>
        <div className="auth-form-head">
          <h2>لوحة تحكم الإدارة</h2>
          <p className="muted">دخول لوحة الإدارة مقصور على البريد المخصص للإدارة فقط: {PRIMARY_ADMIN_EMAIL}</p>
        </div>

        <Input label="البريد الإلكتروني أو اسم المستخدم" placeholder={PRIMARY_ADMIN_EMAIL} value={form.identifier} onChange={handleChange('identifier')} />
        <Input label="كلمة المرور" type="password" placeholder="••••••••" value={form.password} onChange={handleChange('password')} hint="الحد الأدنى 6 أحرف" />

        {error ? <div className="alert error">{error}</div> : null}

        <Button type="submit" disabled={loading}>{loading ? 'جارٍ دخول الإدارة...' : 'دخول الإدارة'}</Button>
      </form>
    </AuthShell>
  );
}
