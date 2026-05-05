import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import AuthShell from '../components/auth/AuthShell.jsx';
import { resendVerification, verifyEmail } from '../api/auth.js';
import { setStoredUser } from '../utils/auth.js';
import { getDefaultPostLoginPath } from '../utils/access.js';

export default function VerifyEmail() {
  const location = useLocation();
  const navigate = useNavigate();
  const initialEmail = useMemo(() => location.state?.email || '', [location.state]);
  const [form, setForm] = useState({ email: initialEmail, code: '' });
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(location.state?.message || '');
  const [devCode, setDevCode] = useState(location.state?.devCode || '');

  const handleChange = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data } = await verifyEmail({ email: form.email.trim(), code: form.code.trim() });
      setStoredUser(data);
      navigate(getDefaultPostLoginPath(data), { replace: true });
    } catch (err) {
      setError(err?.response?.data?.detail || 'تعذر تأكيد البريد حالياً.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError('');
    try {
      const { data } = await resendVerification({ email: form.email.trim() });
      setSuccess(data?.message || 'تم إرسال كود جديد.');
      setDevCode(data?.dev_verification_code || '');
    } catch (err) {
      setError(err?.response?.data?.detail || 'تعذر إعادة إرسال الكود.');
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthShell
      badge="YAMSHAT"
      title="تأكيد البريد الإلكتروني"
      description="فعّل حسابك بكود التحقق اللي اتبعت على البريد علشان تقدر تدخل وتستخدم المشروع بشكل كامل."
      alternateAction={
        <>
          <span className="muted">رجوع</span>
          <Link to="/login" className="auth-inline-link">تسجيل الدخول</Link>
        </>
      }
      footer={
        <>
          لو ماوصلكش الكود، اطلب إعادة الإرسال أو ارجع <Link to="/register">سجل من جديد</Link>.
        </>
      }
    >
      <form className="auth-form auth-form-enhanced" onSubmit={handleSubmit}>
        <div className="auth-form-head">
          <h2>تفعيل الحساب</h2>
          <p className="muted">ادخل البريد والكود المكوّن من 6 أرقام.</p>
        </div>

        <Input label="البريد الإلكتروني" placeholder="user@mail.com" value={form.email} onChange={handleChange('email')} />
        <Input label="كود التفعيل" placeholder="123456" value={form.code} onChange={handleChange('code')} />

        {success ? <div className="alert success">{success}</div> : null}
        {devCode ? <div className="alert">كود التطوير: {devCode}</div> : null}
        {error ? <div className="alert error">{error}</div> : null}

        <Button type="submit" disabled={loading}>{loading ? 'جارٍ التأكيد...' : 'تأكيد البريد'}</Button>
        <Button type="button" variant="secondary" disabled={resending || !form.email.trim()} onClick={handleResend}>
          {resending ? 'جارٍ الإرسال...' : 'إعادة إرسال الكود'}
        </Button>
      </form>
    </AuthShell>
  );
}
