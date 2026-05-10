import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import { LineChart, BarChart } from '../../components/admin/Charts.jsx';
import { getAdminOverview } from '../../api/admin.js';
import socket from '../../api/socket.js';

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState({
    active_users: 0,
    live_streams: 0,
    queue_size: 0,
    error_rate: 0
  });
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const { data } = await getAdminOverview();
        setMetrics(data.metrics || metrics);
        setAuditLogs(data.audit_logs || []);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();

    socket.on('realtime_metrics', (newMetrics) => {
      setMetrics(prev => ({ ...prev, ...newMetrics }));
    });

    socket.on('new_audit_log', (log) => {
      setAuditLogs(prev => [log, ...prev].slice(0, 50));
    });

    return () => {
      socket.off('realtime_metrics');
      socket.off('new_audit_log');
    };
  }, []);

  return (
    <AdminLayout>
      <section className="dashboard-grid">
        <div className="metrics-row">
          <Card className="metric-card">
            <h4>Live Analytics</h4>
            <div className="metric-value">{metrics.active_users}</div>
            <p>Active Users (Real-time)</p>
          </Card>
          <Card className="metric-card">
            <h4>Moderation Queue</h4>
            <div className="metric-value">{metrics.queue_size}</div>
            <p>Pending Review</p>
          </Card>
          <Card className="metric-card">
            <h4>System Health</h4>
            <div className="metric-value">{metrics.error_rate}%</div>
            <p>Error Rate</p>
          </Card>
        </div>

        <div className="charts-row">
          <Card title="Traffic Overview">
            <LineChart data={metrics.traffic_history || []} />
          </Card>
          <Card title="Moderation Overview">
            <BarChart data={metrics.mod_stats || []} />
          </Card>
        </div>

        <div className="audit-logs-section">
          <Card title="System Audit Logs">
            <div className="logs-container">
              {auditLogs.map(log => (
                <div key={log.id} className="log-entry">
                  <span className="log-time">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  <span className={`log-type ${log.type}`}>{log.type}</span>
                  <span className="log-message">{log.message}</span>
                  <span className="log-user">by {log.admin_name}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>
    </AdminLayout>
  );
}
