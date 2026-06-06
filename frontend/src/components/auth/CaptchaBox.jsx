import Button from '../ui/Button.jsx';
import Input from '../ui/Input.jsx';

export default function CaptchaBox({ challenge, captcha, value, onChange, onRefresh, loading = false, disabled = false, error = '', refreshCooldown = 0 }) {
  const currentChallenge = challenge || captcha || null;
  const refreshLabel = refreshCooldown > 0 ? `تحديث (${refreshCooldown}ث)` : 'تحديث';

  return (
    <div className="captcha-box">
      <div className="captcha-row">
        <div>
          <div className="field-label">كابتشا الأمان</div>
          <div className="captcha-question">{currentChallenge?.question || '...'}</div>
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={onRefresh}
          loading={loading}
          disabled={disabled || loading || refreshCooldown > 0}
          className="captcha-refresh-btn"
        >
          {refreshLabel}
        </Button>
      </div>
      <Input
        label="إجابة العملية"
        type="text"
        inputMode="numeric"
        dir="ltr"
        autoComplete="off"
        name="captcha_answer"
        placeholder="اكتب الناتج"
        value={value ?? ''}
        onChange={onChange}
        disabled={disabled || loading || !currentChallenge?.captcha_id}
      />
      {error ? <div className="field-hint error-text">{error}</div> : null}
    </div>
  );
}
