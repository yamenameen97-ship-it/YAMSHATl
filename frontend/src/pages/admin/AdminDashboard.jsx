import { useEffect, useState, useCallback, useMemo } from 'react';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import { LineChart, BarChart } from '../../components/admin/Charts.jsx';
import { getAdminOverview } from '../../api/admin.js';
import socket from '../../api/socket.js';

/**
 * AdminDashboard Component
 * Features: Analytics charts, Real-time monitoring, Server health cards, Activity stream
 */
export default function AdminDashboard() {
  const [metrics, setMetrics] = useState({
    active_users: 0,
    live_streams: 0,
    queue_size: 0,
    error_rate: 0,
    cpu_usage: 0,
    memory_usage: 0,
    disk_usage: 0,
    api_response_time: 0,
    total_requests: 0,
    failed_requests: 0,
  });
  const [auditLogs, setAuditLogs] = useState([]);
  const [activityStream, setActivityStream] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000);

  /**
   * Loads initial dashboard data
   */
  const loadInitialData = useCallback(async () => {
    try {
      const { data } = await getAdminOverview();
      setMetrics(data.metrics || metrics);
      setAuditLogs(data.audit_logs || []);
      setActivityStream(data.activity_stream || []);
    } catch (error) {
      console.error('Failed to load admin overview:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Sets up real-time socket listeners and polling
   */
  useEffect(() => {
    loadInitialData();

    // Real-time metrics updates
    socket.on('realtime_metrics', (newMetrics) => {
      setMetrics(prev => ({ ...prev, ...newMetrics }));
    });

    // Real-time audit logs
    socket.on('new_audit_log', (log) => {
      setAuditLogs(prev => [log, ...prev].slice(0, 50));
    });

    // Real-time activity stream
    socket.on('activity_update', (activity) => {
      setActivityStream(prev => [activity, ...prev].slice(0, 30));
    });

    // Periodic refresh
    const refreshTimer = setInterval(loadInitialData, refreshInterval);

    return () => {
      socket.off('realtime_metrics');
      socket.off('new_audit_log');
      socket.off('activity_update');
      clearInterval(refreshTimer);
    };
  }, [loadInitialData, refreshInterval]);

  /**
   * Calculates server health status
   */
  const serverHealth = useMemo(() => {
    const cpu = metrics.cpu_usage || 0;
    const memory = metrics.memory_usage || 0;
    const errorRate = metrics.error_rate || 0;

    if (cpu > 80 || memory > 80 || errorRate > 5) return 'critical';
    if (cpu > 60 || memory > 60 || errorRate > 2) return 'warning';
    return 'healthy';
  }, [metrics]);

  /**
   * Gets health status color
   */
  const getHealthColor = (status) => {
    switch (status) {
      case 'critical':
        return '#ff4444';
      case 'warning':
        return '#ffaa00';
      case 'healthy':
        return '#44ff44';
      default:
        return '#888';
    }
  };

  /**
   * Formats large numbers
   */
  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  if (loading) {
    return (
      <AdminLayout>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="page-loader-spinner" />
          <p>جارٍ تحميل لوحة التحكم...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <section style={{ padding: '20px' }}>
        {/* Header with Refresh Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
          <h2 style={{ margin: 0 }}>لوحة التحكم</h2>
          <div style={{ display: 'flex', gap: 10 }}>
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              style={{
                padding: '8px 12px',
                background: '#222',
                color: 'white',
                border: '1px solid #333',
                borderRadius: 6,
              }}
            >
              <option value={5000}>تحديث كل 5 ثوان</option>
              <option value={10000}>تحديث كل 10 ثوان</option>
              <option value={30000}>تحديث كل 30 ثانية</option>
              <option value={60000}>تحديث كل دقيقة</option>
            </select>
            <Button onClick={loadInitialData} size="small">🔄 تحديث الآن</Button>
          </div>
        </div>

        {/* Server Health Status */}
        <Card style={{ marginBottom: 20, padding: 20, background: `rgba(${serverHealth === 'healthy' ? '68, 255, 68' : serverHealth === 'warning' ? '255, 170, 0' : '255, 68, 68'}, 0.1)` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: getHealthColor(serverHealth),
                animation: serverHealth !== 'healthy' ? 'pulse 1s infinite' : 'none',
              }}
            />
            <div>
              <h4 style={{ margin: 0, marginBottom: 5 }}>حالة النظام</h4>
              <p style={{ margin: 0, fontSize: 12, color: '#888' }}>
                {serverHealth === 'healthy' ? '✓ النظام يعمل بشكل طبيعي' : serverHealth === 'warning' ? '⚠️ تحذير: استخدام موارد مرتفع' : '❌ حرج: يتطلب انتباه فوري'}
              </p>
            </div>
          </div>
        </Card>

        {/* Key Metrics Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 15, marginBottom: 30 }}>
          <Card style={{ padding: 20, textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 'bold', color: 'var(--primary)', marginBottom: 5 }}>
              {formatNumber(metrics.active_users)}
            </div>
            <div style={{ color: '#888', fontSize: 12 }}>المستخدمون النشطون (مباشر)</div>
          </Card>
          <Card style={{ padding: 20, textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 'bold', color: '#44ff44', marginBottom: 5 }}>
              {metrics.queue_size}
            </div>
            <div style={{ color: '#888', fontSize: 12 }}>قائمة الانتظار للمراجعة</div>
          </Card>
          <Card style={{ padding: 20, textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 'bold', color: '#ff9800', marginBottom: 5 }}>
              {metrics.error_rate.toFixed(2)}%
            </div>
            <div style={{ color: '#888', fontSize: 12 }}>معدل الأخطاء</div>
          </Card>
          <Card style={{ padding: 20, textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 'bold', color: '#3b82f6', marginBottom: 5 }}>
              {metrics.api_response_time.toFixed(0)}ms
            </div>
            <div style={{ color: '#888', fontSize: 12 }}>وقت استجابة API</div>
          </Card>
        </div>

        {/* System Resources Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 15, marginBottom: 30 }}>
          <Card style={{ padding: 20 }}>
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 'bold' }}>CPU</span>
                <span style={{ fontSize: 12, color: '#888' }}>{metrics.cpu_usage.toFixed(1)}%</span>
              </div>
              <div style={{ height: 8, background: '#333', borderRadius: 4, overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${metrics.cpu_usage}%`,
                    background: metrics.cpu_usage > 80 ? '#ff4444' : metrics.cpu_usage > 60 ? '#ffaa00' : '#44ff44',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>
          </Card>
          <Card style={{ padding: 20 }}>
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 'bold' }}>الذاكرة</span>
                <span style={{ fontSize: 12, color: '#888' }}>{metrics.memory_usage.toFixed(1)}%</span>
              </div>
              <div style={{ height: 8, background: '#333', borderRadius: 4, overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${metrics.memory_usage}%`,
                    background: metrics.memory_usage > 80 ? '#ff4444' : metrics.memory_usage > 60 ? '#ffaa00' : '#44ff44',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>
          </Card>
          <Card style={{ padding: 20 }}>
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 'bold' }}>القرص</span>
                <span style={{ fontSize: 12, color: '#888' }}>{metrics.disk_usage.toFixed(1)}%</span>
              </div>
              <div style={{ height: 8, background: '#333', borderRadius: 4, overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${metrics.disk_usage}%`,
                    background: metrics.disk_usage > 80 ? '#ff4444' : metrics.disk_usage > 60 ? '#ffaa00' : '#44ff44',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Charts Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 15, marginBottom: 30 }}>
          <Card title="نظرة عامة على حركة المرور" style={{ padding: 20 }}>
            <LineChart data={metrics.traffic_history || []} />
          </Card>
          <Card title="نظرة عامة على الاعتدال" style={{ padding: 20 }}>
            <BarChart data={metrics.mod_stats || []} />
          </Card>
        </div>

        {/* Activity Stream and Audit Logs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 15 }}>
          {/* Activity Stream */}
          <Card title="تدفق النشاط" style={{ padding: 20 }}>
            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
              {activityStream.length > 0 ? (
                activityStream.map((activity, i) => (
                  <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid #333', fontSize: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontWeight: 'bold' }}>{activity.action}</span>
                      <span style={{ color: '#888' }}>{new Date(activity.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div style={{ color: '#aaa' }}>{activity.description}</div>
                  </div>
                ))
              ) : (
                <div style={{ color: '#888', textAlign: 'center', padding: '20px' }}>لا يوجد نشاط</div>
              )}
            </div>
          </Card>

          {/* Audit Logs */}
          <Card title="سجلات التدقيق" style={{ padding: 20 }}>
            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
              {auditLogs.length > 0 ? (
                auditLogs.map((log) => (
                  <div key={log.id} style={{ padding: '10px 0', borderBottom: '1px solid #333', fontSize: 11 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ color: '#888' }}>{new Date(log.timestamp).toLocaleTimeString()}</span>
                      <span
                        style={{
                          padding: '2px 6px',
                          borderRadius: 4,
                          background: log.type === 'error' ? 'rgba(255, 68, 68, 0.2)' : log.type === 'warning' ? 'rgba(255, 170, 0, 0.2)' : 'rgba(68, 255, 68, 0.2)',
                          color: log.type === 'error' ? '#ff4444' : log.type === 'warning' ? '#ffaa00' : '#44ff44',
                        }}
                      >
                        {log.type}
                      </span>
                    </div>
                    <div style={{ color: '#aaa', marginBottom: 2 }}>{log.message}</div>
                    <div style={{ color: '#666', fontSize: 10 }}>بواسطة {log.admin_name}</div>
                  </div>
                ))
              ) : (
                <div style={{ color: '#888', textAlign: 'center', padding: '20px' }}>لا توجد سجلات</div>
              )}
            </div>
          </Card>
        </div>
      </section>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </AdminLayout>
  );
}
