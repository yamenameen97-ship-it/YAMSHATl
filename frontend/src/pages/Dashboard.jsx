import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import { DashboardSkeleton } from '../components/feedback/Skeleton.jsx';
import { useAppStore } from '../store/appStore.js';
import { getStoredUser } from '../utils/auth.js';

// Mock Chart Component for Realtime visualization
const RealtimeChart = ({ data, color = '#3b82f6', label }) => {
  const max = Math.max(...data, 1);
  return (
    <div className="realtime-chart-container">
      <div className="chart-label">{label}</div>
      <div className="chart-bars">
        {data.map((v, i) => (
          <div 
            key={i} 
            className="chart-bar" 
            style={{ 
              height: `${(v / max) * 100}%`, 
              backgroundColor: color,
              transition: 'height 0.3s ease'
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    onlineUsers: Array(20).fill(0).map(() => Math.floor(Math.random() * 100 + 500)),
    postActivity: Array(20).fill(0).map(() => Math.floor(Math.random() * 50 + 100)),
    systemLoad: 24,
    storageUsed: 65,
  });
  
  const user = getStoredUser();
  const language = useAppStore((state) => state.language);
  const isOnline = useAppStore((state) => state.isOnline);

  // Deep Analytics State
  const analytics = useMemo(() => ({
    topPosts: [
      { id: 1, title: 'تحديث يمشات الجديد', engagement: '98%', reach: '12.5k' },
      { id: 2, title: 'كيف تستخدم الذكاء الاصطناعي', engagement: '85%', reach: '8.2k' },
    ],
    userGrowth: '+15% هذا الأسبوع',
    avgSession: '12m 45s',
  }), []);

  // Realtime Update Simulation
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        onlineUsers: [...prev.onlineUsers.slice(1), Math.floor(Math.random() * 100 + 500)],
        postActivity: [...prev.postActivity.slice(1), Math.floor(Math.random() * 50 + 100)],
        systemLoad: Math.min(100, Math.max(10, prev.systemLoad + (Math.random() * 10 - 5))),
      }));
    }, 2000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  if (loading) return <MainLayout><DashboardSkeleton /></MainLayout>;

  return (
    <MainLayout>
      <section className="dashboard-grid">
        {/* Header Widget */}
        <Card className="welcome-widget">
          <div className="welcome-flex">
            <div className="user-info">
              <h2>أهلاً بك، {user?.username || 'مستخدم يمشات'} 👋</h2>
              <p className="muted">إليك نظرة سريعة على نشاط حسابك ومنصتك اليوم.</p>
            </div>
            <div className="status-badges">
              <span className={`status-pill ${isOnline ? 'online' : 'offline'}`}>
                {isOnline ? 'متصل بالخادم' : 'غير متصل'}
              </span>
              <span className="status-pill security">حماية مفعلة</span>
            </div>
          </div>
        </Card>

        {/* Realtime Monitoring Widgets */}
        <div className="monitoring-row">
          <Card className="metric-card">
            <RealtimeChart data={metrics.onlineUsers} label="المستخدمون المتصلون (الآن)" color="#10b981" />
            <div className="metric-footer">
              <span className="current-val">{metrics.onlineUsers[metrics.onlineUsers.length - 1]}</span>
              <span className="trend up">+2.4%</span>
            </div>
          </Card>
          
          <Card className="metric-card">
            <RealtimeChart data={metrics.postActivity} label="نشاط المنشورات / دقيقة" color="#6366f1" />
            <div className="metric-footer">
              <span className="current-val">{metrics.postActivity[metrics.postActivity.length - 1]}</span>
              <span className="trend up">+5.1%</span>
            </div>
          </Card>

          <Card className="system-health-card">
            <h4>صحة النظام</h4>
            <div className="health-grid">
              <div className="health-item">
                <label>حمولة المعالج</label>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${metrics.systemLoad}%`, backgroundColor: metrics.systemLoad > 80 ? '#ef4444' : '#3b82f6' }} />
                </div>
                <span>{Math.round(metrics.systemLoad)}%</span>
              </div>
              <div className="health-item">
                <label>مساحة التخزين</label>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${metrics.storageUsed}%` }} />
                </div>
                <span>{metrics.storageUsed}%</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Deep Analytics Section */}
        <div className="analytics-main-row">
          <Card className="analytics-details">
            <div className="card-header">
              <h3>تحليلات عميقة (Deep Analytics)</h3>
              <Button size="small" variant="secondary">تصدير التقرير</Button>
            </div>
            <div className="analytics-stats-grid">
              <div className="stat-box">
                <span className="stat-label">نمو المستخدمين</span>
                <span className="stat-value">{analytics.userGrowth}</span>
              </div>
              <div className="stat-box">
                <span className="stat-label">متوسط الجلسة</span>
                <span className="stat-value">{analytics.avgSession}</span>
              </div>
              <div className="stat-box">
                <span className="stat-label">معدل الارتداد</span>
                <span className="stat-value">24.2%</span>
              </div>
            </div>
            
            <div className="top-content">
              <h4>المحتوى الأكثر تفاعلاً</h4>
              <table className="analytics-table">
                <thead>
                  <tr>
                    <th>العنوان</th>
                    <th>التفاعل</th>
                    <th>الوصول</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.topPosts.map(post => (
                    <tr key={post.id}>
                      <td>{post.title}</td>
                      <td><span className="engagement-badge">{post.engagement}</span></td>
                      <td>{post.reach}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="quick-actions-sidebar">
            <h3>إجراءات سريعة</h3>
            <div className="actions-list">
              <Link to="/profile" className="action-item">👤 تعديل الملف الشخصي</Link>
              <Link to="/settings" className="action-item">⚙️ إعدادات الأمان</Link>
              <Link to="/notifications" className="action-item">🔔 إدارة التنبيهات</Link>
              <button className="action-item danger">🚪 تسجيل الخروج</button>
            </div>
          </Card>
        </div>
      </section>

      <style dangerouslySetInnerHTML={{ __html: `
        .dashboard-grid { display: flex; flex-direction: column; gap: 20px; padding: 20px; }
        .monitoring-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .realtime-chart-container { height: 120px; display: flex; flex-direction: column; gap: 10px; }
        .chart-bars { display: flex; align-items: flex-end; gap: 4px; height: 80px; }
        .chart-bar { flex: 1; border-radius: 2px 2px 0 0; }
        .metric-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 10px; }
        .current-val { font-size: 24px; font-weight: bold; }
        .trend.up { color: #10b981; font-size: 14px; }
        .health-grid { display: flex; flex-direction: column; gap: 15px; margin-top: 15px; }
        .progress-bar { height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden; margin: 5px 0; }
        .progress-fill { height: 100%; transition: width 0.5s ease; }
        .analytics-main-row { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; }
        .analytics-stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0; }
        .stat-box { background: #f9fafb; padding: 15px; border-radius: 8px; text-align: center; }
        .stat-label { display: block; font-size: 12px; color: #6b7280; margin-bottom: 5px; }
        .stat-value { font-size: 18px; font-weight: bold; color: #111827; }
        .analytics-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        .analytics-table th { text-align: right; padding: 10px; border-bottom: 2px solid #f3f4f6; color: #6b7280; font-size: 13px; }
        .analytics-table td { padding: 12px 10px; border-bottom: 1px solid #f3f4f6; }
        .engagement-badge { background: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 12px; font-size: 12px; }
        .actions-list { display: flex; flex-direction: column; gap: 10px; margin-top: 15px; }
        .action-item { padding: 12px; background: #f9fafb; border-radius: 8px; text-decoration: none; color: #374151; transition: all 0.2s; }
        .action-item:hover { background: #f3f4f6; transform: translateX(-5px); }
        .action-item.danger { color: #ef4444; border: none; text-align: right; cursor: pointer; }
        @media (max-width: 768px) { .analytics-main-row { grid-template-columns: 1fr; } }
      `}} />
    </MainLayout>
  );
}
