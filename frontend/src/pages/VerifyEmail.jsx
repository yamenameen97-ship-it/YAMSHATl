import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import AuthShell from '../components/auth/AuthShell.jsx';
import OtpCodeInput from '../components/auth/OtpCodeInput.jsx';
import { resendVerification, verifyEmail } from '../api/auth.js';
import { setStoredUser } from '../utils/auth.js';
import { getDefaultPostLoginPath } from '../utils/access.js';
import { isValidEmail, localizeAuthMessage, normalizeOtpDigits } from '../utils/authValidation.js';
import useSingleFlight from '../hooks/useSingleFlight.js';

/**
 * Enhanced VerifyEmail Component with improved UX
 */
export default function VerifyEmailEnhanced() {
  const location = useLocation();
  const navigate = useNavigate();
  const initialEmail = useMemo(() => location.state?.email || '', [location.state]);
  const initialCode = useMemo(() => normalizeOtpDigits(location.state?.devCode || location.state?.code || ''), [location.state]);
  
  const [form, setForm] = useState({ 
    email: initialEmail, 
    code: initialCode, 
    rememberMe: Boolean(location.state?.rememberMe ?? true) 
  });
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(location.state?.message || '');
  const [devCode, setDevCode] = useState(location.state?.devCode || '');
  const [cooldown, setCooldown] = useState(30);
  const [attempts, setAttempts] = useState(0);
  const [showFallback, setShowFallback] = useState(false);
  const [isTimeout, setIsTimeout] = useState(false);
  const [resendAttempts, setResendAttempts] = useState(0);
  
  const { run: runVerify } = useSingleFlight();
  const timerRef = useRef(null);
  const timeoutRef = useRef(null);

  // Countdown timer for resend
  useEffect(() => {
    if (cooldown <= 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setCooldown((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [cooldown]);

  // Session timeout detection (10 minutes)
  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      setIsTimeout(true);
      setError('انتهت صلاحية الجلسة. يرجى طلب كود جديد.');
    }, 10 * 60 * 1000);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleSubmit = async (incomingCode = form.code) => {
    const code = normalizeOtpDigits(incomingCode);
    
    if (!isValidEmail(form.email)) {
      setError('البريد الإلكتروني غير صحيح.');
      return;
    }
    
    if (code.length !== 6) {
      setError('يرجى إدخال الرمز المكون من 6 أرقام.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await runVerify(async () => {
        return await verifyEmail({ 
          email: form.email.trim().toLowerCase(), 
          code, 
          remember_me: form.rememberMe 
        });
      });

      const { data } = result;
      setSuccess('تم التحقق من البريد بنجاح! جاري تحويلك...');
      setStoredUser(data);
      
      // Delay navigation for UX
      setTimeout(() => {
        navigate(getDefaultPostLoginPath(data), { replace: true });
      }, 500);
    } catch (err) {
      const msg = localizeAuthMessage(err?.response?.data?.detail, 'رمز التفعيل غير صحيح أو انتهت صلاحيته.');
      setError(msg);
      setAttempts(prev => prev + 1);
      
      // Show fallback if too many attempts
      if (attempts >= 2) {
        setShowFallback(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    
    if (!isValidEmail(form.email)) {
      setError('يرجى إدخال بريد إلكتروني صحيح.');
      return;
    }

    if (resendAttempts >= 3) {
      setError('لقد تجاوزت الحد الأقصى لمحاولات إعادة الإرسال. يرجى المحاولة لاحقاً.');
      return;
    }

    setResending(true);
    setError('');
    setSuccess('');
    
    try {
      const { data } = await resendVerification({ email: form.email.trim().toLowerCase() });
      setSuccess(localizeAuthMessage(data?.message, 'تم إرسال كود جديد إلى بريدك الإلكتروني.'));
      setDevCode(data?.dev_verification_code || '');
      
      if (data?.dev_verification_code) {
        setForm((prev) => ({ ...prev, code: normalizeOtpDigits(data.dev_verification_code) }));
      }
      
      setCooldown(60);
      setIsTimeout(false);
      setAttempts(0);
      setShowFallback(false);
      setResendAttempts(prev => prev + 1);
    } catch (err) {
      setError(localizeAuthMessage(err?.response?.data?.detail, 'تعذر إعادة إرسال الكود حالياً. حاول مجدداً بعد قليل.'));
    } finally {
      setResending(false);
    }
  };

  // Auto-detect code from URL or clipboard if possible
  useEffect(() => {
    if (form.code.length === 6 && !loading) {
      handleSubmit(form.code);
    }
  }, [form.code]);

  return (
    <AuthShell
      badge="YAMSHAT"
      title="تأكيد الحساب"
      description="أدخل رمز التحقق المرسل إلى بريدك الإلكتروني لتفعيل حسابك."
      alternateAction={
        <>
          <span className="muted">هل تريد تغيير البريد؟</span>
          <Link to="/register" className="auth-inline-link">العودة للتسجيل</Link>
        </>
      }
    >
      <form className="auth-form auth-form-enhanced" onSubmit={(event) => { event.preventDefault(); handleSubmit(); }}>
        <div className="auth-form-head">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <div className="icon-circle" style={{ width: 64, height: 64, background: 'rgba(var(--accent-rgb), 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
          </div>
          <h2>تحقق من بريدك</h2>
          <p className="muted">أرسلنا كود التفعيل إلى <strong style={{ color: 'var(--text)' }}>{form.email}</strong></p>
        </div>

        {/* OTP Code Input */}
        <OtpCodeInput 
          value={form.code} 
          onChange={(next) => setForm((prev) => ({ ...prev, code: next }))} 
          onComplete={handleSubmit} 
          disabled={loading || isTimeout} 
          label="رمز التحقق" 
        />

        {/* Remember Me Checkbox */}
        <div style={{ margin: '16px 0' }}>
          <label className="remember-me-row" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={form.rememberMe} 
              onChange={(event) => setForm((prev) => ({ ...prev, rememberMe: event.target.checked }))} 
              disabled={loading}
              aria-label="تذكّرني على هذا الجهاز"
            />
            <span style={{ fontSize: 14 }}>تذكّرني على هذا الجهاز</span>
          </label>
        </div>

        {/* Success Alert */}
        {success && (
          <div className="alert success animate-fade-in" role="status">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span>{success}</span>
          </div>
        )}

        {/* Dev Code Alert */}
        {devCode && (
          <div className="alert info" style={{ background: 'rgba(255,255,255,0.05)', border: '1px dashed var(--line)' }}>
            <strong>كود المطور المحاكي:</strong> <code style={{ marginLeft: 8, fontFamily: 'monospace' }}>{devCode}</code>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="alert error animate-shake" role="alert">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Submit Button */}
        <Button 
          type="submit" 
          loading={loading} 
          disabled={loading || isTimeout || form.code.length !== 6} 
          style={{ height: 50 }}
          fullWidth
        >
          {loading ? 'جاري التحقق...' : 'تأكيد الرمز'}
        </Button>

        {/* Resend Button */}
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button 
            type="button" 
            className="link-btn" 
            disabled={resending || cooldown > 0} 
            onClick={handleResend}
            style={{ opacity: cooldown > 0 ? 0.6 : 1 }}
            aria-label={cooldown > 0 ? `إعادة الإرسال خلال ${cooldown} ثانية` : 'لم يصلك الكود؟ إعادة إرسال'}
          >
            {resending ? (
              <>
                <span style={{ display: 'inline-block', marginRight: 8 }}>جاري الإرسال...</span>
              </>
            ) : cooldown > 0 ? (
              `إعادة الإرسال خلال ${cooldown}ث`
            ) : (
              'لم يصلك الكود؟ إعادة إرسال'
            )}
          </button>
          {resendAttempts > 0 && (
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>
              محاولات الإرسال: {resendAttempts}/3
            </div>
          )}
        </div>

        {/* Fallback Section */}
        {showFallback && (
          <div className="fallback-section animate-fade-in" style={{ marginTop: 24, padding: 16, background: 'var(--bg-soft)', borderRadius: 12, border: '1px solid var(--line)' }}>
            <h4 style={{ marginBottom: 8, fontSize: 14 }}>تواجه مشكلة؟</h4>
            <ul style={{ fontSize: 13, paddingRight: 20, margin: 0, color: 'var(--muted)', lineHeight: '1.6' }}>
              <li>تأكد من مجلد الرسائل غير المرغوب فيها (Spam).</li>
              <li>تأكد من كتابة البريد الإلكتروني بشكل صحيح.</li>
              <li>انتظر بضع ثوان قبل طلب كود جديد.</li>
              <li><Link to="/support" className="auth-inline-link">تواصل مع الدعم الفني</Link></li>
            </ul>
          </div>
        )}

        {/* Timeout Warning */}
        {isTimeout && (
          <div className="alert warning" style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#f59e0b' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3.05h16.94a2 2 0 0 0 1.71-3.05L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <span>انتهت صلاحية الجلسة. يرجى طلب كود جديد.</span>
          </div>
        )}
      </form>

      <style>{`
        .animate-fade-in { 
          animation: fadeIn 0.4s ease-out; 
        }
        
        .animate-shake { 
          animation: shake 0.4s ease; 
        }
        
        @keyframes fadeIn { 
          from { 
            opacity: 0; 
            transform: translateY(5px); 
          } 
          to { 
            opacity: 1; 
            transform: translateY(0); 
          } 
        }
        
        @keyframes shake { 
          0%, 100% { 
            transform: translateX(0); 
          } 
          25% { 
            transform: translateX(-5px); 
          } 
          75% { 
            transform: translateX(5px); 
          } 
        }
        
        .icon-circle { 
          animation: pulse 2s infinite; 
        }
        
        @keyframes pulse { 
          0% { 
            box-shadow: 0 0 0 0 rgba(var(--accent-rgb), 0.4); 
          } 
          70% { 
            box-shadow: 0 0 0 15px rgba(var(--accent-rgb), 0); 
          } 
          100% { 
            box-shadow: 0 0 0 0 rgba(var(--accent-rgb), 0); 
          } 
        }

        .alert {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 8px;
          animation: slideDown 0.3s ease-out;
          font-size: 14px;
        }

        .alert.error {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #ef4444;
        }

        .alert.success {
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: #10b981;
        }

        .alert.info {
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.3);
          color: #3b82f6;
        }

        .alert.warning {
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid rgba(245, 158, 11, 0.3);
          color: #f59e0b;
        }

        .alert svg {
          flex-shrink: 0;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .link-btn {
          background: none;
          border: none;
          color: var(--accent);
          cursor: pointer;
          text-decoration: underline;
          font-size: 14px;
          transition: opacity 0.2s ease;
        }

        .link-btn:hover:not(:disabled) {
          opacity: 0.8;
        }

        .link-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Responsive design */
        @media (max-width: 640px) {
          .alert {
            font-size: 13px;
            padding: 10px 12px;
          }
        }
      `}</style>
    </AuthShell>
  );
}
