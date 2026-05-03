import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import KpiCard from '../../components/admin/KpiCard.jsx';
import { BarChart, DonutChart, LineChart } from '../../components/admin/Charts.jsx';
import Card from '../../components/ui/Card.jsx';
import { getAdminOverview } from '../../api/admin.js';
import socket from '../../api/socket.js';

export default function AdminDashboard() {
  const [overview, setOverview] = useState({ kpis: [], line_chart: [], bar_chart: [], pie_chart: [], recent_activity: [], alerts: [], meta: {} });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        const { data } = await getAdminOverview();
        if (active) setOverview(data);
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    const refreshEvents = ['admin:user_updated', 'admin:user_status_changed', 'admin:user_deleted', 'admin:post_created', 'admin:post_updated', 'admin:post_deleted', 'admin:posts_bulk_deleted', 'admin:settings_updated'];
    refreshEvents.forEach((eventName) => socket.on(eventName, load));

    return () => {
      active = false;
      refreshEvents.forEach((eventName) => socket.off(eventName, load));
    };
  }, []);

  return (
    <AdminLayout>
      <section className="dashboard-hero-grid">
        <Card className="hero-card admin-hero-card">
          <span className="badge">Enterprise Admin</span>
          <h2>لوحة تحكم موحدة للمستخدمين والمحتوى والإشعارات والتقارير</h2>
          <p>ربط مباشر مع FastAPI وSocket.IO، تحديثات لحظية، وصلاحيات متعددة جاهزة للتوسع.</p>
        </Card>
        <Card>
          <h3 className="section-title">حالة النظام</h3>
          <div className="status-list compact-grid">
            <div><strong>{overview.meta?.active_users || 0}</strong><span>مستخدم نشط</span></div>
            <div><strong>{overview.meta?.posts_count || 0}</strong><span>منشور</span></div>
            <div><strong>{overview.meta?.comments_count || 0}</strong><span>تعليق</span></div>
            <div><strong>{overview.meta?.messages_count || 0}</strong><span>رسالة</span></div>
          </div>
        </Card>
      </section>

      <section className="kpi-grid">
        {(loading ? Array.from({ length: 4 }, (_, index) => ({ label: '...', value: '...', delta: index + 1 })) : overview.kpis).map((item) => (
          <KpiCard key={item.key || item.label} item={item} />
        ))}
      </section>

      <section className="analytics-grid">
        <Card>
          <div className="card-head"><h3 className="section-title">Line Chart · النمو</h3></div>
          <LineChart data={overview.line_chart} />
        </Card>
        <Card>
          <div className="card-head"><h3 className="section-title">Bar Chart · الوحدات الأعلى نشاطاً</h3></div>
          <BarChart data={overview.bar_chart} />
        </Card>
        <Card>
          <div className="card-head"><h3 className="section-title">Pie Chart · توزيع الأدوار</h3></div>
          <DonutChart data={overview.pie_chart} />
        </Card>
      </section>

      <section className="two-column-grid">
        <Card>
          <div className="card-head"><h3 className="section-title">Recent Activity</h3></div>
          <div className="timeline-list">
            {overview.recent_activity.map((item) => (
              <div key={item.id} className="timeline-item">
                <span className="timeline-dot" />
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.description}</p>
                  <small>{new Date(item.created_at).toLocaleString('ar-EG')}</small>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <div className="card-head"><h3 className="section-title">Alerts</h3></div>
          <div className="alert-stack enhanced">
            {overview.alerts.map((item, index) => (
              <div key={`${item.title}-${index}`} className={`alert-card ${item.level}`}>
                <strong>{item.title}</strong>
                <p>{item.description}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </AdminLayout>
  );
}
