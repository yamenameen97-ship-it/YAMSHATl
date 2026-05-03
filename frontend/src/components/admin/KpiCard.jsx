import Card from '../ui/Card.jsx';

export default function KpiCard({ item }) {
  return (
    <Card className="kpi-card">
      <div className="kpi-label-row">
        <span className="kpi-label">{item.label}</span>
        <span className="kpi-badge">+{item.delta}</span>
      </div>
      <div className="kpi-value">{item.value}</div>
      <div className="muted">تحديث مباشر من قاعدة البيانات والخدمات المرتبطة.</div>
    </Card>
  );
}
