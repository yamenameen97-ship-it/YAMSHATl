import { useState, useMemo } from 'react';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';

/**
 * AnalyticsDashboard Component
 * 
 * لوحة تحليلات شاملة تعرض:
 * - الإحصائيات الرئيسية
 * - الرسوم البيانية
 * - عدد المستخدمين النشطين
 * - إحصائيات البث المباشر
 */
export default function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState('7d'); // 7d, 30d, 90d, 1y
  const [selectedMetric, setSelectedMetric] = useState('users');

  // Mock data - Replace with real API calls
  const analyticsData = useMemo(() => ({
    totalUsers: 15234,
    activeUsers: 3421,
    newUsers: 234,
    totalPosts: 45678,
    totalComments: 123456,
    totalLikes: 456789,
    liveStreams: 12,
    activeStreams: 3,
    averageSessionDuration: 18.5, // minutes
    engagementRate: 42.3, // percentage
    retentionRate: 78.5, // percentage
  }), []);

  const metrics = [
    { id: 'users', label: 'المستخدمون', value: analyticsData.totalUsers, icon: '👥' },
    { id: 'active', label: 'نشطون الآن', value: analyticsData.activeUsers, icon: '🟢' },
    { id: 'posts', label: 'المنشورات', value: analyticsData.totalPosts, icon: '📝' },
    { id: 'engagement', label: 'معدل التفاعل', value: `${analyticsData.engagementRate}%`, icon: '📈' },
    { id: 'retention', label: 'معدل الاحتفاظ', value: `${analyticsData.retentionRate}%`, icon: '📊' },
    { id: 'streams', label: 'البث المباشر', value: analyticsData.activeStreams, icon: '🔴' },
  ];

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
          📊 لوحة التحليلات
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
            }}>
              {metric.value.toLocaleString('ar-EG')}
            </div>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* User Growth Chart */}
        <Card style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 'bold' }}>
            📈 نمو المستخدمين
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
            {[45, 52, 48, 61, 55, 67, 72].map((value, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: `${value}%`,
                  background: 'var(--primary)',
                  borderRadius: '4px 4px 0 0',
                  opacity: 0.8,
                }}
                title={`Day ${i + 1}: ${value}%`}
              />
            ))}
          </div>
        </Card>

        {/* Engagement Chart */}
        <Card style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 'bold' }}>
            💬 التفاعل
          </h3>
          <div style={{
            display: 'grid',
            gap: '12px',
          }}>
            {[
              { label: 'المنشورات', value: 45, color: '#3b82f6' },
              { label: 'التعليقات', value: 62, color: '#10b981' },
              { label: 'الإعجابات', value: 78, color: '#f59e0b' },
              { label: 'المشاركات', value: 34, color: '#ef4444' },
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
      </div>

      {/* Live Streams Stats */}
      <Card style={{ padding: '20px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 'bold' }}>
          🔴 البث المباشر
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '12px',
        }}>
          {[
            { title: 'بث 1', viewers: 234, duration: '45 دقيقة' },
            { title: 'بث 2', viewers: 156, duration: '23 دقيقة' },
            { title: 'بث 3', viewers: 89, duration: '12 دقيقة' },
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
              <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
                {stream.title}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                👁️ {stream.viewers.toLocaleString('ar-EG')} مشاهد
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                ⏱️ {stream.duration}
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
