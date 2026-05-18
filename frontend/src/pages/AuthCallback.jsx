import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthShell from '../components/auth/AuthShell.jsx';
import { setStoredUser } from '../utils/auth.js';
import { getDefaultPostLoginPath } from '../utils/access.js';

function decodePayload(encoded) {
  const normalized = String(encoded || '').trim().replace(/-/g, '+').replace(/_/g, '/');
  if (!normalized) return null;
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  const raw = window.atob(padded);
  return JSON.parse(raw);
}

export default function AuthCallback() {
  const location = useLocation();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);

  useEffect(() => {
    const payloadParam = params.get('payload');
    const errorParam = params.get('error');

    if (errorParam) {
      setError(decodeURIComponent(errorParam));
      return;
    }

    if (!payloadParam) {
      setError('لم تصل بيانات جلسة المصادقة الاجتماعية.');
      return;
    }

    try {
      const session = decodePayload(payloadParam);
      if (!session?.access_token && !session?.token) {
        throw new Error('الاستجابة لا تحتوي على جلسة صالحة.');
      }
      setStoredUser(session);
      const nextPath = getDefaultPostLoginPath(session);
      navigate(nextPath || '/', { replace: true });
    } catch (err) {
      setError(err?.message || 'فشل إكمال تسجيل الدخول الاجتماعي.');
    }
  }, [navigate, params]);

  return (
    <AuthShell
      badge="YAMSHAT"
      title="إكمال المصادقة"
      description="جاري ربط جلسة الدخول الاجتماعي بالتطبيق."
    >
      <div className="auth-form auth-form-enhanced" style={{ gap: 16 }}>
        {!error ? (
          <div className="glass-card" style={{ padding: 18 }}>
            <h3 style={{ marginBottom: 8 }}>جاري تجهيز الجلسة</h3>
            <p className="muted" style={{ margin: 0 }}>لحظات وسيتم تحويلك تلقائياً إلى الواجهة الرئيسية.</p>
          </div>
        ) : (
          <div className="alert error">
            <strong>تعذر إكمال المصادقة</strong>
            <div style={{ marginTop: 6 }}>{error}</div>
          </div>
        )}

        <div className="auth-form-footer" style={{ justifyContent: 'space-between' }}>
          <Link to="/login" className="link-btn">العودة إلى تسجيل الدخول</Link>
          <Link to="/register" className="link-btn secondary">إنشاء حساب</Link>
        </div>
      </div>
    </AuthShell>
  );
}
