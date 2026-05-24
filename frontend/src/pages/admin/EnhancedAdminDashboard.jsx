/**
 * لوحة التحكم الإدارية المحسّنة
 * توفر:
 * - رسوم بيانية حية
 * - عناصر تحليلات متقدمة
 * - عدادات فعّالة
 * - رسوم بيانية الأنشطة
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { API_BASE } from '../../api/config.js';

const API_BASE_URL = API_BASE;

/**
 * مكون العداد الحي
 */
const LiveCounter = ({ label, value, trend, color = '#007AFF' }) => {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    if (value !== displayValue) {
      const diff = value - displayValue;
      const steps = Math.abs(diff);
      let currentStep = 0;

      const interval = setInterval(() => {
        currentStep++;
        const newValue = displayValue + (diff / steps) * currentStep;
        setDisplayValue(Math.round(newValue));

        if (currentStep >= steps) {
          clearInterval(interval);
          setDisplayValue(value);
        }
      }, 50);

      return () => clearInterval(interval);
    }
  }, [value, displayValue]);

  return (
    <div style={styles.counterCard}>
      <div style={styles.counterLabel}>{label}</div>
      <div style={{ ...styles.counterValue, color }}>
        {displayValue.toLocaleString()}
      </div>
      {trend && (
        <div style={{
          ...styles.counterTrend,
          color: trend > 0 ? '#34C759' : '#FF3B30'
        }}>
          {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </div>
      )}
    </div>
  );
};

/**
 * مكون الرسم البياني البسيط
 */
const SimpleChart = ({ data, title, type = 'line' }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  const width = 400;
  const height = 200;
  const padding = 40;

  const points = data.map((d, i) => ({
    x: padding + (i / (data.length - 1)) * (width - 2 * padding),
    y: height - padding - (d.value / maxValue) * (height - 2 * padding)
  }));

  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <div style={styles.chartCard}>
      <h3 style={styles.chartTitle}>{title}</h3>
      <svg width={width} height={height} style={styles.svg}>
        {/* خطوط الشبكة */}
        {[0, 1, 2, 3, 4].map(i => (
          <line
            key={`grid-${i}`}
            x1={padding}
            y1={padding + (i / 4) * (height - 2 * padding)}
            x2={width - padding}
            y2={padding + (i / 4) * (height - 2 * padding)}
            stroke="#e0e0e0"
            strokeDasharray="5,5"
          />
        ))}

        {/* الخط */}
        <path
          d={pathData}
          fill="none"
          stroke="#007AFF"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* النقاط */}
        {points.map((p, i) => (
          <circle
            key={`point-${i}`}
            cx={p.x}
            cy={p.y}
            r="4"
            fill="#007AFF"
          />
        ))}
      </svg>

      {/* التسميات */}
      <div style={styles.chartLabels}>
        {data.map((d, i) => (
          <span key={`label-${i}`} style={styles.chartLabel}>
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
};

/**
 * مكون جدول الأنشطة
 */
const ActivityTable = ({ activities = [] }) => {
  return (
    <div style={styles.tableCard}>
      <h3 style={styles.tableTitle}>آخر الأنشطة</h3>
      <table style={styles.table}>
        <thead>
          <tr>
            <th>المستخدم</th>
            <th>النشاط</th>
            <th>الوقت</th>
            <th>الحالة</th>
          </tr>
        </thead>
        <tbody>
          {activities.map((activity, i) => (
            <tr key={i}>
              <td>{activity.user}</td>
              <td>{activity.action}</td>
              <td>{formatTime(activity.timestamp)}</td>
              <td>
                <span style={{
                  ...styles.statusBadge,
                  backgroundColor: activity.status === 'success' ? '#34C759' : '#FF3B30'
                }}>
                  {activity.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/**
 * مكون لوحة التحكم الرئيسي
 */
export const EnhancedAdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalPosts: 0,
    totalReports: 0,
    userTrend: 0,
    postTrend: 0,
    reportTrend: 0
  });

  const [chartData, setChartData] = useState({
    users: [],
    posts: [],
    engagement: []
  });

  const [activities, setActivities] = useState([]);

  // جلب الإحصائيات
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE_URL}/admin/stats`);
      return response.data;
    },
    refetchInterval: 5000 // تحديث كل 5 ثواني
  });

  // جلب بيانات الرسوم البيانية
  const { data: chartsData, isLoading: chartsLoading } = useQuery({
    queryKey: ['admin-charts'],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE_URL}/admin/charts`);
      return response.data;
    },
    refetchInterval: 10000 // تحديث كل 10 ثواني
  });

  // جلب الأنشطة
  const { data: activitiesData, isLoading: activitiesLoading } = useQuery({
    queryKey: ['admin-activities'],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE_URL}/admin/activities`);
      return response.data;
    },
    refetchInterval: 3000 // تحديث كل 3 ثواني
  });

  // تحديث الإحصائيات
  useEffect(() => {
    if (statsData) {
      setStats(statsData);
    }
  }, [statsData]);

  // تحديث بيانات الرسوم البيانية
  useEffect(() => {
    if (chartsData) {
      setChartData(chartsData);
    }
  }, [chartsData]);

  // تحديث الأنشطة
  useEffect(() => {
    if (activitiesData) {
      setActivities(activitiesData);
    }
  }, [activitiesData]);

  // معالجات الأحداث
  const handleRefresh = useCallback(() => {
    // إعادة تحميل البيانات
    window.location.reload();
  }, []);

  const handleExport = useCallback(() => {
    // تصدير البيانات
    const data = {
      stats,
      charts: chartData,
      activities,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [stats, chartData, activities]);

  if (statsLoading || chartsLoading || activitiesLoading) {
    return <div style={styles.container}>جاري التحميل...</div>;
  }

  return (
    <div style={styles.container}>
      {/* رأس الصفحة */}
      <div style={styles.header}>
        <h1 style={styles.title}>لوحة التحكم الإدارية</h1>
        <div style={styles.headerActions}>
          <button onClick={handleRefresh} style={styles.button}>
            🔄 تحديث
          </button>
          <button onClick={handleExport} style={styles.button}>
            📥 تصدير
          </button>
        </div>
      </div>

      {/* العدادات الحية */}
      <div style={styles.countersGrid}>
        <LiveCounter
          label="إجمالي المستخدمين"
          value={stats.totalUsers}
          trend={stats.userTrend}
          color="#007AFF"
        />
        <LiveCounter
          label="المستخدمون النشطون"
          value={stats.activeUsers}
          trend={stats.userTrend}
          color="#34C759"
        />
        <LiveCounter
          label="إجمالي المنشورات"
          value={stats.totalPosts}
          trend={stats.postTrend}
          color="#FF9500"
        />
        <LiveCounter
          label="البلاغات"
          value={stats.totalReports}
          trend={stats.reportTrend}
          color="#FF3B30"
        />
      </div>

      {/* الرسوم البيانية */}
      <div style={styles.chartsGrid}>
        <SimpleChart
          data={chartData.users || []}
          title="نمو المستخدمين"
          type="line"
        />
        <SimpleChart
          data={chartData.posts || []}
          title="نشاط المنشورات"
          type="line"
        />
        <SimpleChart
          data={chartData.engagement || []}
          title="معدل التفاعل"
          type="line"
        />
      </div>

      {/* جدول الأنشطة */}
      <ActivityTable activities={activities} />
    </div>
  );
};

/**
 * تنسيق الوقت
 */
function formatTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;

  if (diff < 60000) return 'للتو';
  if (diff < 3600000) return `قبل ${Math.floor(diff / 60000)} دقيقة`;
  if (diff < 86400000) return `قبل ${Math.floor(diff / 3600000)} ساعة`;
  return date.toLocaleDateString('ar-SA');
}

/**
 * الأنماط
 */
const styles = {
  container: {
    padding: '20px',
    backgroundColor: '#f5f5f5',
    minHeight: '100vh'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px'
  },
  title: {
    margin: 0,
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#333'
  },
  headerActions: {
    display: 'flex',
    gap: '10px'
  },
  button: {
    padding: '10px 20px',
    backgroundColor: '#007AFF',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  },
  countersGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px',
    marginBottom: '30px'
  },
  counterCard: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    textAlign: 'center'
  },
  counterLabel: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '10px'
  },
  counterValue: {
    fontSize: '32px',
    fontWeight: 'bold',
    marginBottom: '10px'
  },
  counterTrend: {
    fontSize: '14px',
    fontWeight: '500'
  },
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '15px',
    marginBottom: '30px'
  },
  chartCard: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  chartTitle: {
    margin: '0 0 15px 0',
    fontSize: '16px',
    fontWeight: '600',
    color: '#333'
  },
  svg: {
    width: '100%',
    height: 'auto'
  },
  chartLabels: {
    display: 'flex',
    justifyContent: 'space-around',
    marginTop: '10px',
    fontSize: '12px',
    color: '#666'
  },
  chartLabel: {
    padding: '5px 10px'
  },
  tableCard: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    overflowX: 'auto'
  },
  tableTitle: {
    margin: '0 0 15px 0',
    fontSize: '16px',
    fontWeight: '600',
    color: '#333'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '12px',
    fontWeight: '500'
  }
};

export default EnhancedAdminDashboard;
