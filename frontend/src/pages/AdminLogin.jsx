import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import AuthShell from '../components/auth/AuthShell.jsx';
import { loginUser } from '../api/auth.js';
import { clearStoredUser, getStoredUser, setStoredUser } from '../utils/auth.js';

const canAccessAdminPanel = (session) => {
  if (!session || typeof session !== 'object') return false;
  if (session.role === 'admin') return true;
  return Array.isArray(session.permissions) && session.permissions.includes('dashboard.view');
};

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
      setError(err?.response?.data?.detail || 'فشل تسجيل دخول الإدارة، راجع البيانات.');
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
          <p className="muted">ادخل بالبريد الإلكتروني أو اسم المستخدم المصرح له بدخول لوحة الإدارة.</p>
        </div>

        <Input label="البريد الإلكتروني أو اسم المستخدم" placeholder="admin@mail.com أو admin" value={form.identifier} onChange={handleChange('identifier')} />
        <Input label="كلمة المرور" type="password" placeholder="••••••••" value={form.password} onChange={handleChange('password')} hint="الحد الأدنى 6 أحرف" />

        {error ? <div className="alert error">{error}</div> : null}

        <Button type="submit" disabled={loading}>{loading ? 'جارٍ دخول الإدارة...' : 'دخول الإدارة'}</Button>
      </form>
    </AuthShell>
  );
}
