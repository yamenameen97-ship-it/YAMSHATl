import { useState, useMemo, useEffect } from 'react';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';

/**
 * AnalyticsDashboard Component
 * 
 * لوحة تحليلات شاملة تعرض:
 * - الإحصائيات الرئيسية
 * - الرسوم البيانية التفاعلية
 * - عدد المستخدمين النشطين فوري
 * - معدل التفاعل والاحتفاظ
 * - مراقبة السيرفر واستهلاك API
 * - إحصائيات البث المباشر
 */
export default function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState('7d'); // 7d, 30d, 90d, 1y
  const [selectedMetric, setSelectedMetric] = useState('users');
  const [realtimeUsers, setRealtimeUsers] = useState(3421);
  const [serverMetrics, setServerMetrics] = useState({
    cpuUsage: 45,
    memoryUsage: 62,
    diskUsage: 38,
    apiLatency: 125,
    errorRate: 0.8,
    uptime: 99.97
  });

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setRealtimeUsers(prev => prev + Math.floor(Math.random() * 10 - 3));
      setServerMetrics(prev => ({
        cpuUsage: Math.max(20, Math.min(90, prev.cpuUsage + (Math.random() - 0.5) * 5)),
        memoryUsage: Math.max(30, Math.min(85, prev.memoryUsage + (Math.random() - 0.5) * 3)),
        diskUsage: Math.max(10, Math.min(80, prev.diskUsage + (Math.random() - 0.5) * 2)),
        apiLatency: Math.max(80, Math.min(300, prev.apiLatency + (Math.random() - 0.5) * 20)),
        errorRate: Math.max(0.1, Math.min(5, prev.errorRate + (Math.random() - 0.5) * 0.3)),
        uptime: Math.min(99.99, prev.uptime + (Math.random() - 0.5) * 0.01)
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Mock data - Replace with real API calls
  const analyticsData = useMemo(() => ({
    totalUsers: 15234,
    activeUsers: realtimeUsers,
    newUsers: 234,
    totalPosts: 45678,
    totalComments: 123456,
    totalLikes: 456789,
    averageSessionDuration: 18.5, // minutes
    engagementRate: 42.3, // percentage
    retentionRate: 78.5, // percentage
    dailyActiveUsers: [2100, 2450, 2890, 3120, 3421, 3350, 3280],
    hourlyActiveUsers: [120, 145, 180, 210, 250, 280, 310, 340, 380, 420, 450, 480],
  }), [realtimeUsers]);

  const metrics = [
    { id: 'users', label: 'المستخدمون', value: analyticsData.totalUsers, icon: '👥', change: '+12%' },
    { id: 'active', label: 'نشطون الآن', value: analyticsData.activeUsers, icon: '🟢', change: 'فوري' },
    { id: 'posts', label: 'المنشورات', value: analyticsData.totalPosts, icon: '📝', change: '+8%' },
    { id: 'engagement', label: 'معدل التفاعل', value: `${analyticsData.engagementRate}%`, icon: '📈', change: '+2.5%' },
    { id: 'retention', label: 'معدل الاحتفاظ', value: `${analyticsData.retentionRate}%`, icon: '📊', change: '+1.2%' },
  ];

  const getServerHealthColor = (value, thresholds) => {
    if (value <= thresholds.good) return '#10b981';
    if (value <= thresholds.warning) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div style={{ padding: '20px', display: 'grid', gap: '20px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
      }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
          📊 لوحة التحليلات الشاملة
        </h1>

        <div style={{ display: 'flex', gap: '8px' }}>
          {['7d', '30d', '90d', '1y'].map(range => (
            <Button
              key={range}
              variant={timeRange === range ? 'primary' : 'secondary'}
              onClick={() => setTimeRange(range)}
              style={{ padding: '6px 12px', fontSize: '12px' }}
            >
              {range === '7d' ? 'أسبوع' : range === '30d' ? 'شهر' : range === '90d' ? '3 أشهر' : 'سنة'}
            </Button>
          ))}
        </div>
      </div>

      {/* Metrics Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
      }}>
        {metrics.map(metric => (
          <Card
            key={metric.id}
            style={{
              padding: '20px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              border: selectedMetric === metric.id ? '2px solid var(--primary)' : '1px solid var(--line)',
              background: selectedMetric === metric.id ? 'rgba(var(--primary-rgb), 0.05)' : 'var(--bg-card)',
            }}
            onClick={() => setSelectedMetric(metric.id)}
          >
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>
              {metric.icon}
            </div>
            <div style={{
              fontSize: '12px',
              color: 'var(--text-muted)',
              marginBottom: '8px',
            }}>
              {metric.label}
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: 'var(--text)',
              marginBottom: '8px'
            }}>
              {typeof metric.value === 'number' ? metric.value.toLocaleString('ar-EG') : metric.value}
            </div>
            <div style={{
              fontSize: '11px',
              color: '#10b981',
              fontWeight: 'bold'
            }}>
              {metric.change}
            </div>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* User Growth Chart */}
        <Card style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 'bold' }}>
            📈 نمو المستخدمين (آخر 7 أيام)
          </h3>
          <div style={{
            height: '200px',
            background: 'var(--bg-soft)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-around',
            padding: '16px',
            gap: '8px',
          }}>
            {analyticsData.dailyActiveUsers.map((value, i) => {
              const maxValue = Math.max(...analyticsData.dailyActiveUsers);
              const percentage = (value / maxValue) * 100;
              return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: `${percentage}%`,
                    background: 'var(--primary)',
                    borderRadius: '4px 4px 0 0',
                    opacity: 0.8,
                    position: 'relative',
                    transition: 'all 0.3s ease',
                  }}
                  title={`اليوم ${i + 1}: ${value.toLocaleString('ar-EG')} مستخدم`}
                >
                  <div style={{
                    position: 'absolute',
                    top: '-20px',
                    left: 0,
                    right: 0,
                    fontSize: '10px',
                    textAlign: 'center',
                    color: '#64748b'
                  }}>
                    {value.toLocaleString('ar-EG')}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Hourly Active Users */}
        <Card style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 'bold' }}>
            ⏰ المستخدمون النشطون (آخر 12 ساعة)
          </h3>
          <div style={{
            height: '200px',
            background: 'var(--bg-soft)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-around',
            padding: '16px',
            gap: '4px',
          }}>
            {analyticsData.hourlyActiveUsers.map((value, i) => {
              const maxValue = Math.max(...analyticsData.hourlyActiveUsers);
              const percentage = (value / maxValue) * 100;
              return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: `${percentage}%`,
                    background: '#10b981',
                    borderRadius: '2px 2px 0 0',
                    opacity: 0.8,
                  }}
                  title={`الساعة ${i}: ${value} مستخدم`}
                />
              );
            })}
          </div>
        </Card>
      </div>

      {/* Engagement Chart */}
      <Card style={{ padding: '20px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 'bold' }}>
          💬 معدلات التفاعل والاحتفاظ
        </h3>
        <div style={{
          display: 'grid',
          gap: '12px',
        }}>
          {[
            { label: 'معدل التفاعل', value: 42.3, color: '#3b82f6' },
            { label: 'معدل الاحتفاظ', value: 78.5, color: '#10b981' },
            { label: 'معدل الفتح', value: 65.2, color: '#f59e0b' },
            { label: 'معدل النقر', value: 34.8, color: '#ef4444' },
          ].map(item => (
            <div key={item.label}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '4px',
                fontSize: '12px',
              }}>
                <span>{item.label}</span>
                <span style={{ fontWeight: 'bold' }}>{item.value}%</span>
              </div>
              <div style={{
                width: '100%',
                height: '8px',
                background: 'var(--bg-soft)',
                borderRadius: '4px',
                overflow: 'hidden',
              }}>
                <div
                  style={{
                    width: `${item.value}%`,
                    height: '100%',
                    background: item.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Server Health Monitoring */}
      <Card style={{ padding: '20px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 'bold' }}>
          🖥️ مراقبة السيرفر والأداء
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
        }}>
          {[
            { label: 'استخدام CPU', value: serverMetrics.cpuUsage, unit: '%', thresholds: { good: 50, warning: 75 } },
            { label: 'استخدام الذاكرة', value: serverMetrics.memoryUsage, unit: '%', thresholds: { good: 60, warning: 80 } },
            { label: 'استخدام القرص', value: serverMetrics.diskUsage, unit: '%', thresholds: { good: 50, warning: 70 } },
            { label: 'زمن الاستجابة', value: serverMetrics.apiLatency, unit: 'ms', thresholds: { good: 150, warning: 250 } },
            { label: 'معدل الخطأ', value: serverMetrics.errorRate, unit: '%', thresholds: { good: 1, warning: 3 } },
            { label: 'وقت التشغيل', value: serverMetrics.uptime, unit: '%', thresholds: { good: 99.5, warning: 99 } },
          ].map(metric => (
            <div key={metric.label} style={{
              padding: '16px',
              background: 'var(--bg-soft)',
              borderRadius: '8px',
              borderLeft: `3px solid ${getServerHealthColor(metric.value, metric.thresholds)}`,
            }}>
              <div style={{
                fontSize: '12px',
                color: 'var(--text-muted)',
                marginBottom: '8px',
              }}>
                {metric.label}
              </div>
              <div style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: getServerHealthColor(metric.value, metric.thresholds),
                marginBottom: '8px'
              }}>
                {metric.value.toFixed(1)}{metric.unit}
              </div>
              <div style={{
                width: '100%',
                height: '4px',
                background: '#e2e8f0',
                borderRadius: '2px',
                overflow: 'hidden',
              }}>
                <div
                  style={{
                    width: `${Math.min(metric.value, 100)}%`,
                    height: '100%',
                    background: getServerHealthColor(metric.value, metric.thresholds),
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* API Usage Stats */}
      <Card style={{ padding: '20px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 'bold' }}>
          📡 استهلاك API والطلبات
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '16px',
        }}>
          {[
            { label: 'إجمالي الطلبات', value: '2.5M', icon: '📊' },
            { label: 'الطلبات الناجحة', value: '2.48M', icon: '✅' },
            { label: 'الطلبات الفاشلة', value: '20K', icon: '❌' },
            { label: 'متوسط الاستجابة', value: '125ms', icon: '⚡' },
            { label: 'الحد الأقصى', value: '450ms', icon: '📈' },
            { label: 'معدل النجاح', value: '99.2%', icon: '🎯' },
          ].map(stat => (
            <div key={stat.label} style={{
              padding: '16px',
              background: 'var(--bg-soft)',
              borderRadius: '8px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>
                {stat.icon}
              </div>
              <div style={{
                fontSize: '12px',
                color: 'var(--text-muted)',
                marginBottom: '4px',
              }}>
                {stat.label}
              </div>
              <div style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: 'var(--text)',
              }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Live Streams Stats */}
      <Card style={{ padding: '20px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 'bold' }}>
          🔴 إحصائيات البث المباشر
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '12px',
        }}>
          {[
            { title: 'بث 1', viewers: 234, duration: '45 دقيقة', bitrate: '2.5 Mbps', health: 'ممتاز' },
            { title: 'بث 2', viewers: 156, duration: '23 دقيقة', bitrate: '1.8 Mbps', health: 'جيد' },
            { title: 'بث 3', viewers: 89, duration: '12 دقيقة', bitrate: '1.2 Mbps', health: 'جيد' },
          ].map((stream, i) => (
            <div
              key={i}
              style={{
                padding: '12px',
                background: 'var(--bg-soft)',
                borderRadius: '8px',
                border: '1px solid var(--line)',
              }}
            >
              <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#dc2626' }}>
                🔴 {stream.title}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                👁️ {stream.viewers.toLocaleString('ar-EG')} مشاهد
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                ⏱️ {stream.duration}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                📡 {stream.bitrate}
              </div>
              <div style={{ fontSize: '12px', color: '#10b981', fontWeight: 'bold' }}>
                ✓ {stream.health}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <style>{`
        div:hover {
          transition: all 0.2s ease;
        }
      `}</style>
    </div>
  );
}
