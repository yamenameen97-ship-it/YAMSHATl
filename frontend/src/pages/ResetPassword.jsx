import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import AuthShell from '../components/auth/AuthShell.jsx';
import { resetPassword } from '../api/auth.js';

export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const initialEmail = useMemo(() => location.state?.email || '', [location.state]);
  const [form, setForm] = useState({ email: initialEmail, code: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(location.state?.message || '');
  const [devCode] = useState(location.state?.devCode || '');

  const handleChange = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (form.password.length < 6) {
      setError('كلمة المرور لازم تكون 6 أحرف على الأقل.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('تأكيد كلمة المرور غير مطابق.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await resetPassword({
        email: form.email.trim(),
        code: form.code.trim(),
        new_password: form.password,
      });
      setSuccess(data?.message || 'تم تحديث كلمة المرور.');
      setTimeout(() => navigate('/login', { replace: true }), 1200);
    } catch (err) {
      setError(err?.response?.data?.detail || 'تعذر تغيير كلمة المرور.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      badge="YAMSHAT"
      title="إعادة تعيين كلمة المرور"
      description="ادخل البريد والكود وكلمة المرور الجديدة."
      alternateAction={
        <>
          <span className="muted">لسه محتاج كود؟</span>
          <Link to="/forgot-password" className="auth-inline-link">إرسال كود</Link>
        </>
      }
      footer={
        <>
          بعد التغيير هتقدر تدخل من <Link to="/login">صفحة تسجيل الدخول</Link>.
        </>
      }
    >
      <form className="auth-form auth-form-enhanced" onSubmit={handleSubmit}>
        <div className="auth-form-head">
          <h2>تعيين كلمة مرور جديدة</h2>
          <p className="muted">الكود صالح لفترة قصيرة فقط.</p>
        </div>

        <Input label="البريد الإلكتروني" placeholder="user@mail.com" value={form.email} onChange={handleChange('email')} />
        <Input label="كود الاسترجاع" placeholder="123456" value={form.code} onChange={handleChange('code')} />
        <Input label="كلمة المرور الجديدة" type="password" placeholder="••••••••" value={form.password} onChange={handleChange('password')} />
        <Input label="تأكيد كلمة المرور" type="password" placeholder="••••••••" value={form.confirmPassword} onChange={handleChange('confirmPassword')} />

        {success ? <div className="alert success">{success}</div> : null}
        {devCode ? <div className="alert">كود التطوير: {devCode}</div> : null}
        {error ? <div className="alert error">{error}</div> : null}

        <Button type="submit" disabled={loading}>{loading ? 'جارٍ الحفظ...' : 'حفظ كلمة المرور'}</Button>
      </form>
    </AuthShell>
  );
}
