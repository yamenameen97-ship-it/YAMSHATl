import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import KpiCard from '../../components/admin/KpiCard.jsx';
import { BarChart, DonutChart, LineChart } from '../../components/admin/Charts.jsx';
import Card from '../../components/ui/Card.jsx';
import { getAdminOverview } from '../../api/admin.js';
import socket from '../../api/socket.js';

const overviewFallback = {
  kpis: [],
  line_chart: [],
  bar_chart: [],
  pie_chart: [],
  recent_activity: [],
  alerts: [],
  service_health: [],
  moderation_queue: [],
  platform_links: [],
  meta: {},
};

function statusText(status) {
  if (status === 'healthy' || status === 'linked') return 'سليم';
  if (status === 'warning') return 'يحتاج ضبط';
  if (status === 'critical') return 'حرج';
  return 'معلومة';
}

export default function AdminDashboard() {
  const [overview, setOverview] = useState(overviewFallback);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const { data } = await getAdminOverview();
      setOverview({ ...overviewFallback, ...data });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const guardedLoad = async () => {
      if (!active) return;
      await load();
    };

    guardedLoad();
    const refreshEvents = [
      'admin:user_updated',
      'admin:user_status_changed',
      'admin:user_deleted',
      'admin:post_created',
      'admin:post_updated',
      'admin:post_deleted',
      'admin:posts_bulk_deleted',
      'admin:settings_updated',
      'admin:notification',
    ];
    refreshEvents.forEach((eventName) => socket.on(eventName, guardedLoad));
    const timer = window.setInterval(guardedLoad, 30000);

    return () => {
      active = false;
      window.clearInterval(timer);
      refreshEvents.forEach((eventName) => socket.off(eventName, guardedLoad));
    };
  }, []);

  const generatedAt = useMemo(() => {
    if (!overview.meta?.generated_at) return 'الآن';
    return new Date(overview.meta.generated_at).toLocaleString('ar-EG');
  }, [overview.meta?.generated_at]);

  const serviceHealthyCount = (overview.service_health || []).filter((item) => item.status === 'healthy' || item.status === 'linked').length;

  return (
    <AdminLayout>
      <section className="dashboard-hero-grid">
        <Card className="hero-card admin-hero-card polished-hero-card">
          <div className="hero-card-topline">
            <span className="badge">Enterprise Admin</span>
            <span className="live-pill"><span className="status-dot live-dot" />مباشر الآن</span>
          </div>
          <h2>لوحة تحكم احترافية موحّدة للمراقبة، الإدارة، والإشعارات اللحظية</h2>
          <p>تم تجهيز مركز تحكم يربط الويب والموبايل والباك إند مع تحديثات حية، مؤشرات تشغيل دقيقة، ومداخل سريعة لإدارة المستخدمين والمحتوى والتقارير.</p>
          <div className="hero-actions-wrap">
            <Link className="btn btn-primary" to="/admin/users">إدارة المستخدمين</Link>
            <Link className="btn btn-secondary" to="/admin/content">إدارة المحتوى</Link>
            <Link className="btn btn-secondary" to="/admin/reports">عرض التقارير</Link>
            <Link className="btn btn-secondary" to="/admin/notifications">مركز الإشعارات</Link>
          </div>
        </Card>
        <Card className="spotlight-card">
          <div className="card-head split">
            <h3 className="section-title">حالة التشغيل</h3>
            <button type="button" className="ghost-btn" onClick={load}>تحديث</button>
          </div>
          <div className="status-list compact-grid">
            <div><strong>{overview.meta?.active_users || 0}</strong><span>مستخدم نشط</span></div>
            <div><strong>{overview.meta?.today_posts || 0}</strong><span>منشورات اليوم</span></div>
            <div><strong>{overview.meta?.today_comments || 0}</strong><span>تعليقات اليوم</span></div>
            <div><strong>{overview.meta?.today_messages || 0}</strong><span>رسائل اليوم</span></div>
          </div>
          <div className="dashboard-mini-summary">
            <div>
              <strong>{serviceHealthyCount}/{overview.service_health?.length || 0}</strong>
              <span>خدمات سليمة</span>
            </div>
            <div>
              <strong>{overview.meta?.admins_online || 0}</strong>
              <span>أدمن متصل</span>
            </div>
            <div>
              <strong>{generatedAt}</strong>
              <span>آخر مزامنة</span>
            </div>
          </div>
        </Card>
      </section>

      <section className="kpi-grid">
        {(loading ? Array.from({ length: 4 }, (_, index) => ({ label: '...', value: '...', delta: index + 1, trend_label: 'جارٍ التحميل' })) : overview.kpis).map((item) => (
          <KpiCard key={item.key || item.label} item={item} />
        ))}
      </section>

      <Card className="section-card-block">
        <div className="card-head split">
          <div>
            <h3 className="section-title">صحة الخدمات والربط</h3>
            <p className="muted no-margin">مؤشرات مباشرة على حالة قاعدة البيانات، الربط اللحظي، الموبايل، الويب، والوسائط.</p>
          </div>
          <span className="badge">{serviceHealthyCount} خدمات سليمة</span>
        </div>
        <div className="service-health-grid">
          {(overview.service_health || []).map((item) => (
            <div key={item.key} className={`service-status-card ${item.status}`}>
              <div className="service-status-head">
                <strong>{item.label}</strong>
                <span className={`status-pill ${item.status === 'healthy' || item.status === 'linked' ? 'active' : item.status === 'critical' ? 'banned' : 'warning-soft'}`}>{statusText(item.status)}</span>
              </div>
              <div className="service-status-value">{item.value}</div>
              <p>{item.description}</p>
            </div>
          ))}
        </div>
      </Card>

      <section className="analytics-grid">
        <Card>
          <div className="card-head"><h3 className="section-title">نمو التسجيلات</h3></div>
          <LineChart data={overview.line_chart} />
        </Card>
        <Card>
          <div className="card-head"><h3 className="section-title">أعلى الوحدات نشاطاً</h3></div>
          <BarChart data={overview.bar_chart} />
        </Card>
        <Card>
          <div className="card-head"><h3 className="section-title">توزيع الأدوار</h3></div>
          <DonutChart data={overview.pie_chart} />
        </Card>
      </section>

      <Card className="section-card-block">
        <div className="card-head split">
          <div>
            <h3 className="section-title">صف المتابعة والمراقبة</h3>
            <p className="muted no-margin">ملخص فوري لما يحتاج تدخل أو مراقبة من داخل المنصة.</p>
          </div>
          <Link className="btn btn-secondary" to="/admin/notifications">فتح المركز</Link>
        </div>
        <div className="queue-grid">
          {(overview.moderation_queue || []).map((item) => (
            <div key={item.key} className="queue-card">
              <span className="queue-label">{item.label}</span>
              <strong>{item.value}</strong>
              <p>{item.description}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="section-card-block">
        <div className="card-head split">
          <div>
            <h3 className="section-title">خريطة الربط بين الأنظمة</h3>
            <p className="muted no-margin">تأكد الربط بين لوحة الأدمن والويب والموبايل والباك إند من نفس شاشة المتابعة.</p>
          </div>
        </div>
        <div className="integration-grid">
          {(overview.platform_links || []).map((item) => (
            <div key={item.key} className={`integration-card ${item.status}`}>
              <div className="integration-label-row">
                <strong>{item.label}</strong>
                <span className="glass-chip">{item.status === 'linked' ? 'مرتبط' : 'مراجعة'}</span>
              </div>
              <div className="integration-value">{item.value}</div>
              <p>{item.description}</p>
            </div>
          ))}
        </div>
      </Card>

      <section className="two-column-grid">
        <Card>
          <div className="card-head"><h3 className="section-title">السجل التشغيلي</h3></div>
          <div className="timeline-list">
            {(overview.recent_activity || []).map((item) => (
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
          <div className="card-head"><h3 className="section-title">التنبيهات والتوصيات</h3></div>
          <div className="alert-stack enhanced">
            {(overview.alerts || []).map((item, index) => (
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
