import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import AuthShell from '../components/auth/AuthShell.jsx';
import OtpCodeInput from '../components/auth/OtpCodeInput.jsx';
import { resendVerification, verifyEmail } from '../api/auth.js';
import { setStoredUser } from '../utils/auth.js';
import { getDefaultPostLoginPath } from '../utils/access.js';
import { isValidEmail, localizeAuthMessage, normalizeOtpDigits } from '../utils/authValidation.js';

export default function VerifyEmail() {
  const location = useLocation();
  const navigate = useNavigate();
  const initialEmail = useMemo(() => location.state?.email || '', [location.state]);
  const [form, setForm] = useState({ email: initialEmail, code: normalizeOtpDigits(location.state?.code || '') });
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(location.state?.message || '');
  const [devCode, setDevCode] = useState(location.state?.devCode || '');

  const handleSubmit = async (incomingCode = form.code) => {
    const code = normalizeOtpDigits(incomingCode);
    if (!isValidEmail(form.email)) {
      setError('البريد الإلكتروني غير صحيح.');
      return;
    }
    if (code.length !== 6) {
      setError('اكتب رمز التفعيل كامل من 6 أرقام.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data } = await verifyEmail({ email: form.email.trim().toLowerCase(), code });
      setStoredUser(data);
      navigate(getDefaultPostLoginPath(data), { replace: true });
    } catch (err) {
      setError(localizeAuthMessage(err?.response?.data?.detail, 'تعذر تأكيد البريد حالياً.'));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!isValidEmail(form.email)) {
      setError('اكتب بريد إلكتروني صحيح أولاً.');
      return;
    }
    setResending(true);
    setError('');
    try {
      const { data } = await resendVerification({ email: form.email.trim().toLowerCase() });
      setSuccess(localizeAuthMessage(data?.message, 'تم إرسال كود جديد.'));
      setDevCode(data?.dev_verification_code || '');
    } catch (err) {
      setError(localizeAuthMessage(err?.response?.data?.detail, 'تعذر إعادة إرسال الكود.'));
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
      <form className="auth-form auth-form-enhanced" onSubmit={(event) => { event.preventDefault(); handleSubmit(); }}>
        <div className="auth-form-head">
          <h2>تفعيل الحساب</h2>
          <p className="muted">الرمز بيتقسم تلقائياً على الخانات، ولو كان صحيح هتدخل مباشرة.</p>
        </div>

        <Input label="البريد الإلكتروني" type="email" placeholder="user@mail.com" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} autoComplete="email" />
        <OtpCodeInput value={form.code} onChange={(next) => setForm((prev) => ({ ...prev, code: next }))} onComplete={handleSubmit} disabled={loading} label="كود التفعيل" />

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
