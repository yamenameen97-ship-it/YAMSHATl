import Button from '../ui/Button.jsx';
import Input from '../ui/Input.jsx';

export default function CaptchaBox({
  challenge,
  captcha,
  value,
  onChange,
  onRefresh,
  loading = false,
  disabled = false,
  error = '',
  refreshCooldown = 0,
}) {
  const currentChallenge = challenge || captcha || null;
  const hasChallenge = Boolean(currentChallenge?.question);
  const refreshLabel = refreshCooldown > 0
    ? `تحديث (${refreshCooldown}ث)`
    : loading
      ? 'جارٍ التحميل…'
      : hasChallenge
        ? 'تحديث'
        : 'إعادة المحاولة';

  // 🔥 إصلاح حاسم: عرض رسالة واضحة عندما يفشل تحميل الكابتشا
  // بدلاً من عرض "..." الذي يربك المستخدم
  const questionText = hasChallenge
    ? currentChallenge.question
    : loading
      ? 'جارٍ تحميل الكابتشا...'
      : 'تعذر تحميل الكابتشا — اضغط "إعادة المحاولة"';

  return (
    <div className="captcha-box" dir="rtl">
      <div className="captcha-row">
        <div>
          <div className="field-label">كابتشا الأمان</div>
          <div
            className="captcha-question"
            style={!hasChallenge ? { opacity: 0.7, fontSize: '0.9em' } : undefined}
          >
            {questionText}
          </div>
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
        placeholder={hasChallenge ? 'اكتب الناتج' : 'في انتظار الكابتشا…'}
        value={value ?? ''}
        onChange={onChange}
        disabled={disabled || loading || !currentChallenge?.captcha_id}
      />
      {error ? <div className="field-hint error-text">{error}</div> : null}
      {!hasChallenge && !loading && !error ? (
        <div className="field-hint" style={{ color: '#b45309', marginTop: 6 }}>
          ⚠️ الخادم قد يكون في وضع السكون. الاستيقاظ يستغرق ~30 ثانية في أول طلب.
        </div>
      ) : null}
    </div>
  );
}
