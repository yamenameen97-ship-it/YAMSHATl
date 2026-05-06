import Card from '../ui/Card.jsx';

export default function KpiCard({ item }) {
  const deltaValue = item?.delta ?? 0;
  const trendLabel = item?.trend_label || 'تحديث مباشر';
  return (
    <Card className="kpi-card">
      <div className="kpi-label-row">
        <span className="kpi-label">{item.label}</span>
        <span className="kpi-badge">+{deltaValue}</span>
      </div>
      <div className="kpi-value">{item.value}</div>
      <div className="muted">{trendLabel}</div>
    </Card>
  );
}
