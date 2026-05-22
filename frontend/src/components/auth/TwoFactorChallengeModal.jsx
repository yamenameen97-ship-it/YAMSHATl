import { useEffect, useState } from 'react';
import Input from '../ui/Input.jsx';
import Button from '../ui/Button.jsx';

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0, 0, 0, 0.8)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 2000,
  backdropFilter: 'blur(8px)',
};

const cardStyle = {
  background: 'var(--bg)',
  borderRadius: 16,
  padding: 32,
  maxWidth: 420,
  width: '92%',
  border: '1px solid var(--line)',
  boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
};

export default function TwoFactorChallengeModal({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
  error = '',
  email = '',
  devCode = '',
  delivery = null,
}) {
  const [code, setCode] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setCode('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    const normalized = String(code || '').replace(/\D/g, '').slice(0, 6);
    if (normalized.length === 6) {
      onSubmit(normalized);
    }
  };

  return (
    <div style={overlayStyle}>
      <div className="glass-card" style={cardStyle}>
        <h3 style={{ marginBottom: 12, textAlign: 'center' }}>تأكيد تسجيل الدخول</h3>
        <p className="muted" style={{ textAlign: 'center', marginBottom: 18 }}>
          تم إرسال رمز تحقق من 6 أرقام لإكمال تسجيل الدخول{email ? ` إلى ${email}` : ''}.
        </p>

        <Input
          label="رمز التحقق"
          type="text"
          placeholder="000000"
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
          maxLength="6"
          autoFocus
        />

        {delivery ? (
          <div className="muted" style={{ fontSize: 12, marginTop: 10, lineHeight: 1.7 }}>
            <div>طريقة الإرسال: {delivery.provider || 'email'}</div>
            <div>صلاحية الرمز: {delivery.code_expires_in_minutes || 10} دقائق</div>
          </div>
        ) : null}

        {devCode ? (
          <div className="alert success" style={{ marginTop: 12 }}>
            رمز التطوير: <strong>{devCode}</strong>
          </div>
        ) : null}

        {error ? (
          <div className="alert error" style={{ marginTop: 12 }}>
            {error}
          </div>
        ) : null}

        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          <Button onClick={handleSubmit} loading={loading} disabled={loading || code.length !== 6} style={{ flex: 2 }}>
            تأكيد الرمز
          </Button>
          <Button variant="secondary" onClick={onClose} disabled={loading} style={{ flex: 1 }}>
            إلغاء
          </Button>
        </div>
      </div>
    </div>
  );
}
