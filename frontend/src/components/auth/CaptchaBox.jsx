import Button from '../ui/Button.jsx';
import Input from '../ui/Input.jsx';

export default function CaptchaBox({ challenge, value, onChange, onRefresh, loading = false, disabled = false, error = '' }) {
  return (
    <div className="captcha-box">
      <div className="captcha-row">
        <div>
          <div className="field-label">كابتشا الأمان</div>
          <div className="captcha-question">{challenge?.question || '...'}</div>
        </div>
        <Button type="button" variant="secondary" onClick={onRefresh} loading={loading} disabled={disabled || loading} className="captcha-refresh-btn">
          تحديث
        </Button>
      </div>
      <Input
        label="إجابة العملية"
        inputMode="numeric"
        placeholder="اكتب الناتج"
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        disabled={disabled || loading || !challenge?.captcha_id}
      />
      {error ? <div className="field-hint error-text">{error}</div> : null}
    </div>
  );
}
