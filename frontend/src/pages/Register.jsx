import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import AuthShell from '../components/auth/AuthShell.jsx';
import { registerUser } from '../api/auth.js';
import { setStoredUser } from '../utils/auth.js';

export default function Register() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
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
      const { data } = await registerUser({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      setStoredUser(data);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || 'تعذر إنشاء الحساب حالياً.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      badge="YAMSHAT REGISTER"
      title="أنشئ حسابك بنفس هوية المنصة"
      description="صفحة تسجيل جديدة بنفس الستايل الداكن والزجاجي الموجود في التطبيق، ومتصلة مباشرة بالباك إند لإنشاء الحساب وتسجيل الدخول تلقائياً بعد النجاح."
      alternateAction={
        <>
          <span className="muted">عندك حساب بالفعل؟</span>
          <Link to="/login" className="auth-inline-link">تسجيل الدخول</Link>
        </>
      }
      footer={
        <>
          بعد إنشاء الحساب سيتم حفظ التوكن والانتقال مباشرة للصفحة الرئيسية.{' '}
          <Link to="/login">عندي حساب بالفعل</Link>
        </>
      }
    >
      <form className="auth-form auth-form-enhanced" onSubmit={handleSubmit}>
        <div className="auth-form-head">
          <h2>إنشاء حساب جديد</h2>
          <p className="muted">اكتب اسم مستخدم فريد وبريد إلكتروني أو رقم جوال صالح.</p>
        </div>

        <Input
          label="اسم المستخدم"
          placeholder="yamshat_user"
          value={form.name}
          onChange={handleChange('name')}
          hint="حروف وأرقام وشرطة سفلية فقط"
        />
        <Input
          label="البريد الإلكتروني أو رقم الجوال"
          placeholder="example@mail.com أو 9665xxxxxxx"
          value={form.email}
          onChange={handleChange('email')}
        />
        <Input
          label="كلمة المرور"
          type="password"
          placeholder="••••••••"
          value={form.password}
          onChange={handleChange('password')}
          hint="6 أحرف على الأقل"
        />
        <Input
          label="تأكيد كلمة المرور"
          type="password"
          placeholder="••••••••"
          value={form.confirmPassword}
          onChange={handleChange('confirmPassword')}
        />

        {error ? <div className="alert error">{error}</div> : null}

        <Button type="submit" disabled={loading}>
          {loading ? 'جارٍ إنشاء الحساب...' : 'إنشاء الحساب'}
        </Button>
      </form>
    </AuthShell>
  );
}
