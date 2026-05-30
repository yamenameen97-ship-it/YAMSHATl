import { useEffect, useState, useMemo } from 'react';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import { useRealtime } from '../../hooks/realtime/useRealtime.js';

// Enterprise Monitoring Widget
const MonitoringWidget = ({ title, value, status, trend }) => (
  <Card className={`monitoring-widget ${status}`}>
    <div className="flex-between">
      <span className="widget-title">{title}</span>
      <span className={`status-dot ${status}`}></span>
    </div>
    <div className="widget-value">{value}</div>
    <div className={`widget-trend ${trend > 0 ? 'up' : 'down'}`}>
      {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last hour
    </div>
  </Card>
);

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState({
    activeUsers: 1240,
    apiRequests: 45200,
    errorRate: 0.02,
    serverLoad: 42,
  });

  // Realtime Monitoring Integration
  const { isConnected } = useRealtime('admin_metrics_update', (data) => {
    setMetrics(prev => ({ ...prev, ...data }));
  });

  const deepAnalytics = useMemo(() => ({
    userRetention: '68%',
    avgRevenuePerUser: '$4.20',
    topRegions: ['الشرق الأوسط', 'أوروبا', 'شمال أفريقيا'],
    fraudAttemptsBlocked: 142,
  }), []);

  return (
    <div className="admin-dashboard-container">
      <header className="admin-header">
        <h1>لوحة التحكم المؤسسية (Enterprise Admin)</h1>
        <div className="system-status">
          <span className={`status-badge ${isConnected ? 'online' : 'offline'}`}>
            {isConnected ? 'اتصال حي نشط' : 'جاري إعادة الاتصال...'}
          </span>
        </div>
      </header>

      {/* Live Monitoring Grid */}
      <section className="monitoring-grid">
        <MonitoringWidget title="المستخدمون النشطون" value={metrics.activeUsers.toLocaleString()} status="success" trend={12} />
        <MonitoringWidget title="طلبات API / ثانية" value={(metrics.apiRequests / 3600).toFixed(2)} status="success" trend={5} />
        <MonitoringWidget title="معدل الأخطاء" value={`${(metrics.errorRate * 100).toFixed(2)}%`} status={metrics.errorRate > 0.05 ? 'danger' : 'success'} trend={-2} />
        <MonitoringWidget title="حمولة الخادم" value={`${metrics.serverLoad}%`} status={metrics.serverLoad > 80 ? 'warning' : 'success'} trend={8} />
      </section>

      {/* Deep Analytics & Enterprise Charts */}
      <div className="admin-main-content">
        <Card className="analytics-card">
          <div className="card-header">
            <h3>تحليلات معمقة (Deep Analytics)</h3>
            <Button size="small" variant="secondary">تقرير PDF مفصل</Button>
          </div>
          <div className="analytics-details-grid">
            <div className="detail-item">
              <label>معدل الاحتفاظ بالمستخدمين</label>
              <div className="big-val">{deepAnalytics.userRetention}</div>
            </div>
            <div className="detail-item">
              <label>متوسط الربح لكل مستخدم</label>
              <div className="big-val">{deepAnalytics.avgRevenuePerUser}</div>
            </div>
            <div className="detail-item">
              <label>محاولات الاحتيال المحظورة</label>
              <div className="big-val danger-text">{deepAnalytics.fraudAttemptsBlocked}</div>
            </div>
          </div>
          
          <div className="regions-section mt-6">
            <h4>أعلى المناطق الجغرافية</h4>
            <div className="regions-list">
              {deepAnalytics.topRegions.map((region, i) => (
                <div key={i} className="region-bar">
                  <span>{region}</span>
                  <div className="bar-bg"><div className="bar-fill" style={{ width: `${100 - (i * 20)}%` }} /></div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="live-logs-card">
          <h3>سجل النظام المباشر (Live Monitoring)</h3>
          <div className="logs-container">
            <div className="log-entry info"><span>[INFO]</span> API Gateway healthy - 200 OK</div>
            <div className="log-entry warning"><span>[WARN]</span> High latency detected in Node-4</div>
            <div className="log-entry info"><span>[INFO]</span> Backup task completed successfully</div>
            <div className="log-entry danger"><span>[ERR]</span> Database connection pool near limit</div>
          </div>
        </Card>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .admin-dashboard-container { padding: 20px; background: #f8fafc; min-height: 100vh; }
        .admin-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
        .monitoring-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .monitoring-widget { padding: 20px; }
        .widget-value { font-size: 28px; font-weight: bold; margin: 10px 0; }
        .widget-trend { font-size: 12px; font-weight: 500; }
        .widget-trend.up { color: #10b981; }
        .widget-trend.down { color: #ef4444; }
        .status-dot { width: 8px; height: 8px; border-radius: 50%; }
        .status-dot.success { background: #10b981; box-shadow: 0 0 8px #10b981; }
        .status-dot.danger { background: #ef4444; box-shadow: 0 0 8px #ef4444; }
        .status-dot.warning { background: #f59e0b; box-shadow: 0 0 8px #f59e0b; }
        .admin-main-content { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; }
        .analytics-details-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 20px; }
        .big-val { font-size: 24px; font-weight: bold; color: #1e293b; }
        .danger-text { color: #ef4444; }
        .region-bar { margin-bottom: 15px; }
        .bar-bg { height: 8px; background: #e2e8f0; border-radius: 4px; margin-top: 5px; overflow-y:auto; }
        .bar-fill { height: 100%; background: #3b82f6; border-radius: 4px; }
        .logs-container { background: #1e293b; color: #94a3b8; padding: 15px; border-radius: 8px; font-family: monospace; font-size: 12px; height: 300px; overflow-y: auto; margin-top: 15px; }
        .log-entry { margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #334155; }
        .log-entry span { font-weight: bold; }
        .log-entry.info span { color: #38bdf8; }
        .log-entry.warning span { color: #fbbf24; }
        .log-entry.danger span { color: #f87171; }
        @media (max-width: 1024px) { .admin-main-content { grid-template-columns: 1fr; } }
      `}} />
    </div>
  );
}
