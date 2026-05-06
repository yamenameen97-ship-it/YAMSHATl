import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import AuthShell from '../components/auth/AuthShell.jsx';
import { registerUser } from '../api/auth.js';
import { sanitizeInputText } from '../utils/sanitize.js';
import { isValidEmail, localizeAuthMessage } from '../utils/authValidation.js';

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

    const username = sanitizeInputText(form.name, { maxLength: 50 });
    const email = sanitizeInputText(form.email, { maxLength: 120 }).toLowerCase();

    if (!username || !email || !form.password.trim()) {
      setError('من فضلك أكمل كل البيانات المطلوبة.');
      return;
    }
    if (/\s/.test(username)) {
      setError('اسم المستخدم لازم يكون بدون مسافات.');
      return;
    }
    if (!isValidEmail(email)) {
      setError('البريد الإلكتروني غير صحيح.');
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
      const { data } = await registerUser({ name: username, username, email, password: form.password });
      navigate('/verify-email', {
        replace: true,
        state: {
          email: data?.email || email,
          message: localizeAuthMessage(data?.message, 'تم إنشاء الحساب. راجع بريدك للتفعيل.'),
          devCode: data?.dev_verification_code || '',
        },
      });
    } catch (err) {
      setError(localizeAuthMessage(err?.response?.data?.detail, 'تعذر إنشاء الحساب حالياً.'));
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

        <Input label="اسم المستخدم" placeholder="yamshat_user" value={form.name} onChange={handleChange('name')} hint="يُحفظ بدون مسافات" autoComplete="username" />
        <Input label="البريد الإلكتروني" placeholder="user@mail.com" type="email" value={form.email} onChange={handleChange('email')} autoComplete="email" />
        <Input label="كلمة المرور" type="password" placeholder="••••••••" value={form.password} onChange={handleChange('password')} hint="6 أحرف على الأقل" autoComplete="new-password" />
        <Input label="تأكيد كلمة المرور" type="password" placeholder="••••••••" value={form.confirmPassword} onChange={handleChange('confirmPassword')} autoComplete="new-password" />

        {error ? <div className="alert error">{error}</div> : null}

        <Button type="submit" disabled={loading}>{loading ? 'جارٍ إنشاء الحساب...' : 'إنشاء الحساب'}</Button>
      </form>
    </AuthShell>
  );
}
