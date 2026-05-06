import { useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Input from '../ui/Input.jsx';
import Button from '../ui/Button.jsx';
import AuthShell from './AuthShell.jsx';
import OtpCodeInput from './OtpCodeInput.jsx';
import { forgotPassword, resetPassword, verifyResetCode } from '../../api/auth.js';
import { isValidEmail, localizeAuthMessage, normalizeOtpDigits } from '../../utils/authValidation.js';

export default function PasswordRecoveryFlow({ initialStep = 'request' }) {
  const location = useLocation();
  const navigate = useNavigate();
  const initialEmail = useMemo(() => location.state?.email || '', [location.state]);
  const initialCode = useMemo(() => normalizeOtpDigits(location.state?.code || ''), [location.state]);
  const [step, setStep] = useState(initialStep === 'reset' ? 'verify' : initialStep);
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState(initialCode);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(location.state?.message || '');
  const [devCode, setDevCode] = useState(location.state?.devCode || '');
  const autoVerifiedCodeRef = useRef('');

  const validateEmailStep = () => {
    if (!email.trim()) {
      setError('اكتب البريد الإلكتروني المسجل بالحساب.');
      return false;
    }
    if (!isValidEmail(email)) {
      setError('البريد الإلكتروني غير صحيح.');
      return false;
    }
    return true;
  };

  const sendCode = async (event) => {
    event?.preventDefault?.();
    setError('');
    setSuccess('');
    if (!validateEmailStep()) return;
    setLoading(true);
    try {
      const { data } = await forgotPassword({ email: email.trim().toLowerCase() });
      setStep('verify');
      setSuccess(localizeAuthMessage(data?.message, 'تم إرسال رمز تحقق على البريد الإلكتروني.'));
      setDevCode(data?.dev_reset_code || '');
      setCode('');
      autoVerifiedCodeRef.current = '';
    } catch (err) {
      setError(localizeAuthMessage(err?.response?.data?.detail, 'تعذر إرسال رمز الاسترجاع.'));
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async (incomingCode = code) => {
    const normalizedCode = normalizeOtpDigits(incomingCode);
    if (verifying || normalizedCode.length !== 6) return;
    if (!validateEmailStep()) return;
    setVerifying(true);
    setError('');
    setSuccess('');
    try {
      const { data } = await verifyResetCode({ email: email.trim().toLowerCase(), code: normalizedCode });
      setCode(normalizedCode);
      setStep('reset');
      setSuccess(localizeAuthMessage(data?.message, 'تم التحقق من الرمز. اكتب كلمة المرور الجديدة.'));
      autoVerifiedCodeRef.current = normalizedCode;
    } catch (err) {
      autoVerifiedCodeRef.current = '';
      setError(localizeAuthMessage(err?.response?.data?.detail, 'رمز التحقق غير صحيح.'));
    } finally {
      setVerifying(false);
    }
  };

  const handleOtpComplete = async (normalizedCode) => {
    setCode(normalizedCode);
    if (autoVerifiedCodeRef.current === normalizedCode) return;
    await verifyCode(normalizedCode);
  };

  const savePassword = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (!validateEmailStep()) return;
    if (normalizeOtpDigits(code).length !== 6) {
      setError('اكتب رمز التحقق الكامل أولاً.');
      setStep('verify');
      return;
    }
    if (password.length < 6) {
      setError('كلمة المرور لازم تكون 6 أحرف على الأقل.');
      return;
    }
    if (password !== confirmPassword) {
      setError('تأكيد كلمة المرور غير مطابق.');
      return;
    }

    setSaving(true);
    try {
      const { data } = await resetPassword({
        email: email.trim().toLowerCase(),
        code: normalizeOtpDigits(code),
        new_password: password,
      });
      setSuccess(localizeAuthMessage(data?.message, 'تم تحديث كلمة المرور بنجاح.'));
      setTimeout(() => navigate('/login', { replace: true }), 1200);
    } catch (err) {
      setError(localizeAuthMessage(err?.response?.data?.detail, 'تعذر تحديث كلمة المرور.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthShell
      badge="YAMSHAT"
      title="استرجاع كلمة المرور"
      description="اطلب رمز تحقق، وبعد ما يتأكد هيفتح لك فورم كلمة المرور الجديدة مباشرة."
      alternateAction={
        <>
          <span className="muted">رجوع</span>
          <Link to="/login" className="auth-inline-link">تسجيل الدخول</Link>
        </>
      }
      footer={
        <>
          دخول الإدارة يتم من <Link to="/admin/login">/admin/login</Link> أو <Link to="/admin.html">/admin.html</Link>.
        </>
      }
    >
      <form className="auth-form auth-form-enhanced" onSubmit={step === 'reset' ? savePassword : sendCode}>
        <div className="auth-form-head">
          <h2>تغيير كلمة المرور</h2>
          <p className="muted">
            {step === 'request' && 'ابدأ بإرسال رمز التحقق على البريد الإلكتروني.'}
            {step === 'verify' && 'تم فتح مربع الرمز. أول ما الرمز يبقى صحيح هنفتح فورم كلمة المرور الجديدة.'}
            {step === 'reset' && 'الرمز صحيح. اكتب كلمة المرور الجديدة ثم احفظ.'}
          </p>
        </div>

        <Input
          label="البريد الإلكتروني"
          placeholder="user@mail.com"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        {step === 'request' ? (
          <Button type="submit" disabled={loading}>{loading ? 'جارٍ إرسال الرمز...' : 'إرسال رمز التحقق'}</Button>
        ) : null}

        {step !== 'request' ? (
          <>
            <OtpCodeInput
              value={code}
              onChange={setCode}
              onComplete={handleOtpComplete}
              disabled={verifying || saving}
              label="رمز التحقق"
              hint="لو نسخت الرمز من البريد أو الحافظة هيتوزع تلقائياً على المربعات."
            />
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Button type="button" disabled={verifying || code.length !== 6} onClick={() => verifyCode(code)}>
                {verifying ? 'جارٍ التحقق...' : step === 'reset' ? 'تم التحقق' : 'تأكيد الرمز'}
              </Button>
              <Button type="button" variant="secondary" disabled={loading} onClick={sendCode}>
                إعادة إرسال الرمز
              </Button>
            </div>
          </>
        ) : null}

        {step === 'reset' ? (
          <>
            <Input
              label="كلمة المرور الجديدة"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              hint="6 أحرف على الأقل"
            />
            <Input
              label="تأكيد كلمة المرور"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
            <Button type="submit" disabled={saving}>{saving ? 'جارٍ حفظ كلمة المرور...' : 'حفظ كلمة المرور الجديدة'}</Button>
          </>
        ) : null}

        {success ? <div className="alert success">{success}</div> : null}
        {devCode ? <div className="alert">كود التطوير: {devCode}</div> : null}
        {error ? <div className="alert error">{error}</div> : null}
      </form>
    </AuthShell>
  );
}
