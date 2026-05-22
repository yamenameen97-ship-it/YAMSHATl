import Button from '../ui/Button.jsx';

export default function EmptyState({
  title = 'لا توجد بيانات',
  description = 'عند توفر محتوى سيظهر هنا تلقائياً.',
  actionLabel,
  onAction,
  icon = '📭',
}) {
  return (
    <div className="empty-state-card">
      <div className="empty-state-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
      {actionLabel && onAction ? <Button onClick={onAction}>{actionLabel}</Button> : null}
    </div>
  );
}
