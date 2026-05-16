/**
 * مكون لوحة التحكم المحسّن
 * يوفر:
 * - رسوم بيانية حية (Live Charts)
 * - عناصر تحليلات (Analytics Widgets)
 * - عدادات الوقت الفعلي (Realtime Counters)
 * - رسوم بيانية للنشاط (Activity Graphs)
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useOptimizedSocket } from '../hooks/useBatteryOptimization';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const AdminDashboardEnhanced = () => {
  const [dashboardData, setDashboardData] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalPosts: 0,
    totalReports: 0,
    systemHealth: 100,
    serverLoad: 0,
    databaseStatus: 'healthy',
    apiResponseTime: 0
  });

  const [chartData, setChartData] = useState({
    userGrowth: [],
    postActivity: [],
    reportTrends: [],
    systemMetrics: []
  });

  const [realtimeUpdates, setRealtimeUpdates] = useState({
    newUsers: 0,
    newPosts: 0,
    newReports: 0,
    activeConnections: 0
  });

  const { updateInterval } = useOptimizedSocket('admin-dashboard', 1000);

  /**
   * جلب بيانات لوحة التحكم
   */
  const fetchDashboardData = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/dashboard`);
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  }, []);

  /**
   * جلب بيانات الرسوم البيانية
   */
  const fetchChartData = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/analytics`);
      setChartData(response.data);
    } catch (error) {
      console.error('Error fetching chart data:', error);
    }
  }, []);

  /**
   * تحديث البيانات الفعلية
   */
  useEffect(() => {
    fetchDashboardData();
    fetchChartData();

    const interval = setInterval(() => {
      fetchDashboardData();
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchDashboardData, fetchChartData]);

  /**
   * محاكاة التحديثات الفعلية
   */
  useEffect(() => {
    const simulateRealtimeUpdates = () => {
      setRealtimeUpdates(prev => ({
        newUsers: Math.floor(Math.random() * 10),
        newPosts: Math.floor(Math.random() * 50),
        newReports: Math.floor(Math.random() * 5),
        activeConnections: Math.floor(Math.random() * 1000) + 500
      }));
    };

    const interval = setInterval(simulateRealtimeUpdates, 2000);
    return () => clearInterval(interval);
  }, []);

  /**
   * حساب النسب المئوية
   */
  const stats = useMemo(() => ({
    userGrowthPercent: dashboardData.totalUsers > 0 ? Math.round((realtimeUpdates.newUsers / dashboardData.totalUsers) * 100) : 0,
    postActivityPercent: dashboardData.totalPosts > 0 ? Math.round((realtimeUpdates.newPosts / dashboardData.totalPosts) * 100) : 0,
    reportTrendPercent: dashboardData.totalReports > 0 ? Math.round((realtimeUpdates.newReports / dashboardData.totalReports) * 100) : 0
  }), [dashboardData, realtimeUpdates]);

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>لوحة التحكم</h1>

      {/* الإحصائيات الرئيسية */}
      <div style={styles.statsGrid}>
        {/* إجمالي المستخدمين */}
        <div style={styles.statCard}>
          <div style={styles.statHeader}>
            <h3 style={styles.statTitle}>إجمالي المستخدمين</h3>
            <span style={styles.statIcon}>👥</span>
          </div>
          <div style={styles.statValue}>{dashboardData.totalUsers.toLocaleString()}</div>
          <div style={{...styles.statChange, color: realtimeUpdates.newUsers > 0 ? '#4CAF50' : '#999'}}>
            +{realtimeUpdates.newUsers} اليوم
          </div>
          <div style={styles.progressBar}>
            <div style={{...styles.progressFill, width: `${Math.min(stats.userGrowthPercent, 100)}%`}} />
          </div>
        </div>

        {/* المنشورات النشطة */}
        <div style={styles.statCard}>
          <div style={styles.statHeader}>
            <h3 style={styles.statTitle}>المنشورات النشطة</h3>
            <span style={styles.statIcon}>📝</span>
          </div>
          <div style={styles.statValue}>{dashboardData.totalPosts.toLocaleString()}</div>
          <div style={{...styles.statChange, color: realtimeUpdates.newPosts > 0 ? '#2196F3' : '#999'}}>
            +{realtimeUpdates.newPosts} اليوم
          </div>
          <div style={styles.progressBar}>
            <div style={{...styles.progressFill, width: `${Math.min(stats.postActivityPercent, 100)}%`, backgroundColor: '#2196F3'}} />
          </div>
        </div>

        {/* البلاغات */}
        <div style={styles.statCard}>
          <div style={styles.statHeader}>
            <h3 style={styles.statTitle}>البلاغات</h3>
            <span style={styles.statIcon}>🚩</span>
          </div>
          <div style={styles.statValue}>{dashboardData.totalReports.toLocaleString()}</div>
          <div style={{...styles.statChange, color: realtimeUpdates.newReports > 0 ? '#FF9800' : '#999'}}>
            +{realtimeUpdates.newReports} اليوم
          </div>
          <div style={styles.progressBar}>
            <div style={{...styles.progressFill, width: `${Math.min(stats.reportTrendPercent, 100)}%`, backgroundColor: '#FF9800'}} />
          </div>
        </div>

        {/* المستخدمون النشطون */}
        <div style={styles.statCard}>
          <div style={styles.statHeader}>
            <h3 style={styles.statTitle}>المستخدمون النشطون الآن</h3>
            <span style={styles.statIcon}>⚡</span>
          </div>
          <div style={styles.statValue}>{realtimeUpdates.activeConnections.toLocaleString()}</div>
          <div style={{...styles.statChange, color: '#4CAF50'}}>
            متصلون الآن
          </div>
          <div style={styles.progressBar}>
            <div style={{...styles.progressFill, width: `${Math.min((realtimeUpdates.activeConnections / 2000) * 100, 100)}%`, backgroundColor: '#4CAF50'}} />
          </div>
        </div>
      </div>

      {/* صحة النظام */}
      <div style={styles.systemHealthSection}>
        <h2 style={styles.sectionTitle}>صحة النظام</h2>
        <div style={styles.healthGrid}>
          {/* صحة النظام العامة */}
          <div style={styles.healthCard}>
            <div style={styles.healthLabel}>صحة النظام</div>
            <div style={styles.healthValue}>{dashboardData.systemHealth}%</div>
            <div style={{...styles.healthBar, backgroundColor: getHealthColor(dashboardData.systemHealth)}}>
              <div style={{...styles.healthBarFill, width: `${dashboardData.systemHealth}%`}} />
            </div>
          </div>

          {/* حمل الخادم */}
          <div style={styles.healthCard}>
            <div style={styles.healthLabel}>حمل الخادم</div>
            <div style={styles.healthValue}>{dashboardData.serverLoad}%</div>
            <div style={{...styles.healthBar, backgroundColor: getLoadColor(dashboardData.serverLoad)}}>
              <div style={{...styles.healthBarFill, width: `${dashboardData.serverLoad}%`}} />
            </div>
          </div>

          {/* حالة قاعدة البيانات */}
          <div style={styles.healthCard}>
            <div style={styles.healthLabel}>قاعدة البيانات</div>
            <div style={{...styles.healthValue, color: getStatusColor(dashboardData.databaseStatus)}}>
              {getDatabaseStatusText(dashboardData.databaseStatus)}
            </div>
            <div style={{...styles.statusIndicator, backgroundColor: getStatusColor(dashboardData.databaseStatus)}} />
          </div>

          {/* وقت استجابة API */}
          <div style={styles.healthCard}>
            <div style={styles.healthLabel}>وقت الاستجابة</div>
            <div style={styles.healthValue}>{dashboardData.apiResponseTime}ms</div>
            <div style={{...styles.healthBar, backgroundColor: getResponseTimeColor(dashboardData.apiResponseTime)}}>
              <div style={{...styles.healthBarFill, width: `${Math.min((dashboardData.apiResponseTime / 1000) * 100, 100)}%`}} />
            </div>
          </div>
        </div>
      </div>

      {/* الرسوم البيانية */}
      <div style={styles.chartsSection}>
        <h2 style={styles.sectionTitle}>التحليلات</h2>
        <div style={styles.chartsGrid}>
          {/* رسم بياني نمو المستخدمين */}
          <div style={styles.chartCard}>
            <h3 style={styles.chartTitle}>نمو المستخدمين</h3>
            <SimpleLineChart data={chartData.userGrowth} />
          </div>

          {/* رسم بياني نشاط المنشورات */}
          <div style={styles.chartCard}>
            <h3 style={styles.chartTitle}>نشاط المنشورات</h3>
            <SimpleBarChart data={chartData.postActivity} />
          </div>

          {/* رسم بياني اتجاهات البلاغات */}
          <div style={styles.chartCard}>
            <h3 style={styles.chartTitle}>اتجاهات البلاغات</h3>
            <SimplePieChart data={chartData.reportTrends} />
          </div>

          {/* رسم بياني مقاييس النظام */}
          <div style={styles.chartCard}>
            <h3 style={styles.chartTitle}>مقاييس النظام</h3>
            <SimpleAreaChart data={chartData.systemMetrics} />
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * رسم بياني خطي بسيط
 */
const SimpleLineChart = ({ data }) => {
  return (
    <div style={styles.chart}>
      {data.length > 0 ? (
        <svg width="100%" height="200" viewBox="0 0 400 200" style={styles.svg}>
          <polyline
            points={data.map((d, i) => `${(i / data.length) * 400},${200 - (d.value / Math.max(...data.map(x => x.value))) * 180}`).join(' ')}
            fill="none"
            stroke="#2196F3"
            strokeWidth="2"
          />
          {data.map((d, i) => (
            <circle
              key={i}
              cx={(i / data.length) * 400}
              cy={200 - (d.value / Math.max(...data.map(x => x.value))) * 180}
              r="3"
              fill="#2196F3"
            />
          ))}
        </svg>
      ) : (
        <div style={styles.emptyChart}>لا توجد بيانات</div>
      )}
    </div>
  );
};

/**
 * رسم بياني أعمدة بسيط
 */
const SimpleBarChart = ({ data }) => {
  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <div style={styles.chart}>
      {data.length > 0 ? (
        <div style={styles.barChartContainer}>
          {data.map((d, i) => (
            <div key={i} style={styles.barItem}>
              <div style={{...styles.bar, height: `${(d.value / maxValue) * 150}px`}} />
              <div style={styles.barLabel}>{d.label}</div>
            </div>
          ))}
        </div>
      ) : (
        <div style={styles.emptyChart}>لا توجد بيانات</div>
      )}
    </div>
  );
};

/**
 * رسم بياني دائري بسيط
 */
const SimplePieChart = ({ data }) => {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div style={styles.chart}>
      {data.length > 0 ? (
        <div style={styles.pieChartContainer}>
          {data.map((d, i) => (
            <div
              key={i}
              style={{
                ...styles.piePiece,
                backgroundColor: getPieColor(i),
                width: `${(d.value / total) * 100}%`
              }}
              title={`${d.label}: ${d.value}`}
            />
          ))}
        </div>
      ) : (
        <div style={styles.emptyChart}>لا توجد بيانات</div>
      )}
    </div>
  );
};

/**
 * رسم بياني مساحة بسيط
 */
const SimpleAreaChart = ({ data }) => {
  return (
    <div style={styles.chart}>
      {data.length > 0 ? (
        <svg width="100%" height="200" viewBox="0 0 400 200" style={styles.svg}>
          <defs>
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#4CAF50" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#4CAF50" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon
            points={`0,200 ${data.map((d, i) => `${(i / data.length) * 400},${200 - (d.value / Math.max(...data.map(x => x.value))) * 180}`).join(' ')} 400,200`}
            fill="url(#areaGradient)"
          />
          <polyline
            points={data.map((d, i) => `${(i / data.length) * 400},${200 - (d.value / Math.max(...data.map(x => x.value))) * 180}`).join(' ')}
            fill="none"
            stroke="#4CAF50"
            strokeWidth="2"
          />
        </svg>
      ) : (
        <div style={styles.emptyChart}>لا توجد بيانات</div>
      )}
    </div>
  );
};

/**
 * دوال مساعدة
 */
function getHealthColor(health) {
  if (health >= 80) return '#4CAF50';
  if (health >= 50) return '#FF9800';
  return '#F44336';
}

function getLoadColor(load) {
  if (load <= 50) return '#4CAF50';
  if (load <= 75) return '#FF9800';
  return '#F44336';
}

function getStatusColor(status) {
  if (status === 'healthy') return '#4CAF50';
  if (status === 'warning') return '#FF9800';
  return '#F44336';
}

function getDatabaseStatusText(status) {
  const statusMap = {
    'healthy': 'سليمة ✓',
    'warning': 'تحذير ⚠️',
    'error': 'خطأ ✗'
  };
  return statusMap[status] || status;
}

function getResponseTimeColor(time) {
  if (time <= 100) return '#4CAF50';
  if (time <= 300) return '#FF9800';
  return '#F44336';
}

function getPieColor(index) {
  const colors = ['#2196F3', '#4CAF50', '#FF9800', '#F44336', '#9C27B0', '#00BCD4'];
  return colors[index % colors.length];
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
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    marginBottom: '20px',
    color: '#333'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '30px'
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s, box-shadow 0.2s',
    cursor: 'pointer'
  },
  statHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px'
  },
  statTitle: {
    margin: 0,
    fontSize: '14px',
    color: '#666'
  },
  statIcon: {
    fontSize: '24px'
  },
  statValue: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '10px'
  },
  statChange: {
    fontSize: '12px',
    marginBottom: '10px'
  },
  progressBar: {
    height: '4px',
    backgroundColor: '#eee',
    borderRadius: '2px',
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    transition: 'width 0.3s ease'
  },
  systemHealthSection: {
    marginBottom: '30px'
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '15px',
    color: '#333'
  },
  healthGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px'
  },
  healthCard: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '15px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  healthLabel: {
    fontSize: '12px',
    color: '#666',
    marginBottom: '5px'
  },
  healthValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '10px'
  },
  healthBar: {
    height: '6px',
    borderRadius: '3px',
    overflow: 'hidden'
  },
  healthBarFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    transition: 'width 0.3s ease'
  },
  statusIndicator: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    marginTop: '10px'
  },
  chartsSection: {
    marginBottom: '30px'
  },
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '20px'
  },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  chartTitle: {
    margin: '0 0 15px 0',
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#333'
  },
  chart: {
    width: '100%',
    height: '200px'
  },
  svg: {
    display: 'block'
  },
  emptyChart: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#999'
  },
  barChartContainer: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: '200px',
    gap: '10px'
  },
  barItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flex: 1
  },
  bar: {
    width: '100%',
    backgroundColor: '#2196F3',
    borderRadius: '4px 4px 0 0',
    transition: 'background-color 0.2s'
  },
  barLabel: {
    fontSize: '10px',
    marginTop: '5px',
    color: '#666'
  },
  pieChartContainer: {
    display: 'flex',
    height: '200px',
    borderRadius: '4px',
    overflow: 'hidden'
  },
  piePiece: {
    transition: 'opacity 0.2s'
  }
};

export default AdminDashboardEnhanced;
