import Button from '../ui/Button.jsx';
import Input from '../ui/Input.jsx';

const ARABIC_INDIC_DIGITS = {
  '٠': '0',
  '١': '1',
  '٢': '2',
  '٣': '3',
  '٤': '4',
  '٥': '5',
  '٦': '6',
  '٧': '7',
  '٨': '8',
  '٩': '9',
  '۰': '0',
  '۱': '1',
  '۲': '2',
  '۳': '3',
  '۴': '4',
  '۵': '5',
  '۶': '6',
  '۷': '7',
  '۸': '8',
  '۹': '9',
  '−': '-',
  '﹣': '-',
  '－': '-',
};

function normalizeNumericInput(value) {
  const translated = String(value ?? '')
    .split('')
    .map((char) => ARABIC_INDIC_DIGITS[char] ?? char)
    .join('')
    .replace(/\s+/g, '')
    .replace(/[^0-9-]/g, '');

  if (!translated) return '';

  const negative = translated.startsWith('-');
  const digits = translated.replace(/-/g, '');
  return `${negative ? '-' : ''}${digits}`.slice(0, 8);
}

function getCaptchaExpression(challenge) {
  if (!challenge) return '...';
  if (challenge.display_question) return String(challenge.display_question);

  const left = challenge.left;
  const operator = challenge.operator;
  const right = challenge.right;
  if (left !== undefined && operator && right !== undefined) {
    return `${left} ${operator} ${right}`;
  }

  return String(challenge.question || '...');
}

export default function CaptchaBox({ challenge, captcha, value, onChange, onRefresh, loading = false, disabled = false, error = '', refreshCooldown = 0 }) {
  const currentChallenge = challenge || captcha || null;
  const refreshDisabled = disabled || loading || refreshCooldown > 0;
  const expression = getCaptchaExpression(currentChallenge);

  const handleInputChange = (event) => {
    const nextValue = normalizeNumericInput(event?.target?.value);
    if (typeof onChange === 'function') {
      onChange({
        ...event,
        target: {
          ...(event?.target || {}),
          name: event?.target?.name || 'captcha_answer',
          value: nextValue,
        },
      });
    }
  };

  return (
    <div className="captcha-box">
      <div className="captcha-row">
        <div>
          <div className="field-label">كابتشا الأمان</div>
          <div
            className="captcha-question"
            dir="ltr"
            lang="en"
            style={{
              direction: 'ltr',
              unicodeBidi: 'isolate',
              textAlign: 'left',
              display: 'inline-block',
              minWidth: '6ch',
              letterSpacing: '0.04em',
            }}
            title="اقرأ العملية من الشمال لليمين"
          >
            {expression}
          </div>
          <div className="field-hint" style={{ marginTop: 6 }}>اقرأ العملية من الشمال لليمين</div>
        </div>
        <Button type="button" variant="secondary" onClick={onRefresh} loading={loading} disabled={refreshDisabled} className="captcha-refresh-btn">
          {refreshCooldown > 0 ? `تحديث (${refreshCooldown})` : 'تحديث'}
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
        value={normalizeNumericInput(value ?? '')}
        onChange={handleInputChange}
        disabled={disabled || loading || !currentChallenge?.captcha_id}
      />
      {error ? <div className="field-hint error-text">{error}</div> : null}
    </div>
  );
}
