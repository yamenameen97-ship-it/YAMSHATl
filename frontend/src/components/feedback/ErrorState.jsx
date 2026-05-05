import Button from '../ui/Button.jsx';

export default function ErrorState({
  title = 'حدث خطأ غير متوقع',
  description = 'حاول مرة أخرى بعد قليل.',
  onRetry,
}) {
  return (
    <div className="error-state-card" role="alert">
      <div className="empty-state-icon">⚠️</div>
      <h3>{title}</h3>
      <p>{description}</p>
      {onRetry ? <Button onClick={onRetry}>إعادة المحاولة</Button> : null}
    </div>
  );
}
