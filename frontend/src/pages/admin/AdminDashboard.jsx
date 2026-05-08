import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import KpiCard from '../../components/admin/KpiCard.jsx';
import { BarChart, DonutChart, LineChart } from '../../components/admin/Charts.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import EmptyState from '../../components/feedback/EmptyState.jsx';
import ErrorState from '../../components/feedback/ErrorState.jsx';
import { AdminOverviewSkeleton } from '../../components/feedback/Skeleton.jsx';
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
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await getAdminOverview();
      setOverview({ ...overviewFallback, ...data });
    } catch (err) {
      setError(err?.response?.data?.detail || 'تعذر تحميل بيانات لوحة الأدمن.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    let timer = null;
    const guardedLoad = async () => {
      if (!active) return;
      await load();
    };
    const stopPolling = () => {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    };
    const startPolling = () => {
      if (timer || socket.connected) return;
      timer = window.setInterval(guardedLoad, 30000);
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
      'admin:live_updated',
    ];
    refreshEvents.forEach((eventName) => socket.on(eventName, guardedLoad));
    socket.on('connect', guardedLoad);
    socket.on('connect', stopPolling);
    socket.on('disconnect', startPolling);
    if (!socket.connected) startPolling();

    return () => {
      active = false;
      stopPolling();
      refreshEvents.forEach((eventName) => socket.off(eventName, guardedLoad));
      socket.off('connect', guardedLoad);
      socket.off('connect', stopPolling);
      socket.off('disconnect', startPolling);
    };
  }, []);

  const generatedAt = useMemo(() => {
    if (!overview.meta?.generated_at) return 'الآن';
    return new Date(overview.meta.generated_at).toLocaleString('ar-EG');
  }, [overview.meta?.generated_at]);

  const serviceHealthyCount = (overview.service_health || []).filter((item) => item.status === 'healthy' || item.status === 'linked').length;
  const hasOverviewData = Boolean(
    overview.kpis.length || overview.service_health.length || overview.alerts.length || overview.recent_activity.length || overview.platform_links.length
  );

  const advancedAnalytics = overview.meta?.advanced_analytics || [];
  const realtimeMonitoring = overview.meta?.realtime_monitoring || [];
  const revenueDashboard = overview.meta?.revenue_dashboard || {};
  const reportManagement = overview.meta?.report_management || {};
  const contentQueue = overview.meta?.content_queue || [];

  if (loading && !hasOverviewData) {
    return (
      <AdminLayout>
        <AdminOverviewSkeleton />
      </AdminLayout>
    );
  }

  if (error && !hasOverviewData) {
    return (
      <AdminLayout>
        <ErrorState title="تعذر تحميل لوحة التحكم" description={error} onRetry={load} />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {error ? <div className="alert error">{error}</div> : null}

      <section className="dashboard-hero-grid">
        <Card className="hero-card admin-hero-card polished-hero-card">
          <div className="hero-card-topline">
            <span className="badge">Enterprise Admin</span>
            <span className="live-pill"><span className="status-dot live-dot" />مباشر الآن</span>
          </div>
          <h2>لوحة تحكم موحدة فيها Audit Logs و Revenue Dashboard و Realtime Monitoring و Report Management</h2>
          <p>أضفت للمشروع لمسة إبداعية عملية: متابعة لحظية، مراقبة إساءة الاستخدام، صف محتوى جاهز للمراجعة، وتحليلات أعمق تربط الويب والموبايل والباك إند.</p>
          <div className="hero-actions-wrap">
            <Link className="btn btn-primary" to="/admin/users">إدارة المستخدمين</Link>
            <Link className="btn btn-secondary" to="/admin/content">إدارة المحتوى</Link>
            <Link className="btn btn-secondary" to="/admin/reports">Report Management</Link>
            <Link className="btn btn-secondary" to="/admin/notifications">Notifications Center</Link>
          </div>
        </Card>
        <Card className="spotlight-card">
          <div className="card-head split">
            <h3 className="section-title">حالة التشغيل</h3>
            <Button variant="secondary" onClick={load}>تحديث</Button>
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
        {(overview.kpis || []).length ? (overview.kpis || []).map((item) => (
          <KpiCard key={item.key || item.label} item={item} />
        )) : Array.from({ length: 4 }, (_, index) => (
          <KpiCard key={`placeholder-${index}`} item={{ label: 'قيد التحميل', value: '—', delta: index + 1, trend_label: 'بانتظار البيانات' }} />
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
        {(overview.service_health || []).length ? (
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
        ) : (
          <EmptyState icon="🧩" title="لا توجد مؤشرات خدمات حالياً" description="بمجرد وصول بيانات الصحة والربط هتظهر هنا تلقائياً." actionLabel="إعادة التحميل" onAction={load} />
        )}
      </Card>

      <section className="analytics-grid">
        <Card>
          <div className="card-head"><h3 className="section-title">نمو التسجيلات</h3></div>
          {(overview.line_chart || []).length ? <LineChart data={overview.line_chart} /> : <EmptyState icon="📈" title="لا توجد بيانات للرسم" description="بانتظار نقاط كافية لعرض خط النمو." />}
        </Card>
        <Card>
          <div className="card-head"><h3 className="section-title">أعلى الوحدات نشاطاً</h3></div>
          {(overview.bar_chart || []).length ? <BarChart data={overview.bar_chart} /> : <EmptyState icon="📊" title="لا توجد بيانات كافية" description="هيظهر الرسم أول ما تتوفر بيانات النشاط." />}
        </Card>
        <Card>
          <div className="card-head"><h3 className="section-title">توزيع الأدوار</h3></div>
          {(overview.pie_chart || []).length ? <DonutChart data={overview.pie_chart} /> : <EmptyState icon="🧠" title="لا يوجد توزيع أدوار بعد" description="هيظهر التوزيع بمجرد وصول إحصائيات المستخدمين." />}
        </Card>
      </section>

      <section className="two-column-grid">
        <Card className="section-card-block">
          <div className="card-head split">
            <div>
              <h3 className="section-title">Advanced Analytics</h3>
              <p className="muted no-margin">قراءة أعمق للحمل والتفاعل والكشف عن المحتوى المحتاج تدخل.</p>
            </div>
            <span className="badge">تحليلات متقدمة</span>
          </div>
          {advancedAnalytics.length ? (
            <div className="queue-grid compact-cards">
              {advancedAnalytics.map((item) => (
                <div key={item.key} className="queue-card compact">
                  <span className="queue-label">{item.label}</span>
                  <strong>{item.value}</strong>
                  <p>{item.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon="🧮" title="لا توجد تحليلات متقدمة حالياً" description="ستظهر هنا بمجرد وصول بيانات كافية من النظام." />
          )}
        </Card>

        <Card className="section-card-block">
          <div className="card-head split">
            <div>
              <h3 className="section-title">Revenue Dashboard</h3>
              <p className="muted no-margin">ملخص أرصدة العملات، إجمالي الإنفاق، وتقدير بسيط للدخل.</p>
            </div>
            <span className="badge">Coins Economy</span>
          </div>
          {Object.keys(revenueDashboard).length ? (
            <div className="status-list compact-grid">
              <div><strong>{revenueDashboard.coins_earned || 0}</strong><span>Coins Earned</span></div>
              <div><strong>{revenueDashboard.coins_spent || 0}</strong><span>Coins Spent</span></div>
              <div><strong>{revenueDashboard.coins_balance || 0}</strong><span>Wallet Balance</span></div>
              <div><strong>${(revenueDashboard.estimated_revenue || 0).toFixed(2)}</strong><span>Estimated Revenue</span></div>
            </div>
          ) : (
            <EmptyState icon="💰" title="لا توجد بيانات مالية بعد" description="عند توفر بيانات المحافظ ستظهر هنا لوحة الإيرادات." />
          )}
        </Card>
      </section>

      <section className="two-column-grid">
        <Card className="section-card-block">
          <div className="card-head split">
            <div>
              <h3 className="section-title">Realtime Monitoring</h3>
              <p className="muted no-margin">مراقبة مباشرة لعدد الأدمن المتصل، غرف البث، والرسائل اللحظية.</p>
            </div>
            <Link className="btn btn-secondary" to="/admin/live">فتح البث</Link>
          </div>
          {realtimeMonitoring.length ? (
            <div className="queue-grid compact-cards">
              {realtimeMonitoring.map((item) => (
                <div key={item.key} className="queue-card compact">
                  <span className="queue-label">{item.label}</span>
                  <strong>{item.value}</strong>
                  <p>{item.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon="📡" title="لا توجد بيانات مراقبة حالياً" description="التحديثات اللحظية ستظهر هنا تلقائياً." />
          )}
        </Card>

        <Card className="section-card-block">
          <div className="card-head split">
            <div>
              <h3 className="section-title">Report Management</h3>
              <p className="muted no-margin">تفصيل User Reports و Stream Reports والإشعارات المفتوحة.</p>
            </div>
            <Link className="btn btn-secondary" to="/admin/reports">فتح التقارير</Link>
          </div>
          {Object.keys(reportManagement).length ? (
            <div className="status-list compact-grid">
              <div><strong>{reportManagement.open_reports || 0}</strong><span>Open Reports</span></div>
              <div><strong>{reportManagement.user_reports || 0}</strong><span>User Reports</span></div>
              <div><strong>{reportManagement.stream_reports || 0}</strong><span>Stream Reports</span></div>
              <div><strong>{reportManagement.shadow_banned_users || 0}</strong><span>Shadow Ban</span></div>
              <div><strong>{reportManagement.unread_notifications || 0}</strong><span>Unread Alerts</span></div>
            </div>
          ) : (
            <EmptyState icon="🚨" title="لا توجد تقارير مفتوحة حالياً" description="بمجرد وصول بلاغات جديدة سيظهر هذا القسم فوراً." />
          )}
        </Card>
      </section>

      <Card className="section-card-block">
        <div className="card-head split">
          <div>
            <h3 className="section-title">Content Queue & Moderation</h3>
            <p className="muted no-margin">أهم المنشورات والمهام التي تحتاج مراجعة، مع بطاقات صف المراقبة.</p>
          </div>
          <Link className="btn btn-secondary" to="/admin/content">إدارة المحتوى</Link>
        </div>
        {(overview.moderation_queue || []).length ? (
          <div className="queue-grid">
            {(overview.moderation_queue || []).map((item) => (
              <div key={item.key} className="queue-card">
                <span className="queue-label">{item.label}</span>
                <strong>{item.value}</strong>
                <p>{item.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon="🛡️" title="لا توجد عناصر مراقبة حالياً" description="الصف ده هيمتلئ تلقائياً بأي عناصر محتاجة تدخل إداري." />
        )}
        {contentQueue.length ? (
          <div className="queue-grid compact-cards" style={{ marginTop: 18 }}>
            {contentQueue.map((item) => (
              <div key={item.key} className="queue-card compact">
                <span className="queue-label">{item.title}</span>
                <strong>{new Date(item.meta).toLocaleString('ar-EG')}</strong>
                <p>{item.description}</p>
              </div>
            ))}
          </div>
        ) : null}
      </Card>

      <section className="two-column-grid">
        <Card className="section-card-block">
          <div className="card-head split">
            <div>
              <h3 className="section-title">Audit Logs / Admin Activity Tracking</h3>
              <p className="muted no-margin">آخر الأنشطة الإدارية وسجل العمليات المهمة داخل النظام.</p>
            </div>
            <Link className="btn btn-secondary" to="/admin/reports">عرض السجل</Link>
          </div>
          {(overview.recent_activity || []).length ? (
            <div className="queue-grid compact-cards">
              {(overview.recent_activity || []).map((item) => (
                <div key={item.id} className="queue-card compact">
                  <span className="queue-label">{item.title}</span>
                  <strong>{item.created_at ? new Date(item.created_at).toLocaleString('ar-EG') : 'الآن'}</strong>
                  <p>{item.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon="🧾" title="لا توجد سجلات إدارية بعد" description="أول ما أي أكشن إداري يحصل هيبان هنا فوراً." />
          )}
        </Card>

        <Card className="section-card-block">
          <div className="card-head split">
            <div>
              <h3 className="section-title">خريطة الربط والتنبيهات</h3>
              <p className="muted no-margin">روابط الأنظمة والتنبيهات الحرجة من نفس لوحة المتابعة.</p>
            </div>
          </div>
          {(overview.platform_links || []).length ? (
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
          ) : (
            <EmptyState icon="🔗" title="لا توجد روابط منصات حالياً" description="سيظهر الربط هنا عند توفر بيانات النشر والبيئة." />
          )}
          {(overview.alerts || []).length ? (
            <div className="queue-grid compact-cards" style={{ marginTop: 18 }}>
              {(overview.alerts || []).map((item, index) => (
                <div key={`${item.title}-${index}`} className="queue-card compact">
                  <span className="queue-label">{item.title}</span>
                  <strong>{item.level}</strong>
                  <p>{item.description}</p>
                </div>
              ))}
            </div>
          ) : null}
        </Card>
      </section>
    </AdminLayout>
  );
}
