import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import AuthShell from '../components/auth/AuthShell.jsx';
import { forgotPassword } from '../api/auth.js';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await forgotPassword({ email: email.trim() });
      navigate('/reset-password', {
        replace: true,
        state: {
          email: email.trim(),
          message: data?.message || 'لو الحساب موجود هيوصلك كود استرجاع.',
          devCode: data?.dev_reset_code || '',
        },
      });
    } catch (err) {
      setError(err?.response?.data?.detail || 'تعذر إرسال كود الاسترجاع.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      badge="YAMSHAT"
      title="استرجاع كلمة المرور"
      description="ابعت كود على البريد وبعدها غير كلمة المرور بأمان."
      alternateAction={
        <>
          <span className="muted">عندك الكود بالفعل؟</span>
          <Link to="/reset-password" className="auth-inline-link">إعادة التعيين</Link>
        </>
      }
      footer={
        <>
          لو تذكرت كلمة المرور، ارجع إلى <Link to="/login">تسجيل الدخول</Link>.
        </>
      }
    >
      <form className="auth-form auth-form-enhanced" onSubmit={handleSubmit}>
        <div className="auth-form-head">
          <h2>إرسال كود الاسترجاع</h2>
          <p className="muted">اكتب نفس البريد المسجل بيه في التطبيق.</p>
        </div>

        <Input label="البريد الإلكتروني" placeholder="user@mail.com" value={email} onChange={(event) => setEmail(event.target.value)} />
        {error ? <div className="alert error">{error}</div> : null}
        <Button type="submit" disabled={loading}>{loading ? 'جارٍ الإرسال...' : 'إرسال الكود'}</Button>
      </form>
    </AuthShell>
  );
}
