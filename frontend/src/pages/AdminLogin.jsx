import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import AuthShell from '../components/auth/AuthShell.jsx';
import { loginUser } from '../api/auth.js';
import { sanitizeInputText } from '../utils/sanitize.js';
import { clearStoredUser, getStoredUser, setStoredUser } from '../utils/auth.js';
import { PRIMARY_ADMIN_EMAIL, isPrimaryAdminSession } from '../utils/access.js';
import { isValidEmail, localizeAuthMessage, looksLikeEmail, parseApiDetail } from '../utils/authValidation.js';

const canAccessAdminPanel = (session) => isPrimaryAdminSession(session);

export default function AdminLogin() {
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const submitLockRef = useRef(false);

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
    if (submitLockRef.current || loading) return;

    const identifier = sanitizeInputText(form.identifier, { maxLength: 120 });
    if (!identifier) {
      setError('اكتب بريد الإدارة أو اسم المستخدم.');
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

      if (!canAccessAdminPanel(data)) {
        clearStoredUser();
        setError(`هذا الحساب لا يملك صلاحية دخول لوحة الإدارة. البريد الإداري الحالي هو ${PRIMARY_ADMIN_EMAIL}.`);
        return;
      }

      setStoredUser(data);
      const targetPath = location.state?.from?.pathname?.startsWith('/admin')
        ? location.state.from.pathname
        : '/admin/dashboard';
      navigate(targetPath, { replace: true });
    } catch (err) {
      clearStoredUser();
      const authError = parseApiDetail(err?.response?.data?.detail, 'فشل تسجيل دخول الإدارة، راجع البيانات.');
      if (authError?.message === localizeAuthMessage('Email verification required', 'لازم تفعّل البريد الإلكتروني الأول.')) {
        navigate('/verify-email', {
          state: {
            email: authError.email || identifier.trim(),
            message: 'لازم تفعّل البريد الإلكتروني للحساب الإداري الأول.',
            devCode: authError.dev_verification_code || '',
          },
        });
        return;
      }
      setError(authError?.message || 'فشل تسجيل دخول الإدارة، راجع البيانات.');
    } finally {
      submitLockRef.current = false;
      setLoading(false);
    }
  };

  return (
    <AuthShell
      badge="YAMSHAT ADMIN"
      title="دخول الإدارة"
      description="هذه الصفحة مخصصة للأدمن فقط. لو البريد الإداري مضبوط صح هتدخل مباشرة إلى لوحة التحكم."
      alternateAction={
        <>
          <span className="muted">دخول المشتركين</span>
          <Link to="/login" className="auth-inline-link">الصفحة العادية</Link>
        </>
      }
      footer={
        <>
          رابط الإدارة الأساسي <Link to="/admin/login">/admin/login</Link> والرابط الاحتياطي <Link to="/admin.html">/admin.html</Link>.
        </>
      }
    >
      <form className="auth-form auth-form-enhanced" onSubmit={handleSubmit}>
        <div className="auth-form-head">
          <h2>لوحة تحكم الإدارة</h2>
          <p className="muted">دخول لوحة الإدارة مقصور على البريد المخصص للإدارة فقط: {PRIMARY_ADMIN_EMAIL}</p>
        </div>

        <Input label="البريد الإلكتروني أو اسم المستخدم" placeholder={PRIMARY_ADMIN_EMAIL} value={form.identifier} onChange={handleChange('identifier')} autoComplete="username" />
        <Input label="كلمة المرور" type="password" placeholder="••••••••" value={form.password} onChange={handleChange('password')} hint="الحد الأدنى 6 أحرف" autoComplete="current-password" />

        {error ? <div className="alert error">{error}</div> : null}

        <Button type="submit" loading={loading} disabled={loading}>{loading ? 'جارٍ دخول الإدارة...' : 'دخول الإدارة'}</Button>
      </form>
    </AuthShell>
  );
}
