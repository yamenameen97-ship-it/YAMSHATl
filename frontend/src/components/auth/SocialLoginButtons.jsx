import { useMemo, useState } from 'react';
import Button from '../ui/Button.jsx';
import { loginWithApple, loginWithFacebook, loginWithGoogle } from '../../api/auth.js';

const PROVIDERS = [
  { key: 'google', label: 'المتابعة باستخدام Google', icon: 'G', color: '#4285F4', action: loginWithGoogle },
  { key: 'facebook', label: 'المتابعة باستخدام Facebook', icon: 'f', color: '#1877F2', action: loginWithFacebook },
  { key: 'apple', label: 'المتابعة باستخدام Apple', icon: '', color: '#111827', action: loginWithApple },
];

export default function SocialLoginButtons({ onSuccess, disabled = false }) {
  const [busyProvider, setBusyProvider] = useState('');
  const [error, setError] = useState('');
  const providers = useMemo(() => PROVIDERS, []);

  const handleProviderLogin = async (provider) => {
    try {
      setBusyProvider(provider.key);
      setError('');
      const payload = await provider.action();
      if (payload?.pendingRedirect) return;
      if (payload && onSuccess) onSuccess(payload);
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || `تعذر إكمال تسجيل الدخول عبر ${provider.label}.`);
    } finally {
      setBusyProvider('');
    }
  };

  return (
    <div className="social-login-block">
      <div className="social-login-divider" aria-hidden="true">
        <span />
        <strong>أو</strong>
        <span />
      </div>

      <div className="social-login-grid">
        {providers.map((provider) => (
          <Button
            key={provider.key}
            type="button"
            variant="secondary"
            onClick={() => handleProviderLogin(provider)}
            disabled={disabled || Boolean(busyProvider && busyProvider !== provider.key)}
            loading={busyProvider === provider.key}
            className="social-login-btn"
            style={{ justifyContent: 'flex-start', gap: 12, minHeight: 48 }}
          >
            <span
              aria-hidden="true"
              style={{
                width: 24,
                height: 24,
                borderRadius: 999,
                background: provider.color,
                color: '#fff',
                display: 'inline-grid',
                placeItems: 'center',
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {provider.icon}
            </span>
            {provider.label}
          </Button>
        ))}
      </div>

      {error ? <div className="alert error" style={{ marginTop: 12 }}>{error}</div> : null}
    </div>
  );
}
