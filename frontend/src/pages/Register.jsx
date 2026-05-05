import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import AuthShell from '../components/auth/AuthShell.jsx';
import { registerUser } from '../api/auth.js';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setError('من فضلك أكمل كل البيانات المطلوبة.');
      return;
    }
    if (form.password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('تأكيد كلمة المرور غير مطابق.');
      return;
    }

    try {
      setLoading(true);
      const { data } = await registerUser({ name: form.name.trim(), email: form.email.trim(), password: form.password });
      navigate('/verify-email', {
        replace: true,
        state: {
          email: data?.email || form.email.trim(),
          message: data?.message || 'تم إنشاء الحساب. راجع بريدك للتفعيل.',
          devCode: data?.dev_verification_code || '',
        },
      });
    } catch (err) {
      setError(err?.response?.data?.detail || 'تعذر إنشاء الحساب حالياً.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      badge="YAMSHAT"
      title="إنشاء حساب"
      description="افتح حسابك الجديد وابدأ بنفس توزيع الصفحات الداكنة والبطاقات البنفسجية الحديثة."
      alternateAction={
        <>
          <span className="muted">عندك حساب بالفعل؟</span>
          <Link to="/login" className="auth-inline-link">تسجيل الدخول</Link>
        </>
      }
      footer={
        <>
          الحسابات الجديدة تحتاج تفعيل بالبريد قبل الدخول. <Link to="/login">لدي حساب بالفعل</Link>
        </>
      }
    >
      <form className="auth-form auth-form-enhanced" onSubmit={handleSubmit}>
        <div className="auth-form-head">
          <h2>إنشاء حساب جديد</h2>
          <p className="muted">أكمل بياناتك وفعّل البريد وبعدها ادخل لتجربة يمشات الاجتماعية على الجوال.</p>
        </div>

        <Input label="اسم المستخدم" placeholder="yamshat_user" value={form.name} onChange={handleChange('name')} hint="يُحفظ بدون مسافات" />
        <Input label="البريد الإلكتروني" placeholder="user@mail.com" value={form.email} onChange={handleChange('email')} />
        <Input label="كلمة المرور" type="password" placeholder="••••••••" value={form.password} onChange={handleChange('password')} hint="6 أحرف على الأقل" />
        <Input label="تأكيد كلمة المرور" type="password" placeholder="••••••••" value={form.confirmPassword} onChange={handleChange('confirmPassword')} />

        {error ? <div className="alert error">{error}</div> : null}

        <Button type="submit" disabled={loading}>{loading ? 'جارٍ إنشاء الحساب...' : 'إنشاء الحساب'}</Button>
      </form>
    </AuthShell>
  );
}
